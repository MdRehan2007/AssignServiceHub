import { useAuth } from "@/hooks/useAuth";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { Camera, Globe, Monitor, Save, Smartphone } from "lucide-react";
import { useState } from "react";

const LOGIN_HISTORY = [
  {
    date: "May 16, 2026, 08:45 AM",
    ip: "192.168.1.42",
    device: "Chrome / Windows 11",
  },
  {
    date: "May 15, 2026, 03:22 PM",
    ip: "192.168.1.42",
    device: "Safari / iOS 17",
  },
  { date: "May 13, 2026, 11:10 AM", ip: "10.0.0.15", device: "Chrome / macOS" },
];

export function CustomerProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("9876543210");
  const [dob, setDob] = useState("2004-03-15");
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await new Promise((r) => setTimeout(r, 500));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U";

  return (
    <CustomerLayout pageTitle="Profile">
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: avatar + ID card */}
          <div className="space-y-5">
            <div className="card p-6 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {initials}
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center hover:bg-gray-50 transition-colors"
                  aria-label="Change photo"
                  data-ocid="profile.change_photo_button"
                >
                  <Camera className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 text-lg">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <p className="text-xs text-blue-600 font-mono mt-1">
                  {user?.id}
                </p>
              </div>
              <div className="w-full pt-3 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Role</span>
                  <span className="font-medium text-gray-800 capitalize">
                    {user?.role}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Member Since</span>
                  <span className="font-medium text-gray-800">
                    {new Date(user?.createdAt ?? Date.now()).toLocaleDateString(
                      "en-IN",
                    )}
                  </span>
                </div>
                {user?.lastLogin && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last Login</span>
                    <span className="font-medium text-gray-800">
                      {new Date(user.lastLogin).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: edit forms */}
          <div className="lg:col-span-2 space-y-5">
            {/* Profile edit */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Edit Profile</h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="profile-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Full Name
                    </label>
                    <input
                      id="profile-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field"
                      data-ocid="profile.name_input"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="profile-phone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Phone Number
                    </label>
                    <input
                      id="profile-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field"
                      data-ocid="profile.phone_input"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="profile-dob"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Date of Birth
                    </label>
                    <input
                      id="profile-dob"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="input-field"
                      data-ocid="profile.dob_input"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="profile-email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <input
                      id="profile-email"
                      type="email"
                      value={user?.email ?? ""}
                      disabled
                      className="input-field opacity-60 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Email is used for login and cannot be changed.
                    </p>
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  data-ocid="profile.save_button"
                >
                  <Save className="h-4 w-4" />
                  {saved ? "Saved!" : "Save Changes"}
                </button>
              </form>
            </div>

            {/* Login history */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Monitor className="h-4 w-4 text-blue-600" /> Login History
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-xs text-gray-400 font-medium uppercase tracking-wide">
                        Date & Time
                      </th>
                      <th className="text-left py-2 text-xs text-gray-400 font-medium uppercase tracking-wide">
                        IP Address
                      </th>
                      <th className="text-left py-2 text-xs text-gray-400 font-medium uppercase tracking-wide">
                        Device
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {LOGIN_HISTORY.map((h, i) => (
                      <tr
                        key={h.date}
                        data-ocid={`profile.login_history.item.${i + 1}`}
                      >
                        <td className="py-3 text-gray-700">{h.date}</td>
                        <td className="py-3 font-mono text-xs text-gray-500">
                          {h.ip}
                        </td>
                        <td className="py-3 text-gray-500 flex items-center gap-1.5">
                          {h.device.includes("iOS") ? (
                            <Smartphone className="h-3.5 w-3.5" />
                          ) : h.device.includes("Chrome") ||
                            h.device.includes("Safari") ? (
                            <Globe className="h-3.5 w-3.5" />
                          ) : (
                            <Monitor className="h-3.5 w-3.5" />
                          )}
                          {h.device}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
