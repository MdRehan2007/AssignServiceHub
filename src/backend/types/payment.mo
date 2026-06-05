import Common "common";

module {
  public type PaymentStatus = {
    #Pending;
    #Verified;
    #Rejected;
  };

  // Full transaction lifecycle state
  public type TransactionState = {
    #Created;
    #Pending;
    #Processing;
    #Verified;
    #Failed;
    #Cancelled;
    #Refunded;
  };

  public type Payment = {
    paymentId         : Common.PaymentId;   // primary key
    transactionId     : Text;               // unique
    orderId           : Common.OrderId;     // FK → Order
    customerId        : Common.UserId;      // FK → User
    adminId           : ?Text;              // FK → Admin (text form of principal)
    collegeId         : Text;
    amount            : Nat;
    paymentMethod     : Text;
    status            : PaymentStatus;
    transactionState  : TransactionState;
    timestamp         : Int;               // alias for createdAt (for compat)
    createdAt         : Common.Timestamp;
    updatedAt         : Int;
    verifiedAt        : ?Common.Timestamp;
    verifiedBy        : ?Text;
    failureReason     : ?Text;
    screenshotKey     : ?Text;
    attemptCount      : Nat;
    ipAddress         : ?Text;
    deviceInfo        : ?Text;
    // legacy compat fields
    proofFileKey      : ?Text;
    screenshotFileKey : Text;
    expiredAt         : Int;
  };

  public type PaymentVerification = {
    verificationId     : Text;
    transactionId      : Text;    // FK → Payment.transactionId
    screenshotUrl      : ?Text;
    verificationStatus : Text;    // "Pending" | "Approved" | "Rejected"
    reviewedBy         : ?Text;
    reviewTimestamp    : ?Int;
    reviewNotes        : ?Text;
    submittedAt        : Int;
  };

  public type PaymentAuditLog = {
    logId       : Text;
    transactionId : ?Text;
    action      : Text;   // "PaymentAttempt"|"VerificationSuccess"|"VerificationFailed"|"ManualApproval"|"ManualRejection"|"DuplicateAttemptBlocked"
    actorId     : Text;
    orderId     : ?Text;
    amount      : ?Nat;
    ipAddress   : ?Text;
    deviceInfo  : ?Text;
    timestamp   : Int;
    details     : ?Text;
  };

  public type PaymentLog = {
    logId        : Text;
    paymentId    : Text;
    orderId      : Text;
    customerId   : Common.UserId;
    reason       : Text;
    timestamp    : Int;
    adminRemarks : Text;
  };
};
