import List "mo:core/List";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Set "mo:core/Set";
import Time "mo:core/Time";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Types "../types/classification";
import CommonTypes "../types/common";
import ClassLib "../lib/classification";

mixin (
  records       : List.List<Types.ClassificationRecord>,
  verifications : Map.Map<CommonTypes.ClassificationId, Types.AdminVerification>,
  admins        : Set.Set<Principal>,
) {

  // ── Stable id counter ──────────────────────────────────────────────────────
  var nextId : Nat = 0;

  // ── HTTP transform (required by IC for outcalls) ───────────────────────────

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    { status = input.response.status; body = input.response.body; headers = [] };
  };

  // ── Classification API ─────────────────────────────────────────────────────

  /// Call the external AI classification API and store the result.
  /// When aiApiUrl is empty the deterministic fallback is used directly.
  public shared ({ caller }) func classifyWaste(
    request  : Types.ClassifyRequest,
    aiApiUrl : Text,
  ) : async Types.ClassificationResult {
    let predictions : [Types.Prediction] = if (aiApiUrl == "") {
      // No AI URL — use deterministic fallback
      ClassLib.deterministicPredictions(request.imageBlob)
    } else {
      switch (request.aiResponseJson) {
        case (?json) {
          // Client already obtained the AI response — parse it
          let parsed = ClassLib.parseAiResponse(json);
          if (parsed.size() > 0) parsed
          else ClassLib.deterministicPredictions(request.imageBlob)
        };
        case null {
          // Make an HTTP outcall to the AI service
          let body = "{\"image\":\"" # debug_show(request.imageBlob) # "\"}";
          let jsonText = await OutCall.httpPostRequest(
            aiApiUrl,
            [{ name = "Content-Type"; value = "application/json" }],
            body,
            transform,
          );
          let parsed = ClassLib.parseAiResponse(jsonText);
          if (parsed.size() > 0) parsed
          else ClassLib.deterministicPredictions(request.imageBlob)
        };
      };
    };

    let id = nextId;
    nextId += 1;

    let record = ClassLib.buildRecord(
      id,
      request.imageBlob,
      predictions,
      caller,
      Time.now(),
    );
    records.add(record);
    ClassLib.toResult(record);
  };

  /// Return the classification result for a previously submitted image by id
  public query func getClassification(id : Nat) : async ?Types.ClassificationResult {
    switch (ClassLib.getById(records, id)) {
      case (?r) ?ClassLib.toResult(r);
      case null null;
    };
  };

  /// Return all stored classification results (newest first)
  public query func listClassifications() : async [Types.ClassificationResult] {
    ClassLib.listResults(records)
  };

  // ── Admin Verification API ─────────────────────────────────────────────────

  /// Record an admin's verification of a classification result.
  /// Only principals in the admins set may call this.
  public shared ({ caller }) func verifyClassification(
    id        : CommonTypes.ClassificationId,
    isCorrect : Bool,
    note      : ?Text,
  ) : async () {
    if (not admins.contains(caller)) {
      Runtime.trap("Unauthorized: caller is not an admin");
    };
    switch (ClassLib.getById(records, id)) {
      case null Runtime.trap("Classification not found");
      case (?_) {};
    };
    let verification : Types.AdminVerification = {
      classificationId = id;
      isCorrect;
      adminNote       = note;
      verifiedAt      = Time.now();
      adminPrincipal  = caller;
    };
    verifications.add(id, verification);
  };

  /// Return the admin verification for a given classification id, if any
  public query func getVerification(id : CommonTypes.ClassificationId) : async ?Types.AdminVerification {
    verifications.get(id)
  };

  /// Return all admin verifications
  public query func listVerifications() : async [Types.AdminVerification] {
    verifications.values().toArray()
  };

  /// Return analytics aggregated over all classifications and verifications
  public query func getAnalytics() : async Types.AnalyticsResult {
    ClassLib.computeAnalytics(records, verifications)
  };

  // ── Admin management ───────────────────────────────────────────────────────

  /// Add a principal to the admin set.
  /// If the admins set is empty, the first caller becomes an admin (bootstrap).
  /// Otherwise, only existing admins may add new admins.
  public shared ({ caller }) func addAdmin(principal : Principal) : async () {
    if (admins.isEmpty()) {
      // Bootstrap: first call designates caller as admin and adds the target
      admins.add(caller);
    } else if (not admins.contains(caller)) {
      Runtime.trap("Unauthorized: caller is not an admin");
    };
    admins.add(principal);
  };

  /// Remove a principal from the admin set (only existing admins may call this)
  public shared ({ caller }) func removeAdmin(principal : Principal) : async () {
    if (not admins.contains(caller)) {
      Runtime.trap("Unauthorized: caller is not an admin");
    };
    admins.remove(principal);
  };

  /// Check whether the given principal has admin role
  public query func isAdmin(principal : Principal) : async Bool {
    admins.contains(principal)
  };

};
