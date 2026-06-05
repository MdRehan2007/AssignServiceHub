import { Button } from "@/components/ui/button";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Home,
  LayoutDashboard,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme-preference");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme-preference", isDark ? "dark" : "light");
  }, [isDark]);

  return { isDark, toggle: () => setIsDark((v) => !v) };
}

export function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { isDark, toggle } = useDarkMode();

  const isActive = (path: string) =>
    path === "/" ? currentPath === "/" : currentPath.startsWith(path);

  const linkClass = (path: string) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-smooth ${
      isActive(path)
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    }`;

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className="bg-card border-b border-border shadow-sm sticky top-0 z-50"
      data-ocid="nav.header"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-14 flex items-center justify-between gap-2">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 group flex-shrink-0"
          data-ocid="nav.brand_link"
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm group-hover:bg-primary/90 transition-smooth flex-shrink-0">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <span className="font-display font-bold text-foreground text-base leading-none block">
              AssignServiceHub
            </span>
            <span className="text-muted-foreground text-xs leading-none hidden sm:block truncate">
              Assignment Service Hub
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden md:flex items-center gap-0.5"
          aria-label="Main navigation"
        >
          <Link to="/" className={linkClass("/")} data-ocid="nav.home_link">
            <Home className="w-3.5 h-3.5" />
            Home
          </Link>
          <Link
            to="/customer/dashboard"
            className={linkClass("/customer")}
            data-ocid="nav.customer_link"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Customer Portal
          </Link>
          <Link
            to="/admin/analytics"
            className={linkClass("/admin")}
            data-ocid="nav.admin_link"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Admin
          </Link>
        </nav>

        {/* Desktop right controls */}
        <div className="hidden md:flex items-center gap-1.5">
          <a href="/join-team" data-ocid="nav.join_team_link">
            <Button
              size="sm"
              className="text-xs"
              data-ocid="nav.join_writer_button"
            >
              Join as Writer
            </Button>
          </a>
          <button
            onClick={toggle}
            type="button"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            data-ocid="nav.theme_toggle"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-smooth"
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          <Link to="/customer/dashboard">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              data-ocid="nav.signin_button"
            >
              Sign In
            </Button>
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-1">
          <button
            onClick={toggle}
            type="button"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            data-ocid="nav.mobile_theme_toggle"
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-smooth"
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            data-ocid="nav.mobile_menu_toggle"
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-smooth"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav panel — slide down */}
      {mobileOpen && (
        <div
          className="md:hidden bg-card border-t border-border"
          data-ocid="nav.mobile_panel"
        >
          <nav
            className="flex flex-col px-3 py-2 gap-0.5"
            aria-label="Mobile navigation"
          >
            {/* Nav links */}
            {[
              {
                to: "/" as const,
                label: "Home",
                icon: Home,
                ocid: "mobile.nav.home_link",
              },
              {
                to: "/customer/dashboard" as const,
                label: "Customer Portal",
                icon: LayoutDashboard,
                ocid: "mobile.nav.customer_link",
              },
              {
                to: "/admin/analytics" as const,
                label: "Admin Dashboard",
                icon: LayoutDashboard,
                ocid: "mobile.nav.admin_link",
              },
            ].map(({ to, label, icon: Icon, ocid }) => (
              <Link
                key={to}
                to={to}
                onClick={closeMobile}
                data-ocid={ocid}
                className={`flex items-center gap-3 px-4 rounded-md text-sm font-medium transition-smooth min-h-[44px] ${
                  isActive(to)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            ))}

            {/* Divider */}
            <div className="border-t border-border my-1" />

            {/* Join / Apply links */}
            <a
              href="/join-team"
              onClick={closeMobile}
              data-ocid="mobile.nav.join_writer_link"
              className="block"
            >
              <Button
                className="w-full min-h-[44px] text-sm justify-center"
                data-ocid="mobile.nav.join_writer_button"
              >
                Join as Writer
              </Button>
            </a>

            {/* Divider */}
            <div className="border-t border-border my-1" />

            {/* Auth buttons — full width on mobile */}
            <Link to="/customer/dashboard" onClick={closeMobile}>
              <Button
                variant="outline"
                className="w-full min-h-[44px] text-sm justify-center"
                data-ocid="mobile.nav.signin_button"
              >
                Sign In
              </Button>
            </Link>
          </nav>
          <div className="pb-2" />
        </div>
      )}
    </header>
  );
}
