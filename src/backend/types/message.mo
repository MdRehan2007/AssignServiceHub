import Common "common";
import UserTypes "user";

module {
  public type Message = {
    messageId  : Common.MessageId;
    orderId    : Common.OrderId;
    senderId   : Common.UserId;
    senderName : Text;
    senderRole : UserTypes.UserRole;
    text       : Text;
    fileKeys   : [Text];
    timestamp  : Common.Timestamp;
    isRead     : Bool;
    isDeleted  : Bool;
  };
};
