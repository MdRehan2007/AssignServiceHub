import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Types "../types/audit";
import Common "../types/common";

module {
  public type AuditMap = Map.Map<Common.LogId, Types.AuditLog>;

  public func log(
    map : AuditMap,
    seq : { var next : Nat },
    adminId : Common.UserId,
    action : Text,
    resource : Text,
    details : Text
  ) : (Nat, Types.AuditLog) {
    let idx = seq.next;
    seq.next += 1;
    let id = "LOG" # idx.toText();
    let entry : Types.AuditLog = {
      logId = id;
      adminId;
      action;
      resource;
      details;
      timestamp = Time.now();
    };
    map.add(id, entry);
    (idx, entry);
  };

  public func listAll(map : AuditMap) : [Types.AuditLog] {
    map.values().toArray();
  };

  public func listByAdmin(map : AuditMap, adminId : Common.UserId) : [Types.AuditLog] {
    map.values().filter(func(l : Types.AuditLog) : Bool { l.adminId == adminId }).toArray();
  };
};
