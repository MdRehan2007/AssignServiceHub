import { generateAndDownloadReport } from "@/utils/pdfExport";
import {
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Image,
  Loader2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface PaymentRecord {
  paymentId: string;
  transactionId: string;
  orderId: string;
  customerId: string;
  amount: number;
  paymentMethod: "Scanner" | "UPI" | string;
  status:
    | "Verified"
    | "Pending"
    | "Processing"
    | "Failed"
    | "ManualVerificationRequired"
    | "Cancelled"
    | string;
  transactionState?: string;
  timestamp: number;
  verifiedAt?: number | null;
  failureReason?: string | null;
  screenshotKey?: string | null;
}

interface PaymentHistoryPanelProps {
  orderId: string;
  customerName: string;
  college: string;
  serviceType: string;
  fetchPayments: (orderId: string) => Promise<PaymentRecord[]>;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  Verified: {
    label: "Verified",
    className: "bg-green-100 text-green-700 border border-green-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  Pending: {
    label: "Pending Verification",
    className: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    icon: <Clock className="h-3 w-3" />,
  },
  Processing: {
    label: "Processing",
    className: "bg-blue-100 text-blue-700 border border-blue-200",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  Failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700 border border-red-200",
    icon: <XCircle className="h-3 w-3" />,
  },
  ManualVerificationRequired: {
    label: "Manual Review",
    className: "bg-orange-100 text-orange-700 border border-orange-200",
    icon: <Clock className="h-3 w-3" />,
  },
  Cancelled: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-500 border border-gray-200",
    icon: <XCircle className="h-3 w-3" />,
  },
};

function getStatusConfig(status: string) {
  return (
    STATUS_CONFIG[status] ?? {
      label: status,
      className: "bg-gray-100 text-gray-600 border border-gray-200",
      icon: <Clock className="h-3 w-3" />,
    }
  );
}

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function TxnId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const short = id.length > 20 ? `${id.slice(0, 10)}…${id.slice(-6)}` : id;
  const handleCopy = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <span className="font-mono text-xs text-blue-700 truncate" title={id}>
        {short}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy transaction ID"
        className="flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors"
        data-ocid="payment_history.copy_txnid"
      >
        {copied ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </span>
  );
}

function MethodBadge({ method }: { method: string }) {
  const isScanner = method === "Scanner" || method === "qr";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
        isScanner
          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
          : "bg-sky-50 text-sky-700 border-sky-200"
      }`}
    >
      {isScanner ? "📷 Scanner" : "💳 UPI ID"}
    </span>
  );
}

export function PaymentHistoryPanel({
  orderId,
  customerName,
  college,
  serviceType,
  fetchPayments,
}: PaymentHistoryPanelProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchPayments(orderId);
      setPayments(data);
    } finally {
      setLoading(false);
    }
  }, [fetchPayments, orderId]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh every 10s if latest payment is Pending or Processing
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const latest = payments[0];
    if (
      latest &&
      (latest.status === "Pending" || latest.status === "Processing")
    ) {
      intervalRef.current = setInterval(load, 10000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [payments, load]);

  const handleDownloadReceipt = (p: PaymentRecord) => {
    generateAndDownloadReport(
      "Payment Receipt",
      `receipt_${p.transactionId}`,
      ["Field", "Value"],
      [
        ["Transaction ID", p.transactionId],
        ["Order ID", p.orderId],
        ["Customer Name", customerName],
        ["College", college],
        ["Service Type", serviceType],
        ["Amount", `₹${p.amount}`],
        ["Payment Method", p.paymentMethod],
        ["Status", "Verified ✓"],
        ["Verified At", p.verifiedAt ? formatDateTime(p.verifiedAt) : "—"],
        ["Payment Date", formatDateTime(p.timestamp)],
      ],
      [
        { label: "Order ID", value: p.orderId },
        { label: "Amount Paid", value: `₹${p.amount}` },
        { label: "Status", value: "VERIFIED" },
      ],
    );
  };

  return (
    <div className="card p-5" data-ocid="payment_history.panel">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="h-4 w-4 text-blue-600 flex-shrink-0">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-label="Payment History"
            role="img"
          >
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </span>
        Payment History
      </h3>

      {loading ? (
        <div
          className="flex items-center gap-2 text-sm text-gray-400 py-6 justify-center"
          data-ocid="payment_history.loading_state"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading payment history…
        </div>
      ) : payments.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-10 text-gray-400"
          data-ocid="payment_history.empty_state"
        >
          <Clock className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-sm font-medium">No payment history yet.</p>
          <p className="text-xs mt-0.5">Payment attempts will appear here.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    "Transaction ID",
                    "Method",
                    "Amount",
                    "Status",
                    "Date & Time",
                    "Proof",
                    "Receipt",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p, i) => {
                  const sc = getStatusConfig(p.status);
                  return (
                    <tr
                      key={p.paymentId}
                      className="hover:bg-blue-50/40 transition-colors"
                      data-ocid={`payment_history.item.${i + 1}`}
                    >
                      <td className="px-3 py-3 max-w-[180px]">
                        <TxnId id={p.transactionId} />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <MethodBadge method={p.paymentMethod} />
                      </td>
                      <td className="px-3 py-3 font-semibold text-gray-800 whitespace-nowrap">
                        ₹{p.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.className}`}
                        >
                          {sc.icon}
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDateTime(p.timestamp)}
                      </td>
                      <td className="px-3 py-3">
                        {p.screenshotKey ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                            <Image className="h-3.5 w-3.5" /> Uploaded
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {p.status === "Verified" ? (
                          <button
                            type="button"
                            onClick={() => handleDownloadReceipt(p)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                            data-ocid={`payment_history.download_receipt.${i + 1}`}
                          >
                            <Download className="h-3.5 w-3.5" /> Receipt
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="sm:hidden space-y-3">
            {payments.map((p, i) => {
              const sc = getStatusConfig(p.status);
              return (
                <div
                  key={p.paymentId}
                  className="rounded-xl border border-gray-100 bg-blue-50/30 p-3.5 space-y-2.5"
                  data-ocid={`payment_history.mobile_item.${i + 1}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <TxnId id={p.transactionId} />
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${sc.className}`}
                    >
                      {sc.icon}
                      {sc.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className="text-gray-500">
                      Method: <MethodBadge method={p.paymentMethod} />
                    </span>
                    <span className="font-semibold text-gray-800">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-gray-400">
                      {formatDateTime(p.timestamp)}
                    </span>
                    <div className="flex items-center gap-3">
                      {p.screenshotKey ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                          <Image className="h-3.5 w-3.5" /> Proof Uploaded
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No proof</span>
                      )}
                      {p.status === "Verified" && (
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(p)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                          data-ocid={`payment_history.mobile_download.${i + 1}`}
                        >
                          <Download className="h-3.5 w-3.5" /> Receipt
                        </button>
                      )}
                    </div>
                  </div>
                  {p.failureReason && (
                    <p className="text-xs text-red-500 bg-red-50 rounded px-2 py-1">
                      ⚠ {p.failureReason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
