import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Types "../types/user";
import Common "../types/common";

module {
  public type UserMap = Map.Map<Common.UserId, Types.User>;

  public func getUser(map : UserMap, id : Common.UserId) : ?Types.User {
    map.get(id);
  };

  public func getUserByEmail(map : UserMap, email : Text) : ?Types.User {
    map.values().find(func(u : Types.User) : Bool { u.email == email });
  };

  public func upsertUser(map : UserMap, user : Types.User) : () {
    map.add(user.userId, user);
  };

  public func listUsersByRole(map : UserMap, role : Types.UserRole) : [Types.User] {
    map.values().filter(func(u : Types.User) : Bool {
      switch (u.role, role) {
        case (#databaseAdmin, #databaseAdmin) true;
        case (#collegeAdmin, #collegeAdmin) true;
        case (#customer, #customer) true;
        case _ false;
      };
    }).toArray();
  };

  public func assignRole(map : UserMap, id : Common.UserId, role : Types.UserRole) : Bool {
    switch (map.get(id)) {
      case null false;
      case (?u) {
        map.add(id, { u with role = role });
        true;
      };
    };
  };

  public func deactivateUser(map : UserMap, id : Common.UserId) : Bool {
    switch (map.get(id)) {
      case null false;
      case (?u) {
        map.add(id, { u with isActive = false });
        true;
      };
    };
  };

  public func countUsers(map : UserMap) : Nat {
    map.size();
  };
};
