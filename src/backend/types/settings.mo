import OrderTypes "order";

module {
  public type MaintenanceLog = {
    enabledBy          : Text;
    enabledTime        : Int;
    disabledTime       : ?Int;
    reason             : Text;
    affectedUsersCount : Nat;
  };

  public type CollegePricing = {
    collegeName    : Text;
    softCopy       : Nat;
    hardCopy       : Nat;
    recordWriting  : Nat;
    notesWriting   : Nat;
    otherBase      : Nat;
    urgencyCharge  : Nat;
  };

  public type ThemeConfig = {
    sidebarColor  : Text;
    primaryColor  : Text;
    accentColor   : Text;
    sidebarWidth  : Nat;
    fontFamily    : Text;
  };

  public type ServicePriceEntry = {
    serviceType        : OrderTypes.ServiceType;
    basePrice          : Nat;
    urgencyCharge      : Nat;
    paperChargeEnabled : Bool;  // DBA-configurable at runtime
    paperChargePerPage : Nat;   // ₹ per page, 0 when disabled
  };

  /// Lightweight payment settings returned to clients (no full SystemSettings needed).
  public type PaymentSettings = {
    upiId        : Text;
    qrCodeKey    : Text;
    showQrToUsers : Bool;
    hasQrBlob    : Bool;   // true when a QR blob is stored server-side
  };

  public type SystemSettings = {
    settingsId                     : Text;
    websiteName                    : Text;
    supportEmail                   : Text;
    maintenanceMode                : Bool;
    maintenanceEnabledAt           : ?Int;
    allowNewOrders                 : Bool;
    servicePrices                  : [ServicePriceEntry];
    upiId                          : Text;
    qrCodeKey                      : Text;
    qrCodeBlob                     : ?Blob;  // server-side stored QR image
    showQrToUsers                  : Bool;
    requirePaymentBeforeSubmission : Bool;
    databaseAdminSharePercent      : Nat;
    adminSharePercent              : Nat;  // college admin share percent
    themeConfig                    : ThemeConfig;
    maintenanceEndTime             : ?Text;
    maintenanceMessage             : Text;
    maintenanceLogs                : [MaintenanceLog];
    whatsappNumber                 : Text;
    whatsappLink                   : Text;
    supportFormUrl                 : Text;
    emergencySupportEmail          : Text;
    recordBookPrice                : Nat;   // flat material price for record books
    notebookPrice                  : Nat;   // flat material price for notebooks
  };
};
