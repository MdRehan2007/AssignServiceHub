import type { TokenStatus } from "@/types/queue";

interface StatusBadgeProps {
  status: TokenStatus;
  className?: string;
}

const STATUS_CONFIG: Record<TokenStatus, { label: string; cls: string }> = {
  Waiting: { label: "Waiting", cls: "badge-waiting" },
  Called: { label: "Called", cls: "badge-called" },
  Serving: { label: "Serving", cls: "badge-serving" },
  Completed: { label: "Completed", cls: "badge-completed" },
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const { label, cls } = STATUS_CONFIG[status];
  return (
    <span
      className={`${cls} ${className}`}
      data-ocid={`status_badge.${status.toLowerCase()}`}
    >
      {label}
    </span>
  );
}
