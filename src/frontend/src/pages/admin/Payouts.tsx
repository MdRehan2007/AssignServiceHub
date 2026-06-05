import { AdminLayout } from "@/layouts/AdminLayout";
import { getColleges } from "@/services/api";
import type { College } from "@/types";
import {
  CheckCircle,
  Clock,
  DollarSign,
  Filter,
  Search,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface PayoutRecord {
  id: string;
  name: string;
  adminId: string;
  college: string;
  completedOrders: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  upi: string;
  lastPayout: string;
  status: "paid" | "pending";
}

// No initial payouts — populated from real backend data only
const INITIAL_PAYOUTS: PayoutRecord[] = [];

type SortKey =
  | "pendingAmount"
  | "totalAmount"
  | "lastPayout"
  | "completedOrders";

function SettleModal({
  record,
  onClose,
  onSettle,
}: {
  record: PayoutRecord;
  onClose: () => void;
  onSettle: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        tabIndex={-1}
        aria-hidden="true"
      />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10"
        data-ocid="payouts.settle_dialog"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100"
          data-ocid="payouts.close_button"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            {record.name[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{record.name}</p>
            <p className="text-xs text-gray-400">
              {record.adminId} · {record.college}
            </p>
            <p className="text-xs text-gray-400">{record.upi}</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Pending Amount</span>
            <span className="font-bold text-red-600">
              ₹{record.pendingAmount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Paid So Far</span>
            <span className="font-medium text-emerald-600">
              ₹{record.paidAmount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Completed Orders</span>
            <span className="font-medium text-gray-800">
              {record.completedOrders}
            </span>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5">
          <p className="text-sm font-semibold text-blue-700">
            Pay ₹{record.pendingAmount.toLocaleString()} to:
          </p>
          <p className="text-sm text-blue-600 font-mono mt-1">{record.upi}</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
            data-ocid="payouts.cancel_button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSettle(record.id);
              onClose();
            }}
            className="flex-1 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            data-ocid="payouts.confirm_button"
          >
            Mark as Settled
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminPayouts() {
  const [payouts, setPayouts] = useState<PayoutRecord[]>(INITIAL_PAYOUTS);
  // Note: in production this would load from backend via actor.getAdminPayouts()
  const [colleges, setColleges] = useState<College[]>([]);
  const [search, setSearch] = useState("");
  const [filterCollege, setFilterCollege] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("pendingAmount");
  const [settleRecord, setSettleRecord] = useState<PayoutRecord | null>(null);

  useEffect(() => {
    getColleges().then(setColleges);
  }, []);

  const handleSettle = (id: string) => {
    const today = new Date().toISOString().split("T")[0];
    setPayouts((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              paidAmount: r.totalAmount,
              pendingAmount: 0,
              lastPayout: today,
              status: "paid" as const,
            }
          : r,
      ),
    );
  };

  const displayed = payouts
    .filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.adminId.toLowerCase().includes(search.toLowerCase()) ||
        r.college.toLowerCase().includes(search.toLowerCase());
      const matchCollege =
        filterCollege === "all" || r.college === filterCollege;
      return matchSearch && matchCollege;
    })
    .sort((a, b) =>
      sortKey === "lastPayout"
        ? b.lastPayout.localeCompare(a.lastPayout)
        : b[sortKey] - a[sortKey],
    );

  const totalPending = payouts.reduce((s, r) => s + r.pendingAmount, 0);
  const totalPaid = payouts.reduce((s, r) => s + r.paidAmount, 0);
  const totalSettled = payouts.filter((r) => r.pendingAmount === 0).length;

  const uniqueColleges = [...new Set(payouts.map((r) => r.college))];

  return (
    <AdminLayout pageTitle="Admin Payouts">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">
              ₹{totalPaid.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">Total Paid</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="h-10 w-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">
              ₹{totalPending.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">Pending Settlement</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{totalSettled}</p>
            <p className="text-xs text-gray-400">Fully Settled</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-48 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, admin ID, or college..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent outline-none"
              data-ocid="payouts.search_input"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
              value={filterCollege}
              onChange={(e) => setFilterCollege(e.target.value)}
              data-ocid="payouts.college_filter_select"
            >
              <option value="all">All Colleges</option>
              {uniqueColleges.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              {colleges
                .filter((c) => !uniqueColleges.includes(c.name))
                .map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
            </select>
            <select
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              data-ocid="payouts.sort_select"
            >
              <option value="pendingAmount">Sort by Pending</option>
              <option value="totalAmount">Sort by Total</option>
              <option value="lastPayout">Sort by Date</option>
              <option value="completedOrders">Sort by Orders</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-3 text-left font-semibold text-gray-600">
                  Admin
                </th>
                <th className="p-3 text-left font-semibold text-gray-600 hidden sm:table-cell">
                  Admin ID
                </th>
                <th className="p-3 text-left font-semibold text-gray-600 hidden md:table-cell">
                  College
                </th>
                <th className="p-3 text-right font-semibold text-gray-600">
                  Orders
                </th>
                <th className="p-3 text-right font-semibold text-gray-600">
                  Total
                </th>
                <th className="p-3 text-right font-semibold text-gray-600">
                  Paid
                </th>
                <th className="p-3 text-right font-semibold text-gray-600">
                  Pending
                </th>
                <th className="p-3 text-left font-semibold text-gray-600 hidden lg:table-cell">
                  Last Payout
                </th>
                <th className="p-3 text-center font-semibold text-gray-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-8 text-center text-gray-400"
                    data-ocid="payouts.empty_state"
                  >
                    No payouts found
                  </td>
                </tr>
              ) : (
                displayed.map((r, i) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50/60"
                    data-ocid={`payouts.item.${i + 1}`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {r.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{r.name}</p>
                          <p className="text-xs text-gray-400 sm:hidden">
                            {r.adminId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs text-blue-600 hidden sm:table-cell">
                      {r.adminId}
                    </td>
                    <td className="p-3 text-gray-600 text-xs hidden md:table-cell">
                      {r.college}
                    </td>
                    <td className="p-3 text-right text-gray-700">
                      {r.completedOrders}
                    </td>
                    <td className="p-3 text-right font-semibold text-gray-800">
                      ₹{r.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-emerald-600 font-medium">
                      ₹{r.paidAmount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <span
                        className={`font-semibold ${r.pendingAmount > 0 ? "text-red-600" : "text-gray-400"}`}
                      >
                        ₹{r.pendingAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-400 hidden lg:table-cell">
                      {r.lastPayout}
                    </td>
                    <td className="p-3 text-center">
                      {r.pendingAmount > 0 ? (
                        <button
                          type="button"
                          onClick={() => setSettleRecord(r)}
                          className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          data-ocid={`payouts.settle_button.${i + 1}`}
                        >
                          Settle
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 justify-center">
                          <CheckCircle className="h-3.5 w-3.5" /> Paid
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {settleRecord && (
        <SettleModal
          record={settleRecord}
          onClose={() => setSettleRecord(null)}
          onSettle={handleSettle}
        />
      )}
    </AdminLayout>
  );
}
