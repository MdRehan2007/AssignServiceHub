import PaymentModal from "@/components/customer/PaymentModal";
import VerifiedBadge from "@/components/shared/VerifiedBadge";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { getOrders, getPayments, getSystemSettings } from "@/services/api";
import type { Order, Payment, SystemSettings } from "@/types";
import { generateAndDownloadReport } from "@/utils/pdfExport";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  File as FileIcon,
  QrCode,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  submitted: "bg-blue-100 text-blue-700",
  verified: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export function PaymentsPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      getPayments("cust_1"),
      getOrders("cust_1"),
      getSystemSettings(),
    ]).then(([p, o, s]) => {
      setPayments(p);
      setOrders(o);
      setSettings(s);
      setLoading(false);

      // URL-based auto-open payment modal
      const searchParams = new URLSearchParams(window.location.search);
      const urlOrderId = searchParams.get("orderId");
      if (urlOrderId) {
        const targetOrder = o.find((order) => order.id === urlOrderId);
        if (targetOrder && targetOrder.paymentStatus !== "verified") {
          setSelectedOrder(targetOrder);
        }
      }
    });
  }, []);

  const verified = payments.filter((p) => p.status === "verified");
  const pending = payments.filter(
    (p) => p.status === "pending_payment" || p.status === "failed",
  );
  const totalPaid = verified.reduce((a, p) => a + p.amount, 0);
  const totalPending = pending.reduce((a, p) => a + p.amount, 0);

  const handleProofUpload = async () => {
    if (!proofFile) return;
    setUploading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setUploading(false);
    setProofFile(null);
    navigate({ to: "/customer/tracking" });
  };

  return (
    <CustomerLayout pageTitle="Payments">
      <div className="space-y-6 animate-fadeIn pb-8">
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="stat-card flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Total Paid
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{totalPaid.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">
                {verified.length} transaction{verified.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="stat-card flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Pending Amount
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{totalPending.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">
                {pending.length} awaiting payment
              </p>
            </div>
          </div>
        </div>

        {/* Payment history */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Payment History</h3>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-50 rounded animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Order ID",
                      "Date",
                      "Amount",
                      "Method",
                      "Status",
                      "Receipt",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map((p, i) => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50"
                      data-ocid={`payments.item.${i + 1}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">
                        {p.orderId}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {p.submittedAt
                          ? new Date(p.submittedAt).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        ₹{p.amount}
                      </td>
                      <td className="px-4 py-3 text-gray-600 uppercase text-xs">
                        {p.method}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`status-badge text-xs ${STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        </span>
                        {p.status === "verified" && (
                          <span className="ml-2 inline-block align-middle">
                            <VerifiedBadge size="sm" showText={false} />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {p.status === "verified" ? (
                            <button
                              type="button"
                              onClick={() =>
                                generateAndDownloadReport(
                                  "Payment Receipt",
                                  "payment_receipt",
                                  ["Field", "Value"],
                                  [
                                    ["Order ID", p.orderId],
                                    ["Amount", `₹${p.amount}`],
                                    ["Payment Method", p.method],
                                    [
                                      "Transaction ID",
                                      (p as unknown as Record<string, string>)
                                        .transactionId || "N/A",
                                    ],
                                    ["Payment Status", p.status],
                                    [
                                      "Date",
                                      new Date(
                                        (p as unknown as Record<string, string>)
                                          .submittedAt || Date.now(),
                                      ).toLocaleString("en-IN"),
                                    ],
                                  ],
                                  [
                                    { label: "Order ID", value: p.orderId },
                                    {
                                      label: "Amount Paid",
                                      value: `₹${p.amount}`,
                                    },
                                    {
                                      label: "Status",
                                      value: p.status.toUpperCase(),
                                    },
                                  ],
                                )
                              }
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              data-ocid={`payments.receipt_button.${i + 1}`}
                            >
                              <Download className="h-3.5 w-3.5" /> Receipt
                            </button>
                          ) : (
                            "—"
                          )}
                          {(p.status === "pending_payment" ||
                            p.status === "failed") && (
                            <button
                              type="button"
                              onClick={() => {
                                const targetOrder = orders.find(
                                  (o) => o.id === p.orderId,
                                );
                                if (targetOrder) setSelectedOrder(targetOrder);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                              data-ocid={`payments.pay_now_button.${i + 1}`}
                            >
                              Pay Now
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <QrCode className="h-4 w-4 text-blue-600" /> Payment Details
            </h3>
            <div className="flex flex-col items-center gap-4">
              <div className="h-40 w-40 border-2 border-gray-200 rounded-xl flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <QrCode className="h-16 w-16 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-400 mt-1">QR Code</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  UPI ID
                </p>
                <p className="font-mono font-bold text-gray-900 mt-1">
                  {settings?.upiId ?? "9493442754@fam"}
                </p>
              </div>
              <div className="w-full bg-blue-50 rounded-lg p-3 text-xs text-blue-700 text-center">
                Pay to the above UPI ID and upload screenshot as proof.
              </div>
            </div>
          </div>

          {/* Upload proof */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-blue-600" /> Upload Payment
              Proof
            </h3>
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Upload payment proof"
                className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-gray-50 transition-all"
                data-ocid="payments.proof_dropzone"
              >
                <UploadCloud className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">
                  Click to upload screenshot
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG, PDF supported
                </p>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                className="hidden"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              />
              {proofFile && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <FileIcon className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-700 flex-1 truncate">
                    {proofFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setProofFile(null)}
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={handleProofUpload}
                disabled={!proofFile || uploading}
                className="btn-primary w-full mt-4 disabled:opacity-50"
                data-ocid="payments.upload_button"
              >
                {uploading ? "Uploading..." : "Submit Proof"}
              </button>
            </>
          </div>
        </div>
      </div>
      {selectedOrder && (
        <PaymentModal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          orderId={selectedOrder?.id ?? ""}
          onSuccess={(_txId: string) => {
            setSelectedOrder(null);
            navigate({ to: "/customer/tracking" });
          }}
        />
      )}
    </CustomerLayout>
  );
}
