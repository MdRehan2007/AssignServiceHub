import Map "mo:core/Map";
import Time "mo:core/Time";
import Nat "mo:core/Nat";import Debug "mo:core/Debug";
import Types "../types/writer-application";
import Common "../types/common";

module {
  public type AppMap = Map.Map<Common.AppId, Types.WriterApplication>;

  public func submit(
    map : AppMap,
    seq : { var next : Nat },
    name : Text,
    email : Text,
    phone : Text,
    college : Text,
    bio : Text,
    expertise : [Text],
    handwritingUrl : Text,
    resumeKey : ?Text,
    resumeUrl : Text
  ) : (Nat, Types.WriterApplication) {
    let idx = seq.next;
    seq.next += 1;
    let appId = "APP" # idx.toText();
    let app : Types.WriterApplication = {
      appId;
      applicantName = name;
      email;
      phone;
      collegeName = college;
      bio;
      expertise;
      handwritingUrl;
      resumeKey;
      resumeUrl;
      status = #Pending;
      appliedAt = Time.now();
      reviewedBy = null;
      reviewNote = "";
      updatedAt = Time.now();
    };
    map.add(appId, app);
    (idx, app);
  };

  public func getApp(map : AppMap, id : Common.AppId) : ?Types.WriterApplication {
    map.get(id);
  };

  public func updateStatus(
    map      : AppMap,
    id       : Common.AppId,
    status   : Types.ApplicationStatus,
    reviewer : Text,
    note     : Text
  ) : Bool {
    switch (map.get(id)) {
      case null false;
      case (?a) {
        // When rejecting, permanently delete the record instead of just marking it
        switch (status) {
          case (#Rejected) {
            map.remove(id);
            true;
          };
          case _ {
            map.add(id, { a with status; reviewedBy = ?reviewer; reviewNote = note; updatedAt = Time.now() });
            true;
          };
        };
      };
    };
  };

  public func listAll(map : AppMap) : [Types.WriterApplication] {
    // Safety net: exclude any lingering Rejected records (they should be deleted on reject)
    map.values().filter(func(a : Types.WriterApplication) : Bool {
      switch (a.status) { case (#Rejected) false; case _ true };
    }).toArray();
  };
  /// Permanently delete an application. Only DatabaseAdmin may call this.
  /// Returns #ok on success, #err with reason on failure.
  public func deleteApplication(
    map : AppMap,
    id  : Common.AppId
  ) : { #ok; #err : Text } {
    switch (map.get(id)) {
      case null { #err("ApplicationNotFound") };
      case (?_) {
        map.remove(id);
        #ok;
      };
    };
  };
};
