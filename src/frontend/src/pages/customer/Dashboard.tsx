import { useAuth } from "@/hooks/useAuth";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { getColleges, getNotifications, getOrders } from "@/services/api";
import type { College, Notification, Order } from "@/types";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  PlusCircle,
  ShoppingCart,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  pendingPaymentVerification: "bg-amber-100 text-amber-700",
  activeReadyToStart: "bg-emerald-100 text-emerald-700",
  pending_payment: "bg-amber-100 text-amber-700",
  payment_verification: "bg-yellow-100 text-yellow-700",
  assigned: "bg-blue-100 text-blue-700",
  in_progress: "bg-indigo-100 text-indigo-700",
  review: "bg-purple-100 text-purple-700",
  correction: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
  delivered: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  pendingPaymentVerification: "Pending Payment Verification",
  activeReadyToStart: "Active / Ready to Start",
  pending_payment: "Pending Payment",
  payment_verification: "Payment Verification",
  assigned: "Assigned",
  in_progress: "In Progress",
  review: "Under Review",
  correction: "Correction",
  completed: "Completed",
  delivered: "Delivered",
  closed: "Closed",
};

const STAGE_ORDER = [
  "pendingPaymentVerification",
  "activeReadyToStart",
  "assigned",
  "in_progress",
  "review",
  "correction",
  "completed",
  "delivered",
];

function ProgressMiniCard({ order }: { order: Order }) {
  const idx = STAGE_ORDER.indexOf(order.status);
  const pct = idx < 0 ? 0 : Math.round(((idx + 1) / STAGE_ORDER.length) * 100);
  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {order.subjectName}
          </p>
          <p className="text-xs text-gray-500">
            {order.serviceType === "Other"
              ? (order.customServiceType ?? "Other")
              : order.serviceType.replace(/([A-Z])/g, " $1").trim()}
          </p>
        </div>
        <span
          className={`status-badge text-xs flex-shrink-0 ${
            STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>
      {order.acceptedByAdminName && (
        <div className="flex items-center gap-1 text-xs text-indigo-600">
          <UserCheck className="h-3 w-3" />
          <span>Handled by: {order.acceptedByAdminName}</span>
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">{pct}% complete</p>
    </div>
  );
}

export function CustomerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    const userId = user?.id ?? "cust_1";
    const collegeId = user?.registeredCollegeId ?? "col_1";
    Promise.all([
      getOrders(userId),
      getNotifications(userId),
      getColleges(),
    ]).then(([o, n, colleges]) => {
      const myOrders = o.filter((order) => order.customerId === userId);
      setOrders(myOrders);
      setNotifs(n.filter((notif) => notif.userId === userId));
      const myCollege = colleges.find((c) => c.id === collegeId) ?? null;
      setCollege(myCollege);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchData();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchData]);

  const firstName = user?.name?.split(" ")[0] ?? "Student";
  const recentOrders = orders.slice(0, 5);
  const activeOrders = orders.filter((o) =>
    ["assigned", "in_progress", "review", "correction"].includes(o.status),
  );
  const unreadNotifs = notifs.filter((n) => !n.isRead).slice(0, 3);

  // Recompute stats from actual customer orders for strict isolation
  const totalOrders = orders.length;
  const activeCount = orders.filter((o) =>
    [
      "assigned",
      "in_progress",
      "review",
      "correction",
      "activeReadyToStart",
    ].includes(o.status),
  ).length;
  const completedCount = orders.filter((o) =>
    ["completed", "delivered", "closed"].includes(o.status),
  ).length;
  const pendingPayCount = orders.filter((o) =>
    ["pendingPaymentVerification", "pending_payment"].includes(o.status),
  ).length;

  const stats = [
    {
      label: "Total Orders",
      value: loading ? 0 : totalOrders,
      icon: ShoppingCart,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Active Orders",
      value: loading ? 0 : activeCount,
      icon: TrendingUp,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Completed",
      value: loading ? 0 : completedCount,
      icon: CheckCircle2,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Pending Payment",
      value: loading ? 0 : pendingPayCount,
      icon: CreditCard,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <CustomerLayout pageTitle="Dashboard">
      <div className="space-y-6 animate-fadeIn pb-8">
        {/* Welcome banner */}
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 p-5 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold">
                Good day, {firstName}! 👋
              </h2>
              <p className="text-blue-100 mt-1 text-sm">
                Track your assignments, payments, and messages all in one place.
              </p>
              {/* College chip */}
              {college && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 border border-white/25 rounded-full px-3 py-1">
                  <Building2 className="h-3.5 w-3.5 text-blue-100" />
                  <span className="text-xs font-medium text-blue-50">
                    Your College: {college.name}
                  </span>
                </div>
              )}
            </div>
            <Link
              to="/customer/place-order"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-sm flex-shrink-0 self-start sm:self-auto"
              data-ocid="dashboard.place_order_button"
            >
              <PlusCircle className="h-4 w-4" /> Place New Order
            </Link>
          </div>
        </div>

        {/* Stat cards — 1 col on mobile, 2 on sm, 4 on lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="stat-card"
              data-ocid={`dashboard.stat.${i + 1}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center ${s.color}`}
                >
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
              {loading ? (
                <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent orders */}
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recent Orders</h3>
              <Link
                to="/customer/orders"
                className="text-blue-600 text-sm flex items-center gap-1 hover:underline"
                data-ocid="dashboard.view_all_orders_link"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-50 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-10 text-gray-400 text-sm"
                data-ocid="dashboard.orders.empty_state"
              >
                <ShoppingCart className="h-8 w-8 mb-2 opacity-25" />
                No orders placed yet.
              </div>
            ) : (
              // Mobile: card list; Desktop: table
              <>
                {/* Mobile card view */}
                <div className="sm:hidden space-y-3">
                  {recentOrders.map((order, i) => (
                    <div
                      key={order.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                      data-ocid={`dashboard.order.item.${i + 1}`}
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/customer/tracking"
                          className="text-blue-600 font-mono text-xs font-bold hover:underline"
                        >
                          {order.id}
                        </Link>
                        <p className="text-sm font-medium text-gray-800 truncate mt-0.5">
                          {order.subjectName}
                        </p>
                        {order.acceptedByAdminName && (
                          <p className="text-xs text-indigo-500 flex items-center gap-1 mt-0.5">
                            <UserCheck className="h-3 w-3" />
                            {order.acceptedByAdminName}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-800">
                          ₹{order.amount}
                        </p>
                        <span
                          className={`status-badge text-xs ${
                            STATUS_COLORS[order.status] ??
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-gray-400 font-medium text-xs uppercase tracking-wide">
                          Order ID
                        </th>
                        <th className="text-left py-2 text-gray-400 font-medium text-xs uppercase tracking-wide">
                          Subject
                        </th>
                        <th className="text-left py-2 text-gray-400 font-medium text-xs uppercase tracking-wide">
                          Admin
                        </th>
                        <th className="text-left py-2 text-gray-400 font-medium text-xs uppercase tracking-wide">
                          Amount
                        </th>
                        <th className="text-left py-2 text-gray-400 font-medium text-xs uppercase tracking-wide">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentOrders.map((order, i) => (
                        <tr
                          key={order.id}
                          className="hover:bg-gray-50 transition-colors"
                          data-ocid={`dashboard.order.item.${i + 1}`}
                        >
                          <td className="py-3">
                            <Link
                              to="/customer/tracking"
                              className="text-blue-600 font-mono text-xs hover:underline"
                            >
                              {order.id}
                            </Link>
                          </td>
                          <td className="py-3 text-gray-700 truncate max-w-[120px]">
                            {order.subjectName}
                          </td>
                          <td className="py-3 text-gray-500 text-xs">
                            {order.acceptedByAdminName ? (
                              <span className="flex items-center gap-1 text-indigo-600">
                                <UserCheck className="h-3 w-3" />
                                {order.acceptedByAdminName}
                              </span>
                            ) : (
                              <span className="text-gray-300">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3 text-gray-700">
                            ₹{order.amount}
                          </td>
                          <td className="py-3">
                            <span
                              className={`status-badge text-xs ${
                                STATUS_COLORS[order.status] ??
                                "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {STATUS_LABELS[order.status] ?? order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Notifications panel */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-600" /> Notifications
              </h3>
              <Link
                to="/customer/notifications"
                className="text-blue-600 text-sm hover:underline"
                data-ocid="dashboard.view_all_notifs_link"
              >
                See all
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-gray-50 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : unreadNotifs.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                All caught up!
              </div>
            ) : (
              <div className="space-y-3">
                {unreadNotifs.map((n, i) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/60"
                    data-ocid={`dashboard.notification.item.${i + 1}`}
                  >
                    <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active order progress */}
        {activeOrders.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" /> Active Order Progress
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeOrders.map((order) => (
                <ProgressMiniCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
