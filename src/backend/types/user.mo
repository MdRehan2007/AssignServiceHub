import Common "common";
import SkillTypes "skill";

module {
  public type UserRole = {
    #databaseAdmin;
    #collegeAdmin;
    #customer;
  };

  public type User = {
    userId              : Common.UserId;
    name                : Text;
    email               : Text;
    role                : UserRole;
    collegeId           : ?Text;
    registeredCollegeId : ?Text;   // permanent college assignment for customers
    skills              : [SkillTypes.AdminSkill]; // used by collegeAdmin users
    isActive            : Bool;
    createdAt           : Common.Timestamp;
    lastLogin           : Common.Timestamp;
    // Auth fields for temp-password + forced change workflow
    passwordHash        : ?Text;   // hashed password (or null for Internet-Identity-only users)
    mustChangePassword  : Bool;    // true after auto-provisioning until first change
    dateOfBirth         : ?Text;   // DDMMYY — used as temp password seed for auto-provisioned admins
  };
};
