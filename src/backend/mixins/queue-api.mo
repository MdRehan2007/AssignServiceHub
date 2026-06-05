import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Set "mo:core/Set";
import Types "../types/queue";
import QueueLib "../lib/queue";

mixin (
  tokens        : List.List<Types.QueueToken>,
  counters      : List.List<Types.ServiceCounter>,
  admins        : Set.Set<Principal>,
  serviceAgents : Set.Set<Principal>,
) {
  var nextTokenNum  : Nat = 1;
  var nextCounterId : Nat = 1;

  // ── Customer API ───────────────────────────────────────────────────────────

  /// Joins the queue. Returns existing active token if user already has one.
  public shared ({ caller }) func joinQueue() : async Types.QueueToken {
    let (token, isNew) = QueueLib.joinQueue(tokens, nextTokenNum, caller);
    if (isNew) {
      tokens.add(token);
      nextTokenNum += 1;
    };
    token
  };

  public shared query ({ caller }) func getMyToken(tokenId : Text) : async ?Types.QueueToken {
    switch (QueueLib.getToken(tokens, tokenId)) {
      case (?t) {
        if (t.userId == caller) ?t else null
      };
      case null null;
    };
  };

  public shared query func getCurrentQueue() : async [Types.QueueToken] {
    QueueLib.getCurrentQueue(tokens)
  };

  public shared query func getQueueStats() : async Types.QueueStats {
    QueueLib.getQueueStats(tokens)
  };

  // ── Service agent API ──────────────────────────────────────────────────────

  public shared ({ caller }) func callNext(counterId : Text) : async ?Types.QueueToken {
    if (not serviceAgents.contains(caller) and not admins.contains(caller)) {
      Runtime.trap("Unauthorized: must be a service agent or admin");
    };
    QueueLib.callNext(tokens, counters, counterId)
  };

  public shared ({ caller }) func markServing(tokenId : Text) : async () {
    if (not serviceAgents.contains(caller) and not admins.contains(caller)) {
      Runtime.trap("Unauthorized: must be a service agent or admin");
    };
    QueueLib.markServing(tokens, tokenId)
  };

  public shared ({ caller }) func completeService(tokenId : Text) : async () {
    if (not serviceAgents.contains(caller) and not admins.contains(caller)) {
      Runtime.trap("Unauthorized: must be a service agent or admin");
    };
    QueueLib.completeService(tokens, tokenId)
  };

  // ── Admin — counter management ─────────────────────────────────────────────

  public shared ({ caller }) func createCounter(name : Text) : async Types.ServiceCounter {
    if (not admins.contains(caller)) {
      Runtime.trap("Unauthorized: must be an admin");
    };
    let counter = QueueLib.createCounter(nextCounterId, name);
    counters.add(counter);
    nextCounterId += 1;
    counter
  };

  public shared ({ caller }) func assignAgent(counterId : Text, agent : Principal) : async () {
    if (not admins.contains(caller)) {
      Runtime.trap("Unauthorized: must be an admin");
    };
    QueueLib.assignAgent(counters, counterId, agent)
  };

  public shared ({ caller }) func updateCounterStatus(counterId : Text, status : Types.CounterStatus) : async () {
    if (not admins.contains(caller)) {
      Runtime.trap("Unauthorized: must be an admin");
    };
    QueueLib.updateCounterStatus(counters, counterId, status)
  };

  public shared query func listCounters() : async [Types.ServiceCounter] {
    QueueLib.listCounters(counters)
  };

  // ── Admin — user role management ───────────────────────────────────────────

  /// Adds a service agent. First caller bootstraps as admin if no admins exist yet.
  public shared ({ caller }) func addServiceAgent(agent : Principal) : async () {
    if (admins.isEmpty()) {
      admins.add(caller);
    } else if (not admins.contains(caller)) {
      Runtime.trap("Unauthorized: must be an admin");
    };
    serviceAgents.add(agent)
  };

  /// Adds an admin. First caller bootstraps as admin if no admins exist yet.
  public shared ({ caller }) func addAdmin(admin : Principal) : async () {
    if (admins.isEmpty()) {
      admins.add(caller);
    } else if (not admins.contains(caller)) {
      Runtime.trap("Unauthorized: must be an admin");
    };
    admins.add(admin)
  };

  public shared query func isAdmin(principal : Principal) : async Bool {
    admins.contains(principal)
  };

  public shared query func isServiceAgent(principal : Principal) : async Bool {
    serviceAgents.contains(principal)
  };

  public shared query ({ caller }) func getUserRole() : async Types.UserRole {
    QueueLib.getUserRole(admins, serviceAgents, caller)
  };
};
