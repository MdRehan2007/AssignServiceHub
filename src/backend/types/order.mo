import Common "common";

module {
  public type ServiceType = {
    #HardCopy;
    #SoftCopy;
    #RecordWriting;
    #NotesWriting;
  };

  public type OrderStatus = {
    #PendingPaymentVerification; // initial status — placed but payment not yet verified
    #ActiveReadyToStart;         // payment verified — admin can begin work
    #Assigned;
    #InProgress;
    #Review;
    #Correction;
    #Completed;
    #Delivered;
    #Closed;
  };

  public type LockStatus = {
    #Unlocked;
    #Locked;
  };

  public type DeliveryStatus = {
    #NotDelivered;
    #Delivered;
  };

  public type PaymentSettlementStatus = {
    #Pending;
    #Settled;
  };

  public type Order = {
    orderId                  : Common.OrderId;
    revenueRecorded          : Bool;   // true once delivered-revenue has been added to analytics (no rollback)
    customerId               : Common.UserId;
    customerPhone            : ?Text;
    serviceType              : ServiceType;
    subject                  : Text;
    college                  : Text;
    customCollege            : ?Text;
    deadline                 : Common.Timestamp;
    description              : Text;
    urgentFlag               : Bool;
    basePrice                : Nat;
    urgencyCharge            : Nat;
    pageCount                : Nat;          // number of pages (0 when paper charges not applicable)
    paperChargeAmount        : Nat;          // pageCount × paperChargePerPage (0 when disabled)
    materialChoice           : ?Text;        // "selfRecord"|"buyRecord"|"selfNotebook"|"buyNotebook"|null
    materialChargeAmount     : Nat;          // flat material price added when customer buys material
    totalPrice               : Nat;
    status                   : OrderStatus;
    fileKeys                 : [Text];
    adminMessages            : [Text];  // MessageId references
    submissionFiles          : [Text];
    adminId                  : ?Common.UserId;  // accepted admin
    acceptedByAdminId        : ?Text;           // Text form of accepted admin principal
    acceptedByAdminName      : ?Text;
    acceptedAt               : ?Common.Timestamp;
    assignmentLockStatus     : LockStatus;
    revisionCount            : Nat;
    paymentSettlementStatus  : PaymentSettlementStatus;
    deliveryStatus           : DeliveryStatus;
    createdAt                : Common.Timestamp;
    updatedAt                : Common.Timestamp;
  };

  public type PricingRule = {
    serviceType        : ServiceType;
    basePrice          : Nat;
    urgencyCharge      : Nat;
    paperChargeEnabled : Bool;
    paperChargePerPage : Nat;
  };

  // Pricing constants
  public let DEFAULT_PRICING : [PricingRule] = [
    { serviceType = #HardCopy;      basePrice = 500; urgencyCharge = 150; paperChargeEnabled = true;  paperChargePerPage = 2 },
    { serviceType = #SoftCopy;      basePrice = 300; urgencyCharge = 100; paperChargeEnabled = false; paperChargePerPage = 0 },
    { serviceType = #RecordWriting; basePrice = 800; urgencyCharge = 200; paperChargeEnabled = true;  paperChargePerPage = 3 },
    { serviceType = #NotesWriting;  basePrice = 400; urgencyCharge = 120; paperChargeEnabled = false; paperChargePerPage = 0 },
  ];
};
