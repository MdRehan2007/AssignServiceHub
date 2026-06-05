import { useMaintenanceContext } from "@/context/MaintenanceContext";
import { ExternalLink, Mail, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

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

export function MaintenanceScreen() {
  const {
    maintenanceEndTime,
    maintenanceMessage,
    whatsappNumber,
    whatsappLink,
    supportEmail,
    supportFormUrl,
  } = useMaintenanceContext();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

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
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [maintenanceEndTime]);

  return (
    <div
      className="maintenance-screen fixed inset-0 w-screen h-screen flex flex-col items-center justify-center"
      style={{
        zIndex: 9999,
        background: "#0a0f1e",
        pointerEvents: "all",
      }}
    >
      {/* Blue glow radial overlay */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(30,64,175,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* Content card */}
      <div
        style={{
          maxWidth: "28rem",
          width: "100%",
          margin: "0 auto",
          padding: "3rem 2rem",
          borderRadius: "1rem",
          background: "rgba(15, 23, 42, 0.9)",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          boxShadow: "0 0 40px rgba(59, 130, 246, 0.15)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Spinner */}
        <div className="maintenance-spinner" />

        {/* Heading */}
        <h1
          className="font-bold text-3xl text-center mt-6 mb-3"
          style={{ color: "#ffffff" }}
        >
          Website Under Maintenance
        </h1>

        {/* Description */}
        <p
          className="text-sm text-center leading-relaxed"
          style={{ color: "#d1d5db" }}
        >
          We are currently upgrading the platform for a better experience.
          Please try again shortly.
        </p>

        {/* Return text */}
        <p
          className="text-sm text-center mt-4 font-medium"
          style={{ color: "#60a5fa" }}
        >
          Service will resume soon.
        </p>

        {/* Countdown timer */}
        {timeLeft !== null && (
          <p
            className="text-sm text-center mt-3 font-semibold"
            style={{ color: "#93c5fd", fontVariantNumeric: "tabular-nums" }}
          >
            {timeLeft > 0
              ? `${formatCountdown(timeLeft)} remaining`
              : "Wrapping up maintenance..."}
          </p>
        )}

        {/* Custom message box */}
        {maintenanceMessage && maintenanceMessage.trim() !== "" && (
          <div
            className="mt-4 w-full"
            style={{
              background: "rgba(30,58,138,0.2)",
              border: "1px solid rgba(59,130,246,0.4)",
              borderRadius: "0.5rem",
              padding: "0.75rem 1rem",
            }}
          >
            <p className="text-sm" style={{ color: "#bfdbfe" }}>
              {maintenanceMessage}
            </p>
          </div>
        )}

        {/* Emergency contact section */}
        {(whatsappNumber || whatsappLink || supportEmail || supportFormUrl) && (
          <div
            className="mt-6 w-full"
            style={{
              borderTop: "1px solid rgba(59,130,246,0.2)",
              paddingTop: "1.25rem",
            }}
          >
            <p
              className="text-sm font-semibold text-center mb-1"
              style={{ color: "#93c5fd" }}
            >
              Need urgent help?
            </p>
            <p
              className="text-xs text-center mb-4"
              style={{ color: "#6b7280" }}
            >
              You can still place orders through:
            </p>

            <div
              className="flex flex-col gap-3 w-full"
              style={{ animation: "maintenance-fade-in 0.5s ease 0.3s both" }}
            >
              {/* WhatsApp button */}
              {(whatsappNumber || whatsappLink) && (
                <a
                  href={
                    whatsappLink ||
                    `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="emergency-contact-btn"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    padding: "0.625rem 1rem",
                    borderRadius: "0.5rem",
                    background: "rgba(21, 128, 61, 0.15)",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                    color: "#86efac",
                    textDecoration: "none",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    transition: "all 0.2s ease",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "rgba(21,128,61,0.28)";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                      "0 0 12px rgba(34,197,94,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "rgba(21,128,61,0.15)";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                      "none";
                  }}
                >
                  <MessageCircle size={15} />📱 WhatsApp
                  {whatsappNumber ? `: ${whatsappNumber}` : ""}
                </a>
              )}

              {/* Email button */}
              {supportEmail && (
                <a
                  href={`mailto:${supportEmail}`}
                  className="emergency-contact-btn"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    padding: "0.625rem 1rem",
                    borderRadius: "0.5rem",
                    background: "rgba(30,64,175,0.15)",
                    border: "1px solid rgba(59,130,246,0.3)",
                    color: "#93c5fd",
                    textDecoration: "none",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    transition: "all 0.2s ease",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "rgba(30,64,175,0.28)";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                      "0 0 12px rgba(59,130,246,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "rgba(30,64,175,0.15)";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                      "none";
                  }}
                >
                  <Mail size={15} />
                  ✉️ Email: {supportEmail}
                </a>
              )}

              {/* Support form button */}
              {supportFormUrl && (
                <a
                  href={supportFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="emergency-contact-btn"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    padding: "0.625rem 1rem",
                    borderRadius: "0.5rem",
                    background: "rgba(109,40,217,0.15)",
                    border: "1px solid rgba(139,92,246,0.3)",
                    color: "#c4b5fd",
                    textDecoration: "none",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    transition: "all 0.2s ease",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "rgba(109,40,217,0.28)";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                      "0 0 12px rgba(139,92,246,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "rgba(109,40,217,0.15)";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                      "none";
                  }}
                >
                  <ExternalLink size={15} />🔗 Direct Support Form
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
