import { NotificationDropdown } from "@/components/NotificationDropdown";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useNotifications";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart2,
  Bell,
  Building,
  ChevronRight,
  Database,
  DollarSign,
  FileText,
  LogOut,
  Menu,
  MessageSquare,
  Palette,
  Settings,
  Shield,
  User,
  UserCheck,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { useMaintenanceContext } from "../context/MaintenanceContext";

const NAV_ITEMS = [
  {
    label: "Analytics",
    path: "/admin/analytics",
    icon: BarChart2,
    ocid: "admin.nav.analytics",
  },
  {
    label: "Admin Chat",
    path: "/admin/chat",
    icon: MessageSquare,
    ocid: "admin.nav.chat",
  },
  {
    label: "Orders",
    path: "/admin/orders",
    icon: FileText,
    ocid: "admin.nav.orders",
  },
  {
    label: "Admin Payouts",
    path: "/admin/payouts",
    icon: DollarSign,
    ocid: "admin.nav.payouts",
  },
  {
    label: "Colleges",
    path: "/admin/colleges",
    icon: Building,
    ocid: "admin.nav.colleges",
  },
  {
    label: "Applications",
    path: "/admin/applications",
    icon: UserCheck,
    ocid: "admin.nav.applications",
    badge: true,
  },
  {
    label: "System Settings",
    path: "/admin/system-settings",
    icon: Settings,
    ocid: "admin.nav.system_settings",
  },
  {
    label: "Design Settings",
    path: "/admin/design",
    icon: Palette,
    ocid: "admin.nav.design",
  },
  {
    label: "Database Cleaner",
    path: "/admin/database-cleaner",
    icon: Database,
    ocid: "admin.nav.database_cleaner",
  },
  {
    label: "Security",
    path: "/admin/system-settings",
    icon: Shield,
    ocid: "admin.nav.security",
  },
  {
    label: "My Profile",
    path: "/admin/profile",
    icon: User,
    ocid: "admin.nav.profile",
  },
];

interface AdminLayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

export function AdminLayout({ children, pageTitle }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user, logout, isHeadAdmin } = useAuth();
  const { maintenanceMode } = useMaintenanceContext();

  // Check if current user is HEAD_ADMIN for badge
  const isHeadAdminUser = (() => {
    try {
      const stored = localStorage.getItem("assignflow_user");
      if (stored) {
        const u = JSON.parse(stored) as { role?: string };
        return u.role === "headAdmin" || u.role === "HEAD_ADMIN";
      }
    } catch {}
    return isHeadAdmin;
  })();
  const unreadCount = useUnreadCount();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const activeLabel =
    NAV_ITEMS.find((item) => currentPath.startsWith(item.path))?.label ??
    "Analytics";

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "A";
  const roleLabel = isHeadAdmin ? "Database Administrator" : "College Admin";

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
            <p className="text-white/40 text-xs">{roleLabel}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path as "/admin/analytics"}
            className={`nav-item ${currentPath.startsWith(item.path) ? "active" : ""}`}
            data-ocid={item.ocid}
            onClick={() => setSidebarOpen(false)}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                2
              </span>
            )}
            {currentPath.startsWith(item.path) && !item.badge && (
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
              {user?.name ?? "Admin"}
            </p>
            <p className="text-white/40 text-xs truncate">{roleLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
          data-ocid="admin.nav.logout"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
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
        data-ocid="admin.nav.hamburger"
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
          <div className="flex items-center gap-2 ml-10 md:ml-0">
            <h1 className="text-base md:text-lg font-semibold text-gray-900 truncate">
              {pageTitle ?? activeLabel}
            </h1>
            {isHeadAdminUser && (
              <span
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold border ${
                  maintenanceMode
                    ? "bg-orange-500/10 border-orange-500/40 text-orange-500"
                    : "bg-green-500/10 border-green-500/40 text-green-600"
                }`}
                data-ocid="header.maintenance_badge"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    maintenanceMode ? "bg-orange-500" : "bg-green-500"
                  }`}
                />
                {maintenanceMode ? "MAINTENANCE" : "LIVE"}
              </span>
            )}
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
                userRole="admin"
                unreadCount={unreadCount}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-800">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-400">{roleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 content-area pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
