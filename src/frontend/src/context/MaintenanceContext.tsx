import { getSystemSettings } from "@/services/api";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface MaintenanceContextType {
  maintenanceMode: boolean;
  maintenanceEndTime: string | null;
  maintenanceMessage: string;
  whatsappNumber: string;
  whatsappLink: string;
  supportEmail: string;
  supportFormUrl: string;
  isLoading: boolean;
  /** Whether the maintenance popup modal is currently visible */
  popupOpen: boolean;
  /** Show the maintenance popup modal (call when a restricted action is attempted) */
  openMaintenancePopup: () => void;
  /** Dismiss the maintenance popup modal */
  closeMaintenancePopup: () => void;
  setMaintenanceMode: (v: boolean) => void;
  setMaintenanceEndTime: (v: string | null) => void;
  setMaintenanceMessage: (v: string) => void;
}

const MaintenanceContext = createContext<MaintenanceContextType | null>(null);

export function MaintenanceProvider({ children }: { children: ReactNode }) {
  // CRITICAL: Default to false — never show maintenance as default state
  const [maintenanceMode, setMaintenanceModeState] = useState<boolean>(false);
  const [maintenanceEndTime, setMaintenanceEndTimeState] = useState<
    string | null
  >(null);
  const [maintenanceMessage, setMaintenanceMessageState] = useState<string>(
    "We are performing scheduled maintenance to improve your experience.",
  );
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const [whatsappLink, setWhatsappLink] = useState<string>("");
  const [supportEmail, setSupportEmail] = useState<string>("");
  const [supportFormUrl, setSupportFormUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [popupOpen, setPopupOpen] = useState<boolean>(false);

  const prevMaintenance = useRef<boolean>(false);

  const openMaintenancePopup = useCallback(() => setPopupOpen(true), []);
  const closeMaintenancePopup = useCallback(() => setPopupOpen(false), []);

  const setMaintenanceMode = useCallback((v: boolean) => {
    setMaintenanceModeState(v);
  }, []);

  const setMaintenanceEndTime = useCallback((v: string | null) => {
    setMaintenanceEndTimeState(v);
  }, []);

  const setMaintenanceMessage = useCallback((v: string) => {
    setMaintenanceMessageState(v);
  }, []);

  // Poll backend every 5 seconds to sync maintenance mode.
  // isInitial=true for the very first call — sets isLoading=false when done.
  // On failure: default to false (fail open, never fail closed).
  // Clears any stale maintenance_settings from previous sessions on mount.
  useEffect(() => {
    // Purge any stale localStorage value that might have been left from a
    // previous session where maintenance was ON. This prevents the app from
    // appearing stuck in maintenance mode after a redeploy or browser refresh.
    // The real state will be re-read fresh from getSystemSettings() immediately.
    try {
      const raw = localStorage.getItem("maintenance_settings");
      if (raw) {
        const parsed = JSON.parse(raw) as { maintenanceMode?: boolean };
        // Only clear if it was stuck ON — preserve other settings (contact info etc.)
        if (parsed.maintenanceMode === true) {
          parsed.maintenanceMode = false;
          localStorage.setItem("maintenance_settings", JSON.stringify(parsed));
        }
      }
    } catch {
      // If anything is corrupt, wipe the whole key so we start fresh
      localStorage.removeItem("maintenance_settings");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const poll = async (isInitial: boolean) => {
      try {
        const settings = await getSystemSettings();
        if (cancelled) return;

        const newMode = settings.maintenanceMode ?? false;
        const newEndTime = settings.maintenanceEndTime ?? null;
        const newMsg =
          settings.maintenanceMessage ||
          "We are performing scheduled maintenance to improve your experience.";

        // Force-logout non-HEAD_ADMIN users when maintenance is active.
        // Case 1: OFF→ON transition (detected right now).
        // Case 2: User logged in BEFORE maintenance was enabled — catch on
        //         subsequent polls using maintenanceEnabledAt vs user.loginTime.
        if (newMode === true) {
          try {
            const stored = localStorage.getItem("assignflow_user");
            if (stored) {
              const u = JSON.parse(stored) as {
                role?: string;
                email?: string;
                loginTime?: number;
              };
              const isHeadAdmin =
                u.role === "headAdmin" ||
                (typeof u.email === "string" &&
                  u.email.trim().toLowerCase() === "mhdrihan2007@gmail.com");
              if (!isHeadAdmin) {
                const enabledAt = settings.maintenanceEnabledAt;
                // OFF→ON transition: always force-logout
                if (prevMaintenance.current === false) {
                  localStorage.removeItem("assignflow_user");
                } else if (
                  // Already in maintenance: force-logout if maintenance was
                  // enabled AFTER this session started
                  typeof enabledAt === "number" &&
                  typeof u.loginTime === "number" &&
                  enabledAt > u.loginTime
                ) {
                  localStorage.removeItem("assignflow_user");
                } else if (
                  // No timestamps available: force-logout to be safe
                  typeof enabledAt !== "number" ||
                  typeof u.loginTime !== "number"
                ) {
                  localStorage.removeItem("assignflow_user");
                }
              }
            }
          } catch {
            /* ignore */
          }
        }

        prevMaintenance.current = newMode;
        setMaintenanceModeState(newMode);
        setMaintenanceEndTimeState(newEndTime);
        setMaintenanceMessageState(newMsg);
        setWhatsappNumber(settings.whatsappNumber ?? "");
        setWhatsappLink(settings.whatsappLink ?? "");
        setSupportEmail(settings.supportEmail ?? "");
        setSupportFormUrl(settings.supportFormUrl ?? "");
      } catch {
        // Network/fetch error: default to false (fail open)
        if (!cancelled && isInitial) {
          setMaintenanceModeState(false);
        }
      } finally {
        if (!cancelled && isInitial) {
          setIsLoading(false);
        }
      }
    };

    poll(true);
    const interval = setInterval(() => poll(false), 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <MaintenanceContext.Provider
      value={{
        maintenanceMode,
        maintenanceEndTime,
        maintenanceMessage,
        whatsappNumber,
        whatsappLink,
        supportEmail,
        supportFormUrl,
        isLoading,
        popupOpen,
        openMaintenancePopup,
        closeMaintenancePopup,
        setMaintenanceMode,
        setMaintenanceEndTime,
        setMaintenanceMessage,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenanceContext(): MaintenanceContextType {
  const ctx = useContext(MaintenanceContext);
  if (!ctx)
    throw new Error(
      "useMaintenanceContext must be used inside MaintenanceProvider",
    );
  return ctx;
}
