import { useMaintenanceContext } from "@/context/MaintenanceContext";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronRight,
  Eye,
  EyeOff,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

function isHeadAdminCredentials(email: string): boolean {
  return email.trim().toLowerCase() === "mhdrihan2007@gmail.com";
}

export function LandingPage() {
  const navigate = useNavigate();
  const { user, loginAsAdmin, loginAsCustomer } = useAuth();
  const { maintenanceMode, openMaintenancePopup } = useMaintenanceContext();

  // Customer login state
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custCollege, setCustCollege] = useState("");
  const [customCollegeName, setCustomCollegeName] = useState("");
  const [custMode, setCustMode] = useState<"signin" | "create">("signin");
  const [custError, setCustError] = useState("");

  // Admin login state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  // Track status state
  const [trackId, setTrackId] = useState("");
  const [trackMsg, setTrackMsg] = useState("");

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    if (maintenanceMode && !isHeadAdminCredentials(adminEmail)) {
      openMaintenancePopup();
      return;
    }
    setAdminLoading(true);
    setAdminError("");
    const ok = await loginAsAdmin(adminEmail, adminPass);
    setAdminLoading(false);
    if (ok) {
      navigate({ to: "/admin/analytics" });
    } else {
      setAdminError("Invalid email or password.");
    }
  }

  function getRegisteredCustomers(): Array<{
    name: string;
    email: string;
    college?: string;
  }> {
    try {
      const raw = localStorage.getItem("assignflow_customers");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function handleCustomerLogin(e: React.FormEvent) {
    e.preventDefault();
    if (maintenanceMode) {
      openMaintenancePopup();
      return;
    }
    setCustError("");
    if (!custEmail.trim()) return;

    const customers = getRegisteredCustomers();

    if (custMode === "signin") {
      const found = customers.find(
        (c) => c.email.toLowerCase() === custEmail.toLowerCase(),
      );
      if (!found) {
        setCustError(
          "This email is not registered. Please create an account first.",
        );
        return;
      }
      const ok = loginAsCustomer(found.name, custEmail, true);
      if (ok) navigate({ to: "/customer/dashboard" });
    } else {
      if (custCollege === "Other") {
        if (!customCollegeName.trim()) {
          setCustError("Please enter your college name");
          return;
        }
        const allColleges = [
          "SRMAP",
          "KL University",
          "GITAM",
          "Andhra University",
          "VIT",
        ];
        if (
          allColleges.some(
            (c) => c.toLowerCase() === customCollegeName.trim().toLowerCase(),
          )
        ) {
          setCustError(
            "This college is already in the list. Please select it from the dropdown.",
          );
          return;
        }
      }
      const existing = customers.find(
        (c) => c.email.toLowerCase() === custEmail.toLowerCase(),
      );
      if (existing) {
        setCustError(
          "An account with this email already exists. Please sign in.",
        );
        return;
      }
      const name = custName.trim() || custEmail.split("@")[0];
      const finalCollege =
        custCollege === "Other" ? customCollegeName.trim() : custCollege;
      const newCustomer = {
        name: name || "Student",
        email: custEmail,
        college: finalCollege || undefined,
      };
      customers.push(newCustomer);
      localStorage.setItem("assignflow_customers", JSON.stringify(customers));
      const ok = loginAsCustomer(
        newCustomer.name,
        custEmail,
        true,
        finalCollege || undefined,
      );
      if (ok) navigate({ to: "/customer/dashboard" });
    }
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "var(--bg-page)" }}
    >
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <header
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0f1117 0%, #1a2240 60%, #0f1117 100%)",
        }}
        data-ocid="landing.hero_section"
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 50%, #2563eb 0%, transparent 60%), radial-gradient(circle at 80% 20%, #3b82f6 0%, transparent 40%)",
          }}
        />
        <div className="relative container-responsive pt-4 pb-6 sm:pt-5 sm:pb-8">
          {/* Navbar */}
          <nav className="flex items-center justify-between mb-6 sm:mb-10">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-white font-bold text-base sm:text-lg leading-none">
                AssignServiceHub
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="/join-team"
                className="btn-primary-compact bg-blue-600 hover:bg-blue-700 text-white transition-colors text-xs sm:text-sm px-3 sm:px-4"
                style={{ borderRadius: "10px" }}
                data-ocid="landing.join_writer_button"
              >
                Join as Writer
              </a>
            </div>
          </nav>

          {/* Hero content + auth card */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-start">
            {/* Left: headline + CTAs */}
            <div className="animate-fadeIn">
              <h1
                className="text-white font-bold mb-3 leading-tight"
                style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
              >
                Academic Assignment
                <span className="block text-blue-400">Management Platform</span>
              </h1>
              <p className="text-white/60 text-sm sm:text-base mb-5 leading-relaxed max-w-[420px]">
                Written by Experts, Trusted by Students
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (maintenanceMode) {
                      openMaintenancePopup();
                      return;
                    }
                    setTrackId("");
                    document
                      .getElementById("track-section")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="btn-primary-compact bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-1.5"
                  style={{ borderRadius: "10px" }}
                  data-ocid="landing.track_status_button"
                >
                  <Search className="h-3.5 w-3.5" /> Track Order
                </button>
              </div>
            </div>

            {/* Right: auth card */}
            <div id="auth-section" className="animate-slideUp">
              <div
                className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(16px)",
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                {/* Tab toggle */}
                <div className="flex rounded-lg overflow-hidden border border-white/10 mb-4">
                  <button
                    type="button"
                    onClick={() => setCustMode("signin")}
                    className={`flex-1 py-2 text-xs sm:text-sm font-medium transition-all ${
                      custMode === "signin"
                        ? "bg-blue-600 text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                    data-ocid="landing.signin_tab"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustMode("create")}
                    className={`flex-1 py-2 text-xs sm:text-sm font-medium transition-all ${
                      custMode === "create"
                        ? "bg-blue-600 text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                    data-ocid="landing.create_account_tab"
                  >
                    Create Account
                  </button>
                </div>

                {custError && (
                  <div
                    className="mb-3 px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs"
                    data-ocid="landing.customer_error_state"
                  >
                    {custError}
                  </div>
                )}
                <form onSubmit={handleCustomerLogin} className="space-y-3">
                  {custMode === "create" && (
                    <>
                      <div>
                        <label
                          htmlFor="cust-name"
                          className="block text-white/70 text-xs font-medium mb-1"
                        >
                          Full Name
                        </label>
                        <input
                          id="cust-name"
                          type="text"
                          value={custName}
                          onChange={(e) => setCustName(e.target.value)}
                          placeholder="Your full name"
                          className="input-field"
                          style={{
                            background: "rgba(255,255,255,0.08)",
                            borderColor: "rgba(255,255,255,0.15)",
                            color: "white",
                            height: "40px",
                          }}
                          data-ocid="landing.customer_name_input"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="cust-college"
                          className="block text-white/70 text-xs font-medium mb-1"
                        >
                          College
                        </label>
                        <select
                          id="cust-college"
                          value={custCollege}
                          onChange={(e) => setCustCollege(e.target.value)}
                          required
                          className="input-field"
                          style={{
                            background: "rgba(255,255,255,0.08)",
                            borderColor: "rgba(255,255,255,0.15)",
                            color: "white",
                            height: "40px",
                          }}
                          data-ocid="landing.customer_college_select"
                        >
                          <option value="" style={{ color: "#111827" }}>
                            Select College
                          </option>
                          <option value="SRMAP" style={{ color: "#111827" }}>
                            SRMAP
                          </option>
                          <option
                            value="KL University"
                            style={{ color: "#111827" }}
                          >
                            KL University
                          </option>
                          <option value="GITAM" style={{ color: "#111827" }}>
                            GITAM
                          </option>
                          <option
                            value="Andhra University"
                            style={{ color: "#111827" }}
                          >
                            Andhra University
                          </option>
                          <option value="VIT" style={{ color: "#111827" }}>
                            VIT
                          </option>
                          <option value="Other" style={{ color: "#111827" }}>
                            Other
                          </option>
                        </select>
                        {custCollege === "Other" && (
                          <div className="mt-2">
                            <input
                              id="cust-custom-college"
                              type="text"
                              value={customCollegeName}
                              onChange={(e) => {
                                setCustomCollegeName(e.target.value);
                                setCustError("");
                              }}
                              placeholder="Enter Your College Name"
                              className="input-field w-full"
                              style={{
                                background: "rgba(255,255,255,0.08)",
                                borderColor: "rgba(255,255,255,0.15)",
                                color: "white",
                                height: "40px",
                              }}
                              data-ocid="landing.customer_custom_college_input"
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  <div>
                    <label
                      htmlFor="cust-email"
                      className="block text-white/70 text-xs font-medium mb-1"
                    >
                      Email Address
                    </label>
                    <input
                      id="cust-email"
                      type="email"
                      value={custEmail}
                      onChange={(e) => {
                        setCustEmail(e.target.value);
                        setCustError("");
                      }}
                      placeholder="student@college.edu"
                      required
                      className="input-field"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        borderColor: "rgba(255,255,255,0.15)",
                        color: "white",
                        height: "40px",
                      }}
                      data-ocid="landing.customer_email_input"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary w-full flex items-center justify-center gap-2"
                    style={{
                      height: "40px",
                      borderRadius: "10px",
                      fontSize: "var(--btn-text)",
                    }}
                    data-ocid="landing.customer_login_button"
                  >
                    {custMode === "create" ? "Create Account" : "Sign In"}{" "}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </form>
                <div className="mt-3 text-center">
                  <p className="text-white/30 text-xs">
                    Secure • No password required for students
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Track Order ─────────────────────────────────────────────── */}
      <section
        id="track-section"
        className="section-padding"
        style={{
          background: "linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)",
        }}
        data-ocid="landing.track_section"
      >
        <div className="container-responsive max-w-2xl text-center">
          <Search className="h-7 w-7 text-blue-600 mx-auto mb-2" />
          <h2
            className="text-gray-900 font-semibold mb-1"
            style={{ fontSize: "clamp(1.1rem, 3vw, 1.35rem)" }}
          >
            Track Your Assignment
          </h2>
          <p className="text-gray-500 mb-4 text-sm">
            Enter your Order ID to check the current status.
          </p>
          {trackMsg && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs">
              {trackMsg}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              type="text"
              value={trackId}
              onChange={(e) => {
                setTrackId(e.target.value);
                setTrackMsg("");
              }}
              placeholder="Enter Order ID (e.g. AF001XYZ)"
              className="input-field flex-1"
              style={{ height: "40px" }}
              data-ocid="landing.track_order_input"
            />
            <button
              type="button"
              className="btn-primary flex items-center justify-center gap-1.5 whitespace-nowrap"
              style={{
                height: "40px",
                borderRadius: "10px",
                fontSize: "var(--btn-text)",
                paddingLeft: "1rem",
                paddingRight: "1rem",
              }}
              data-ocid="landing.track_order_button"
              onClick={() => {
                if (maintenanceMode) {
                  openMaintenancePopup();
                  return;
                }
                if (!trackId.trim()) return;
                if (user) {
                  navigate({ to: "/customer/tracking" });
                } else {
                  setTrackMsg("Please log in first to track your assignment.");
                  document
                    .getElementById("auth-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              Track <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Administrator Access ─────────────────────────────────────── */}
      <section
        className="section-padding"
        style={{ background: "var(--bg-page)" }}
        data-ocid="landing.admin_section"
      >
        <div className="container-responsive max-w-md">
          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm leading-tight">
                  Administrator Access
                </p>
                <p className="text-xs text-gray-400 leading-tight">
                  Restricted to authorized staff only
                </p>
              </div>
            </div>

            {adminError && (
              <div
                className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs"
                data-ocid="landing.admin_error_state"
              >
                {adminError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Admin Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Enter Admin Email"
                  required
                  className="input-field"
                  style={{ height: "40px" }}
                  data-ocid="landing.admin_email_input"
                />
              </div>
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPass ? "text" : "password"}
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input-field pr-10"
                    style={{ height: "40px" }}
                    data-ocid="landing.admin_password_input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPass ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={adminLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
                style={{
                  background: "#111827",
                  height: "40px",
                  borderRadius: "10px",
                  fontSize: "var(--btn-text)",
                }}
                data-ocid="landing.admin_login_button"
              >
                {adminLoading ? (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Admin Sign In{" "}
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-3 space-y-1 text-center">
              <p className="text-xs text-gray-400">
                Database Admin • College Admin
              </p>
              <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                💡 For Newly Approved Writers, password is your DOB (DDMMYYYY)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer
        className="py-5 border-t"
        style={{ background: "#0f1117", borderColor: "#1e2435" }}
      >
        <div className="container-responsive flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="text-white font-semibold text-sm">
              AssignServiceHub
            </span>
          </div>
          <p className="text-white/30 text-xs text-center">
            © 2026 AssignServiceHub. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
