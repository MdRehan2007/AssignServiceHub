import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/layouts/AdminLayout";
import {
  deleteMessage,
  getMessages,
  getOrders,
  sendMessage,
} from "@/services/api";
import type { Message, Order } from "@/types";
import {
  AlertTriangle,
  Circle,
  Hash,
  MessageSquare,
  Paperclip,
  Send,
  Trash2,
  Volume2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ROOMS = [
  {
    id: "admin-general",
    label: "General",
    icon: Hash,
    description: "Team discussion",
  },
  {
    id: "admin-announcements",
    label: "Announcements",
    icon: Volume2,
    description: "Official notices",
  },
  {
    id: "admin-escalations",
    label: "Escalations",
    icon: AlertTriangle,
    description: "Urgent issues",
  },
] as const;

type RoomId = (typeof ROOMS)[number]["id"];
type ChatMode = "rooms" | "orders";

const ONLINE_USERS = [
  { name: "Ravi Kumar", role: "College Admin", initials: "RK" },
  { name: "Anjali Devi", role: "College Admin", initials: "AD" },
  { name: "Suresh Babu", role: "College Admin", initials: "SB" },
];

const ROLE_BADGES: Record<string, string> = {
  headAdmin: "bg-purple-100 text-purple-700",
  collegeAdmin: "bg-blue-100 text-blue-700",
  writer: "bg-emerald-100 text-emerald-700",
  customer: "bg-gray-100 text-gray-600",
};

const ROLE_LABELS: Record<string, string> = {
  headAdmin: "Database Administrator",
  collegeAdmin: "College Admin",
  writer: "Writer",
  customer: "Customer",
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminChat() {
  const { user } = useAuth();
  const [chatMode, setChatMode] = useState<ChatMode>("rooms");
  const [activeRoom, setActiveRoom] = useState<RoomId>("admin-general");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load orders when mode switches to orders
  useEffect(() => {
    if (chatMode === "orders") {
      setLoadingOrders(true);
      getOrders().then((all) => {
        // collegeAdmin sees only their college's orders; headAdmin sees all
        const filtered =
          user?.role === "headAdmin"
            ? all
            : all.filter(
                (o) =>
                  o.acceptedByAdminId === user?.id ||
                  o.college === user?.college,
              );
        setOrders(filtered);
        setLoadingOrders(false);
      });
    }
  }, [chatMode, user]);

  const activeChannelId =
    chatMode === "orders" ? (selectedOrder?.id ?? "") : activeRoom;

  useEffect(() => {
    if (!activeChannelId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    getMessages(activeChannelId).then((msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
  }, [activeChannelId]);

  // 30s polling
  useEffect(() => {
    if (!activeChannelId) return;
    const interval = setInterval(() => {
      getMessages(activeChannelId).then(setMessages);
    }, 30000);
    return () => clearInterval(interval);
  }, [activeChannelId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeChannelId) return;
    const msg = await sendMessage(activeChannelId, input.trim(), {
      id: user?.id ?? "head_admin",
      name: user?.name ?? "Database Administrator",
      role: user?.role ?? "headAdmin",
    });
    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!activeChannelId) return;
    setDeletingId(msgId);
    await deleteMessage(activeChannelId, msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    setDeletingId(null);
    setDeleteConfirm(null);
  };

  const canDeleteMessage = (msg: Message) => {
    if (!user) return false;
    if (user.role === "headAdmin") return true;
    return msg.senderId === user.id;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeRoomMeta = ROOMS.find((r) => r.id === activeRoom)!;

  return (
    <AdminLayout pageTitle="Admin Chat">
      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          aria-modal="true"
        >
          <div
            className="bg-card border border-border rounded-xl shadow-lg p-6 max-w-sm w-full mx-4"
            data-ocid="chat.delete_dialog"
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
                data-ocid="chat.delete_cancel_button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMessage(deleteConfirm)}
                disabled={deletingId === deleteConfirm}
                className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                data-ocid="chat.delete_confirm_button"
              >
                {deletingId === deleteConfirm ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive chat shell */}
      <div className="flex h-[calc(100dvh-6rem)] sm:h-[calc(100vh-140px)] overflow-hidden rounded-xl border border-border bg-card">
        {/* Sidebar — hidden on mobile unless showSidebar, always visible on sm+ */}
        <div
          className={`${
            showSidebar ? "flex" : "hidden"
          } sm:flex w-full sm:w-64 flex-shrink-0 flex-col gap-4 border-r border-border bg-card overflow-y-auto p-3 absolute sm:static z-20 h-full sm:h-auto sm:rounded-l-xl`}
        >
          {/* Close button on mobile */}
          <button
            type="button"
            className="sm:hidden self-end p-1.5 rounded-md text-muted-foreground hover:bg-muted/50"
            onClick={() => setShowSidebar(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>

          {/* Mode toggle */}
          <div className="flex rounded-lg bg-muted p-1 gap-1">
            <button
              type="button"
              onClick={() => {
                setChatMode("rooms");
                setShowSidebar(false);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                chatMode === "rooms"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid="chat.mode_rooms_tab"
            >
              <Hash className="h-3.5 w-3.5" /> Rooms
            </button>
            <button
              type="button"
              onClick={() => {
                setChatMode("orders");
                setShowSidebar(false);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                chatMode === "orders"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid="chat.mode_orders_tab"
            >
              <MessageSquare className="h-3.5 w-3.5" /> Orders
            </button>
          </div>

          {/* Rooms list */}
          {chatMode === "rooms" && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">
                Chat Rooms
              </p>
              <div className="space-y-0.5">
                {ROOMS.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => {
                      setActiveRoom(room.id);
                      setShowSidebar(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      activeRoom === room.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted/50 text-foreground"
                    }`}
                    data-ocid={`chat.room_${room.id.replace("admin-", "")}_button`}
                  >
                    <room.icon className="h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {room.label}
                      </p>
                      <p
                        className={`text-xs truncate ${
                          activeRoom === room.id
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {room.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Order chats list */}
          {chatMode === "orders" && (
            <div className="flex-1 min-h-0 flex flex-col">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">
                Order Chats
              </p>
              {loadingOrders ? (
                <div className="flex justify-center py-4">
                  <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2">
                  No orders found
                </p>
              ) : (
                <div className="space-y-0.5 overflow-y-auto">
                  {orders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowSidebar(false);
                      }}
                      className={`w-full flex flex-col gap-0.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        selectedOrder?.id === order.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted/50 text-foreground"
                      }`}
                      data-ocid={`chat.order_item.${order.id}`}
                    >
                      <span
                        className={`font-mono text-xs font-bold ${
                          selectedOrder?.id === order.id
                            ? "text-primary-foreground"
                            : "text-primary"
                        }`}
                      >
                        {order.id}
                      </span>
                      <span className="text-xs truncate">
                        {order.subjectName}
                      </span>
                      <span
                        className={`text-xs ${
                          selectedOrder?.id === order.id
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Online users (rooms mode only) */}
          {chatMode === "rooms" && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">
                Online ({ONLINE_USERS.length})
              </p>
              <div className="space-y-2">
                {ONLINE_USERS.map((u) => (
                  <div key={u.name} className="flex items-center gap-2 px-2">
                    <div className="relative flex-shrink-0">
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                        {u.initials}
                      </div>
                      <Circle className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 text-emerald-500 fill-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {u.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {u.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Backdrop for mobile sidebar */}
        {showSidebar && (
          <div
            className="sm:hidden fixed inset-0 bg-black/40 z-10"
            onClick={() => setShowSidebar(false)}
            onKeyDown={(e) => e.key === "Escape" && setShowSidebar(false)}
            role="button"
            tabIndex={-1}
            aria-label="Close sidebar"
          />
        )}

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
            {/* Hamburger for mobile sidebar */}
            <button
              type="button"
              className="sm:hidden p-1.5 rounded-md text-muted-foreground hover:bg-muted/50 flex-shrink-0"
              onClick={() => setShowSidebar(true)}
              aria-label="Open rooms"
              data-ocid="chat.open_rooms_button"
            >
              <Hash className="h-4 w-4" />
            </button>
            {chatMode === "rooms" ? (
              <>
                <activeRoomMeta.icon className="hidden sm:block h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {activeRoomMeta.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activeRoomMeta.description}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                  <span className="h-2 w-2 bg-emerald-500 rounded-full" />
                  <span className="text-xs text-muted-foreground">
                    {ONLINE_USERS.length} online
                  </span>
                </div>
              </>
            ) : selectedOrder ? (
              <>
                <MessageSquare className="hidden sm:block h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate font-mono">
                    {selectedOrder.id}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedOrder.subjectName} —{" "}
                    {selectedOrder.status.replace(/_/g, " ")}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select an order to chat
              </p>
            )}
          </div>

          {/* Messages — scrollable */}
          <div
            className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4"
            data-ocid="chat.messages_panel"
          >
            {chatMode === "orders" && !selectedOrder ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                <MessageSquare className="h-12 w-12 opacity-20" />
                <p className="text-sm">
                  Select an order from the sidebar to view its chat
                </p>
              </div>
            ) : loading ? (
              <div
                className="flex justify-center pt-8"
                data-ocid="chat.loading_state"
              >
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2"
                data-ocid="chat.empty_state"
              >
                <MessageSquare className="h-10 w-10 opacity-20" />
                <p className="text-sm">No messages yet</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMine = msg.senderId === (user?.id ?? "head_admin");
                const canDelete = canDeleteMessage(msg);
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 sm:gap-3 group ${
                      isMine ? "flex-row-reverse" : ""
                    }`}
                    data-ocid={`chat.message.${i + 1}`}
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isMine
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {msg.senderName[0]}
                    </div>
                    <div
                      className={`max-w-[80%] sm:max-w-[70%] ${
                        isMine ? "items-end" : "items-start"
                      } flex flex-col gap-1 min-w-0`}
                    >
                      <div
                        className={`flex items-center gap-1.5 sm:gap-2 flex-wrap ${
                          isMine ? "flex-row-reverse" : ""
                        }`}
                      >
                        <p className="text-xs font-semibold text-foreground">
                          {msg.senderName}
                        </p>
                        <span
                          className={`inline-flex px-1.5 py-0.5 text-xs rounded-full ${
                            ROLE_BADGES[msg.senderRole] ??
                            "bg-muted text-muted-foreground"
                          }`}
                        >
                          {ROLE_LABELS[msg.senderRole] ?? msg.senderRole}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <div
                        className={`flex items-end gap-1.5 ${isMine ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-sm break-words ${
                            isMine
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted text-foreground rounded-tl-sm"
                          }`}
                        >
                          {msg.content}
                        </div>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(msg.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0"
                            aria-label="Delete message"
                            data-ocid={`chat.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {!msg.isRead && !isMine && (
                        <p className="text-xs text-primary">New</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {typing && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
                  ...
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input — fixed at bottom of flex col */}
          <div className="flex-shrink-0 px-3 py-3 sm:px-4 border-t border-border bg-card">
            <div className="flex items-end gap-2">
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0"
                aria-label="Attach file"
                data-ocid="chat.attach_button"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <div className="flex-1 min-w-0">
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setTyping(true);
                    setTimeout(() => setTyping(false), 1500);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    chatMode === "orders" && !selectedOrder
                      ? "Select an order to chat"
                      : "Type a message... (Enter to send)"
                  }
                  disabled={chatMode === "orders" && !selectedOrder}
                  rows={1}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm resize-none bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                  data-ocid="chat.message_input"
                />
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={
                  !input.trim() || (chatMode === "orders" && !selectedOrder)
                }
                className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 flex-shrink-0"
                data-ocid="chat.send_button"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
