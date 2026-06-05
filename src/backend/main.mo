import Map "mo:core/Map";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import UsersMixin "mixins/users-api";
import OrdersMixin "mixins/orders-api";
import CollegesMixin "mixins/colleges-api";
import MessagesMixin "mixins/messages-api";
import PaymentsMixin "mixins/payments-api";
import NotifsMixin "mixins/notifications-api";
import AppsMixin "mixins/applications-api";
import AuditMixin "mixins/audit-api";
import SettingsMixin "mixins/settings-api";
import AnalyticsMixin "mixins/analytics-api";
import PaperChargesMixin "mixins/paper-charges-api";
import Common "types/common";
import UserTypes "types/user";
import OrderTypes "types/order";
import CollegeTypes "types/college";
import MsgTypes "types/message";
import PayTypes "types/payment";
import NotifTypes "types/notification";
import AppTypes "types/writer-application";
import ReassignTypes "types/reassignment";
import CleanupTypes "types/cleanup";
import AuditTypes "types/audit";
import SettingsTypes "types/settings";
import ReassignMixin "mixins/reassignments-api";

import CleanupMixin "mixins/cleanup-api";
import CollegesLib "lib/colleges";



























actor {
  // ── Object-storage (file upload/download proxy) ───────────────────────────
  include MixinObjectStorage();

  // ── Shared domain state ───────────────────────────────────────────────────
  let users        = Map.empty<Common.UserId, UserTypes.User>();
  let orders       = Map.empty<Common.OrderId, OrderTypes.Order>();
  let colleges     = Map.empty<Common.CollegeId, CollegeTypes.College>();
  let messages     = Map.empty<Common.MessageId, MsgTypes.Message>();
  let payments          = Map.empty<Common.PaymentId, PayTypes.Payment>();
  let paymentLogs       = Map.empty<Text, PayTypes.PaymentLog>();
  let paymentVerifications = Map.empty<Text, PayTypes.PaymentVerification>();
  let paymentAuditLogs  = Map.empty<Text, PayTypes.PaymentAuditLog>();
  let inFlightPayments  = Map.empty<Common.OrderId, Bool>();
  let notifs       = Map.empty<Common.NotifId, NotifTypes.Notification>();
  let applications  = Map.empty<Common.AppId, AppTypes.WriterApplication>();
  let reassignLogs  = Map.empty<Common.LogId, ReassignTypes.ReassignmentLog>();
  let cleanupLogs   = Map.empty<Common.LogId, CleanupTypes.CleanupLog>();
  let auditLogs    = Map.empty<Common.LogId, AuditTypes.AuditLog>();
  let collegesPricing = Map.empty<Text, SettingsTypes.CollegePricing>();

  // ── Mutable scalars wrapped in records (shared by reference to mixins) ────
  // headAdminPrincipal is managed by users-api mixin (userSeq tracks new IDs)
  let sessionTokens  = Map.empty<Text, Common.UserId>();
  let settings       = { var current : SettingsTypes.SystemSettings = {
    settingsId                     = "system";
    websiteName                    = "AssignServiceHub";
    supportEmail                   = "support@assignservicehub.com";
    maintenanceMode                = false;
    maintenanceEnabledAt           = null;
    allowNewOrders                 = true;
    servicePrices                  = [
      { serviceType = #HardCopy;      basePrice = 500; urgencyCharge = 150; paperChargeEnabled = true;  paperChargePerPage = 2 },
      { serviceType = #SoftCopy;      basePrice = 300; urgencyCharge = 100; paperChargeEnabled = false; paperChargePerPage = 0 },
      { serviceType = #RecordWriting; basePrice = 800; urgencyCharge = 200; paperChargeEnabled = true;  paperChargePerPage = 3 },
      { serviceType = #NotesWriting;  basePrice = 400; urgencyCharge = 120; paperChargeEnabled = false; paperChargePerPage = 0 },
    ];
    upiId                          = "9493442754@fam";
    qrCodeKey                      = "";
    qrCodeBlob                     = null;
    showQrToUsers                  = true;
    requirePaymentBeforeSubmission = true;
    databaseAdminSharePercent      = 60;
    adminSharePercent              = 30;
    themeConfig                    = {
      sidebarColor = "#0f1117";
      primaryColor = "#2563EB";
      accentColor  = "#3B82F6";
      sidebarWidth = 260;
      fontFamily   = "Inter";
    };
    maintenanceEndTime             = null;
    maintenanceMessage             = "";
    maintenanceLogs                = [];
    whatsappNumber                 = "";
    whatsappLink                   = "";
    emergencySupportEmail          = "";
    supportFormUrl                 = "";
    recordBookPrice                = 60;
    notebookPrice                  = 50;
  }};
  let dailyOrderSeq = Map.empty<Text, Nat>();
  let orderSeq   = { var next : Nat = 1 };
  let collegeSeq = { var next : Nat = 1 };
  let msgSeq     = { var next : Nat = 1 };
  let paySeq     = { var next : Nat = 1 };
  let payLogSeq  = { var next : Nat = 1 };
  let payVerSeq  = { var next : Nat = 1 };
  let payAuditSeq = { var next : Nat = 1 };
  let notifSeq   = { var next : Nat = 1 };
  let appSeq         = { var next : Nat = 1 };
  let logSeq         = { var next : Nat = 1 };
  let reassignSeq    = { var next : Nat = 1 };
  let cleanupSeq     = { var next : Nat = 1 };
  let userSeq    = { var next : Nat = 1 };

  // ── Mixin composition ─────────────────────────────────────────────────────
  include UsersMixin(users, userSeq, settings, sessionTokens);
  include OrdersMixin(orders, orderSeq, dailyOrderSeq, settings, colleges, collegeSeq, users, payments);
  include CollegesMixin(colleges, collegeSeq);
  // Seed predefined colleges on first startup
  CollegesLib.seedPredefinedColleges(colleges, collegeSeq);
  include MessagesMixin(messages, msgSeq, users, orders, notifs, notifSeq);
  include PaymentsMixin(payments, paySeq, paymentLogs, payLogSeq, orders, notifs, notifSeq, settings, paymentVerifications, paymentAuditLogs, inFlightPayments, payVerSeq, payAuditSeq, users);
  include NotifsMixin(notifs, notifSeq, settings, users);
  include AppsMixin(applications, appSeq, notifs, notifSeq, users, colleges, collegeSeq, userSeq);
  include AuditMixin(auditLogs, logSeq);
  include ReassignMixin(reassignLogs, reassignSeq);
  include CleanupMixin(cleanupLogs, cleanupSeq, orders, notifs, auditLogs, payments, users, messages, applications);
  include SettingsMixin(settings, collegesPricing);
  include AnalyticsMixin(orders, users, payments);  include PaperChargesMixin(settings, users);

};
