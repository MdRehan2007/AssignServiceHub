import { useMaintenanceContext } from "@/context/MaintenanceContext";
import { ExternalLink, Mail, MessageCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return [
    String(h).padStart(2, "0"),
    String(m).padStart(2, "0"),
    String(s).padStart(2, "0"),
  ].join(":");
}

function useNow(active: boolean): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

export function MaintenancePopupModal() {
  const {
    popupOpen,
    closeMaintenancePopup,
    maintenanceEndTime,
    maintenanceMessage,
    whatsappNumber,
    whatsappLink,
    supportEmail,
    supportFormUrl,
  } = useMaintenanceContext();

  const now = useNow(popupOpen);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const overlayRef = useRef<HTMLDialogElement>(null);

  // Countdown timer
  useEffect(() => {
    if (!maintenanceEndTime) {
      setTimeLeft(null);
      return;
    }
    const calc = () => {
      const end = new Date(maintenanceEndTime).getTime();
      setTimeLeft(Math.max(0, end - Date.now()));
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [maintenanceEndTime]);

  // Trap focus and close on Escape
  useEffect(() => {
    if (!popupOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMaintenancePopup();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [popupOpen, closeMaintenancePopup]);

  if (!popupOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLElement>) => {
    if (e.target === overlayRef.current) closeMaintenancePopup();
  };
  const handleOverlayKeyUp = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") closeMaintenancePopup();
  };

  return (
    <dialog
      open
      ref={overlayRef}
      onClick={handleOverlayClick}
      onKeyUp={handleOverlayKeyUp}
      aria-modal="true"
      aria-label="Website Under Maintenance"
      data-ocid="maintenance.dialog"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        animation: "maintenance-fade-in 0.25s ease both",
      }}
    >
      {/* Blue radial glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "480px",
          height: "480px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(30,64,175,0.18) 0%, transparent 70%)",
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />

      {/* Modal card */}
      <div
        data-ocid="maintenance.modal"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "26rem",
          background: "#0d1526",
          border: "1px solid rgba(59,130,246,0.35)",
          borderRadius: "1rem",
          boxShadow:
            "0 0 0 1px rgba(59,130,246,0.1), 0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(59,130,246,0.12)",
          overflow: "hidden",
          animation:
            "maintenance-slide-up 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {/* Header bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.25rem 0.75rem",
            borderBottom: "1px solid rgba(59,130,246,0.15)",
            background:
              "linear-gradient(135deg, rgba(30,58,138,0.4) 0%, rgba(15,23,42,0.4) 100%)",
          }}
        >
          {/* Status pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(234,179,8,0.12)",
              border: "1px solid rgba(234,179,8,0.3)",
              borderRadius: "9999px",
              padding: "0.25rem 0.75rem",
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "#fbbf24",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#fbbf24",
                boxShadow: "0 0 6px #fbbf24",
                animation: "maintenance-pulse 1.5s ease-in-out infinite",
              }}
            />
            Maintenance Mode
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={closeMaintenancePopup}
            aria-label="Close maintenance notice"
            data-ocid="maintenance.close_button"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "0.375rem",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(239,68,68,0.2)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(239,68,68,0.4)";
              (e.currentTarget as HTMLButtonElement).style.color = "#fca5a5";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLButtonElement).style.color =
                "rgba(255,255,255,0.5)";
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "1.75rem 1.5rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* Spinner */}
          <div
            aria-hidden="true"
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              border: "3px solid rgba(59,130,246,0.2)",
              borderTopColor: "#3b82f6",
              animation: "spin 0.9s linear infinite",
              marginBottom: "1.25rem",
              boxShadow: "0 0 20px rgba(59,130,246,0.25)",
            }}
          />

          {/* Heading */}
          <h2
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              color: "#f1f5f9",
              marginBottom: "0.5rem",
              lineHeight: 1.3,
            }}
          >
            Website Under Maintenance
          </h2>

          {/* Message */}
          <p
            style={{
              fontSize: "0.875rem",
              color: "#94a3b8",
              lineHeight: 1.6,
              marginBottom: "1rem",
            }}
          >
            We are upgrading the platform. Please try again later.
          </p>

          {/* Custom admin message */}
          {maintenanceMessage && maintenanceMessage.trim() !== "" && (
            <div
              style={{
                width: "100%",
                background: "rgba(30,58,138,0.2)",
                border: "1px solid rgba(59,130,246,0.3)",
                borderRadius: "0.5rem",
                padding: "0.625rem 0.875rem",
                marginBottom: "1rem",
              }}
            >
              <p style={{ fontSize: "0.8rem", color: "#bfdbfe" }}>
                {maintenanceMessage}
              </p>
            </div>
          )}

          {/* Current timestamp */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.375rem",
              width: "100%",
              background: "rgba(15,23,42,0.6)",
              border: "1px solid rgba(59,130,246,0.15)",
              borderRadius: "0.5rem",
              padding: "0.625rem 0.875rem",
              marginBottom: timeLeft !== null ? "0.75rem" : "0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                Current Time
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#93c5fd",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {now.toLocaleTimeString()}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Date</span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#93c5fd",
                }}
              >
                {now.toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Countdown timer */}
          {timeLeft !== null && (
            <div
              style={{
                width: "100%",
                background: "rgba(30,58,138,0.15)",
                border: "1px solid rgba(59,130,246,0.2)",
                borderRadius: "0.5rem",
                padding: "0.625rem 0.875rem",
                marginBottom: "0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                Est. return in
              </span>
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: timeLeft > 0 ? "#60a5fa" : "#34d399",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {timeLeft > 0 ? formatCountdown(timeLeft) : "Wrapping up…"}
              </span>
            </div>
          )}

          {/* Emergency contacts */}
          {(whatsappNumber ||
            whatsappLink ||
            supportEmail ||
            supportFormUrl) && (
            <div
              style={{
                width: "100%",
                marginTop: "1.25rem",
                paddingTop: "1.125rem",
                borderTop: "1px solid rgba(59,130,246,0.15)",
              }}
            >
              <p
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "0.625rem",
                }}
              >
                Need Urgent Help?
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {(whatsappNumber || whatsappLink) && (
                  <a
                    href={
                      whatsappLink ||
                      `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ocid="maintenance.whatsapp_button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 0.875rem",
                      borderRadius: "0.5rem",
                      background: "rgba(21,128,61,0.12)",
                      border: "1px solid rgba(34,197,94,0.25)",
                      color: "#86efac",
                      textDecoration: "none",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background =
                        "rgba(21,128,61,0.24)";
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                        "0 0 12px rgba(34,197,94,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background =
                        "rgba(21,128,61,0.12)";
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                        "none";
                    }}
                  >
                    <MessageCircle size={14} />
                    WhatsApp Support
                    {whatsappNumber ? `: ${whatsappNumber}` : ""}
                  </a>
                )}

                {supportEmail && (
                  <a
                    href={`mailto:${supportEmail}`}
                    data-ocid="maintenance.email_button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 0.875rem",
                      borderRadius: "0.5rem",
                      background: "rgba(30,64,175,0.12)",
                      border: "1px solid rgba(59,130,246,0.25)",
                      color: "#93c5fd",
                      textDecoration: "none",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background =
                        "rgba(30,64,175,0.24)";
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                        "0 0 12px rgba(59,130,246,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background =
                        "rgba(30,64,175,0.12)";
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                        "none";
                    }}
                  >
                    <Mail size={14} />
                    Support Email: {supportEmail}
                  </a>
                )}

                {supportFormUrl && (
                  <a
                    href={supportFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ocid="maintenance.support_link_button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 0.875rem",
                      borderRadius: "0.5rem",
                      background: "rgba(109,40,217,0.12)",
                      border: "1px solid rgba(139,92,246,0.25)",
                      color: "#c4b5fd",
                      textDecoration: "none",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background =
                        "rgba(109,40,217,0.24)";
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                        "0 0 12px rgba(139,92,246,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background =
                        "rgba(109,40,217,0.12)";
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                        "none";
                    }}
                  >
                    <ExternalLink size={14} />
                    Direct Support Form
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes maintenance-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes maintenance-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes maintenance-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </dialog>
  );
}
