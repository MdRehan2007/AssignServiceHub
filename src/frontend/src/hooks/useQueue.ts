import type {
  CounterStatus,
  QueueStats,
  QueueToken,
  ServiceCounter,
  UserRole,
} from "@/types/queue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─────────────────────────────────────────────────────────────────────────────
// Simulated in-memory store (replaces backend until bindgen runs for new actor)
// ─────────────────────────────────────────────────────────────────────────────

let _tokens: QueueToken[] = [
  {
    tokenId: "t-001",
    userId: "user-a",
    tokenNumber: 128,
    queuePosition: 1,
    status: "Waiting",
    createdAt: Date.now() - 900000,
  },
  {
    tokenId: "t-002",
    userId: "user-b",
    tokenNumber: 129,
    queuePosition: 2,
    status: "Called",
    createdAt: Date.now() - 780000,
    calledAt: Date.now() - 60000,
  },
  {
    tokenId: "t-003",
    userId: "user-c",
    tokenNumber: 130,
    queuePosition: 3,
    status: "Serving",
    counterId: "counter-1",
    createdAt: Date.now() - 660000,
    calledAt: Date.now() - 120000,
  },
  {
    tokenId: "t-004",
    userId: "user-d",
    tokenNumber: 131,
    queuePosition: 4,
    status: "Waiting",
    createdAt: Date.now() - 540000,
  },
  {
    tokenId: "t-005",
    userId: "user-e",
    tokenNumber: 132,
    queuePosition: 5,
    status: "Waiting",
    createdAt: Date.now() - 420000,
  },
  {
    tokenId: "t-006",
    userId: "user-f",
    tokenNumber: 133,
    queuePosition: 6,
    status: "Waiting",
    createdAt: Date.now() - 300000,
  },
  {
    tokenId: "t-007",
    userId: "user-g",
    tokenNumber: 134,
    queuePosition: 7,
    status: "Completed",
    createdAt: Date.now() - 1200000,
    completedAt: Date.now() - 180000,
  },
  {
    tokenId: "t-008",
    userId: "user-h",
    tokenNumber: 135,
    queuePosition: 8,
    status: "Completed",
    createdAt: Date.now() - 1400000,
    completedAt: Date.now() - 300000,
  },
];

let _counters: ServiceCounter[] = [
  {
    counterId: "counter-1",
    counterName: "Counter A",
    assignedAgent: "agent-1",
    status: "Active",
  },
  {
    counterId: "counter-2",
    counterName: "Counter B",
    assignedAgent: "agent-2",
    status: "Active",
  },
  {
    counterId: "counter-3",
    counterName: "Counter C",
    assignedAgent: "agent-3",
    status: "Idle",
  },
  { counterId: "counter-4", counterName: "Counter D", status: "Closed" },
];

let _nextTokenNumber = 136;

function computeStats(): QueueStats {
  const byStatus = {
    waiting: _tokens.filter((t) => t.status === "Waiting").length,
    called: _tokens.filter((t) => t.status === "Called").length,
    serving: _tokens.filter((t) => t.status === "Serving").length,
    completed: _tokens.filter((t) => t.status === "Completed").length,
  };
  return {
    totalServed: byStatus.completed,
    totalWaiting: byStatus.waiting + byStatus.called,
    averageServiceTimeSecs: 210,
    averageWaitTimeSecs: byStatus.waiting > 0 ? byStatus.waiting * 210 : 0,
    tokensByStatus: byStatus,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer Hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useJoinQueue() {
  const qc = useQueryClient();
  return useMutation<QueueToken, Error, void>({
    mutationFn: async () => {
      await new Promise((r) => setTimeout(r, 600));
      const waitingCount = _tokens.filter((t) => t.status === "Waiting").length;
      const token: QueueToken = {
        tokenId: `t-${Date.now()}`,
        userId: "current-user",
        tokenNumber: _nextTokenNumber++,
        queuePosition: waitingCount + 1,
        status: "Waiting",
        createdAt: Date.now(),
      };
      _tokens = [..._tokens, token];
      return token;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useGetMyToken(tokenId: string | undefined) {
  return useQuery<QueueToken | null>({
    queryKey: ["token", tokenId],
    queryFn: async () => {
      if (!tokenId) return null;
      await new Promise((r) => setTimeout(r, 200));
      return _tokens.find((t) => t.tokenId === tokenId) ?? null;
    },
    enabled: !!tokenId,
    refetchInterval: 3000,
  });
}

export function useCurrentQueue() {
  return useQuery<QueueToken[]>({
    queryKey: ["queue"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 200));
      return [..._tokens].sort((a, b) => a.tokenNumber - b.tokenNumber);
    },
    refetchInterval: 2500,
  });
}

export function useGetQueueStats() {
  return useQuery<QueueStats>({
    queryKey: ["stats"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 200));
      return computeStats();
    },
    refetchInterval: 3000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Agent Hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useCallNext() {
  const qc = useQueryClient();
  return useMutation<QueueToken | null, Error, string>({
    mutationFn: async (counterId: string) => {
      await new Promise((r) => setTimeout(r, 500));
      const next = _tokens.find((t) => t.status === "Waiting");
      if (!next) return null;
      _tokens = _tokens.map((t) =>
        t.tokenId === next.tokenId
          ? { ...t, status: "Called", calledAt: Date.now(), counterId }
          : t,
      );
      return { ...next, status: "Called", calledAt: Date.now(), counterId };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useMarkServing() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (tokenId: string) => {
      await new Promise((r) => setTimeout(r, 300));
      _tokens = _tokens.map((t) =>
        t.tokenId === tokenId ? { ...t, status: "Serving" } : t,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useCompleteService() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (tokenId: string) => {
      await new Promise((r) => setTimeout(r, 300));
      _tokens = _tokens.map((t) =>
        t.tokenId === tokenId
          ? { ...t, status: "Completed", completedAt: Date.now() }
          : t,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin / Counter Management Hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useListCounters() {
  return useQuery<ServiceCounter[]>({
    queryKey: ["counters"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 200));
      return [..._counters];
    },
    refetchInterval: 3000,
  });
}

export function useCreateCounter() {
  const qc = useQueryClient();
  return useMutation<ServiceCounter, Error, { counterName: string }>({
    mutationFn: async ({ counterName }) => {
      await new Promise((r) => setTimeout(r, 400));
      const counter: ServiceCounter = {
        counterId: `counter-${Date.now()}`,
        counterName,
        status: "Idle",
      };
      _counters = [..._counters, counter];
      return counter;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["counters"] }),
  });
}

export function useAssignAgent() {
  const qc = useQueryClient();
  return useMutation<void, Error, { counterId: string; agentId: string }>({
    mutationFn: async ({ counterId, agentId }) => {
      await new Promise((r) => setTimeout(r, 300));
      _counters = _counters.map((c) =>
        c.counterId === counterId ? { ...c, assignedAgent: agentId } : c,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["counters"] }),
  });
}

export function useUpdateCounterStatus() {
  const qc = useQueryClient();
  return useMutation<void, Error, { counterId: string; status: CounterStatus }>(
    {
      mutationFn: async ({ counterId, status }) => {
        await new Promise((r) => setTimeout(r, 300));
        _counters = _counters.map((c) =>
          c.counterId === counterId ? { ...c, status } : c,
        );
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["counters"] }),
    },
  );
}

export function useAddServiceAgent() {
  return useMutation<void, Error, string>({
    mutationFn: async (_principalId: string) => {
      await new Promise((r) => setTimeout(r, 400));
    },
  });
}

export function useAddAdmin() {
  return useMutation<void, Error, string>({
    mutationFn: async (_principalId: string) => {
      await new Promise((r) => setTimeout(r, 400));
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Role / Auth Hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useGetUserRole() {
  return useQuery<UserRole>({
    queryKey: ["userRole"],
    queryFn: async (): Promise<UserRole> => {
      await new Promise((r) => setTimeout(r, 150));
      // Simulated: cycle through roles for demo, default to Administrator
      return "Administrator";
    },
  });
}
