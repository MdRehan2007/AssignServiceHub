import type { OrderStatus, ServiceType } from "@/types";

export function formatCurrency(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(ts);
}

export function getStatusLabel(s: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pendingPaymentVerification: "Pending Payment Verification",
    activeReadyToStart: "Active / Ready to Start",
    pending_payment: "Pending Payment",
    payment_verification: "Payment Verification",
    active: "Active",
    assigned: "Assigned",
    in_progress: "In Progress",
    review: "Under Review",
    correction: "Correction Requested",
    completed: "Completed",
    delivered: "Delivered",
    closed: "Closed",
    cancelled: "Cancelled",
  };
  return labels[s] ?? s;
}

export function getServiceLabel(t: ServiceType): string {
  const labels: Record<ServiceType, string> = {
    HardCopy: "Hard Copy",
    SoftCopy: "Soft Copy",
    RecordWriting: "Record Writing",
    NotesWriting: "Notes Writing",
    Other: "Other",
  };
  return labels[t] ?? t;
}

export function truncateText(s: string, n: number): string {
  if (s.length <= n) return s;
  return `${s.slice(0, n)}…`;
}

export function generateRandomId(): string {
  return `AF${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pendingPaymentVerification: "#f59e0b",
    activeReadyToStart: "#10b981",
    pending_payment: "#f59e0b",
    payment_verification: "#eab308",
    active: "#10b981",
    assigned: "#3b82f6",
    in_progress: "#2563eb",
    review: "#8b5cf6",
    correction: "#f97316",
    completed: "#22c55e",
    delivered: "#10b981",
    closed: "#6b7280",
    cancelled: "#ef4444",
  };
  return colors[status] ?? "#6b7280";
}
