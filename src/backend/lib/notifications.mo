import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Types "../types/notification";
import Common "../types/common";

module {
  public type NotifMap = Map.Map<Common.NotifId, Types.Notification>;

  public func create(
    map       : NotifMap,
    seq       : { var next : Nat },
    userId    : Common.UserId,
    notifType : Types.NotificationType,
    message   : Text,
    relatedId : ?Text
  ) : (Nat, Types.Notification) {
    let idx = seq.next;
    seq.next += 1;
    let id = "NOTIF" # idx.toText();
    let notif : Types.Notification = {
      notifId = id;
      userId;
      notifType;
      message;
      relatedId;
      isRead = false;
      createdAt = Time.now();
    };
    map.add(id, notif);
    (idx, notif);
  };

  public func listForUser(map : NotifMap, userId : Common.UserId) : [Types.Notification] {
    map.values().filter(func(n : Types.Notification) : Bool { n.userId == userId }).toArray();
  };

  public func markRead(map : NotifMap, id : Common.NotifId) : Bool {
    switch (map.get(id)) {
      case null false;
      case (?n) {
        map.add(id, { n with isRead = true });
        true;
      };
    };
  };

  public func countUnread(map : NotifMap, userId : Common.UserId) : Nat {
    map.values().filter(func(n : Types.Notification) : Bool {
      n.userId == userId and not n.isRead
    }).size();
  };
};
