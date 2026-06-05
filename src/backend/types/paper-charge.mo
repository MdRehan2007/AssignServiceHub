import OrderTypes "order";

module {
  /// Configuration for paper charges for a single service type.
  public type PaperChargeConfig = {
    serviceType        : OrderTypes.ServiceType;
    paperChargeEnabled : Bool;
    paperChargePerPage : Nat;   // in ₹, e.g. 2 = ₹2/page
  };

  /// Request type for DBA to update paper charge settings.
  public type PaperChargeUpdate = {
    serviceType        : OrderTypes.ServiceType;
    paperChargeEnabled : Bool;
    paperChargePerPage : Nat;
  };
};
