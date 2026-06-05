import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "../types/reassignment";
import Common "../types/common";

module {
  public type ReassignMap = Map.Map<Common.LogId, Types.ReassignmentLog>;

  /// Record a reassignment log entry.
  public func recordReassignment(
    map           : ReassignMap,
    seq           : { var next : Nat },
    orderId       : Common.OrderId,
    prevAdminId   : Common.UserId,
    prevAdminName : Text,
    newAdminId    : Common.UserId,
    newAdminName  : Text,
    reason        : Text,
    reassignedBy  : Common.UserId
  ) : Types.ReassignmentLog {
    let idx = seq.next;
    seq.next += 1;
    let log : Types.ReassignmentLog = {
      logId             = "REASSIGN" # idx.toText();
      orderId;
      previousAdminId   = prevAdminId;
      previousAdminName = prevAdminName;
      newAdminId;
      newAdminName;
      reason;
      reassignedBy;
      reassignedAt      = Time.now();
    };
    map.add(log.logId, log);
    log;
  };

  /// List all reassignment logs for a specific order.
  public func listForOrder(map : ReassignMap, orderId : Common.OrderId) : [Types.ReassignmentLog] {
    map.values().filter(func(l : Types.ReassignmentLog) : Bool { l.orderId == orderId }).toArray();
  };

  /// List all reassignment logs globally.
  public func listAll(map : ReassignMap) : [Types.ReassignmentLog] {
    map.values().toArray();
  };
};
