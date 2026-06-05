import { useMaintenanceContext } from "@/context/MaintenanceContext";
import { useEffect, useState } from "react";

export function MaintenanceBanner() {
  const { maintenanceMode, maintenanceEndTime } = useMaintenanceContext();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  // Slide in on mount when active
  useEffect(() => {
    if (maintenanceMode && !dismissed) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [maintenanceMode, dismissed]);

  if (!maintenanceMode || dismissed) return null;

  const endLabel = maintenanceEndTime
    ? `Estimated completion: ${new Date(maintenanceEndTime).toLocaleString(
        "en-IN",
        { hour: "2-digit", minute: "2-digit", hour12: true },
      )}`
    : null;

  return (
    <div
      style={{
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.35s ease, opacity 0.3s ease",
        background:
          "linear-gradient(90deg, #92400e 0%, #b45309 50%, #d97706 100%)",
        color: "#fff",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        fontSize: 13,
        fontWeight: 500,
        flexShrink: 0,
        zIndex: 100,
        flexWrap: "wrap",
      }}
      data-ocid="maintenance.banner"
      role="alert"
      aria-live="polite"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          flex: 1,
        }}
      >
        <span style={{ fontSize: 16 }}>🔧</span>
        <span>Scheduled maintenance in progress</span>
        {endLabel && (
          <span style={{ opacity: 0.85, fontSize: 12 }}>— {endLabel}</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        style={{
          background: "rgba(255,255,255,0.2)",
          border: "none",
          color: "#fff",
          borderRadius: 6,
          padding: "4px 10px",
          fontSize: 12,
          cursor: "pointer",
          fontWeight: 600,
          flexShrink: 0,
        }}
        aria-label="Dismiss maintenance banner"
        data-ocid="maintenance.banner_dismiss"
      >
        Dismiss
      </button>
    </div>
  );
}
