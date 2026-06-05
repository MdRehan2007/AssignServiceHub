import Map "mo:core/Map";
import OrderTypes "../types/order";
import UserTypes "../types/user";
import PaymentTypes "../types/payment";
import AnalyticsTypes "../types/analytics";
import CommonTypes "../types/common";
import AnalyticsLib "../lib/analytics";

mixin (
  ordersMap : Map.Map<CommonTypes.OrderId, OrderTypes.Order>,
  usersMap : Map.Map<CommonTypes.UserId, UserTypes.User>,
  paymentsMap : Map.Map<CommonTypes.PaymentId, PaymentTypes.Payment>
) {
  public query func getDashboardSummary() : async AnalyticsTypes.DashboardSummary {
    AnalyticsLib.getDashboardSummary(ordersMap, usersMap, paymentsMap);
  };

  public query func getOrdersByStatus() : async [{ status : Text; count : Nat }] {
    var pending = 0;
    var verification = 0;
    var assigned = 0;
    var inprogress = 0;
    var review = 0;
    var correction = 0;
    var completed = 0;
    var delivered = 0;
    var closed = 0;

    for (o in ordersMap.values()) {
      switch (o.status) {
        case (#PendingPaymentVerification) { pending += 1 };
        case (#ActiveReadyToStart) { verification += 1 };
        case (#Assigned) { assigned += 1 };
        case (#InProgress) { inprogress += 1 };
        case (#Review) { review += 1 };
        case (#Correction) { correction += 1 };
        case (#Completed) { completed += 1 };
        case (#Delivered) { delivered += 1 };
        case (#Closed) { closed += 1 };
      };
    };

    [
      { status = "PendingPaymentVerification"; count = pending },
      { status = "ActiveReadyToStart"; count = verification },
      { status = "Assigned"; count = assigned },
      { status = "InProgress"; count = inprogress },
      { status = "Review"; count = review },
      { status = "Correction"; count = correction },
      { status = "Completed"; count = completed },
      { status = "Delivered"; count = delivered },
      { status = "Closed"; count = closed },
    ];
  };

  public query func getRevenueByCollege() : async [{ college : Text; revenue : Nat }] {
    let collegeRevMap = Map.empty<Text, Nat>();
    for (o in ordersMap.values()) {
      // Only count revenue for Delivered orders where revenueRecorded flag is set
      if (o.status == #Delivered and o.revenueRecorded) {
        let prev = switch (collegeRevMap.get(o.college)) { case (?v) v; case null 0 };
        collegeRevMap.add(o.college, prev + o.totalPrice);
      };
    };
    collegeRevMap.entries().map<(Text, Nat), { college : Text; revenue : Nat }>(func((college, revenue)) {
      { college; revenue }
    }).toArray();
  };
};
