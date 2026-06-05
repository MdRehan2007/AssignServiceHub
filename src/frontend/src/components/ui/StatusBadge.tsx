import type { OrderStatus } from "@/types";

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending_payment: {
    label: "Pending Payment",
    bg: "bg-amber-100",
    text: "text-amber-700",
  },
  payment_verification: {
    label: "Verification",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
  },
  assigned: { label: "Assigned", bg: "bg-blue-100", text: "text-blue-700" },
  in_progress: {
    label: "In Progress",
    bg: "bg-blue-100",
    text: "text-blue-800",
  },
  review: {
    label: "Under Review",
    bg: "bg-purple-100",
    text: "text-purple-700",
  },
  correction: {
    label: "Correction",
    bg: "bg-orange-100",
    text: "text-orange-700",
  },
  completed: { label: "Completed", bg: "bg-green-100", text: "text-green-700" },
  delivered: {
    label: "Delivered",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
  },
  closed: { label: "Closed", bg: "bg-gray-100", text: "text-gray-600" },
  pending: { label: "Pending", bg: "bg-amber-100", text: "text-amber-700" },
  submitted: { label: "Submitted", bg: "bg-blue-100", text: "text-blue-700" },
  verified: { label: "Verified", bg: "bg-green-100", text: "text-green-700" },
  rejected: { label: "Rejected", bg: "bg-red-100", text: "text-red-700" },
  active: { label: "Active", bg: "bg-green-100", text: "text-green-700" },
  inactive: { label: "Inactive", bg: "bg-gray-100", text: "text-gray-600" },
  approved: { label: "Approved", bg: "bg-green-100", text: "text-green-700" },
  open: { label: "Open", bg: "bg-blue-100", text: "text-blue-700" },
  resolved: { label: "Resolved", bg: "bg-green-100", text: "text-green-700" },
  high: { label: "High", bg: "bg-red-100", text: "text-red-700" },
  medium: { label: "Medium", bg: "bg-yellow-100", text: "text-yellow-700" },
  low: { label: "Low", bg: "bg-green-100", text: "text-green-700" },
};

interface StatusBadgeProps {
  status: OrderStatus | string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    bg: "bg-gray-100",
    text: "text-gray-600",
  };
  return (
    <span className={`status-badge ${config.bg} ${config.text} ${className}`}>
      {config.label}
    </span>
  );
}
