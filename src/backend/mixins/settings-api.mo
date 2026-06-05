import Map "mo:core/Map";
import SettingsTypes "../types/settings";
import SettingsLib "../lib/settings";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Array "mo:core/Array";

mixin (
  settingsRef     : { var current : SettingsTypes.SystemSettings },
  collegesPricing : Map.Map<Text, SettingsTypes.CollegePricing>
) {
  public query func getSystemSettings() : async SettingsTypes.SystemSettings {
    SettingsLib.getSettings(settingsRef.current);
  };

  public shared ({ caller }) func updateSystemSettings(updated : SettingsTypes.SystemSettings) : async SettingsTypes.SystemSettings {
    settingsRef.current := SettingsLib.updateSettings(settingsRef.current, updated);
    settingsRef.current;
  };

  public shared ({ caller }) func updateUpiId(upiId : Text) : async () {
    settingsRef.current := { settingsRef.current with upiId };
  };

  public shared ({ caller }) func updateQrCode(qrCodeKey : Text) : async () {
    settingsRef.current := { settingsRef.current with qrCodeKey };
  };

  /// Store the QR code image blob directly in backend state.
  /// Returns the stable key "qr" that clients can use to retrieve it.
  public shared ({ caller }) func uploadPaymentQr(imageData : Blob) : async Text {
    let key = "qr";
    settingsRef.current := { settingsRef.current with qrCodeBlob = ?imageData; qrCodeKey = key; showQrToUsers = true };
    key;
  };

  /// Retrieve the stored QR code blob (for serving to customers).
  public query func getPaymentQrBlob() : async ?Blob {
    settingsRef.current.qrCodeBlob;
  };

  /// Returns lightweight payment settings for the customer payment modal.
  public query func getPaymentSettings() : async SettingsTypes.PaymentSettings {
    let s = settingsRef.current;
    {
      upiId        = s.upiId;
      qrCodeKey    = s.qrCodeKey;
      showQrToUsers = s.showQrToUsers;
      hasQrBlob    = switch (s.qrCodeBlob) { case (?_) true; case null false };
    };
  };

  public shared ({ caller }) func setMaintenanceMode(enabled : Bool) : async () {
    let now = Time.now();
    if (enabled) {
      // Append a new active log entry
      let newLog : SettingsTypes.MaintenanceLog = {
        enabledBy          = caller.toText();
        enabledTime        = now;
        disabledTime       = null;
        reason             = "";
        affectedUsersCount = 0;
      };
      let updatedLogs = settingsRef.current.maintenanceLogs.concat([newLog]);
      settingsRef.current := { settingsRef.current with maintenanceMode = enabled; maintenanceEnabledAt = ?now; maintenanceLogs = updatedLogs };
    } else {
      // Close the last active log entry (disabledTime = null means still active)
      let existingLogs = settingsRef.current.maintenanceLogs;
      let size = existingLogs.size();
      let updatedLogs : [SettingsTypes.MaintenanceLog] = if (size == 0) {
        [];
      } else {
        let lastIdx : Nat = size - 1 : Nat;
        let last = existingLogs[lastIdx];
        if (last.disabledTime == null) {
          // Close this entry
          let closed : SettingsTypes.MaintenanceLog = { last with disabledTime = ?now };
          Array.tabulate<SettingsTypes.MaintenanceLog>(size, func(i) {
            if (i == lastIdx) { closed } else { existingLogs[i] }
          });
        } else {
          existingLogs;
        };
      };
      settingsRef.current := { settingsRef.current with maintenanceMode = enabled; maintenanceEnabledAt = null; maintenanceLogs = updatedLogs };
    };
  };

  public shared ({ caller }) func setMaintenanceEndTime(endTime : ?Text) : async () {
    settingsRef.current := { settingsRef.current with maintenanceEndTime = endTime };
  };

  public shared ({ caller }) func setMaintenanceMessage(message : Text) : async () {
    settingsRef.current := { settingsRef.current with maintenanceMessage = message };
  };

  public shared ({ caller }) func setMaintenanceReason(reason : Text) : async () {
    let existingLogs = settingsRef.current.maintenanceLogs;
    let size = existingLogs.size();
    if (size == 0) { return };
    let lastIdx : Nat = size - 1 : Nat;
    let last = existingLogs[lastIdx];
    // Only update reason on the active (not yet closed) entry
    if (last.disabledTime == null) {
      let updated : SettingsTypes.MaintenanceLog = { last with reason };
      let updatedLogs = Array.tabulate(size, func(i) {
        if (i == lastIdx) { updated } else { existingLogs[i] }
      });
      settingsRef.current := { settingsRef.current with maintenanceLogs = updatedLogs };
    };
  };

  public query func getMaintenanceLogs() : async [SettingsTypes.MaintenanceLog] {
    settingsRef.current.maintenanceLogs;
  };

  public shared ({ caller }) func setAllowNewOrders(allowed : Bool) : async () {
    settingsRef.current := { settingsRef.current with allowNewOrders = allowed };
  };

  public shared ({ caller }) func updateTheme(theme : SettingsTypes.ThemeConfig) : async () {
    settingsRef.current := { settingsRef.current with themeConfig = theme };
  };

  // ── Emergency contact fields ──────────────────────────────────────────────

  public shared ({ caller }) func setWhatsappNumber(value : Text) : async () {
    settingsRef.current := { settingsRef.current with whatsappNumber = value };
  };

  public shared ({ caller }) func setWhatsappLink(value : Text) : async () {
    settingsRef.current := { settingsRef.current with whatsappLink = value };
  };

  public shared ({ caller }) func setSupportEmail(value : Text) : async () {
    settingsRef.current := { settingsRef.current with emergencySupportEmail = value };
  };

  public shared ({ caller }) func setSupportFormUrl(value : Text) : async () {
    settingsRef.current := { settingsRef.current with supportFormUrl = value };
  };

  /// Batch-update all maintenance contact fields in one call.
  public shared ({ caller }) func updateMaintenanceContacts(
    whatsappNumber : Text,
    whatsappLink   : Text,
    supportEmail   : Text,
    supportFormUrl : Text
  ) : async () {
    settingsRef.current := {
      settingsRef.current with
      whatsappNumber;
      whatsappLink;
      emergencySupportEmail = supportEmail;
      supportFormUrl;
    };
  };

  /// Batch-update payment settings (UPI ID, QR key, show toggles).
  public shared ({ caller }) func updatePaymentSettings(
    upiId         : Text,
    qrCodeKey     : Text,
    showQrToUsers : Bool
  ) : async () {
    settingsRef.current := { settingsRef.current with upiId; qrCodeKey; showQrToUsers };
  };

  /// Batch-update service pricing (replaces entire array).
  public shared ({ caller }) func updateServicePricing(
    prices : [SettingsTypes.ServicePriceEntry]
  ) : async () {
    settingsRef.current := { settingsRef.current with servicePrices = prices };
  };

  /// Batch-update share percent settings.
  public shared ({ caller }) func updateSharePercents(
    databaseAdminSharePercent : Nat,
    adminSharePercent         : Nat
  ) : async () {
    settingsRef.current := { settingsRef.current with databaseAdminSharePercent; adminSharePercent };
  };

  /// Update website name globally.
  public shared ({ caller }) func updateWebsiteName(name : Text) : async () {
    settingsRef.current := { settingsRef.current with websiteName = name };
  };

  // ── College-wise pricing ──────────────────────────────────────────────────

  /// Database Admin: upsert per-college pricing.
  public shared ({ caller }) func setCollegePricing(pricing : SettingsTypes.CollegePricing) : async () {
    collegesPricing.add(pricing.collegeName, pricing);
  };

  /// Returns pricing for a specific college, or null if not set.
  public query func getCollegePricing(collegeName : Text) : async ?SettingsTypes.CollegePricing {
    collegesPricing.get(collegeName);
  };

  /// Returns all college-specific pricing entries.
  public query func getAllCollegesPricing() : async [SettingsTypes.CollegePricing] {
    collegesPricing.entries().map(func((_, v) : (Text, SettingsTypes.CollegePricing)) : SettingsTypes.CollegePricing { v }).toArray();
  };

  /// DBA: Set material prices for record books and notebooks.
  public shared ({ caller }) func setMaterialPrices(
    recordBookPrice : Nat,
    notebookPrice   : Nat
  ) : async () {
    settingsRef.current := { settingsRef.current with recordBookPrice; notebookPrice };
  };

  /// Public: Get current material prices for record books and notebooks.
  public query func getMaterialPrices() : async { recordBookPrice : Nat; notebookPrice : Nat } {
    { recordBookPrice = settingsRef.current.recordBookPrice; notebookPrice = settingsRef.current.notebookPrice };
  };
};
