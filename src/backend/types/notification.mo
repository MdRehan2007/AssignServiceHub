import Common "common";

module {
  public type NotificationType = {
    #newOrder;
    #orderAccepted;
    #paymentReceived;
    #deliveryUploaded;
    #revisionRequested;
    #orderCompleted;
    #orderReassigned;
    #general;
  };

  public type Notification = {
    notifId    : Common.NotifId;
    userId     : Common.UserId;
    notifType  : NotificationType;
    message    : Text;
    relatedId  : ?Text;  // orderId or other reference
    isRead     : Bool;
    createdAt  : Common.Timestamp;
  };
};
