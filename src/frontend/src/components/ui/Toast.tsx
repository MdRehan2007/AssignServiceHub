import { CheckCircle, Info, X, XCircle } from "lucide-react";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = `toast_${Date.now()}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        4500,
      );
    },
    [],
  );

  const removeToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const iconMap: Record<ToastType, ReactNode> = {
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    error: <XCircle className="h-4 w-4 text-red-500" />,
    info: <Info className="h-4 w-4 text-blue-500" />,
    warning: <Info className="h-4 w-4 text-amber-500" />,
  };

  const bgMap: Record<ToastType, string> = {
    success: "border-green-500/30 bg-gray-900",
    error: "border-red-500/30 bg-gray-900",
    info: "border-blue-500/30 bg-gray-900",
    warning: "border-amber-500/30 bg-gray-900",
  };

  const textColorMap: Record<ToastType, string> = {
    success: "text-green-100",
    error: "text-red-100",
    info: "text-blue-100",
    warning: "text-amber-100",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border ${bgMap[toast.type]} animate-slideUp min-w-[280px] max-w-sm backdrop-blur-sm`}
            data-ocid="toast"
          >
            {iconMap[toast.type]}
            <span className={`flex-1 text-sm ${textColorMap[toast.type]}`}>
              {toast.message}
            </span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
