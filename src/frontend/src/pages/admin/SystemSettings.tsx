import { createActor } from "@/backend";
import { useMaintenanceContext } from "@/context/MaintenanceContext";
import { AdminLayout } from "@/layouts/AdminLayout";
import {
  deleteCollegePricing,
  getAllCollegesPricing,
  getColleges,
  getMaintenanceLogs,
  getSystemSettings,
  listPaperChargeConfigs,
  setCollegePricing,
  setContactSettings,
  setMaintenanceEndTime,
  setMaintenanceMessage,
  setMaintenanceMode,
  setMaintenanceReason,
  setPaperChargeConfigs,
} from "@/services/api";
import type { CollegePricingRow } from "@/services/api";
import type { PaperChargeConfig, SystemSettings } from "@/types";
import { generateAndDownloadReport } from "@/utils/pdfExport";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  AlertTriangle,
  Database,
  Download,
  Edit2,
  MessageCircle,
  PlusCircle,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";

const TABS = [
  "General",
  "Pricing",
  "Paper Charges",
  "Material Charges",
  "Payments",
  "Economics",
  "Recruitment",
  "Admins",
  "Colleges",
  "Validation",
  "Security",
  "Audit Logs",
  "Maintenance",
] as const;
type Tab = (typeof TABS)[number];

const SERVICE_TYPE_LABELS: Record<string, string> = {
  SoftCopy: "Soft Copy",
  HardCopy: "Hard Copy",
  RecordWriting: "Record Writing",
  NotesWriting: "Notes Writing",
  Other: "Other",
};

/** Services where paper charges apply (customers enter page count). */
const PAGE_BASED_SERVICE_TYPES = ["SoftCopy", "HardCopy", "Other"];

/** Services with a single flat rate — no per-page charge ever applies. */
const FLAT_RATE_SERVICE_TYPES = ["RecordWriting", "NotesWriting"];

const _ALL_SERVICE_TYPES = [
  "SoftCopy",
  "HardCopy",
  "RecordWriting",
  "NotesWriting",
  "Other",
];

const AUDIT_LOGS = [
  {
    id: "al1",
    date: "2026-05-16 09:23",
    admin: "Database Administrator",
    action: "Updated pricing",
    resource: "System Settings",
    ip: "192.168.1.1",
  },
  {
    id: "al2",
    date: "2026-05-15 14:45",
    admin: "Database Administrator",
    action: "Approved admin application",
    resource: "app_3",
    ip: "192.168.1.1",
  },
  {
    id: "al3",
    date: "2026-05-15 11:12",
    admin: "SRMAP01",
    action: "Changed order status",
    resource: "AF001XYZ",
    ip: "10.0.0.5",
  },
  {
    id: "al4",
    date: "2026-05-14 16:00",
    admin: "Database Administrator",
    action: "Added college",
    resource: "KL University",
    ip: "192.168.1.1",
  },
  {
    id: "al5",
    date: "2026-05-14 09:30",
    admin: "GITAM01",
    action: "Verified payment",
    resource: "AF003DEF",
    ip: "10.0.0.8",
  },
];

const PRICING_ROWS = [
  { service: "Hard Copy", basePrice: 500, urgencyCharge: 150 },
  { service: "Soft Copy", basePrice: 300, urgencyCharge: 100 },
  { service: "Record Writing", basePrice: 800, urgencyCharge: 200 },
  { service: "Notes Writing", basePrice: 400, urgencyCharge: 120 },
];

function Toggle({
  value,
  onChange,
  label,
}: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${value ? "bg-blue-600" : "bg-gray-300"}`}
      >
        <span
          className={`inline-block h-5 w-5 mt-0.5 ml-0.5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

function FieldRow({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  const id = `field-row-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 gap-4">
      <label
        htmlFor={id}
        className="text-sm text-gray-700 min-w-0 flex-shrink-0 w-48"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-sm border-2 border-gray-400 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

const DEFAULT_COLLEGE_PRICING: Omit<CollegePricingRow, "college"> = {
  softCopy: 300,
  hardCopy: 500,
  recordWriting: 800,
  notesWriting: 400,
  otherBase: 350,
  urgencyCharge: 150,
};

export function AdminSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("General");
  const [pricingRows, setPricingRows] = useState(PRICING_ROWS);
  const [saved, setSaved] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const [qrFileForUpload, setQrFileForUpload] = useState<File | null>(null);
  const [adminShare, setAdminShare] = useState("70");

  // Maintenance mode context
  const {
    maintenanceMode: ctxMaintMode,
    maintenanceEndTime: ctxEndTime,
    maintenanceMessage: ctxMessage,
    whatsappNumber: ctxWaNumber,
    whatsappLink: ctxWaLink,
    supportEmail: ctxSupportEmail,
    supportFormUrl: ctxSupportFormUrl,
    setMaintenanceMode: ctxSetMode,
    setMaintenanceEndTime: ctxSetEndTime,
    setMaintenanceMessage: ctxSetMessage,
  } = useMaintenanceContext();

  const [maintEndTime, setMaintEndTime] = useState<string>(ctxEndTime ?? "");
  const [maintMessage, setMaintMessage] = useState<string>(ctxMessage);
  const [maintReason, setMaintReason] = useState<string>("");
  const [maintSaving, setMaintSaving] = useState(false);

  // Emergency contact fields
  const [contactWaNumber, setContactWaNumber] = useState<string>(ctxWaNumber);
  const [contactWaLink, setContactWaLink] = useState<string>(ctxWaLink);
  const [contactSupportEmail, setContactSupportEmail] =
    useState<string>(ctxSupportEmail);
  const [contactSupportFormUrl, setContactSupportFormUrl] =
    useState<string>(ctxSupportFormUrl);
  const [contactSaved, setContactSaved] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  type MaintLog = {
    enabledBy: string;
    enabledTime: number;
    disabledTime: number | null;
    reason: string;
    affectedUsersCount: number;
  };
  const [maintLogs, setMaintLogs] = useState<MaintLog[]>([]);

  // College-wise pricing state
  const [collegeList, setCollegeList] = useState<string[]>([]);
  const [collegesPricing, setCollegesPricing] = useState<CollegePricingRow[]>(
    [],
  );
  const [pricingCollege, setPricingCollege] = useState("");
  const [cpForm, setCpForm] = useState<Omit<CollegePricingRow, "college">>(
    DEFAULT_COLLEGE_PRICING,
  );
  const [cpSaving, setCpSaving] = useState(false);
  const [cpSaved, setCpSaved] = useState(false);
  const [cpEditCollege, setCpEditCollege] = useState<string | null>(null);

  // Paper charges state
  const [paperChargeConfigs, setPaperChargeConfigsState] = useState<
    PaperChargeConfig[]
  >([]);
  const [pcSaving, setPcSaving] = useState(false);
  const [pcSaved, setPcSaved] = useState(false);

  // Material charges state
  const { actor } = useActor(createActor);
  const [recordBookPrice, setRecordBookPrice] = useState("60");
  const [notebookPrice, setNotebookPrice] = useState("50");
  const [mcSaving, setMcSaving] = useState(false);
  const [mcSaved, setMcSaved] = useState(false);
  const [mcError, setMcError] = useState<string | null>(null);

  useEffect(() => {
    getSystemSettings().then((s) => {
      setSettings(s);
      // Sync emergency contact fields from backend on load
      if (s.whatsappNumber) setContactWaNumber(s.whatsappNumber);
      if (s.whatsappLink) setContactWaLink(s.whatsappLink);
      if (s.supportEmail) setContactSupportEmail(s.supportEmail);
      if (s.supportFormUrl) setContactSupportFormUrl(s.supportFormUrl);
    });
    getColleges().then((cols) => setCollegeList(cols.map((c) => c.name)));
    getAllCollegesPricing().then(setCollegesPricing);
    listPaperChargeConfigs()
      .then(setPaperChargeConfigsState)
      .catch(() => {});
    getMaintenanceLogs()
      .then(setMaintLogs)
      .catch(() => {});
  }, []);

  // Fetch material prices when actor becomes available
  useEffect(() => {
    if (!actor) {
      // Try localStorage fallback
      try {
        const raw = localStorage.getItem("assignflow_material_prices");
        if (raw) {
          const p = JSON.parse(raw) as {
            recordBookPrice: number;
            notebookPrice: number;
          };
          setRecordBookPrice(String(p.recordBookPrice));
          setNotebookPrice(String(p.notebookPrice));
        }
      } catch {}
      return;
    }
    actor
      .getMaterialPrices()
      .then((prices) => {
        setRecordBookPrice(String(Number(prices.recordBookPrice)));
        setNotebookPrice(String(Number(prices.notebookPrice)));
      })
      .catch(() => {});
  }, [actor]);

  const save = async () => {
    if (qrFileForUpload) {
      /* QR is handled in handleQrFile */
    }
    try {
      // Persist contact/maintenance settings to backend
      await setContactSettings({
        whatsappNumber: contactWaNumber,
        whatsappLink: contactWaLink,
        supportEmail: contactSupportEmail,
        supportFormUrl: contactSupportFormUrl,
      }).catch(() => {});
      // General settings persisted to localStorage as fallback
      if (settings) {
        localStorage.setItem(
          "siteSettings",
          JSON.stringify({
            siteName: settings.siteName,
            maintenanceMode: settings.maintenanceMode,
            allowRegistrations: settings.allowRegistrations,
            upiId: settings.upiId,
          }),
        );
      }
    } catch (_) {
      // best-effort; don't block the save indicator
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleEditCollegePricing = (row: CollegePricingRow) => {
    setCpEditCollege(row.college);
    setPricingCollege(row.college);
    setCpForm({
      softCopy: row.softCopy,
      hardCopy: row.hardCopy,
      recordWriting: row.recordWriting,
      notesWriting: row.notesWriting,
      otherBase: row.otherBase,
      urgencyCharge: row.urgencyCharge,
    });
  };

  const handleSaveCollegePricing = async () => {
    if (!pricingCollege) return;
    setCpSaving(true);
    try {
      const row: CollegePricingRow = { college: pricingCollege, ...cpForm };
      await setCollegePricing(row);
      const updated = await getAllCollegesPricing();
      setCollegesPricing(updated);
      setCpSaved(true);
      setCpEditCollege(null);
      setPricingCollege("");
      setCpForm(DEFAULT_COLLEGE_PRICING);
      setTimeout(() => setCpSaved(false), 2500);
    } finally {
      setCpSaving(false);
    }
  };

  const handleResetCollegePricing = async (college: string) => {
    await deleteCollegePricing(college);
    const updated = await getAllCollegesPricing();
    setCollegesPricing(updated);
  };

  const exportAuditPDF = () => {
    generateAndDownloadReport(
      "System Audit Log",
      "audit_log",
      ["Date", "Admin", "Action", "Resource", "IP"],
      AUDIT_LOGS.map((l) => [l.date, l.admin, l.action, l.resource, l.ip]),
    );
  };

  const renderTabContent = () => {
    if (!settings)
      return (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      );

    switch (activeTab) {
      case "General":
        return (
          <div>
            <FieldRow
              label="Website Name"
              value={settings.siteName}
              onChange={(v) =>
                setSettings((s) => (s ? { ...s, siteName: v } : s))
              }
            />
            <FieldRow
              label="Support Email"
              value="support@assignflow.in"
              onChange={() => {}}
              type="email"
            />
            <Toggle
              value={settings.maintenanceMode}
              onChange={(v) =>
                setSettings((s) => (s ? { ...s, maintenanceMode: v } : s))
              }
              label="Maintenance Mode"
            />
            <Toggle
              value={!settings.allowRegistrations}
              onChange={(v) =>
                setSettings((s) => (s ? { ...s, allowRegistrations: !v } : s))
              }
              label="Block New Registrations"
            />
            <Toggle
              value={settings.notificationsEnabled}
              onChange={(v) =>
                setSettings((s) => (s ? { ...s, notificationsEnabled: v } : s))
              }
              label="Enable Notifications"
            />
          </div>
        );
      case "Paper Charges": {
        const handleSavePaperCharges = async () => {
          setPcSaving(true);
          try {
            await setPaperChargeConfigs(paperChargeConfigs);
            setPcSaved(true);
            setTimeout(() => setPcSaved(false), 2500);
          } finally {
            setPcSaving(false);
          }
        };
        return (
          <div className="space-y-5">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-800 mb-1">
                Paper Charges Configuration
              </p>
              <p className="text-xs text-blue-600">
                Configure paper charges for page-based services (Soft Copy, Hard
                Copy). Record Writing and Notes Writing use a single flat rate
                set in the Pricing tab.
              </p>
            </div>
            <div className="space-y-6">
              {/* Flat-rate services — no per-page charge */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                  Flat-Rate Services
                </p>
                <div className="space-y-3">
                  {FLAT_RATE_SERVICE_TYPES.map((svcType) => (
                    <div
                      key={svcType}
                      className="rounded-xl border border-amber-100 bg-amber-50/40 p-4"
                      data-ocid={`settings.flat_rate_service.${svcType.toLowerCase()}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-800">
                            {SERVICE_TYPE_LABELS[svcType]}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            Flat Rate
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 italic">
                          One fixed price — no per-page charge
                        </span>
                      </div>
                      <p className="text-xs text-amber-700 mt-2">
                        Base price is set in the{" "}
                        <button
                          type="button"
                          className="underline hover:no-underline"
                          onClick={() => setActiveTab("Pricing")}
                        >
                          Pricing tab
                        </button>
                        . Customers are charged one flat amount regardless of
                        pages.
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Page-based services — paper charge toggle + rate */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                  Page-Based Services
                </p>
                <div className="space-y-3">
                  {PAGE_BASED_SERVICE_TYPES.map((svcType) => {
                    const cfg = paperChargeConfigs.find(
                      (c) => c.serviceType === svcType,
                    ) ?? {
                      serviceType: svcType,
                      paperChargeEnabled: false,
                      paperChargePerPage: 2,
                    };
                    return (
                      <div
                        key={svcType}
                        className={`rounded-xl border p-4 transition-colors ${
                          cfg.paperChargeEnabled
                            ? "border-blue-200 bg-blue-50/50"
                            : "border-gray-100 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = paperChargeConfigs.filter(
                                  (c) => c.serviceType !== svcType,
                                );
                                setPaperChargeConfigsState([
                                  ...updated,
                                  {
                                    ...cfg,
                                    paperChargeEnabled: !cfg.paperChargeEnabled,
                                  },
                                ]);
                              }}
                              className={`relative inline-flex h-6 w-11 rounded-full transition-colors flex-shrink-0 ${
                                cfg.paperChargeEnabled
                                  ? "bg-blue-600"
                                  : "bg-gray-300"
                              }`}
                              aria-label={`Toggle paper charges for ${SERVICE_TYPE_LABELS[svcType]}`}
                              data-ocid={`settings.paper_charge_toggle.${svcType.toLowerCase()}`}
                            >
                              <span
                                className={`inline-block h-5 w-5 mt-0.5 ml-0.5 rounded-full bg-white shadow transition-transform ${
                                  cfg.paperChargeEnabled
                                    ? "translate-x-5"
                                    : "translate-x-0"
                                }`}
                              />
                            </button>
                            <span className="text-sm font-medium text-gray-800">
                              {SERVICE_TYPE_LABELS[svcType]}
                            </span>
                          </div>
                          {cfg.paperChargeEnabled && (
                            <div className="flex items-center gap-2">
                              <label
                                htmlFor={`pc-rate-${svcType}`}
                                className="text-xs text-gray-600 whitespace-nowrap"
                              >
                                ₹ per page
                              </label>
                              <input
                                id={`pc-rate-${svcType}`}
                                type="number"
                                min={0}
                                value={cfg.paperChargePerPage}
                                onChange={(e) => {
                                  const updated = paperChargeConfigs.filter(
                                    (c) => c.serviceType !== svcType,
                                  );
                                  setPaperChargeConfigsState([
                                    ...updated,
                                    {
                                      ...cfg,
                                      paperChargePerPage: Number(
                                        e.target.value,
                                      ),
                                    },
                                  ]);
                                }}
                                className="w-20 border-2 border-gray-400 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                                data-ocid={`settings.paper_charge_rate.${svcType.toLowerCase()}`}
                              />
                            </div>
                          )}
                        </div>
                        {cfg.paperChargeEnabled && (
                          <p className="text-xs text-blue-600 mt-2">
                            Customers ordering {SERVICE_TYPE_LABELS[svcType]}{" "}
                            will see a "Number of Pages" field. Total = Base +
                            (paper charge × pages) + Urgency.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSavePaperCharges}
              disabled={pcSaving}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
                pcSaved
                  ? "bg-emerald-600 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              data-ocid="settings.save_paper_charges_button"
            >
              <Save className="h-4 w-4" />
              {pcSaving
                ? "Saving..."
                : pcSaved
                  ? "Saved!"
                  : "Save Paper Charges"}
            </button>
          </div>
        );
      }
      case "Material Charges": {
        const handleSaveMaterialCharges = async () => {
          setMcSaving(true);
          setMcError(null);
          try {
            const rbPrice = Math.max(0, Number(recordBookPrice) || 0);
            const nbPrice = Math.max(0, Number(notebookPrice) || 0);
            if (actor) {
              await actor.setMaterialPrices(BigInt(rbPrice), BigInt(nbPrice));
            }
            // Also save to localStorage as fallback
            localStorage.setItem(
              "assignflow_material_prices",
              JSON.stringify({
                recordBookPrice: rbPrice,
                notebookPrice: nbPrice,
              }),
            );
            setMcSaved(true);
            setTimeout(() => setMcSaved(false), 2500);
          } catch (_err) {
            setMcError("Failed to save. Please try again.");
          } finally {
            setMcSaving(false);
          }
        };
        return (
          <div className="space-y-5">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-800 mb-1">
                Material Purchase Prices
              </p>
              <p className="text-xs text-blue-600">
                Set the prices for Record Book and Notebook. Customers can opt
                to purchase the material through the platform when placing
                Record Writing or Notes Writing orders.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="mc-record-book-price"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Record Book Price (₹)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 font-medium">₹</span>
                  <input
                    id="mc-record-book-price"
                    type="number"
                    min={0}
                    value={recordBookPrice}
                    onChange={(e) => setRecordBookPrice(e.target.value)}
                    placeholder="e.g. 60"
                    className="w-40 border-2 border-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-ocid="settings.record_book_price_input"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Charged when customer selects &quot;Buy Record Book for
                  me&quot;
                </p>
              </div>
              <div>
                <label
                  htmlFor="mc-notebook-price"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Notebook Price (₹)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 font-medium">₹</span>
                  <input
                    id="mc-notebook-price"
                    type="number"
                    min={0}
                    value={notebookPrice}
                    onChange={(e) => setNotebookPrice(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-40 border-2 border-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-ocid="settings.notebook_price_input"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Charged when customer selects &quot;Buy Notebook for me&quot;
                </p>
              </div>
            </div>
            {mcError && (
              <p
                className="text-sm text-red-600"
                data-ocid="settings.material_charges.error_state"
              >
                {mcError}
              </p>
            )}
            <button
              type="button"
              onClick={handleSaveMaterialCharges}
              disabled={mcSaving}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
                mcSaved
                  ? "bg-emerald-600 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              data-ocid="settings.save_material_charges_button"
            >
              <Save className="h-4 w-4" />
              {mcSaving
                ? "Saving..."
                : mcSaved
                  ? "Saved!"
                  : "Save Material Charges"}
            </button>
          </div>
        );
      }
      case "Pricing":
        return (
          <div className="space-y-8">
            {/* Global Default Pricing */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Global Default Pricing
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-3 text-left font-semibold text-gray-600">
                        Service Type
                      </th>
                      <th className="p-3 text-right font-semibold text-gray-600">
                        Base Price (₹)
                      </th>
                      <th className="p-3 text-right font-semibold text-gray-600">
                        Urgency Charge (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pricingRows.map((row, i) => (
                      <tr key={row.service}>
                        <td className="p-3 font-medium text-gray-700">
                          {row.service}
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            value={row.basePrice}
                            onChange={(e) =>
                              setPricingRows((prev) =>
                                prev.map((r, ri) =>
                                  ri === i
                                    ? {
                                        ...r,
                                        basePrice: Number(e.target.value),
                                      }
                                    : r,
                                ),
                              )
                            }
                            className="w-24 text-right border-2 border-gray-400 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ml-auto block"
                            data-ocid={`settings.pricing_base.${i + 1}`}
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            value={row.urgencyCharge}
                            onChange={(e) =>
                              setPricingRows((prev) =>
                                prev.map((r, ri) =>
                                  ri === i
                                    ? {
                                        ...r,
                                        urgencyCharge: Number(e.target.value),
                                      }
                                    : r,
                                ),
                              )
                            }
                            className="w-24 text-right border-2 border-gray-400 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ml-auto block"
                            data-ocid={`settings.pricing_urgency.${i + 1}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* College-wise Pricing */}
            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center gap-2 mb-1">
                <PlusCircle className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-800">
                  College-wise Pricing
                </h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Set different prices for each college. If no custom pricing is
                set, the global default prices above are used.
              </p>

              {/* Form */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="cp-college"
                      className="block text-xs font-semibold text-gray-600 mb-1"
                    >
                      Select College *
                    </label>
                    <select
                      id="cp-college"
                      value={pricingCollege}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPricingCollege(val);
                        // Pre-fill form if existing pricing found
                        const existing = collegesPricing.find(
                          (r) => r.college === val,
                        );
                        if (existing) {
                          setCpForm({
                            softCopy: existing.softCopy,
                            hardCopy: existing.hardCopy,
                            recordWriting: existing.recordWriting,
                            notesWriting: existing.notesWriting,
                            otherBase: existing.otherBase,
                            urgencyCharge: existing.urgencyCharge,
                          });
                          setCpEditCollege(val);
                        } else {
                          setCpForm(DEFAULT_COLLEGE_PRICING);
                          setCpEditCollege(null);
                        }
                      }}
                      className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      data-ocid="settings.college_pricing_select"
                    >
                      <option value="">Select a college to set pricing</option>
                      {collegeList.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(
                    [
                      { key: "softCopy", label: "Soft Copy (₹)" },
                      { key: "hardCopy", label: "Hard Copy (₹)" },
                      { key: "recordWriting", label: "Record Writing (₹)" },
                      { key: "notesWriting", label: "Notes Writing (₹)" },
                      { key: "otherBase", label: "Other Base (₹)" },
                      { key: "urgencyCharge", label: "Urgency Charge (₹)" },
                    ] as { key: keyof typeof cpForm; label: string }[]
                  ).map(({ key, label }) => (
                    <div key={key}>
                      <label
                        htmlFor={`cp-${key}`}
                        className="block text-xs font-semibold text-gray-600 mb-1"
                      >
                        {label}
                      </label>
                      <input
                        id={`cp-${key}`}
                        type="number"
                        min={0}
                        value={cpForm[key]}
                        onChange={(e) =>
                          setCpForm((prev) => ({
                            ...prev,
                            [key]: Number(e.target.value),
                          }))
                        }
                        className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        data-ocid={`settings.cp_${key}_input`}
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSaveCollegePricing}
                  disabled={!pricingCollege || cpSaving}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
                    cpSaved
                      ? "bg-emerald-600 text-white"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                  data-ocid="settings.save_college_pricing_button"
                >
                  <Save className="h-4 w-4" />
                  {cpSaving
                    ? "Saving..."
                    : cpSaved
                      ? "Saved!"
                      : cpEditCollege
                        ? "Update College Pricing"
                        : "Save College Pricing"}
                </button>
              </div>

              {/* Existing College Pricing Table */}
              {collegesPricing.length > 0 ? (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-xs md:text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">
                          College
                        </th>
                        <th className="p-2.5 text-right font-semibold text-gray-600 whitespace-nowrap">
                          Soft Copy
                        </th>
                        <th className="p-2.5 text-right font-semibold text-gray-600 whitespace-nowrap">
                          Hard Copy
                        </th>
                        <th className="p-2.5 text-right font-semibold text-gray-600 whitespace-nowrap hidden sm:table-cell">
                          Record Writing
                        </th>
                        <th className="p-2.5 text-right font-semibold text-gray-600 whitespace-nowrap hidden sm:table-cell">
                          Notes Writing
                        </th>
                        <th className="p-2.5 text-right font-semibold text-gray-600 whitespace-nowrap">
                          Urgency
                        </th>
                        <th className="p-2.5 text-center font-semibold text-gray-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {collegesPricing.map((row, i) => (
                        <tr
                          key={row.college}
                          data-ocid={`settings.college_pricing_row.${i + 1}`}
                        >
                          <td className="p-2.5 font-semibold text-gray-800 whitespace-nowrap">
                            {row.college}
                          </td>
                          <td className="p-2.5 text-right text-gray-700">
                            ₹{row.softCopy}
                          </td>
                          <td className="p-2.5 text-right text-gray-700">
                            ₹{row.hardCopy}
                          </td>
                          <td className="p-2.5 text-right text-gray-700 hidden sm:table-cell">
                            ₹{row.recordWriting}
                          </td>
                          <td className="p-2.5 text-right text-gray-700 hidden sm:table-cell">
                            ₹{row.notesWriting}
                          </td>
                          <td className="p-2.5 text-right text-gray-700">
                            ₹{row.urgencyCharge}
                          </td>
                          <td className="p-2.5">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditCollegePricing(row)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                aria-label={`Edit ${row.college} pricing`}
                                data-ocid={`settings.college_pricing_edit.${i + 1}`}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleResetCollegePricing(row.college)
                                }
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                aria-label={`Reset ${row.college} pricing to default`}
                                data-ocid={`settings.college_pricing_reset.${i + 1}`}
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
              ) : (
                <div className="mt-4 text-center py-6 border border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                  No college-specific pricing set yet. All colleges use global
                  default pricing.
                </div>
              )}

              {/* Colleges using default */}
              {collegeList.filter(
                (c) => !collegesPricing.some((r) => r.college === c),
              ).length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">
                    Using global default pricing:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {collegeList
                      .filter(
                        (c) => !collegesPricing.some((r) => r.college === c),
                      )
                      .map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs"
                        >
                          {c}{" "}
                          <span className="text-gray-400">(using default)</span>
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case "Payments": {
        const handleQrFile = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (qrPreviewUrl) URL.revokeObjectURL(qrPreviewUrl);
          setQrPreviewUrl(URL.createObjectURL(file));
          setQrFileForUpload(file);
          // Persist QR to localStorage for cross-session availability
          const reader = new FileReader();
          reader.onload = (evt) => {
            const base64 = evt.target?.result as string;
            if (base64) {
              localStorage.setItem("adminQrCodeUrl", base64);
            }
          };
          reader.readAsDataURL(file);
        };
        return (
          <div>
            <FieldRow
              label="UPI ID"
              value={settings.upiId}
              onChange={(v) => setSettings((s) => (s ? { ...s, upiId: v } : s))}
            />
            <div className="py-3 border-b border-gray-100">
              <p className="text-sm text-gray-700 mb-3">QR Code Image</p>
              <label
                htmlFor="qr-upload-input"
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
              >
                {qrPreviewUrl ? (
                  <img
                    src={qrPreviewUrl}
                    alt="QR code preview"
                    className="max-h-48 max-w-[200px] object-contain rounded-lg mb-2 border border-gray-200"
                  />
                ) : (
                  <>
                    <svg
                      className="h-10 w-10 text-gray-300 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-label="Upload QR code image"
                      role="img"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <p className="text-sm text-gray-400">
                      Click to upload QR code image
                    </p>
                    <p className="text-xs text-gray-300 mt-1">
                      PNG, JPG, JPEG supported
                    </p>
                  </>
                )}
                <input
                  id="qr-upload-input"
                  type="file"
                  accept="image/png,image/jpg,image/jpeg,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleQrFile}
                  data-ocid="settings.qr_upload_button"
                />
              </label>
              {qrPreviewUrl && (
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-emerald-600 font-medium">
                    ✓ QR code uploaded successfully
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(qrPreviewUrl);
                      setQrPreviewUrl(null);
                    }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            <Toggle
              value={true}
              onChange={() => {}}
              label="Show QR to Customers"
            />
            <Toggle
              value={true}
              onChange={() => {}}
              label="Require Payment Before Assignment"
            />
          </div>
        );
      }
      case "Economics": {
        const adminShareNum = Number(adminShare) || 0;
        const headShare = Math.max(0, 100 - adminShareNum);
        const sampleOrder = 800;
        const adminAmt = Math.round((sampleOrder * adminShareNum) / 100);
        const headAmt = sampleOrder - adminAmt;
        return (
          <div>
            <FieldRow
              label="Database Admin Share (%)"
              value={String(headShare)}
              onChange={() => {}}
              type="number"
            />
            <FieldRow
              label="Admin Share (%)"
              value={adminShare}
              onChange={setAdminShare}
              type="number"
            />
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-700 mb-2">
                Share Calculation Preview
              </p>
              <p className="text-xs text-blue-600">
                For ₹{sampleOrder} order: Database Admin ₹{headAmt} · Admin ₹
                {adminAmt}
              </p>
              <p className="text-xs text-blue-400 mt-1">
                Database Admin Share is auto-calculated as the remaining
                percentage.
              </p>
            </div>
          </div>
        );
      }
      case "Recruitment":
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-800 mb-1">
                College Admin Applications
              </p>
              <p className="text-sm text-blue-700">
                Manage incoming College Admin applications. Approved admins gain
                access to their college's order dashboard and can accept,
                manage, and deliver assignments.
              </p>
            </div>
            <Toggle
              value={true}
              onChange={() => {}}
              label="Accept College Admin Applications"
            />
            <Toggle
              value={false}
              onChange={() => {}}
              label="Auto-Approve Admin Registrations"
            />
            <FieldRow
              label="Max Active Admins per College"
              value="10"
              onChange={() => {}}
              type="number"
            />
          </div>
        );
      case "Admins":
        return (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              All admin accounts are managed here.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left font-semibold text-gray-600">
                    Admin ID
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-600">
                    Name
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-600">
                    College
                  </th>
                  <th className="p-3 text-center font-semibold text-gray-600">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  {
                    id: "HEAD01",
                    name: "Database Administrator",
                    college: "—",
                    role: "Database Admin",
                  },
                  {
                    id: "SRMAP01",
                    name: "Ravi Kumar",
                    college: "SRMAP",
                    role: "College Admin",
                  },
                  {
                    id: "GITAM01",
                    name: "Anjali Devi",
                    college: "Gitam",
                    role: "College Admin",
                  },
                ].map((a) => (
                  <tr key={a.id}>
                    <td className="p-3 font-mono text-xs text-blue-600">
                      {a.id}
                    </td>
                    <td className="p-3 font-medium text-gray-800">{a.name}</td>
                    <td className="p-3 text-gray-500">{a.college}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {a.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "Colleges":
        return (
          <div>
            <p className="text-sm text-gray-500">
              Manage colleges from the Colleges page. This tab shows a read-only
              overview.
            </p>
          </div>
        );

      case "Validation":
        return (
          <div>
            <Toggle
              value={true}
              onChange={() => {}}
              label="Validate File Types on Upload"
            />
            <Toggle
              value={true}
              onChange={() => {}}
              label="Require Order Description (min 50 chars)"
            />
            <Toggle
              value={false}
              onChange={() => {}}
              label="Allow Duplicate Orders"
            />
            <Toggle
              value={true}
              onChange={() => {}}
              label="Auto-reject orders without payment in 48h"
            />
          </div>
        );
      case "Security":
        return (
          <div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="sys-new-password"
                  className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block"
                >
                  New Admin Password
                </label>
                <input
                  id="sys-new-password"
                  type="password"
                  placeholder="Enter new password"
                  className="w-full border-2 border-gray-400 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-ocid="settings.new_password_input"
                />
              </div>
              <div>
                <label
                  htmlFor="sys-confirm-password"
                  className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block"
                >
                  Confirm Password
                </label>
                <input
                  id="sys-confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full border-2 border-gray-400 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-ocid="settings.confirm_password_input"
                />
              </div>
            </div>
            <Toggle
              value={true}
              onChange={() => {}}
              label="Force Password Change on First Login"
            />
            <Toggle
              value={false}
              onChange={() => {}}
              label="Enable Two-Factor Authentication"
            />
          </div>
        );
      case "Audit Logs":
        return (
          <div>
            <div className="flex justify-end mb-3">
              <button
                type="button"
                onClick={exportAuditPDF}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                data-ocid="settings.audit_export_button"
              >
                <Download className="h-4 w-4" /> Download PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left font-semibold text-gray-600">
                      Date
                    </th>
                    <th className="p-3 text-left font-semibold text-gray-600">
                      Admin
                    </th>
                    <th className="p-3 text-left font-semibold text-gray-600">
                      Action
                    </th>
                    <th className="p-3 text-left font-semibold text-gray-600 hidden md:table-cell">
                      Resource
                    </th>
                    <th className="p-3 text-left font-semibold text-gray-600 hidden lg:table-cell">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {AUDIT_LOGS.map((log, i) => (
                    <tr key={log.id} data-ocid={`settings.audit_row.${i + 1}`}>
                      <td className="p-3 text-xs text-gray-400">{log.date}</td>
                      <td className="p-3 font-medium text-gray-800">
                        {log.admin}
                      </td>
                      <td className="p-3 text-gray-600">{log.action}</td>
                      <td className="p-3 text-gray-500 text-xs hidden md:table-cell font-mono">
                        {log.resource}
                      </td>
                      <td className="p-3 text-gray-400 text-xs hidden lg:table-cell">
                        {log.ip}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "Maintenance":
        return (
          <div className="space-y-5">
            {/* Warning notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">
                  Maintenance Control
                </p>
                <p className="text-xs text-yellow-600 mt-0.5">
                  When enabled, non-admin users will see the maintenance screen.
                  Admins continue to access the full platform.
                </p>
              </div>
            </div>

            {/* Live status preview */}
            <div
              className="rounded-xl border p-4 flex items-center justify-between gap-4"
              style={{
                borderColor: ctxMaintMode ? "#fbbf24" : "#d1fae5",
                background: ctxMaintMode ? "#fffbeb" : "#f0fdf4",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: ctxMaintMode ? "#f59e0b" : "#22c55e",
                    animation: ctxMaintMode
                      ? "maintenance-pulse 1.5s ease-in-out infinite"
                      : "none",
                    flexShrink: 0,
                  }}
                />
                <span
                  className="text-sm font-semibold"
                  style={{ color: ctxMaintMode ? "#92400e" : "#166534" }}
                >
                  Maintenance is:{" "}
                </span>
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{
                    background: ctxMaintMode ? "#f59e0b" : "#22c55e",
                    color: "#fff",
                  }}
                  data-ocid="maintenance.status_badge"
                >
                  {ctxMaintMode ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              {ctxEndTime && (
                <span className="text-xs text-gray-500">
                  Until {new Date(ctxEndTime).toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {/* Maintenance toggle */}
            <div className="rounded-xl border border-gray-100 p-4 space-y-4">
              <Toggle
                value={ctxMaintMode}
                onChange={async (v) => {
                  setMaintSaving(true);
                  try {
                    await setMaintenanceMode(v);
                    ctxSetMode(v);
                    if (v) {
                      // Save message and reason when enabling
                      await setMaintenanceMessage(maintMessage);
                      await setMaintenanceReason(maintReason);
                    } else {
                      await setMaintenanceEndTime(null);
                      ctxSetEndTime(null);
                      setMaintEndTime("");
                    }
                    setSettings((s) => (s ? { ...s, maintenanceMode: v } : s));
                    // Refresh logs
                    getMaintenanceLogs()
                      .then(setMaintLogs)
                      .catch(() => {});
                  } finally {
                    setMaintSaving(false);
                  }
                }}
                label={maintSaving ? "Saving..." : "Enable Maintenance Mode"}
              />

              {/* Estimated End Time */}
              <div>
                <label
                  htmlFor="maint-end-time"
                  className="block text-xs font-semibold text-gray-600 mb-1"
                >
                  Estimated End Time
                </label>
                <input
                  id="maint-end-time"
                  type="datetime-local"
                  value={maintEndTime}
                  onChange={(e) => {
                    setMaintEndTime(e.target.value);
                    ctxSetEndTime(e.target.value || null);
                    setMaintenanceEndTime(e.target.value || null);
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-ocid="maintenance.end_time_input"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Shown as countdown timer on the maintenance screen.
                </p>
              </div>

              {/* Custom message */}
              <div>
                <label
                  htmlFor="maint-reason"
                  className="block text-xs font-semibold text-gray-600 mb-1"
                >
                  Reason (optional)
                </label>
                <input
                  id="maint-reason"
                  type="text"
                  value={maintReason}
                  maxLength={120}
                  onChange={(e) => setMaintReason(e.target.value)}
                  placeholder="e.g. Upgrading payment system, database migration..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-ocid="maintenance.reason_input"
                />
              </div>

              <div>
                <label
                  htmlFor="maint-message"
                  className="block text-xs font-semibold text-gray-600 mb-1"
                >
                  Maintenance Message
                </label>
                <textarea
                  id="maint-message"
                  value={maintMessage}
                  maxLength={200}
                  rows={3}
                  onChange={(e) => {
                    setMaintMessage(e.target.value);
                    ctxSetMessage(e.target.value);
                    setMaintenanceMessage(e.target.value).catch(() => {});
                  }}
                  placeholder="We are performing scheduled maintenance to improve your experience."
                  className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  data-ocid="maintenance.message_input"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {maintMessage.length}/200
                </p>
              </div>
            </div>

            {/* Maintenance Logs */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Maintenance History
              </p>
              {maintLogs.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                  No maintenance history yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-3 text-left font-semibold text-gray-600 whitespace-nowrap">
                          Enabled By
                        </th>
                        <th className="p-3 text-left font-semibold text-gray-600 whitespace-nowrap">
                          Started
                        </th>
                        <th className="p-3 text-left font-semibold text-gray-600 whitespace-nowrap hidden sm:table-cell">
                          Ended
                        </th>
                        <th className="p-3 text-left font-semibold text-gray-600 whitespace-nowrap hidden md:table-cell">
                          Duration
                        </th>
                        <th className="p-3 text-left font-semibold text-gray-600 whitespace-nowrap hidden lg:table-cell">
                          Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {maintLogs.map((log, i) => {
                        const startMs =
                          log.enabledTime > 1e12
                            ? Math.floor(log.enabledTime / 1_000_000)
                            : log.enabledTime;
                        const endMs = log.disabledTime
                          ? log.disabledTime > 1e12
                            ? Math.floor(log.disabledTime / 1_000_000)
                            : log.disabledTime
                          : null;
                        const durationMs = endMs ? endMs - startMs : null;
                        const durationLabel = durationMs
                          ? durationMs < 60_000
                            ? `${Math.round(durationMs / 1000)}s`
                            : durationMs < 3_600_000
                              ? `${Math.round(durationMs / 60_000)} min`
                              : `${(durationMs / 3_600_000).toFixed(1)} hr`
                          : "Ongoing";
                        const rowKey = log.enabledBy
                          ? `mlog-${log.enabledBy}-${startMs}`
                          : `mlog-${i}-${startMs}`;
                        return (
                          <tr
                            key={rowKey}
                            data-ocid={`maintenance.log_row.${i + 1}`}
                          >
                            <td className="p-3 font-medium text-gray-800">
                              {log.enabledBy || "—"}
                            </td>
                            <td className="p-3 text-xs text-gray-500">
                              {new Date(startMs).toLocaleString()}
                            </td>
                            <td className="p-3 text-xs text-gray-500 hidden sm:table-cell">
                              {endMs ? (
                                new Date(endMs).toLocaleString()
                              ) : (
                                <span className="text-orange-500 font-semibold">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-xs text-gray-500 hidden md:table-cell">
                              {durationLabel}
                            </td>
                            <td className="p-3 text-xs text-gray-500 hidden lg:table-cell max-w-[200px] truncate">
                              {log.reason || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Emergency Contact Options */}
            <div className="border border-blue-100 rounded-xl p-4 space-y-4 bg-blue-50/50">
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Emergency Contact Options
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    These will appear on the maintenance page so users can still
                    reach you.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="contact-wa-number"
                    className="block text-xs font-semibold text-gray-600 mb-1"
                  >
                    📱 WhatsApp Number
                  </label>
                  <input
                    id="contact-wa-number"
                    type="text"
                    value={contactWaNumber}
                    onChange={(e) => setContactWaNumber(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    data-ocid="maintenance.whatsapp_number_input"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-wa-link"
                    className="block text-xs font-semibold text-gray-600 mb-1"
                  >
                    🔗 WhatsApp Link
                  </label>
                  <input
                    id="contact-wa-link"
                    type="text"
                    value={contactWaLink}
                    onChange={(e) => setContactWaLink(e.target.value)}
                    placeholder="https://wa.me/91XXXXXXXXXX"
                    className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    data-ocid="maintenance.whatsapp_link_input"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-support-email"
                    className="block text-xs font-semibold text-gray-600 mb-1"
                  >
                    ✉️ Support Email
                  </label>
                  <input
                    id="contact-support-email"
                    type="email"
                    value={contactSupportEmail}
                    onChange={(e) => setContactSupportEmail(e.target.value)}
                    placeholder="support@assignflow.com"
                    className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    data-ocid="maintenance.support_email_input"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-support-form"
                    className="block text-xs font-semibold text-gray-600 mb-1"
                  >
                    🔗 Support Form URL
                  </label>
                  <input
                    id="contact-support-form"
                    type="text"
                    value={contactSupportFormUrl}
                    onChange={(e) => setContactSupportFormUrl(e.target.value)}
                    placeholder="https://assignflow.com/support"
                    className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    data-ocid="maintenance.support_form_url_input"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={contactSaving}
                onClick={async () => {
                  setContactSaving(true);
                  try {
                    await setContactSettings({
                      whatsappNumber: contactWaNumber,
                      whatsappLink: contactWaLink,
                      supportEmail: contactSupportEmail,
                      supportFormUrl: contactSupportFormUrl,
                    });
                    setContactSaved(true);
                    setTimeout(() => setContactSaved(false), 2500);
                  } finally {
                    setContactSaving(false);
                  }
                }}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  contactSaved
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                data-ocid="maintenance.save_contact_button"
              >
                <Save className="h-4 w-4" />
                {contactSaving
                  ? "Saving..."
                  : contactSaved
                    ? "Saved!"
                    : "Save Contact Options"}
              </button>
            </div>

            {/* System actions */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                System Actions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700"
                  data-ocid="settings.backup_button"
                >
                  <Database className="h-4 w-4 text-blue-600" /> Backup Database
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700"
                  data-ocid="settings.clear_cache_button"
                >
                  <RefreshCw className="h-4 w-4 text-emerald-600" /> Clear Cache
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-3 border border-red-200 rounded-xl hover:bg-red-50 text-sm font-medium text-red-600"
                  data-ocid="settings.reset_button"
                >
                  <Wrench className="h-4 w-4" /> Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AdminLayout pageTitle="System Settings">
      <div className="flex gap-5">
        {/* Tab list — vertical on desktop */}
        <div className="hidden lg:flex flex-col w-48 flex-shrink-0 gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium rounded-xl text-left transition-colors ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              data-ocid={`settings.tab_${tab.toLowerCase().replace(/ /g, "_")}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {/* Mobile horizontal tabs */}
          <div className="lg:hidden flex gap-1 overflow-x-auto pb-2 mb-4">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-full transition-colors flex-shrink-0 ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-gray-900">
                  {activeTab}
                </h2>
              </div>
              {activeTab !== "Audit Logs" && activeTab !== "Maintenance" && (
                <button
                  type="button"
                  onClick={save}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    saved
                      ? "bg-emerald-600 text-white"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                  data-ocid="settings.save_button"
                >
                  <Save className="h-4 w-4" />
                  {saved ? "Saved!" : "Save Changes"}
                </button>
              )}
            </div>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
