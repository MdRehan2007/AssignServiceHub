import { AdminLayout } from "@/layouts/AdminLayout";
import {
  Bell,
  Eye,
  Layout,
  Palette,
  RotateCcw,
  Save,
  Type,
} from "lucide-react";
import { useState } from "react";

interface DesignState {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  sidebarWidth: number;
  sidebarPosition: "left" | "right";
  borderRadius: number;
  showBanner: boolean;
  bannerText: string;
  maintenanceMode: boolean;
  acceptingOrders: boolean;
  animationSpeed: "slow" | "normal" | "fast";
}

const DEFAULT_DESIGN: DesignState = {
  primaryColor: "#2563eb",
  accentColor: "#7c3aed",
  fontFamily: "Inter",
  sidebarWidth: 256,
  sidebarPosition: "left",
  borderRadius: 12,
  showBanner: false,
  bannerText: "🚀 New service types available! Check out our updated pricing.",
  maintenanceMode: false,
  acceptingOrders: true,
  animationSpeed: "normal",
};

function ColorPicker({
  label,
  value,
  onChange,
  ocid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  ocid: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <div
          className="h-7 w-7 rounded-lg border border-gray-200 shadow-sm"
          style={{ background: value }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-14 cursor-pointer rounded-lg border-2 border-gray-400"
          data-ocid={ocid}
        />
        <span className="text-xs font-mono text-gray-500 w-16">{value}</span>
      </div>
    </div>
  );
}

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

function PreviewPanel({ design }: { design: DesignState }) {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      <p className="text-xs font-semibold text-gray-500 px-4 py-2 border-b border-gray-200 flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5" /> Preview
      </p>
      <div className="flex" style={{ height: 200 }}>
        {/* Mini sidebar */}
        <div
          className="flex flex-col pt-3 px-2 gap-1 flex-shrink-0"
          style={{
            width: design.sidebarWidth / 4,
            background: "#0f1117",
            borderRadius: `0 0 0 ${design.borderRadius / 3}px`,
          }}
        >
          {["Dash", "Orders", "Chat", "Settings"].map((label) => (
            <div
              key={label}
              className="px-2 py-1 rounded text-white"
              style={{
                fontSize: 7,
                background:
                  label === "Dash" ? design.primaryColor : "transparent",
                opacity: label === "Dash" ? 1 : 0.5,
              }}
            >
              {label}
            </div>
          ))}
        </div>
        {/* Mini content */}
        <div className="flex-1 p-3 flex flex-col gap-2">
          {design.showBanner && (
            <div
              className="text-white text-center rounded py-1 px-2 truncate"
              style={{ fontSize: 7, background: design.primaryColor }}
            >
              {design.bannerText}
            </div>
          )}
          <div className="flex gap-2">
            {["Orders", "Revenue", "Users"].map((label, i) => (
              <div
                key={label}
                className="flex-1 rounded p-1.5 border border-gray-200"
                style={{
                  borderRadius: design.borderRadius / 6,
                  background: i === 0 ? `${design.primaryColor}18` : "white",
                }}
              >
                <div
                  style={{
                    fontSize: 7,
                    fontFamily: design.fontFamily,
                    color: i === 0 ? design.primaryColor : "#6b7280",
                    fontWeight: 600,
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#111" }}>
                  42
                </div>
              </div>
            ))}
          </div>
          <div
            className="flex-1 rounded p-2 border border-gray-100"
            style={{
              borderRadius: design.borderRadius / 6,
              background: "white",
            }}
          >
            <div
              style={{
                fontSize: 7,
                color: "#9ca3af",
                fontFamily: design.fontFamily,
              }}
            >
              Analytics Chart Area
            </div>
            <div className="flex items-end gap-1 mt-2" style={{ height: 50 }}>
              {[40, 65, 80, 55, 90, 70].map((h, i) => (
                <div
                  key={`bar-${h}`}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${h}%`,
                    background:
                      i === 4 ? design.accentColor : design.primaryColor,
                    opacity: 0.7,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminDesign() {
  const [design, setDesign] = useState<DesignState>(DEFAULT_DESIGN);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof DesignState>(key: K, value: DesignState[K]) =>
    setDesign((prev) => ({ ...prev, [key]: value }));
  const reset = () => setDesign(DEFAULT_DESIGN);
  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AdminLayout pageTitle="Design Settings">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: controls */}
        <div className="space-y-5">
          {/* Theme */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">
                Colors & Typography
              </h3>
            </div>
            <ColorPicker
              label="Primary Color"
              value={design.primaryColor}
              onChange={(v) => set("primaryColor", v)}
              ocid="design.primary_color_input"
            />
            <ColorPicker
              label="Accent Color"
              value={design.accentColor}
              onChange={(v) => set("accentColor", v)}
              ocid="design.accent_color_input"
            />
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-700">Font Family</span>
              <select
                value={design.fontFamily}
                onChange={(e) => set("fontFamily", e.target.value)}
                className="text-sm border-2 border-gray-400 rounded-lg px-3 py-1.5"
                data-ocid="design.font_family_select"
              >
                {[
                  "Inter",
                  "Poppins",
                  "Roboto",
                  "Nunito",
                  "DM Sans",
                  "Outfit",
                ].map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-700">Border Radius</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={design.borderRadius}
                  onChange={(e) => set("borderRadius", Number(e.target.value))}
                  className="w-24"
                  data-ocid="design.border_radius_input"
                />
                <span className="text-xs text-gray-500 w-8">
                  {design.borderRadius}px
                </span>
              </div>
            </div>
          </div>

          {/* Layout */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Layout className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Layout</h3>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-700">Sidebar Width</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={200}
                  max={320}
                  step={8}
                  value={design.sidebarWidth}
                  onChange={(e) => set("sidebarWidth", Number(e.target.value))}
                  className="w-24"
                  data-ocid="design.sidebar_width_input"
                />
                <span className="text-xs text-gray-500 w-10">
                  {design.sidebarWidth}px
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-700">Sidebar Position</span>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {(["left", "right"] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => set("sidebarPosition", pos)}
                    className={`px-3 py-1.5 text-xs font-semibold capitalize ${
                      design.sidebarPosition === pos
                        ? "bg-blue-600 text-white"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                    data-ocid={`design.sidebar_${pos}_button`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-700">Animation Speed</span>
              <select
                value={design.animationSpeed}
                onChange={(e) =>
                  set(
                    "animationSpeed",
                    e.target.value as DesignState["animationSpeed"],
                  )
                }
                className="text-sm border-2 border-gray-400 rounded-lg px-3 py-1.5"
                data-ocid="design.animation_speed_select"
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </div>
          </div>

          {/* Banner */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Banner & System</h3>
            </div>
            <Toggle
              value={design.showBanner}
              onChange={(v) => set("showBanner", v)}
              label="Show Announcement Banner"
            />
            {design.showBanner && (
              <div className="py-3 border-b border-gray-100">
                <input
                  type="text"
                  value={design.bannerText}
                  onChange={(e) => set("bannerText", e.target.value)}
                  className="w-full border-2 border-gray-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-ocid="design.banner_text_input"
                />
              </div>
            )}
            <Toggle
              value={design.maintenanceMode}
              onChange={(v) => set("maintenanceMode", v)}
              label="Maintenance Mode"
            />
            <Toggle
              value={design.acceptingOrders}
              onChange={(v) => set("acceptingOrders", v)}
              label="Accepting New Orders"
            />
          </div>
        </div>

        {/* Right: preview + actions */}
        <div className="space-y-5">
          <PreviewPanel design={design} />

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Apply Changes</h3>
            <p className="text-sm text-gray-500 mb-5">
              Changes will be applied globally across all customer and admin
              dashboards after saving.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={reset}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600"
                data-ocid="design.reset_button"
              >
                <RotateCcw className="h-4 w-4" /> Reset to Default
              </button>
              <button
                type="button"
                onClick={save}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-xl transition-all ${
                  saved
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                data-ocid="design.save_button"
              >
                <Save className="h-4 w-4" />
                {saved ? "Applied!" : "Apply Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
