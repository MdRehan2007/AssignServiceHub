import { MaintenanceBanner } from "@/components/MaintenanceBanner";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { useMaintenanceContext } from "@/context/MaintenanceContext";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useNotifications";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  PlusCircle,
  Settings,
  User,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    path: "/customer/dashboard",
    icon: LayoutDashboard,
    ocid: "customer.nav.dashboard",
  },
  {
    label: "Place Order",
    path: "/customer/place-order",
    icon: PlusCircle,
    ocid: "customer.nav.place_order",
  },
  {
    label: "My Orders",
    path: "/customer/orders",
    icon: FileText,
    ocid: "customer.nav.orders",
  },
  {
    label: "Order Tracking",
    path: "/customer/tracking",
    icon: MapPin,
    ocid: "customer.nav.tracking",
  },
  {
    label: "Messages",
    path: "/customer/messages",
    icon: MessageSquare,
    ocid: "customer.nav.messages",
  },
  {
    label: "Payments",
    path: "/customer/payments",
    icon: CreditCard,
    ocid: "customer.nav.payments",
  },
  {
    label: "Notifications",
    path: "/customer/notifications",
    icon: Bell,
    ocid: "customer.nav.notifications",
  },
  {
    label: "Profile",
    path: "/customer/profile",
    icon: User,
    ocid: "customer.nav.profile",
  },
  {
    label: "Support",
    path: "/customer/support",
    icon: HelpCircle,
    ocid: "customer.nav.support",
  },
  {
    label: "Settings",
    path: "/customer/settings",
    icon: Settings,
    ocid: "customer.nav.settings",
  },
];

interface CustomerLayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

export function CustomerLayout({ children, pageTitle }: CustomerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user, logout } = useAuth();
  const unreadCount = useUnreadCount();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { maintenanceMode } = useMaintenanceContext();
  const activeLabel =
    NAV_ITEMS.find((item) => currentPath.startsWith(item.path))?.label ??
    "Dashboard";

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-base">A</span>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">
              AssignServiceHub
            </p>
            <p className="text-white/40 text-xs">Student Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path as "/customer/dashboard"}
            className={`nav-item ${currentPath.startsWith(item.path) ? "active" : ""}`}
            data-ocid={item.ocid}
            onClick={() => setSidebarOpen(false)}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span>{item.label}</span>
            {currentPath.startsWith(item.path) && (
              <ChevronRight className="h-3.5 w-3.5 ml-auto" />
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.name ?? "Customer"}
            </p>
            <p className="text-white/40 text-xs truncate">
              {user?.email ?? ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
          data-ocid="customer.nav.logout"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="flex min-h-screen overflow-hidden"
      style={{ background: "var(--bg-page)" }}
    >
      {/* Mobile hamburger - always visible on mobile */}
      <button
        type="button"
        className="md:hidden fixed top-4 left-4 z-[60] p-2 rounded-lg bg-[#0f1117] text-white shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
        data-ocid="customer.nav.hamburger"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {/* Desktop sidebar */}
      <aside className="sidebar hidden md:flex flex-col w-64 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
            tabIndex={-1}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-full w-64 sidebar flex flex-col animate-slideIn">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between flex-shrink-0 shadow-subtle">
          <div className="flex items-center gap-3 ml-10 md:ml-0">
            <h1 className="text-base md:text-lg font-semibold text-gray-900 truncate">
              {pageTitle ?? activeLabel}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
                aria-expanded={notifOpen}
                aria-haspopup="dialog"
                data-ocid="header.notifications_button"
              >
                <Bell className="h-5 w-5 text-gray-500" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 min-w-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <NotificationDropdown
                isOpen={notifOpen}
                onClose={() => setNotifOpen(false)}
                userRole="customer"
                unreadCount={unreadCount}
              />
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
          </div>
        </header>

        {/* Maintenance banner — shown only when maintenance is active */}
        {maintenanceMode && <MaintenanceBanner />}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 content-area pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
