import type { WriterApplication } from "@/backend";
import { createActor } from "@/backend";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/layouts/AdminLayout";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  CheckCircle,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Loader2,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type AppStatus = "pending" | "approved" | "rejected";

// Normalise backend ApplicationStatus enum to lowercase UI values
function normaliseStatus(s: string): AppStatus {
  const lower = s.toLowerCase();
  if (lower === "approved") return "approved";
  if (lower === "rejected") return "rejected";
  return "pending";
}

// Flatten WriterApplication to the shape the UI table and modal use
interface FlatApp {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  skills: string[];
  experience: string;
  handwritingUrl: string;
  resumeUrl?: string;
  resumeKey?: string;
  status: AppStatus;
  appliedAt: number;
  reviewedAt?: number;
}

function flatten(a: WriterApplication): FlatApp {
  return {
    id: a.appId,
    name: a.applicantName,
    email: a.email,
    phone: a.phone,
    college: a.collegeName,
    skills: a.expertise,
    experience: a.bio,
    handwritingUrl: a.handwritingUrl,
    resumeUrl: a.resumeUrl ?? "",
    resumeKey: a.resumeKey ?? "",
    status: normaliseStatus(a.status as unknown as string),
    appliedAt: Number(a.appliedAt) / 1_000_000, // nanoseconds → ms
    reviewedAt: undefined,
  };
}

const STATUS_COLORS: Record<AppStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

function ApplicationModal({
  app,
  onClose,
  onApprove,
  onReject,
}: {
  app: FlatApp;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10"
        data-ocid="applications.detail_dialog"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100"
          data-ocid="applications.close_button"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-4 mb-5">
          <div className="h-14 w-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
            {app.name?.[0] ?? "A"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{app.name}</h2>
            <p className="text-sm text-gray-500">
              {app.email} · {app.phone}
            </p>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${STATUS_COLORS[app.status]}`}
            >
              {app.status.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">College</p>
            <p className="font-medium">{app.college}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Applied</p>
            <p className="font-medium">
              {new Date(app.appliedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-400 text-xs mb-0.5">Experience</p>
            <p className="text-gray-700">{app.experience}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-400 text-xs mb-1.5">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {app.skills.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Resume */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-gray-700 font-medium">
              Resume{app.resumeKey ? `: ${app.resumeKey}` : ""}
            </p>
          </div>
          {app.resumeUrl ? (
            <div className="flex items-center gap-1.5">
              <a
                href={app.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 font-semibold bg-blue-100 hover:bg-blue-200 px-2.5 py-1.5 rounded-lg transition-colors"
                data-ocid="applications.view_resume_link"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View Resume
              </a>
              <a
                href={app.resumeUrl}
                download={app.resumeKey || "resume"}
                className="flex items-center gap-1 text-xs text-gray-600 font-medium bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition-colors"
                data-ocid="applications.download_resume_link"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </a>
            </div>
          ) : (
            <span className="text-xs text-gray-400">No resume uploaded</span>
          )}
        </div>
        <div className="bg-gray-50 rounded-xl p-3 mb-5 flex items-center justify-between">
          <p className="text-sm text-gray-600">Handwriting Sample</p>
          {app.handwritingUrl ? (
            <a
              href={app.handwritingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline"
              data-ocid="applications.handwriting_link"
            >
              View Sample <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span className="text-xs text-gray-400">No sample provided</span>
          )}
        </div>
        {app.status === "pending" && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                onReject(app.id);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100"
              data-ocid="applications.reject_button"
            >
              <XCircle className="h-4 w-4" /> Reject
            </button>
            <button
              type="button"
              onClick={() => {
                onApprove(app.id);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
              data-ocid="applications.approve_button"
            >
              <CheckCircle className="h-4 w-4" /> Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminApplications() {
  const [apps, setApps] = useState<FlatApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | AppStatus>("all");
  const [viewApp, setViewApp] = useState<FlatApp | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { actor } = useActor(createActor);

  const { isHeadAdmin } = useAuth();

  const handleDeleteApplication = async (id: string) => {
    try {
      if (actor) {
        await actor.deleteApplication(id);
      }
      setApps((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirmId(null);
      toast.success("Application deleted.");
    } catch {
      toast.error("Failed to delete application.");
      setDeleteConfirmId(null);
    }
  };

  useEffect(() => {
    const loadApplications = async () => {
      if (!actor) return;
      try {
        const raw = await actor.listWriterApplications();
        setApps(raw.map(flatten));
      } catch {
        // silently fail — do not show technical errors
      } finally {
        setLoading(false);
      }
    };
    loadApplications();
    const interval = setInterval(loadApplications, 30_000);
    return () => clearInterval(interval);
  }, [actor]);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setActionLoadingId(id);
    try {
      let result: { __kind__: string } | null = null;
      if (actor) {
        result =
          status === "approved"
            ? await actor.approveApplication(id, "")
            : await actor.rejectApplication(id, "");
      }
      if (result?.__kind__ === "ok" || result !== null) {
        setApps((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, status, reviewedAt: Date.now() } : a,
          ),
        );
        toast.success(
          status === "approved"
            ? "Application approved successfully!"
            : "Application rejected.",
        );
      }
    } catch {
      // silently fail
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = apps.filter((a) => filter === "all" || a.status === filter);
  const pendingCount = apps.filter((a) => a.status === "pending").length;

  return (
    <AdminLayout pageTitle="Admin Applications">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-gray-900">{apps.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total Applications</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-100">
          <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
          <p className="text-xs text-yellow-600 mt-0.5">Pending Review</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 shadow-sm border border-emerald-100">
          <p className="text-2xl font-bold text-emerald-700">
            {apps.filter((a) => a.status === "approved").length}
          </p>
          <p className="text-xs text-emerald-600 mt-0.5">Approved Admins</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-5">
        <Filter className="h-4 w-4 text-gray-400" />
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
            data-ocid={`applications.filter_${f}_tab`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-3 text-left font-semibold text-gray-600">
                  Applicant
                </th>
                <th className="p-3 text-left font-semibold text-gray-600 hidden sm:table-cell">
                  Email
                </th>
                <th className="p-3 text-left font-semibold text-gray-600 hidden md:table-cell">
                  College
                </th>
                <th className="p-3 text-left font-semibold text-gray-600 hidden lg:table-cell">
                  Applied
                </th>
                <th className="p-3 text-center font-semibold text-gray-600 hidden md:table-cell">
                  Resume
                </th>
                <th className="p-3 text-center font-semibold text-gray-600">
                  Status
                </th>
                <th className="p-3 text-center font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loading rows
                  <tr key={`skeleton-${i}`}>
                    <td colSpan={7} className="p-3">
                      <div className="h-5 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-gray-400"
                    data-ocid="applications.empty_state"
                  >
                    No applications found
                  </td>
                </tr>
              ) : (
                filtered.map((app, i) => (
                  <tr
                    key={app.id}
                    className="hover:bg-gray-50/60"
                    data-ocid={`applications.item.${i + 1}`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {app.name?.[0] ?? "A"}
                        </div>
                        <p className="font-medium text-gray-800">{app.name}</p>
                      </div>
                    </td>
                    <td className="p-3 text-gray-500 hidden sm:table-cell text-xs">
                      {app.email}
                    </td>
                    <td className="p-3 text-gray-600 hidden md:table-cell">
                      {app.college}
                    </td>
                    <td className="p-3 text-gray-400 text-xs hidden lg:table-cell">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-center hidden md:table-cell">
                      {app.resumeUrl ? (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                          data-ocid={`applications.view_resume_button.${i + 1}`}
                        >
                          <FileText className="h-3.5 w-3.5" /> View Resume
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No resume</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[app.status]}`}
                      >
                        {app.status.charAt(0).toUpperCase() +
                          app.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewApp(app)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                          title="View application details"
                          data-ocid={`applications.view_button.${i + 1}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {app.status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => updateStatus(app.id, "approved")}
                              disabled={actionLoadingId === app.id}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              data-ocid={`applications.approve_button.${i + 1}`}
                            >
                              {actionLoadingId === app.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStatus(app.id, "rejected")}
                              disabled={actionLoadingId === app.id}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              data-ocid={`applications.reject_button.${i + 1}`}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {isHeadAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(app.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            title="Delete application"
                            data-ocid={`applications.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewApp && (
        <ApplicationModal
          app={viewApp}
          onClose={() => setViewApp(null)}
          onApprove={(id) => updateStatus(id, "approved")}
          onReject={(id) => updateStatus(id, "rejected")}
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
            data-ocid="applications.delete_dialog"
          >
            <h2 className="text-base font-bold text-gray-900 mb-2">
              Delete Application
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
                data-ocid="applications.cancel_button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteApplication(deleteConfirmId)}
                className="flex-1 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700"
                data-ocid="applications.confirm_button"
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
