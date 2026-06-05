import Map "mo:core/Map";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Types "../types/message";
import UserTypes "../types/user";
import Common "../types/common";

module {
  public type MessageMap = Map.Map<Common.MessageId, Types.Message>;

  public func sendMessage(
    map : MessageMap,
    seq : { var next : Nat },
    orderId : Common.OrderId,
    senderId : Common.UserId,
    senderName : Text,
    senderRole : UserTypes.UserRole,
    text : Text,
    fileKeys : [Text]
  ) : (Nat, Types.Message) {
    let idx = seq.next;
    seq.next += 1;
    let id = "MSG" # idx.toText();
    let msg : Types.Message = {
      messageId = id;
      orderId;
      senderId;
      senderName;
      senderRole;
      text;
      fileKeys;
      timestamp = Time.now();
      isRead = false;
      isDeleted = false;
    };
    map.add(id, msg);
    (idx, msg);
  };

  /// Return messages for an order, filtered by role-based visibility.
  /// Only the customer, the assigned admin (assignedAdminId), and any
  /// databaseAdmin are permitted to read. Deleted messages are excluded.
  public func listByOrderForCaller(
    map            : MessageMap,
    orderId        : Common.OrderId,
    caller         : Common.UserId,
    callerRole     : UserTypes.UserRole,
    assignedAdminId : ?Common.UserId
  ) : [Types.Message] {
    map.values().filter(func(m : Types.Message) : Bool {
      if (m.orderId != orderId or m.isDeleted) return false;
      switch callerRole {
        case (#databaseAdmin) true;
        case (#customer) true;  // customer ownership verified at API layer
        case (#collegeAdmin) {
          switch assignedAdminId {
            case (?aid) aid == caller;
            case null false;
          };
        };
      };
    }).toArray();
  };

  public func listByOrder(map : MessageMap, orderId : Common.OrderId) : [Types.Message] {
    map.values().filter(func(m : Types.Message) : Bool {
      m.orderId == orderId and not m.isDeleted
    }).toArray();
  };

  public func markRead(map : MessageMap, id : Common.MessageId) : Bool {
    switch (map.get(id)) {
      case null false;
      case (?m) {
        map.add(id, { m with isRead = true });
        true;
      };
    };
  };

  public func countUnread(map : MessageMap, orderId : Common.OrderId) : Nat {
    map.values().filter(func(m : Types.Message) : Bool {
      m.orderId == orderId and not m.isRead and not m.isDeleted
    }).size();
  };

  /// Hard-delete a message.
  /// Customer and CollegeAdmin may only delete their own messages.
  /// DatabaseAdmin may delete any message.
  /// Returns #ok on success, #err with reason on failure.
  public func deleteMessage(
    map        : MessageMap,
    id         : Common.MessageId,
    caller     : Common.UserId,
    callerRole : UserTypes.UserRole
  ) : { #ok; #err : Text } {
    switch (map.get(id)) {
      case null { #err "Message not found" };
      case (?m) {
        let canDelete = switch callerRole {
          case (#databaseAdmin) true;
          case (#customer) m.senderId == caller;
          case (#collegeAdmin) m.senderId == caller;
        };
        if (not canDelete) return #err "Not authorized";
        map.remove(id);
        #ok;
      };
    };
  };
};
