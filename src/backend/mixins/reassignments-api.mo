import Map "mo:core/Map";
import ReassignTypes "../types/reassignment";
import CommonTypes "../types/common";
import ReassignLib "../lib/reassignments";

mixin (
  reassignMap : Map.Map<CommonTypes.LogId, ReassignTypes.ReassignmentLog>,
  reassignSeq : { var next : Nat }
) {
  /// Head Admin force-reassigns an order to a new admin.
  public shared ({ caller }) func reassignOrder(
    orderId       : CommonTypes.OrderId,
    newAdminId    : CommonTypes.UserId,
    newAdminName  : Text,
    reason        : Text
  ) : async ReassignTypes.ReassignmentLog {
    ReassignLib.recordReassignment(
      reassignMap, reassignSeq,
      orderId,
      caller, "",
      newAdminId, newAdminName,
      reason,
      caller
    );
  };

  /// List all reassignment logs for a given order.
  public shared ({ caller }) func listReassignmentLogs(
    orderId : CommonTypes.OrderId
  ) : async [ReassignTypes.ReassignmentLog] {
    ReassignLib.listForOrder(reassignMap, orderId);
  };

  /// Head Admin: list all reassignment logs.
  public shared ({ caller }) func listAllReassignmentLogs() : async [ReassignTypes.ReassignmentLog] {
    ReassignLib.listAll(reassignMap);
  };
};
