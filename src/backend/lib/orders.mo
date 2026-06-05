import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Types "../types/order";
import Common "../types/common";
import SettingsTypes "../types/settings";
import CollegeTypes "../types/college";
import UserTypes "../types/user";

module {
  public type OrderMap = Map.Map<Common.OrderId, Types.Order>;

  public func calcPrice(
    serviceType : Types.ServiceType,
    urgent      : Bool,
    pages       : Nat,
    prices      : [SettingsTypes.ServicePriceEntry]
  ) : { base : Nat; urgency : Nat; paperCharge : Nat; total : Nat } {
    // Find the matching pricing entry; fall back to zero if not configured
    var base       : Nat = 0;
    var urgency    : Nat = 0;
    var pcEnabled  : Bool = false;
    var pcPerPage  : Nat = 0;
    for (entry in prices.vals()) {
      if (entry.serviceType == serviceType) {
        base      := entry.basePrice;
        urgency   := if (urgent) entry.urgencyCharge else 0;
        pcEnabled := entry.paperChargeEnabled;
        pcPerPage := entry.paperChargePerPage;
      };
    };
    let paperCharge = if (pcEnabled) pages * pcPerPage else 0;
    { base; urgency; paperCharge; total = base + urgency + paperCharge };
  };

  /// Format a daily sequence number: min 3 digits with zero-padding, no cap.
  func fmtSeq(n : Nat) : Text {
    let raw = n.toText();
    if (raw.size() < 3) {
      var pad = "";
      var i = raw.size();
      while (i < 3) { pad #= "0"; i += 1; };
      pad # raw
    } else {
      raw
    };
  };

  public func createOrder(
    map             : OrderMap,
    seq             : { var next : Nat },
    collegeOrderSeq : Map.Map<Text, Nat>,
    collegesMap     : Map.Map<Common.CollegeId, CollegeTypes.College>,
    usersMap        : Map.Map<Common.UserId, UserTypes.User>,
    customerId      : Common.UserId,
    customerPhone   : Text,
    serviceType     : Types.ServiceType,
    subject         : Text,
    deadline        : Common.Timestamp,
    description     : Text,
    urgentFlag           : Bool,
    pages                : Nat,
    fileKeys             : [Text],
    prices               : [SettingsTypes.ServicePriceEntry],
    materialChoice       : ?Text,
    materialChargeAmount : Nat
  ) : (Nat, Types.Order) {
    // Resolve customer's registered college
    let collegeName : Text = switch (usersMap.get(customerId)) {
      case (?u) {
        switch (u.registeredCollegeId) {
          case (?cid) {
            switch (collegesMap.get(cid)) {
              case (?c) c.collegeName;
              case null cid;
            };
          };
          case null "";
        };
      };
      case null "";
    };

    // Resolve college code for tracking ID
    func firstThreeUpper(t : Text) : Text {
      let chars = t.toArray();
      let n = if (chars.size() >= 3) 3 else chars.size();
      var result = "";
      var i = 0;
      while (i < n) { result #= Text.fromChar(chars[i]).toUpper(); i += 1; };
      result
    };
    let collegeCode : Text = switch (usersMap.get(customerId)) {
      case (?u) {
        switch (u.registeredCollegeId) {
          case (?cid) {
            switch (collegesMap.get(cid)) {
              case (?c) c.collegeCode;
              case null firstThreeUpper(cid);
            };
          };
          case null "MISC";
        };
      };
      case null "MISC";
    };

    // Increment per-college sequence
    let colSeq : Nat = switch (collegeOrderSeq.get(collegeCode)) {
      case (?n) n + 1;
      case null 1;
    };
    collegeOrderSeq.add(collegeCode, colSeq);

    // Global sequence for internal reference
    let globalSeq = seq.next;
    seq.next += 1;

    // Tracking ID: collegeCode + zero-padded sequence
    let orderId = collegeCode # fmtSeq(colSeq);

    // Price calculation
    let pricing = calcPrice(serviceType, urgentFlag, pages, prices);

    let now = Time.now();
    let order : Types.Order = {
      orderId;
      revenueRecorded         = false;
      customerId;
      customerPhone           = if (customerPhone == "") null else ?customerPhone;
      serviceType;
      subject;
      college                 = collegeName;
      customCollege           = null;
      deadline;
      description;
      urgentFlag;
      basePrice               = pricing.base;
      urgencyCharge           = pricing.urgency;
      pageCount               = pages;
      paperChargeAmount       = pricing.paperCharge;
      materialChoice;
      materialChargeAmount;
      totalPrice              = pricing.total + materialChargeAmount;
      status                  = #PendingPaymentVerification;
      fileKeys;
      adminMessages           = [];
      submissionFiles         = [];
      adminId                 = null;
      acceptedByAdminId       = null;
      acceptedByAdminName     = null;
      acceptedAt              = null;
      assignmentLockStatus    = #Unlocked;
      revisionCount           = 0;
      paymentSettlementStatus = #Pending;
      deliveryStatus          = #NotDelivered;
      createdAt               = now;
      updatedAt               = now;
    };
    map.add(orderId, order);
    (globalSeq, order);
  };

  public func getOrder(map : OrderMap, id : Common.OrderId) : ?Types.Order {
    map.get(id);
  };

  public func updateStatus(map : OrderMap, id : Common.OrderId, status : Types.OrderStatus) : Bool {
    switch (map.get(id)) {
      case null false;
      case (?o) {
        map.add(id, { o with status; updatedAt = Time.now() });
        true;
      };
    };
  };

  /// Atomically accept an order — succeeds only if currently #Unlocked.
  /// Returns true if this caller was first; false if already locked.
  public func acceptOrder(
    map       : OrderMap,
    id        : Common.OrderId,
    adminId   : Common.UserId,
    adminName : Text
  ) : Bool {
    switch (map.get(id)) {
      case null false;
      case (?o) {
        if (o.assignmentLockStatus == #Locked) return false;
        let now = Time.now();
        map.add(id, {
          o with
          adminId = ?adminId;
          acceptedByAdminId = ?adminId.toText();
          acceptedByAdminName = ?adminName;
          acceptedAt = ?now;
          assignmentLockStatus = #Locked;
          status = #Assigned;
          updatedAt = now;
        });
        true;
      };
    };
  };

  /// Force-reassign an order to a new admin (Head Admin only).
  public func forceReassign(
    map           : OrderMap,
    id            : Common.OrderId,
    newAdminId    : Common.UserId,
    newAdminName  : Text
  ) : Bool {
    switch (map.get(id)) {
      case null false;
      case (?o) {
        let now = Time.now();
        map.add(id, {
          o with
          adminId = ?newAdminId;
          acceptedByAdminId = ?newAdminId.toText();
          acceptedByAdminName = ?newAdminName;
          acceptedAt = ?now;
          assignmentLockStatus = #Locked;
          updatedAt = now;
        });
        true;
      };
    };
  };

  public func listByCustomer(map : OrderMap, cid : Common.UserId) : [Types.Order] {
    map.values().filter(func(o : Types.Order) : Bool {
      o.customerId == cid
    }).toArray();
  };

  public func listAll(map : OrderMap) : [Types.Order] {
    map.values().toArray();
  };
};
