import {
  getMyCollegePaymentVerifications,
  getPaymentVerifications,
  verifyPaymentManually,
} from "@/services/api";
import type { PaymentVerification } from "@/types";
import { AlertCircle, CheckCircle, Clock, Eye, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  role: "headAdmin" | "collegeAdmin";
  highlightTxnId?: string;
}
function isValidProofUrl(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:image/")
  );
}

export function PaymentVerificationPanel({ role, highlightTxnId }: Props) {
  const [verifications, setVerifications] = useState<PaymentVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [approveDialog, setApproveDialog] =
    useState<PaymentVerification | null>(null);
  const [rejectDialog, setRejectDialog] = useState<PaymentVerification | null>(
    null,
  );
  const [proofModal, setProofModal] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const highlightRef = useRef<HTMLTableRowElement>(null);
  const [proofImgError, setProofImgError] = useState(false);

  const openProof = (url: string) => {
    if (
      !isValidProofUrl(url) &&
      !url.endsWith(".pdf") &&
      !url.startsWith("data:application/pdf")
    ) {
      return;
    }
    const isPdf =
      url.endsWith(".pdf") || url.startsWith("data:application/pdf");
    if (isPdf) {
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

  const loadVerifications = () => {
    const fn =
      role === "headAdmin"
        ? getPaymentVerifications
        : getMyCollegePaymentVerifications;
    fn().then((data) => {
      setVerifications(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    const fn =
      role === "headAdmin"
        ? getPaymentVerifications
        : getMyCollegePaymentVerifications;
    fn().then((data) => {
      setVerifications(data);
      setLoading(false);
    });
  }, [role]);

  useEffect(() => {
    if (highlightTxnId && highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightTxnId]);

  const handleApprove = async () => {
    if (!approveDialog) return;
    setActionLoading(true);
    await verifyPaymentManually(approveDialog.transactionId, true, notes);
    toast.success("Payment approved successfully!");
    setApproveDialog(null);
    setNotes("");
    setActionLoading(false);
    loadVerifications();
  };

  const handleReject = async () => {
    if (!rejectDialog || !reason.trim()) return;
    setActionLoading(true);
    await verifyPaymentManually(rejectDialog.transactionId, false, reason);
    toast.error("Payment rejected.");
    setRejectDialog(null);
    setReason("");
    setActionLoading(false);
    loadVerifications();
  };

  const pending = verifications.filter(
    (v) => v.status === "pending" || v.status === "PendingVerification",
  );
  const resolved = verifications.filter(
    (v) => v.status !== "pending" && v.status !== "PendingVerification",
  );

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
          <Clock className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Payment Verifications
          </h2>
          <p className="text-xs text-gray-400">
            {pending.length} pending review
          </p>
        </div>
        <button
          type="button"
          onClick={loadVerifications}
          className="ml-auto text-xs text-blue-600 hover:underline"
          data-ocid="payment_verif.refresh_button"
        >
          Refresh
        </button>
      </div>

      {/* Pending table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-amber-50">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
            Awaiting Verification
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                  Order ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">
                  College
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 hidden sm:table-cell">
                  Method
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 hidden lg:table-cell">
                  Submitted
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">
                  Proof
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows
                  <tr key={`skel-${i}`}>
                    <td colSpan={8} className="px-4 py-3">
                      <div className="h-5 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : pending.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center"
                    data-ocid="payment_verif.empty_state"
                  >
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <CheckCircle className="h-8 w-8 opacity-30" />
                      <p className="text-sm font-medium">
                        No pending verifications
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pending.map((v, i) => {
                  const isHighlighted = v.transactionId === highlightTxnId;
                  return (
                    <tr
                      key={v.transactionId}
                      ref={isHighlighted ? highlightRef : undefined}
                      className={`transition-colors ${
                        isHighlighted
                          ? "bg-amber-50 ring-2 ring-inset ring-amber-400"
                          : "hover:bg-gray-50/60"
                      }`}
                      data-ocid={`payment_verif.item.${i + 1}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 text-xs">
                          {v.customerName}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-blue-600 text-xs">
                        {v.orderId}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                        {v.college}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                          {v.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800 text-xs">
                        ₹{v.amount}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                        {new Date(v.submittedAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isValidProofUrl(v.screenshotUrl) ? (
                          <button
                            type="button"
                            onClick={() => openProof(v.screenshotUrl!)}
                            className="inline-flex flex-col items-center gap-1 group"
                            data-ocid={`payment_verif.view_proof_button.${i + 1}`}
                          >
                            <img
                              src={v.screenshotUrl}
                              alt="Payment proof thumbnail"
                              className="w-12 h-12 rounded-md object-cover border border-gray-200 group-hover:ring-2 group-hover:ring-blue-400 transition-all"
                              onError={(e) => {
                                const img = e.currentTarget;
                                img.style.display = "none";
                                const fallback =
                                  img.nextElementSibling as HTMLElement | null;
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                            <span className="hidden items-center justify-center w-12 h-12 rounded-md bg-gray-100 text-[9px] text-gray-500 text-center leading-tight p-1">
                              Unavailable
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-semibold group-hover:text-blue-800">
                              <Eye className="h-3 w-3" /> View
                            </span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            No proof
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setApproveDialog(v);
                              setNotes("");
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors"
                            data-ocid={`payment_verif.approve_button.${i + 1}`}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectDialog(v);
                              setReason("");
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors"
                            data-ocid={`payment_verif.reject_button.${i + 1}`}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent resolved */}
      {resolved.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Recently Resolved
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">
                    Customer
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">
                    Amount
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500">
                    Proof
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {resolved.slice(0, 5).map((v, i) => (
                  <tr
                    key={v.transactionId}
                    className="hover:bg-gray-50/50"
                    data-ocid={`payment_verif.resolved_item.${i + 1}`}
                  >
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-medium text-gray-700">
                        {v.customerName}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {v.orderId}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold text-gray-800">
                      ₹{v.amount}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {isValidProofUrl(v.screenshotUrl) ? (
                        <button
                          type="button"
                          onClick={() => openProof(v.screenshotUrl!)}
                          className="inline-flex flex-col items-center gap-1 group"
                          data-ocid={`payment_verif.resolved_view_proof_button.${i + 1}`}
                        >
                          <img
                            src={v.screenshotUrl}
                            alt="Payment proof thumbnail"
                            className="w-12 h-12 rounded-md object-cover border border-gray-200 group-hover:ring-2 group-hover:ring-blue-400 transition-all"
                            onError={(e) => {
                              const img = e.currentTarget;
                              img.style.display = "none";
                              const fallback =
                                img.nextElementSibling as HTMLElement | null;
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                          <span className="hidden items-center justify-center w-12 h-12 rounded-md bg-gray-100 text-[9px] text-gray-500 text-center leading-tight p-1">
                            Unavailable
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-semibold group-hover:text-blue-800">
                            <Eye className="h-3 w-3" /> View
                          </span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          No proof
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {v.status === "verified" || v.status === "Verified" ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 rounded-full px-2 py-0.5 font-semibold">
                          <CheckCircle className="h-3 w-3" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 rounded-full px-2 py-0.5 font-semibold">
                          <XCircle className="h-3 w-3" /> Rejected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approve dialog */}
      {approveDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          data-ocid="payment_verif.approve_dialog"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !actionLoading && setApproveDialog(null)}
            onKeyDown={(e) =>
              e.key === "Escape" && !actionLoading && setApproveDialog(null)
            }
            role="presentation"
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Approve Payment</h3>
                <p className="text-xs text-gray-400">
                  Order {approveDialog.orderId} — ₹{approveDialog.amount}
                </p>
              </div>
            </div>
            <label
              htmlFor="approve-notes"
              className="text-xs font-semibold text-gray-600 block mb-1.5"
            >
              Notes (optional)
            </label>
            <textarea
              id="approve-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any review notes..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              data-ocid="payment_verif.approve_notes_textarea"
            />
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setApproveDialog(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
                data-ocid="payment_verif.cancel_button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 py-2.5 text-sm font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
                data-ocid="payment_verif.confirm_button"
              >
                {actionLoading ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject dialog */}
      {rejectDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          data-ocid="payment_verif.reject_dialog"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !actionLoading && setRejectDialog(null)}
            onKeyDown={(e) =>
              e.key === "Escape" && !actionLoading && setRejectDialog(null)
            }
            role="presentation"
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Reject Payment</h3>
                <p className="text-xs text-gray-400">
                  Order {rejectDialog.orderId} — ₹{rejectDialog.amount}
                </p>
              </div>
            </div>
            <label
              htmlFor="reject-reason"
              className="text-xs font-semibold text-gray-600 block mb-1.5"
            >
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reject-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the reason for rejection..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              data-ocid="payment_verif.reject_reason_textarea"
            />
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setRejectDialog(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
                data-ocid="payment_verif.cancel_button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading || !reason.trim()}
                className="flex-1 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50"
                data-ocid="payment_verif.confirm_button"
              >
                {actionLoading ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof image modal */}
      {proofModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          data-ocid="payment_verif.proof_dialog"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeProofModal}
            onKeyDown={(e) => e.key === "Escape" && closeProofModal()}
            role="presentation"
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-4 z-10 max-w-lg w-full">
            <button
              type="button"
              onClick={closeProofModal}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              data-ocid="payment_verif.close_button"
            >
              ✕
            </button>
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">
              Payment Screenshot Proof
            </h3>
            {proofImgError ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-400">
                <p className="text-sm font-semibold text-gray-700">
                  Proof image unavailable.
                </p>
                <p className="text-xs text-gray-500">
                  Please refresh or contact support.
                </p>
              </div>
            ) : (
              <img
                src={proofModal}
                alt="Payment proof"
                className="w-full rounded-xl max-h-[60vh] object-contain border border-gray-200"
                onError={() => setProofImgError(true)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
