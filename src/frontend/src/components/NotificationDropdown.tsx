import {
  useGetNotifications,
  useMarkAllRead,
  useMarkNotifRead,
} from "@/hooks/useNotifications";
import type { Notification } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  CheckCheck,
  ClipboardList,
  CreditCard,
  MessageCircle,
  Settings,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function NotifIcon({ type }: { type: Notification["type"] }) {
  const cls = "h-4 w-4 flex-shrink-0";
  if (type === "order")
    return <ClipboardList className={`${cls} text-blue-500`} />;
  if (type === "payment")
    return <CreditCard className={`${cls} text-green-500`} />;
  if (type === "message")
    return <MessageCircle className={`${cls} text-purple-500`} />;
  return <Settings className={`${cls} text-gray-400`} />;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: "customer" | "admin";
  unreadCount: number;
}

export function NotificationDropdown({
  isOpen,
  onClose,
  userRole,
  unreadCount,
}: NotificationDropdownProps) {
  const { data: notifications = [] } = useGetNotifications();
  const markRead = useMarkNotifRead();
  const markAllRead = useMarkAllRead();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  // Sort newest first, take latest 10
  const sorted = [...notifications]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 10);

  // Click-outside handler
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function getNavTarget(notif: Notification): string {
    if (userRole === "customer") {
      if (
        notif.orderId &&
        (notif.type === "order" || notif.type === "message")
      ) {
        return "/customer/orders";
      }
      if (notif.type === "payment") return "/customer/payments";
      return "/customer/dashboard";
    }
    // admin routing
    if (notif.orderId && notif.type === "order") return "/admin/orders";
    if (notif.type === "payment") {
      const ref =
        notif.orderId ??
        (notif as Notification & { relatedId?: string }).relatedId ??
        "";
      return `/admin/analytics?tab=verifications${ref ? `&txnId=${encodeURIComponent(ref)}` : ""}`;
    }
    if (notif.type === "message") return "/admin/chat";
    return "/admin/analytics";
  }

  function handleNotifClick(notif: Notification) {
    if (!notif.isRead) {
      markRead.mutate(notif.id);
    }
    const target = getNavTarget(notif);
    onClose();
    // Navigate with search params support for analytics deep-links
    const [path, query] = target.split("?");
    if (query) {
      const params = Object.fromEntries(new URLSearchParams(query).entries());
      navigate({ to: path as "/admin/analytics", search: params });
    } else {
      navigate({ to: target as "/customer/orders" });
    }
  }

  function handleMarkAll() {
    markAllRead.mutate();
  }

  function handleViewAll() {
    onClose();
    if (userRole === "customer") {
      navigate({ to: "/customer/notifications" });
    } else {
      navigate({ to: "/admin/analytics" });
    }
  }

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-lg border border-gray-100 z-[200] flex flex-col overflow-hidden"
      aria-label="Notifications panel"
      data-ocid="notifications.dropdown"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-gray-900 text-sm">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              data-ocid="notifications.mark_all_read_button"
              title="Mark all as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mark all read</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            aria-label="Close notifications"
            data-ocid="notifications.close_button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto" style={{ maxHeight: "360px" }}>
        {sorted.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-10 text-gray-400"
            data-ocid="notifications.empty_state"
          >
            <Bell className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm font-medium">No notifications yet</p>
          </div>
        ) : (
          sorted.map((notif, idx) => (
            <button
              type="button"
              key={notif.id}
              onClick={() => handleNotifClick(notif)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                !notif.isRead ? "bg-blue-50/60" : ""
              }`}
              data-ocid={`notifications.item.${idx + 1}`}
            >
              {/* Unread dot */}
              <span
                className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                  !notif.isRead ? "bg-blue-600" : "bg-transparent"
                }`}
              />
              {/* Type icon */}
              <div className="mt-0.5 flex-shrink-0">
                <NotifIcon type={notif.type} />
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-tight mb-0.5 ${
                    !notif.isRead
                      ? "font-semibold text-gray-900"
                      : "font-medium text-gray-700"
                  }`}
                >
                  {notif.title}
                </p>
                <p className="text-xs text-gray-500 truncate leading-snug">
                  {notif.message}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {timeAgo(notif.createdAt)}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      {userRole === "customer" && (
        <div className="px-4 py-2.5 border-t border-gray-100 flex-shrink-0">
          <button
            type="button"
            onClick={handleViewAll}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
            data-ocid="notifications.view_all_link"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
