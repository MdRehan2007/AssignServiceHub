import Map "mo:core/Map";
import OrderTypes "../types/order";
import CommonTypes "../types/common";
import SettingsTypes "../types/settings";
import CollegeTypes "../types/college";
import PaymentTypes "../types/payment";
import OrdersLib "../lib/orders";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import UserTypes2 "../types/user";

mixin (
  ordersMap : Map.Map<CommonTypes.OrderId, OrderTypes.Order>,
  orderSeq : { var next : Nat },
  dailyOrderSeq : Map.Map<Text, Nat>,
  settingsRef : { var current : SettingsTypes.SystemSettings },
  collegesMap : Map.Map<CommonTypes.CollegeId, CollegeTypes.College>,
  collegeSeq : { var next : Nat },
  usersMapOrders : Map.Map<CommonTypes.UserId, UserTypes2.User>,
  paymentsMapOrders : Map.Map<CommonTypes.PaymentId, PaymentTypes.Payment>
) {
  let HEAD_ADMIN_EMAIL_ORDERS : Text = "mhdrihan2007@gmail.com";

  func isHeadAdminOrder(caller : Principal) : Bool {
    switch (usersMapOrders.get(caller)) {
      case (?u) u.email == HEAD_ADMIN_EMAIL_ORDERS or u.role == #databaseAdmin;
      case null false;
    };
  };

  func guardMaintenanceOrders(caller : Principal) {
    if (settingsRef.current.maintenanceMode and not isHeadAdminOrder(caller)) {
      Runtime.trap("Website is under maintenance. Please try again later.");
    };
  };
  public shared ({ caller }) func placeOrder(
    customerPhone        : Text,
    serviceType          : OrderTypes.ServiceType,
    subject              : Text,
    deadline             : CommonTypes.Timestamp,
    description          : Text,
    urgentFlag           : Bool,
    pages                : Nat,
    fileKeys             : [Text],
    materialChoice       : ?Text,
    materialChargeAmount : Nat
  ) : async OrderTypes.Order {
    guardMaintenanceOrders(caller);
    // Look up caller's registered college to ensure it exists in the map;
    // if the college ID points to an unknown entry, it will gracefully fall back
    // to "ORD<seq>" inside createOrder.
    let (_, order) = OrdersLib.createOrder(
      ordersMap, orderSeq, dailyOrderSeq, collegesMap,
      usersMapOrders, caller, customerPhone, serviceType, subject,
      deadline, description, urgentFlag, pages, fileKeys,
      settingsRef.current.servicePrices,
      materialChoice, materialChargeAmount
    );
    order;
  };

  public shared ({ caller }) func getOrder(id : CommonTypes.OrderId) : async ?OrderTypes.Order {
    OrdersLib.getOrder(ordersMap, id);
  };

  /// Update order status.  When transitioning to #Delivered:
  ///  - revenue is added to analytics exactly once (revenueRecorded flag)
  ///  - the #Delivered state is FINAL — further status changes to non-terminal
  ///    states are rejected on the backend.
  public shared ({ caller }) func updateOrderStatus(id : CommonTypes.OrderId, status : OrderTypes.OrderStatus) : async Bool {
    switch (ordersMap.get(id)) {
      case null false;
      case (?o) {
        // #Delivered is a terminal state — no rollback allowed
        if (o.status == #Delivered) return false;
        let now = Time.now();
        // When transitioning to #Delivered, set revenueRecorded
        let revenueRecorded : Bool = switch (status) {
          case (#Delivered) {
            // Only record revenue once and only if payment is verified
            if (not o.revenueRecorded) {
              let hasVerifiedPayment = paymentsMapOrders.values().find(
                func(p : PaymentTypes.Payment) : Bool {
                  p.orderId == id and p.status == #Verified
                }
              ) != null;
              hasVerifiedPayment;
            } else {
              true; // already recorded
            };
          };
          case _ o.revenueRecorded;
        };
        ordersMap.add(id, { o with status; revenueRecorded; updatedAt = now });
        true;
      };
    };
  };

  /// Atomic order acceptance — first admin wins, others get false.
  public shared ({ caller }) func acceptOrder(
    id        : CommonTypes.OrderId,
    adminName : Text
  ) : async Bool {
    guardMaintenanceOrders(caller);
    OrdersLib.acceptOrder(ordersMap, id, caller, adminName);
  };

  /// Head Admin: force-reassign an order to a different admin.
  public shared ({ caller }) func forceReassignOrder(
    id           : CommonTypes.OrderId,
    newAdminId   : CommonTypes.UserId,
    newAdminName : Text,
    reason       : Text
  ) : async Bool {
    OrdersLib.forceReassign(ordersMap, id, newAdminId, newAdminName);
  };

  /// Admin: mark payment as settled for an order.
  public shared ({ caller }) func settleOrderPayment(id : CommonTypes.OrderId) : async Bool {
    switch (ordersMap.get(id)) {
      case null false;
      case (?o) {
        ordersMap.add(id, { o with paymentSettlementStatus = #Settled; updatedAt = Time.now() });
        true;
      };
    };
  };

  /// Admin: update delivery status and increment revision count.
  public shared ({ caller }) func uploadDelivery(
    id      : CommonTypes.OrderId,
    fileKeys : [Text]
  ) : async Bool {
    guardMaintenanceOrders(caller);
    switch (ordersMap.get(id)) {
      case null false;
      case (?o) {
        ordersMap.add(id, {
          o with
          submissionFiles = o.submissionFiles.concat(fileKeys);
          deliveryStatus  = #Delivered;
          revisionCount   = o.revisionCount + 1;
          status          = #Delivered;
          updatedAt       = Time.now();
        });
        true;
      };
    };
  };

  /// List orders for a specific admin (accepted by them).
  /// List orders for a specific admin (accepted by them) AND pending payment orders for their college.
  public shared ({ caller }) func getAdminOrders() : async [OrderTypes.Order] {
    // Find the caller's college so we can include pending-payment orders
    let callerCollegeOpt : ?Text = switch (usersMapOrders.get(caller)) {
      case (?u) u.collegeId;
      case null null;
    };
    ordersMap.values().filter(func(o : OrderTypes.Order) : Bool {
      // Always include orders this admin has accepted
      let isAssigned = switch (o.adminId) { case (?aid) aid == caller; case null false };
      if (isAssigned) return true;
      // Also include PendingPaymentVerification orders for the same college (read-only view)
      switch (o.status) {
        case (#PendingPaymentVerification) {
          switch (callerCollegeOpt) {
            case (?col) o.college == col;
            case null false;
          };
        };
        case (_) false;
      };
    }).toArray();
  };

  /// List orders for a specific college (head admin / analytics).
  public shared ({ caller }) func getOrdersByCollege(college : Text) : async [OrderTypes.Order] {
    ordersMap.values().filter(func(o : OrderTypes.Order) : Bool { o.college == college }).toArray();
  };

  public shared ({ caller }) func getMyOrders() : async [OrderTypes.Order] {
    guardMaintenanceOrders(caller);
    OrdersLib.listByCustomer(ordersMap, caller);
  };

  public shared ({ caller }) func getAllOrders() : async [OrderTypes.Order] {
    OrdersLib.listAll(ordersMap);
  };

  public query func estimatePrice(
    serviceType : OrderTypes.ServiceType,
    urgent      : Bool,
    pages       : Nat
  ) : async { base : Nat; urgency : Nat; paperCharge : Nat; total : Nat } {
    OrdersLib.calcPrice(serviceType, urgent, pages, settingsRef.current.servicePrices);
  };
};
