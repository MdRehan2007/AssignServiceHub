import { MaintenancePopupModal } from "@/components/MaintenancePopupModal";
import {
  MaintenanceProvider,
  useMaintenanceContext,
} from "@/context/MaintenanceContext";
import { useAuth } from "@/hooks/useAuth";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  Suspense,
  lazy,
} from "react";

// ── Chunk load error boundary ─────────────────────────────────────────────
const CHUNK_RELOAD_KEY = "assignflow_chunk_reload";

function isChunkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.message.includes("Loading chunk") ||
    err.message.includes("Failed to fetch dynamically imported module") ||
    err.name === "ChunkLoadError"
  );
}

interface EBState {
  hasError: boolean;
}
class ChunkErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false };

  static getDerivedStateFromError(err: Error): EBState {
    if (isChunkError(err)) return { hasError: true };
    return { hasError: false };
  }

  componentDidCatch(err: Error, _info: ErrorInfo) {
    if (isChunkError(err)) {
      const already = sessionStorage.getItem(CHUNK_RELOAD_KEY);
      if (!already) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Reloading application…
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Lazy pages ────────────────────────────────────────────────────────────
const LandingPage = lazy(() =>
  import("@/pages/LandingPage").then((m) => ({ default: m.LandingPage })),
);
const JoinTeamPage = lazy(() =>
  import("@/pages/JoinTeamPage").then((m) => ({ default: m.JoinTeamPage })),
);

// Customer pages
const CustomerDashboard = lazy(() =>
  import("@/pages/customer/Dashboard").then((m) => ({
    default: m.CustomerDashboard,
  })),
);
const PlaceOrderPage = lazy(() =>
  import("@/pages/customer/PlaceOrder").then((m) => ({
    default: m.PlaceOrderPage,
  })),
);
const MyOrdersPage = lazy(() =>
  import("@/pages/customer/MyOrders").then((m) => ({
    default: m.MyOrdersPage,
  })),
);
const OrderTrackingPage = lazy(() =>
  import("@/pages/customer/OrderTracking").then((m) => ({
    default: m.OrderTrackingPage,
  })),
);
const MessagesPage = lazy(() =>
  import("@/pages/customer/Messages").then((m) => ({
    default: m.MessagesPage,
  })),
);
const PaymentsPage = lazy(() =>
  import("@/pages/customer/Payments").then((m) => ({
    default: m.PaymentsPage,
  })),
);
const NotificationsPage = lazy(() =>
  import("@/pages/customer/Notifications").then((m) => ({
    default: m.NotificationsPage,
  })),
);
const CustomerProfilePage = lazy(() =>
  import("@/pages/customer/Profile").then((m) => ({
    default: m.CustomerProfilePage,
  })),
);
const SupportPage = lazy(() =>
  import("@/pages/customer/Support").then((m) => ({ default: m.SupportPage })),
);
const CustomerSettingsPage = lazy(() =>
  import("@/pages/customer/Settings").then((m) => ({
    default: m.CustomerSettingsPage,
  })),
);

// Admin pages
const AdminDatabaseCleaner = lazy(() =>
  import("@/pages/admin/DatabaseCleaner").then((m) => ({
    default: m.AdminDatabaseCleaner,
  })),
);

const AdminAnalytics = lazy(() =>
  import("@/pages/admin/Analytics").then((m) => ({
    default: m.AdminAnalytics,
  })),
);
const AdminOrders = lazy(() =>
  import("@/pages/admin/Orders").then((m) => ({ default: m.AdminOrders })),
);
const AdminPayouts = lazy(() =>
  import("@/pages/admin/Payouts").then((m) => ({ default: m.AdminPayouts })),
);
const AdminColleges = lazy(() =>
  import("@/pages/admin/Colleges").then((m) => ({ default: m.AdminColleges })),
);
const AdminApplications = lazy(() =>
  import("@/pages/admin/Applications").then((m) => ({
    default: m.AdminApplications,
  })),
);
const AdminSystemSettings = lazy(() =>
  import("@/pages/admin/SystemSettings").then((m) => ({
    default: m.AdminSystemSettings,
  })),
);
const AdminDesign = lazy(() =>
  import("@/pages/admin/Design").then((m) => ({ default: m.AdminDesign })),
);
const AdminProfile = lazy(() =>
  import("@/pages/admin/AdminProfile").then((m) => ({
    default: m.AdminProfile,
  })),
);
const AdminChat = lazy(() =>
  import("@/pages/admin/AdminChat").then((m) => ({ default: m.AdminChat })),
);

function PageLoader() {
  return (
    <div
      className="flex-1 flex items-center justify-center min-h-[400px]"
      data-ocid="app.loading_state"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

/**
 * MaintenanceGate — wraps the entire app.
 * PUBLIC pages (/, /join-team) always render normally.
 * RESTRICTED pages (/customer/*, /admin/*) are blocked during maintenance
 * for non-HEAD_ADMIN users — they get redirected to / and the popup opens.
 * The MaintenancePopupModal is rendered globally here so it works on every page.
 */
function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { maintenanceMode, isLoading, openMaintenancePopup } =
    useMaintenanceContext();

  // Minimal spinner while the initial settings fetch is in-flight
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  // HEAD_ADMIN check — read from localStorage so it works before AuthProvider hydrates
  const isHeadAdmin = (() => {
    try {
      const stored = localStorage.getItem("assignflow_user");
      if (stored) {
        const u = JSON.parse(stored) as { role?: string; email?: string };
        return (
          u.role === "headAdmin" ||
          (typeof u.email === "string" &&
            u.email.trim().toLowerCase() === "mhdrihan2007@gmail.com")
        );
      }
    } catch {
      /* ignore */
    }
    return false;
  })();

  // If maintenance is ON and user is NOT head admin, check current path.
  // Restricted paths (/customer/*, /admin/*) MUST NOT render — redirect to / and open popup.
  // Public paths (/, /join-team) render normally — no blocking.
  if (maintenanceMode && !isHeadAdmin) {
    const path = window.location.pathname;
    const isRestricted =
      path.startsWith("/customer") || path.startsWith("/admin");
    if (isRestricted) {
      // Replace history so back-button doesn't re-enter the restricted route
      window.history.replaceState(null, "", "/");
      // Open the popup on the next tick after the landing page renders
      setTimeout(openMaintenancePopup, 0);
      // Return the MaintenancePopupModal alone — do NOT render the protected page
      return <MaintenancePopupModal />;
    }
  }

  return (
    <>
      {children}
      <MaintenancePopupModal />
    </>
  );
}

function CustomerOutlet() {
  const { isAuthenticated, isCustomer, loading } = useAuth();
  const { maintenanceMode } = useMaintenanceContext();

  // HEAD_ADMIN check
  const isHeadAdmin = (() => {
    try {
      const stored = localStorage.getItem("assignflow_user");
      if (stored) {
        const u = JSON.parse(stored) as { role?: string; email?: string };
        return (
          u.role === "headAdmin" ||
          (typeof u.email === "string" &&
            u.email.trim().toLowerCase() === "mhdrihan2007@gmail.com")
        );
      }
    } catch {
      /* ignore */
    }
    return false;
  })();

  // Block non-HEAD_ADMIN users from customer routes during maintenance
  if (maintenanceMode && !isHeadAdmin) {
    window.history.replaceState(null, "", "/");
    return null;
  }

  if (loading) return <PageLoader />;
  if (!isAuthenticated || !isCustomer) {
    window.location.href = "/";
    return null;
  }
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
}

function AdminOutlet() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { maintenanceMode } = useMaintenanceContext();

  // HEAD_ADMIN check
  const isHeadAdmin = (() => {
    try {
      const stored = localStorage.getItem("assignflow_user");
      if (stored) {
        const u = JSON.parse(stored) as { role?: string; email?: string };
        return (
          u.role === "headAdmin" ||
          (typeof u.email === "string" &&
            u.email.trim().toLowerCase() === "mhdrihan2007@gmail.com")
        );
      }
    } catch {
      /* ignore */
    }
    return false;
  })();

  // Block non-HEAD_ADMIN users from admin routes during maintenance
  if (maintenanceMode && !isHeadAdmin) {
    window.history.replaceState(null, "", "/");
    return null;
  }

  if (loading) return <PageLoader />;
  if (!isAuthenticated || !isAdmin) {
    window.location.href = "/";
    return null;
  }
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
}

// ── Route tree ───────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});
const joinTeamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/join-team",
  component: JoinTeamPage,
});

const customerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customer",
  component: CustomerOutlet,
});
const customerIndexRoute = createRoute({
  getParentRoute: () => customerRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/customer/dashboard" });
  },
  component: () => null,
});
const customerDashboardRoute = createRoute({
  getParentRoute: () => customerRoute,
  path: "/dashboard",
  component: CustomerDashboard,
});
const placeOrderRoute = createRoute({
  getParentRoute: () => customerRoute,
  path: "/place-order",
  component: PlaceOrderPage,
});
const myOrdersRoute = createRoute({
  getParentRoute: () => customerRoute,
  path: "/orders",
  component: MyOrdersPage,
});
const orderTrackingRoute = createRoute({
  getParentRoute: () => customerRoute,
  path: "/tracking",
  component: OrderTrackingPage,
});
const messagesRoute = createRoute({
  getParentRoute: () => customerRoute,
  path: "/messages",
  component: MessagesPage,
});
const paymentsRoute = createRoute({
  getParentRoute: () => customerRoute,
  path: "/payments",
  component: PaymentsPage,
});
const notificationsRoute = createRoute({
  getParentRoute: () => customerRoute,
  path: "/notifications",
  component: NotificationsPage,
});
const customerProfileRoute = createRoute({
  getParentRoute: () => customerRoute,
  path: "/profile",
  component: CustomerProfilePage,
});
const supportRoute = createRoute({
  getParentRoute: () => customerRoute,
  path: "/support",
  component: SupportPage,
});
const customerSettingsRoute = createRoute({
  getParentRoute: () => customerRoute,
  path: "/settings",
  component: CustomerSettingsPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminOutlet,
});
const adminIndexRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/admin/analytics" });
  },
  component: () => null,
});
const adminAnalyticsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/analytics",
  component: AdminAnalytics,
});
const adminOrdersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/orders",
  component: AdminOrders,
});
const adminPayoutsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/payouts",
  component: AdminPayouts,
});
const adminCollegesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/colleges",
  component: AdminColleges,
});
const adminApplicationsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/applications",
  component: AdminApplications,
});
const adminSystemSettingsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/system-settings",
  component: AdminSystemSettings,
});
const adminDesignRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/design",
  component: AdminDesign,
});
const adminProfileRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/profile",
  component: AdminProfile,
});
const adminChatRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/chat",
  component: AdminChat,
});
const adminDatabaseCleanerRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/database-cleaner",
  component: AdminDatabaseCleaner,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  joinTeamRoute,
  customerRoute.addChildren([
    customerIndexRoute,
    customerDashboardRoute,
    placeOrderRoute,
    myOrdersRoute,
    orderTrackingRoute,
    messagesRoute,
    paymentsRoute,
    notificationsRoute,
    customerProfileRoute,
    supportRoute,
    customerSettingsRoute,
  ]),
  adminRoute.addChildren([
    adminIndexRoute,
    adminAnalyticsRoute,
    adminOrdersRoute,
    adminPayoutsRoute,
    adminCollegesRoute,
    adminApplicationsRoute,
    adminSystemSettingsRoute,
    adminDesignRoute,
    adminProfileRoute,
    adminChatRoute,
    adminDatabaseCleanerRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ChunkErrorBoundary>
      <MaintenanceProvider>
        <MaintenanceGate>
          <RouterProvider router={router} />
        </MaintenanceGate>
      </MaintenanceProvider>
    </ChunkErrorBoundary>
  );
}
