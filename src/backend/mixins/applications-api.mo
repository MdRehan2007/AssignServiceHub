import Map "mo:core/Map";
import AppTypes "../types/writer-application";
import CommonTypes "../types/common";
import AppsLib "../lib/applications";
import NotifsLib "../lib/notifications";
import NotifTypes "../types/notification";
import UserTypes "../types/user";
import CollegeTypes "../types/college";
import CollegesLib "../lib/colleges";
import UsersLib "../lib/users";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

mixin (
  appsMap      : Map.Map<CommonTypes.AppId, AppTypes.WriterApplication>,
  appSeq       : { var next : Nat },
  notifsMap    : Map.Map<CommonTypes.NotifId, NotifTypes.Notification>,
  notifSeq     : { var next : Nat },
  usersMapApps : Map.Map<CommonTypes.UserId, UserTypes.User>,
  collegesMapApps : Map.Map<CommonTypes.CollegeId, CollegeTypes.College>,
  collegeSeqApps  : { var next : Nat },
  userSeqApps     : { var next : Nat }
) {
  // Aliases used by the frontend (JoinTeamPage / writer application flow)
  public query func listWriterApplications() : async [AppTypes.WriterApplication] {
    AppsLib.listAll(appsMap);
  };

  public shared ({ caller }) func getWriterApplication(id : CommonTypes.AppId) : async ?AppTypes.WriterApplication {
    AppsLib.getApp(appsMap, id);
  };

  public shared ({ caller }) func submitWriterApplication(
    name : Text,
    email : Text,
    phone : Text,
    college : Text,
    bio : Text,
    expertise : [Text],
    handwritingUrl : Text,
    resumeKey : ?Text,
    resumeUrl : Text
  ) : async AppTypes.WriterApplication {
    let (_, app) = AppsLib.submit(appsMap, appSeq, name, email, phone, college, bio, expertise, handwritingUrl, resumeKey, resumeUrl);
    // Notify all Database Admins of new application
    let message = "New college admin application from " # name # " (" # college # ")";
    for (u in usersMapApps.values()) {
      if (u.role == #databaseAdmin) {
        ignore NotifsLib.create(notifsMap, notifSeq, u.userId, #general, message, ?app.appId);
      };
    };
    app;
  };

  public shared ({ caller }) func getApplication(id : CommonTypes.AppId) : async ?AppTypes.WriterApplication {
    AppsLib.getApp(appsMap, id);
  };

  public shared ({ caller }) func updateApplicationStatus(
    id     : CommonTypes.AppId,
    status : AppTypes.ApplicationStatus
  ) : async Bool {
    AppsLib.updateStatus(appsMap, id, status, caller.toText(), "");
  };

  public query func listApplications() : async [AppTypes.WriterApplication] {
    AppsLib.listAll(appsMap);
  };

  /// Database Admin: approve an application, auto-create admin user + college if needed.
  public shared ({ caller }) func approveApplication(
    id   : CommonTypes.AppId,
    note : Text
  ) : async { #ok : AppTypes.WriterApplication; #err : Text } {
    switch (AppsLib.getApp(appsMap, id)) {
      case null #err("ApplicationNotFound");
      case (?app) {
        // Only Database Admins may approve
        switch (usersMapApps.get(caller)) {
          case null return #err("NotAuthorized");
          case (?u) if (u.role != #databaseAdmin) return #err("NotAuthorized");
        };

        // Mark application Approved
        ignore AppsLib.updateStatus(appsMap, id, #Approved, caller.toText(), note);
        let updated = switch (AppsLib.getApp(appsMap, id)) { case (?a) a; case null app };

        // Auto-create college if it does not exist
        let collegeId : CommonTypes.CollegeId = switch (
          collegesMapApps.values().find(
            func(c : CollegeTypes.College) : Bool { c.collegeName == app.collegeName }
          )
        ) {
          case (?existing) existing.collegeId;
          case null {
            let (_, newCollege) = CollegesLib.createCollege(
              collegesMapApps, collegeSeqApps,
              app.collegeName, app.email, app.phone
            );
            newCollege.collegeId;
          };
        };

        // If applicant already has a registered user account, promote them to collegeAdmin.
        // Temp password = applicant's phone number (used as DOB placeholder until the
        // frontend passes a real DOB; the field is stored in passwordHash for first-login check).
        switch (UsersLib.getUserByEmail(usersMapApps, app.email)) {
          case (?existing) {
            UsersLib.upsertUser(usersMapApps, {
              existing with
              role = #collegeAdmin;
              collegeId = ?collegeId;
              registeredCollegeId = ?collegeId;
              mustChangePassword = true;
              passwordHash = ?app.phone;
            });
            ignore CollegesLib.addAdminToCollege(collegesMapApps, collegeId, existing.userId);
            // Notify the promoted user
            ignore NotifsLib.create(
              notifsMap, notifSeq, existing.userId, #general,
              "Your application has been APPROVED. College: " # app.collegeName #
              ". Your temporary password is your Date of Birth (DDMMYY format). " #
              "You will be required to change your password on first login.",
              ?id
            );
          };
          case null {
            // Applicant has no account yet. Create a pending record using the
            // anonymous principal as placeholder; on first Internet Identity login
            // the frontend calls registerUser which matches by email.
            let anonPrincipal = Principal.fromText("2vxsx-fae");
            let idx = userSeqApps.next;
            userSeqApps.next += 1;
            let pendingUser : UserTypes.User = {
              userId              = anonPrincipal;
              name                = app.applicantName;
              email               = app.email;
              role                = #collegeAdmin;
              collegeId           = ?collegeId;
              registeredCollegeId = ?collegeId;
              skills              = [];
              isActive            = true;
              createdAt           = Time.now();
              lastLogin           = Time.now();
              passwordHash        = ?app.phone; // DOB temp password
              mustChangePassword  = true;
              dateOfBirth         = null;
            };
            ignore idx;
            UsersLib.upsertUser(usersMapApps, pendingUser);
            ignore CollegesLib.addAdminToCollege(collegesMapApps, collegeId, anonPrincipal);
          };
        };

        // Notify all Database Admins
        for (u in usersMapApps.values()) {
          if (u.role == #databaseAdmin) {
            ignore NotifsLib.create(
              notifsMap, notifSeq, u.userId, #general,
              "Writer application approved: " # app.applicantName # " (" # app.collegeName # ")",
              ?id
            );
          };
        };

        #ok(updated);
      };
    };
  };

  /// Database Admin or College Admin: reject an application with optional note.
  public shared ({ caller }) func rejectApplication(
    id   : CommonTypes.AppId,
    note : Text
  ) : async { #ok : AppTypes.WriterApplication; #err : Text } {
    switch (AppsLib.getApp(appsMap, id)) {
      case null #err("ApplicationNotFound");
      case (?app) {
        // Notify applicant if they are a registered user BEFORE deleting the record
        switch (usersMapApps.values().find(func(u : UserTypes.User) : Bool { u.email == app.email })) {
          case (?u) {
            ignore NotifsLib.create(
              notifsMap, notifSeq, u.userId, #general,
              "Your college admin application has been reviewed. Status: REJECTED. Note: " # note,
              ?id
            );
          };
          case null ();
        };
        // Permanently delete the application record from storage
        ignore AppsLib.deleteApplication(appsMap, id);
        #ok(app);
      };
    };
  };
  /// Delete a writer application. Only DatabaseAdmin is permitted.
  public shared ({ caller }) func deleteApplication(id : CommonTypes.AppId) : async { #ok; #err : Text } {
    switch (usersMapApps.get(caller)) {
      case null { #err("UserNotFound") };
      case (?u) {
        if (u.role != #databaseAdmin) { return #err("NotAuthorized") };
        AppsLib.deleteApplication(appsMap, id);
      };
    };
  };
};
