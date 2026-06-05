import { useEffect, useState } from "react";
import {
  getOrders,
  getSystemSettings,
  submitPaymentRequest,
  uploadPaymentScreenshot,
} from "../../services/api";

interface PaymentModalProps {
  isOpen: boolean;
  orderId: string;
  onClose: () => void;
  onSuccess: (transactionId: string) => void;
}

export default function PaymentModal({
  isOpen,
  orderId,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState<"scanner" | "upi">("scanner");
  const [step, setStep] = useState<"payment" | "upload" | "done">("payment");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [settings, setSettings] = useState<{
    qrCodeUrl?: string;
    upiId?: string;
  } | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrFailed, setQrFailed] = useState(false);
  const [orderAmount, setOrderAmount] = useState(0);
  const [orderBasePrice, setOrderBasePrice] = useState<number | undefined>();
  const [orderPaperCharge, setOrderPaperCharge] = useState<
    number | undefined
  >();
  const [_orderPageCount, setOrderPageCount] = useState<number | undefined>();
  const [orderUrgencyCharge, setOrderUrgencyCharge] = useState<
    number | undefined
  >();
  const [toastMsg, setToastMsg] = useState("");
  const [upiCopied, setUpiCopied] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  useEffect(() => {
    if (!isOpen) return;
    getSystemSettings().then((s) => {
      setSettings(s);
      setQrLoading(false);
    });
    if (orderId) {
      getOrders().then((orders) => {
        const thisOrder = orders.find((o) => o.id === orderId);
        if (thisOrder) {
          setOrderAmount(thisOrder.amount || 0);
          setOrderBasePrice(thisOrder.basePrice);
          setOrderPaperCharge(thisOrder.paperChargeAmount);
          setOrderPageCount(thisOrder.pageCount);
          setOrderUrgencyCharge(thisOrder.urgencyCharge);
        }
      });
    }
  }, [orderId, isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("payment");
      setScreenshotFile(null);
      setUploadProgress(0);
      setUploading(false);
      setUpiCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "upload") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose, step]);

  if (!isOpen) return null;

  const adminUpiId = settings?.upiId ?? "9493442754@fam";

  const handleClose = () => {
    if (step === "upload" && uploading) return;
    onClose();
  };

  const handleIPaid = () => {
    setStep("upload");
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(adminUpiId);
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(false), 2000);
  };

  const handleUploadAndSubmit = async () => {
    if (!screenshotFile) return;

    // Validate image format
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const ext = screenshotFile.name.split(".").pop()?.toLowerCase() ?? "";
    const validExts = ["jpg", "jpeg", "png", "webp"];
    if (!validTypes.includes(screenshotFile.type) && !validExts.includes(ext)) {
      showToast("Only JPG, PNG, or WEBP images are allowed");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      // Step 1: Convert file to data URL — this is a permanent, embeddable URL
      const permanentUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(screenshotFile);
      });

      setUploadProgress(50);

      // Step 2: Store the permanent URL (data URL) and submit payment request
      await uploadPaymentScreenshot(orderId, permanentUrl);
      setUploadProgress(80);

      await submitPaymentRequest(orderId, permanentUrl);
      setUploadProgress(100);

      setTimeout(() => {
        setStep("done");
        onSuccess("");
        showToast("Payment proof submitted successfully!");
      }, 300);
    } catch {
      setUploading(false);
      setUploadProgress(0);
      showToast("Upload failed. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleClose}
      onKeyDown={() => {}}
      role="presentation"
    >
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-lg bg-[#1a1a2e] border border-[#f43f5e]/30 text-white text-sm shadow-lg animate-fadeIn">
          {toastMsg}
        </div>
      )}

      <div
        className="bg-[#0f1117] border border-[#f43f5e]/20 rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#f43f5e]/10">
          <h2 className="text-white font-semibold text-lg">
            {step === "payment" && "Secure Checkout"}
            {step === "upload" && "Upload Payment Screenshot"}
            {step === "done" && "Payment Submitted"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="text-white/60 hover:text-white transition-colors disabled:opacity-40"
            data-ocid="payment_modal.close_button"
          >
            ✕
          </button>
        </div>

        {/* Amount + Breakdown */}
        <div className="text-center py-3 border-b border-[#f43f5e]/10">
          {orderBasePrice !== undefined && orderBasePrice > 0 ? (
            <div className="space-y-1 px-4">
              <div className="flex justify-between text-xs text-white/40">
                <span>Base Price</span>
                <span>₹{orderBasePrice}</span>
              </div>
              {orderPaperCharge !== undefined && orderPaperCharge > 0 && (
                <div className="flex justify-between text-xs text-amber-400">
                  <span>Paper Charges</span>
                  <span>+₹{orderPaperCharge}</span>
                </div>
              )}
              {orderUrgencyCharge !== undefined && orderUrgencyCharge > 0 && (
                <div className="flex justify-between text-xs text-amber-400">
                  <span>Urgency Charge</span>
                  <span>+₹{orderUrgencyCharge}</span>
                </div>
              )}
              <div className="pt-1 border-t border-white/10">
                <p className="text-white/50 text-xs uppercase tracking-wide">
                  Total Amount
                </p>
                <p className="text-[#f43f5e] text-2xl font-bold">
                  ₹{orderAmount || 0}
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-white/50 text-xs uppercase tracking-wide">
                Total Amount
              </p>
              <p className="text-[#f43f5e] text-2xl font-bold">
                ₹{orderAmount || 0}
              </p>
            </>
          )}
        </div>

        {/* STEP: Payment */}
        {step === "payment" && (
          <div className="flex flex-col md:flex-row">
            {/* Tabs */}
            <div className="flex md:flex-col gap-1 p-3 bg-black/20 border-b md:border-b-0 md:border-r border-white/5 overflow-x-auto md:overflow-visible">
              {(["scanner", "upi"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTab(t)}
                  className={`flex items-center gap-2 py-2 px-3 md:px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === t
                      ? "bg-[#f43f5e]/20 text-[#f43f5e] ring-1 ring-[#f43f5e]/50"
                      : "text-white/40 hover:text-white/70"
                  }`}
                  data-ocid={`payment_modal.${t}_tab`}
                >
                  {t === "scanner" ? "Scanner" : "UPI ID Pay"}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-4">
              {activeTab === "scanner" && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="relative rounded-xl overflow-hidden bg-white p-3"
                      style={{ border: "1px solid rgba(244,63,94,0.2)" }}
                    >
                      {qrLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0f1117]/90">
                          <div className="h-8 w-8 rounded-full border-2 border-[#f43f5e] border-t-transparent animate-spin" />
                        </div>
                      )}
                      {qrFailed ? (
                        <div className="w-[180px] h-[180px] md:w-[220px] md:h-[220px] flex items-center justify-center bg-[#1a1a2e]">
                          <p className="text-xs text-white/40">
                            QR unavailable
                          </p>
                        </div>
                      ) : (
                        <img
                          src={
                            settings?.qrCodeUrl ||
                            `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`upi://pay?pa=${adminUpiId}&pn=AssignServiceHub&am=${orderAmount}&cu=INR`)}`
                          }
                          alt="UPI QR Code"
                          className="max-w-[180px] sm:max-w-[220px] w-full h-auto object-contain"
                          onLoad={() => setQrLoading(false)}
                          onError={() => {
                            setQrLoading(false);
                            setQrFailed(true);
                          }}
                        />
                      )}
                      {!qrFailed && !qrLoading && (
                        <div
                          className="absolute left-0 right-0 h-0.5 pointer-events-none"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent, rgba(244,63,94,0.6), transparent)",
                            animation: "scanline 3s ease-in-out infinite",
                            top: "12px",
                          }}
                        />
                      )}
                    </div>
                    <p className="text-xs text-white/40">
                      Scan using GPay, PhonePe, Paytm, BHIM
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {["GPay", "PhonePe", "Paytm", "BHIM"].map((app) => (
                      <span
                        key={app}
                        className="px-2 py-1 rounded-md bg-white/5 text-[10px] text-white/40"
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQrLoading(true);
                        setQrFailed(false);
                        getSystemSettings().then((s) => {
                          setSettings(s);
                          setQrLoading(false);
                        });
                      }}
                      className="flex-1 py-2.5 rounded-xl ring-1 ring-[#f43f5e]/50 text-[#f43f5e] font-medium text-sm"
                      data-ocid="payment_modal.refresh_qr_button"
                    >
                      Refresh QR
                    </button>
                    <button
                      type="button"
                      onClick={handleIPaid}
                      className="flex-1 py-2.5 rounded-xl bg-[#f43f5e] text-white font-semibold text-sm"
                      data-ocid="payment_modal.i_paid_button"
                    >
                      I Have Paid
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "upi" && (
                <div className="space-y-4">
                  {/* Admin UPI ID display — read only, no customer input */}
                  <div>
                    <p className="text-white/50 text-xs mb-2">
                      Pay to this UPI ID
                    </p>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-white font-mono text-sm font-semibold flex-1 tracking-wide">
                        {adminUpiId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          upiCopied
                            ? "bg-green-500/20 text-green-400 ring-1 ring-green-500/50"
                            : "bg-[#f43f5e]/15 text-[#f87171] hover:bg-[#f43f5e]/25 ring-1 ring-[#f43f5e]/30"
                        }`}
                        data-ocid="payment_modal.copy_upi_button"
                      >
                        {upiCopied ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {/* Informational note */}
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.07]">
                    <span className="text-white/30 text-xs mt-0.5">ℹ</span>
                    <p className="text-white/35 text-xs leading-relaxed">
                      We will soon integrate gateway payment
                    </p>
                  </div>

                  <p className="text-xs text-white/30 text-center">
                    Open your UPI app, pay ₹{orderAmount}, then click below
                  </p>
                  <button
                    type="button"
                    onClick={handleIPaid}
                    className="w-full py-3 rounded-xl bg-[#f43f5e] text-white font-semibold text-sm"
                    data-ocid="payment_modal.i_paid_button"
                  >
                    I Have Paid
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP: Upload Screenshot */}
        {step === "upload" && (
          <div className="p-6 space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 mb-3">
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="text-white font-semibold text-base mb-1">
                Upload Proof of Payment
              </h3>
              <p className="text-white/50 text-sm">
                Upload proof of your payment to complete the order. An admin
                will verify and activate your order.
              </p>
            </div>

            <label
              htmlFor="screenshot-upload-input"
              className="relative border-2 border-dashed border-[#f43f5e]/30 rounded-xl p-6 text-center hover:border-[#f43f5e]/60 transition-colors cursor-pointer block"
              data-ocid="payment_modal.dropzone"
            >
              <input
                id="screenshot-upload-input"
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file) {
                    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
                    const valid = ["jpg", "jpeg", "png", "webp"];
                    if (!valid.includes(ext)) {
                      showToast("Only JPG, PNG, or WEBP images are allowed");
                      setScreenshotFile(null);
                      return;
                    }
                  }
                  setScreenshotFile(file);
                }}
              />
              {screenshotFile ? (
                <div className="space-y-2">
                  <p className="text-[#f43f5e] font-medium text-sm">
                    ✓ {screenshotFile.name}
                  </p>
                  <p className="text-white/30 text-xs">
                    {(screenshotFile.size / 1024).toFixed(1)} KB — click to
                    change
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-white/40 text-sm">
                    Click to select your payment screenshot
                  </p>
                  <p className="text-white/20 text-xs">
                    PNG, JPG, JPEG, WebP supported
                  </p>
                </div>
              )}
            </label>

            {/* Upload progress */}
            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-white/40">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-[#f43f5e] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("payment")}
                disabled={uploading}
                className="flex-1 py-2.5 rounded-xl ring-1 ring-white/20 text-white/60 font-medium text-sm disabled:opacity-40"
                data-ocid="payment_modal.back_button"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleUploadAndSubmit}
                disabled={!screenshotFile || uploading}
                className="flex-1 py-2.5 rounded-xl bg-[#f43f5e] text-white font-semibold text-sm disabled:opacity-60"
                data-ocid="payment_modal.upload_screenshot_button"
              >
                {uploading ? "Submitting..." : "Submit Proof"}
              </button>
            </div>
          </div>
        )}

        {/* STEP: Done */}
        {step === "done" && (
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30">
              <span className="text-3xl">⏳</span>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Awaiting Verification
              </span>
              <h3 className="text-white font-semibold text-lg mt-2">
                Payment Proof Submitted
              </h3>
              <p className="text-white/50 text-sm mt-1 max-w-xs mx-auto">
                Your payment proof has been submitted. An admin will verify and
                activate your order shortly.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                window.location.href = "/customer/payments";
              }}
              className="mt-2 w-full max-w-[200px] py-2.5 rounded-xl bg-[#f43f5e]/20 text-[#f43f5e] font-medium text-sm ring-1 ring-[#f43f5e]/40 hover:bg-[#f43f5e]/30 transition-colors"
              data-ocid="payment_modal.close_button"
            >
              View Payment History
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanline {
          0%, 100% { top: 12px; opacity: 0; }
          10% { opacity: 0.4; }
          50% { top: calc(100% - 12px); opacity: 0.4; }
          90% { opacity: 0.4; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease both; }
      `}</style>
    </div>
  );
}
