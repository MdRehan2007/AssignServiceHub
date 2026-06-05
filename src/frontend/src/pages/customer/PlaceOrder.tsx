import { createActor } from "@/backend";
import PaymentModal from "@/components/customer/PaymentModal";
import { useAuth } from "@/hooks/useAuth";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import {
  createOrder,
  getCollegePricing,
  getColleges,
  listPaperChargeConfigs,
} from "@/services/api";
import type { College, PaperChargeConfig, ServiceType } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  AlertCircle,
  CheckCircle,
  File as FileIcon,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type ExtendedServiceType = ServiceType | "Other";

const DEFAULT_SERVICE_PRICES: Record<string, number> = {
  SoftCopy: 300,
  HardCopy: 500,
  RecordWriting: 800,
  NotesWriting: 400,
  Other: 350,
};
const DEFAULT_URGENCY_CHARGE = 150;

const SERVICE_TYPES: {
  value: ExtendedServiceType;
  label: string;
  base: number;
  description: string;
}[] = [
  {
    value: "SoftCopy",
    label: "Soft Copy",
    base: 300,
    description: "Digital PDF/doc format",
  },
  {
    value: "HardCopy",
    label: "Hard Copy",
    base: 500,
    description: "Physical printed copy",
  },
  {
    value: "RecordWriting",
    label: "Record Writing",
    base: 800,
    description: "Handwritten lab records",
  },
  {
    value: "NotesWriting",
    label: "Notes Writing",
    base: 400,
    description: "Subject notes & summaries",
  },
  {
    value: "Other",
    label: "Other",
    base: 350,
    description: "Custom service type",
  },
];

function computeUrgency(deadline: string): boolean {
  if (!deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  return deadlineDate <= tomorrow;
}

function FileItem({
  name,
  size,
  onRemove,
}: { name: string; size: number; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
      <FileIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
        <p className="text-xs text-gray-400">{(size / 1024).toFixed(1)} KB</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="p-1 hover:bg-red-100 rounded transition-colors"
        aria-label="Remove file"
      >
        <X className="h-4 w-4 text-red-400" />
      </button>
    </div>
  );
}

export function PlaceOrderPage() {
  const { user } = useAuth();
  const [, setColleges] = useState<College[]>([]);
  const [registeredCollegeName, setRegisteredCollegeName] = useState("");
  const [serviceType, setServiceType] =
    useState<ExtendedServiceType>("SoftCopy");
  const [customServiceType, setCustomServiceType] = useState("");
  const [subject, setSubject] = useState("");
  const [department, setDepartment] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  // College-specific pricing
  const [collegePrices, setCollegePrices] = useState<Record<string, number>>(
    DEFAULT_SERVICE_PRICES,
  );
  const [collegeUrgencyCharge, setCollegeUrgencyCharge] = useState(
    DEFAULT_URGENCY_CHARGE,
  );
  const [usingCollegePricing, setUsingCollegePricing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Paper charge state
  const [paperChargeConfigs, setPaperChargeConfigs] = useState<
    PaperChargeConfig[]
  >([]);
  const [numPages, setNumPages] = useState<number>(1);

  // Material purchase state
  const { actor: backendActor } = useActor(createActor);
  const [recordBookPrice, setRecordBookPrice] = useState(60);
  const [notebookPrice, setNotebookPrice] = useState(50);
  const [materialChoice, setMaterialChoice] = useState<
    "selfRecord" | "buyRecord" | "selfNotebook" | "buyNotebook" | null
  >(null);

  // Fetch colleges and resolve the user's registered college name
  useEffect(() => {
    getColleges().then((allColleges) => {
      setColleges(allColleges);
      if (user?.registeredCollegeId) {
        const found = allColleges.find(
          (c) =>
            c.id === user.registeredCollegeId ||
            c.name === user.registeredCollegeId,
        );
        if (found) setRegisteredCollegeName(found.name);
        else setRegisteredCollegeName(user.registeredCollegeId);
      }
    });
  }, [user?.registeredCollegeId]);
  // Fetch paper charge configs on mount
  useEffect(() => {
    listPaperChargeConfigs().then(setPaperChargeConfigs);
  }, []);

  // Fetch material prices on mount
  useEffect(() => {
    const fetchMaterialPrices = async () => {
      try {
        if (backendActor) {
          const prices = await backendActor.getMaterialPrices();
          setRecordBookPrice(Number(prices.recordBookPrice));
          setNotebookPrice(Number(prices.notebookPrice));
          return;
        }
      } catch {}
      // localStorage fallback
      try {
        const raw = localStorage.getItem("assignflow_material_prices");
        if (raw) {
          const p = JSON.parse(raw) as {
            recordBookPrice: number;
            notebookPrice: number;
          };
          setRecordBookPrice(p.recordBookPrice);
          setNotebookPrice(p.notebookPrice);
        }
      } catch {}
    };
    fetchMaterialPrices();
  }, [backendActor]);

  // Reset material choice when service type changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on serviceType change
  useEffect(() => {
    setMaterialChoice(null);
  }, [serviceType]);

  // Fetch college-specific pricing based on user's registered college
  useEffect(() => {
    const collegeName = registeredCollegeName;
    if (!collegeName) {
      setCollegePrices(DEFAULT_SERVICE_PRICES);
      setCollegeUrgencyCharge(DEFAULT_URGENCY_CHARGE);
      setUsingCollegePricing(false);
      return;
    }
    getCollegePricing(collegeName).then((pricing) => {
      if (pricing) {
        setCollegePrices({
          SoftCopy: pricing.softCopy,
          HardCopy: pricing.hardCopy,
          RecordWriting: pricing.recordWriting,
          NotesWriting: pricing.notesWriting,
          Other: pricing.otherBase,
        });
        setCollegeUrgencyCharge(pricing.urgencyCharge);
        setUsingCollegePricing(true);
      } else {
        setCollegePrices(DEFAULT_SERVICE_PRICES);
        setCollegeUrgencyCharge(DEFAULT_URGENCY_CHARGE);
        setUsingCollegePricing(false);
      }
    });
  }, [registeredCollegeName]);

  const basePrice =
    collegePrices[serviceType] ?? DEFAULT_SERVICE_PRICES[serviceType] ?? 300;
  const isAutoUrgent = computeUrgency(deadline);
  const urgencyCharge = isAutoUrgent ? collegeUrgencyCharge : 0;

  // RecordWriting and NotesWriting: flat rate only (no page count)
  const isPagesService =
    serviceType === "HardCopy" || serviceType === "SoftCopy";
  // Paper charges: only applicable for page-based services
  const activePaperConfig = isPagesService
    ? paperChargeConfigs.find(
        (c) => c.serviceType === serviceType && c.paperChargeEnabled,
      )
    : undefined;
  const paperTotal = activePaperConfig
    ? numPages * activePaperConfig.paperChargePerPage
    : 0;

  // Material charge amount
  const materialChargeAmount =
    materialChoice === "buyRecord"
      ? recordBookPrice
      : materialChoice === "buyNotebook"
        ? notebookPrice
        : 0;

  const totalPrice =
    basePrice + urgencyCharge + paperTotal + materialChargeAmount;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!customerPhone.trim()) e.customerPhone = "Phone number is required";
    else if (!/^[0-9]{10}$/.test(customerPhone.trim()))
      e.customerPhone = "Please enter a valid 10-digit phone number";
    if (!subject.trim()) e.subject = "Subject name is required";
    if (!department.trim()) e.department = "Department is required";
    if (!deadline) e.deadline = "Please set a deadline";
    if (!description.trim()) e.description = "Please describe the assignment";
    if (serviceType === "Other" && !customServiceType.trim())
      e.customServiceType = "Please describe your service type";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped].slice(0, 5));
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)].slice(0, 5));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const finalServiceType: ServiceType =
        serviceType === "Other" ? "Other" : (serviceType as ServiceType);
      const order = await createOrder({
        customerId: user?.id ?? "cust_1",
        customerName: user?.name ?? "",
        customerEmail: user?.email ?? "",
        serviceType: finalServiceType,
        customServiceType:
          serviceType === "Other" ? customServiceType : undefined,
        subjectName: subject,
        department,
        deadline: new Date(deadline).getTime(),
        isUrgent: isAutoUrgent,
        description,
        amount: totalPrice,
        basePrice,
        urgencyCharge,
        pageCount: activePaperConfig ? numPages : 0,
        paperChargeAmount: paperTotal,
        materialChoice: materialChoice ?? undefined,
        materialChargeAmount,
        college: registeredCollegeName || user?.registeredCollegeId,
        customerPhone: customerPhone.trim(),
      });
      // Open payment modal inline — no navigation
      setPendingOrderId(order.id);
      setShowPaymentModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowPaymentModal(false);
  };

  const handlePaymentSuccess = (_transactionId: string) => {
    setShowPaymentModal(false);
    setPaymentSuccess(true);
    // Reset form after 3s
    setTimeout(() => {
      setPaymentSuccess(false);
      setPendingOrderId(null);
      setServiceType("SoftCopy");
      setCustomServiceType("");
      setSubject("");
      setDepartment("");
      setDeadline("");
      setDescription("");
      setFiles([]);
      setCustomerPhone("");
      setErrors({});
    }, 3000);
  };

  return (
    <CustomerLayout pageTitle="Place Order">
      {/* Payment success banner */}
      {paymentSuccess && (
        <div
          className="max-w-3xl mx-auto mb-4 flex items-center gap-3 p-4 bg-green-50 border border-green-300 rounded-xl animate-fadeIn"
          data-ocid="order.payment_success_state"
        >
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">
              Payment Verified! Your order is now active.
            </p>
            <p className="text-xs text-green-600">
              Form will reset shortly for a new order.
            </p>
          </div>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto space-y-4 md:space-y-6 animate-fadeIn pb-8"
      >
        {/* Service Type */}
        <div className="card p-4 md:p-6">
          <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-3 md:mb-4">
            Service Type
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
            {SERVICE_TYPES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setServiceType(s.value)}
                data-ocid={`order.service_type.${s.value.toLowerCase()}`}
                className={`p-3 md:p-4 rounded-xl border-2 text-left transition-all ${
                  serviceType === s.value
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                }`}
              >
                <p
                  className={`text-xs md:text-sm font-semibold ${serviceType === s.value ? "text-blue-700" : "text-gray-800"}`}
                >
                  {s.label}
                </p>
                <p className="text-[10px] md:text-xs text-gray-400 mt-0.5">
                  {s.description}
                </p>
                {s.value !== "Other" && (
                  <p
                    className={`text-xs md:text-sm font-bold mt-1 md:mt-2 ${serviceType === s.value ? "text-blue-600" : "text-gray-600"}`}
                  >
                    ₹{collegePrices[s.value] ?? s.base}
                  </p>
                )}
              </button>
            ))}
          </div>

          {/* Custom service type input */}
          {serviceType === "Other" && (
            <div className="mt-4">
              <label
                htmlFor="order-custom-service"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Describe your service type *
              </label>
              <input
                id="order-custom-service"
                type="text"
                value={customServiceType}
                maxLength={100}
                onChange={(e) => {
                  setCustomServiceType(e.target.value);
                  setErrors((p) => ({ ...p, customServiceType: "" }));
                }}
                placeholder="e.g. Thesis writing, Literature survey..."
                className="input-field"
                data-ocid="order.custom_service_input"
              />
              <div className="flex justify-between mt-1">
                {errors.customServiceType ? (
                  <p
                    className="text-xs text-red-500"
                    data-ocid="order.custom_service.field_error"
                  >
                    {errors.customServiceType}
                  </p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-gray-400">
                  {customServiceType.length}/100
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Material Purchase Options — shown for RecordWriting and NotesWriting */}
        {(serviceType === "RecordWriting" ||
          serviceType === "NotesWriting") && (
          <div className="card p-4 md:p-6">
            <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-3">
              {serviceType === "RecordWriting" ? "Record Book" : "Notebook"}{" "}
              Option
            </h3>
            <div className="space-y-2.5">
              <label
                className="flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all hover:bg-gray-50"
                style={{
                  borderColor:
                    materialChoice ===
                      (serviceType === "RecordWriting"
                        ? "selfRecord"
                        : "selfNotebook") ||
                    (!materialChoice && true)
                      ? materialChoice ===
                        (serviceType === "RecordWriting"
                          ? "selfRecord"
                          : "selfNotebook")
                        ? "#2563eb"
                        : "#e5e7eb"
                      : "#e5e7eb",
                }}
              >
                <input
                  type="radio"
                  name="material-choice"
                  value={
                    serviceType === "RecordWriting"
                      ? "selfRecord"
                      : "selfNotebook"
                  }
                  checked={
                    materialChoice ===
                      (serviceType === "RecordWriting"
                        ? "selfRecord"
                        : "selfNotebook") || materialChoice === null
                  }
                  onChange={() =>
                    setMaterialChoice(
                      serviceType === "RecordWriting"
                        ? "selfRecord"
                        : "selfNotebook",
                    )
                  }
                  className="mt-0.5 accent-blue-600"
                  data-ocid={"order.material_self_radio"}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    I will provide the{" "}
                    {serviceType === "RecordWriting"
                      ? "Record Book"
                      : "Notebook"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    No extra charge
                  </p>
                </div>
              </label>
              <label
                className="flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all hover:bg-blue-50"
                style={{
                  borderColor:
                    materialChoice ===
                    (serviceType === "RecordWriting"
                      ? "buyRecord"
                      : "buyNotebook")
                      ? "#2563eb"
                      : "#e5e7eb",
                }}
              >
                <input
                  type="radio"
                  name="material-choice"
                  value={
                    serviceType === "RecordWriting"
                      ? "buyRecord"
                      : "buyNotebook"
                  }
                  checked={
                    materialChoice ===
                    (serviceType === "RecordWriting"
                      ? "buyRecord"
                      : "buyNotebook")
                  }
                  onChange={() =>
                    setMaterialChoice(
                      serviceType === "RecordWriting"
                        ? "buyRecord"
                        : "buyNotebook",
                    )
                  }
                  className="mt-0.5 accent-blue-600"
                  data-ocid={"order.material_buy_radio"}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Buy{" "}
                    {serviceType === "RecordWriting"
                      ? "Record Book"
                      : "Notebook"}{" "}
                    for me
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    +₹
                    {serviceType === "RecordWriting"
                      ? recordBookPrice
                      : notebookPrice}{" "}
                    added to total
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Assignment Details */}
        <div className="card p-4 md:p-6 space-y-3 md:space-y-4">
          <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-1 md:mb-2">
            Assignment Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label
                htmlFor="order-college"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                College
              </label>
              <input
                id="order-college"
                type="text"
                value={registeredCollegeName || user?.registeredCollegeId || ""}
                disabled
                readOnly
                className="input-field bg-gray-50 cursor-not-allowed text-gray-600"
                data-ocid="order.college_readonly"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="order-phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number *
              </label>
              <input
                id="order-phone"
                type="tel"
                inputMode="numeric"
                value={customerPhone}
                maxLength={10}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  setCustomerPhone(digits);
                  setErrors((p) => ({ ...p, customerPhone: "" }));
                }}
                placeholder="Enter phone number"
                className="input-field"
                data-ocid="order.phone_input"
              />
              {errors.customerPhone && (
                <p
                  className="text-xs text-red-500 mt-1"
                  data-ocid="order.phone.field_error"
                >
                  {errors.customerPhone}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="order-subject"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Subject Name *
              </label>
              <input
                id="order-subject"
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setErrors((p) => ({ ...p, subject: "" }));
                }}
                placeholder="e.g. Data Structures"
                className="input-field"
                data-ocid="order.subject_input"
              />
              {errors.subject && (
                <p
                  className="text-xs text-red-500 mt-1"
                  data-ocid="order.subject.field_error"
                >
                  {errors.subject}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="order-department"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Department *
              </label>
              <input
                id="order-department"
                type="text"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setErrors((p) => ({ ...p, department: "" }));
                }}
                placeholder="e.g. Computer Science"
                className="input-field"
                data-ocid="order.department_input"
              />
              {errors.department && (
                <p
                  className="text-xs text-red-500 mt-1"
                  data-ocid="order.department.field_error"
                >
                  {errors.department}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="order-deadline"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Deadline *
              </label>
              <input
                id="order-deadline"
                type="date"
                value={deadline}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setDeadline(e.target.value);
                  setErrors((p) => ({ ...p, deadline: "" }));
                }}
                className="input-field"
                data-ocid="order.deadline_input"
              />
              {errors.deadline && (
                <p
                  className="text-xs text-red-500 mt-1"
                  data-ocid="order.deadline.field_error"
                >
                  {errors.deadline}
                </p>
              )}
              {/* Auto-urgency notice */}
              {deadline && isAutoUrgent && (
                <div className="mt-2 flex items-center gap-1.5 text-amber-700">
                  <Zap className="h-3.5 w-3.5 flex-shrink-0" />
                  <p className="text-xs font-medium">
                    Urgent deadline — ₹{collegeUrgencyCharge} urgency charge
                    applied automatically
                    {usingCollegePricing
                      ? ` (${registeredCollegeName} rate)`
                      : ""}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="order-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description *
            </label>
            <textarea
              id="order-description"
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((p) => ({ ...p, description: "" }));
              }}
              placeholder="Describe your assignment requirements in detail..."
              className="input-field resize-none"
              data-ocid="order.description_textarea"
            />
            {errors.description && (
              <p
                className="text-xs text-red-500 mt-1"
                data-ocid="order.description.field_error"
              >
                {errors.description}
              </p>
            )}
          </div>
        </div>

        {/* File upload */}
        <div className="card p-4 md:p-6">
          <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-2 md:mb-3">
            Attach Files
          </h3>
          <button
            type="button"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload files"
            data-ocid="order.dropzone"
            className={`w-full border-2 border-dashed rounded-xl p-6 md:p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
            }`}
          >
            <UploadCloud className="h-6 w-6 md:h-8 md:w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-xs md:text-sm font-medium text-gray-700">
              Drop files or click to upload
            </p>
            <p className="text-[10px] md:text-xs text-gray-400 mt-1">
              PDF, DOC, DOCX, JPG, PNG, ZIP — Max 5 files
            </p>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
            className="hidden"
            onChange={handleFileInput}
          />
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f, i) => (
                <FileItem
                  key={f.name}
                  name={f.name}
                  size={f.size}
                  onRemove={() =>
                    setFiles((prev) => prev.filter((_, j) => j !== i))
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Price Summary */}
        <div className="card p-4 md:p-6">
          <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-2 md:mb-3">
            Price Summary
          </h3>

          {/* Number of Pages — only shown for HardCopy/SoftCopy when paper charges are enabled */}
          {activePaperConfig && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <label
                htmlFor="order-num-pages"
                className="block text-sm font-semibold text-amber-800 mb-1"
              >
                Number of Pages *
              </label>
              <p className="text-xs text-amber-600 mb-2">
                Paper charges apply for this service
              </p>
              <input
                id="order-num-pages"
                type="number"
                min={1}
                value={numPages}
                onChange={(e) =>
                  setNumPages(Math.max(1, Number(e.target.value)))
                }
                className="input-field w-32"
                data-ocid="order.num_pages_input"
              />
            </div>
          )}

          <div className="space-y-2 text-sm">
            {usingCollegePricing && (
              <div className="flex items-center gap-1.5 mb-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                <CheckCircle className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                <p className="text-xs text-blue-700 font-medium">
                  College-specific pricing applied for {registeredCollegeName}
                </p>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>
                {SERVICE_TYPES.find((s) => s.value === serviceType)?.label}{" "}
                {serviceType === "Other" && customServiceType
                  ? `— ${customServiceType}`
                  : "(base)"}
              </span>
              <span>₹{basePrice}</span>
            </div>
            {materialChargeAmount > 0 && (
              <div className="flex justify-between text-indigo-700">
                <span>
                  {materialChoice === "buyRecord"
                    ? "Record Book Charges"
                    : "Notebook Charges"}
                </span>
                <span>+ ₹{materialChargeAmount}</span>
              </div>
            )}
            {activePaperConfig && paperTotal > 0 && (
              <div className="flex justify-between text-amber-700">
                <span className="flex items-center gap-1">Paper Charges</span>
                <span>+ ₹{paperTotal}</span>
              </div>
            )}
            <div
              className={`flex justify-between ${isAutoUrgent ? "text-amber-600" : "text-gray-400"}`}
            >
              <span className="flex items-center gap-1">
                {isAutoUrgent && <Zap className="h-3.5 w-3.5" />}
                Urgency Charge
              </span>
              <span>{isAutoUrgent ? `+ ₹${urgencyCharge}` : "—"}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-1" />
            <div className="flex justify-between font-bold text-gray-900 text-base">
              <span>Total Amount</span>
              <span className="text-blue-700 text-lg">₹{totalPrice}</span>
            </div>
          </div>
          {isAutoUrgent && (
            <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                Urgency charge applied — deadline is today or tomorrow.{" "}
                {usingCollegePricing
                  ? `₹${urgencyCharge} (${registeredCollegeName} rate)`
                  : ""}
              </p>
            </div>
          )}
          <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Payment via UPI/QR code after order placement. Upload proof in the
              Payments section.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-3 text-sm md:text-base disabled:opacity-60 min-h-[48px]"
          data-ocid="order.submit_button"
        >
          {submitting ? "Placing Order..." : "Place Order"}
        </button>
      </form>

      {/* Inline payment overlay — no navigation */}
      {pendingOrderId && (
        <PaymentModal
          isOpen={showPaymentModal}
          orderId={pendingOrderId}
          onClose={handleModalClose}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </CustomerLayout>
  );
}
