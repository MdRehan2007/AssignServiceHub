import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import CleanupTypes "../types/cleanup";
import CommonTypes "../types/common";
import OrderTypes "../types/order";
import NotifTypes "../types/notification";
import AuditTypes "../types/audit";
import PayTypes "../types/payment";
import UserTypes "../types/user";
import MsgTypes "../types/message";
import AppTypes "../types/writer-application";
import CleanupLib "../lib/cleanup";
import Time "mo:core/Time";

mixin (
  cleanupLogs  : Map.Map<CommonTypes.LogId, CleanupTypes.CleanupLog>,
  cleanupSeq   : { var next : Nat },
  ordersRef    : Map.Map<CommonTypes.OrderId, OrderTypes.Order>,
  notifsRef    : Map.Map<CommonTypes.NotifId, NotifTypes.Notification>,
  auditRef     : Map.Map<CommonTypes.LogId, AuditTypes.AuditLog>,
  paymentsRef  : Map.Map<CommonTypes.PaymentId, PayTypes.Payment>,
  usersRef     : Map.Map<CommonTypes.UserId, UserTypes.User>,
  messagesRef  : Map.Map<CommonTypes.MessageId, MsgTypes.Message>,
  appsRef      : Map.Map<CommonTypes.AppId, AppTypes.WriterApplication>
) {
  /// Delete orders older than 30 days. Returns count removed.
  public shared ({ caller }) func cleanOldOrders() : async Nat {
    let cutoff = Time.now() - 30 * 24 * 60 * 60 * 1_000_000_000;
    let removed = CleanupLib.deleteOldOrders(ordersRef, cutoff);
    ignore CleanupLib.recordCleanup(cleanupLogs, cleanupSeq, "orders", removed, caller);
    removed;
  };

  /// Delete notifications older than 30 days.
  public shared ({ caller }) func cleanOldNotifications() : async Nat {
    let cutoff = Time.now() - 30 * 24 * 60 * 60 * 1_000_000_000;
    let removed = CleanupLib.deleteOldNotifications(notifsRef, cutoff);
    ignore CleanupLib.recordCleanup(cleanupLogs, cleanupSeq, "notifications", removed, caller);
    removed;
  };

  /// Trim audit logs older than 30 days.
  public shared ({ caller }) func cleanOldAuditLogs() : async Nat {
    let cutoff = Time.now() - 30 * 24 * 60 * 60 * 1_000_000_000;
    let removed = CleanupLib.deleteOldAuditLogs(auditRef, cutoff);
    ignore CleanupLib.recordCleanup(cleanupLogs, cleanupSeq, "auditLogs", removed, caller);
    removed;
  };

  /// Run full cleanup pass (orders + notifications + audit logs).
  public shared ({ caller }) func runFullCleanup() : async { ordersRemoved : Nat; notifsRemoved : Nat; logsRemoved : Nat } {
    let cutoff = Time.now() - 30 * 24 * 60 * 60 * 1_000_000_000;
    let ordersRemoved = CleanupLib.deleteOldOrders(ordersRef, cutoff);
    let notifsRemoved = CleanupLib.deleteOldNotifications(notifsRef, cutoff);
    let logsRemoved   = CleanupLib.deleteOldAuditLogs(auditRef, cutoff);
    ignore CleanupLib.recordCleanup(cleanupLogs, cleanupSeq, "full", ordersRemoved + notifsRemoved + logsRemoved, caller);
    { ordersRemoved; notifsRemoved; logsRemoved };
  };

  /// Smart cleanup: delete orders matching the filter, plus their linked
  /// payments and notifications. Enforces role-based ownership rules.
  /// Returns deletedCount and a summary message.
  public shared ({ caller }) func smartCleanup(filter : CleanupTypes.CleanupFilter) : async CleanupTypes.CleanupResult {
    let deleted = CleanupLib.smartCleanupOrders(
      ordersRef, paymentsRef, notifsRef, usersRef, caller, filter
    );
    ignore CleanupLib.recordCleanup(cleanupLogs, cleanupSeq, "smartCleanup", deleted, caller);
    {
      deletedCount = deleted;
      message = "Deleted " # deleted.toText() # " order(s) and their linked records.";
    };
  };

  /// Dry-run smart cleanup: returns how many orders WOULD be deleted without
  /// actually modifying any state. Used to power the confirmation modal.
  public shared query ({ caller }) func dryRunSmartCleanup(filter : CleanupTypes.CleanupFilter) : async CleanupTypes.CleanupResult {
    let count = CleanupLib.dryRunSmartCleanup(ordersRef, usersRef, caller, filter);
    {
      deletedCount = count;
      message = "Found " # count.toText() # " matching order(s). Delete them permanently?";
    };
  };
/// List cleanup history logs.
  public query func listCleanupLogs() : async [CleanupTypes.CleanupLog] {
    CleanupLib.listLogs(cleanupLogs);
  };
};
