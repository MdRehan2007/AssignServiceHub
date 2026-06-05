import { useAuth } from "@/hooks/useAuth";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { getNotifications } from "@/services/api";
import type { Notification } from "@/types";
import {
  Bell,
  CheckCheck,
  CreditCard,
  MessageSquare,
  Package,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";

import type React from "react";

const TYPE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  order: Package,
  payment: CreditCard,
  message: MessageSquare,
  system: Settings,
};

// Emoji label per type
const TYPE_EMOJI: Record<string, string> = {
  order: "📦",
  payment: "💰",
  message: "💬",
  system: "🔔",
};

const TYPE_COLORS: Record<string, string> = {
  order: "bg-blue-50 text-blue-600",
  payment: "bg-green-50 text-green-600",
  message: "bg-purple-50 text-purple-600",
  system: "bg-gray-50 text-gray-600",
};

// Maps notification titles to more descriptive context labels
const getNotifLabel = (n: Notification): string | null => {
  const t = n.title.toLowerCase();
  if (t.includes("placed") || t.includes("new order")) return "Order Placed";
  if (t.includes("accepted") || t.includes("assigned")) return "Order Accepted";
  if (t.includes("verified") || t.includes("payment"))
    return "Payment Verified";
  if (t.includes("delivered") || t.includes("delivery"))
    return "Delivery Uploaded";
  if (t.includes("revision") || t.includes("correction"))
    return "Revision Requested";
  if (t.includes("completed") || t.includes("complete"))
    return "Order Completed";
  return null;
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "unread" | "read" | "order" | "payment"
  >("all");

  useEffect(() => {
    const userId = user?.id ?? "cust_1";
    const load = () => {
      getNotifications(userId).then((n) => {
        // Only show notifications belonging to this user
        setNotifs(n.filter((notif) => notif.userId === userId));
        setLoading(false);
      });
    };
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [user]);

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = (id: string) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  const filtered = notifs.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    if (filter === "order") return n.type === "order";
    if (filter === "payment") return n.type === "payment";
    return true;
  });

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  const FILTER_OPTIONS: { value: typeof filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "unread", label: "Unread" },
    { value: "order", label: "📦 Orders" },
    { value: "payment", label: "💰 Payments" },
  ];

  return (
    <CustomerLayout pageTitle="Notifications">
      <div className="max-w-2xl mx-auto space-y-4 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">All Notifications</h2>
            {unreadCount > 0 && (
              <span
                className="h-5 min-w-5 px-1.5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center"
                data-ocid="notifications.unread_badge"
              >
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors self-start sm:self-auto"
            data-ocid="notifications.mark_all_read_button"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2" data-ocid="notifications.filters">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              data-ocid={`notifications.filter.${f.value}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                filter === f.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-50 rounded animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-gray-400"
              data-ocid="notifications.empty_state"
            >
              <Bell className="h-10 w-10 mb-3 opacity-25" />
              <p className="font-medium">No notifications</p>
              <p className="text-sm mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((n, i) => {
                const Icon = TYPE_ICONS[n.type] ?? Bell;
                const emoji = TYPE_EMOJI[n.type] ?? "🔔";
                const label = getNotifLabel(n);
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-4 px-4 sm:px-5 py-4 transition-colors cursor-default ${
                      !n.isRead ? "bg-blue-50/40" : "hover:bg-gray-50"
                    }`}
                    data-ocid={`notifications.item.${i + 1}`}
                  >
                    {/* Icon */}
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        TYPE_COLORS[n.type] ?? "bg-gray-50 text-gray-600"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm" aria-hidden>
                            {emoji}
                          </span>
                          <p
                            className={`text-sm font-semibold ${
                              !n.isRead ? "text-gray-900" : "text-gray-700"
                            }`}
                          >
                            {n.title}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      {label && (
                        <span className="mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                          {label}
                        </span>
                      )}
                      {n.orderId && (
                        <p className="text-xs text-gray-300 mt-0.5 font-mono">
                          Order: {n.orderId}
                        </p>
                      )}
                    </div>

                    {/* Mark read */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!n.isRead && (
                        <>
                          <div className="h-2 w-2 rounded-full bg-blue-600" />
                          <button
                            type="button"
                            onClick={() => markRead(n.id)}
                            className="text-xs text-gray-400 hover:text-blue-600 transition-colors whitespace-nowrap"
                            data-ocid={`notifications.mark_read_button.${i + 1}`}
                          >
                            Mark read
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}
