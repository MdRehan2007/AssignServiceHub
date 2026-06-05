import Map "mo:core/Map";
import NotifTypes "../types/notification";
import CommonTypes "../types/common";
import NotifsLib "../lib/notifications";
import SettingsTypes "../types/settings";
import Runtime "mo:core/Runtime";
import UserTypesNotif "../types/user";

mixin (
  notifsMap   : Map.Map<CommonTypes.NotifId, NotifTypes.Notification>,
  notifSeq    : { var next : Nat },
  settingsRef : { var current : SettingsTypes.SystemSettings },
  usersMapNotif : Map.Map<CommonTypes.UserId, UserTypesNotif.User>
) {
  let HEAD_ADMIN_EMAIL_NOTIF : Text = "mhdrihan2007@gmail.com";

  func isHeadAdminNotif(caller : Principal) : Bool {
    switch (usersMapNotif.get(caller)) {
      case (?u) u.email == HEAD_ADMIN_EMAIL_NOTIF or u.role == #databaseAdmin;
      case null false;
    };
  };

  func guardMaintenanceNotifs(caller : Principal) {
    if (settingsRef.current.maintenanceMode and not isHeadAdminNotif(caller)) {
      Runtime.trap("Website is under maintenance. Please try again later.");
    };
  };

  public shared ({ caller }) func createNotification(
    userId : CommonTypes.UserId,
    notifType : NotifTypes.NotificationType,
    message : Text,
    relatedId : ?Text
  ) : async NotifTypes.Notification {
    guardMaintenanceNotifs(caller);
    let (_, notif) = NotifsLib.create(notifsMap, notifSeq, userId, notifType, message, relatedId);
    notif;
  };

  public shared ({ caller }) func getMyNotifications() : async [NotifTypes.Notification] {
    guardMaintenanceNotifs(caller);
    NotifsLib.listForUser(notifsMap, caller);
  };

  public shared ({ caller }) func markNotificationRead(id : CommonTypes.NotifId) : async Bool {
    guardMaintenanceNotifs(caller);
    NotifsLib.markRead(notifsMap, id);
  };

  public query ({ caller }) func getMyUnreadCount() : async Nat {
    if (settingsRef.current.maintenanceMode and not isHeadAdminNotif(caller)) { return 0 };
    NotifsLib.countUnread(notifsMap, caller);
  };
};
