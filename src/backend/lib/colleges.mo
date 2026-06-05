import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Char "mo:core/Char";
import Array "mo:core/Array";
import Types "../types/college";
import Common "../types/common";

module {
  public type CollegeMap = Map.Map<Common.CollegeId, Types.College>;

  public func generateAdminId(collegeName : Text, seq : Nat) : Text {
    let upper = collegeName.toUpper();
    let letters = upper.toIter().filter(func(c : Char) : Bool { c >= 'A' and c <= 'Z' }).toArray();
    let prefix = Text.fromArray(letters);
    let padded = if (seq < 10) "0" # seq.toText() else seq.toText();
    prefix # padded;
  };

  /// Extract only uppercase letters from a text (skip spaces/special chars).
  func lettersOnly(t : Text) : [Char] {
    let upper = t.toUpper();
    upper.toIter().filter(func(c : Char) : Bool { c >= 'A' and c <= 'Z' }).toArray();
  };

  /// Derive the college code from a name using only letters.
  /// Returns first 3 letters by default; conflict resolution is done in computeCollegeCodes.
  public func rawCodeFor(name : Text) : Text {
    let letters = lettersOnly(name);
    let take = if (letters.size() >= 3) 3 else letters.size();
    Text.fromArray(letters.sliceToArray<Char>(0, take));
  };

  /// Recompute collegeCode for every college in the map, resolving conflicts.
  /// Groups by first 3 uppercase letters. When two+ colleges share a 3-letter prefix:
  ///   - compare their 4th letter; earlier 4th letter wins the 3-letter code
  ///   - ties (same 4th letter) or college with fewer than 4 letters: shorter name wins
  ///   - other colleges in the group get a 4-letter code
  public func computeCollegeCodes(map : CollegeMap) {
    // Collect (collegeId, letters) pairs
    type Entry = { id : Common.CollegeId; letters : [Char] };
    let entries : [Entry] = map.entries().map<
      (Common.CollegeId, Types.College),
      Entry
    >(func((id, c)) : Entry { { id; letters = lettersOnly(c.collegeName) } }).toArray();

    // Group by 3-letter prefix
    let grouped = Map.empty<Text, [Entry]>();
    for (entry in entries.vals()) {
      let take = if (entry.letters.size() >= 3) 3 else entry.letters.size();
      let prefix = Text.fromArray(entry.letters.sliceToArray<Char>(0, take));
      switch (grouped.get(prefix)) {
        case null    { grouped.add(prefix, [entry]) };
        case (?list) { grouped.add(prefix, list.concat([entry])) };
      };
    };

    // For each group assign codes
    for ((prefix, group) in grouped.entries()) {
      if (group.size() == 1) {
        // Only one college for this prefix — use 3-letter code
        let e = group[0];
        switch (map.get(e.id)) {
          case (?c) { map.add(e.id, { c with collegeCode = prefix }) };
          case null {};
        };
      } else {
        // Multiple colleges share this prefix — find the one whose 4th letter
        // comes earliest alphabetically (it keeps the 3-letter code).
        // Colleges with fewer than 4 letters always win (they can't get a 4-letter code).
        var winnerId : Common.CollegeId = group[0].id;
        var winnerLetter : Char = if (group[0].letters.size() < 4) { '\u{0000}' } else { group[0].letters[3] };
        for (entry in group.vals()) {
          let ch4 : Char = if (entry.letters.size() < 4) { '\u{0000}' } else { entry.letters[3] };
          if (ch4 < winnerLetter) {
            winnerId := entry.id;
            winnerLetter := ch4;
          };
        };
        // Assign codes
        for (entry in group.vals()) {
          let code : Text = if (entry.id == winnerId) {
            prefix; // 3-letter code
          } else {
            // 4-letter code
            let take4 = if (entry.letters.size() >= 4) 4 else entry.letters.size();
            Text.fromArray(entry.letters.sliceToArray<Char>(0, take4));
          };
          switch (map.get(entry.id)) {
            case (?c) { map.add(entry.id, { c with collegeCode = code }) };
            case null {};
          };
        };
      };
    };
  };

  public func createCollege(
    map : CollegeMap,
    seq : { var next : Nat },
    name : Text,
    adminEmail : Text,
    phone : Text
  ) : (Nat, Types.College) {
    let idx = seq.next;
    seq.next += 1;
    let id = "COL" # idx.toText();
    let college : Types.College = {
      collegeId = id;
      collegeName = name;
      collegeCode = rawCodeFor(name);  // provisional — recomputed below
      adminIds = [];
      adminCount = 0;
      adminEmail;
      contactPhone = phone;
      commissionPercent = 10;
      isActive = true;
      createdAt = Time.now();
    };
    map.add(id, college);
    // Recompute all codes to resolve any new conflicts
    computeCollegeCodes(map);
    (idx, switch (map.get(id)) { case (?c) c; case null college });
  };

  /// Seed predefined colleges if the map is empty (called on first startup).
  public func seedPredefinedColleges(map : CollegeMap, seq : { var next : Nat }) {
    if (map.size() > 0) return;
    let colleges = [
      ("SRMAP",             "", ""),
      ("KL University",     "", ""),
      ("GITAM",             "", ""),
      ("Andhra University", "", ""),
      ("VIT",               "", ""),
    ];
    for ((name, email, phone) in colleges.vals()) {
      let idx = seq.next;
      seq.next += 1;
      let id = "COL" # idx.toText();
      let college : Types.College = {
        collegeId = id;
        collegeName = name;
        collegeCode = rawCodeFor(name);
        adminIds = [];
        adminCount = 0;
        adminEmail = email;
        contactPhone = phone;
        commissionPercent = 10;
        isActive = true;
        createdAt = Time.now();
      };
      map.add(id, college);
    };
    // Resolve conflicts across all seeded colleges
    computeCollegeCodes(map);
  };

  public func getCollege(map : CollegeMap, id : Common.CollegeId) : ?Types.College {
    map.get(id);
  };

  public func updateCollege(
    map : CollegeMap,
    id : Common.CollegeId,
    name : Text,
    email : Text,
    phone : Text,
    commission : Nat
  ) : Bool {
    switch (map.get(id)) {
      case null false;
      case (?c) {
        map.add(id, { c with collegeName = name; adminEmail = email; contactPhone = phone; commissionPercent = commission });
        // Recompute codes in case the name change creates/resolves a conflict
        computeCollegeCodes(map);
        true;
      };
    };
  };

  /// Add an admin to a college (idempotent — won't duplicate).
  public func addAdminToCollege(
    map     : CollegeMap,
    id      : Common.CollegeId,
    adminId : Common.UserId
  ) : Bool {
    switch (map.get(id)) {
      case null false;
      case (?c) {
        let alreadyAdded = c.adminIds.filter(func(a : Common.UserId) : Bool { a == adminId }).size() > 0;
        if alreadyAdded return false;
        let newIds = c.adminIds.concat([adminId]);
        map.add(id, { c with adminIds = newIds; adminCount = newIds.size() });
        true;
      };
    };
  };

  /// Remove an admin from a college.
  public func removeAdminFromCollege(
    map     : CollegeMap,
    id      : Common.CollegeId,
    adminId : Common.UserId
  ) : Bool {
    switch (map.get(id)) {
      case null false;
      case (?c) {
        let newIds = c.adminIds.filter(func(a : Common.UserId) : Bool { a != adminId });
        map.add(id, { c with adminIds = newIds; adminCount = newIds.size() });
        true;
      };
    };
  };

  /// List all admin IDs for a college.
  public func listAdmins(map : CollegeMap, id : Common.CollegeId) : [Common.UserId] {
    switch (map.get(id)) {
      case null [];
      case (?c) c.adminIds;
    };
  };

  public func listColleges(map : CollegeMap) : [Types.College] {
    map.values().toArray();
  };
};
