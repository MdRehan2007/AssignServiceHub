import Map "mo:core/Map";
import Time "mo:core/Time";
import List "mo:core/List";
import CleanupTypes "../types/cleanup";
import Common "../types/common";
import OrderTypes "../types/order";
import NotifTypes "../types/notification";
import AuditTypes "../types/audit";
import UserTypes "../types/user";
import PayTypes "../types/payment";

module {
  public type CleanupMap = Map.Map<Common.LogId, CleanupTypes.CleanupLog>;

  /// Delete orders older than cutoffTimestamp (Int nanoseconds).
  public func deleteOldOrders(
    ordersMap : Map.Map<Common.OrderId, OrderTypes.Order>,
    cutoff    : Common.Timestamp
  ) : Nat {
    var count = 0;
    for (o in ordersMap.values().toArray().vals()) {
      if (o.createdAt < cutoff) {
        ordersMap.remove(o.orderId);
        count += 1;
      };
    };
    count;
  };

  /// Remove notifications older than cutoffTimestamp.
  public func deleteOldNotifications(
    notifsMap : Map.Map<Common.NotifId, NotifTypes.Notification>,
    cutoff    : Common.Timestamp
  ) : Nat {
    var count = 0;
    for (n in notifsMap.values().toArray().vals()) {
      if (n.createdAt < cutoff) {
        notifsMap.remove(n.notifId);
        count += 1;
      };
    };
    count;
  };

  /// Trim audit logs older than cutoffTimestamp.
  public func deleteOldAuditLogs(
    logsMap : Map.Map<Common.LogId, AuditTypes.AuditLog>,
    cutoff  : Common.Timestamp
  ) : Nat {
    var count = 0;
    for (l in logsMap.values().toArray().vals()) {
      if (l.timestamp < cutoff) {
        logsMap.remove(l.logId);
        count += 1;
      };
    };
    count;
  };


  /// The set of order statuses that are safe to delete.
  func isSafeStatus(s : OrderTypes.OrderStatus) : Bool {
    switch s {
      case (#Completed or #Delivered or #Closed) true;
      case _ false;
    };
  };

  /// Returns true if the given status is in the caller-supplied filter list.
  /// All items in the list must be safe statuses; rejects otherwise (returns false for unsafe).
  func matchesStatusFilter(s : OrderTypes.OrderStatus, filter : ?[OrderTypes.OrderStatus]) : Bool {
    switch filter {
      case null  isSafeStatus(s);
      case (?arr) {
        if (not isSafeStatus(s)) return false;
        switch (arr.find(func(x : OrderTypes.OrderStatus) : Bool { x == s })) {
          case (?_) true;
          case null false;
        };
      };
    };
  };

  /// Core: collect order IDs that match the filter for the given caller.
  /// Role enforcement:
  ///   Customer  → only own orders
  ///   CollegeAdmin → only orders matching their college
  ///   DatabaseAdmin → any order
  func collectMatchingOrders(
    ordersMap : Map.Map<Common.OrderId, OrderTypes.Order>,
    usersMap  : Map.Map<Common.UserId, UserTypes.User>,
    caller    : Common.UserId,
    filter    : CleanupTypes.CleanupFilter
  ) : [Common.OrderId] {
    let now = Time.now();
    let cutoff : ?Int = switch (filter.olderThanDays) {
      case null null;
      case (?days) ?( now - (days * 24 * 60 * 60 * 1_000_000_000 : Nat).toInt() );
    };

    // Resolve caller's college for CollegeAdmin role
    let callerCollege : ?Text = switch (filter.callerRole) {
      case (#CollegeAdmin) {
        switch (usersMap.get(caller)) {
          case (?u) u.collegeId;
          case null null;
        };
      };
      case _ null;
    };

    let result = List.empty<Common.OrderId>();
    for (o in ordersMap.values().toArray().vals()) {
      // Status check
      if (not matchesStatusFilter(o.status, filter.statusFilter)) {
        // skip
      } else {
        // Age check
        let ageOk = switch cutoff {
          case null true;
          case (?c)  o.createdAt < c;
        };
        if (not ageOk) {
          // skip
        } else {
          // College filter
          let collegeOk = switch (filter.collegeIdFilter) {
            case (?cid) o.college == cid;
            case null   true;
          };
          if (not collegeOk) {
            // skip
          } else {
            // Role-based ownership check
            let roleOk = switch (filter.callerRole) {
              case (#Customer)      o.customerId == caller;
              case (#CollegeAdmin)  {
                switch callerCollege {
                  case (?cc) o.college == cc;
                  case null  false;
                };
              };
              case (#DatabaseAdmin) true;
            };
            if (roleOk) {
              result.add(o.orderId);
            };
          };
        };
      };
    };
    result.toArray();
  };

  /// Dry-run: return count of orders that would be deleted without modifying state.
  public func dryRunSmartCleanup(
    ordersMap : Map.Map<Common.OrderId, OrderTypes.Order>,
    usersMap  : Map.Map<Common.UserId, UserTypes.User>,
    caller    : Common.UserId,
    filter    : CleanupTypes.CleanupFilter
  ) : Nat {
    collectMatchingOrders(ordersMap, usersMap, caller, filter).size();
  };

  /// Execute smart cleanup: delete matching orders, their linked payments, and
  /// order-related notifications. Returns count of orders deleted.
  public func smartCleanupOrders(
    ordersMap   : Map.Map<Common.OrderId, OrderTypes.Order>,
    paymentsMap : Map.Map<Common.PaymentId, PayTypes.Payment>,
    notifsMap   : Map.Map<Common.NotifId, NotifTypes.Notification>,
    usersMap    : Map.Map<Common.UserId, UserTypes.User>,
    caller      : Common.UserId,
    filter      : CleanupTypes.CleanupFilter
  ) : Nat {
    let toDelete = collectMatchingOrders(ordersMap, usersMap, caller, filter);
    // Build a set of order IDs for quick lookup when pruning payments/notifs
    let deleteSet = Map.empty<Common.OrderId, Bool>();
    for (oid in toDelete.vals()) {
      ordersMap.remove(oid);
      deleteSet.add(oid, true);
    };
    // Remove linked payments
    for (p in paymentsMap.values().toArray().vals()) {
      if (deleteSet.get(p.orderId) != null) {
        paymentsMap.remove(p.paymentId);
      };
    };
    // Remove notifications referencing deleted orders (via relatedId)
    for (n in notifsMap.values().toArray().vals()) {
      switch (n.relatedId) {
        case (?rid) {
          if (deleteSet.get(rid) != null) {
            notifsMap.remove(n.notifId);
          };
        };
        case null {};
      };
    };
    toDelete.size();
  };

  /// Record a cleanup operation log.
  public func recordCleanup(
    map         : CleanupMap,
    seq         : { var next : Nat },
    cleanupType : Text,
    removed     : Nat,
    performedBy : Common.UserId
  ) : CleanupTypes.CleanupLog {
    let idx = seq.next;
    seq.next += 1;
    let log : CleanupTypes.CleanupLog = {
      logId          = "CLN" # idx.toText();
      cleanupType;
      recordsRemoved = removed;
      performedBy;
      performedAt    = Time.now();
    };
    map.add(log.logId, log);
    log;
  };

  /// List all cleanup logs.
  public func listLogs(map : CleanupMap) : [CleanupTypes.CleanupLog] {
    map.values().toArray();
  };
};
