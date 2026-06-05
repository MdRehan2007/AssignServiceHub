module {
  // ── Role ──────────────────────────────────────────────────────────────────
  public type UserRole = {
    #Customer;
    #ServiceAgent;
    #Administrator;
  };

  // ── Token lifecycle ───────────────────────────────────────────────────────
  public type TokenStatus = {
    #Waiting;
    #Called;
    #Serving;
    #Completed;
  };

  // ── Counter status ────────────────────────────────────────────────────────
  public type CounterStatus = {
    #Active;
    #Idle;
    #Closed;
  };

  // ── Agent status ──────────────────────────────────────────────────────────
  public type AgentStatus = {
    #Available;
    #Serving;
    #OnBreak;
    #Offline;
  };

  // ── Entities ──────────────────────────────────────────────────────────────
  public type QueueToken = {
    tokenId       : Text;
    userId        : Principal;
    tokenNumber   : Nat;
    queuePosition : Nat;
    status        : TokenStatus;
    counterId     : ?Text;
    createdAt     : Int;
    calledAt      : ?Int;
    completedAt   : ?Int;
  };

  public type ServiceCounter = {
    counterId     : Text;
    counterName   : Text;
    assignedAgent : ?Principal;
    status        : CounterStatus;
  };

  // ── Analytics ─────────────────────────────────────────────────────────────
  public type QueueStats = {
    totalServed            : Nat;
    totalWaiting           : Nat;
    averageServiceTimeSecs : Nat;
    averageWaitTimeSecs    : Nat;
    tokensByStatus         : {
      waiting   : Nat;
      called    : Nat;
      serving   : Nat;
      completed : Nat;
    };
  };
};
