import Common "common";

module {
  public type AuditLog = {
    logId     : Common.LogId;
    adminId   : Common.UserId;
    action    : Text;
    resource  : Text;
    details   : Text;
    timestamp : Common.Timestamp;
  };
};
