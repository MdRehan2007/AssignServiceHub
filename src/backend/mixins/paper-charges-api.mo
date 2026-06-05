import Map "mo:core/Map";
import SettingsTypes "../types/settings";
import PaperChargeTypes "../types/paper-charge";
import OrderTypes "../types/order";
import CommonTypes "../types/common";
import UserTypes "../types/user";
import Runtime "mo:core/Runtime";

/// Mixin exposing DBA paper-charge configuration endpoints.
mixin (
  settingsRef  : { var current : SettingsTypes.SystemSettings },
  usersMapPCM  : Map.Map<CommonTypes.UserId, UserTypes.User>
) {
  /// DBA: List current paper charge configuration for all service types.
  public query func listPaperChargeConfigs() : async [PaperChargeTypes.PaperChargeConfig] {
    settingsRef.current.servicePrices.map<SettingsTypes.ServicePriceEntry, PaperChargeTypes.PaperChargeConfig>(
      func(entry) : PaperChargeTypes.PaperChargeConfig {
        { serviceType = entry.serviceType; paperChargeEnabled = entry.paperChargeEnabled; paperChargePerPage = entry.paperChargePerPage }
      }
    );
  };

  /// DBA: Enable or disable paper charges and set per-page rate for a service type.
  public shared ({ caller }) func setPaperChargeConfig(
    update : PaperChargeTypes.PaperChargeUpdate
  ) : async Bool {
    switch (usersMapPCM.get(caller)) {
      case null Runtime.trap("NotAuthorized");
      case (?u) if (u.role != #databaseAdmin) Runtime.trap("NotAuthorized");
    };
    let newPrices = settingsRef.current.servicePrices.map(
      func(entry) : SettingsTypes.ServicePriceEntry {
        if (entry.serviceType == update.serviceType) {
          { entry with paperChargeEnabled = update.paperChargeEnabled; paperChargePerPage = update.paperChargePerPage }
        } else entry
      }
    );
    settingsRef.current := { settingsRef.current with servicePrices = newPrices };
    true;
  };

  /// DBA: Bulk-update paper charge configs for multiple service types.
  public shared ({ caller }) func setPaperChargeConfigs(
    updates : [PaperChargeTypes.PaperChargeUpdate]
  ) : async Bool {
    switch (usersMapPCM.get(caller)) {
      case null Runtime.trap("NotAuthorized");
      case (?u) if (u.role != #databaseAdmin) Runtime.trap("NotAuthorized");
    };
    let newPrices = settingsRef.current.servicePrices.map(
      func(entry) : SettingsTypes.ServicePriceEntry {
        switch (updates.find(func(upd : PaperChargeTypes.PaperChargeUpdate) : Bool { upd.serviceType == entry.serviceType })) {
          case (?upd) { let updated : SettingsTypes.ServicePriceEntry = { entry with paperChargeEnabled = upd.paperChargeEnabled; paperChargePerPage = upd.paperChargePerPage }; updated };
          case null entry;
        }
      }
    );
    settingsRef.current := { settingsRef.current with servicePrices = newPrices };
    true;
  };

  /// Public: get paper charge config for one service type (used by Place Order page).
  public query func getPaperChargeConfig(
    serviceType : OrderTypes.ServiceType
  ) : async ?PaperChargeTypes.PaperChargeConfig {
    switch (settingsRef.current.servicePrices.find(func(e : SettingsTypes.ServicePriceEntry) : Bool { e.serviceType == serviceType })) {
      case null null;
      case (?entry) ?{ serviceType = entry.serviceType; paperChargeEnabled = entry.paperChargeEnabled; paperChargePerPage = entry.paperChargePerPage };
    };
  };
};
