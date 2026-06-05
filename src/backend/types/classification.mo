import Storage "mo:caffeineai-object-storage/Storage";
import CommonTypes "common";

module {
  public type WasteType = CommonTypes.WasteType;
  public type WasteCategory = CommonTypes.WasteCategory;
  public type ClassificationId = CommonTypes.ClassificationId;
  public type Timestamp = CommonTypes.Timestamp;

  /// A single prediction entry in a multi-label result
  public type Prediction = {
    wasteType  : WasteType;
    confidence : Nat; // 0–100
  };

  /// Stored classification record (internal, mutable-free for persistence)
  public type ClassificationRecord = {
    id             : ClassificationId;
    imageBlob      : Storage.ExternalBlob;
    predictions    : [Prediction];   // top 1–3 predictions, index 0 is primary
    wasteCategory  : WasteCategory;
    recyclingSuggestion : Text;
    disposalMethod : Text;
    safetyInstructions  : Text;
    environmentalImpact : Text;
    lowConfidence  : Bool;           // true when primary confidence < 60
    createdAt      : Timestamp;
    submittedBy    : Principal;
  };

  /// Public result returned to callers (shared-safe, no mutable fields)
  public type ClassificationResult = {
    id                  : ClassificationId;
    imageBlob           : Storage.ExternalBlob;
    primaryWasteType    : Text;   // human-readable label for top prediction
    wasteCategory       : Text;   // human-readable main category label
    confidence          : Nat;    // primary confidence 0–100
    predictions         : [PredictionResult]; // all top-N predictions
    recyclingSuggestion : Text;
    disposalMethod      : Text;
    safetyInstructions  : Text;
    environmentalImpact : Text;
    lowConfidence       : Bool;
    createdAt           : Timestamp;
  };

  /// Shared-safe prediction entry
  public type PredictionResult = {
    wasteType  : Text;
    confidence : Nat;
  };

  /// Input for submitting an image for classification
  public type ClassifyRequest = {
    imageBlob      : Storage.ExternalBlob;
    /// Optional raw JSON from the AI API (when provided, parsed on-chain)
    aiResponseJson : ?Text;
  };

  /// Admin verification of a classification
  public type AdminVerification = {
    classificationId : ClassificationId;
    isCorrect        : Bool;
    adminNote        : ?Text;
    verifiedAt       : Timestamp;
    adminPrincipal   : Principal;
  };

  /// Analytics summary returned by getAnalytics()
  public type AnalyticsResult = {
    totalClassifications : Nat;
    verifiedCount        : Nat;
    correctCount         : Nat;
    bySubcategory        : [(WasteType, Nat)];
    byMainCategory       : [(WasteCategory, Nat)];
    avgConfidence        : Nat;
  };
};
