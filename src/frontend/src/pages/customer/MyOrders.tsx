import { ProofImageModal } from "@/components/shared/ProofImageModal";
import { useAuth } from "@/hooks/useAuth";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { deleteOrder, getOrders } from "@/services/api";
import type { Order, OrderStatus } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle,
  ChevronDown,
  Eye,
  Package,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-700 border-amber-200",
  payment_verification: "bg-yellow-100 text-yellow-700 border-yellow-200",
  pendingPaymentVerification: "bg-amber-100 text-amber-700 border-amber-200",
  assigned: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-indigo-100 text-indigo-700 border-indigo-200",
  review: "bg-purple-100 text-purple-700 border-purple-200",
  correction: "bg-orange-100 text-orange-700 border-orange-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
  verified: "bg-green-100 text-green-700 border-green-200",
  VERIFIED: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  failed: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending Payment",
  payment_verification: "Verifying",
  pendingPaymentVerification: "Awaiting Verification",
  assigned: "Assigned",
  in_progress: "In Progress",
  review: "Under Review",
  correction: "Correction",
  completed: "Completed",
  delivered: "Delivered",
  closed: "Closed",
  verified: "Payment Verified",
  VERIFIED: "Payment Verified",
  rejected: "Payment Rejected",
  failed: "Payment Failed",
};

const SERVICE_LABELS: Record<string, string> = {
  SoftCopy: "Soft Copy",
  HardCopy: "Hard Copy",
  RecordWriting: "Record Writing",
  NotesWriting: "Notes Writing",
};

const ALL_STATUSES: OrderStatus[] = [
  "pending_payment",
  "payment_verification",
  "assigned",
  "in_progress",
  "review",
  "correction",
  "completed",
  "delivered",
  "closed",
];

/** Small proof thumbnail with loading + error state */
function ProofThumb({
  url,
  onClick,
  ocid,
}: {
  url: string;
  onClick: () => void;
  ocid: string;
}) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return <span className="text-gray-400 text-xs">No proof</span>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-0 border-0 bg-transparent cursor-pointer"
      data-ocid={ocid}
    >
      <img
        src={url}
        alt="Payment proof"
        className="w-10 h-10 object-cover rounded border border-gray-200 hover:ring-2 hover:ring-blue-400 transition"
        onError={() => setErrored(true)}
      />
    </button>
  );
}

export function MyOrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const DELETABLE_STATUSES = ["completed", "delivered", "cancelled"];

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const result = await deleteOrder(
        orderId,
        user?.id ?? "",
        user?.role ?? "customer",
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

  useEffect(() => {
    getOrders().then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.subjectName.toLowerCase().includes(q) ||
      (o.college ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <CustomerLayout pageTitle="My Orders">
      <div className="space-y-5 animate-fadeIn pb-8">
        {/* Filters */}
        <div className="card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID, subject or college..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
              data-ocid="orders.search_input"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field pr-9 appearance-none"
              data-ocid="orders.status_filter"
            >
              <option value="all">All Statuses</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-50 rounded animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-gray-400"
              data-ocid="orders.empty_state"
            >
              <Package className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No orders found</p>
              <p className="text-sm mt-1">
                Try adjusting your search or filter
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {[
                      "Order ID",
                      "Service",
                      "Subject",
                      "College",
                      "Due Date",
                      "Amount",
                      "Proof",
                      "Status",
                      "Action",
                      "Delete",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((order, i) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors"
                      data-ocid={`orders.item.${i + 1}`}
                    >
                      <td className="px-4 py-3 font-mono text-blue-600 text-xs sm:text-sm font-semibold">
                        {order.id}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs sm:text-sm whitespace-nowrap">
                        {SERVICE_LABELS[order.serviceType] ?? order.serviceType}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs sm:text-sm max-w-[140px] truncate">
                        {order.subjectName}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs sm:text-sm whitespace-nowrap">
                        {order.college ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs sm:text-sm whitespace-nowrap">
                        {new Date(order.deadline).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 text-xs sm:text-sm">
                        ₹{order.amount}
                      </td>
                      <td className="px-4 py-3">
                        {order.uploadedPaymentProof &&
                        (order.uploadedPaymentProof.startsWith("http") ||
                          order.uploadedPaymentProof.startsWith(
                            "data:image/",
                          )) ? (
                          <ProofThumb
                            url={order.uploadedPaymentProof}
                            onClick={() =>
                              setProofModalUrl(order.uploadedPaymentProof!)
                            }
                            ocid={`orders.proof_thumb.${i + 1}`}
                          />
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`status-badge border text-xs sm:text-sm inline-flex items-center gap-1 ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
                          >
                            {(order.paymentStatus === "VERIFIED" ||
                              order.paymentStatus === "verified") && (
                              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                            )}
                            {STATUS_LABELS[order.status] ?? order.status}
                          </span>
                          {(order.paymentStatus === "FAILED" ||
                            order.paymentStatus === "failed") && (
                            <span className="text-[11px] text-red-600 font-medium leading-tight">
                              Payment verification failed. Please upload valid
                              proof again.
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => navigate({ to: "/customer/tracking" })}
                          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                          data-ocid={`orders.view_button.${i + 1}`}
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {DELETABLE_STATUSES.includes(order.status) && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(order.id)}
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                            data-ocid={`orders.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {proofModalUrl && (
          <ProofImageModal
            imageUrl={proofModalUrl}
            onClose={() => setProofModalUrl(null)}
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
                  data-ocid="orders.cancel_button"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteOrder(deleteConfirmId)}
                  className="flex-1 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700"
                  data-ocid="orders.confirm_button"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 text-right">
          {filtered.length} order{filtered.length !== 1 ? "s" : ""} shown
        </p>
      </div>
    </CustomerLayout>
  );
}
