import Map "mo:core/Map";
import Iter "mo:core/Iter";
import OrderTypes "../types/order";
import UserTypes "../types/user";
import PaymentTypes "../types/payment";
import AnalyticsTypes "../types/analytics";
import Common "../types/common";

module {
  public func getDashboardSummary(
    ordersMap : Map.Map<Common.OrderId, OrderTypes.Order>,
    usersMap : Map.Map<Common.UserId, UserTypes.User>,
    paymentsMap : Map.Map<Common.PaymentId, PaymentTypes.Payment>
  ) : AnalyticsTypes.DashboardSummary {
    var totalOrders = 0;
    var completedOrders = 0;
    var deliveredOrders = 0;
    var activeOrders = 0;
    var totalRevenue = 0;
    var pendingOrders = 0;

    ordersMap.values().forEach(func(o : OrderTypes.Order) {
      totalOrders += 1;
      switch (o.status) {
        case (#Completed) { completedOrders += 1 };
        case (#Delivered) {
          deliveredOrders += 1;
          completedOrders += 1;
          // Revenue counted only once when revenueRecorded flag is set on Delivered orders
          if (o.revenueRecorded) {
            totalRevenue += o.totalPrice;
          };
        };
        case (#Closed) { completedOrders += 1 };
        case (#InProgress) { activeOrders += 1 };
        case (#Review) { activeOrders += 1 };
        case (#Correction) { activeOrders += 1 };
        case (#Assigned) { activeOrders += 1 };
        case (#PendingPaymentVerification) { pendingOrders += 1 };
        case (#ActiveReadyToStart) { pendingOrders += 1 };
      }
    });

    let totalUsers = usersMap.size();

    let totalColleges = usersMap.values().filter(func(u : UserTypes.User) : Bool {
      switch (u.role) { case (#collegeAdmin) true; case _ false }
    }).size();

    {
      orderStats = {
        totalOrders;
        pendingOrders;
        completedOrders;
        deliveredOrders;
        totalRevenue;
      };
      collegeStats = [];
      writerStats = [];
      totalUsers;
      totalColleges;
    };
  };
};
