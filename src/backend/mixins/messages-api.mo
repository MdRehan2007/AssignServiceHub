import Map "mo:core/Map";
import MessageTypes "../types/message";
import UserTypes "../types/user";
import CommonTypes "../types/common";
import NotifTypes "../types/notification";
import MessagesLib "../lib/messages";
import NotifLib "../lib/notifications";
import UsersLib "../lib/users";
import OrderTypes "../types/order";

mixin (
  messagesMap : Map.Map<CommonTypes.MessageId, MessageTypes.Message>,
  messageSeq : { var next : Nat },
  usersMap : Map.Map<CommonTypes.UserId, UserTypes.User>,
  ordersMapChat : Map.Map<CommonTypes.OrderId, OrderTypes.Order>,
  notifsMap : Map.Map<CommonTypes.NotifId, NotifTypes.Notification>,
  notifSeqChat : { var next : Nat }
) {
  public shared ({ caller }) func sendMessage(
    orderId : CommonTypes.OrderId,
    text : Text,
    fileKeys : [Text]
  ) : async MessageTypes.Message {
    let (senderName, senderRole) = switch (UsersLib.getUser(usersMap, caller)) {
      case null ("Unknown", #customer);
      case (?u) (u.name, u.role);
    };
    let (_, msg) = MessagesLib.sendMessage(
      messagesMap, messageSeq, orderId, caller, senderName, senderRole, text, fileKeys
    );
    // Resolve order participants for notifications
    switch (ordersMapChat.get(orderId)) {
      case null {};
      case (?order) {
        let notifMsg = senderName # " sent a message on order " # orderId;
        switch senderRole {
          case (#customer) {
            // Notify assigned admin if present
            switch (order.adminId) {
              case null {};
              case (?aid) {
                ignore NotifLib.create(notifsMap, notifSeqChat, aid, #general, notifMsg, ?orderId);
              };
            };
            // Notify all database admins
            for ((_, u) in usersMap.entries()) {
              if (u.role == #databaseAdmin) {
                ignore NotifLib.create(notifsMap, notifSeqChat, u.userId, #general, notifMsg, ?orderId);
              };
            };
          };
          case (#collegeAdmin) {
            // Notify the order customer
            ignore NotifLib.create(notifsMap, notifSeqChat, order.customerId, #general, notifMsg, ?orderId);
            // Also notify database admins
            for ((_, u) in usersMap.entries()) {
              if (u.role == #databaseAdmin) {
                ignore NotifLib.create(notifsMap, notifSeqChat, u.userId, #general, notifMsg, ?orderId);
              };
            };
          };
          case (#databaseAdmin) {
            // Notify the order customer
            ignore NotifLib.create(notifsMap, notifSeqChat, order.customerId, #general, notifMsg, ?orderId);
            // Notify assigned admin if present
            switch (order.adminId) {
              case null {};
              case (?aid) {
                if (aid != caller) {
                  ignore NotifLib.create(notifsMap, notifSeqChat, aid, #general, notifMsg, ?orderId);
                };
              };
            };
          };
        };
      };
    };
    msg;
  };

  /// Returns messages for an order, filtered to only the permitted participants:
  /// the order customer, the assigned admin, and any databaseAdmin.
  /// Returns messages for an order, filtered to only the permitted participants:
  /// the order customer, the assigned admin, and any databaseAdmin.
  public shared ({ caller }) func getOrderMessages(orderId : CommonTypes.OrderId) : async [MessageTypes.Message] {
    let callerRole = switch (UsersLib.getUser(usersMap, caller)) {
      case null #customer;
      case (?u) u.role;
    };
    let (assignedAdminId, customerId) : (?CommonTypes.UserId, CommonTypes.UserId) = switch (ordersMapChat.get(orderId)) {
      case null (null, caller);
      case (?o) (o.adminId, o.customerId);
    };
    // Additional access gate: customer may only see messages on their own order
    if (callerRole == #customer and customerId != caller) return [];
    MessagesLib.listByOrderForCaller(messagesMap, orderId, caller, callerRole, assignedAdminId);
  };

  public shared ({ caller }) func markMessageRead(id : CommonTypes.MessageId) : async Bool {
    MessagesLib.markRead(messagesMap, id);
  };

  public query func getUnreadCount(orderId : CommonTypes.OrderId) : async Nat {
    MessagesLib.countUnread(messagesMap, orderId);
  };
  /// Delete a message (soft-delete). Each user may delete only their own messages;
  /// DatabaseAdmin may delete any message.
  public shared ({ caller }) func deleteMessage(id : CommonTypes.MessageId) : async { #ok; #err : Text } {
    let callerRole = switch (UsersLib.getUser(usersMap, caller)) {
      case null #customer;
      case (?u) u.role;
    };
    MessagesLib.deleteMessage(messagesMap, id, caller, callerRole);
  };
};
