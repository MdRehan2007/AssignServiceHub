// Core domain types for the Digital Queue Management System

export type UserRole = "Customer" | "ServiceAgent" | "Administrator";

export type TokenStatus = "Waiting" | "Called" | "Serving" | "Completed";

export type CounterStatus = "Active" | "Idle" | "Closed";

export interface QueueToken {
  tokenId: string;
  userId: string;
  tokenNumber: number;
  queuePosition: number;
  status: TokenStatus;
  counterId?: string;
  createdAt: number;
  calledAt?: number;
  completedAt?: number;
}

export interface ServiceCounter {
  counterId: string;
  counterName: string;
  assignedAgent?: string;
  status: CounterStatus;
}

export interface QueueStats {
  totalServed: number;
  totalWaiting: number;
  averageServiceTimeSecs: number;
  averageWaitTimeSecs: number;
  tokensByStatus: {
    waiting: number;
    called: number;
    serving: number;
    completed: number;
  };
}
