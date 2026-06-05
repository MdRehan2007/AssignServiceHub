import Types "../types/settings";

module {
  public let DEFAULT : Types.SystemSettings = {
    settingsId = "system";
    websiteName = "AssignServiceHub";
    supportEmail = "support@assignservicehub.com";
    maintenanceMode = false;
    allowNewOrders = true;
    requirePaymentBeforeSubmission = true;
    showQrToUsers = true;
    upiId = "9493442754@fam";
    qrCodeKey = "";
    qrCodeBlob = null;
    databaseAdminSharePercent = 60;
    adminSharePercent = 30;
    servicePrices = [
      { serviceType = #HardCopy;     basePrice = 500; urgencyCharge = 150; paperChargeEnabled = true;  paperChargePerPage = 2 },
      { serviceType = #SoftCopy;     basePrice = 300; urgencyCharge = 100; paperChargeEnabled = false; paperChargePerPage = 0 },
      { serviceType = #RecordWriting; basePrice = 800; urgencyCharge = 200; paperChargeEnabled = true;  paperChargePerPage = 3 },
      { serviceType = #NotesWriting;  basePrice = 400; urgencyCharge = 120; paperChargeEnabled = false; paperChargePerPage = 0 },
    ];
    themeConfig = {
      sidebarColor = "#0f1117";
      primaryColor = "#3b82f6";
      accentColor = "#6366f1";
      sidebarWidth = 256;
      fontFamily = "Inter";
    };
    maintenanceEndTime = null;
    maintenanceMessage = "";
    maintenanceLogs = [];
    whatsappNumber = "";
    whatsappLink = "";
    supportFormUrl = "";
    emergencySupportEmail = "";
    maintenanceEnabledAt = null;
    recordBookPrice = 60;
    notebookPrice = 50;
  };

  public func getSettings(s : Types.SystemSettings) : Types.SystemSettings {
    s;
  };

  public func updateSettings(_s : Types.SystemSettings, partial : Types.SystemSettings) : Types.SystemSettings {
    partial;
  };
};
