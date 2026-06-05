import Common "common";
import OrderTypes "order";

module {
  public type CleanupLog = {
    logId          : Common.LogId;
    cleanupType    : Text;
    recordsRemoved : Nat;
    performedBy    : Common.UserId;
    performedAt    : Common.Timestamp;
  };

  /// Caller role determines which orders the caller is allowed to delete.
  public type CallerRole = {
    #Customer;      // can only delete their own orders
    #CollegeAdmin;  // can only delete orders belonging to their college
    #DatabaseAdmin; // can delete any matching orders
  };

  /// Filter criteria for smart cleanup. All fields are optional (null = no filter).
  public type CleanupFilter = {
    /// Only delete orders with these statuses. Allowed: #Completed, #Delivered, #Closed.
    /// If null, all three safe statuses are targeted.
    statusFilter   : ?[OrderTypes.OrderStatus];
    /// Only delete orders belonging to this college (Text college name/id).
    collegeIdFilter : ?Text;
    /// Only delete orders older than this many days (positive integer).
    olderThanDays  : ?Nat;
    /// Caller's declared role — enforced against actual caller principal.
    callerRole     : CallerRole;
  };

  /// Result returned by smartCleanup.
  public type CleanupResult = {
    deletedCount : Nat;
    message      : Text;
  };
};
