import { PaymentVerificationPanel } from "@/components/admin/PaymentVerificationPanel";
import { AdminLayout } from "@/layouts/AdminLayout";
import {
  type AdminRevenueStat,
  type CollegeRevenueStat,
  type TransactionDashboardStats,
  getAdminRevenueStats,
  getAllPayments,
  getAnalytics,
  getCollegeRevenueStats,
  getColleges,
  getFailedPayments,
  getPendingVerifications,
  getTransactionDashboardStats,
} from "@/services/api";
import type { AnalyticsData, College } from "@/types";
import { generateAndDownloadReport } from "@/utils/pdfExport";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const PERIODS = ["24H", "7D", "30D", "ALL"] as const;
type Period = (typeof PERIODS)[number];

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-start gap-4">
      <div
        className={`h-11 w-11 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-emerald-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function BarChart({
  data,
  max,
  colorClass,
}: {
  data: { label: string; value: number }[];
  max: number;
  colorClass: string;
}) {
  return (
    <div className="flex items-end gap-2 h-40 pt-4">
      {data.map(({ label, value }) => (
        <div
          key={label}
          className="flex-1 flex flex-col items-center gap-1 min-w-0"
        >
          <span className="text-xs text-gray-500 font-medium">{value}</span>
          <div
            className="w-full rounded-t-md transition-all"
            style={{ height: `${Math.max(4, (value / max) * 120)}px` }}
            data-class={colorClass}
          >
            <div className={`w-full h-full rounded-t-md ${colorClass}`} />
          </div>
          <span className="text-xs text-gray-400 truncate w-full text-center">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function RevenueBarChart({
  data,
}: { data: { month: string; revenue: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue));
  return (
    <div className="flex items-end gap-2 h-44 pt-4">
      {data.map(({ month, revenue }) => (
        <div
          key={month}
          className="flex-1 flex flex-col items-center gap-1 min-w-0"
        >
          <span className="text-xs text-gray-500 font-medium">
            ₹{(revenue / 1000).toFixed(0)}k
          </span>
          <div
            className="w-full rounded-t-md"
            style={{ height: `${Math.max(4, (revenue / max) * 128)}px` }}
          >
            <div className="w-full h-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400" />
          </div>
          <span className="text-xs text-gray-400">{month}</span>
        </div>
      ))}
    </div>
  );
}

function ActivityFeed() {
  const items: { text: string; time: string; dot: string }[] = [];
  return (
    <ul className="space-y-3">
      {items.length === 0 ? (
        <li className="flex items-center justify-center py-6">
          <p className="text-sm text-gray-400">No recent activity</p>
        </li>
      ) : (
        items.map((item) => (
          <li key={item.text} className="flex items-start gap-3">
            <span
              className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${item.dot}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-700">{item.text}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
            </div>
          </li>
        ))
      )}
    </ul>
  );
}

type Tab = "overview" | "transactions" | "verifications";

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    verified: { label: "Verified", cls: "bg-emerald-100 text-emerald-700" },
    failed: { label: "Failed", cls: "bg-red-100 text-red-700" },
    cancelled: { label: "Cancelled", cls: "bg-red-100 text-red-700" },
    pending_payment: { label: "Pending", cls: "bg-yellow-100 text-yellow-700" },
    pendingPaymentVerification: {
      label: "Pending",
      cls: "bg-yellow-100 text-yellow-700",
    },
    pending_manual_verification: {
      label: "Manual Review",
      cls: "bg-orange-100 text-orange-700",
    },
  };
  const { label, cls } = cfg[status] ?? {
    label: status,
    cls: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

function HorizontalBarChart({
  data,
  valuePrefix,
}: { data: { label: string; value: number }[]; valuePrefix?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map(({ label, value }) => (
        <div key={label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600 font-medium truncate max-w-[140px]">
              {label}
            </span>
            <span className="text-gray-500 font-semibold ml-2">
              {valuePrefix}
              {value.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
              style={{ width: `${Math.max(2, (value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TransactionTab() {
  const [stats, setStats] = useState<TransactionDashboardStats | null>(null);
  const [collegeRevenue, setCollegeRevenue] = useState<CollegeRevenueStat[]>(
    [],
  );
  const [adminRevenue, setAdminRevenue] = useState<AdminRevenueStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    const [s, cr, ar] = await Promise.all([
      getTransactionDashboardStats(),
      getCollegeRevenueStats(),
      getAdminRevenueStats(),
    ]);
    setStats(s);
    setCollegeRevenue(cr);
    setAdminRevenue(ar);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    intervalRef.current = setInterval(loadData, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

  const exportAllTransactions = async () => {
    setExporting("all");
    const rows = await getAllPayments();
    generateAndDownloadReport(
      "All Transactions Report",
      "all_transactions",
      [
        "Order ID",
        "Customer",
        "College",
        "Amount (₹)",
        "Method",
        "Status",
        "Timestamp",
      ],
      rows.map((r) => [
        r.orderId,
        r.customerName,
        r.college,
        r.amount.toLocaleString("en-IN"),
        r.method,
        r.status,
        new Date(r.createdAt).toLocaleString("en-IN"),
      ]),
      [
        { label: "Total Transactions", value: String(rows.length) },
        {
          label: "Total Revenue",
          value: `₹${rows
            .filter((r) => r.status === "verified")
            .reduce((s, r) => s + r.amount, 0)
            .toLocaleString("en-IN")}`,
        },
        { label: "Generated", value: new Date().toLocaleString("en-IN") },
      ],
    );
    setExporting(null);
  };

  const exportRevenueReport = async () => {
    setExporting("revenue");
    const [cr, ar] = await Promise.all([
      getCollegeRevenueStats(),
      getAdminRevenueStats(),
    ]);
    const totalRev = cr.reduce((s, r) => s + r.revenue, 0);
    generateAndDownloadReport(
      "Revenue Report",
      "revenue_report",
      ["Category", "Name", "Revenue (₹)"],
      [
        ...cr.map((r) => [
          "College",
          r.collegeName,
          r.revenue.toLocaleString("en-IN"),
        ]),
        ["", "", ""],
        ...ar.map((r) => [
          "Admin",
          r.adminId,
          r.revenue.toLocaleString("en-IN"),
        ]),
      ],
      [
        {
          label: "Total Revenue",
          value: `₹${totalRev.toLocaleString("en-IN")}`,
        },
        { label: "Colleges", value: String(cr.length) },
        { label: "Admins", value: String(ar.length) },
        { label: "Report Date", value: new Date().toLocaleDateString("en-IN") },
      ],
    );
    setExporting(null);
  };

  const exportFailed = async () => {
    setExporting("failed");
    const rows = await getFailedPayments();
    generateAndDownloadReport(
      "Failed Transactions Report",
      "failed_transactions",
      [
        "Order ID",
        "Customer",
        "College",
        "Amount (₹)",
        "Failure Reason",
        "Timestamp",
      ],
      rows.map((r) => [
        r.orderId,
        r.customerName,
        r.college,
        r.amount.toLocaleString("en-IN"),
        r.failureReason ?? "—",
        new Date(r.createdAt).toLocaleString("en-IN"),
      ]),
      [{ label: "Total Failed", value: String(rows.length) }],
    );
    setExporting(null);
  };

  const exportPending = async () => {
    setExporting("pending");
    const rows = await getPendingVerifications();
    generateAndDownloadReport(
      "Pending Verifications Report",
      "pending_verifications",
      [
        "Order ID",
        "Customer",
        "College",
        "Amount (₹)",
        "Screenshot Submitted",
        "Submitted At",
      ],
      rows.map((r) => [
        r.orderId,
        r.customerName,
        r.college,
        r.amount.toLocaleString("en-IN"),
        r.screenshotSubmitted ? "Yes" : "No",
        new Date(r.createdAt).toLocaleString("en-IN"),
      ]),
      [{ label: "Total Pending", value: String(rows.length) }],
    );
    setExporting(null);
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-64"
        data-ocid="transactions.loading_state"
      >
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Revenue",
      value: `₹${(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}`,
      icon: TrendingUp,
      color: "bg-emerald-100 text-emerald-600",
      accent: "text-emerald-600",
      ocid: "transactions.total_revenue_card",
    },
    {
      label: "Successful Transactions",
      value: String(stats?.successfulTransactions ?? 0),
      icon: CheckCircle,
      color: "bg-emerald-100 text-emerald-600",
      accent: "text-emerald-600",
      ocid: "transactions.successful_card",
    },
    {
      label: "Pending Verifications",
      value: String(stats?.pendingVerifications ?? 0),
      icon: Clock,
      color: "bg-yellow-100 text-yellow-600",
      accent: "text-yellow-600",
      ocid: "transactions.pending_card",
    },
    {
      label: "Failed Payments",
      value: String(stats?.failedPayments ?? 0),
      icon: XCircle,
      color: "bg-red-100 text-red-600",
      accent: "text-red-600",
      ocid: "transactions.failed_card",
    },
  ];

  const exportBtns = [
    {
      label: "Export All Transactions",
      icon: Download,
      key: "all",
      action: exportAllTransactions,
      ocid: "transactions.export_all_button",
    },
    {
      label: "Export Revenue Report",
      icon: TrendingUp,
      key: "revenue",
      action: exportRevenueReport,
      ocid: "transactions.export_revenue_button",
    },
    {
      label: "Export Failed Transactions",
      icon: XCircle,
      key: "failed",
      action: exportFailed,
      ocid: "transactions.export_failed_button",
    },
    {
      label: "Export Pending Verifications",
      icon: AlertTriangle,
      key: "pending",
      action: exportPending,
      ocid: "transactions.export_pending_button",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Live refresh indicator */}
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-xs text-gray-500 font-medium">
          Live — auto-refreshes every 5s
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-start gap-4"
            data-ocid={c.ocid}
          >
            <div
              className={`h-11 w-11 rounded-lg flex items-center justify-center flex-shrink-0 ${c.color}`}
            >
              <c.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className={`text-2xl font-bold ${c.accent}`}>{c.value}</p>
              <p className="text-sm font-medium text-gray-500 mt-0.5">
                {c.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            College-wise Revenue
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Revenue breakdown by college
          </p>
          <HorizontalBarChart
            data={collegeRevenue.map((r) => ({
              label: r.collegeName,
              value: r.revenue,
            }))}
            valuePrefix="₹"
          />
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Admin-wise Revenue
          </h3>
          <p className="text-xs text-gray-400 mb-4">Revenue earned per admin</p>
          <HorizontalBarChart
            data={adminRevenue.map((r) => ({
              label: r.adminId,
              value: r.revenue,
            }))}
            valuePrefix="₹"
          />
        </div>
      </div>

      {/* Live payment activity feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-700">
            Live Payment Activity
          </h3>
          <span className="ml-auto text-xs text-gray-400">
            Last 10 transactions
          </span>
        </div>
        <div
          className="overflow-x-auto"
          data-ocid="transactions.activity_table"
        >
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-semibold">Order ID</th>
                <th className="px-4 py-3 text-left font-semibold">Customer</th>
                <th className="px-4 py-3 text-left font-semibold">College</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3 text-left font-semibold">Method</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(stats?.recentTransactions ?? []).map((tx, i) => (
                <tr
                  key={tx.id}
                  className="hover:bg-blue-50/30 transition-colors"
                  data-ocid={`transactions.item.${i + 1}`}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {tx.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {tx.customerName}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{tx.college}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">
                    ₹{tx.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                      {tx.method}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(tx.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
              {(stats?.recentTransactions ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-gray-400 text-sm"
                    data-ocid="transactions.empty_state"
                  >
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Export section */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          Export PDF Reports
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Generate and auto-download professional PDF reports
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {exportBtns.map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={btn.action}
              disabled={exporting === btn.key}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 hover:border-blue-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              data-ocid={btn.ocid}
            >
              {exporting === btn.key ? (
                <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              ) : (
                <btn.icon className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="truncate">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState("all");
  const [period, setPeriod] = useState<Period>("30D");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (
        tab === "verifications" ||
        tab === "transactions" ||
        tab === "overview"
      )
        return tab as Tab;
    }
    return "overview";
  });
  const highlightTxnId =
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("txnId") ?? undefined)
      : undefined;

  const fetchOverviewData = useCallback(() => {
    Promise.all([getAnalytics(), getColleges()]).then(([a, c]) => {
      setData(a);
      setColleges(c);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchOverviewData();
    const interval = setInterval(fetchOverviewData, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchOverviewData();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchOverviewData]);

  const exportPDF = () => {
    const summaryRows = [
      {
        label: "Total Revenue",
        value: `\u20b9${totalRevenue.toLocaleString()}`,
      },
      { label: "Total Orders", value: String(totalOrders) },
      { label: "Completed Orders", value: String(completedOrders) },
    ];
    const revenueRows =
      data?.revenueByMonth.map((r) => [
        r.month,
        `\u20b9${r.revenue.toLocaleString()}`,
      ]) ?? [];
    const statusRows =
      data?.ordersByStatus.map((o) => [o.status, String(o.count)]) ?? [];
    generateAndDownloadReport(
      "Analytics Report",
      "analytics_report",
      ["Month", "Revenue"],
      [...revenueRows, ["", ""], ["Order Status", "Count"], ...statusRows],
      summaryRows,
    );
  };

  const totalRevenue =
    data?.revenueByMonth.reduce((s, r) => s + r.revenue, 0) ?? 0;
  const totalOrders =
    data?.ordersByStatus.reduce((s, o) => s + o.count, 0) ?? 0;
  const completedOrders =
    data?.ordersByStatus.find((o) => o.status === "Completed")?.count ?? 0;
  const deliveredOrders =
    (data?.ordersByStatus.find((o) => o.status === "Delivered")?.count ?? 0) +
    (data?.deliveredOrders ?? 0);

  // Detect HEAD_ADMIN role from localStorage
  const userRaw = localStorage.getItem("assignflow_user");
  const userRole: string = userRaw
    ? ((JSON.parse(userRaw) as { role?: string }).role ?? "")
    : "";
  const isHeadAdmin = userRole === "headAdmin" || userRole === "HEAD_ADMIN";

  return (
    <AdminLayout pageTitle="Analytics">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-xl border border-gray-100 shadow-sm p-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === "overview"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-500 hover:bg-gray-50"
          }`}
          data-ocid="analytics.overview_tab"
        >
          Overview
        </button>
        {isHeadAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab("transactions")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "transactions"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-50"
            }`}
            data-ocid="analytics.transactions_tab"
          >
            Transactions
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab("verifications")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === "verifications"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-500 hover:bg-gray-50"
          }`}
          data-ocid="analytics.verifications_tab"
        >
          Payment Verifications
        </button>
      </div>

      {activeTab === "verifications" ? (
        <PaymentVerificationPanel
          role={isHeadAdmin ? "headAdmin" : "collegeAdmin"}
          highlightTxnId={highlightTxnId}
        />
      ) : activeTab === "transactions" && isHeadAdmin ? (
        <TransactionTab />
      ) : (
        <>
          {/* Toolbar — overview only */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <select
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                data-ocid="analytics.college_select"
              >
                <option value="all">All Colleges</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-2 text-xs font-semibold transition-colors ${
                      period === p
                        ? "bg-blue-600 text-white"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                    data-ocid={`analytics.period_${p.toLowerCase()}_tab`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchOverviewData}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={exportPDF}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                data-ocid="analytics.export_pdf_button"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </button>
            </div>
          </div>

          {loading ? (
            <div
              className="flex items-center justify-center h-64"
              data-ocid="analytics.loading_state"
            >
              <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                  label="Total Orders"
                  value={totalOrders.toString()}
                  icon={ShoppingCart}
                  color="bg-blue-100 text-blue-600"
                />
                <StatCard
                  label="Total Revenue"
                  value={
                    totalRevenue === 0
                      ? "₹0"
                      : `₹${(totalRevenue / 1000).toFixed(1)}k`
                  }
                  icon={TrendingUp}
                  color="bg-emerald-100 text-emerald-600"
                />
                <StatCard
                  label="Delivered Orders"
                  value={deliveredOrders.toString()}
                  sub={
                    deliveredOrders > 0
                      ? `₹${(totalRevenue).toLocaleString("en-IN")} revenue`
                      : undefined
                  }
                  icon={CheckCircle}
                  color="bg-emerald-100 text-emerald-600"
                />
                <StatCard
                  label="Active Users"
                  value={String(
                    data?.ordersByStatus.reduce((s, o) => s + o.count, 0) ?? 0,
                  )}
                  icon={Users}
                  color="bg-purple-100 text-purple-600"
                />
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Revenue chart */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">
                    Monthly Revenue
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Revenue over the last 6 months
                  </p>
                  {data && <RevenueBarChart data={data.revenueByMonth} />}
                </div>

                {/* Service distribution */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">
                    Service Distribution
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Orders by service type
                  </p>
                  {data?.topServices.map((s) => {
                    const total = data.topServices.reduce(
                      (sum, x) => sum + x.count,
                      0,
                    );
                    const pct = Math.round((s.count / total) * 100);
                    const colors = [
                      "bg-blue-500",
                      "bg-emerald-500",
                      "bg-purple-500",
                      "bg-orange-500",
                    ];
                    const ci = data.topServices.indexOf(s);
                    return (
                      <div key={s.service} className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 font-medium">
                            {s.service}
                          </span>
                          <span className="text-gray-400">
                            {pct}% ({s.count})
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${colors[ci % colors.length]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weekly orders + college breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Weekly Order Volume
                  </h3>
                  {data && (
                    <BarChart
                      data={data.weeklyOrders.map((w) => ({
                        label: w.day,
                        value: w.count,
                      }))}
                      max={Math.max(...data.weeklyOrders.map((w) => w.count))}
                      colorClass="bg-blue-500"
                    />
                  )}
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Orders by College
                  </h3>
                  {data && (
                    <BarChart
                      data={data.ordersByCollege.map((c) => ({
                        label: c.college,
                        value: c.count,
                      }))}
                      max={Math.max(
                        ...data.ordersByCollege.map((c) => c.count),
                      )}
                      colorClass="bg-purple-500"
                    />
                  )}
                </div>
              </div>

              {/* Activity feed */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Recent Activity
                </h3>
                <ActivityFeed />
              </div>
            </>
          )}
        </>
      )}
    </AdminLayout>
  );
}
