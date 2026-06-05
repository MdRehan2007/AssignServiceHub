import { Check } from "lucide-react";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  animated?: boolean;
}

const SIZE_MAP = {
  sm: { circle: "h-5 w-5", icon: "h-3 w-3", text: "text-[10px]" },
  md: { circle: "h-7 w-7", icon: "h-4 w-4", text: "text-xs" },
  lg: { circle: "h-10 w-10", icon: "h-6 w-6", text: "text-sm" },
};

export default function VerifiedBadge({
  size = "md",
  showText = true,
  animated = true,
}: VerifiedBadgeProps) {
  const s = SIZE_MAP[size];
  return (
    <div
      className={`inline-flex items-center gap-1.5 ${animated ? "animate-scaleIn" : ""}`}
    >
      <div
        className={`${s.circle} rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center`}
      >
        <Check className={`${s.icon} text-green-500`} strokeWidth={3} />
      </div>
      {showText && (
        <span
          className={`${s.text} font-semibold text-green-600 uppercase tracking-wider`}
        >
          Verified
        </span>
      )}
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out both;
        }
      `}</style>
    </div>
  );
}
