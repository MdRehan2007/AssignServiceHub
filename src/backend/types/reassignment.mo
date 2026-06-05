import Common "common";

module {
  public type ReassignmentLog = {
    logId             : Common.LogId;
    orderId           : Common.OrderId;
    previousAdminId   : Common.UserId;
    previousAdminName : Text;
    newAdminId        : Common.UserId;
    newAdminName      : Text;
    reason            : Text;
    reassignedBy      : Common.UserId;
    reassignedAt      : Common.Timestamp;
  };
};
