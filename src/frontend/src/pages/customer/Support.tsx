import { CustomerLayout } from "@/layouts/CustomerLayout";
import { getSupportTickets } from "@/services/api";
import type { SupportTicket } from "@/types";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  PaperclipIcon,
  Plus,
  Send,
  Ticket,
} from "lucide-react";
import { useEffect, useState } from "react";

const TICKET_STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-indigo-100 text-indigo-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

const FAQS = [
  {
    q: "How long does it take for my assignment to be completed?",
    a: "Typical turnaround is 2–5 business days depending on service type and urgency. Urgent orders are prioritized and completed within 24–48 hours.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We currently accept UPI payments and QR code scan-to-pay. After payment, upload your transaction screenshot as proof in the Payments section.",
  },
  {
    q: "Can I get a refund if I am not satisfied?",
    a: "Yes, we offer revisions and refunds for quality issues. Raise a support ticket within 48 hours of delivery and our team will review your case.",
  },
  {
    q: "How do I track my order status?",
    a: "Go to Order Tracking in the left sidebar. You can see the full 8-stage timeline, messages from admin/writer, and estimated completion.",
  },
  {
    q: "Is my data and assignment information secure?",
    a: "Absolutely. All data is encrypted and only accessible to you, the assigned writer, and relevant admin. We follow strict privacy and confidentiality policies.",
  },
  {
    q: "What file formats can I upload with my order?",
    a: "You can upload PDF, DOC, DOCX, JPG, PNG, and ZIP files. Maximum 5 attachments per order.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
        data-ocid="support.faq.toggle"
      >
        <span className="text-sm font-medium text-gray-800">{q}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Technical");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getSupportTickets("cust_1").then((t) => {
      setTickets(t);
      setLoading(false);
    });
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!subject.trim()) e.subject = "Subject is required";
    if (!desc.trim()) e.desc = "Description is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    const newTicket: SupportTicket = {
      id: `tick_${Date.now()}`,
      customerId: "cust_1",
      customerName: "Arjun Sharma",
      subject,
      description: desc,
      status: "open",
      priority: "medium",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setTickets((prev) => [newTicket, ...prev]);
    setSubject("");
    setDesc("");
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <CustomerLayout pageTitle="Help & Support">
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
        {/* Raise ticket */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-blue-600" /> Raise a Support Ticket
          </h3>
          {submitted && (
            <div
              className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2"
              data-ocid="support.ticket.success_state"
            >
              <HelpCircle className="h-4 w-4" /> Ticket submitted! Our team will
              respond within 24 hours.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="support-subject"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Subject *
                </label>
                <input
                  id="support-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    setErrors((p) => ({ ...p, subject: "" }));
                  }}
                  placeholder="Brief description of the issue"
                  className="input-field"
                  data-ocid="support.subject_input"
                />
                {errors.subject && (
                  <p
                    className="text-xs text-red-500 mt-1"
                    data-ocid="support.subject.field_error"
                  >
                    {errors.subject}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="support-category"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Category
                </label>
                <select
                  id="support-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field"
                  data-ocid="support.category_select"
                >
                  {["Technical", "Payment", "Quality", "Delivery", "Other"].map(
                    (c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
            <div>
              <label
                htmlFor="support-description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description *
              </label>
              <textarea
                id="support-description"
                rows={4}
                value={desc}
                onChange={(e) => {
                  setDesc(e.target.value);
                  setErrors((p) => ({ ...p, desc: "" }));
                }}
                placeholder="Explain the issue in detail..."
                className="input-field resize-none"
                data-ocid="support.description_textarea"
              />
              {errors.desc && (
                <p
                  className="text-xs text-red-500 mt-1"
                  data-ocid="support.description.field_error"
                >
                  {errors.desc}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
                data-ocid="support.attach_button"
              >
                <PaperclipIcon className="h-4 w-4" /> Attach File
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex items-center gap-2 disabled:opacity-60"
                data-ocid="support.submit_button"
              >
                <Send className="h-4 w-4" />{" "}
                {submitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </div>
          </form>
        </div>

        {/* My tickets */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Ticket className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900">My Tickets</h3>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-50 rounded animate-pulse"
                />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-10 text-gray-400"
              data-ocid="support.tickets.empty_state"
            >
              <Ticket className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No tickets yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Ticket ID",
                      "Subject",
                      "Category",
                      "Status",
                      "Created",
                      "Action",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tickets.map((t, i) => (
                    <tr
                      key={t.id}
                      className="hover:bg-gray-50"
                      data-ocid={`support.ticket.item.${i + 1}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">
                        {t.id}
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate">
                        {t.subject}
                      </td>
                      <td className="px-4 py-3 text-gray-500">—</td>
                      <td className="px-4 py-3">
                        <span
                          className={`status-badge text-xs ${TICKET_STATUS_COLORS[t.status] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {t.status
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(t.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-xs text-blue-600 hover:underline"
                          data-ocid={`support.view_ticket_button.${i + 1}`}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FAQ */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-blue-600" /> Frequently Asked
            Questions
          </h3>
          <div className="space-y-2">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
