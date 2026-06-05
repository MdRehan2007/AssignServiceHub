import Common "common";

module {
  public type College = {
    collegeId        : Common.CollegeId;
    collegeName      : Text;
    collegeCode      : Text;             // auto-computed code e.g. "SRM", "VIT"
    adminIds         : [Common.UserId];  // multiple admins per college
    adminCount       : Nat;
    adminEmail       : Text;
    contactPhone     : Text;
    commissionPercent: Nat;
    isActive         : Bool;
    createdAt        : Common.Timestamp;
  };
};
