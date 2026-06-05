import { createActor } from "@/backend";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/layouts/AdminLayout";
import {
  deleteOrder,
  getColleges,
  getOrders,
  updateOrderStatus,
  verifyPaymentManually,
} from "@/services/api";
import type { College, Order, OrderStatus } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Eye,
  FileText,
  Filter,
  Lock,
  Search,
  Trash2,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pendingPaymentVerification: "Pending Payment Verification",
  activeReadyToStart: "Active / Ready to Start",
  pending_payment: "Pending Payment",
  payment_verification: "Payment Verification",
  active: "Active",
  assigned: "Assigned",
  in_progress: "In Progress",
  review: "Review",
  correction: "Correction",
  completed: "Completed",
  delivered: "Delivered",
  closed: "Closed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pendingPaymentVerification: "bg-yellow-100 text-yellow-800",
  activeReadyToStart: "bg-emerald-100 text-emerald-700",
  pending_payment: "bg-yellow-100 text-yellow-700",
  payment_verification: "bg-orange-100 text-orange-700",
  active: "bg-emerald-100 text-emerald-700",
  assigned: "bg-blue-100 text-blue-700",
  in_progress: "bg-indigo-100 text-indigo-700",
  review: "bg-purple-100 text-purple-700",
  correction: "bg-rose-100 text-rose-700",
  completed: "bg-emerald-100 text-emerald-700",
  delivered: "bg-teal-100 text-teal-700",
  closed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

const ALL_STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[];

// ProofCell removed — inline proof rendering used directly in table rows

function isValidProofUrl(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:image/")
  );
}

const isPdfProofUrl = (url: string) =>
  url.endsWith(".pdf") || url.startsWith("data:application/pdf");

function OrderDetailModal({
  order,
  onClose,
  onOpenProof,
  onVerify,
}: {
  order: Order;
  onClose: () => void;
  onOpenProof: (url: string) => void;
  onVerify?: (order: Order, type: "approve" | "reject") => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="presentation"
      />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10"
        data-ocid="orders.order_detail_dialog"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100"
          data-ocid="orders.close_button"
        >
          ✕
        </button>
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Order #{order.id}
        </h2>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-gray-400">Customer</p>
              <p className="font-medium">{order.customerName}</p>
            </div>
            <div>
              <p className="text-gray-400">Email</p>
              <p className="font-medium truncate">{order.customerEmail}</p>
            </div>
            <div>
              <p className="text-gray-400">Service</p>
              <p className="font-medium">{order.serviceType}</p>
            </div>
            <div>
              <p className="text-gray-400">Phone Number</p>
              <p className="font-medium">{order.customerPhone ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-400">College</p>
              <p className="font-medium">
                {order.customCollege && order.customCollege.trim() !== ""
                  ? order.customCollege
                  : (order.college ?? "—")}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Subject</p>
              <p className="font-medium">{order.subjectName}</p>
            </div>
            <div>
              <p className="text-gray-400">Department</p>
              <p className="font-medium">{order.department}</p>
            </div>
            <div>
              <p className="text-gray-400">Amount</p>
              <p className="font-bold text-blue-600">₹{order.amount}</p>
            </div>
            <div>
              <p className="text-gray-400">Urgent</p>
              <p className="font-medium">{order.isUrgent ? "Yes 🔴" : "No"}</p>
            </div>
          </div>
          <div>
            <p className="text-gray-400">Description</p>
            <p className="mt-1 text-gray-700 text-xs bg-gray-50 p-3 rounded-lg">
              {order.description}
            </p>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <p className="text-gray-400 mb-2 font-medium">Payment Proof</p>
            {!isValidProofUrl(order.uploadedPaymentProof) &&
            !(
              order.uploadedPaymentProof &&
              isPdfProofUrl(order.uploadedPaymentProof)
            ) ? (
              <p className="text-xs text-gray-400 italic">No proof uploaded</p>
            ) : order.uploadedPaymentProof &&
              isPdfProofUrl(order.uploadedPaymentProof) ? (
              <div className="flex items-center gap-3">
                <FileText className="h-10 w-10 text-red-500 flex-shrink-0" />
                <button
                  type="button"
                  onClick={() => onOpenProof(order.uploadedPaymentProof!)}
                  className="text-sm text-blue-600 hover:underline font-medium"
                  data-ocid="orders.view_proof_pdf_button"
                >
                  View PDF
                </button>
              </div>
            ) : isValidProofUrl(order.uploadedPaymentProof) ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenProof(order.uploadedPaymentProof!)}
                  className="p-0 border-0 bg-transparent cursor-pointer"
                  data-ocid="orders.proof_thumbnail"
                >
                  <img
                    src={order.uploadedPaymentProof}
                    alt="Payment proof"
                    className="w-28 h-28 object-cover rounded-lg border border-gray-200 hover:ring-2 hover:ring-blue-400 transition"
                    onError={(e) => {
                      const t = e.currentTarget;
                      t.style.display = "none";
                      const fallback =
                        t.nextElementSibling as HTMLElement | null;
                      if (fallback) fallback.style.display = "block";
                    }}
                  />
                  <p className="text-xs text-gray-500 hidden">
                    Proof image unavailable. Please refresh or contact support.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenProof(order.uploadedPaymentProof!)}
                  className="text-sm text-blue-600 hover:underline font-medium"
                  data-ocid="orders.view_full_proof_button"
                >
                  View Full Proof
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No proof uploaded</p>
            )}
          </div>
          {/* Approve / Reject for pending verification orders */}
          {onVerify && order.status === "pendingPaymentVerification" && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-gray-400 mb-2 font-medium">
                Payment Verification
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onVerify(order, "approve");
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                  data-ocid="orders.detail_approve_button"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve Payment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onVerify(order, "reject");
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                  data-ocid="orders.detail_reject_button"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Payment
                </button>
              </div>
            </div>
          )}
          <div>
            <p className="text-gray-400 mb-2">Status History</p>
            <ul className="space-y-1">
              {order.statusHistory.map((h) => (
                <li
                  key={`${h.status}-${h.timestamp}`}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
                  <span className="font-medium">{STATUS_LABELS[h.status]}</span>
                  <span className="text-gray-400">
                    {new Date(h.timestamp).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReassignModal({
  order,
  onClose,
  onReassign,
}: {
  order: Order;
  onClose: () => void;
  onReassign: (orderId: string, adminName: string, reason: string) => void;
}) {
  const [newAdminName, setNewAdminName] = useState("");
  const [reason, setReason] = useState("");
  const AVAILABLE_ADMINS = [
    { id: "SRMAP01", name: "Ravi Kumar", college: "SRMAP" },
    { id: "SRMAP02", name: "Sita Devi", college: "SRMAP" },
    { id: "GITAM01", name: "Anjali Devi", college: "Gitam University" },
    { id: "GITAM02", name: "Praveen Nair", college: "Gitam University" },
    { id: "AU01", name: "Suresh Babu", college: "Andhra University" },
    { id: "KLU01", name: "Meena Dasi", college: "KL University" },
  ];
  const eligibleAdmins = AVAILABLE_ADMINS.filter(
    (a) => a.college === order.college && a.name !== order.acceptedByAdminName,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="presentation"
      />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10"
        data-ocid="orders.reassign_dialog"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100"
          data-ocid="orders.close_button"
        >
          ✕
        </button>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-gray-900">
            Force Reassign Order
          </h2>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <p className="text-xs text-amber-700">
            <span className="font-semibold">Current owner:</span>{" "}
            {order.acceptedByAdminName ?? "—"}
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            Reassigning will immediately revoke their editing rights.
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="reassign-admin"
              className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block"
            >
              Assign To *
            </label>
            <select
              id="reassign-admin"
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-ocid="orders.reassign_admin_select"
            >
              <option value="">Select admin...</option>
              {eligibleAdmins.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name} ({a.id})
                </option>
              ))}
              {eligibleAdmins.length === 0 && (
                <option value="manual">Enter manually below</option>
              )}
            </select>
          </div>
          {(newAdminName === "manual" || eligibleAdmins.length === 0) && (
            <div>
              <label
                htmlFor="reassign-manual"
                className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block"
              >
                Admin Name
              </label>
              <input
                id="reassign-manual"
                type="text"
                placeholder="Admin name..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setNewAdminName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label
              htmlFor="reassign-reason"
              className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block"
            >
              Reason *
            </label>
            <textarea
              id="reassign-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for reassignment (e.g. admin inactive, deadline risk)..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              data-ocid="orders.reassign_reason_textarea"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
            data-ocid="orders.cancel_button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (newAdminName && reason) {
                onReassign(order.id, newAdminName, reason);
                onClose();
              }
            }}
            disabled={!newAdminName || !reason}
            className="flex-1 py-2.5 text-sm font-medium bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50"
            data-ocid="orders.reassign_confirm_button"
          >
            Reassign Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Verify Payment Dialog ──────────────────────────────────────────────────
interface VerifyDialogState {
  order: Order;
  type: "approve" | "reject";
}

function VerifyPaymentDialog({
  state,
  onClose,
  onConfirm,
  loading,
}: {
  state: VerifyDialogState;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  loading: boolean;
}) {
  const [notes, setNotes] = useState("");
  const isApprove = state.type === "approve";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="presentation"
      />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10"
        data-ocid="orders.verify_payment_dialog"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100"
          data-ocid="orders.verify_close_button"
        >
          ✕
        </button>
        <div className="flex items-center gap-3 mb-4">
          {isApprove ? (
            <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
          ) : (
            <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
          )}
          <h2 className="text-lg font-bold text-gray-900">
            {isApprove ? "Approve Payment" : "Reject Payment"}
          </h2>
        </div>
        <div
          className={`rounded-xl p-3 mb-4 text-sm ${
            isApprove
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <p>
            <span className="font-semibold">Order:</span> #{state.order.id}
          </p>
          <p>
            <span className="font-semibold">Customer:</span>{" "}
            {state.order.customerName}
          </p>
          <p>
            <span className="font-semibold">Amount:</span> ₹{state.order.amount}
          </p>
        </div>
        <div>
          <label
            htmlFor="verify-notes"
            className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block"
          >
            {isApprove ? "Notes (optional)" : "Rejection Reason *"}
          </label>
          <textarea
            id="verify-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              isApprove
                ? "Add any notes for this approval..."
                : "Reason for rejection (e.g. blurry screenshot, wrong amount)..."
            }
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            data-ocid="orders.verify_notes_textarea"
          />
        </div>
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
            data-ocid="orders.verify_cancel_button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(notes)}
            disabled={loading || (!isApprove && !notes.trim())}
            className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-colors ${
              isApprove
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
            data-ocid="orders.verify_confirm_button"
          >
            {loading
              ? isApprove
                ? "Approving..."
                : "Rejecting..."
              : isApprove
                ? "Approve Payment"
                : "Reject Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCollege, setFilterCollege] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("assigned");
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [reassignOrder, setReassignOrder] = useState<Order | null>(null);

  const isHeadAdmin = user?.role === "headAdmin";
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const DELETABLE_STATUSES = ["completed", "delivered", "cancelled"];

  const canDeleteOrder = (order: Order) => {
    if (!DELETABLE_STATUSES.includes(order.status)) return false;
    if (isHeadAdmin) return true;
    return order.college === user?.college;
  };

  const handleDeleteAdminOrder = async (orderId: string) => {
    try {
      const result = await deleteOrder(
        orderId,
        user?.id ?? "",
        user?.role ?? "collegeAdmin",
      );
      if (!result.ok) {
        toast.error(result.error ?? "Failed to delete order.");
        return;
      }
    } catch {
      toast.error("Failed to delete order.");
      return;
    }
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setDeleteConfirmId(null);
    toast.success("Order deleted successfully.");
  };
  const { actor } = useActor(createActor);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [proofModal, setProofModal] = useState<string | null>(null);
  const [proofImgError, setProofImgError] = useState(false);
  const [verifyDialog, setVerifyDialog] = useState<VerifyDialogState | null>(
    null,
  );
  const [verifyLoading, setVerifyLoading] = useState(false);

  const openProof = (url: string) => {
    if (url.endsWith(".pdf") || url.startsWith("data:application/pdf")) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      setProofImgError(false);
      setProofModal(url);
    }
  };

  const closeProofModal = () => {
    setProofModal(null);
    setProofImgError(false);
  };

  const openVerifyDialog = (order: Order, type: "approve" | "reject") => {
    setVerifyDialog({ order, type });
  };

  const handleVerifyConfirm = async (notes: string) => {
    if (!verifyDialog) return;
    const { order, type } = verifyDialog;
    const txnId = order.transactionId ?? order.id;
    setVerifyLoading(true);
    try {
      await verifyPaymentManually(txnId, type === "approve", notes);
      if (type === "approve") {
        toast.success("Payment approved — order is now active!");
      } else {
        toast.error("Payment rejected — order has been cancelled.");
      }
      setVerifyDialog(null);
      // Refresh orders list
      const updated = await getOrders();
      setOrders(updated);
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const fetchData = useCallback(() => {
    Promise.all([getOrders(), getColleges()]).then(([o, c]) => {
      setOrders(o);
      setColleges(c);
      setLoading(false);
    });
  }, []);

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

  const filtered = orders.filter((o) => {
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    if (filterCollege !== "all" && o.college !== filterCollege) return false;
    if (
      search &&
      !o.id.toLowerCase().includes(search.toLowerCase()) &&
      !o.customerName.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(filtered.map((o) => o.id)));
  const clearAll = () => setSelected(new Set());

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    await updateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!actor || acceptingOrderId === orderId) return;
    const adminName = user?.name ?? "Current Admin";
    const adminId = user?.id ?? "admin_current";
    setAcceptingOrderId(orderId);
    try {
      const result = await actor.acceptOrder(orderId, adminName);
      if (result === false) {
        fetchData();
      } else {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  assignmentLockStatus: "locked" as const,
                  acceptedByAdminId: adminId,
                  acceptedByAdminName: adminName,
                  acceptedAt: Date.now(),
                  status: "assigned" as OrderStatus,
                }
              : o,
          ),
        );
      }
    } catch {
      // silent
    } finally {
      setAcceptingOrderId(null);
    }
  };

  const handleReassign = (
    orderId: string,
    newAdminName: string,
    reason: string,
  ) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              acceptedByAdminName: newAdminName,
              acceptedByAdminId: `admin_${newAdminName.toLowerCase().replace(/\s/g, "_")}`,
              acceptedAt: Date.now(),
              reassignmentLogs: [
                ...(o.reassignmentLogs ?? []),
                {
                  logId: `rl_${Date.now()}`,
                  orderId,
                  previousAdminId: o.acceptedByAdminId ?? "",
                  previousAdminName: o.acceptedByAdminName ?? "",
                  newAdminId: `admin_${newAdminName.toLowerCase().replace(/\s/g, "_")}`,
                  newAdminName,
                  reason,
                  reassignedBy: user?.name ?? "Database Administrator",
                  reassignedAt: Date.now(),
                },
              ],
            }
          : o,
      ),
    );
  };

  const applyBulkStatus = async () => {
    for (const id of selected) await handleStatusChange(id, bulkStatus);
    clearAll();
  };

  return (
    <AdminLayout pageTitle="Orders Management">
      {/* Filter bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-5 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by Order ID or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent"
            data-ocid="orders.search_input"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            data-ocid="orders.status_select"
          >
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
            value={filterCollege}
            onChange={(e) => setFilterCollege(e.target.value)}
            data-ocid="orders.college_select"
          >
            <option value="all">All Colleges</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div
          className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex flex-wrap items-center gap-3"
          data-ocid="orders.bulk_actions_panel"
        >
          <span className="text-sm font-medium text-blue-700">
            {selected.size} selected
          </span>
          <select
            className="text-sm border border-blue-300 rounded-lg px-3 py-1.5 bg-white"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
            data-ocid="orders.bulk_status_select"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={applyBulkStatus}
            className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            data-ocid="orders.bulk_apply_button"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="text-sm text-gray-500 hover:text-gray-700"
            data-ocid="orders.bulk_clear_button"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      e.target.checked ? selectAll() : clearAll()
                    }
                    className="rounded"
                  />
                </th>
                <th className="p-3 text-left font-semibold text-gray-600">
                  Order ID
                </th>
                <th className="p-3 text-left font-semibold text-gray-600">
                  Customer
                </th>
                <th className="p-3 text-left font-semibold text-gray-600 hidden sm:table-cell">
                  Phone
                </th>
                <th className="p-3 text-left font-semibold text-gray-600 hidden md:table-cell">
                  Service
                </th>
                <th className="p-3 text-left font-semibold text-gray-600 hidden lg:table-cell">
                  College
                </th>
                <th className="p-3 text-center font-semibold text-gray-600">
                  Proof
                </th>
                <th className="p-3 text-right font-semibold text-gray-600">
                  Price
                </th>
                <th className="p-3 text-center font-semibold text-gray-600">
                  Status
                </th>
                <th className="p-3 text-left font-semibold text-gray-600 hidden lg:table-cell">
                  Due Date
                </th>
                <th className="p-3 text-center font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loading rows
                  <tr key={`skeleton-row-${i}`}>
                    <td colSpan={10} className="p-3">
                      <div className="h-5 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="p-8 text-center text-gray-400"
                    data-ocid="orders.empty_state"
                  >
                    No orders found
                  </td>
                </tr>
              ) : (
                filtered.map((order, i) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50/60 transition-colors"
                    data-ocid={`orders.item.${i + 1}`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-3 font-mono font-semibold text-blue-600 text-xs">
                      {order.id}
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-gray-800">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {order.customerEmail}
                      </p>
                      {/* Show phone inline on xs screens where the Phone col is hidden */}
                      {order.customerPhone && (
                        <p className="text-xs text-gray-400 sm:hidden">
                          📞 {order.customerPhone}
                        </p>
                      )}
                    </td>
                    <td className="p-3 hidden sm:table-cell text-gray-600 text-xs whitespace-nowrap">
                      {order.customerPhone ?? (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="p-3 hidden md:table-cell text-gray-600">
                      {order.serviceType}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-gray-600">
                      {order.customCollege && order.customCollege.trim() !== ""
                        ? order.customCollege
                        : (order.college ?? "—")}
                    </td>
                    <td className="p-3 text-center">
                      {order.uploadedPaymentProof &&
                      isPdfProofUrl(order.uploadedPaymentProof) ? (
                        <div className="flex flex-col items-center gap-1">
                          <FileText className="h-7 w-7 text-red-400" />
                          <button
                            type="button"
                            onClick={() =>
                              openProof(order.uploadedPaymentProof!)
                            }
                            className="text-xs text-blue-600 hover:underline"
                            data-ocid={`orders.view_pdf_button.${i + 1}`}
                          >
                            View PDF
                          </button>
                        </div>
                      ) : isValidProofUrl(order.uploadedPaymentProof) ? (
                        <div className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              openProof(order.uploadedPaymentProof!)
                            }
                            className="p-0 border-0 bg-transparent cursor-pointer"
                            data-ocid={`orders.proof_thumb.${i + 1}`}
                          >
                            <img
                              src={order.uploadedPaymentProof}
                              alt="Proof"
                              className="w-10 h-10 object-cover rounded border border-gray-200 hover:ring-2 hover:ring-blue-400 transition"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              openProof(order.uploadedPaymentProof!)
                            }
                            className="text-xs text-blue-600 hover:underline"
                            data-ocid={`orders.view_proof_button.${i + 1}`}
                          >
                            View
                          </button>
                        </div>
                      ) : (
                        <span
                          className="text-gray-300 text-xs"
                          data-ocid={`orders.no_proof.${i + 1}`}
                        >
                          —
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-semibold text-gray-800">
                      ₹{order.amount}
                    </td>
                    <td className="p-3 text-center">
                      {/* Awaiting payment verification — Approve / Reject actions */}
                      {order.status === "pendingPaymentVerification" ||
                      (order as Order & { paymentStatus?: string })
                        .paymentStatus === "PENDING" ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="inline-block text-xs font-semibold rounded-full px-2 py-1 bg-amber-100 text-amber-800">
                            Awaiting Verification
                          </span>
                          <div className="flex flex-col sm:flex-row gap-1">
                            <button
                              type="button"
                              onClick={() => openVerifyDialog(order, "approve")}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
                              data-ocid={`orders.approve_payment_button.${i + 1}`}
                            >
                              <CheckCircle className="h-3 w-3" />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => openVerifyDialog(order, "reject")}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                              data-ocid={`orders.reject_payment_button.${i + 1}`}
                            >
                              <XCircle className="h-3 w-3" />
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : order.assignmentLockStatus === "locked" &&
                        order.acceptedByAdminId !== (user?.id ?? "") &&
                        !isHeadAdmin ? (
                        <div>
                          <span className="inline-block text-xs font-semibold rounded-full px-2 py-1 bg-gray-100 text-gray-600">
                            Order Taken
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">
                            By {order.acceptedByAdminName ?? "Admin"}
                          </p>
                        </div>
                      ) : (
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(
                              order.id,
                              e.target.value as OrderStatus,
                            )
                          }
                          className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer ${STATUS_COLORS[order.status]}`}
                          data-ocid={`orders.status_dropdown.${i + 1}`}
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-gray-500 text-xs">
                      {new Date(order.deadline).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewOrder(order)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                          data-ocid={`orders.view_button.${i + 1}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {/* Accept / lock status / reassign */}
                        {order.assignmentLockStatus === "unlocked" &&
                          !isHeadAdmin &&
                          order.status !== "pendingPaymentVerification" &&
                          (order as Order & { paymentStatus?: string })
                            .paymentStatus !== "PENDING" && (
                            <button
                              type="button"
                              onClick={() => handleAcceptOrder(order.id)}
                              disabled={acceptingOrderId === order.id}
                              className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap disabled:opacity-60"
                              data-ocid={`orders.accept_button.${i + 1}`}
                            >
                              {acceptingOrderId === order.id ? "..." : "Accept"}
                            </button>
                          )}
                        {order.assignmentLockStatus === "locked" &&
                          order.acceptedByAdminId !== (user?.id ?? "") &&
                          !isHeadAdmin && (
                            <span className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                              <Lock className="h-3 w-3" />
                              <span className="hidden lg:inline">Accepted</span>
                            </span>
                          )}
                        {order.assignmentLockStatus === "locked" &&
                          order.acceptedByAdminId === (user?.id ?? "") && (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 whitespace-nowrap">
                              <UserCheck className="h-3 w-3" /> Yours
                            </span>
                          )}
                        {isHeadAdmin &&
                          order.assignmentLockStatus === "locked" && (
                            <button
                              type="button"
                              onClick={() => setReassignOrder(order)}
                              className="px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 whitespace-nowrap"
                              data-ocid={`orders.reassign_button.${i + 1}`}
                            >
                              Reassign
                            </button>
                          )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {canDeleteOrder(order) && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(order.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          title="Delete order"
                          data-ocid={`orders.delete_button.${i + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewOrder && (
        <OrderDetailModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onOpenProof={openProof}
          onVerify={(order, type) => {
            setViewOrder(null);
            openVerifyDialog(order, type);
          }}
        />
      )}

      {/* Proof lightbox */}
      {proofModal && (
        <dialog
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 w-full h-full max-w-none max-h-none m-0 p-0 border-0 open:flex"
          onClick={closeProofModal}
          onKeyDown={(e) => e.key === "Escape" && closeProofModal()}
          aria-label="Payment proof viewer"
          open
          data-ocid="orders.proof_lightbox"
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <button
              type="button"
              onClick={closeProofModal}
              className="absolute -top-10 right-0 text-white text-2xl font-bold hover:text-gray-300 transition"
              aria-label="Close proof viewer"
              data-ocid="orders.proof_close_button"
            >
              ✕
            </button>
            {proofImgError ? (
              <div className="bg-white rounded-xl p-8 text-center space-y-3">
                <p className="text-gray-700 font-semibold">
                  Proof image unavailable.
                </p>
                <p className="text-gray-500 text-sm">
                  Please refresh or contact support.
                </p>
              </div>
            ) : (
              <img
                src={proofModal}
                alt="Payment proof full view"
                className="max-w-[90vw] max-h-[85vh] rounded-xl shadow-2xl object-contain"
                onError={() => setProofImgError(true)}
                data-ocid="orders.proof_full_image"
              />
            )}
          </div>
        </dialog>
      )}

      {reassignOrder && (
        <ReassignModal
          order={reassignOrder}
          onClose={() => setReassignOrder(null)}
          onReassign={handleReassign}
        />
      )}

      {verifyDialog && (
        <VerifyPaymentDialog
          state={verifyDialog}
          onClose={() => !verifyLoading && setVerifyDialog(null)}
          onConfirm={handleVerifyConfirm}
          loading={verifyLoading}
        />
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
            onKeyDown={(e) => e.key === "Escape" && setDeleteConfirmId(null)}
            role="presentation"
          />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10"
            data-ocid="orders.delete_dialog"
          >
            <h2 className="text-base font-bold text-gray-900 mb-2">
              Delete Order
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to delete this item? This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
                data-ocid="orders.delete_cancel_button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAdminOrder(deleteConfirmId)}
                className="flex-1 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700"
                data-ocid="orders.delete_confirm_button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
