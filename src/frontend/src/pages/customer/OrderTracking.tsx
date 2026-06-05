import { PaymentHistoryPanel } from "@/components/PaymentHistoryPanel";
import { useAuth } from "@/hooks/useAuth";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import {
  getMessages,
  getOrders,
  getPaymentsByOrder,
  sendMessage,
} from "@/services/api";
import type { Message, Order } from "@/types";
import {
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Info,
  MessageSquare,
  Send,
  UserCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Full order stages including new statuses
// 7-stage roadmap as required
const STAGES: {
  key: string;
  label: string;
  description: string;
  statusKeys: string[];
}[] = [
  {
    key: "order_placed",
    label: "Order Placed",
    description: "Your order has been received",
    statusKeys: ["pending_payment", "pendingPaymentVerification"],
  },
  {
    key: "payment_submitted",
    label: "Payment Submitted",
    description: "Payment proof uploaded — awaiting verification",
    statusKeys: ["payment_verification", "payment_submitted"],
  },
  {
    key: "payment_verified",
    label: "Payment Verified",
    description: "Payment confirmed — order is active",
    statusKeys: ["activeReadyToStart", "active"],
  },
  {
    key: "admin_assigned",
    label: "Admin Assigned",
    description: "Order accepted by an admin",
    statusKeys: ["assigned"],
  },
  {
    key: "in_progress",
    label: "In Progress",
    description: "Work actively in progress",
    statusKeys: ["in_progress", "review", "correction"],
  },
  {
    key: "completed",
    label: "Completed",
    description: "Assignment completed and ready",
    statusKeys: ["completed"],
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Files delivered to you",
    statusKeys: ["delivered", "closed"],
  },
];

const STATUS_BADGE_COLORS: Record<string, string> = {
  pendingPaymentVerification:
    "bg-amber-100 text-amber-700 border border-amber-200",
  activeReadyToStart:
    "bg-emerald-100 text-emerald-700 border border-emerald-200",
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

const SERVICE_LABELS: Record<string, string> = {
  SoftCopy: "Soft Copy",
  HardCopy: "Hard Copy",
  RecordWriting: "Record Writing",
  NotesWriting: "Notes Writing",
  Other: "Other",
};

function getStageIndex(status: string): number {
  return STAGES.findIndex((s) => s.statusKeys.includes(status));
}

function progressPercent(status: string): number {
  const idx = getStageIndex(status);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / STAGES.length) * 100);
}

export function OrderTrackingPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userId = user?.id ?? "cust_1";
    getOrders(userId).then((all) => {
      // Only customer's own orders, isolated by their ID
      const mine = all.filter((o) => o.customerId === userId);
      setOrders(mine);
      if (mine.length > 0) {
        setSelectedOrder(mine[0]);
        getMessages(mine[0].id).then(setMessages);
      }
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (selectedOrder) {
      getMessages(selectedOrder.id).then((msgs) => {
        setMessages(msgs);
        setTimeout(
          () => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          50,
        );
      });
    }
  }, [selectedOrder]);

  const handleSend = async () => {
    if (!newMsg.trim() || !selectedOrder) return;
    setSending(true);
    const msg = await sendMessage(selectedOrder.id, newMsg, {
      id: user?.id ?? "cust_1",
      name: user?.name ?? "Customer",
      role: "customer",
    });
    setMessages((prev) => [...prev, msg]);
    setNewMsg("");
    setSending(false);
    setTimeout(
      () => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  };

  const order = selectedOrder;
  const currentStageIdx = order ? getStageIndex(order.status) : -1;
  const pct = order ? progressPercent(order.status) : 0;

  const isPendingPayment =
    order?.status === "pendingPaymentVerification" ||
    order?.status === "pending_payment";
  const isActive =
    order?.status === "activeReadyToStart" || order?.status === "active";

  if (loading) {
    return (
      <CustomerLayout pageTitle="Order Tracking">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      </CustomerLayout>
    );
  }

  if (orders.length === 0) {
    return (
      <CustomerLayout pageTitle="Order Tracking">
        <div
          className="flex flex-col items-center justify-center py-20 text-gray-400"
          data-ocid="tracking.empty_state"
        >
          <FileText className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">No orders to track yet.</p>
          <p className="text-sm mt-1">
            Place your first order to see tracking here.
          </p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout pageTitle="Order Tracking">
      <div className="max-w-4xl mx-auto space-y-5 animate-fadeIn">
        {/* Order selector (when multiple orders) */}
        {orders.length > 1 && (
          <div className="card p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">
              Select Order
            </p>
            <div className="flex flex-wrap gap-2">
              {orders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedOrder(o)}
                  data-ocid={`tracking.order_tab.${o.id}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    selectedOrder?.id === o.id
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  {o.id} — {o.subjectName}
                </button>
              ))}
            </div>
          </div>
        )}

        {order && (
          <>
            {/* Status banner for special statuses */}
            {isPendingPayment && (
              <div
                className="rounded-xl p-4 flex items-start gap-3 bg-amber-50 border border-amber-200"
                data-ocid="tracking.pending_payment_banner"
              >
                <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Pending Payment Verification
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Your order has been received and admins have been notified.
                    Please submit payment proof. Work cannot begin until payment
                    is verified.
                  </p>
                </div>
              </div>
            )}
            {isActive && (
              <div
                className="rounded-xl p-4 flex items-start gap-3 bg-emerald-50 border border-emerald-200"
                data-ocid="tracking.active_banner"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">
                    Active / Ready to Start
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Payment verified! Your order is active and an admin will
                    accept it shortly.
                  </p>
                </div>
              </div>
            )}

            {/* Order summary */}
            <div className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-blue-600 font-bold text-lg">
                      {order.id}
                    </span>
                    {order.isUrgent && (
                      <span className="status-badge bg-amber-100 text-amber-700 text-xs">
                        🔥 Urgent
                      </span>
                    )}
                    <span
                      className={`status-badge text-xs ${
                        STATUS_BADGE_COLORS[order.status] ??
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">
                    {SERVICE_LABELS[order.serviceType] ?? order.serviceType} •{" "}
                    {order.subjectName} • {order.department}
                  </p>
                  {/* Admin assignment info */}
                  {order.acceptedByAdminName ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2 w-fit">
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>
                        Handled by:{" "}
                        <span className="font-semibold">
                          {order.acceptedByAdminName}
                        </span>
                      </span>
                      {order.acceptedAt && (
                        <span className="text-indigo-400">
                          · Accepted{" "}
                          {new Date(order.acceptedAt).toLocaleDateString(
                            "en-IN",
                            {
                              dateStyle: "short",
                            },
                          )}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-gray-400 italic">
                      Awaiting admin assignment
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {/* Price breakdown: prefer persisted line-items, fall back to flat amount */}
                  {order.basePrice !== undefined && order.basePrice > 0 ? (
                    <div className="space-y-0.5">
                      <div className="flex justify-end gap-3 text-xs text-gray-500">
                        <span>Base</span>
                        <span>₹{order.basePrice}</span>
                      </div>
                      {order.paperChargeAmount !== undefined &&
                        order.paperChargeAmount > 0 && (
                          <div className="flex justify-end gap-3 text-xs text-amber-600">
                            <span>Paper Charges</span>
                            <span>+₹{order.paperChargeAmount}</span>
                          </div>
                        )}
                      {order.urgencyCharge !== undefined &&
                        order.urgencyCharge > 0 && (
                          <div className="flex justify-end gap-3 text-xs text-amber-600">
                            <span>Urgency</span>
                            <span>+₹{order.urgencyCharge}</span>
                          </div>
                        )}
                      <p className="text-2xl font-bold text-gray-900 text-right">
                        ₹{order.amount}
                      </p>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{order.amount}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    Due {new Date(order.deadline).toLocaleDateString("en-IN")}
                  </p>
                  {/* Progress % */}
                  <div className="mt-2">
                    <div className="flex items-center justify-end gap-1 text-xs text-gray-500 mb-1">
                      <span>{pct}% complete</span>
                    </div>
                    <div className="w-24 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-blue-600 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card p-5 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" /> Order Timeline
              </h3>
              <div className="relative">
                {STAGES.map((stage, idx) => {
                  const isPast = idx < currentStageIdx;
                  const isCurrent = idx === currentStageIdx;
                  const isFuture = idx > currentStageIdx;
                  // Find the first matching history entry for any of this stage's statusKeys
                  const histEntry = order.statusHistory.find((h) =>
                    stage.statusKeys.includes(h.status),
                  );
                  return (
                    <div
                      key={stage.key}
                      className="flex gap-4 pb-5 last:pb-0"
                      data-ocid={`tracking.stage.${idx + 1}`}
                    >
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                            isPast
                              ? "bg-green-100"
                              : isCurrent
                                ? "bg-blue-600 shadow-lg shadow-blue-200"
                                : "bg-gray-100"
                          }`}
                        >
                          {isPast ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : isCurrent ? (
                            <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-300" />
                          )}
                        </div>
                        {idx < STAGES.length - 1 && (
                          <div
                            className={`w-0.5 flex-1 mt-1 min-h-[1.5rem] ${
                              isPast
                                ? "bg-green-200"
                                : isCurrent
                                  ? "bg-blue-200"
                                  : "bg-gray-100"
                            }`}
                          />
                        )}
                      </div>
                      <div
                        className={`pb-2 min-w-0 ${isFuture ? "opacity-40" : ""}`}
                      >
                        <p
                          className={`text-sm font-semibold ${
                            isCurrent
                              ? "text-blue-700"
                              : isPast
                                ? "text-green-700"
                                : "text-gray-400"
                          }`}
                        >
                          {stage.label}
                          {isCurrent && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {stage.description}
                        </p>
                        {histEntry && (
                          <p className="text-xs text-gray-300 mt-0.5">
                            {new Date(histEntry.timestamp).toLocaleString(
                              "en-IN",
                              {
                                dateStyle: "short",
                                timeStyle: "short",
                              },
                            )}
                          </p>
                        )}
                        {/* Show payment notice on stage 1 when pending */}
                        {isCurrent && stage.key === "order_placed" && (
                          <p className="text-xs text-amber-500 mt-1 font-medium">
                            ⚠ Admin cannot start work until payment is verified
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Details */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" /> Order Details
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {[
                  ["College", order.college ?? "—"],
                  [
                    "Service",
                    SERVICE_LABELS[order.serviceType] ?? order.serviceType,
                  ],
                  ["Department", order.department],
                  [
                    "Placed On",
                    new Date(order.createdAt).toLocaleDateString("en-IN"),
                  ],
                  [
                    "Deadline",
                    new Date(order.deadline).toLocaleDateString("en-IN"),
                  ],
                  ["Payment", order.paymentStatus],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                      {k}
                    </p>
                    <p className="font-medium text-gray-800 mt-0.5 capitalize">
                      {v}
                    </p>
                  </div>
                ))}
              </div>
              {order.description && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Description
                  </p>
                  <p className="text-sm text-gray-700">{order.description}</p>
                </div>
              )}
              {/* Read-only notice */}
              <div className="mt-4 flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  Order details are read-only. Contact support if changes are
                  needed.
                </span>
              </div>
            </div>

            {/* Payment History */}
            <PaymentHistoryPanel
              orderId={order.id}
              customerName={order.customerName}
              college={order.college ?? "—"}
              serviceType={order.serviceType}
              fetchPayments={getPaymentsByOrder}
            />

            {/* Messages */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" /> Order
                Messages
              </h3>
              <div className="space-y-3 max-h-72 overflow-y-auto mb-4 scrollbar-hide">
                {messages.map((m, i) => {
                  const isMe = m.senderRole === "customer";
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      data-ocid={`tracking.message.item.${i + 1}`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-sm rounded-2xl px-4 py-2.5 text-sm ${
                          isMe
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-gray-100 text-gray-800 rounded-bl-sm"
                        }`}
                      >
                        {!isMe && (
                          <p className="text-xs font-semibold mb-0.5 opacity-60">
                            {m.senderName}
                          </p>
                        )}
                        <p>{m.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isMe ? "text-blue-100" : "text-gray-400"
                          }`}
                        >
                          {new Date(
                            typeof m.timestamp === "string"
                              ? Date.parse(m.timestamp)
                              : m.timestamp,
                          ).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={msgEndRef} />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && handleSend()
                  }
                  placeholder="Type a message..."
                  className="input-field flex-1 min-w-0"
                  data-ocid="tracking.message_input"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !newMsg.trim()}
                  className="btn-primary px-4 disabled:opacity-50 flex-shrink-0"
                  data-ocid="tracking.send_button"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </CustomerLayout>
  );
}
