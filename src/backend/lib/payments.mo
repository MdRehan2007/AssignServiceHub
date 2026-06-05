import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Types "../types/payment";
import Common "../types/common";
import OrderTypes "../types/order";
import NotifTypes "../types/notification";
import Array "mo:core/Array";

module {
  public type PaymentMap    = Map.Map<Common.PaymentId, Types.Payment>;
  public type PaymentLogMap = Map.Map<Text, Types.PaymentLog>;
  public type OrderMap      = Map.Map<Common.OrderId, OrderTypes.Order>;
  public type NotifMap      = Map.Map<Common.NotifId, NotifTypes.Notification>;
  public type VerificationMap = Map.Map<Text, Types.PaymentVerification>;
  public type AuditLogMap     = Map.Map<Text, Types.PaymentAuditLog>;
  public type InFlightSet     = Map.Map<Common.OrderId, Bool>;

  // ── Transaction ID generator ──────────────────────────────────────────────
  public func generateTransactionId(seed : Nat) : Text {
    "TXN" # seed.toText() # (seed % 999999).toText();
  };

  // ── Payment log helpers ───────────────────────────────────────────────────
  public func addPaymentLog(
    logMap       : PaymentLogMap,
    logId        : Text,
    paymentId    : Text,
    orderId      : Text,
    customerId   : Common.UserId,
    reason       : Text,
    adminRemarks : Text
  ) {
    let entry : Types.PaymentLog = {
      logId;
      paymentId;
      orderId;
      customerId;
      reason;
      timestamp    = Time.now();
      adminRemarks;
    };
    logMap.add(logId, entry);
  };

  public func getPaymentLogs(logMap : PaymentLogMap) : [Types.PaymentLog] {
    logMap.values().toArray();
  };

  // ── Core CRUD ─────────────────────────────────────────────────────────────
  public func createPayment(
    map           : PaymentMap,
    seq           : { var next : Nat },
    orderId       : Common.OrderId,
    customerId    : Common.UserId,
    amount        : Nat,
    transactionId : Text
  ) : (Nat, Types.Payment) {
    let idx = seq.next;
    seq.next += 1;
    let id = "PAY" # idx.toText();
    let now = Time.now();
    let payment : Types.Payment = {
      paymentId         = id;
      transactionId;
      orderId;
      customerId;
      adminId           = null;
      collegeId         = "";
      amount;
      paymentMethod     = "UPI";
      status            = #Pending;
      transactionState  = #Pending;
      timestamp         = now;
      createdAt         = now;
      updatedAt         = now;
      verifiedAt        = null;
      verifiedBy        = null;
      failureReason     = null;
      screenshotKey     = null;
      attemptCount      = 1;
      ipAddress         = null;
      deviceInfo        = null;
      proofFileKey      = null;
      screenshotFileKey = "";
      expiredAt         = 0;
    };
    map.add(id, payment);
    (idx, payment);
  };

  public func verifyPayment(
    map       : PaymentMap,
    id        : Common.PaymentId,
    ordersMap : OrderMap,
    notifMap  : NotifMap,
    notifSeq  : { var next : Nat }
  ) : Bool {
    switch (map.get(id)) {
      case null false;
      case (?p) {
        let now = Time.now();
        map.add(id, { p with
          status           = #Verified;
          transactionState = #Verified;
          verifiedAt       = ?now;
          updatedAt        = now;
        });
        switch (ordersMap.get(p.orderId)) {
          case null ();
          case (?o) {
            switch (o.status) {
              case (#PendingPaymentVerification) {
                ordersMap.add(p.orderId, { o with status = #ActiveReadyToStart; updatedAt = now });
                switch (o.acceptedByAdminId) {
                  case null ();
                  case (?_adminText) {
                    switch (o.adminId) {
                      case null ();
                      case (?adminPrincipal) {
                        let notifIdx = notifSeq.next;
                        notifSeq.next += 1;
                        let nid = "NOTIF" # notifIdx.toText();
                        let notif : NotifTypes.Notification = {
                          notifId   = nid;
                          userId    = adminPrincipal;
                          notifType = #paymentReceived;
                          message   = "Payment verified for order " # p.orderId # ". Ready to start.";
                          relatedId = ?p.orderId;
                          isRead    = false;
                          createdAt = now;
                        };
                        notifMap.add(nid, notif);
                      };
                    };
                  };
                };
              };
              case (_) ();
            };
          };
        };
        true;
      };
    };
  };

  public func rejectPayment(map : PaymentMap, id : Common.PaymentId) : Bool {
    switch (map.get(id)) {
      case null false;
      case (?p) {
        let now = Time.now();
        map.add(id, { p with
          status           = #Rejected;
          transactionState = #Cancelled;
          updatedAt        = now;
        });
        true;
      };
    };
  };

  public func markExpired(map : PaymentMap, id : Common.PaymentId) : Bool {
    switch (map.get(id)) {
      case null false;
      case (?p) {
        let now = Time.now();
        map.add(id, { p with
          status           = #Rejected;
          transactionState = #Failed;
          failureReason    = ?"expired";
          expiredAt        = now;
          updatedAt        = now;
        });
        true;
      };
    };
  };

  public func listByCustomer(map : PaymentMap, cid : Common.UserId) : [Types.Payment] {
    map.values().filter(func(p : Types.Payment) : Bool { p.customerId == cid }).toArray();
  };

  public func listByOrder(map : PaymentMap, oid : Common.OrderId) : [Types.Payment] {
    map.values().filter(func(p : Types.Payment) : Bool { p.orderId == oid }).toArray();
  };

  public func getTotalRevenue(map : PaymentMap) : Nat {
    map.values().foldLeft(0, func(acc : Nat, p : Types.Payment) : Nat {
      switch (p.status) {
        case (#Verified) acc + p.amount;
        case (_) acc;
      };
    });
  };

  // ── Duplicate/rate-limit helpers ──────────────────────────────────────────
  /// Returns true if a #Pending payment already exists for this orderId.
  public func hasPendingPayment(map : PaymentMap, orderId : Common.OrderId) : Bool {
    switch (map.values().find(func(p : Types.Payment) : Bool {
      p.orderId == orderId and p.status == #Pending
    })) {
      case (?_) true;
      case null false;
    };
  };

  /// Count payments created by a customer after a given timestamp.
  public func countRecentByCustomer(
    map         : PaymentMap,
    customerId  : Common.UserId,
    afterTime   : Int
  ) : Nat {
    map.values().filter(func(p : Types.Payment) : Bool {
      p.customerId == customerId and p.createdAt >= afterTime
    }).size();
  };
  // ── Duplicate helpers (new) ──────────────────────────────────────────────
  /// Returns true if a #Processing or #Verified payment already exists for this orderId.
  public func hasDuplicatePayment(map : PaymentMap, orderId : Common.OrderId) : Bool {
    switch (map.values().find(func(p : Types.Payment) : Bool {
      p.orderId == orderId and
        (p.transactionState == #Processing or p.transactionState == #Verified)
    })) {
      case (?_) true;
      case null false;
    };
  };

  // ── PaymentVerification helpers ───────────────────────────────────────────
  public func createVerificationRecord(
    verMap        : VerificationMap,
    verSeq        : { var next : Nat },
    transactionId : Text,
    screenshotUrl : ?Text
  ) : Types.PaymentVerification {
    let idx = verSeq.next;
    verSeq.next += 1;
    let rec : Types.PaymentVerification = {
      verificationId     = "VER" # idx.toText();
      transactionId;
      screenshotUrl;
      verificationStatus = "Pending";
      reviewedBy         = null;
      reviewTimestamp    = null;
      reviewNotes        = null;
      submittedAt        = Time.now();
    };
    verMap.add(rec.verificationId, rec);
    rec;
  };

  public func updateVerificationRecord(
    verMap     : VerificationMap,
    txnId      : Text,
    status     : Text,
    reviewedBy : Text,
    notes      : ?Text
  ) {
    let now = Time.now();
    switch (verMap.values().find(func(v : Types.PaymentVerification) : Bool { v.transactionId == txnId })) {
      case null ();
      case (?v) {
        verMap.add(v.verificationId, { v with
          verificationStatus = status;
          reviewedBy         = ?reviewedBy;
          reviewTimestamp    = ?now;
          reviewNotes        = notes;
        });
      };
    };
  };

  /// Update the screenshotUrl on a PaymentVerification record.
  public func attachScreenshotToVerification(
    verMap        : VerificationMap,
    txnId         : Text,
    screenshotUrl : Text
  ) {
    switch (verMap.values().find(func(v : Types.PaymentVerification) : Bool { v.transactionId == txnId })) {
      case null ();
      case (?v) {
        verMap.add(v.verificationId, { v with screenshotUrl = ?screenshotUrl });
      };
    };
  };

  public func getVerificationByTxn(
    verMap : VerificationMap,
    txnId  : Text
  ) : ?Types.PaymentVerification {
    verMap.values().find(func(v : Types.PaymentVerification) : Bool { v.transactionId == txnId });
  };

  // ── PaymentAuditLog helpers ───────────────────────────────────────────────
  public func writeAuditLog(
    auditMap      : AuditLogMap,
    auditSeq      : { var next : Nat },
    action        : Text,
    actorId       : Text,
    transactionId : ?Text,
    orderId       : ?Text,
    amount        : ?Nat,
    details       : ?Text
  ) {
    let idx = auditSeq.next;
    auditSeq.next += 1;
    let entry : Types.PaymentAuditLog = {
      logId         = "PAUDIT" # idx.toText();
      transactionId;
      action;
      actorId;
      orderId;
      amount;
      ipAddress     = null;
      deviceInfo    = null;
      timestamp     = Time.now();
      details;
    };
    auditMap.add(entry.logId, entry);
  };

  /// Overload: write audit log with verifier role context embedded in details.
  public func writeVerificationAuditLog(
    auditMap      : AuditLogMap,
    auditSeq      : { var next : Nat },
    action        : Text,
    actorId       : Text,
    verifierRole  : Text,
    approvalReason : ?Text,
    verifiedAt    : Int,
    transactionId : ?Text,
    orderId       : ?Text,
    amount        : ?Nat
  ) {
    let detail = "verifierRole=" # verifierRole #
      "; verifiedAt=" # verifiedAt.toText() #
      (switch (approvalReason) { case (?r) "; reason=" # r; case null "" });
    writeAuditLog(auditMap, auditSeq, action, actorId, transactionId, orderId, amount, ?detail);
  };

  public func getRecentAuditLogs(
    auditMap : AuditLogMap,
    limit    : Nat
  ) : [Types.PaymentAuditLog] {
    let all = auditMap.values().toArray();
    let sorted = all.sort(func(a, b) {
      if (a.timestamp > b.timestamp) #less
      else if (a.timestamp < b.timestamp) #greater
      else #equal
    });
    if (sorted.size() <= limit) sorted
    else {
      var i = 0;
      sorted.filter(func(_ : Types.PaymentAuditLog) : Bool {
        i += 1;
        i <= limit
      });
    };
  };

  // ── Pending verifications queries ────────────────────────────────────────
  /// All payments with Pending verification status (for HEAD_ADMIN).
  public func getPendingVerifications(verMap : VerificationMap) : [Types.PaymentVerification] {
    verMap.values().filter(
      func(v : Types.PaymentVerification) : Bool { v.verificationStatus == "Pending" }
    ).toArray();
  };

  /// Pending verifications filtered to a specific college via orderId lookup.
  public func getPendingVerificationsForCollege(
    verMap   : VerificationMap,
    payMap   : PaymentMap,
    orderMap : OrderMap,
    college  : Text
  ) : [Types.PaymentVerification] {
    verMap.values().filter(func(v : Types.PaymentVerification) : Bool {
      if (v.verificationStatus != "Pending") return false;
      switch (payMap.values().find(func(p : Types.Payment) : Bool { p.transactionId == v.transactionId })) {
        case null false;
        case (?p) {
          switch (orderMap.get(p.orderId)) {
            case null false;
            case (?o) o.college == college;
          };
        };
      };
    }).toArray();
  };

  // ── Dashboard stats ────────────────────────────────────────────────────────
  public func getTransactionDashboardStats(
    map : PaymentMap
  ) : {
    totalRevenue           : Nat;
    pendingVerifications   : Nat;
    failedPayments         : Nat;
    successfulTransactions : Nat;
    recentTransactions     : [Types.Payment];
  } {
    var totalRevenue = 0;
    var pendingVer   = 0;
    var failedPay    = 0;
    var successTx    = 0;
    let all = map.values().toArray();
    for (p in all.vals()) {
      switch (p.transactionState) {
        case (#Verified)   { totalRevenue += p.amount; successTx += 1 };
        case (#Pending or #Processing) { pendingVer += 1 };
        case (#Failed or #Cancelled)   { failedPay  += 1 };
        case (_) {};
      };
    };
    let sorted = all.sort(func(a, b) {
      if (a.timestamp > b.timestamp) #less
      else if (a.timestamp < b.timestamp) #greater
      else #equal
    });
    let recentSize = if (sorted.size() < 10) sorted.size() else 10;
    var i = 0;
    let recent = sorted.filter(func(_ : Types.Payment) : Bool {
      i += 1;
      i <= recentSize
    });
    {
      totalRevenue;
      pendingVerifications   = pendingVer;
      failedPayments         = failedPay;
      successfulTransactions = successTx;
      recentTransactions     = recent;
    };
  };

  // ── College-wise revenue stats ─────────────────────────────────────────────
  public func getCollegeRevenueStats(
    payMap   : PaymentMap,
    orderMap : OrderMap
  ) : [(Text, Nat)] {
    let revMap = Map.empty<Text, Nat>();
    for (p in payMap.values()) {
      if (p.transactionState == #Verified) {
        let collegeName = switch (orderMap.get(p.orderId)) {
          case (?o) o.college;
          case null p.collegeId;
        };
        let prev = switch (revMap.get(collegeName)) { case (?v) v; case null 0 };
        revMap.add(collegeName, prev + p.amount);
      };
    };
    revMap.entries().toArray();
  };

  // ── Admin-wise revenue stats ───────────────────────────────────────────────
  public func getAdminRevenueStats(
    payMap   : PaymentMap,
    orderMap : OrderMap
  ) : [(Text, Nat)] {
    let revMap = Map.empty<Text, Nat>();
    for (p in payMap.values()) {
      if (p.transactionState == #Verified) {
        let adminId = switch (orderMap.get(p.orderId)) {
          case (?o) switch (o.acceptedByAdminId) { case (?aid) aid; case null "unassigned" };
          case null "unassigned";
        };
        let prev = switch (revMap.get(adminId)) { case (?v) v; case null 0 };
        revMap.add(adminId, prev + p.amount);
      };
    };
    revMap.entries().toArray();
  };
};
