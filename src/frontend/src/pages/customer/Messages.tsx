import { useAuth } from "@/hooks/useAuth";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import {
  deleteMessage,
  getMessages,
  getOrders,
  sendMessage,
} from "@/services/api";
import type { Message, Order } from "@/types";
import { MessageSquare, Search, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ROLE_COLORS: Record<string, string> = {
  customer: "bg-blue-600",
  collegeAdmin: "bg-purple-600",
  headAdmin: "bg-red-600",
  writer: "bg-green-600",
};

export function MessagesPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [searchOrders, setSearchOrders] = useState("");
  const [showThreadList, setShowThreadList] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getOrders().then((o) => {
      setOrders(o);
      if (o.length > 0) setSelectedOrder(o[0]);
    });
  }, []);

  useEffect(() => {
    if (!selectedOrder) return;
    getMessages(selectedOrder.id).then((m) => {
      setMessages(m);
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
    });
  }, [selectedOrder]);

  // Poll every 30s
  useEffect(() => {
    if (!selectedOrder) return;
    const timer = setInterval(() => {
      getMessages(selectedOrder.id).then(setMessages);
    }, 30000);
    return () => clearInterval(timer);
  }, [selectedOrder]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteMessage = async (msgId: string) => {
    if (!selectedOrder) return;
    setDeletingId(msgId);
    await deleteMessage(selectedOrder.id, msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    setDeletingId(null);
    setDeleteConfirm(null);
  };

  const canDeleteMessage = (msg: Message) => {
    if (!user) return false;
    if (user.role === "headAdmin") return true;
    return msg.senderId === user.id;
  };

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
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchOrders.toLowerCase()) ||
      o.subjectName.toLowerCase().includes(searchOrders.toLowerCase()),
  );

  const unreadFor = (orderId: string) =>
    messages.filter(
      (m) => m.orderId === orderId && !m.isRead && m.senderRole !== "customer",
    ).length;

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowThreadList(false); // on mobile, switch to chat view
  };

  return (
    <CustomerLayout pageTitle="Messages">
      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          aria-modal="true"
        >
          <div
            className="bg-card border border-border rounded-xl shadow-lg p-6 max-w-sm w-full mx-4"
            data-ocid="messages.delete_dialog"
          >
            <h3 className="text-base font-semibold text-foreground mb-2">
              Delete Message
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              Are you sure you want to delete this message? This action cannot
              be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
                data-ocid="messages.delete_cancel_button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMessage(deleteConfirm)}
                disabled={deletingId === deleteConfirm}
                className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                data-ocid="messages.delete_confirm_button"
              >
                {deletingId === deleteConfirm ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-height flex container */}
      <div className="flex h-[calc(100dvh-4rem)] sm:h-[calc(100vh-8rem)] overflow-hidden animate-fadeIn">
        {/* Left: thread list — full screen on mobile when visible */}
        <div
          className={`${
            showThreadList ? "flex" : "hidden"
          } sm:flex w-full sm:w-72 flex-shrink-0 bg-card border-r border-border flex-col overflow-hidden`}
        >
          {/* Mobile back not needed here — this is the list */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchOrders}
                onChange={(e) => setSearchOrders(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border-2 border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                data-ocid="messages.search_input"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredOrders.length === 0 ? (
              <div
                className="flex items-center justify-center h-32 text-muted-foreground text-sm"
                data-ocid="messages.empty_state"
              >
                No orders
              </div>
            ) : (
              filteredOrders.map((o, i) => {
                const unread = unreadFor(o.id);
                const isSelected = selectedOrder?.id === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => handleSelectOrder(o)}
                    data-ocid={`messages.thread.item.${i + 1}`}
                    className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors hover:bg-muted/40 ${
                      isSelected
                        ? "bg-primary/10 border-l-2 border-l-primary"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-primary font-semibold">
                        {o.id}
                      </span>
                      {unread > 0 && (
                        <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {o.subjectName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {o.serviceType.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: chat window */}
        <div
          className={`${
            !showThreadList ? "flex" : "hidden"
          } sm:flex flex-1 flex-col overflow-hidden bg-background min-w-0`}
        >
          {!selectedOrder ? (
            <div
              className="flex flex-col items-center justify-center flex-1 text-muted-foreground"
              data-ocid="messages.empty_state"
            >
              <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
              <p>Select an order to view messages</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-border flex items-center gap-3 flex-shrink-0">
                {/* Back button on mobile */}
                <button
                  type="button"
                  onClick={() => setShowThreadList(true)}
                  className="sm:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-smooth"
                  aria-label="Back to threads"
                  data-ocid="messages.back_button"
                >
                  ←
                </button>
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-primary font-bold text-sm block truncate">
                    {selectedOrder.id}
                  </span>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedOrder.subjectName} —{" "}
                    {selectedOrder.serviceType
                      .replace(/([A-Z])/g, " $1")
                      .trim()}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground capitalize flex-shrink-0">
                  {selectedOrder.status.replace(/_/g, " ")}
                </span>
              </div>

              {/* Messages — scrollable area */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                {messages.map((m, i) => {
                  const isMe = m.senderId === (user?.id ?? "cust_1");
                  const initials = m.senderName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  const canDelete = canDeleteMessage(m);
                  return (
                    <div
                      key={m.id}
                      className={`flex items-end gap-2 group ${
                        isMe ? "flex-row-reverse" : ""
                      }`}
                      data-ocid={`messages.message.item.${i + 1}`}
                    >
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                          ROLE_COLORS[m.senderRole] ?? "bg-muted-foreground"
                        }`}
                      >
                        {initials}
                      </div>
                      <div
                        className={`max-w-[80%] sm:max-w-[70%] ${
                          isMe ? "items-end" : "items-start"
                        } flex flex-col min-w-0`}
                      >
                        {!isMe && (
                          <p className="text-xs text-muted-foreground mb-0.5 ml-1">
                            {m.senderName}
                          </p>
                        )}
                        <div
                          className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : ""}`}
                        >
                          <div
                            className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-sm break-words ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            }`}
                          >
                            {m.content}
                          </div>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(m.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0"
                              aria-label="Delete message"
                              data-ocid={`messages.delete_button.${i + 1}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground/60 mt-0.5 mx-1">
                          {new Date(m.timestamp).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {isMe && (
                            <span className="ml-1">
                              {m.isRead ? "✓✓" : "✓"}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input — sticky at bottom */}
              <div className="flex-shrink-0 px-3 py-3 sm:px-4 border-t border-border flex gap-2 bg-card">
                <input
                  type="text"
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && handleSend()
                  }
                  placeholder="Type a message..."
                  className="flex-1 min-w-0 border-2 border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 h-10"
                  data-ocid="messages.message_input"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !newMsg.trim()}
                  className="flex-shrink-0 px-4 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-smooth"
                  data-ocid="messages.send_button"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}
