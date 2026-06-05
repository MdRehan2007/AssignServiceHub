import Map "mo:core/Map";
import AuditTypes "../types/audit";
import CommonTypes "../types/common";
import AuditLib "../lib/audit";

mixin (
  auditMap : Map.Map<CommonTypes.LogId, AuditTypes.AuditLog>,
  auditSeq : { var next : Nat }
) {
  public shared ({ caller }) func logAction(
    action : Text,
    resource : Text,
    details : Text
  ) : async AuditTypes.AuditLog {
    let (_, entry) = AuditLib.log(auditMap, auditSeq, caller, action, resource, details);
    entry;
  };

  public query func getAllAuditLogs() : async [AuditTypes.AuditLog] {
    AuditLib.listAll(auditMap);
  };

  public shared ({ caller }) func getMyAuditLogs() : async [AuditTypes.AuditLog] {
    AuditLib.listByAdmin(auditMap, caller);
  };
};
