import List "mo:core/List";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Types "../types/queue";

module {
  // ── Queue token operations ─────────────────────────────────────────────────

  /// Returns an existing active token for the user if one exists, otherwise creates a new one.
  public func joinQueue(
    tokens       : List.List<Types.QueueToken>,
    nextTokenNum : Nat,
    userId       : Principal,
  ) : (Types.QueueToken, Bool) {
    // Check for existing active token (Waiting or Called or Serving)
    switch (tokens.find(func(t : Types.QueueToken) : Bool {
      Principal.equal(t.userId, userId) and (
        t.status == #Waiting or t.status == #Called or t.status == #Serving
      )
    })) {
      case (?existing) (existing, false);
      case null {
        let position = tokens.filter(func(t : Types.QueueToken) : Bool {
          t.status == #Waiting or t.status == #Called
        }).size() + 1;
        let token : Types.QueueToken = {
          tokenId       = nextTokenNum.toText();
          userId;
          tokenNumber   = nextTokenNum;
          queuePosition = position;
          status        = #Waiting;
          counterId     = null;
          createdAt     = Time.now();
          calledAt      = null;
          completedAt   = null;
        };
        (token, true)
      };
    };
  };

  public func getToken(
    tokens  : List.List<Types.QueueToken>,
    tokenId : Text,
  ) : ?Types.QueueToken {
    tokens.find(func(t : Types.QueueToken) : Bool { t.tokenId == tokenId })
  };

  public func getCurrentQueue(tokens : List.List<Types.QueueToken>) : [Types.QueueToken] {
    let active = tokens.filter(func(t : Types.QueueToken) : Bool {
      t.status == #Waiting or t.status == #Called or t.status == #Serving
    });
    // Sort by queuePosition ascending
    active.sort(func(a : Types.QueueToken, b : Types.QueueToken) : { #less; #equal; #greater } {
      Nat.compare(a.queuePosition, b.queuePosition)
    }).toArray()
  };

  public func getQueueStats(tokens : List.List<Types.QueueToken>) : Types.QueueStats {
    var waiting          = 0;
    var called           = 0;
    var serving          = 0;
    var completed        = 0;
    var totalServiceSecs = 0;
    var serviceCount     = 0;
    var totalWaitSecs    = 0;
    var waitCount        = 0;

    tokens.forEach(func(t : Types.QueueToken) {
      switch (t.status) {
        case (#Waiting) { waiting += 1 };
        case (#Called) {
          called += 1;
          // Wait time: calledAt - createdAt
          switch (t.calledAt) {
            case (?ca) {
              let secs = (ca - t.createdAt) / 1_000_000_000;
              if (secs > 0) {
                totalWaitSecs += secs.toNat();
                waitCount     += 1;
              };
            };
            case null {};
          };
        };
        case (#Serving) {
          serving += 1;
          switch (t.calledAt) {
            case (?ca) {
              let secs = (ca - t.createdAt) / 1_000_000_000;
              if (secs > 0) {
                totalWaitSecs += secs.toNat();
                waitCount     += 1;
              };
            };
            case null {};
          };
        };
        case (#Completed) {
          completed += 1;
          // Service time: completedAt - calledAt
          switch (t.calledAt, t.completedAt) {
            case (?ca, ?co) {
              let svc = (co - ca) / 1_000_000_000;
              if (svc > 0) {
                totalServiceSecs += svc.toNat();
                serviceCount     += 1;
              };
              // Wait time for completed tokens
              let wait = (ca - t.createdAt) / 1_000_000_000;
              if (wait > 0) {
                totalWaitSecs += wait.toNat();
                waitCount     += 1;
              };
            };
            case _ {};
          };
        };
      };
    });

    let avgService = if (serviceCount == 0) 0 else totalServiceSecs / serviceCount;
    let avgWait    = if (waitCount == 0)    0 else totalWaitSecs    / waitCount;

    {
      totalServed            = completed;
      totalWaiting           = waiting;
      averageServiceTimeSecs = avgService;
      averageWaitTimeSecs    = avgWait;
      tokensByStatus         = { waiting; called; serving; completed };
    };
  };

  // ── Agent / counter operations ─────────────────────────────────────────────

  public func callNext(
    tokens    : List.List<Types.QueueToken>,
    counters  : List.List<Types.ServiceCounter>,
    counterId : Text,
  ) : ?Types.QueueToken {
    // Verify counter exists
    switch (counters.find(func(c : Types.ServiceCounter) : Bool { c.counterId == counterId })) {
      case null { Runtime.trap("Counter not found: " # counterId) };
      case (?_) {
        // Find next waiting token (lowest tokenNumber)
        var best : ?Types.QueueToken = null;
        tokens.forEach(func(t : Types.QueueToken) {
          if (t.status == #Waiting) {
            switch best {
              case null { best := ?t };
              case (?b) {
                if (t.tokenNumber < b.tokenNumber) { best := ?t };
              };
            };
          };
        });
        switch best {
          case null null;
          case (?token) {
            let updated = { token with
              status    = #Called;
              counterId = ?counterId;
              calledAt  = ?Time.now();
            };
            tokens.mapInPlace(func(t : Types.QueueToken) : Types.QueueToken {
              if (t.tokenId == token.tokenId) updated else t
            });
            ?updated
          };
        };
      };
    };
  };

  public func markServing(
    tokens  : List.List<Types.QueueToken>,
    tokenId : Text,
  ) : () {
    let token = switch (getToken(tokens, tokenId)) {
      case (?t) t;
      case null { Runtime.trap("Token not found: " # tokenId) };
    };
    if (token.status != #Called) {
      Runtime.trap("Token must be in Called state to transition to Serving");
    };
    tokens.mapInPlace(func(t : Types.QueueToken) : Types.QueueToken {
      if (t.tokenId == tokenId) { { t with status = #Serving } } else t
    });
  };

  public func completeService(
    tokens  : List.List<Types.QueueToken>,
    tokenId : Text,
  ) : () {
    let token = switch (getToken(tokens, tokenId)) {
      case (?t) t;
      case null { Runtime.trap("Token not found: " # tokenId) };
    };
    if (token.status != #Serving and token.status != #Called) {
      Runtime.trap("Token must be in Serving or Called state to complete");
    };
    tokens.mapInPlace(func(t : Types.QueueToken) : Types.QueueToken {
      if (t.tokenId == tokenId) {
        { t with status = #Completed; completedAt = ?Time.now() }
      } else t
    });
  };

  // ── Counter management ─────────────────────────────────────────────────────

  public func createCounter(
    nextCounterId : Nat,
    name          : Text,
  ) : Types.ServiceCounter {
    {
      counterId     = "C" # nextCounterId.toText();
      counterName   = name;
      assignedAgent = null;
      status        = #Idle;
    };
  };

  public func assignAgent(
    counters  : List.List<Types.ServiceCounter>,
    counterId : Text,
    agent     : Principal,
  ) : () {
    switch (counters.find(func(c : Types.ServiceCounter) : Bool { c.counterId == counterId })) {
      case null { Runtime.trap("Counter not found: " # counterId) };
      case (?_) {};
    };
    counters.mapInPlace(func(c : Types.ServiceCounter) : Types.ServiceCounter {
      if (c.counterId == counterId) {
        { c with assignedAgent = ?agent; status = #Active }
      } else c
    });
  };

  public func updateCounterStatus(
    counters  : List.List<Types.ServiceCounter>,
    counterId : Text,
    status    : Types.CounterStatus,
  ) : () {
    switch (counters.find(func(c : Types.ServiceCounter) : Bool { c.counterId == counterId })) {
      case null { Runtime.trap("Counter not found: " # counterId) };
      case (?_) {};
    };
    counters.mapInPlace(func(c : Types.ServiceCounter) : Types.ServiceCounter {
      if (c.counterId == counterId) { { c with status } } else c
    });
  };

  public func listCounters(counters : List.List<Types.ServiceCounter>) : [Types.ServiceCounter] {
    counters.toArray()
  };

  // ── Role helpers ───────────────────────────────────────────────────────────

  public func getUserRole(
    admins        : Set.Set<Principal>,
    serviceAgents : Set.Set<Principal>,
    caller        : Principal,
  ) : Types.UserRole {
    if (admins.contains(caller))             #Administrator
    else if (serviceAgents.contains(caller)) #ServiceAgent
    else                                     #Customer
  };
};
