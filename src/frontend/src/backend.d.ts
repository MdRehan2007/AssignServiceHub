import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Timestamp = bigint;
export interface CleanupResult {
    deletedCount: bigint;
    message: string;
}
export interface AuditLog {
    resource: string;
    action: string;
    logId: LogId;
    timestamp: Timestamp;
    details: string;
    adminId: UserId;
}
export interface PaymentLog {
    orderId: string;
    logId: string;
    paymentId: string;
    timestamp: bigint;
    customerId: UserId;
    adminRemarks: string;
    reason: string;
}
export interface AdminSkill {
    skillId: string;
    skillName: string;
    isCustom: boolean;
}
export interface WriterAnalytics {
    writerId: Principal;
    completedOrders: bigint;
    assignedOrders: bigint;
    writerName: string;
}
export interface PaymentVerification {
    reviewNotes?: string;
    screenshotUrl?: string;
    submittedAt: bigint;
    reviewedBy?: string;
    verificationId: string;
    reviewTimestamp?: bigint;
    verificationStatus: string;
    transactionId: string;
}
export interface CleanupFilter {
    olderThanDays?: bigint;
    callerRole: CallerRole;
    collegeIdFilter?: string;
    statusFilter?: Array<OrderStatus>;
}
export interface SystemSettings {
    websiteName: string;
    qrCodeBlob?: Uint8Array;
    maintenanceMessage: string;
    maintenanceEnabledAt?: bigint;
    servicePrices: Array<ServicePriceEntry>;
    emergencySupportEmail: string;
    whatsappLink: string;
    supportFormUrl: string;
    maintenanceLogs: Array<MaintenanceLog>;
    maintenanceMode: boolean;
    notebookPrice: bigint;
    requirePaymentBeforeSubmission: boolean;
    themeConfig: ThemeConfig;
    recordBookPrice: bigint;
    whatsappNumber: string;
    supportEmail: string;
    upiId: string;
    qrCodeKey: string;
    databaseAdminSharePercent: bigint;
    maintenanceEndTime?: string;
    showQrToUsers: boolean;
    allowNewOrders: boolean;
    settingsId: string;
    adminSharePercent: bigint;
}
export interface PaymentAuditLog {
    action: string;
    actorId: string;
    orderId?: string;
    logId: string;
    timestamp: bigint;
    details?: string;
    deviceInfo?: string;
    amount?: bigint;
    ipAddress?: string;
    transactionId?: string;
}
export interface PaperChargeUpdate {
    serviceType: ServiceType;
    paperChargePerPage: bigint;
    paperChargeEnabled: boolean;
}
export type CollegeId = string;
export interface College {
    adminIds: Array<UserId>;
    collegeCode: string;
    collegeName: string;
    createdAt: Timestamp;
    isActive: boolean;
    adminCount: bigint;
    collegeId: CollegeId;
    commissionPercent: bigint;
    adminEmail: string;
    contactPhone: string;
}
export type NotifId = string;
export interface WriterApplication {
    bio: string;
    status: ApplicationStatus;
    appliedAt: Timestamp;
    applicantName: string;
    appId: AppId;
    collegeName: string;
    handwritingUrl: string;
    reviewNote: string;
    reviewedBy?: string;
    email: string;
    updatedAt: bigint;
    expertise: Array<string>;
    phone: string;
    resumeKey?: string;
    resumeUrl: string;
}
export interface CollegePricing {
    urgencyCharge: bigint;
    collegeName: string;
    hardCopy: bigint;
    otherBase: bigint;
    softCopy: bigint;
    notesWriting: bigint;
    recordWriting: bigint;
}
export type AppId = string;
export interface User {
    dateOfBirth?: string;
    userId: UserId;
    name: string;
    createdAt: Timestamp;
    role: UserRole;
    isActive: boolean;
    email: string;
    collegeId?: string;
    passwordHash?: string;
    lastLogin: Timestamp;
    skills: Array<AdminSkill>;
    registeredCollegeId?: string;
    mustChangePassword: boolean;
}
export interface OrderAnalytics {
    totalOrders: bigint;
    pendingOrders: bigint;
    completedOrders: bigint;
    totalRevenue: bigint;
    deliveredOrders: bigint;
}
export interface ThemeConfig {
    primaryColor: string;
    sidebarWidth: bigint;
    accentColor: string;
    fontFamily: string;
    sidebarColor: string;
}
export interface Payment {
    status: PaymentStatus;
    paymentMethod: string;
    expiredAt: bigint;
    failureReason?: string;
    transactionState: TransactionState;
    screenshotKey?: string;
    createdAt: Timestamp;
    orderId: OrderId;
    attemptCount: bigint;
    updatedAt: bigint;
    collegeId: string;
    proofFileKey?: string;
    paymentId: PaymentId;
    timestamp: bigint;
    deviceInfo?: string;
    customerId: UserId;
    adminId?: string;
    amount: bigint;
    verifiedAt?: Timestamp;
    verifiedBy?: string;
    ipAddress?: string;
    screenshotFileKey: string;
    transactionId: string;
}
export interface Order {
    status: OrderStatus;
    serviceType: ServiceType;
    acceptedByAdminName?: string;
    subject: string;
    customerPhone?: string;
    urgentFlag: boolean;
    urgencyCharge: bigint;
    revenueRecorded: boolean;
    materialChoice?: string;
    createdAt: Timestamp;
    materialChargeAmount: bigint;
    acceptedByAdminId?: string;
    revisionCount: bigint;
    deliveryStatus: DeliveryStatus;
    description: string;
    fileKeys: Array<string>;
    deadline: Timestamp;
    orderId: OrderId;
    updatedAt: Timestamp;
    assignmentLockStatus: LockStatus;
    adminMessages: Array<string>;
    customCollege?: string;
    paperChargeAmount: bigint;
    submissionFiles: Array<string>;
    customerId: UserId;
    adminId?: UserId;
    paymentSettlementStatus: PaymentSettlementStatus;
    acceptedAt?: Timestamp;
    totalPrice: bigint;
    basePrice: bigint;
    college: string;
    pageCount: bigint;
}
export interface MaintenanceLog {
    enabledTime: bigint;
    enabledBy: string;
    disabledTime?: bigint;
    reason: string;
    affectedUsersCount: bigint;
}
export type LogId = string;
export interface DashboardSummary {
    writerStats: Array<WriterAnalytics>;
    collegeStats: Array<CollegeAnalytics>;
    totalUsers: bigint;
    orderStats: OrderAnalytics;
    totalColleges: bigint;
}
export type UserId = Principal;
export interface ServicePriceEntry {
    serviceType: ServiceType;
    urgencyCharge: bigint;
    paperChargePerPage: bigint;
    paperChargeEnabled: boolean;
    basePrice: bigint;
}
export interface PaymentSettings {
    hasQrBlob: boolean;
    upiId: string;
    qrCodeKey: string;
    showQrToUsers: boolean;
}
export type PaymentId = string;
export interface PaperChargeConfig {
    serviceType: ServiceType;
    paperChargePerPage: bigint;
    paperChargeEnabled: boolean;
}
export interface ReassignmentLog {
    newAdminId: UserId;
    previousAdminName: string;
    reassignedAt: Timestamp;
    reassignedBy: UserId;
    orderId: OrderId;
    logId: LogId;
    previousAdminId: UserId;
    newAdminName: string;
    reason: string;
}
export interface Notification {
    notifType: NotificationType;
    userId: UserId;
    createdAt: Timestamp;
    notifId: NotifId;
    isRead: boolean;
    message: string;
    relatedId?: string;
}
export type MessageId = string;
export interface Message {
    isDeleted: boolean;
    messageId: MessageId;
    text: string;
    fileKeys: Array<string>;
    isRead: boolean;
    orderId: OrderId;
    timestamp: Timestamp;
    senderName: string;
    senderRole: UserRole;
    senderId: UserId;
}
export interface CollegeAnalytics {
    totalOrders: bigint;
    collegeName: string;
    collegeId: string;
    activeOrders: bigint;
    totalRevenue: bigint;
}
export type OrderId = string;
export interface CleanupLog {
    cleanupType: string;
    logId: LogId;
    performedAt: Timestamp;
    performedBy: UserId;
    recordsRemoved: bigint;
}
export enum ApplicationStatus {
    Approved = "Approved",
    Rejected = "Rejected",
    Pending = "Pending"
}
export enum CallerRole {
    Customer = "Customer",
    CollegeAdmin = "CollegeAdmin",
    DatabaseAdmin = "DatabaseAdmin"
}
export enum DeliveryStatus {
    Delivered = "Delivered",
    NotDelivered = "NotDelivered"
}
export enum LockStatus {
    Unlocked = "Unlocked",
    Locked = "Locked"
}
export enum NotificationType {
    orderAccepted = "orderAccepted",
    deliveryUploaded = "deliveryUploaded",
    newOrder = "newOrder",
    orderCompleted = "orderCompleted",
    paymentReceived = "paymentReceived",
    general = "general",
    orderReassigned = "orderReassigned",
    revisionRequested = "revisionRequested"
}
export enum OrderStatus {
    ActiveReadyToStart = "ActiveReadyToStart",
    Review = "Review",
    Closed = "Closed",
    PendingPaymentVerification = "PendingPaymentVerification",
    Delivered = "Delivered",
    Correction = "Correction",
    InProgress = "InProgress",
    Assigned = "Assigned",
    Completed = "Completed"
}
export enum PaymentSettlementStatus {
    Settled = "Settled",
    Pending = "Pending"
}
export enum PaymentStatus {
    Rejected = "Rejected",
    Verified = "Verified",
    Pending = "Pending"
}
export enum ServiceType {
    HardCopy = "HardCopy",
    RecordWriting = "RecordWriting",
    SoftCopy = "SoftCopy",
    NotesWriting = "NotesWriting"
}
export enum TransactionState {
    Failed = "Failed",
    Refunded = "Refunded",
    Cancelled = "Cancelled",
    Processing = "Processing",
    Created = "Created",
    Verified = "Verified",
    Pending = "Pending"
}
export enum UserRole {
    customer = "customer",
    databaseAdmin = "databaseAdmin",
    collegeAdmin = "collegeAdmin"
}
export interface backendInterface {
    acceptOrder(id: OrderId, adminName: string): Promise<boolean>;
    addAdminToCollege(collegeId: CollegeId, adminId: UserId): Promise<boolean>;
    approveApplication(id: AppId, note: string): Promise<{
        __kind__: "ok";
        ok: WriterApplication;
    } | {
        __kind__: "err";
        err: string;
    }>;
    assignUserRole(id: UserId, role: UserRole): Promise<boolean>;
    changePassword(oldPasswordHash: string, newPasswordHash: string): Promise<boolean>;
    cleanOldAuditLogs(): Promise<bigint>;
    cleanOldNotifications(): Promise<bigint>;
    cleanOldOrders(): Promise<bigint>;
    countTotalUsers(): Promise<bigint>;
    createCollege(name: string, adminEmail: string, phone: string): Promise<College>;
    createNotification(userId: UserId, notifType: NotificationType, message: string, relatedId: string | null): Promise<Notification>;
    deactivateUser(id: UserId): Promise<boolean>;
    deleteApplication(id: AppId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteMessage(id: MessageId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    dryRunSmartCleanup(filter: CleanupFilter): Promise<CleanupResult>;
    estimatePrice(serviceType: ServiceType, urgent: boolean, pages: bigint): Promise<{
        total: bigint;
        urgency: bigint;
        base: bigint;
        paperCharge: bigint;
    }>;
    forceReassignOrder(id: OrderId, newAdminId: UserId, newAdminName: string, reason: string): Promise<boolean>;
    generateAdminIdPreview(collegeName: string, seq: bigint): Promise<string>;
    getAdminAccount(email: string): Promise<User | null>;
    getAdminOrders(): Promise<Array<Order>>;
    getAdminRevenueStats(): Promise<Array<[string, bigint]>>;
    getAllAuditLogs(): Promise<Array<AuditLog>>;
    getAllCollegesPricing(): Promise<Array<CollegePricing>>;
    getAllOrders(): Promise<Array<Order>>;
    getApplication(id: AppId): Promise<WriterApplication | null>;
    getCollege(id: CollegeId): Promise<College | null>;
    getCollegePricing(collegeName: string): Promise<CollegePricing | null>;
    getCollegeRevenueStats(): Promise<Array<[string, bigint]>>;
    getDashboardSummary(): Promise<DashboardSummary>;
    getMaintenanceLogs(): Promise<Array<MaintenanceLog>>;
    getMaterialPrices(): Promise<{
        notebookPrice: bigint;
        recordBookPrice: bigint;
    }>;
    getMyAuditLogs(): Promise<Array<AuditLog>>;
    getMyCollegePaymentVerifications(): Promise<Array<PaymentVerification>>;
    getMyNotifications(): Promise<Array<Notification>>;
    getMyOrders(): Promise<Array<Order>>;
    getMyPayments(): Promise<Array<Payment>>;
    getMyProfile(): Promise<User | null>;
    getMyUnreadCount(): Promise<bigint>;
    getOrCreateSessionToken(): Promise<string>;
    getOrder(id: OrderId): Promise<Order | null>;
    getOrderMessages(orderId: OrderId): Promise<Array<Message>>;
    getOrderPayments(orderId: OrderId): Promise<Array<Payment>>;
    getOrdersByCollege(college: string): Promise<Array<Order>>;
    getOrdersByStatus(): Promise<Array<{
        status: string;
        count: bigint;
    }>>;
    getPaperChargeConfig(serviceType: ServiceType): Promise<PaperChargeConfig | null>;
    getPaymentAuditLogs(limit: bigint): Promise<Array<PaymentAuditLog>>;
    getPaymentLogs(): Promise<Array<PaymentLog>>;
    getPaymentQrBlob(): Promise<Uint8Array | null>;
    getPaymentSettings(): Promise<PaymentSettings>;
    getPaymentVerification(transactionId: string): Promise<PaymentVerification | null>;
    getPaymentVerifications(): Promise<Array<PaymentVerification>>;
    getPaymentsByOrder(orderId: string): Promise<Array<Payment>>;
    getRevenueByCollege(): Promise<Array<{
        revenue: bigint;
        college: string;
    }>>;
    getSystemSettings(): Promise<SystemSettings>;
    getTotalRevenue(): Promise<bigint>;
    getTransactionDashboardStats(): Promise<{
        recentTransactions: Array<Payment>;
        failedPayments: bigint;
        totalRevenue: bigint;
        successfulTransactions: bigint;
        pendingVerifications: bigint;
    }>;
    getUnreadCount(orderId: OrderId): Promise<bigint>;
    getUserByEmail(email: string): Promise<User | null>;
    getUserById(id: UserId): Promise<User | null>;
    getUserBySessionToken(token: string): Promise<User | null>;
    getWriterApplication(id: AppId): Promise<WriterApplication | null>;
    listAllReassignmentLogs(): Promise<Array<ReassignmentLog>>;
    listApplications(): Promise<Array<WriterApplication>>;
    listCleanupLogs(): Promise<Array<CleanupLog>>;
    listCollegeAdmins(collegeId: CollegeId): Promise<Array<UserId>>;
    listColleges(): Promise<Array<College>>;
    listPaperChargeConfigs(): Promise<Array<PaperChargeConfig>>;
    listReassignmentLogs(orderId: OrderId): Promise<Array<ReassignmentLog>>;
    listUsers(): Promise<Array<User>>;
    listWriterApplications(): Promise<Array<WriterApplication>>;
    logAction(action: string, resource: string, details: string): Promise<AuditLog>;
    loginAsCustomer(email: string): Promise<User | null>;
    markMessageRead(id: MessageId): Promise<boolean>;
    markNotificationRead(id: NotifId): Promise<boolean>;
    placeOrder(customerPhone: string, serviceType: ServiceType, subject: string, deadline: Timestamp, description: string, urgentFlag: boolean, pages: bigint, fileKeys: Array<string>, materialChoice: string | null, materialChargeAmount: bigint): Promise<Order>;
    pollPaymentStatus(paymentId: string): Promise<{
        status: string;
        expiredAt: bigint;
        failureReason?: string;
        transactionState: string;
        verifiedAt?: bigint;
        transactionId: string;
    }>;
    reassignOrder(orderId: OrderId, newAdminId: UserId, newAdminName: string, reason: string): Promise<ReassignmentLog>;
    registerUser(name: string, email: string, role: UserRole, collegeId: string | null, registeredCollegeId: string | null): Promise<UserId>;
    rejectApplication(id: AppId, note: string): Promise<{
        __kind__: "ok";
        ok: WriterApplication;
    } | {
        __kind__: "err";
        err: string;
    }>;
    rejectPayment(id: PaymentId): Promise<boolean>;
    removeAdminFromCollege(collegeId: CollegeId, adminId: UserId): Promise<boolean>;
    runFullCleanup(): Promise<{
        logsRemoved: bigint;
        ordersRemoved: bigint;
        notifsRemoved: bigint;
    }>;
    sendMessage(orderId: OrderId, text: string, fileKeys: Array<string>): Promise<Message>;
    setAllowNewOrders(allowed: boolean): Promise<void>;
    setCollegePricing(pricing: CollegePricing): Promise<void>;
    setCustomerCollege(customerId: UserId, collegeId: string): Promise<boolean>;
    setMaintenanceEndTime(endTime: string | null): Promise<void>;
    setMaintenanceMessage(message: string): Promise<void>;
    setMaintenanceMode(enabled: boolean): Promise<void>;
    setMaintenanceReason(reason: string): Promise<void>;
    setMaterialPrices(recordBookPrice: bigint, notebookPrice: bigint): Promise<void>;
    setPaperChargeConfig(update: PaperChargeUpdate): Promise<boolean>;
    setPaperChargeConfigs(updates: Array<PaperChargeUpdate>): Promise<boolean>;
    setSupportEmail(value: string): Promise<void>;
    setSupportFormUrl(value: string): Promise<void>;
    setWhatsappLink(value: string): Promise<void>;
    setWhatsappNumber(value: string): Promise<void>;
    settleOrderPayment(id: OrderId): Promise<boolean>;
    smartCleanup(filter: CleanupFilter): Promise<CleanupResult>;
    submitPayment(orderId: OrderId): Promise<Payment>;
    submitPaymentRequest(orderId: OrderId, screenshotKey: string): Promise<{
        __kind__: "ok";
        ok: Payment;
    } | {
        __kind__: "err";
        err: string;
    }>;
    submitWriterApplication(name: string, email: string, phone: string, college: string, bio: string, expertise: Array<string>, handwritingUrl: string, resumeKey: string | null, resumeUrl: string): Promise<WriterApplication>;
    updateAdminSkills(skills: Array<AdminSkill>): Promise<boolean>;
    updateApplicationStatus(id: AppId, status: ApplicationStatus): Promise<boolean>;
    updateCollege(id: CollegeId, name: string, email: string, phone: string, commission: bigint): Promise<boolean>;
    updateLastLogin(): Promise<void>;
    updateMaintenanceContacts(whatsappNumber: string, whatsappLink: string, supportEmail: string, supportFormUrl: string): Promise<void>;
    updateOrderStatus(id: OrderId, status: OrderStatus): Promise<boolean>;
    updatePaymentSettings(upiId: string, qrCodeKey: string, showQrToUsers: boolean): Promise<void>;
    updateProfile(name: string, email: string): Promise<boolean>;
    updateQrCode(qrCodeKey: string): Promise<void>;
    updateServicePricing(prices: Array<ServicePriceEntry>): Promise<void>;
    updateSharePercents(databaseAdminSharePercent: bigint, adminSharePercent: bigint): Promise<void>;
    updateSystemSettings(updated: SystemSettings): Promise<SystemSettings>;
    updateTheme(theme: ThemeConfig): Promise<void>;
    updateUpiId(upiId: string): Promise<void>;
    updateWebsiteName(name: string): Promise<void>;
    uploadDelivery(id: OrderId, fileKeys: Array<string>): Promise<boolean>;
    uploadPaymentQr(imageData: Uint8Array): Promise<string>;
    uploadPaymentScreenshot(transactionId: string, screenshotKey: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    verifyPayment(id: PaymentId): Promise<boolean>;
    verifyPaymentManually(transactionId: string, approve: boolean, reviewNotes: string | null): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
}
