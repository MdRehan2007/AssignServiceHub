import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import UserTypes "../types/user";
import CommonTypes "../types/common";
import UsersLib "../lib/users";
import SkillTypes "../types/skill";
import SettingsTypes "../types/settings";
import Runtime "mo:core/Runtime";

mixin (
  usersMap : Map.Map<CommonTypes.UserId, UserTypes.User>,
  userSeq : { var next : Nat },
  settingsRef : { var current : SettingsTypes.SystemSettings },
  sessionTokens : Map.Map<Text, CommonTypes.UserId>
) {
  let HEAD_ADMIN_EMAIL : Text = "mhdrihan2007@gmail.com";

  func isHeadAdminCaller(caller : Principal) : Bool {
    switch (usersMap.get(caller)) {
      case (?u) u.email == HEAD_ADMIN_EMAIL or u.role == #databaseAdmin;
      case null false;
    };
  };

  func guardMaintenanceUsers(caller : Principal) {
    if (settingsRef.current.maintenanceMode and not isHeadAdminCaller(caller)) {
      Runtime.trap("Website is under maintenance. Please try again later.");
    };
  };

  public shared ({ caller }) func registerUser(
    name                : Text,
    email               : Text,
    role                : UserTypes.UserRole,
    collegeId           : ?Text,
    registeredCollegeId : ?Text
  ) : async CommonTypes.UserId {
    // Block non-HEAD_ADMIN registrations during maintenance (HEAD_ADMIN email bypasses)
    if (settingsRef.current.maintenanceMode and email != HEAD_ADMIN_EMAIL) {
      Runtime.trap("Website is under maintenance. Please try again later.");
    };
    switch (UsersLib.getUserByEmail(usersMap, email)) {
      case (?existing) {
        // Email already registered — re-link the caller's principal to the existing account
        // (handles the case where the same person logs in with a new Internet Identity)
        // Do NOT create a duplicate record; update the stored userId to the current caller.
        if (existing.userId != caller) {
          // Remove old principal mapping, re-insert under new principal
          usersMap.remove(existing.userId);
          let relinked : UserTypes.User = {
            existing with
            userId    = caller;
            lastLogin = Time.now();
          };
          UsersLib.upsertUser(usersMap, relinked);
        };
        return caller;
      };
      case null ();
    };
    let user : UserTypes.User = {
      userId = caller;
      name;
      email;
      role;
      collegeId;
      registeredCollegeId;
      skills = [];
      isActive = true;
      createdAt = Time.now();
      lastLogin = Time.now();
      passwordHash = null;
      mustChangePassword = false;
      dateOfBirth = null;
    };
    UsersLib.upsertUser(usersMap, user);
    caller;
  };

  public shared ({ caller }) func getMyProfile() : async ?UserTypes.User {
    UsersLib.getUser(usersMap, caller);
  };

  public shared ({ caller }) func updateProfile(name : Text, email : Text) : async Bool {
    guardMaintenanceUsers(caller);
    switch (UsersLib.getUser(usersMap, caller)) {
      case null false;
      case (?u) {
        UsersLib.upsertUser(usersMap, { u with name; email });
        true;
      };
    };
  };

  public shared ({ caller }) func getUserById(id : CommonTypes.UserId) : async ?UserTypes.User {
    UsersLib.getUser(usersMap, id);
  };

  public shared ({ caller }) func listUsers() : async [UserTypes.User] {
    [
      UsersLib.listUsersByRole(usersMap, #customer),
      UsersLib.listUsersByRole(usersMap, #collegeAdmin),
      UsersLib.listUsersByRole(usersMap, #databaseAdmin),
    ].flatten();
  };

  /// Update admin skills (multi-select tags).
  public shared ({ caller }) func updateAdminSkills(skills : [SkillTypes.AdminSkill]) : async Bool {
    guardMaintenanceUsers(caller);
    switch (UsersLib.getUser(usersMap, caller)) {
      case null false;
      case (?u) {
        UsersLib.upsertUser(usersMap, { u with skills });
        true;
      };
    };
  };

  /// Head Admin: set a customer's permanent college assignment.
  public shared ({ caller }) func setCustomerCollege(customerId : CommonTypes.UserId, collegeId : Text) : async Bool {
    switch (UsersLib.getUser(usersMap, customerId)) {
      case null false;
      case (?u) {
        UsersLib.upsertUser(usersMap, { u with registeredCollegeId = ?collegeId; collegeId = ?collegeId });
        true;
      };
    };
  };

  public shared ({ caller }) func assignUserRole(id : CommonTypes.UserId, role : UserTypes.UserRole) : async Bool {
    UsersLib.assignRole(usersMap, id, role);
  };

  public shared ({ caller }) func deactivateUser(id : CommonTypes.UserId) : async Bool {
    UsersLib.deactivateUser(usersMap, id);
  };

  public shared ({ caller }) func updateLastLogin() : async () {
    switch (UsersLib.getUser(usersMap, caller)) {
      case null ();
      case (?u) UsersLib.upsertUser(usersMap, { u with lastLogin = Time.now() });
    };
  };

  /// Login as customer: load existing profile by email, never create a duplicate.
  /// Returns null if the email is not yet registered.
  public shared ({ caller }) func loginAsCustomer(email : Text) : async ?UserTypes.User {
    // Find existing user by email — never create a duplicate
    switch (UsersLib.getUserByEmail(usersMap, email)) {
      case null null; // email not registered
      case (?u) {
        // Update last login timestamp
        let updated = { u with lastLogin = Time.now() };
        UsersLib.upsertUser(usersMap, updated);
        ?updated;
      };
    };
  };

  /// Admin / customer: change password (required on first login when mustChangePassword = true).
  public shared ({ caller }) func changePassword(oldPasswordHash : Text, newPasswordHash : Text) : async Bool {
    switch (UsersLib.getUser(usersMap, caller)) {
      case null false;
      case (?u) {
        // Verify old password matches stored hash (or DOB temp password)
        let storedHash = switch (u.passwordHash) { case (?h) h; case null "" };
        if (storedHash != oldPasswordHash) return false;
        UsersLib.upsertUser(usersMap, {
          u with
          passwordHash = ?newPasswordHash;
          mustChangePassword = false;
        });
        true;
      };
    };
  };

  /// Return session token stored in backend — clients persist it in localStorage.
  public shared ({ caller }) func getOrCreateSessionToken() : async Text {
    // Return existing token for this principal if one exists
    switch (
      sessionTokens.entries().find(
        func((_, uid) : (Text, CommonTypes.UserId)) : Bool { uid == caller }
      )
    ) {
      case (?(token, _)) token;
      case null {
        let token = caller.toText() # "_" # Time.now().toText();
        sessionTokens.add(token, caller);
        token;
      };
    };
  };

  /// Validate a session token and return the associated user.
  public query func getUserBySessionToken(token : Text) : async ?UserTypes.User {
    switch (sessionTokens.get(token)) {
      case null null;
      case (?uid) UsersLib.getUser(usersMap, uid);
    };
  };

  /// Look up an admin or DBA account by email for login purposes.
  /// Returns the User record (with passwordHash, mustChangePassword) only if the role is
  /// #collegeAdmin or #databaseAdmin. Returns null for customers or unknown emails.
  public query func getAdminAccount(email : Text) : async ?UserTypes.User {
    switch (UsersLib.getUserByEmail(usersMap, email)) {
      case null null;
      case (?u) {
        switch (u.role) {
          case (#collegeAdmin or #databaseAdmin) ?u;
          case _ null;
        };
      };
    };
  };

public query func getUserByEmail(email : Text) : async ?UserTypes.User {
    UsersLib.getUserByEmail(usersMap, email);
  };

  public query func countTotalUsers() : async Nat {
    UsersLib.countUsers(usersMap);
  };
};
