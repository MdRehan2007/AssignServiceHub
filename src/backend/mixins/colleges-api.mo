import Map "mo:core/Map";
import CollegeTypes "../types/college";
import CommonTypes "../types/common";
import CollegesLib "../lib/colleges";

mixin (
  collegesMap : Map.Map<CommonTypes.CollegeId, CollegeTypes.College>,
  collegeSeq : { var next : Nat }
) {
  public shared ({ caller }) func createCollege(
    name : Text,
    adminEmail : Text,
    phone : Text
  ) : async CollegeTypes.College {
    let (_, college) = CollegesLib.createCollege(collegesMap, collegeSeq, name, adminEmail, phone);
    college;
  };

  public shared ({ caller }) func getCollege(id : CommonTypes.CollegeId) : async ?CollegeTypes.College {
    CollegesLib.getCollege(collegesMap, id);
  };

  public shared ({ caller }) func updateCollege(
    id : CommonTypes.CollegeId,
    name : Text,
    email : Text,
    phone : Text,
    commission : Nat
  ) : async Bool {
    CollegesLib.updateCollege(collegesMap, id, name, email, phone, commission);
  };

  public query func listColleges() : async [CollegeTypes.College] {
    CollegesLib.listColleges(collegesMap);
  };

  public query func generateAdminIdPreview(collegeName : Text, seq : Nat) : async Text {
    CollegesLib.generateAdminId(collegeName, seq);
  };

  /// Add an admin to a college (multiple admins supported).
  public shared ({ caller }) func addAdminToCollege(
    collegeId : CommonTypes.CollegeId,
    adminId   : CommonTypes.UserId
  ) : async Bool {
    CollegesLib.addAdminToCollege(collegesMap, collegeId, adminId);
  };

  /// Remove an admin from a college.
  public shared ({ caller }) func removeAdminFromCollege(
    collegeId : CommonTypes.CollegeId,
    adminId   : CommonTypes.UserId
  ) : async Bool {
    CollegesLib.removeAdminFromCollege(collegesMap, collegeId, adminId);
  };

  /// List all admin IDs for a college.
  public query func listCollegeAdmins(collegeId : CommonTypes.CollegeId) : async [CommonTypes.UserId] {
    CollegesLib.listAdmins(collegesMap, collegeId);
  };
};
