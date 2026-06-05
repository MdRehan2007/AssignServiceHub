export interface PaperChargeConfig {
  serviceType: string;
  paperChargeEnabled: boolean;
  paperChargePerPage: number;
}

export interface PasswordChangeRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface SessionToken {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export interface PaymentVerification {
  transactionId: string;
  orderId: string;
  customerId: string;
  customerName: string;
  college: string;
  paymentMethod: string;
  amount: number;
  status:
    | "pending"
    | "PendingVerification"
    | "verified"
    | "Verified"
    | "rejected"
    | "Rejected";
  screenshotUrl?: string;
  submittedAt: number;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: number;
}

export type UserRole = "customer" | "headAdmin" | "collegeAdmin";

export type ServiceType =
  | "HardCopy"
  | "SoftCopy"
  | "RecordWriting"
  | "NotesWriting"
  | "Other";

export type OrderStatus =
  | "pendingPaymentVerification"
  | "activeReadyToStart"
  | "pending_payment"
  | "payment_verification"
  | "active"
  | "assigned"
  | "in_progress"
  | "review"
  | "correction"
  | "completed"
  | "delivered"
  | "closed"
  | "cancelled";

export type PaymentStatus =
  | "pending_payment"
  | "verified"
  | "failed"
  | "cancelled"
  | "CREATED"
  | "PENDING"
  | "PROCESSING"
  | "VERIFIED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "MANUAL_REVIEW";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface AdminSkill {
  skillId: string;
  skillName: string;
  isCustom: boolean;
}

export interface ReassignmentLog {
  logId: string;
  orderId: string;
  previousAdminId: string;
  previousAdminName: string;
  newAdminId: string;
  newAdminName: string;
  reason: string;
  reassignedBy: string;
  reassignedAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  college?: string;
  avatar?: string;
  createdAt: number;
  lastLogin?: number;
  skills?: AdminSkill[];
  registeredCollegeId?: string;
  mustChangePassword?: boolean;
  dateOfBirth?: string;
  passwordHash?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  serviceType: ServiceType;
  customServiceType?: string;
  subjectName: string;
  department: string;
  deadline: number;
  isUrgent: boolean;
  description: string;
  instructions?: string;
  files?: string[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  amount: number;
  pageCount?: number;
  paperChargeAmount?: number;
  materialChoice?: string;
  materialChargeAmount?: number;
  basePrice?: number;
  urgencyCharge?: number;
  assignedAdmin?: string;
  acceptedByAdminId?: string;
  acceptedByAdminName?: string;
  acceptedAt?: number;
  assignmentLockStatus: "locked" | "unlocked";
  deliveryStatus: "notDelivered" | "delivered";
  revisionCount: number;
  paymentSettlementStatus: "pending" | "settled";
  createdAt: number;
  updatedAt: number;
  statusHistory: StatusHistoryItem[];
  college?: string;
  customCollege?: string;
  customerPhone?: string;
  reassignmentLogs?: ReassignmentLog[];
  uploadedPaymentProof?: string;
  transactionId?: string;
  paymentMethod?: string;
  customerUpiId?: string;
}

export interface StatusHistoryItem {
  status: OrderStatus;
  timestamp: number;
  note?: string;
}

export interface College {
  id: string;
  name: string;
  code: string;
  location: string;
  adminIds: string[];
  adminNames: string[];
  adminCount: number;
  totalStudents: number;
  totalOrders: number;
  revenue: number;
  status: "active" | "inactive";
  createdAt: number;
}

export interface Message {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  timestamp: number;
  isRead: boolean;
  attachments?: string[];
}

export interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  status: PaymentStatus;
  method: "upi" | "qr" | "other";
  proofUrl?: string;
  submittedAt?: number;
  verifiedAt?: number;
  transactionId?: string;
  verifiedBadge?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "order" | "payment" | "message" | "system";
  isRead: boolean;
  createdAt: number;
  orderId?: string;
}

export interface AdminApplication {
  id: string;
  applicationId: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  customCollege?: string;
  skills: string[];
  customSkill?: string;
  experience: string;
  upiId?: string;
  resumeUrl?: string;
  resumeKey?: string;
  govIdUrl?: string;
  status: "pending" | "approved" | "rejected";
  appliedAt: number;
  reviewedAt?: number;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  target: string;
  details: string;
  timestamp: number;
  ip?: string;
}

export interface SystemSettings {
  siteName: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  defaultCurrency?: string;
  urgencyCharge: number;
  baseOrderPrice: number;
  upiId: string;
  qrCodeUrl?: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  adminSharePercent: number;
  maintenanceEndTime?: string;
  maintenanceMessage?: string;
  whatsappNumber?: string;
  whatsappLink?: string;
  supportEmail?: string;
  supportFormUrl?: string;
  maintenanceEnabledAt?: number;
  hasQrBlob?: boolean;
  showQrToUsers?: boolean;
  enableScanner?: boolean;
  enableUpiPay?: boolean;
}

export interface DashboardSummary {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  pendingPayments: number;
  totalRevenue: number;
  newCustomers: number;
}

export interface AnalyticsData {
  revenueByMonth: { month: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  ordersByCollege: { college: string; count: number }[];
  topServices: { service: string; count: number }[];
  weeklyOrders: { day: string; count: number }[];
  deliveredRevenue?: number;
  deliveredOrders?: number;
}

export interface SupportTicket {
  id: string;
  customerId: string;
  customerName: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: "low" | "medium" | "high";
  createdAt: number;
  updatedAt: number;
  responses?: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  responderId: string;
  responderName: string;
  message: string;
  timestamp: number;
}

export interface PaymentAttempt {
  transactionId: string;
  orderId: string;
  customerId: string;
  paymentMethod: "upi" | "qr";
  amount: number;
  status: "pending" | "verified" | "failed" | "expired";
  createdAt: number;
  verifiedAt?: number;
  errorMessage?: string;
}

export interface PaymentSession {
  paymentId: string;
  orderId: string;
  transactionId: string;
  status: "pending" | "verified" | "rejected" | "expired";
  method: "upi" | "qr";
  amount: number;
  screenshotKey?: string;
  createdAt: number;
  updatedAt: number;
}
export interface PaymentSettings {
  upiId: string;
  qrCodeKey: string;
  showQrToUsers: boolean;
  hasQrBlob: boolean;
}
