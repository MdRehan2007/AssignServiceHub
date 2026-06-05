import { AdminLayout } from "@/layouts/AdminLayout";
import { getColleges } from "@/services/api";
import type { College } from "@/types";
import {
  Building2,
  Pencil,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type CollegeForm = {
  name: string;
  adminEmail: string;
  phone: string;
  location: string;
  commissionPercent: number;
};

const EMPTY_FORM: CollegeForm = {
  name: "",
  adminEmail: "",
  phone: "",
  location: "",
  commissionPercent: 15,
};

function generateAdminId(name: string, count: number): string {
  const code = name
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 6);
  return `${code}0${count + 1}`;
}

function AddAdminModal({
  college,
  onClose,
  onAdd,
}: {
  college: College;
  onClose: () => void;
  onAdd: (collegeId: string, adminName: string, adminEmail: string) => void;
}) {
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [added, setAdded] = useState<{ id: string; name: string } | null>(null);

  const handleAdd = () => {
    if (!adminName.trim() || !adminEmail.trim()) return;
    const newId = generateAdminId(college.name, college.adminCount);
    onAdd(college.id, adminName.trim(), adminEmail.trim());
    setAdded({ id: newId, name: adminName.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10"
        data-ocid="colleges.add_admin_dialog"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100"
          data-ocid="colleges.close_button"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Add Admin</h2>
        <p className="text-sm text-gray-500 mb-5">
          Adding admin to{" "}
          <span className="font-semibold text-gray-700">{college.name}</span>
        </p>
        {added ? (
          <div className="text-center py-4">
            <div className="h-14 w-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserPlus className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-gray-900 mb-1">Admin Added!</p>
            <p className="text-sm text-gray-500 mb-1">{added.name}</p>
            <div className="inline-block bg-blue-50 border border-blue-200 rounded-xl px-6 py-2 mb-3">
              <p className="text-xl font-mono font-bold text-blue-600">
                {added.id}
              </p>
            </div>
            <p className="text-xs text-gray-400">
              Share this Admin ID and email with the new admin
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              data-ocid="colleges.done_button"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="add-admin-name"
                className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block"
              >
                Admin Full Name *
              </label>
              <input
                id="add-admin-name"
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. Ravi Kumar"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-ocid="colleges.admin_name_input"
              />
            </div>
            <div>
              <label
                htmlFor="add-admin-email"
                className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block"
              >
                Admin Email *
              </label>
              <input
                id="add-admin-email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@college.edu"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-ocid="colleges.admin_email_input"
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs text-blue-600">
                Generated Admin ID:{" "}
                <span className="font-mono font-bold">
                  {generateAdminId(college.name, college.adminCount)}
                </span>
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
                data-ocid="colleges.cancel_button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="flex-1 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                data-ocid="colleges.add_admin_submit_button"
              >
                Add Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CollegeModal({
  college,
  onClose,
  onSave,
}: {
  college: CollegeForm | null;
  onClose: () => void;
  onSave: (data: CollegeForm) => void;
}) {
  const isNew = college === null;
  const [form, setForm] = useState<CollegeForm>(college ?? EMPTY_FORM);
  const [saved, setSaved] = useState(false);
  const generatedId = isNew
    ? generateAdminId(form.name || "COL", 0)
    : undefined;

  const handleSave = () => {
    if (!form.name) return;
    onSave(form);
    if (isNew) setSaved(true);
    else onClose();
  };

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
        data-ocid="colleges.college_dialog"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100"
          data-ocid="colleges.close_button"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-bold text-gray-900 mb-5">
          {isNew ? "Add New College" : "Edit College"}
        </h2>
        {saved ? (
          <div className="text-center py-6">
            <div className="h-14 w-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Building2 className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-gray-900 mb-1">
              College Created!
            </p>
            <p className="text-sm text-gray-500 mb-3">
              First Admin ID generated:
            </p>
            <div className="inline-block bg-blue-50 border border-blue-200 rounded-xl px-6 py-3">
              <p
                className="text-2xl font-mono font-bold text-blue-600"
                data-ocid="colleges.generated_admin_id"
              >
                {generatedId}
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Use &ldquo;Add Admin&rdquo; to add more admins to this college
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              data-ocid="colleges.done_button"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label
                  htmlFor="col-name"
                  className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block"
                >
                  College Name *
                </label>
                <input
                  id="col-name"
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-ocid="colleges.name_input"
                />
              </div>
              <div className="col-span-2">
                <label
                  htmlFor="col-email"
                  className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block"
                >
                  Initial Admin Email
                </label>
                <input
                  id="col-email"
                  type="email"
                  value={form.adminEmail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, adminEmail: e.target.value }))
                  }
                  placeholder="Optional — add admins later"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-ocid="colleges.email_input"
                />
              </div>
              <div>
                <label
                  htmlFor="col-phone"
                  className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block"
                >
                  Phone
                </label>
                <input
                  id="col-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-ocid="colleges.phone_input"
                />
              </div>
              <div>
                <label
                  htmlFor="col-commission"
                  className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block"
                >
                  Commission %
                </label>
                <input
                  id="col-commission"
                  type="number"
                  min="0"
                  max="50"
                  value={form.commissionPercent}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      commissionPercent: Number(e.target.value),
                    }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-ocid="colleges.commission_input"
                />
              </div>
              <div className="col-span-2">
                <label
                  htmlFor="col-location"
                  className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block"
                >
                  Location
                </label>
                <input
                  id="col-location"
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-ocid="colleges.location_input"
                />
              </div>
            </div>
            {isNew && form.name && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs text-blue-600">
                  First Admin ID:{" "}
                  <span className="font-mono font-bold">{generatedId}</span>
                </p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
                data-ocid="colleges.cancel_button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                data-ocid="colleges.submit_button"
              >
                Save College
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminColleges() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editCollege, setEditCollege] = useState<CollegeForm | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [addAdminCollegeId, setAddAdminCollegeId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    getColleges().then((c) => {
      setColleges(c);
      setLoading(false);
    });
  }, []);

  const handleSave = (data: CollegeForm) => {
    if (modal === "add") {
      const newCollege: College = {
        id: `col_${Date.now()}`,
        name: data.name,
        code: data.name
          .toUpperCase()
          .replace(/[^A-Z]/g, "")
          .slice(0, 6),
        location: data.location,
        adminIds: [],
        adminNames: [],
        adminCount: 0,
        totalStudents: 0,
        totalOrders: 0,
        revenue: 0,
        status: "active",
        createdAt: Date.now(),
      };
      setColleges((prev) => [...prev, newCollege]);
    } else {
      setColleges((prev) =>
        prev.map((c) =>
          c.name === data.name ? { ...c, location: data.location } : c,
        ),
      );
      setModal(null);
    }
  };

  const handleAddAdmin = (
    collegeId: string,
    adminName: string,
    adminEmail: string,
  ) => {
    setColleges((prev) =>
      prev.map((c) => {
        if (c.id !== collegeId) return c;
        const newAdminId = generateAdminId(c.name, c.adminCount);
        return {
          ...c,
          adminIds: [...c.adminIds, newAdminId],
          adminNames: [...c.adminNames, adminName],
          adminCount: c.adminCount + 1,
          _lastAdminEmail: adminEmail,
        } as College & { _lastAdminEmail: string };
      }),
    );
  };

  const toggleStatus = (id: string) => {
    setColleges((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "active" ? "inactive" : "active" }
          : c,
      ),
    );
  };

  const addAdminCollege = colleges.find((c) => c.id === addAdminCollegeId);

  return (
    <AdminLayout pageTitle="College Management">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          {colleges.length} colleges registered
        </p>
        <button
          type="button"
          onClick={() => setModal("add")}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm"
          data-ocid="colleges.add_button"
        >
          <Plus className="h-4 w-4" />
          Add College
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-3 text-left font-semibold text-gray-600">
                  College Name
                </th>
                <th className="p-3 text-left font-semibold text-gray-600 hidden sm:table-cell">
                  Admins
                </th>
                <th className="p-3 text-right font-semibold text-gray-600 hidden md:table-cell">
                  Orders
                </th>
                <th className="p-3 text-right font-semibold text-gray-600 hidden md:table-cell">
                  Revenue
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
              {loading
                ? [...Array(3)].map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loading rows
                    <tr key={`skeleton-${i}`}>
                      <td colSpan={6} className="p-3">
                        <div className="h-5 bg-gray-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                : colleges.map((col, i) => (
                    <tr
                      key={col.id}
                      className="hover:bg-gray-50/60"
                      data-ocid={`colleges.item.${i + 1}`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {col.code?.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {col.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {col.location}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                            <Users className="h-3 w-3" />
                            {col.adminCount} admin
                            {col.adminCount !== 1 ? "s" : ""}
                          </div>
                          <button
                            type="button"
                            onClick={() => setAddAdminCollegeId(col.id)}
                            className="p-1 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-700"
                            title="Add admin"
                            data-ocid={`colleges.add_admin_button.${i + 1}`}
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {col.adminNames.length > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-32">
                            {col.adminNames.slice(0, 2).join(", ")}
                            {col.adminNames.length > 2 &&
                              ` +${col.adminNames.length - 2}`}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-right text-gray-700 hidden md:table-cell">
                        {col.totalOrders}
                      </td>
                      <td className="p-3 text-right font-semibold text-gray-800 hidden md:table-cell">
                        ₹{col.revenue.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStatus(col.id)}
                          className="flex items-center gap-1.5 mx-auto"
                          data-ocid={`colleges.status_toggle.${i + 1}`}
                        >
                          {col.status === "active" ? (
                            <>
                              <ToggleRight className="h-5 w-5 text-emerald-500" />
                              <span className="text-xs text-emerald-600 font-medium">
                                Active
                              </span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-5 w-5 text-gray-400" />
                              <span className="text-xs text-gray-400 font-medium">
                                Inactive
                              </span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditCollege({
                                name: col.name,
                                adminEmail: "",
                                phone: "",
                                location: col.location,
                                commissionPercent: 15,
                              });
                              setModal("edit");
                            }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                            data-ocid={`colleges.edit_button.${i + 1}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(col.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                            data-ocid={`colleges.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
            onKeyDown={(e) => e.key === "Escape" && setDeleteId(null)}
          />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10"
            data-ocid="colleges.delete_dialog"
          >
            <h3 className="font-bold text-gray-900 mb-2">Delete College?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This will permanently remove the college and all related data.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-xl"
                data-ocid="colleges.cancel_button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setColleges((prev) => prev.filter((c) => c.id !== deleteId));
                  setDeleteId(null);
                }}
                className="flex-1 py-2.5 text-sm font-medium bg-red-600 text-white rounded-xl"
                data-ocid="colleges.confirm_button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {(modal === "add" || modal === "edit") && (
        <CollegeModal
          college={modal === "edit" ? editCollege : null}
          onClose={() => {
            setModal(null);
            setEditCollege(null);
          }}
          onSave={handleSave}
        />
      )}

      {addAdminCollege && (
        <AddAdminModal
          college={addAdminCollege}
          onClose={() => setAddAdminCollegeId(null)}
          onAdd={handleAddAdmin}
        />
      )}
    </AdminLayout>
  );
}
