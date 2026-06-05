import { useAuth } from "@/hooks/useAuth";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { AlertTriangle, Bell, Clock, Globe, Trash2, X } from "lucide-react";
import { useState } from "react";

function Toggle({
  checked,
  onChange,
  ocid,
}: { checked: boolean; onChange: (v: boolean) => void; ocid: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      data-ocid={ocid}
      className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
        checked ? "bg-blue-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  value,
  onChange,
  ocid,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  ocid: string;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
      <div className="min-w-0 pr-4">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <Toggle checked={value} onChange={onChange} ocid={ocid} />
    </div>
  );
}

export function CustomerSettingsPage() {
  const { logout } = useAuth();
  const [notifSettings, setNotifSettings] = useState({
    orderUpdates: true,
    paymentAlerts: true,
    messageAlerts: true,
    promotional: false,
  });
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [saved, setSaved] = useState(false);

  const setNotif = (key: keyof typeof notifSettings) => (v: boolean) => {
    setNotifSettings((prev) => ({ ...prev, [key]: v }));
  };

  const handleSave = async () => {
    await new Promise((r) => setTimeout(r, 400));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <CustomerLayout pageTitle="Settings">
      <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
        {/* Notification settings */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-600" /> Notification Preferences
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Control which notifications you receive
          </p>
          <SettingRow
            label="Order Updates"
            description="Get notified when your order status changes"
            value={notifSettings.orderUpdates}
            onChange={setNotif("orderUpdates")}
            ocid="settings.order_updates_toggle"
          />
          <SettingRow
            label="Payment Alerts"
            description="Notifications for payment verification and receipts"
            value={notifSettings.paymentAlerts}
            onChange={setNotif("paymentAlerts")}
            ocid="settings.payment_alerts_toggle"
          />
          <SettingRow
            label="Message Alerts"
            description="In-app alerts when admin or writer sends you a message"
            value={notifSettings.messageAlerts}
            onChange={setNotif("messageAlerts")}
            ocid="settings.message_alerts_toggle"
          />
          <SettingRow
            label="Promotional"
            description="Offers, discounts, and platform announcements"
            value={notifSettings.promotional}
            onChange={setNotif("promotional")}
            ocid="settings.promotional_toggle"
          />
        </div>

        {/* Account preferences */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-600" /> Account Preferences
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Customize language and region settings
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="settings-language"
                className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"
              >
                <Globe className="h-3.5 w-3.5" /> Language
              </label>
              <select
                id="settings-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input-field"
                data-ocid="settings.language_select"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="te">Telugu</option>
                <option value="ta">Tamil</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="settings-timezone"
                className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"
              >
                <Clock className="h-3.5 w-3.5" /> Timezone
              </label>
              <select
                id="settings-timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="input-field"
                data-ocid="settings.timezone_select"
              >
                <option value="Asia/Kolkata">IST (UTC+5:30)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">EST (UTC-5)</option>
                <option value="Europe/London">GMT (UTC+0)</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary mt-4"
            data-ocid="settings.save_preferences_button"
          >
            {saved ? "Preferences Saved!" : "Save Preferences"}
          </button>
        </div>

        {/* Danger zone */}
        <div className="card p-6 border border-red-100">
          <h3 className="font-semibold text-red-700 mb-1 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Danger Zone
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Irreversible actions — proceed with caution
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
            data-ocid="settings.delete_account_button"
          >
            <Trash2 className="h-4 w-4" /> Delete My Account
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          data-ocid="settings.delete_dialog"
        >
          <div className="glass-modal w-full max-w-md p-6 animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h4 className="font-bold text-gray-900">Delete Account</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Close"
                data-ocid="settings.delete_dialog.close_button"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              This action is <strong>permanent and cannot be undone</strong>.
              All your orders, messages, and payment history will be deleted.
            </p>
            <p className="text-sm text-gray-700 mb-2">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE here"
              className="input-field mb-4"
              data-ocid="settings.delete_confirm_input"
            />
            <div className="flex gap-3">
              <button
                type="button"
                disabled={deleteConfirm !== "DELETE"}
                onClick={logout}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-40"
                data-ocid="settings.delete_confirm_button"
              >
                Delete Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm("");
                }}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50"
                data-ocid="settings.delete_dialog.cancel_button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
