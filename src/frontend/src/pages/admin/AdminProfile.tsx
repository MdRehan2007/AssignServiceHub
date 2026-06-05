import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ADMIN_SKILLS } from "@/services/api";
import {
  Clock,
  Eye,
  EyeOff,
  LogOut,
  Plus,
  Save,
  Shield,
  User,
  X,
} from "lucide-react";
import { useState } from "react";

const ACTIVITY_LOGS = [
  {
    date: "2026-05-16 09:23",
    action: "Updated system pricing settings",
    resource: "System Settings",
  },
  {
    date: "2026-05-15 14:45",
    action: "Approved admin application",
    resource: "Sai Krishna (app_1)",
  },
  {
    date: "2026-05-15 11:12",
    action: "Changed order status to Delivered",
    resource: "Order AF005JKL",
  },
  {
    date: "2026-05-14 16:00",
    action: "Added college KL University",
    resource: "Colleges",
  },
  {
    date: "2026-05-14 09:30",
    action: "Logged in from new device",
    resource: "Session",
  },
];

const SESSIONS = [
  {
    device: "Chrome on Windows",
    ip: "192.168.1.1",
    location: "Vijayawada, AP",
    lastActive: "5 mins ago",
    current: true,
  },
  {
    device: "Safari on iPhone 14",
    ip: "10.0.0.5",
    location: "Hyderabad, TS",
    lastActive: "2 days ago",
    current: false,
  },
];

export function AdminProfile() {
  const { user } = useAuth();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [pwSaved, setPwSaved] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [skillsSaved, setSkillsSaved] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? "Database Administrator",
    email: user?.email ?? "admin@assignflow.in",
    phone: "+91 98765 43210",
    dob: "1990-06-15",
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    "Academic Writing",
    "Research Skills",
    "Proofreading",
    "Microsoft Word",
  ]);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherSkillInput, setOtherSkillInput] = useState("");

  const savePw = () => {
    if (passwordForm.newPass !== passwordForm.confirm) return;
    setPwSaved(true);
    setPasswordForm({ current: "", newPass: "", confirm: "" });
    setTimeout(() => setPwSaved(false), 2500);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const addOtherSkill = () => {
    const trimmed = otherSkillInput.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills((prev) => [...prev, trimmed]);
    }
    setOtherSkillInput("");
    setShowOtherInput(false);
  };

  const saveSkills = () => {
    setSkillsSaved(true);
    setTimeout(() => setSkillsSaved(false), 2500);
  };

  const initials = profileForm.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AdminLayout pageTitle="My Profile">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-5 mb-6">
            <div className="h-20 w-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {profileForm.name}
              </h2>
              <p className="text-sm text-gray-500">{profileForm.email}</p>
              <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mt-1">
                <User className="h-3 w-3 mr-1" /> Database Administrator
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="profile-name"
                className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block"
              >
                Full Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full border-2 border-gray-400 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-ocid="profile.name_input"
              />
            </div>
            <div>
              <label
                htmlFor="profile-email"
                className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block"
              >
                Email (Read-only)
              </label>
              <input
                id="profile-email"
                type="email"
                value={profileForm.email}
                readOnly
                className="w-full border-2 border-gray-400 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label
                htmlFor="profile-phone"
                className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block"
              >
                Phone
              </label>
              <input
                id="profile-phone"
                type="tel"
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="w-full border-2 border-gray-400 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-ocid="profile.phone_input"
              />
            </div>
            <div>
              <label
                htmlFor="profile-dob"
                className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block"
              >
                Date of Birth
              </label>
              <input
                id="profile-dob"
                type="date"
                value={profileForm.dob}
                onChange={(e) =>
                  setProfileForm((f) => ({ ...f, dob: e.target.value }))
                }
                className="w-full border-2 border-gray-400 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-ocid="profile.dob_input"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={() => {
                setProfileSaved(true);
                setTimeout(() => setProfileSaved(false), 2500);
              }}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
                profileSaved
                  ? "bg-emerald-600 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              data-ocid="profile.save_button"
            >
              <Save className="h-4 w-4" />
              {profileSaved ? "Saved!" : "Save Profile"}
            </button>
          </div>
        </div>

        {/* Assignment Writing & Research Skills */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="font-semibold text-gray-800">
                Assignment Writing &amp; Research Skills
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Select your expertise areas. These are visible to customers.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full flex-shrink-0 ml-3">
              {selectedSkills.length} selected
            </span>
          </div>

          <div
            className="flex flex-wrap gap-2 mt-4"
            data-ocid="profile.skills_list"
          >
            {ADMIN_SKILLS.map((skill) => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  data-ocid={`profile.skill_tag.${skill.toLowerCase().replace(/[^a-z0-9]/g, "_")}`}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                  }`}
                >
                  {skill}
                </button>
              );
            })}

            {/* Other custom skills already added */}
            {selectedSkills
              .filter(
                (s) =>
                  !ADMIN_SKILLS.includes(s as (typeof ADMIN_SKILLS)[number]),
              )
              .map((custom) => (
                <span
                  key={custom}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-blue-600 text-white border border-blue-600"
                >
                  {custom}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedSkills((prev) =>
                        prev.filter((s) => s !== custom),
                      )
                    }
                    className="hover:opacity-70 ml-0.5"
                    aria-label={`Remove ${custom}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

            {/* Other button */}
            {!showOtherInput ? (
              <button
                type="button"
                onClick={() => setShowOtherInput(true)}
                className="px-3 py-1.5 text-xs font-medium rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 flex items-center gap-1 transition-all"
                data-ocid="profile.add_other_skill_button"
              >
                <Plus className="h-3 w-3" /> Other
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={otherSkillInput}
                  onChange={(e) => setOtherSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addOtherSkill()}
                  placeholder="Enter custom skill..."
                  className="border border-blue-400 rounded-full px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 w-36"
                  data-ocid="profile.custom_skill_input"
                />
                <button
                  type="button"
                  onClick={addOtherSkill}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700"
                  data-ocid="profile.add_custom_skill_button"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowOtherInput(false);
                    setOtherSkillInput("");
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                  aria-label="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-5">
            <button
              type="button"
              onClick={saveSkills}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
                skillsSaved
                  ? "bg-emerald-600 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              data-ocid="profile.save_skills_button"
            >
              <Save className="h-4 w-4" />
              {skillsSaved ? "Saved!" : "Save Skills"}
            </button>
          </div>
        </div>

        {/* Password card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Change Password</h3>
          </div>
          <div className="space-y-4">
            {[
              {
                label: "Current Password",
                value: passwordForm.current,
                field: "current",
                show: showCurrent,
                toggle: () => setShowCurrent((v) => !v),
              },
              {
                label: "New Password",
                value: passwordForm.newPass,
                field: "newPass",
                show: showNew,
                toggle: () => setShowNew((v) => !v),
              },
              {
                label: "Confirm New Password",
                value: passwordForm.confirm,
                field: "confirm",
                show: showConfirm,
                toggle: () => setShowConfirm((v) => !v),
              },
            ].map(({ label, value, field, show, toggle }) => (
              <div key={field}>
                <label
                  htmlFor={`profile-pwd-${field}`}
                  className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block"
                >
                  {label}
                </label>
                <div className="relative">
                  <input
                    id={`profile-pwd-${field}`}
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) =>
                      setPasswordForm((f) => ({
                        ...f,
                        [field]: e.target.value,
                      }))
                    }
                    className="w-full border-2 border-gray-400 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-ocid={`profile.${field}_password_input`}
                  />
                  <button
                    type="button"
                    onClick={toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {passwordForm.newPass &&
            passwordForm.confirm &&
            passwordForm.newPass !== passwordForm.confirm && (
              <p
                className="text-xs text-red-500 mt-2"
                data-ocid="profile.password_field_error"
              >
                Passwords do not match
              </p>
            )}
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={savePw}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
                pwSaved
                  ? "bg-emerald-600 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              data-ocid="profile.change_password_button"
            >
              <Save className="h-4 w-4" />
              {pwSaved ? "Updated!" : "Update Password"}
            </button>
          </div>
        </div>

        {/* Sessions card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Active Sessions</h3>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
              data-ocid="profile.logout_all_button"
            >
              <LogOut className="h-4 w-4" /> Logout All
            </button>
          </div>
          <div className="space-y-3">
            {SESSIONS.map((s, i) => (
              <div
                key={s.device}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                data-ocid={`profile.session.${i + 1}`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {s.device}
                  </p>
                  <p className="text-xs text-gray-400">
                    {s.location} · {s.ip} · {s.lastActive}
                  </p>
                </div>
                {s.current ? (
                  <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                    Current
                  </span>
                ) : (
                  <button
                    type="button"
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                    data-ocid={`profile.revoke_session.${i + 1}`}
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Activity log card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left font-semibold text-gray-600">
                    Date &amp; Time
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-600">
                    Action
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-600 hidden md:table-cell">
                    Resource
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ACTIVITY_LOGS.map((log, i) => (
                  <tr
                    key={log.action}
                    data-ocid={`profile.activity_row.${i + 1}`}
                  >
                    <td className="p-3 text-xs text-gray-400">{log.date}</td>
                    <td className="p-3 text-gray-700">{log.action}</td>
                    <td className="p-3 text-xs text-gray-500 hidden md:table-cell">
                      {log.resource}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
