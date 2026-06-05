module {
  public type OrderAnalytics = {
    totalOrders     : Nat;
    pendingOrders   : Nat;
    completedOrders : Nat;
    deliveredOrders : Nat;
    totalRevenue    : Nat;
  };

  public type CollegeAnalytics = {
    collegeId    : Text;
    collegeName  : Text;
    totalOrders  : Nat;
    totalRevenue : Nat;
    activeOrders : Nat;
  };

  public type WriterAnalytics = {
    writerId        : Principal;
    writerName      : Text;
    assignedOrders  : Nat;
    completedOrders : Nat;
  };

  public type DashboardSummary = {
    orderStats   : OrderAnalytics;
    collegeStats : [CollegeAnalytics];
    writerStats  : [WriterAnalytics];
    totalUsers   : Nat;
    totalColleges: Nat;
  };
};
