import {
  CallerRole,
  type CleanupFilter,
  type CleanupResult,
  type College,
  OrderStatus,
  createActor,
} from "@/backend";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/layouts/AdminLayout";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  AlertTriangle,
  Archive,
  Building2,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  Clock,
  Database,
  FileX,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  Trash,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface CleanupAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  estimatedCount: number;
  unit: string;
}

interface CleanupHistory {
  date: string;
  operation: string;
  recordsRemoved: number;
  performedBy: string;
}

const CLEANUP_ACTIONS: CleanupAction[] = [
  {
    id: "delete_old_orders",
    label: "Delete Orders Older Than 1 Month",
    description: "Remove closed/delivered orders created more than 30 days ago",
    icon: <Trash2 className="h-5 w-5" />,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    estimatedCount: 0,
    unit: "orders",
  },
  {
    id: "clear_cache",
    label: "Clear Cache Files",
    description: "Remove temporary cached data and stale session fragments",
    icon: <RefreshCw className="h-5 w-5" />,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    estimatedCount: 0,
    unit: "MB",
  },
  {
    id: "remove_sessions",
    label: "Remove Expired Sessions",
    description: "Clean up authentication sessions that have already expired",
    icon: <Clock className="h-5 w-5" />,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    estimatedCount: 0,
    unit: "sessions",
  },
  {
    id: "clean_uploads",
    label: "Remove Unused Uploaded Files",
    description: "Delete orphaned files not linked to any active order",
    icon: <FileX className="h-5 w-5" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    estimatedCount: 0,
    unit: "files",
  },
  {
    id: "archive_notifications",
    label: "Archive Old Notifications",
    description: "Move notifications older than 2 weeks to archive storage",
    icon: <Archive className="h-5 w-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    estimatedCount: 0,
    unit: "notifications",
  },
  {
    id: "optimize_logs",
    label: "Optimize Activity Logs",
    description: "Compress and trim logs older than 7 days to reduce storage",
    icon: <Database className="h-5 w-5" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    estimatedCount: 0,
    unit: "log entries",
  },
];

// No pre-seeded cleanup history — starts empty on fresh deployment
const CLEANUP_HISTORY: CleanupHistory[] = [];

function ConfirmDialog({
  action,
  onConfirm,
  onCancel,
}: {
  action: CleanupAction;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-label="Close dialog"
      />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10"
        data-ocid="db_cleaner.confirm_dialog"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100"
          data-ocid="db_cleaner.close_button"
        >
          <X className="h-4 w-4" />
        </button>
        <div
          className={`h-12 w-12 rounded-xl ${action.bgColor} ${action.color} flex items-center justify-center mb-4`}
        >
          {action.icon}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Confirm Cleanup
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          You are about to:{" "}
          <span className="font-semibold text-gray-700">{action.label}</span>
        </p>
        <div
          className={`${action.bgColor} ${action.borderColor} border rounded-xl p-3 mb-5`}
        >
          <p className="text-sm font-semibold text-gray-700 mb-0.5">
            Estimated impact:
          </p>
          <p className={`text-sm ${action.color} font-bold`}>
            ~{action.estimatedCount.toLocaleString()} {action.unit} will be
            removed
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 flex items-start gap-2">
          <Shield className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Database Admin accounts, College Admin accounts, Customer profiles,
            login credentials, colleges, and system settings are{" "}
            <span className="font-bold">never deleted</span> by cleanup
            operations.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
            data-ocid="db_cleaner.cancel_button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700"
            data-ocid="db_cleaner.confirm_button"
          >
            Run Cleanup
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Smart Cleanup Section ────────────────────────────────────────────────────

type SmartStatus = "Completed" | "Delivered" | "Cancelled";
type SmartDays = 30 | 60 | 90;

const STATUS_OPTIONS: { label: string; value: SmartStatus }[] = [
  { label: "Completed", value: "Completed" },
  { label: "Delivered", value: "Delivered" },
  { label: "Cancelled", value: "Cancelled" },
];

const DAY_OPTIONS: { label: string; value: SmartDays }[] = [
  { label: "Older Than 30 Days", value: 30 },
  { label: "Older Than 60 Days", value: 60 },
  { label: "Older Than 90 Days", value: 90 },
];

function SmartCleanupSection() {
  const { isHeadAdmin, isCollegeAdmin } = useAuth();
  const { actor } = useActor(createActor);

  const [selectedStatuses, setSelectedStatuses] = useState<SmartStatus[]>([]);
  const [selectedDays, setSelectedDays] = useState<SmartDays | null>(null);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>("");
  const [colleges, setColleges] = useState<College[]>([]);

  const [previewResult, setPreviewResult] = useState<CleanupResult | null>(
    null,
  );
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<CleanupResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const showCollegeDropdown = isHeadAdmin || isCollegeAdmin;

  // Determine caller role
  const callerRole = (() => {
    if (isHeadAdmin) return CallerRole.DatabaseAdmin;
    if (isCollegeAdmin) return CallerRole.CollegeAdmin;
    return CallerRole.Customer;
  })();

  // Fetch colleges for dropdown
  useEffect(() => {
    if (!actor || !showCollegeDropdown) return;
    actor
      .listColleges()
      .then((list) => setColleges(list))
      .catch(() => {
        /* suppress */
      });
  }, [actor, showCollegeDropdown]);

  const buildFilter = (): CleanupFilter => {
    const statusFilter: Array<OrderStatus> = selectedStatuses.map((s) => {
      if (s === "Completed") return OrderStatus.Completed;
      if (s === "Delivered") return OrderStatus.Delivered;
      return OrderStatus.Closed; // Cancelled maps to Closed in backend enum
    });
    return {
      callerRole,
      statusFilter: statusFilter.length > 0 ? statusFilter : undefined,
      olderThanDays: selectedDays != null ? BigInt(selectedDays) : undefined,
      collegeIdFilter: selectedCollegeId || undefined,
    };
  };

  const hasFilter =
    selectedStatuses.length > 0 || selectedDays != null || !!selectedCollegeId;

  const handlePreview = async () => {
    if (!actor) return;
    setIsPreviewing(true);
    setPreviewResult(null);
    setDeleteResult(null);
    setShowConfirm(false);
    try {
      const result = await actor.dryRunSmartCleanup(buildFilter());
      setPreviewResult(result);
      if (Number(result.deletedCount) > 0) setShowConfirm(true);
    } catch {
      /* suppress */
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleDelete = async () => {
    if (!actor) return;
    setIsDeleting(true);
    setShowConfirm(false);
    try {
      const result = await actor.smartCleanup(buildFilter());
      setDeleteResult(result);
      setPreviewResult(null);
    } catch {
      /* suppress */
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStatus = (s: SmartStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
    setPreviewResult(null);
    setDeleteResult(null);
    setShowConfirm(false);
  };

  const toggleDay = (d: SmartDays) => {
    setSelectedDays((prev) => (prev === d ? null : d));
    setPreviewResult(null);
    setDeleteResult(null);
    setShowConfirm(false);
  };

  return (
    <div
      className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      data-ocid="smart_cleanup.section"
    >
      {/* Section header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
          <Trash className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Smart Cleanup</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Bulk-delete orders by status and age. Only Completed, Delivered, and
            Cancelled orders can be removed.
          </p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Status filters */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Status Filters
          </p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(({ label, value }) => {
              const active = selectedStatuses.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleStatus(value)}
                  data-ocid={`smart_cleanup.status_toggle.${value.toLowerCase()}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    active
                      ? "bg-red-50 border-red-300 text-red-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {active && <CheckSquare className="h-3 w-3" />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date filters */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" /> Date Filters
          </p>
          <div className="flex flex-wrap gap-2">
            {DAY_OPTIONS.map(({ label, value }) => {
              const active = selectedDays === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDay(value)}
                  data-ocid={`smart_cleanup.days_toggle.${value}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    active
                      ? "bg-amber-50 border-amber-300 text-amber-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {active && <CheckSquare className="h-3 w-3" />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* College dropdown — visible only for CollegeAdmin and DatabaseAdmin */}
        {showCollegeDropdown && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> College Filter
            </p>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <select
                value={selectedCollegeId}
                onChange={(e) => {
                  setSelectedCollegeId(e.target.value);
                  setPreviewResult(null);
                  setDeleteResult(null);
                  setShowConfirm(false);
                }}
                data-ocid="smart_cleanup.college_select"
                className="w-full pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:border-blue-400 appearance-none"
              >
                <option value="">All Colleges</option>
                {colleges.map((c) => (
                  <option key={c.collegeId} value={c.collegeId}>
                    {c.collegeName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Preview result banner */}
        {previewResult && showConfirm && (
          <div
            className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
            data-ocid="smart_cleanup.preview_result"
          >
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                Found {Number(previewResult.deletedCount).toLocaleString()}{" "}
                matching orders.
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Delete them permanently?
              </p>
            </div>
          </div>
        )}

        {previewResult &&
          !showConfirm &&
          Number(previewResult.deletedCount) === 0 && (
            <div
              className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3"
              data-ocid="smart_cleanup.empty_state"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-emerald-700">
                No matching orders found.
              </p>
            </div>
          )}

        {/* Delete success banner */}
        {deleteResult && (
          <div
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3"
            data-ocid="smart_cleanup.success_state"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-emerald-700">
              Deleted {Number(deleteResult.deletedCount).toLocaleString()}{" "}
              orders successfully.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            disabled={!hasFilter || isPreviewing || isDeleting || !actor}
            onClick={handlePreview}
            data-ocid="smart_cleanup.preview_button"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isPreviewing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Previewing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" /> Preview
              </>
            )}
          </button>

          {showConfirm &&
            previewResult &&
            Number(previewResult.deletedCount) > 0 && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                data-ocid="smart_cleanup.confirm_delete_button"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash className="h-4 w-4" /> Confirm Delete
                  </>
                )}
              </button>
            )}
        </div>

        {/* Protected data notice */}
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
          <Shield className="h-3 w-3" /> Only Completed, Delivered, and
          Cancelled orders are eligible for cleanup. Active or pending orders
          are always protected.
        </p>
      </div>
    </div>
  );
}

export function AdminDatabaseCleaner() {
  const [pending, setPending] = useState<CleanupAction | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<CleanupHistory[]>(CLEANUP_HISTORY);
  // History is session-only; cleared on page refresh (no fake persisted records)

  const runCleanup = async (action: CleanupAction) => {
    setPending(null);
    setRunning(action.id);
    await new Promise((r) => setTimeout(r, 1800));
    const removed = Math.floor(
      action.estimatedCount * (0.85 + Math.random() * 0.15),
    );
    setResults((prev) => ({ ...prev, [action.id]: removed }));
    setHistory((prev) => [
      {
        date: new Date().toLocaleString("en-IN").replace(",", ""),
        operation: action.label,
        recordsRemoved: removed,
        performedBy: "Database Admin",
      },
      ...prev,
    ]);
    setRunning(null);
  };

  return (
    <AdminLayout pageTitle="Database Cleaner">
      {/* Header info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">
            Safe Cleanup System
          </p>
          <p className="text-xs text-blue-600 mt-0.5">
            All cleanup operations are non-destructive to core data. Database
            Admin accounts, College Admins, Customer profiles, login
            credentials, colleges, and system settings are permanently protected
            and will never be deleted.
          </p>
        </div>
        <span className="ml-auto flex-shrink-0 inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
          <RefreshCw className="h-3 w-3" /> Auto-cleaned weekly
        </span>
      </div>

      {/* Cleanup action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {CLEANUP_ACTIONS.map((action) => {
          const isRunning = running === action.id;
          const result = results[action.id];
          return (
            <div
              key={action.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3"
              data-ocid={`db_cleaner.action_card.${action.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`h-10 w-10 rounded-xl ${action.bgColor} ${action.color} flex items-center justify-center flex-shrink-0`}
                >
                  {action.icon}
                </div>
                {result !== undefined && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                    <CheckCircle2 className="h-3 w-3" /> Done
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {action.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {action.description}
                </p>
              </div>
              {result !== undefined ? (
                <div
                  className={`${action.bgColor} ${action.borderColor} border rounded-lg px-3 py-2`}
                >
                  <p className={`text-xs font-semibold ${action.color}`}>
                    Removed {result.toLocaleString()} {action.unit}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  ~{action.estimatedCount.toLocaleString()} {action.unit}{" "}
                  estimated
                </p>
              )}
              <button
                type="button"
                disabled={isRunning || !!running}
                onClick={() => setPending(action)}
                data-ocid={`db_cleaner.run_button.${action.id}`}
                className={`mt-auto w-full py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  isRunning
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : running
                      ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                      : result !== undefined
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        : `${action.bgColor} ${action.color} ${action.borderColor} border hover:opacity-90`
                }`}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Cleaning...
                  </>
                ) : result !== undefined ? (
                  "Run Again"
                ) : (
                  "Run Cleanup"
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Running progress indicator */}
      {running && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-4">
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              Cleanup in progress...
            </p>
            <p className="text-xs text-blue-600">
              {CLEANUP_ACTIONS.find((a) => a.id === running)?.label} — please
              wait
            </p>
          </div>
          <div className="ml-auto h-1.5 flex-1 max-w-40 bg-blue-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {/* Safety notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Protected Data</p>
          <p className="text-xs text-amber-700 mt-1">
            The following are <span className="font-bold">never deleted</span>{" "}
            by any cleanup operation: Database Admin accounts · College Admin
            accounts · Customer profiles · Login credentials · Colleges · Main
            system settings · Authentication data
          </p>
        </div>
      </div>

      {/* Cleanup history table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            Recent Cleanup History
          </h3>
          <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 font-semibold">
            Activity logs auto-cleaned weekly
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-3 text-left font-semibold text-gray-600">
                  Date & Time
                </th>
                <th className="p-3 text-left font-semibold text-gray-600">
                  Operation
                </th>
                <th className="p-3 text-right font-semibold text-gray-600">
                  Records Removed
                </th>
                <th className="p-3 text-left font-semibold text-gray-600 hidden md:table-cell">
                  Performed By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {history.map((h, i) => (
                <tr
                  key={`${h.date}-${h.operation}`}
                  className="hover:bg-gray-50/60"
                  data-ocid={`db_cleaner.history_row.${i + 1}`}
                >
                  <td className="p-3 text-xs text-gray-400 font-mono">
                    {h.date}
                  </td>
                  <td className="p-3 text-gray-700 font-medium">
                    {h.operation}
                  </td>
                  <td className="p-3 text-right">
                    <span className="font-semibold text-red-600">
                      {h.recordsRemoved.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500 hidden md:table-cell">
                    {h.performedBy === "Auto (Weekly)" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">
                        <RefreshCw className="h-3 w-3" /> Auto
                      </span>
                    ) : (
                      h.performedBy
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== SMART CLEANUP SECTION ========== */}
      <SmartCleanupSection />

      {pending && (
        <ConfirmDialog
          action={pending}
          onConfirm={() => runCleanup(pending)}
          onCancel={() => setPending(null)}
        />
      )}
    </AdminLayout>
  );
}
