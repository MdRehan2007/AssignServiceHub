import type { Backend } from "@/backend";
import type {
  AnalyticsData,
  College,
  DashboardSummary,
  Message,
  Notification,
  Order,
  Payment,
  PaymentAttempt,
  SupportTicket,
  SystemSettings,
} from "@/types";

// Actor is injected at call-site from React hooks (useActor)
type BackendActor = Backend;

export const ADMIN_SKILLS = [
  "Fast Typing",
  "English Grammar",
  "Academic Writing",
  "Research Skills",
  "Paraphrasing",
  "Proofreading",
  "Editing",
  "Formatting",
  "Citation Management",
  "Plagiarism Checking",
  "Microsoft Word",
  "Microsoft Excel",
  "Microsoft PowerPoint",
  "PDF Editing",
  "Data Entry",
  "Document Designing",
  "Report Writing",
  "Research Paper Writing",
  "Seminar Preparation",
  "Presentation Design",
  "File Management",
  "Internet Research",
  "Communication Skills",
  "Client Handling",
  "Time Management",
  "Critical Thinking",
  "Analytical Thinking",
  "AI Tool Usage",
  "Canva Designing",
  "Printing Management",
  "Spiral Binding",
  "Soft Copy Handling",
  "Hard Copy Preparation",
  "Reference Management",
  "Technical Writing",
  "Content Writing",
  "Copywriting",
  "Resume Writing",
  "Project Documentation",
  "Documentation Management",
  "Email Communication",
  "Problem Solving",
  "Attention to Detail",
  "Organization Skills",
  "Team Coordination",
  "Academic Formatting",
  "Google Docs",
  "Google Sheets",
  "Cloud Storage Management",
  "OCR Handling",
  "Data Collection",
  "Information Verification",
] as const;

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

const ORDERS_KEY = "assignflow_orders";
const COLLEGES_KEY = "assignflow_colleges";
const COLLEGE_PRICING_KEY = "assignflow_college_pricing";

export interface CollegePricingRow {
  college: string;
  softCopy: number;
  hardCopy: number;
  recordWriting: number;
  notesWriting: number;
  otherBase: number;
  urgencyCharge: number;
}

function getStoredCollegesPricing(): Map<string, CollegePricingRow> {
  try {
    const raw = localStorage.getItem(COLLEGE_PRICING_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as CollegePricingRow[];
      return new Map(arr.map((r) => [r.college, r]));
    }
  } catch {}
  return new Map();
}

function setStoredCollegesPricing(map: Map<string, CollegePricingRow>): void {
  localStorage.setItem(
    COLLEGE_PRICING_KEY,
    JSON.stringify(Array.from(map.values())),
  );
}

export async function setCollegePricing(row: CollegePricingRow): Promise<void> {
  await delay(300);
  const map = getStoredCollegesPricing();
  map.set(row.college, row);
  setStoredCollegesPricing(map);
}

export async function getCollegePricing(
  college: string,
): Promise<CollegePricingRow | null> {
  await delay(100);
  const map = getStoredCollegesPricing();
  return map.get(college) ?? null;
}

export async function getAllCollegesPricing(): Promise<CollegePricingRow[]> {
  await delay(100);
  return Array.from(getStoredCollegesPricing().values());
}

export async function deleteCollegePricing(college: string): Promise<void> {
  await delay(200);
  const map = getStoredCollegesPricing();
  map.delete(college);
  setStoredCollegesPricing(map);
}

function getStoredColleges(): College[] {
  try {
    const raw = localStorage.getItem(COLLEGES_KEY);
    if (raw) return JSON.parse(raw) as College[];
  } catch {
    // ignore
  }
  return [];
}

function setStoredColleges(colleges: College[]): void {
  localStorage.setItem(COLLEGES_KEY, JSON.stringify(colleges));
}

function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Order[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function setStoredOrders(orders: Order[]) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {}
}

export async function getOrders(userId?: string): Promise<Order[]> {
  await delay();
  const orders = getStoredOrders();
  if (userId)
    return orders.filter((o) => o.customerId === userId || userId === "all");
  return orders;
}

export async function createOrder(data: Partial<Order>): Promise<Order> {
  await delay(600);
  const order: Order = {
    id: `AF${Date.now().toString(36).toUpperCase()}`,
    customerId: data.customerId ?? "cust_1",
    customerName: data.customerName ?? "Customer",
    customerEmail: data.customerEmail ?? "",
    serviceType: data.serviceType ?? "SoftCopy",
    customServiceType: data.customServiceType,
    subjectName: data.subjectName ?? "",
    department: data.department ?? "",
    deadline: data.deadline ?? Date.now() + 86400000 * 3,
    isUrgent: data.isUrgent ?? false,
    description: data.description ?? "",
    status: "pendingPaymentVerification",
    paymentStatus: "pending_payment",
    amount: data.amount ?? 500,
    basePrice: data.basePrice,
    urgencyCharge: data.urgencyCharge,
    pageCount: data.pageCount,
    paperChargeAmount: data.paperChargeAmount,
    materialChoice: data.materialChoice,
    materialChargeAmount: data.materialChargeAmount,
    assignmentLockStatus: "unlocked",
    deliveryStatus: "notDelivered",
    revisionCount: 0,
    paymentSettlementStatus: "pending",
    college: data.college,
    customerPhone: data.customerPhone,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    statusHistory: [
      { status: "pendingPaymentVerification", timestamp: Date.now() },
    ],
  };
  const orders = getStoredOrders();
  orders.unshift(order);
  setStoredOrders(orders);
  return order;
}

export async function updateOrderStatus(
  id: string,
  status: Order["status"],
): Promise<void> {
  await delay();
  const orders = getStoredOrders();
  const order = orders.find((o) => o.id === id);
  if (order) {
    order.status = status;
    order.updatedAt = Date.now();
    order.statusHistory.push({ status, timestamp: Date.now() });
    setStoredOrders(orders);
  }
}

export async function getColleges(): Promise<College[]> {
  await delay();
  return getStoredColleges();
}

export async function addCollege(name: string): Promise<College> {
  await delay(200);
  const trimmed = name.trim();
  const existing = getStoredColleges();
  const dup = existing.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (dup) return dup;
  const newCollege: College = {
    id: `col_custom_${Date.now()}`,
    name: trimmed,
    code: trimmed.toUpperCase().slice(0, 8).replace(/\s+/g, ""),
    location: "Custom",
    adminIds: [],
    adminNames: [],
    adminCount: 0,
    totalStudents: 0,
    totalOrders: 0,
    revenue: 0,
    status: "active",
    createdAt: Date.now(),
  };
  existing.push(newCollege);
  setStoredColleges(existing);
  return newCollege;
}

export async function getPayments(userId?: string): Promise<Payment[]> {
  await delay();
  // Derive payments from stored orders
  const orders = getStoredOrders();
  const payments: Payment[] = orders
    .filter((o) => o.paymentStatus && o.paymentStatus !== "pending_payment")
    .map((o, i) => ({
      id: `pay_${o.id}_${i}`,
      orderId: o.id,
      customerId: o.customerId,
      amount: o.amount,
      status: o.paymentStatus as Payment["status"],
      method: o.transactionId ? "upi" : "qr",
      transactionId: o.transactionId,
      submittedAt: o.updatedAt,
      verifiedAt: o.paymentStatus === "verified" ? o.updatedAt : undefined,
    }));
  if (userId && userId !== "all")
    return payments.filter((p) => p.customerId === userId);
  return payments;
}

export async function getMessages(orderId: string): Promise<Message[]> {
  await delay();
  // Read messages from localStorage keyed by orderId
  try {
    const raw = localStorage.getItem(`assignflow_messages_${orderId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Message[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export async function sendMessage(
  orderId: string,
  content: string,
  sender: { id: string; name: string; role: string },
): Promise<Message> {
  await delay(200);
  const msg: Message = {
    id: `msg_${Date.now()}`,
    orderId,
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role as Message["senderRole"],
    content,
    timestamp: Date.now(),
    isRead: false,
  };
  // Persist to localStorage
  const key = `assignflow_messages_${orderId}`;
  const existing = await getMessages(orderId);
  localStorage.setItem(key, JSON.stringify([...existing, msg]));
  return msg;
}
export async function saveMessage(
  orderId: string,
  msg: Message,
): Promise<Message> {
  await delay(200);
  const key = `assignflow_messages_${orderId}`;
  const existing = await getMessages(orderId);
  const updated = [...existing, msg];
  localStorage.setItem(key, JSON.stringify(updated));
  return msg;
}

export async function deleteMessage(
  orderId: string,
  messageId: string,
): Promise<void> {
  await delay(200);
  const key = `assignflow_messages_${orderId}`;
  const existing = await getMessages(orderId);
  const updated = existing.filter((m) => m.id !== messageId);
  localStorage.setItem(key, JSON.stringify(updated));
}

const DELETABLE_STATUSES: Order["status"][] = [
  "completed",
  "delivered",
  "cancelled",
  "closed",
];

export async function deleteOrder(
  orderId: string,
  userId: string,
  userRole: string,
): Promise<{ ok: boolean; error?: string }> {
  await delay(200);
  const orders = getStoredOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, error: "Order not found" };
  if (!DELETABLE_STATUSES.includes(order.status))
    return {
      ok: false,
      error: "Only completed, delivered, or cancelled orders can be deleted",
    };
  const isOwner = order.customerId === userId;
  const isAssignedAdmin =
    userRole === "collegeAdmin" && order.acceptedByAdminId === userId;
  const isHeadAdmin = userRole === "headAdmin";
  if (!isOwner && !isAssignedAdmin && !isHeadAdmin)
    return { ok: false, error: "Not authorized" };
  const updated = orders.filter((o) => o.id !== orderId);
  setStoredOrders(updated);
  return { ok: true };
}

export async function getNotifications(
  userId?: string,
): Promise<Notification[]> {
  await delay();
  try {
    const raw = localStorage.getItem("assignflow_notifications");
    if (raw) {
      const parsed = JSON.parse(raw) as Notification[];
      if (Array.isArray(parsed)) {
        if (userId && userId !== "all")
          return parsed.filter((n) => n.userId === userId);
        return parsed;
      }
    }
  } catch {}
  return [];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await delay();
  const orders = getStoredOrders();
  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) =>
    [
      "assigned",
      "in_progress",
      "review",
      "correction",
      "activeReadyToStart",
    ].includes(o.status),
  ).length;
  const completedOrders = orders.filter((o) =>
    ["completed", "delivered", "closed"].includes(o.status),
  ).length;
  const pendingPayments = orders.filter((o) =>
    ["pendingPaymentVerification", "pending_payment"].includes(o.status),
  ).length;
  const totalRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + o.amount, 0);
  return {
    totalOrders,
    activeOrders,
    completedOrders,
    pendingPayments,
    totalRevenue,
    newCustomers: 0,
  };
}

export async function getAnalytics(): Promise<AnalyticsData> {
  await delay();
  const orders = getStoredOrders();

  // Revenue by month — last 6 calendar months
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const now = new Date();
  const revenueByMonth: AnalyticsData["revenueByMonth"] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = d.getTime();
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    const revenue = orders
      .filter(
        (o) =>
          o.status === "delivered" &&
          o.createdAt >= monthStart &&
          o.createdAt < monthEnd,
      )
      .reduce((s, o) => s + o.amount, 0);
    revenueByMonth.push({ month: months[d.getMonth()], revenue });
  }

  // Orders by status
  const statusMap = new Map<string, number>();
  for (const o of orders) {
    const label =
      o.status.charAt(0).toUpperCase() + o.status.slice(1).replace(/_/g, " ");
    statusMap.set(label, (statusMap.get(label) ?? 0) + 1);
  }
  const ordersByStatus = Array.from(statusMap.entries()).map(
    ([status, count]) => ({ status, count }),
  );

  // Orders by college
  const collegeMap = new Map<string, number>();
  for (const o of orders) {
    const col = o.college ?? o.customCollege ?? "Unknown";
    collegeMap.set(col, (collegeMap.get(col) ?? 0) + 1);
  }
  const ordersByCollege = Array.from(collegeMap.entries())
    .map(([college, count]) => ({ college, count }))
    .sort((a, b) => b.count - a.count);

  // Top services
  const serviceMap = new Map<string, number>();
  for (const o of orders) {
    const svc =
      o.serviceType === "Other"
        ? (o.customServiceType ?? "Other")
        : o.serviceType.replace(/([A-Z])/g, " $1").trim();
    serviceMap.set(svc, (serviceMap.get(svc) ?? 0) + 1);
  }
  const topServices = Array.from(serviceMap.entries())
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count);

  // Weekly orders — last 7 days
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyOrders: AnalyticsData["weeklyOrders"] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dayStart = d.getTime();
    const dayEnd = dayStart + 86400000;
    const count = orders.filter(
      (o) => o.createdAt >= dayStart && o.createdAt < dayEnd,
    ).length;
    weeklyOrders.push({ day: dayNames[d.getDay()], count });
  }

  return {
    revenueByMonth,
    ordersByStatus,
    ordersByCollege,
    topServices,
    weeklyOrders,
  };
}

export async function getAdminApplications(): Promise<
  {
    id: string;
    applicationId: string;
    name: string;
    email: string;
    phone: string;
    college: string;
    experience: string;
    skills: string[];
    status: "pending" | "approved" | "rejected";
    appliedAt: number;
    reviewedAt?: number;
  }[]
> {
  // Kept for legacy callers — returns empty; Applications.tsx now reads from backend actor directly
  return [];
}

export async function getSystemSettings(): Promise<SystemSettings> {
  await delay();
  // ALWAYS read fresh from localStorage — but default maintenanceMode to false
  // if the stored value is corrupt or missing. Never default to true.
  let maintenanceMode = false;
  let maintenanceEndTime: string | undefined = undefined;
  let maintenanceMessage =
    "We are performing scheduled maintenance to improve your experience.";
  let whatsappNumber = "";
  let whatsappLink = "";
  let supportEmail = "";
  let supportFormUrl = "";
  let maintenanceEnabledAt: number | undefined = undefined;

  try {
    const raw = localStorage.getItem(MAINTENANCE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      // Explicit boolean check — only true if stored value is literally true
      maintenanceMode = parsed.maintenanceMode === true;
      if (typeof parsed.maintenanceEndTime === "string")
        maintenanceEndTime = parsed.maintenanceEndTime;
      if (typeof parsed.maintenanceMessage === "string")
        maintenanceMessage = parsed.maintenanceMessage;
      if (typeof parsed.whatsappNumber === "string")
        whatsappNumber = parsed.whatsappNumber;
      if (typeof parsed.whatsappLink === "string")
        whatsappLink = parsed.whatsappLink;
      if (typeof parsed.supportEmail === "string")
        supportEmail = parsed.supportEmail;
      if (typeof parsed.supportFormUrl === "string")
        supportFormUrl = parsed.supportFormUrl;
      if (typeof parsed.maintenanceEnabledAt === "number")
        maintenanceEnabledAt = parsed.maintenanceEnabledAt;
    }
  } catch {
    // Parse error → default to false (fail open)
    maintenanceMode = false;
  }

  const baseSettings: SystemSettings = {
    siteName: "AssignServiceHub",
    maintenanceMode,
    maintenanceEndTime,
    maintenanceMessage,
    allowRegistrations: true,
    defaultCurrency: "INR",
    urgencyCharge: 150,
    baseOrderPrice: 300,
    upiId: "9493442754@fam",
    notificationsEnabled: true,
    emailNotifications: true,
    adminSharePercent: 70,
    whatsappNumber,
    whatsappLink,
    supportEmail,
    supportFormUrl,
    maintenanceEnabledAt,
  };

  // Fallback: check localStorage for admin QR if backend has no QR
  const settings = baseSettings;
  if (!settings.qrCodeUrl) {
    const localQr = localStorage.getItem("adminQrCodeUrl");
    if (localQr) {
      settings.qrCodeUrl = localQr;
    }
  }

  return settings;
}

export async function getSupportTickets(
  userId?: string,
): Promise<SupportTicket[]> {
  await delay();
  try {
    const raw = localStorage.getItem("assignflow_support_tickets");
    if (raw) {
      const parsed = JSON.parse(raw) as SupportTicket[];
      if (Array.isArray(parsed)) {
        if (userId) return parsed.filter((t) => t.customerId === userId);
        return parsed;
      }
    }
  } catch {}
  return [];
}

// ── Maintenance API ──────────────────────────────────────────────────────────

const MAINTENANCE_KEY = "maintenance_settings";

function getMaintStored(): {
  maintenanceMode: boolean;
  maintenanceEndTime: string | null;
  maintenanceMessage: string;
  maintenanceReason: string;
} {
  try {
    const raw = localStorage.getItem(MAINTENANCE_KEY);
    if (raw) return { maintenanceReason: "", ...JSON.parse(raw) };
  } catch {}
  return {
    maintenanceMode: false,
    maintenanceEndTime: null,
    maintenanceMessage:
      "We are performing scheduled maintenance to improve your experience.",
    maintenanceReason: "",
  };
}

function saveMaintStored(
  patch: Partial<{
    maintenanceMode: boolean;
    maintenanceEndTime: string | null;
    maintenanceMessage: string;
    maintenanceReason: string;
    maintenanceEnabledAt: number | undefined;
  }>,
): void {
  const current = getMaintStored();
  localStorage.setItem(
    MAINTENANCE_KEY,
    JSON.stringify({ ...current, ...patch }),
  );
}

export async function setMaintenanceMode(enabled: boolean): Promise<void> {
  await delay(300);
  const current = getMaintStored();
  // When enabling, record a log entry
  if (enabled && !current.maintenanceMode) {
    const logs = getMaintenanceLogsLocal();
    logs.unshift({
      enabledBy: "Database Administrator",
      enabledTime: Date.now(),
      disabledTime: null,
      reason: current.maintenanceReason || "Scheduled maintenance",
      affectedUsersCount: 0,
    });
    localStorage.setItem("maintenance_logs", JSON.stringify(logs));
  }
  // When disabling, update the latest log's disabledTime
  if (!enabled && current.maintenanceMode) {
    const logs = getMaintenanceLogsLocal();
    if (logs.length > 0 && logs[0].disabledTime === null) {
      logs[0].disabledTime = Date.now();
      localStorage.setItem("maintenance_logs", JSON.stringify(logs));
    }
  }
  saveMaintStored({
    maintenanceMode: enabled,
    maintenanceEndTime: enabled ? current.maintenanceEndTime : null,
    maintenanceEnabledAt: enabled ? Date.now() : undefined,
  });
}

export async function setMaintenanceEndTime(
  endTime: string | null,
): Promise<void> {
  await delay(100);
  saveMaintStored({ maintenanceEndTime: endTime });
}

export async function setMaintenanceMessage(message: string): Promise<void> {
  await delay(100);
  saveMaintStored({ maintenanceMessage: message });
}

export async function setMaintenanceReason(reason: string): Promise<void> {
  await delay(100);
  saveMaintStored({ maintenanceReason: reason });
}

function getMaintenanceLogsLocal(): Array<{
  enabledBy: string;
  enabledTime: number;
  disabledTime: number | null;
  reason: string;
  affectedUsersCount: number;
}> {
  try {
    const raw = localStorage.getItem("maintenance_logs");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function getMaintenanceLogs(): Promise<
  Array<{
    enabledBy: string;
    enabledTime: number;
    disabledTime: number | null;
    reason: string;
    affectedUsersCount: number;
  }>
> {
  await delay(100);
  return getMaintenanceLogsLocal();
}

export async function setContactSettings(settings: {
  whatsappNumber: string;
  whatsappLink: string;
  supportEmail: string;
  supportFormUrl: string;
}): Promise<void> {
  await delay(200);
  saveMaintStored(settings as Parameters<typeof saveMaintStored>[0]);
}

export async function getMaintenanceStatus(): Promise<{
  maintenanceMode: boolean;
  maintenanceEndTime: string | null;
  maintenanceMessage: string;
}> {
  await delay(100);
  return getMaintStored();
}

// ── Payment API ──────────────────────────────────────────────────────────────

let _pollCount = 0;

// New signature: submitPaymentRequest(orderId, screenshotKey)
// New signature: submitPaymentRequest(orderId, proofUrl)
export async function submitPaymentRequest(
  orderId: string,
  proofUrl: string,
): Promise<{ paymentId: string; transactionId: string; status: string }> {
  await delay(600);
  _pollCount = 0;
  const transactionId = `TXN_${Date.now()}_${orderId}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const paymentId = `pay_${Date.now()}`;
  const orders = getStoredOrders();
  const order = orders.find((o) => o.id === orderId);
  if (order) {
    order.transactionId = transactionId;
    order.uploadedPaymentProof = proofUrl;
    order.paymentStatus = "PENDING";
    order.status = "pendingPaymentVerification";
    order.updatedAt = Date.now();
    setStoredOrders(orders);
  }
  // Save to payment verification store
  const verifs = getStoredVerifications();
  verifs.unshift({
    transactionId,
    orderId,
    customerId: order?.customerId ?? "",
    customerName: order?.customerName ?? "Customer",
    college: order?.college ?? order?.customCollege ?? "—",
    paymentMethod: "Screenshot",
    amount: order?.amount ?? 0,
    status: "pending",
    screenshotUrl: proofUrl,
    submittedAt: Date.now(),
  });
  setStoredVerifications(verifs);
  return { paymentId, transactionId, status: "pending" };
}

export async function pollPaymentStatus(_paymentId: string): Promise<{
  status: "verified" | "pending" | "failed";
  transactionId: string;
  expiredAt: number;
}> {
  await delay(800);
  _pollCount++;
  if (_pollCount >= 3) {
    return {
      status: "verified",
      transactionId: `TXN_${Date.now()}_${_paymentId}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      expiredAt: 0,
    };
  }
  return {
    status: "pending",
    transactionId: "",
    expiredAt: Date.now() + 5 * 60 * 1000,
  };
}

export async function uploadPaymentScreenshot(
  orderId: string,
  proofUrl: string,
): Promise<void> {
  await delay(200);
  const orders = getStoredOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    orders[idx].uploadedPaymentProof = proofUrl;
    orders[idx].paymentStatus = "PENDING";
    orders[idx].updatedAt = Date.now();
    setStoredOrders(orders);
  }
}

export async function getSystemSettingsWithActor(
  actor: BackendActor,
  base: SystemSettings,
): Promise<SystemSettings> {
  try {
    const paySettings = await actor.getPaymentSettings();
    if (paySettings) {
      base.upiId = paySettings.upiId || base.upiId;
      base.hasQrBlob = paySettings.hasQrBlob;
      base.showQrToUsers = paySettings.showQrToUsers;
      base.enableScanner = paySettings.showQrToUsers;
      base.enableUpiPay = true;
      if (paySettings.hasQrBlob) {
        const qrBytes = await actor.getPaymentQrBlob();
        if (qrBytes) {
          const blob = new Blob(
            [new Uint8Array(qrBytes as unknown as ArrayBuffer)],
            { type: "image/png" },
          );
          base.qrCodeUrl = URL.createObjectURL(blob);
        }
      }
    }
  } catch {
    // Backend unavailable — return base settings from localStorage
  }
  return base;
}

export async function refreshQrCode(): Promise<{ qrCodeUrl: string }> {
  await delay(400);
  return { qrCodeUrl: "" };
}

export async function refreshQrCodeWithActor(
  actor: BackendActor,
): Promise<{ qrCodeUrl: string }> {
  try {
    const qrBytes = await actor.getPaymentQrBlob();
    if (qrBytes) {
      const blob = new Blob(
        [new Uint8Array(qrBytes as unknown as ArrayBuffer)],
        { type: "image/png" },
      );
      return { qrCodeUrl: URL.createObjectURL(blob) };
    }
  } catch {
    // fall through
  }
  return { qrCodeUrl: "" };
}

// ── Payment Verification Store ────────────────────────────────────────────

import type { PaymentVerification } from "@/types";

const VERIF_KEY = "assignflow_payment_verifications";

function getStoredVerifications(): PaymentVerification[] {
  try {
    const raw = localStorage.getItem(VERIF_KEY);
    if (raw) return JSON.parse(raw) as PaymentVerification[];
  } catch {}
  return [];
}

function setStoredVerifications(data: PaymentVerification[]): void {
  localStorage.setItem(VERIF_KEY, JSON.stringify(data));
}

export async function getPaymentVerifications(): Promise<
  PaymentVerification[]
> {
  await delay(200);
  return getStoredVerifications();
}

export async function getMyCollegePaymentVerifications(): Promise<
  PaymentVerification[]
> {
  await delay(200);
  // For college admin: filter by logged-in admin's college
  const verifs = getStoredVerifications();
  try {
    const raw = localStorage.getItem("assignflow_user");
    if (raw) {
      const u = JSON.parse(raw) as { college?: string };
      if (u.college) return verifs.filter((v) => v.college === u.college);
    }
  } catch {}
  return verifs;
}

export async function verifyPaymentManually(
  transactionId: string,
  approve: boolean,
  reviewNotes: string,
): Promise<void> {
  await delay(400);
  const verifs = getStoredVerifications();
  const verif = verifs.find((v) => v.transactionId === transactionId);
  if (verif) {
    verif.status = approve ? "verified" : "rejected";
    verif.reviewNotes = reviewNotes;
    verif.reviewedBy = "Admin";
    verif.reviewedAt = Date.now();
    setStoredVerifications(verifs);
  }
  // Also update the linked order
  const orders = getStoredOrders();
  const order = orders.find(
    (o) => o.transactionId === transactionId || o.id === verif?.orderId,
  );
  if (order) {
    order.paymentStatus = approve ? "verified" : "cancelled";
    order.status = approve ? "active" : "cancelled";
    order.updatedAt = Date.now();
    if (!approve && reviewNotes) {
      (order as Order & { rejectionReason?: string }).rejectionReason =
        reviewNotes;
    }
    setStoredOrders(orders);
  }
}

export async function rejectPayment(orderId: string): Promise<void> {
  await delay(400);
  const orders = getStoredOrders();
  const order = orders.find((o) => o.id === orderId);
  if (order) {
    order.paymentStatus = "cancelled";
    order.status = "cancelled";
    order.updatedAt = Date.now();
    setStoredOrders(orders);
  }
}

// ── Payment History ──────────────────────────────────────────────────────────

export async function getPaymentsByOrder(
  orderId: string,
): Promise<import("@/components/PaymentHistoryPanel").PaymentRecord[]> {
  await delay(300);
  // Check localStorage for any payment sessions stored by the payment modal
  const stored = localStorage.getItem(`assignflow_payments_${orderId}`);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  // Derive synthetic history from order payment status
  const orders = getStoredOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return [];
  const psRaw = order.paymentStatus as string;
  if (!psRaw || psRaw === "pending_payment") return [];
  const status =
    psRaw === "verified"
      ? "Verified"
      : psRaw === "cancelled"
        ? "Cancelled"
        : psRaw === "pending_manual_verification"
          ? "ManualVerificationRequired"
          : "Pending";
  return [
    {
      paymentId: `pay_${order.id}_1`,
      transactionId:
        order.transactionId ??
        `TXN_${order.id}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      orderId: order.id,
      customerId: order.customerId,
      amount: order.amount,
      paymentMethod: "UPI",
      status,
      timestamp: order.updatedAt,
      verifiedAt: status === "Verified" ? order.updatedAt : null,
      failureReason: null,
      screenshotKey: order.uploadedPaymentProof ? "uploaded_proof" : null,
    },
  ];
}

export async function downloadReceiptData(orderId: string): Promise<{
  orderId: string;
  customerId: string;
  customerName: string;
  college: string;
  serviceType: string;
  amount: number;
  method: string;
  transactionId: string;
  verifiedStatus: string;
  date: string;
} | null> {
  await delay(300);
  const orders = getStoredOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return null;
  return {
    orderId: order.id,
    customerId: order.customerId,
    customerName: order.customerName,
    college: order.college ?? "—",
    serviceType: order.serviceType,
    amount: order.amount,
    method: "UPI",
    transactionId: order.transactionId ?? "—",
    verifiedStatus: order.paymentStatus === "verified" ? "VERIFIED" : "PENDING",
    date: new Date(order.updatedAt).toLocaleString("en-IN"),
  };
}

// ── Transaction Dashboard API ─────────────────────────────────────────────

export interface TransactionDashboardStats {
  totalRevenue: number;
  pendingVerifications: number;
  failedPayments: number;
  successfulTransactions: number;
  recentTransactions: Array<{
    id: string;
    orderId: string;
    customerName: string;
    college: string;
    amount: number;
    method: string;
    status: string;
    createdAt: number;
  }>;
}

export interface CollegeRevenueStat {
  collegeName: string;
  revenue: number;
}

export interface AdminRevenueStat {
  adminId: string;
  revenue: number;
}

export interface PaymentAuditLog {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  college: string;
  amount: number;
  method: string;
  status: string;
  failureReason?: string;
  screenshotSubmitted: boolean;
  createdAt: number;
  verifiedAt?: number;
  verifiedBy?: string;
}

export async function getTransactionDashboardStats(): Promise<TransactionDashboardStats> {
  await delay(200);
  const orders = getStoredOrders();
  const verifiedOrders = orders.filter((o) => o.paymentStatus === "verified");
  const failedOrders = orders.filter(
    (o) => o.paymentStatus === "failed" || o.paymentStatus === "cancelled",
  );
  const pendingOrders = orders.filter(
    (o) =>
      o.paymentStatus === "pending_payment" ||
      (o.status as string) === "pendingPaymentVerification",
  );
  const totalRevenue = verifiedOrders.reduce((sum, o) => sum + o.amount, 0);
  const recentTransactions = orders.slice(0, 10).map((o) => ({
    id: `TXN_${o.id}`,
    orderId: o.id,
    customerName: o.customerName,
    college: o.college ?? "—",
    amount: o.amount,
    method: o.transactionId ? "UPI" : "QR",
    status: o.paymentStatus as string,
    createdAt: o.createdAt,
  }));
  return {
    totalRevenue,
    pendingVerifications: pendingOrders.length,
    failedPayments: failedOrders.length,
    successfulTransactions: verifiedOrders.length,
    recentTransactions,
  };
}

export async function getCollegeRevenueStats(): Promise<CollegeRevenueStat[]> {
  await delay(200);
  const orders = getStoredOrders();
  const map = new Map<string, number>();
  for (const o of orders) {
    if (o.paymentStatus === "verified") {
      const col = o.college ?? o.customCollege ?? "Unknown";
      map.set(col, (map.get(col) ?? 0) + o.amount);
    }
  }
  return Array.from(map.entries())
    .map(([collegeName, revenue]) => ({ collegeName, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getAdminRevenueStats(): Promise<AdminRevenueStat[]> {
  await delay(200);
  const orders = getStoredOrders();
  const map = new Map<string, number>();
  for (const o of orders) {
    if (o.paymentStatus === "verified" && o.acceptedByAdminName) {
      const key = o.acceptedByAdminName;
      map.set(key, (map.get(key) ?? 0) + o.amount);
    }
  }
  return Array.from(map.entries())
    .map(([adminId, revenue]) => ({ adminId, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getPaymentAuditLogs(
  limit = 20,
): Promise<PaymentAuditLog[]> {
  await delay(200);
  const orders = getStoredOrders();
  return orders.slice(0, limit).map((o, i) => ({
    id: `audit_${o.id}_${i}`,
    orderId: o.id,
    customerId: o.customerId,
    customerName: o.customerName,
    college: o.college ?? "—",
    amount: o.amount,
    method: o.transactionId ? "UPI" : "QR",
    status: o.paymentStatus as string,
    failureReason:
      o.paymentStatus === "failed" || o.paymentStatus === "cancelled"
        ? "Payment not completed"
        : undefined,
    screenshotSubmitted: !!o.uploadedPaymentProof,
    createdAt: o.createdAt,
    verifiedAt: o.paymentStatus === "verified" ? o.updatedAt : undefined,
    verifiedBy: o.paymentStatus === "verified" ? "System" : undefined,
  }));
}

export async function getAllPayments(): Promise<PaymentAuditLog[]> {
  return getPaymentAuditLogs(100);
}

export async function getFailedPayments(): Promise<PaymentAuditLog[]> {
  const all = await getAllPayments();
  return all.filter((p) => p.status === "failed" || p.status === "cancelled");
}

export async function getPendingVerifications(): Promise<PaymentAuditLog[]> {
  const all = await getAllPayments();
  return all.filter(
    (p) =>
      p.status === "pending_payment" ||
      p.status === "pendingPaymentVerification",
  );
}
// ── Head Admin Payment Settings ──────────────────────────────────────────────

export async function uploadPaymentQrCode(
  actor: BackendActor,
  file: File,
): Promise<void> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  await actor.uploadPaymentQr(bytes);
}

export async function updateHeadAdminUpiId(
  actor: BackendActor,
  upiId: string,
): Promise<void> {
  await actor.updateUpiId(upiId);
}

// ── Paper Charges API ──────────────────────────────────────────────────────

const PAPER_CHARGES_KEY = "assignflow_paper_charges";

export const ALL_SERVICE_TYPES = [
  "SoftCopy",
  "HardCopy",
  "RecordWriting",
  "NotesWriting",
  "Other",
] as const;

const DEFAULT_PAPER_CHARGE_CONFIGS: import("@/types").PaperChargeConfig[] =
  ALL_SERVICE_TYPES.map((serviceType) => ({
    serviceType,
    paperChargeEnabled: serviceType === "HardCopy",
    paperChargePerPage: serviceType === "HardCopy" ? 2 : 2,
  }));

function getStoredPaperCharges(): import("@/types").PaperChargeConfig[] {
  try {
    const raw = localStorage.getItem(PAPER_CHARGES_KEY);
    if (raw) return JSON.parse(raw) as import("@/types").PaperChargeConfig[];
  } catch {}
  return DEFAULT_PAPER_CHARGE_CONFIGS;
}

function setStoredPaperCharges(
  configs: import("@/types").PaperChargeConfig[],
): void {
  localStorage.setItem(PAPER_CHARGES_KEY, JSON.stringify(configs));
}

export async function listPaperChargeConfigs(): Promise<
  import("@/types").PaperChargeConfig[]
> {
  await delay(150);
  return getStoredPaperCharges();
}

export async function getPaperChargeConfig(
  serviceType: string,
): Promise<import("@/types").PaperChargeConfig | null> {
  await delay(100);
  const configs = getStoredPaperCharges();
  return configs.find((c) => c.serviceType === serviceType) ?? null;
}

export async function setPaperChargeConfig(
  config: import("@/types").PaperChargeConfig,
): Promise<void> {
  await delay(200);
  const configs = getStoredPaperCharges();
  const idx = configs.findIndex((c) => c.serviceType === config.serviceType);
  if (idx !== -1) configs[idx] = config;
  else configs.push(config);
  setStoredPaperCharges(configs);
}

export async function setPaperChargeConfigs(
  configs: import("@/types").PaperChargeConfig[],
): Promise<void> {
  await delay(200);
  setStoredPaperCharges(configs);
}

// ── Auth API ──────────────────────────────────────────────────────────────

const CUSTOMERS_KEY = "assignflow_customers";

export interface StoredCustomer {
  id: string;
  name: string;
  email: string;
  registeredCollegeId?: string;
  college?: string;
  phone?: string;
  createdAt: number;
  passwordHash?: string;
}

function getStoredCustomers(): StoredCustomer[] {
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY);
    if (raw) return JSON.parse(raw) as StoredCustomer[];
  } catch {}
  return [];
}

function setStoredCustomers(customers: StoredCustomer[]): void {
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

export async function loginAsCustomerApi(
  email: string,
): Promise<StoredCustomer | null> {
  await delay(200);
  const customers = getStoredCustomers();
  return (
    customers.find((c) => c.email.toLowerCase() === email.toLowerCase()) ?? null
  );
}

export async function registerCustomerApi(
  data: Omit<StoredCustomer, "id" | "createdAt">,
): Promise<{ ok: boolean; error?: string; customer?: StoredCustomer }> {
  await delay(300);
  const customers = getStoredCustomers();
  const dup = customers.find(
    (c) => c.email.toLowerCase() === data.email.toLowerCase(),
  );
  if (dup) return { ok: false, error: "Email already registered" };
  const customer: StoredCustomer = {
    ...data,
    id: `cust_${Date.now()}`,
    createdAt: Date.now(),
  };
  customers.push(customer);
  setStoredCustomers(customers);
  // Also save legacy format
  const legacy = customers.map((c) => ({
    name: c.name,
    email: c.email,
    college: c.college,
  }));
  localStorage.setItem("assignflow_customers", JSON.stringify(legacy));
  return { ok: true, customer };
}

// Admin accounts stored in localStorage (dynamic, for newly approved writers)
const ADMIN_ACCOUNTS_KEY = "assignflow_admin_accounts";

export interface StoredAdminAccount {
  email: string;
  name: string;
  role: "headAdmin" | "collegeAdmin";
  college?: string;
  collegeId?: string;
  passwordHash: string; // plain text for now (DOB or changed)
  mustChangePassword: boolean;
  dateOfBirth?: string;
  createdAt: number;
}

function getStoredAdminAccounts(): StoredAdminAccount[] {
  try {
    const raw = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
    if (raw) return JSON.parse(raw) as StoredAdminAccount[];
  } catch {}
  return [];
}

function setStoredAdminAccounts(accounts: StoredAdminAccount[]): void {
  localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export async function getAdminAccount(
  email: string,
): Promise<StoredAdminAccount | null> {
  await delay(100);
  const accounts = getStoredAdminAccounts();
  return (
    accounts.find((a) => a.email.toLowerCase() === email.toLowerCase()) ?? null
  );
}

export async function createAdminAccountFromApproval(
  data: Omit<StoredAdminAccount, "createdAt">,
): Promise<void> {
  await delay(200);
  const accounts = getStoredAdminAccounts();
  const existing = accounts.findIndex(
    (a) => a.email.toLowerCase() === data.email.toLowerCase(),
  );
  if (existing !== -1) {
    accounts[existing] = {
      ...accounts[existing],
      ...data,
      createdAt: accounts[existing].createdAt,
    };
  } else {
    accounts.push({ ...data, createdAt: Date.now() });
  }
  setStoredAdminAccounts(accounts);
}

export async function changeAdminPassword(
  email: string,
  newPassword: string,
): Promise<void> {
  await delay(200);
  const accounts = getStoredAdminAccounts();
  const idx = accounts.findIndex(
    (a) => a.email.toLowerCase() === email.toLowerCase(),
  );
  if (idx !== -1) {
    accounts[idx].passwordHash = newPassword;
    accounts[idx].mustChangePassword = false;
    setStoredAdminAccounts(accounts);
  }
}
