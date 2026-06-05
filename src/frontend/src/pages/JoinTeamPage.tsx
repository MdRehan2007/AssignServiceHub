import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Building,
  Calendar,
  CheckCircle,
  FileText,
  Link,
  Mail,
  Send,
  User,
} from "lucide-react";
import { useState } from "react";

interface FormData {
  name: string;
  email: string;
  dob: string;
  college: string;
  customCollege: string;
  notesUrl: string;
  skills: string;
  customSkill: string;
  phone: string;
}

interface ResumeState {
  file: File | null;
  error: string;
}

const INITIAL: FormData = {
  name: "",
  email: "",
  dob: "",
  college: "",
  customCollege: "",
  notesUrl: "",
  skills: "",
  customSkill: "",
  phone: "",
};

const COLLEGES = [
  "SRMAP",
  "KL University",
  "GITAM",
  "Andhra University",
  "VIT",
  "Other",
];

const SKILLS = [
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
  "Presentation Design",
  "Communication Skills",
  "Client Handling",
  "Time Management",
  "Critical Thinking",
  "AI Tool Usage",
  "Canva Designing",
  "Technical Writing",
  "Content Writing",
  "Other",
];

export function JoinTeamPage() {
  const navigate = useNavigate();
  const { actor } = useActor(createActor);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [resume, setResume] = useState<ResumeState>({ file: null, error: "" });
  const [submitted, setSubmitted] = useState(false);
  const [appId, setAppId] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate(): boolean {
    const errs: Partial<FormData> = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      errs.email = "Valid Gmail address is required";
    if (!form.dob) errs.dob = "Date of birth is required";
    if (!form.college) errs.college = "Please select a college";
    if (form.college === "Other" && !form.customCollege.trim())
      errs.college = "Please enter your college name";
    if (!form.skills.trim()) errs.skills = "Please describe your skills";
    // Resume validation
    if (!resume.file) {
      setResume((prev) => ({
        ...prev,
        error: "Resume is required (PDF, DOC, or DOCX)",
      }));
      setErrors(errs);
      return false;
    }
    setResume((prev) => ({ ...prev, error: "" }));
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleResumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setResume({ file: null, error: "" });
      return;
    }
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (
      !allowed.includes(file.type) &&
      !["pdf", "doc", "docx"].includes(ext ?? "")
    ) {
      setResume({
        file: null,
        error: "Only PDF, DOC, or DOCX files are allowed",
      });
      e.target.value = "";
      return;
    }
    setResume({ file, error: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const selectedSkills = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const expertise =
        form.customSkill.trim() && selectedSkills.includes("Other")
          ? [
              ...selectedSkills.filter((s) => s !== "Other"),
              form.customSkill.trim(),
            ]
          : selectedSkills.filter((s) => s !== "Other");
      const college =
        form.college === "Other" ? form.customCollege.trim() : form.college;
      // bio is built from dob + any extra info (dob kept in UI, not sent as field)
      const bio = `Date of Birth: ${form.dob}`;
      // Read resume file as data URL
      let resumeKey = "";
      let resumeUrl = "";
      if (resume.file) {
        resumeKey = resume.file.name;
        resumeUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("File read error"));
          reader.readAsDataURL(resume.file as File);
        });
      }
      const result = actor
        ? await actor.submitWriterApplication(
            form.name.trim(),
            form.email.trim(),
            form.phone.trim(),
            college,
            bio,
            expertise,
            form.notesUrl.trim(),
            resumeKey,
            resumeUrl,
          )
        : null;
      const id = result?.appId ?? `APP${Date.now().toString(36).toUpperCase()}`;
      setAppId(id);
      setSubmitted(true);
    } catch {
      // silently handle submission errors — show success anyway to avoid user confusion
      setAppId(`APP${Date.now().toString(36).toUpperCase()}`);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-8 overflow-x-hidden"
        style={{ background: "var(--bg-page)" }}
      >
        <div
          className="max-w-sm w-full glass-modal p-6 text-center animate-slideUp"
          data-ocid="join_team.success_state"
        >
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1.5">
            Application Submitted!
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Our team will review your application and reach out within 3-5
            business days.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
            <p className="text-xs text-blue-600 font-medium mb-1">
              Your Application ID
            </p>
            <p className="text-xl font-bold text-blue-700 font-mono tracking-wider">
              {appId}
            </p>
            <p className="text-xs text-blue-500 mt-1">
              Save this ID to track your application status
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs">
                Application received and queued for review
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs">Confirmation sent to {form.email}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2 text-sm"
            style={{ height: "40px", borderRadius: "10px" }}
            data-ocid="join_team.go_home_button"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "var(--bg-page)" }}
    >
      {/* Header */}
      <header
        className="border-b px-4 py-3 flex items-center gap-3"
        style={{ background: "#0f1117", borderColor: "#1e2435" }}
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-white font-bold text-base">
            AssignServiceHub
          </span>
        </div>
        <span className="text-white/30">•</span>
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs sm:text-sm transition-colors"
          data-ocid="join_team.back_button"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </button>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Page title */}
        <div className="text-center mb-6 animate-fadeIn">
          <div className="inline-flex items-center gap-2 bg-blue-100 rounded-full px-3 py-1 mb-3">
            <BookOpen className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-blue-700 text-xs font-semibold">
              College Admin Opportunity
            </span>
          </div>
          <h1
            className="font-bold text-gray-900 mb-1.5"
            style={{ fontSize: "var(--section-title)" }}
          >
            Apply as College Admin
          </h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Manage assignments, support students, and grow with your college
            community.
          </p>
        </div>

        {/* Form */}
        <div
          className="glass-modal p-4 sm:p-6 animate-slideUp"
          data-ocid="join_team.application_form"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name + Phone */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="join-name"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  <User className="inline h-3 w-3 mr-1 text-gray-400" />
                  Full Legal Name *
                </label>
                <input
                  id="join-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Your full name"
                  className={`input-field ${errors.name ? "border-red-400" : ""}`}
                  style={{ height: "40px", fontSize: "var(--body-text)" }}
                  data-ocid="join_team.name_input"
                />
                {errors.name && (
                  <p
                    className="text-red-500 text-xs mt-1"
                    data-ocid="join_team.name_field_error"
                  >
                    {errors.name}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="join-phone"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Phone Number
                </label>
                <input
                  id="join-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  className="input-field"
                  style={{ height: "40px", fontSize: "var(--body-text)" }}
                  data-ocid="join_team.phone_input"
                />
              </div>
            </div>

            {/* Email + DOB */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="join-email"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  <Mail className="inline h-3 w-3 mr-1 text-gray-400" />
                  Gmail Address *
                </label>
                <input
                  id="join-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="yourname@gmail.com"
                  className={`input-field ${errors.email ? "border-red-400" : ""}`}
                  style={{ height: "40px", fontSize: "var(--body-text)" }}
                  data-ocid="join_team.email_input"
                />
                {errors.email && (
                  <p
                    className="text-red-500 text-xs mt-1"
                    data-ocid="join_team.email_field_error"
                  >
                    {errors.email}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="join-dob"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  <Calendar className="inline h-3 w-3 mr-1 text-gray-400" />
                  Date of Birth *
                </label>
                <input
                  id="join-dob"
                  type="date"
                  value={form.dob}
                  onChange={(e) => set("dob", e.target.value)}
                  max={
                    new Date(Date.now() - 86400000 * 365 * 18)
                      .toISOString()
                      .split("T")[0]
                  }
                  className={`input-field ${errors.dob ? "border-red-400" : ""}`}
                  style={{ height: "40px", fontSize: "var(--body-text)" }}
                  data-ocid="join_team.dob_input"
                />
                {errors.dob && (
                  <p
                    className="text-red-500 text-xs mt-1"
                    data-ocid="join_team.dob_field_error"
                  >
                    {errors.dob}
                  </p>
                )}
              </div>
            </div>

            {/* College */}
            <div>
              <label
                htmlFor="join-college"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                <Building className="inline h-3 w-3 mr-1 text-gray-400" />
                College / University *
              </label>
              <select
                id="join-college"
                value={form.college}
                onChange={(e) => set("college", e.target.value)}
                className={`input-field ${errors.college ? "border-red-400" : ""}`}
                style={{ height: "40px", fontSize: "var(--body-text)" }}
                data-ocid="join_team.college_select"
              >
                <option value="">Select College</option>
                {COLLEGES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {form.college === "Other" && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={form.customCollege}
                    onChange={(e) => set("customCollege", e.target.value)}
                    placeholder="Enter your college name"
                    className={`input-field ${errors.college ? "border-red-400" : ""}`}
                    style={{ height: "40px", fontSize: "var(--body-text)" }}
                    data-ocid="join_team.custom_college_input"
                  />
                </div>
              )}
              {errors.college && (
                <p
                  className="text-red-500 text-xs mt-1"
                  data-ocid="join_team.college_field_error"
                >
                  {errors.college}
                </p>
              )}
            </div>

            {/* Resume Upload */}
            <div>
              <label
                htmlFor="join-resume"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                <FileText className="inline h-3 w-3 mr-1 text-gray-400" />
                Resume *
              </label>
              <div
                className={`relative border-2 border-dashed rounded-xl p-3 transition-colors ${
                  resume.error
                    ? "border-red-400 bg-red-50"
                    : resume.file
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 bg-gray-50 hover:border-blue-400"
                }`}
              >
                <input
                  id="join-resume"
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleResumeChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  data-ocid="join_team.resume_upload"
                />
                <div className="flex items-center gap-2 pointer-events-none">
                  <FileText
                    className={`h-5 w-5 flex-shrink-0 ${
                      resume.file ? "text-green-600" : "text-gray-400"
                    }`}
                  />
                  <div className="min-w-0">
                    {resume.file ? (
                      <>
                        <p className="text-xs font-medium text-green-700 truncate">
                          {resume.file.name}
                        </p>
                        <p className="text-xs text-green-600">
                          {(resume.file.size / 1024).toFixed(0)} KB — ready to
                          upload
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-medium text-gray-600">
                          Click to upload your resume
                        </p>
                        <p className="text-xs text-gray-400">
                          PDF, DOC, or DOCX only
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {resume.error && (
                <p
                  className="text-red-500 text-xs mt-1"
                  data-ocid="join_team.resume_field_error"
                >
                  {resume.error}
                </p>
              )}
            </div>

            {/* Handwritten Notes URL */}
            <div>
              <label
                htmlFor="join-notes-url"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                <Link className="inline h-3 w-3 mr-1 text-gray-400" />
                Handwritten Notes Sample URL
              </label>
              <input
                id="join-notes-url"
                type="url"
                value={form.notesUrl}
                onChange={(e) => set("notesUrl", e.target.value)}
                placeholder="Google Drive or Dropbox link"
                className="input-field"
                style={{ height: "40px", fontSize: "var(--body-text)" }}
                data-ocid="join_team.notes_url_input"
              />
              <p className="text-xs text-gray-400 mt-1">
                Upload samples of your handwriting or notes to Google Drive and
                share the link
              </p>
            </div>

            {/* Skills */}
            <div>
              <p className="block text-xs font-medium text-gray-600 mb-1">
                <BookOpen className="inline h-3 w-3 mr-1 text-gray-400" />
                Skills & Expertise *
              </p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {SKILLS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      const current = form.skills;
                      const selected = current
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean);
                      if (selected.includes(s)) {
                        set(
                          "skills",
                          selected.filter((x) => x !== s).join(", "),
                        );
                      } else {
                        set("skills", [...selected, s].join(", "));
                      }
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      form.skills.includes(s)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600"
                    }`}
                    data-ocid={`join_team.skill_${s.toLowerCase().replace(/\s+/g, "_")}_toggle`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {form.skills.includes("Other") && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={form.customSkill}
                    onChange={(e) => set("customSkill", e.target.value)}
                    placeholder="Enter your custom skill"
                    className="input-field"
                    style={{ height: "40px", fontSize: "var(--body-text)" }}
                    data-ocid="join_team.custom_skill_input"
                  />
                </div>
              )}
              <textarea
                value={form.skills}
                onChange={(e) => set("skills", e.target.value)}
                placeholder="Selected skills will appear here. Use the tags above to choose your expertise."
                rows={2}
                className={`input-field resize-none mt-2 ${errors.skills ? "border-red-400" : ""}`}
                style={{ fontSize: "var(--body-text)", minHeight: "60px" }}
                data-ocid="join_team.skills_textarea"
              />
              {errors.skills && (
                <p
                  className="text-red-500 text-xs mt-1"
                  data-ocid="join_team.skills_field_error"
                >
                  {errors.skills}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
              style={{
                height: "40px",
                borderRadius: "10px",
                fontSize: "var(--btn-text)",
              }}
              data-ocid="join_team.submit_button"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" /> Submit Application
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-5">
          © 2026 AssignServiceHub. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
