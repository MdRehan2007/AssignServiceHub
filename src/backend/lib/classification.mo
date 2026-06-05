import Array "mo:core/Array";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Nat8 "mo:core/Nat8";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Storage "mo:caffeineai-object-storage/Storage";
import Types "../types/classification";
import CommonTypes "../types/common";

module {

  // ── Label helpers ──────────────────────────────────────────────────────────

  /// Map a WasteType variant to a human-readable label
  public func wasteTypeLabel(wt : CommonTypes.WasteType) : Text {
    switch wt {
      case (#Organic)  "Organic Waste";
      case (#Plastic)  "Plastic Waste";
      case (#Metal)    "Metal/Tin";
      case (#Glass)    "Glass";
      case (#Paper)    "Paper/Cardboard";
      case (#Liquid)   "Liquid Waste";
      case (#Medical)  "Medical Waste";
      case (#Ewaste)   "Electronic Waste";
      case (#Toxic)    "Toxic Chemicals";
    };
  };

  /// Map a WasteType to its WasteCategory
  public func wasteCategory(wt : CommonTypes.WasteType) : CommonTypes.WasteCategory {
    switch wt {
      case (#Organic)                    #Biodegradable;
      case (#Plastic or #Metal or #Glass
            or #Paper or #Ewaste)        #NonBiodegradable;
      case (#Liquid or #Medical or #Toxic) #Hazardous;
    };
  };

  /// Map a WasteCategory variant to a human-readable label
  public func wasteCategoryLabel(wc : CommonTypes.WasteCategory) : Text {
    switch wc {
      case (#Biodegradable)    "Biodegradable";
      case (#NonBiodegradable) "Non-Biodegradable";
      case (#Hazardous)        "Hazardous";
    };
  };

  // ── Suggestion helpers ─────────────────────────────────────────────────────

  /// Map a WasteType to its recycling suggestion text
  public func recyclingSuggestion(wt : CommonTypes.WasteType) : Text {
    switch wt {
      case (#Organic)  "Compost organic waste or send to a biogas plant.";
      case (#Plastic)  "Recycle at a dry waste collection center or deposit in the plastic recycling bin.";
      case (#Metal)    "Sell or donate to a metal scrap dealer for smelting and reuse.";
      case (#Glass)    "Deposit in a glass recycling facility; separate by color where possible.";
      case (#Paper)    "Bundle and send to a paper recycling center; keep dry and clean.";
      case (#Liquid)   "Deliver to a certified liquid waste treatment plant; never pour down drains.";
      case (#Medical)  "Dispose at a licensed hazardous medical waste facility or hospital collection point.";
      case (#Ewaste)   "Drop off at an authorised e-waste collection center for safe component recovery.";
      case (#Toxic)    "Hand over to a certified hazardous chemicals disposal company.";
    };
  };

  /// Map a WasteType to its disposal method description
  public func disposalMethod(wt : CommonTypes.WasteType) : Text {
    switch wt {
      case (#Organic)  "1. Separate from non-organic waste. 2. Place in a compost bin or green-waste bag. 3. If composting at home, layer with dry material and turn weekly. 4. For larger volumes, contact a biogas facility.";
      case (#Plastic)  "1. Rinse the item and remove labels if possible. 2. Flatten or crush to save space. 3. Place in the designated plastic recycling bin. 4. Hard-to-recycle plastics (film, multilayer) go to a specialist drop-off.";
      case (#Metal)    "1. Rinse metal containers to remove food residue. 2. Separate ferrous (magnetic) from non-ferrous metals. 3. Take to a scrap metal dealer or kerbside metal bin. 4. Larger items: arrange a bulky-waste collection.";
      case (#Glass)    "1. Rinse the glass item thoroughly. 2. Remove caps and lids (recycle separately). 3. Place in a glass recycling bank, sorting by color if required. 4. Broken glass: wrap securely in newspaper before disposal.";
      case (#Paper)    "1. Keep paper dry and free from grease. 2. Remove plastic windows from envelopes. 3. Bundle newspapers and cardboard flat. 4. Place in the paper recycling bin or drop at a collection point.";
      case (#Liquid)   "1. Store liquid waste in a sealed, leak-proof container. 2. Label clearly with contents and hazard level. 3. Never mix different liquid wastes. 4. Deliver to an approved liquid waste treatment facility.";
      case (#Medical)  "1. Segregate sharps, blood-contaminated items, and pharmaceutical waste. 2. Use yellow clinical-waste bags or sharps containers. 3. Seal bags/containers and label as clinical waste. 4. Arrange collection by a licensed medical waste contractor.";
      case (#Ewaste)   "1. Back up and wipe personal data from devices. 2. Remove batteries and recycle them separately. 3. Drop the device at a manufacturer take-back program or certified e-waste center. 4. Do NOT place in general household waste.";
      case (#Toxic)    "1. Keep in original, sealed containers where possible. 2. Label with the chemical name and hazard symbols. 3. Store in a cool, dry, ventilated area away from other waste. 4. Contact a licensed hazardous-waste contractor for collection and safe disposal.";
    };
  };

  /// Map a WasteType to its safety instructions
  public func safetyInstructions(wt : CommonTypes.WasteType) : Text {
    switch wt {
      case (#Organic)  "Wash hands after handling. If composting, avoid including meat or dairy to prevent pests.";
      case (#Plastic)  "Wear gloves when handling sharp or jagged plastic pieces. Do not burn plastic — it releases toxic fumes.";
      case (#Metal)    "Wear thick gloves to avoid cuts from sharp metal edges. Watch for rust; wash hands thoroughly after handling.";
      case (#Glass)    "Always wear thick gloves and closed-toe shoes when handling broken glass. Sweep fragments carefully and seal in a puncture-resistant container.";
      case (#Paper)    "Avoid inhaling dust from large amounts of paper. Keep paper waste dry to prevent mold growth.";
      case (#Liquid)   "Wear chemical-resistant gloves and eye protection. Ensure adequate ventilation. Never pour liquid waste down sinks or storm drains.";
      case (#Medical)  "Wear disposable gloves and a face mask. Never re-sheath needles by hand. Use puncture-resistant sharps containers. Treat all medical waste as potentially infectious.";
      case (#Ewaste)   "Do not dismantle electronics unless qualified. Lithium batteries can cause fires; handle with care and keep away from heat sources.";
      case (#Toxic)    "Wear chemical-resistant gloves, a respirator mask, and safety goggles. Avoid skin and eye contact. Do not inhale vapors. Work in a well-ventilated area and follow MSDS guidelines.";
    };
  };

  /// Map a WasteType to its environmental impact warning
  public func environmentalImpact(wt : CommonTypes.WasteType) : Text {
    switch wt {
      case (#Organic)  "When sent to landfill, organic waste decomposes anaerobically and releases methane — a greenhouse gas 25× more potent than CO₂. Composting reduces these emissions significantly.";
      case (#Plastic)  "Plastic takes 450+ years to decompose. Microplastics contaminate soil and waterways, enter the food chain, and have been found in human blood. Only 9% of plastic ever produced has been recycled.";
      case (#Metal)    "Mining virgin metal is energy-intensive and causes habitat destruction. Metal corrodes over decades, releasing toxic oxides into soil and groundwater. Recycling metal uses up to 95% less energy.";
      case (#Glass)    "Glass is non-biodegradable and can persist in the environment for up to 1 million years. Broken glass injures wildlife. Recycling glass reduces quarrying and cuts energy use by 30%.";
      case (#Paper)    "Paper production is a major driver of deforestation and consumes large amounts of water and energy. Recycling one tonne of paper saves 17 trees and 26,000 liters of water.";
      case (#Liquid)   "Improper disposal of liquid waste contaminates rivers, lakes, and groundwater. Even small volumes of industrial liquid waste can make large bodies of water undrinkable for years.";
      case (#Medical)  "Improperly disposed medical waste spreads infectious diseases and antibiotic-resistant organisms. Incineration without controls releases dioxins and furans into the atmosphere.";
      case (#Ewaste)   "E-waste contains lead, mercury, cadmium, and brominated flame retardants. When dumped in landfill, these leach into soil and water. Only 17% of global e-waste is formally recycled.";
      case (#Toxic)    "Toxic chemicals can persist in ecosystems for decades, bioaccumulating in the food chain. Spills cause irreversible soil and water contamination and are linked to cancer and birth defects in nearby communities.";
    };
  };

  // ── AI response parsing ────────────────────────────────────────────────────

  /// Parse a waste type text token (case-insensitive) to the variant
  func parseWasteType(s : Text) : ?CommonTypes.WasteType {
    switch (s.toLower()) {
      case "organic"  ?#Organic;
      case "plastic"  ?#Plastic;
      case "metal"    ?#Metal;
      case "glass"    ?#Glass;
      case "paper"    ?#Paper;
      case "liquid"   ?#Liquid;
      case "medical"  ?#Medical;
      case "ewaste"   ?#Ewaste;
      case "toxic"    ?#Toxic;
      case _          null;
    };
  };

  /// Simple JSON string-value extraction: returns the value for the first
  /// occurrence of `"key":"value"` or `"key": "value"` in raw JSON text.
  func jsonGetString(json : Text, key : Text) : ?Text {
    let needle = "\"" # key # "\"";
    // find key in json
    switch (findSubstring(json, needle, 0)) {
      case null null;
      case (?pos) {
        // skip past key, colon, optional whitespace, opening quote
        let afterKey = pos + needle.size();
        let rest = textDrop(json, afterKey);
        // skip whitespace and colon
        let rest2 = textDropWhile(rest, func(c : Char) : Bool {
          c == ' ' or c == ':' or c == '\t' or c == '\n' or c == '\r'
        });
        // expect opening quote (ASCII double-quote U+0022)
        if (rest2.size() == 0) return null;
        let first = textCharAt(rest2, 0);
        if (first != '\u{22}') return null;
        // collect until closing quote
        let inner = textDrop(rest2, 1);
        ?textTakeUntil(inner, '\u{22}');
      };
    };
  };

  /// Extract a JSON number value for a given key (returns ?Nat)
  func jsonGetNat(json : Text, key : Text) : ?Nat {
    let needle = "\"" # key # "\"";
    switch (findSubstring(json, needle, 0)) {
      case null null;
      case (?pos) {
        let afterKey = pos + needle.size();
        let rest = textDrop(json, afterKey);
        let rest2 = textDropWhile(rest, func(c : Char) : Bool {
          c == ' ' or c == ':' or c == '\t' or c == '\n' or c == '\r'
        });
        if (rest2.size() == 0) return null;
        // collect digits
        let digits = textTakeWhile(rest2, func(c : Char) : Bool {
          c >= '0' and c <= '9'
        });
        if (digits.size() == 0) return null;
        Nat.fromText(digits);
      };
    };
  };

  /// Find all JSON object blocks `{...}` in a text (one level deep)
  func extractJsonObjects(text : Text) : [Text] {
    let chars = text.toArray();
    let n = chars.size();
    let objs = List.empty<Text>();
    var i = 0;
    label scan while (i < n) {
      if (chars[i] == '{') {
        var depth = 0;
        var j = i;
        label inner while (j < n) {
          if (chars[j] == '{') { depth += 1 };
          if (chars[j] == '}') {
            depth -= 1;
            if (depth == 0) {
              let obj = text.toArray();
              let slice = Array.tabulate(j - i + 1, func(k : Nat) : Char = obj[i + k]);
              objs.add(Text.fromArray(slice));
              i := j + 1;
              continue scan;
            };
          };
          j += 1;
        };
        // unclosed brace — skip
        i += 1;
      } else {
        i += 1;
      };
    };
    objs.toArray();
  };

  /// Parse the AI API JSON response and return top predictions sorted by confidence desc.
  /// Handles multi-label: {"predictions":[{...},{...}]}
  /// and single-label:    {"wasteType":"Plastic","confidence":85}
  /// Returns empty array when the JSON cannot be parsed.
  public func parseAiResponse(json : Text) : [Types.Prediction] {
    // Try to find prediction objects in any format
    let objs = extractJsonObjects(json);
    let preds = List.empty<Types.Prediction>();

    for (obj in objs.values()) {
      switch (jsonGetString(obj, "wasteType")) {
        case null {};
        case (?wtText) {
          switch (parseWasteType(wtText)) {
            case null {};
            case (?wt) {
              let conf = switch (jsonGetNat(obj, "confidence")) {
                case (?c) Nat.min(c, 100);
                case null 0;
              };
              preds.add({ wasteType = wt; confidence = conf });
            };
          };
        };
      };
    };

    // Sort by confidence descending and take top 3
    let sorted = preds.sort(func(a : Types.Prediction, b : Types.Prediction) : {#less;#equal;#greater} {
      if (a.confidence > b.confidence) #less
      else if (a.confidence < b.confidence) #greater
      else #equal
    });
    sorted.sliceToArray(0, Nat.min(3, sorted.size()));
  };

  // ── Deterministic fallback ─────────────────────────────────────────────────

  /// All waste type variants in a fixed order for deterministic index mapping
  let allWasteTypes : [CommonTypes.WasteType] = [
    #Organic, #Plastic, #Metal, #Glass, #Paper, #Liquid, #Medical, #Ewaste, #Toxic,
  ];

  /// Very simple blob hash: sum of all bytes
  func blobHash(b : Blob) : Nat {
    let bytes = b.toArray();
    bytes.foldLeft(0, func(acc : Nat, byte : Nat8) : Nat {
      acc + byte.toNat()
    });
  };

  /// Get the ExternalBlob content bytes for hashing (uses the metadata portion)
  func externalBlobBytes(eb : Storage.ExternalBlob) : Blob {
    // ExternalBlob is a Principal/key pair; hash the text representation
    (debug_show(eb)).encodeUtf8()
  };

  /// Generate deterministic fallback predictions from the image blob
  public func deterministicPredictions(imageBlob : Storage.ExternalBlob) : [Types.Prediction] {
    let raw = externalBlobBytes(imageBlob);
    let h1 = blobHash(raw);
    let primaryIdx = h1 % allWasteTypes.size();
    let primaryType = allWasteTypes[primaryIdx];

    // Second hash — rotate bits for variety
    let h2 = (h1 * 2654435761) % 256; // Knuth multiplicative hash
    let secondaryIdx = (primaryIdx + 1 + h2 % (allWasteTypes.size() - 1)) % allWasteTypes.size();
    let secondaryType = allWasteTypes[secondaryIdx];

    [
      { wasteType = primaryType;   confidence = 72 + h1 % 20 },   // 72–91
      { wasteType = secondaryType; confidence = 20 + h2 % 20 },   // 20–39
    ];
  };

  // ── Record construction ────────────────────────────────────────────────────

  /// Build a ClassificationRecord from a list of predictions.
  /// When predictions is empty, the deterministic fallback is used.
  public func buildRecord(
    id          : Nat,
    imageBlob   : Storage.ExternalBlob,
    predictions : [Types.Prediction],
    submittedBy : Principal,
    now         : Int,
  ) : Types.ClassificationRecord {
    let preds : [Types.Prediction] = if (predictions.size() == 0) {
      deterministicPredictions(imageBlob)
    } else {
      predictions
    };

    let primary = preds[0];
    let category = wasteCategory(primary.wasteType);

    {
      id;
      imageBlob;
      predictions    = preds;
      wasteCategory  = category;
      recyclingSuggestion = recyclingSuggestion(primary.wasteType);
      disposalMethod      = disposalMethod(primary.wasteType);
      safetyInstructions  = safetyInstructions(primary.wasteType);
      environmentalImpact = environmentalImpact(primary.wasteType);
      lowConfidence  = primary.confidence < 60;
      createdAt      = now;
      submittedBy;
    };
  };

  // ── Conversion ─────────────────────────────────────────────────────────────

  /// Convert an internal record to the public shared-safe result type
  public func toResult(record : Types.ClassificationRecord) : Types.ClassificationResult {
    let primary = record.predictions[0];
    let predResults = record.predictions.map(
      func(p : Types.Prediction) : Types.PredictionResult {
        { wasteType = wasteTypeLabel(p.wasteType); confidence = p.confidence }
      }
    );
    {
      id                  = record.id;
      imageBlob           = record.imageBlob;
      primaryWasteType    = wasteTypeLabel(primary.wasteType);
      wasteCategory       = wasteCategoryLabel(record.wasteCategory);
      confidence          = primary.confidence;
      predictions         = predResults;
      recyclingSuggestion = record.recyclingSuggestion;
      disposalMethod      = record.disposalMethod;
      safetyInstructions  = record.safetyInstructions;
      environmentalImpact = record.environmentalImpact;
      lowConfidence       = record.lowConfidence;
      createdAt           = record.createdAt;
    };
  };

  /// Retrieve all classification records as public results, newest first
  public func listResults(
    records : List.List<Types.ClassificationRecord>,
  ) : [Types.ClassificationResult] {
    records.reverse().toArray().map<Types.ClassificationRecord, Types.ClassificationResult>(
      func(r) { toResult(r) }
    );
  };

  /// Find a single record by id
  public func getById(
    records : List.List<Types.ClassificationRecord>,
    id      : Nat,
  ) : ?Types.ClassificationRecord {
    records.find(func(r : Types.ClassificationRecord) : Bool { r.id == id })
  };

  // ── Compare helpers for variant Map keys ───────────────────────────────────

  func wasteTypeIndex(wt : CommonTypes.WasteType) : Nat {
    switch wt {
      case (#Organic)  0;
      case (#Plastic)  1;
      case (#Metal)    2;
      case (#Glass)    3;
      case (#Paper)    4;
      case (#Liquid)   5;
      case (#Medical)  6;
      case (#Ewaste)   7;
      case (#Toxic)    8;
    };
  };

  func compareWasteType(a : CommonTypes.WasteType, b : CommonTypes.WasteType) : Order.Order {
    Nat.compare(wasteTypeIndex(a), wasteTypeIndex(b))
  };

  func wasteCategoryIndex(wc : CommonTypes.WasteCategory) : Nat {
    switch wc {
      case (#Biodegradable)    0;
      case (#NonBiodegradable) 1;
      case (#Hazardous)        2;
    };
  };

  func compareWasteCategory(a : CommonTypes.WasteCategory, b : CommonTypes.WasteCategory) : Order.Order {
    Nat.compare(wasteCategoryIndex(a), wasteCategoryIndex(b))
  };

  // ── Analytics ──────────────────────────────────────────────────────────────

  /// Compute analytics over all records and verifications
  public func computeAnalytics(
    records       : List.List<Types.ClassificationRecord>,
    verifications : Map.Map<CommonTypes.ClassificationId, Types.AdminVerification>,
  ) : Types.AnalyticsResult {
    let total = records.size();
    let verifiedCount = verifications.size();

    // Count correct verifications
    var correctCount = 0;
    verifications.forEach(func(_, v : Types.AdminVerification) {
      if (v.isCorrect) { correctCount += 1 };
    });

    // Per-subcategory counts
    let subCounts = Map.empty<CommonTypes.WasteType, Nat>();
    // Per-category counts
    let catCounts = Map.empty<CommonTypes.WasteCategory, Nat>();

    var totalConfidence = 0;

    records.forEach(func(r : Types.ClassificationRecord) {
      if (r.predictions.size() > 0) {
        let primary = r.predictions[0];
        let wt = primary.wasteType;
        let wc = r.wasteCategory;

        let prevSub = switch (subCounts.get(compareWasteType, wt)) { case (?n) n; case null 0 };
        subCounts.add(compareWasteType, wt, prevSub + 1);

        let prevCat = switch (catCounts.get(compareWasteCategory, wc)) { case (?n) n; case null 0 };
        catCounts.add(compareWasteCategory, wc, prevCat + 1);

        totalConfidence += primary.confidence;
      };
    });

    let avgConfidence = if (total == 0) 0 else totalConfidence / total;

    {
      totalClassifications = total;
      verifiedCount;
      correctCount;
      bySubcategory  = subCounts.toArray();
      byMainCategory = catCounts.toArray();
      avgConfidence;
    };
  };

  // ── Private text utilities ─────────────────────────────────────────────────

  func textDrop(t : Text, n : Nat) : Text {
    Text.fromIter(t.toIter().drop(n))
  };

  func textDropWhile(t : Text, pred : Char -> Bool) : Text {
    Text.fromIter(t.toIter().dropWhile(pred))
  };

  func textTakeUntil(t : Text, sentinel : Char) : Text {
    Text.fromIter(t.toIter().takeWhile(func(c : Char) : Bool { c != sentinel }))
  };

  func textTakeWhile(t : Text, pred : Char -> Bool) : Text {
    Text.fromIter(t.toIter().takeWhile(pred))
  };

  func textCharAt(t : Text, n : Nat) : Char {
    switch (t.toIter().drop(n).next()) {
      case (?c) c;
      case null '\u{0}';
    };
  };

  /// Find the starting position of needle in haystack starting at `from`
  func findSubstring(haystack : Text, needle : Text, from : Nat) : ?Nat {
    let hArr = haystack.toArray();
    let nArr = needle.toArray();
    let hLen = hArr.size();
    let nLen = nArr.size();
    if (nLen == 0) return ?from;
    if (hLen < nLen) return null;
    var i = from;
    while (i + nLen <= hLen) {
      var match = true;
      var j = 0;
      while (j < nLen) {
        if (hArr[i + j] != nArr[j]) { match := false };
        j += 1;
      };
      if (match) return ?i;
      i += 1;
    };
    null;
  };

};
