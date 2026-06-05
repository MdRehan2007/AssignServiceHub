import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

interface Trend {
  value: number;
  positive: boolean;
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: Trend;
  iconBg?: string;
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  iconBg = "bg-blue-50",
  className = "",
}: StatCardProps) {
  return (
    <div className={`stat-card animate-fadeIn ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div
              className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.positive ? "text-green-600" : "text-red-500"}`}
            >
              {trend.positive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{trend.value}% this month</span>
            </div>
          )}
        </div>
        <div className={`${iconBg} p-3 rounded-xl`}>{icon}</div>
      </div>
    </div>
  );
}
