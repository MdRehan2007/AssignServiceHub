import { InternetIdentityProvider } from "@caffeineai/core-infrastructure";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import { ToastProvider } from "@/components/ui/Toast";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

// ── Global chunk-load error guard ─────────────────────────────────────────
const CHUNK_RELOAD_KEY = "assignflow_chunk_reload";
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const msg: string =
    reason instanceof Error
      ? reason.message
      : typeof reason === "string"
        ? reason
        : "";
  if (
    msg.includes("Loading chunk") ||
    msg.includes("Failed to fetch dynamically imported module") ||
    (reason instanceof Error && reason.name === "ChunkLoadError")
  ) {
    const already = sessionStorage.getItem(CHUNK_RELOAD_KEY);
    if (!already) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
      window.location.reload();
    }
  }
});

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <InternetIdentityProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </InternetIdentityProvider>
    </QueryClientProvider>
  </AuthProvider>,
);
