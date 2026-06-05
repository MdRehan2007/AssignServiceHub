import Map "mo:core/Map";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import PaymentTypes "../types/payment";
import CommonTypes "../types/common";
import OrderTypes "../types/order";
import NotifTypes "../types/notification";
import UserTypes "../types/user";
import PaymentsLib "../lib/payments";
import SettingsTypes "../types/settings";
import Runtime "mo:core/Runtime";
import NotifsLib "../lib/notifications";

mixin (
  paymentsMap      : Map.Map<CommonTypes.PaymentId, PaymentTypes.Payment>,
  paymentSeq       : { var next : Nat },
  payLogMap        : Map.Map<Text, PaymentTypes.PaymentLog>,
  payLogSeq        : { var next : Nat },
  ordersMap        : Map.Map<CommonTypes.OrderId, OrderTypes.Order>,
  notifsMap        : Map.Map<CommonTypes.NotifId, NotifTypes.Notification>,
  notifSeq         : { var next : Nat },
  settingsRef      : { var current : SettingsTypes.SystemSettings },
  payVerifications : Map.Map<Text, PaymentTypes.PaymentVerification>,
  payAuditLogs     : Map.Map<Text, PaymentTypes.PaymentAuditLog>,
  inFlightPayments : Map.Map<CommonTypes.OrderId, Bool>,
  payVerSeq        : { var next : Nat },
  payAuditSeq      : { var next : Nat },
  usersMap         : Map.Map<CommonTypes.UserId, UserTypes.User>
) {
  let HEAD_ADMIN_EMAIL_PAY : Text = "mhdrihan2007@gmail.com";

  func isHeadAdminPay(caller : Principal) : Bool {
    switch (usersMap.get(caller)) {
      case (?u) u.email == HEAD_ADMIN_EMAIL_PAY or u.role == #databaseAdmin;
      case null false;
    };
  };

  func guardMaintenancePayments(caller : Principal) {
    if (settingsRef.current.maintenanceMode and not isHeadAdminPay(caller)) {
      Runtime.trap("Website is under maintenance. Please try again later.");
    };
  };
  // ── Submit payment request (new: in-flight lock + full audit trail) ──────
  public shared ({ caller }) func submitPaymentRequest(
    orderId       : CommonTypes.OrderId,
    screenshotKey : Text
  ) : async { #ok : PaymentTypes.Payment; #err : Text } {
    guardMaintenancePayments(caller);
    // Screenshot is MANDATORY before submission
    if (screenshotKey == "") {
      return #err("ScreenshotRequired");
    };
    // In-flight lock: prevent concurrent double-submission for same order
    switch (inFlightPayments.get(orderId)) {
      case (?true) { return #err("PaymentInProgress") };
      case (_) ();
    };
    // Duplicate prevention: reject if already PROCESSING or VERIFIED
    if (PaymentsLib.hasDuplicatePayment(paymentsMap, orderId)) {
      return #err("DuplicatePayment");
    };
    // Set in-flight lock
    inFlightPayments.add(orderId, true);
    // Fetch amount and college from order
    let (amount, orderCollege, customerName) : (Nat, Text, Text) = switch (ordersMap.get(orderId)) {
      case null (0, "", caller.toText());
      case (?o) (
        o.totalPrice,
        o.college,
        switch (usersMap.get(o.customerId)) { case (?u) u.name; case null o.customerId.toText() }
      );
    };
    // Generate unique IDs
    let counter = paymentSeq.next;
    let txnId = "TXN" # Time.now().toText() # "-" # counter.toText();
    // Create payment — goes directly to PENDING (no auto-verify)
    let (_, payment) = PaymentsLib.createPayment(
      paymentsMap, paymentSeq, orderId, caller, amount, txnId
    );
    // Attach screenshot to the payment record
    paymentsMap.add(payment.paymentId, { payment with screenshotKey = ?screenshotKey });
    // Create PaymentVerification record with screenshot reference
    ignore PaymentsLib.createVerificationRecord(payVerifications, payVerSeq, txnId, ?screenshotKey);
    // Write audit log
    PaymentsLib.writeAuditLog(
      payAuditLogs, payAuditSeq,
      "PaymentSubmitted", caller.toText(), ?txnId, ?orderId, ?amount, ?screenshotKey
    );
    // Release in-flight lock
    inFlightPayments.remove(orderId);
    // ── Notifications: notify Head Admin + all college admins of the order's college ──
    let paymentMethod = "UPI";
    let message = "New payment proof submitted by " # customerName #
      " for order " # orderId #
      " (" # orderCollege # "). Amount: " # amount.toText() # ". Method: " # paymentMethod # ".";
    // Find and notify Database Admin
    switch (usersMap.values().find(func(u : UserTypes.User) : Bool { u.role == #databaseAdmin })) {
      case (?ha) {
        ignore NotifsLib.create(notifsMap, notifSeq, ha.userId, #paymentReceived, message, ?txnId);
      };
      case null ();
    };
    // Notify all college admins whose collegeId matches the order's college
    for (u in usersMap.values()) {
      if (u.role == #collegeAdmin) {
        let matches = switch (u.collegeId) {
          case (?cid) cid == orderCollege;
          case null false;
        };
        if (matches) {
          ignore NotifsLib.create(notifsMap, notifSeq, u.userId, #paymentReceived, message, ?txnId);
        };
      };
    };
    #ok(payment);
  };

  // ── Submit payment (legacy path — kept for compat) ────────────────────────
  public shared ({ caller }) func submitPayment(
    orderId : CommonTypes.OrderId
  ) : async PaymentTypes.Payment {
    guardMaintenancePayments(caller);
    // Duplicate prevention: reject if a #Pending payment already exists
    if (PaymentsLib.hasPendingPayment(paymentsMap, orderId)) {
      let existingOpt = paymentsMap.values().find(func(p : PaymentTypes.Payment) : Bool {
        p.orderId == orderId and p.status == #Pending
      });
      switch (existingOpt) {
        case (?existing) return existing;
        case null ();
      };
    };
    // Rate limiting: max 5 payment attempts per hour
    let oneHourAgo : Int = Time.now() - 3_600_000_000_000;
    let recentCount = PaymentsLib.countRecentByCustomer(paymentsMap, caller, oneHourAgo);
    if (recentCount >= 5) {
      let logIdx = payLogSeq.next;
      payLogSeq.next += 1;
      PaymentsLib.addPaymentLog(
        payLogMap, "PLOG" # logIdx.toText(), "", orderId, caller,
        "rate_limit_exceeded", ""
      );
      return {
        paymentId = "";
        orderId;
        customerId = caller;
        amount = 0;
        status = #Rejected;
        paymentMethod = "";
        proofFileKey = null;
        verifiedAt = null;
        createdAt = Time.now();
        transactionId = "";
        screenshotFileKey = "";
        attemptCount = 0;
        failureReason = ?"rate_limit_exceeded";
        expiredAt = 0;
        updatedAt = Time.now();
        adminId           = null;
        collegeId         = "";
        transactionState  = #Failed;
        timestamp         = Time.now();
        verifiedBy        = null;
        screenshotKey     = null;
        ipAddress         = null;
        deviceInfo        = null;
      };
    };
    let amount : Nat = switch (ordersMap.get(orderId)) {
      case null 0;
      case (?o) o.totalPrice;
    };
    let txnId = PaymentsLib.generateTransactionId(paymentSeq.next);
    let (_, payment) = PaymentsLib.createPayment(
      paymentsMap, paymentSeq, orderId, caller, amount, txnId
    );
    let logIdx = payLogSeq.next;
    payLogSeq.next += 1;
    PaymentsLib.addPaymentLog(
      payLogMap, "PLOG" # logIdx.toText(),
      payment.paymentId, orderId, caller, "payment_submitted", ""
    );
    payment;
  };

  // ── Manual verify (HEAD_ADMIN only) — updates verification record + order ─
  public shared ({ caller }) func verifyPaymentManually(
    transactionId  : Text,
    approve        : Bool,
    reviewNotes    : ?Text
  ) : async { #ok; #err : Text } {
    // Allow HEAD_ADMIN or COLLEGE_ADMIN whose college matches the order
    let callerUser = switch (usersMap.get(caller)) {
      case (?u) u;
      case null return #err("Unauthorized");
    };
    let callerRole = callerUser.role;
    // Find the payment to check college ownership for college admins
    let payment = switch (paymentsMap.values().find(
      func(p : PaymentTypes.Payment) : Bool { p.transactionId == transactionId }
    )) {
      case null return #err("PaymentNotFound");
      case (?p) p;
    };
    // Authorization: databaseAdmin always allowed; collegeAdmin allowed only if same college
    switch (callerRole) {
      case (#databaseAdmin) ();
      case (#collegeAdmin) {
        let orderCollege = switch (ordersMap.get(payment.orderId)) {
          case (?o) o.college;
          case null "";
        };
        let adminCollege = switch (callerUser.collegeId) {
          case (?c) c;
          case null "";
        };
        if (adminCollege == "" or adminCollege != orderCollege) {
          return #err("Unauthorized: college mismatch");
        };
      };
      case (_) return #err("Unauthorized");
    };
    let verifierRoleText = switch (callerRole) {
      case (#databaseAdmin) "DATABASE_ADMIN";
      case (#collegeAdmin)  "COLLEGE_ADMIN";
      case (_)              "UNKNOWN";
    };
    let status = if (approve) "Approved" else "Rejected";
    PaymentsLib.updateVerificationRecord(
      payVerifications, transactionId, status, caller.toText(), reviewNotes
    );
    let now = Time.now();
    if (approve) {
      paymentsMap.add(payment.paymentId, { payment with
        status           = #Verified;
        transactionState = #Verified;
        verifiedAt       = ?now;
        verifiedBy       = ?caller.toText();
        updatedAt        = now;
      });
      // Transition order to ActiveReadyToStart so college admin can claim it
      switch (ordersMap.get(payment.orderId)) {
        case (?o) {
          ordersMap.add(payment.orderId, { o with status = #ActiveReadyToStart; updatedAt = now });
        };
        case null ();
      };
      PaymentsLib.writeVerificationAuditLog(
        payAuditLogs, payAuditSeq,
        "ManualApproval", caller.toText(), verifierRoleText, reviewNotes, now,
        ?transactionId, ?payment.orderId, ?payment.amount
      );
    } else {
      paymentsMap.add(payment.paymentId, { payment with
        status           = #Rejected;
        transactionState = #Cancelled;
        updatedAt        = now;
      });
      // Transition order to Closed after rejection
      switch (ordersMap.get(payment.orderId)) {
        case (?o) {
          ordersMap.add(payment.orderId, { o with status = (#Closed : OrderTypes.OrderStatus); updatedAt = now });
        };
        case null ();
      };
      PaymentsLib.writeVerificationAuditLog(
        payAuditLogs, payAuditSeq,
        "ManualRejection", caller.toText(), verifierRoleText, reviewNotes, now,
        ?transactionId, ?payment.orderId, ?payment.amount
      );
    };
    #ok;
  };

  // ── Upload screenshot (standalone endpoint — triggers notifications) ──────
  public shared ({ caller }) func uploadPaymentScreenshot(
    transactionId : Text,
    screenshotKey : Text
  ) : async { #ok; #err : Text } {
    guardMaintenancePayments(caller);
    if (screenshotKey == "") return #err("ScreenshotKeyRequired");
    // Find payment and attach screenshot
    switch (paymentsMap.values().find(func(p : PaymentTypes.Payment) : Bool { p.transactionId == transactionId })) {
      case null return #err("PaymentNotFound");
      case (?p) {
        paymentsMap.add(p.paymentId, { p with screenshotKey = ?screenshotKey });
        // Update verification record with screenshot URL
        PaymentsLib.attachScreenshotToVerification(payVerifications, transactionId, screenshotKey);
        let now = Time.now();
        let orderCollege : Text = switch (ordersMap.get(p.orderId)) {
          case (?o) o.college;
          case null "";
        };
        let customerName = switch (usersMap.get(caller)) {
          case (?u) u.name;
          case null caller.toText();
        };
        let message = "Payment screenshot uploaded by " # customerName #
          " for order " # p.orderId #
          " (" # orderCollege # "). Amount: " # p.amount.toText();
        // Notify Database Admin
        switch (usersMap.values().find(func(u : UserTypes.User) : Bool { u.role == #databaseAdmin })) {
          case (?ha) {
            ignore NotifsLib.create(notifsMap, notifSeq, ha.userId, #paymentReceived, message, ?transactionId);
          };
          case null ();
        };
        // Notify college admins of the same college
        for (u in usersMap.values()) {
          if (u.role == #collegeAdmin) {
            let matches = switch (u.collegeId) {
              case (?cid) cid == orderCollege;
              case null false;
            };
            if (matches) {
              ignore NotifsLib.create(notifsMap, notifSeq, u.userId, #paymentReceived, message, ?transactionId);
            };
          };
        };
        PaymentsLib.writeAuditLog(
          payAuditLogs, payAuditSeq,
          "ScreenshotUploaded", caller.toText(), ?transactionId, ?p.orderId, ?p.amount, ?screenshotKey
        );
      };
    };
    #ok;
  };

  // ── Get all pending verifications (DATABASE_ADMIN) ───────────────────────
  public shared ({ caller }) func getPaymentVerifications() : async [PaymentTypes.PaymentVerification] {
    switch (usersMap.get(caller)) {
      case (?u) {
        switch (u.role) {
          case (#databaseAdmin) ();
          case (_) Runtime.trap("Unauthorized");
        };
      };
      case null Runtime.trap("Unauthorized");
    };
    PaymentsLib.getPendingVerifications(payVerifications);
  };

  // ── Get pending verifications for own college (COLLEGE_ADMIN) ─────────────
  public shared ({ caller }) func getMyCollegePaymentVerifications() : async [PaymentTypes.PaymentVerification] {
    let adminUser = switch (usersMap.get(caller)) {
      case (?u) u;
      case null Runtime.trap("Unauthorized");
    };
    switch (adminUser.role) {
      case (#collegeAdmin) ();
      case (_) Runtime.trap("Unauthorized");
    };
    let college = switch (adminUser.collegeId) {
      case (?c) c;
      case null return [];
    };
    PaymentsLib.getPendingVerificationsForCollege(payVerifications, paymentsMap, ordersMap, college);
  };

  // ── Verify (legacy admin path) — also updates order status and notifies ───
  public shared ({ caller }) func verifyPayment(id : CommonTypes.PaymentId) : async Bool {
    let result = PaymentsLib.verifyPayment(
      paymentsMap, id, ordersMap, notifsMap, notifSeq
    );
    if (result) {
      let logIdx = payLogSeq.next;
      payLogSeq.next += 1;
      switch (paymentsMap.get(id)) {
        case null ();
        case (?p) {
          PaymentsLib.addPaymentLog(
            payLogMap, "PLOG" # logIdx.toText(),
            id, p.orderId, p.customerId, "payment_verified", ""
          );
          PaymentsLib.writeAuditLog(
            payAuditLogs, payAuditSeq,
            "VerificationSuccess", caller.toText(), ?p.transactionId, ?p.orderId, ?p.amount, null
          );
        };
      };
    };
    result;
  };

  public shared ({ caller }) func rejectPayment(id : CommonTypes.PaymentId) : async Bool {
    let result = PaymentsLib.rejectPayment(paymentsMap, id);
    if (result) {
      let logIdx = payLogSeq.next;
      payLogSeq.next += 1;
      switch (paymentsMap.get(id)) {
        case null ();
        case (?p) {
          PaymentsLib.addPaymentLog(
            payLogMap, "PLOG" # logIdx.toText(),
            id, p.orderId, p.customerId, "payment_rejected", ""
          );
          PaymentsLib.writeAuditLog(
            payAuditLogs, payAuditSeq,
            "VerificationFailed", caller.toText(), ?p.transactionId, ?p.orderId, ?p.amount, null
          );
        };
      };
    };
    result;
  };

  public shared ({ caller }) func getMyPayments() : async [PaymentTypes.Payment] {
    guardMaintenancePayments(caller);
    PaymentsLib.listByCustomer(paymentsMap, caller);
  };

  public shared ({ caller }) func getOrderPayments(orderId : CommonTypes.OrderId) : async [PaymentTypes.Payment] {
    PaymentsLib.listByOrder(paymentsMap, orderId);
  };

  public query func getTotalRevenue() : async Nat {
    PaymentsLib.getTotalRevenue(paymentsMap);
  };

  // ── New: payment logs (admin-facing) ─────────────────────────────────────
  public query func getPaymentLogs() : async [PaymentTypes.PaymentLog] {
    PaymentsLib.getPaymentLogs(payLogMap);
  };

  // ── Poll payment status (full record) ────────────────────────────────────
  public query func pollPaymentStatus(
    paymentId : Text
  ) : async {
    status           : Text;
    transactionId    : Text;
    transactionState : Text;
    verifiedAt       : ?Int;
    failureReason    : ?Text;
    expiredAt        : Int;
  } {
    switch (paymentsMap.get(paymentId)) {
      case null {
        {
          status           = "not_found";
          transactionId    = "";
          transactionState = "not_found";
          verifiedAt       = null;
          failureReason    = null;
          expiredAt        = 0;
        };
      };
      case (?p) {
        let statusText = switch (p.status) {
          case (#Pending)  "pending";
          case (#Verified) "verified";
          case (#Rejected) {
            switch (p.failureReason) {
              case (?fr) if (fr == "expired") "expired" else "rejected";
              case null "rejected";
            };
          };
        };
        let stateText = switch (p.transactionState) {
          case (#Created)    "created";
          case (#Pending)    "pending";
          case (#Processing) "processing";
          case (#Verified)   "verified";
          case (#Failed)     "failed";
          case (#Cancelled)  "cancelled";
          case (#Refunded)   "refunded";
        };
        {
          status           = statusText;
          transactionId    = p.transactionId;
          transactionState = stateText;
          verifiedAt       = p.verifiedAt;
          failureReason    = p.failureReason;
          expiredAt        = p.expiredAt;
        };
      };
    };
  };

  // ── Get all payments for an order (sorted newest-first) ───────────────────
  public query func getPaymentsByOrder(
    orderId : Text
  ) : async [PaymentTypes.Payment] {
    PaymentsLib.listByOrder(paymentsMap, orderId);
  };

  // ── Get PaymentVerification by transactionId ──────────────────────────────
  public query func getPaymentVerification(
    transactionId : Text
  ) : async ?PaymentTypes.PaymentVerification {
    PaymentsLib.getVerificationByTxn(payVerifications, transactionId);
  };

  // ── Get recent audit logs (DATABASE_ADMIN only) ───────────────────────────
  public shared ({ caller }) func getPaymentAuditLogs(
    limit : Nat
  ) : async [PaymentTypes.PaymentAuditLog] {
    switch (usersMap.get(caller)) {
      case (?u) {
        switch (u.role) {
          case (#databaseAdmin) ();
          case (_) Runtime.trap("Unauthorized");
        };
      };
      case null Runtime.trap("Unauthorized");
    };
    PaymentsLib.getRecentAuditLogs(payAuditLogs, limit);
  };

  // ── Transaction dashboard stats (HEAD_ADMIN only) ─────────────────────────
  public query func getTransactionDashboardStats() : async {
    totalRevenue           : Nat;
    pendingVerifications   : Nat;
    failedPayments         : Nat;
    successfulTransactions : Nat;
    recentTransactions     : [PaymentTypes.Payment];
  } {
    PaymentsLib.getTransactionDashboardStats(paymentsMap);
  };

  // ── College-wise revenue stats ────────────────────────────────────────────
  public query func getCollegeRevenueStats() : async [(Text, Nat)] {
    PaymentsLib.getCollegeRevenueStats(paymentsMap, ordersMap);
  };

  // ── Admin-wise revenue stats ──────────────────────────────────────────────
  public query func getAdminRevenueStats() : async [(Text, Nat)] {
    PaymentsLib.getAdminRevenueStats(paymentsMap, ordersMap);
  };
};
