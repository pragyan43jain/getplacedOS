import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  User,
  GraduationCap,
  Briefcase,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Target,
  MapPin,
  Save,
  ArrowRight,
  Code2,
  Sparkles,
  FolderGit2,
  ExternalLink,
  Layers,
  ChevronRight,
  Check,
} from "lucide-react";
import SearchableCombobox from "@/components/ui/SearchableCombobox";
import GpBadge from "@/components/gp/GpBadge";
import CompanyLogo from "@/components/common/CompanyLogo";
import {
  CURATED_COMPANIES,
  CANONICAL_ROLES,
  CURATED_COMPANY_NAMES,
  getRolesForCompany,
  normalizeCompanyName,
  normalizeRoleName,
} from "@/data/curatedCompanies";
import { NODE_API_URL } from "@/config/api";

const DEGREE_OPTIONS = [
  "B.Tech",
  "B.E.",
  "BCA",
  "MCA",
  "B.Sc.",
  "M.Tech",
  "M.E.",
  "MBA",
  "Other",
];

const JOB_ROLE_OPTIONS = CANONICAL_ROLES;

const POPULAR_ROLES_QUICK = CANONICAL_ROLES.slice(0, 5);

const COMPANY_SUGGESTIONS = CURATED_COMPANY_NAMES;

const POPULAR_COMPANIES_QUICK = [
  "Google",
  "Microsoft",
  "Amazon",
  "Meta",
  "Uber",
  "Atlassian",
  "Stripe",
  "Razorpay",
];

const LOCATION_SUGGESTIONS = [
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Mumbai",
  "Delhi NCR",
  "Remote",
  "Any Location",
];

const CURRENT_YEAR = new Date().getFullYear();
const GRADUATION_YEARS = Array.from({ length: 15 }, (_, i) => CURRENT_YEAR - 5 + i);

export default function Profile() {
  const containerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({});

  // Developer Profiles Summary
  const [githubSummary, setGithubSummary] = useState(null);
  const [leetcodeSummary, setLeetcodeSummary] = useState(null);

  // Initial reference to detect dirty changes
  const [initialData, setInitialData] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    college: "",
    degree: "",
    customDegree: "",
    branch: "",
    graduationYear: "",
    cgpa: "",
    tenthPercentage: "",
    twelfthPercentage: "",
    activeBacklogs: "0",
    historyOfBacklogs: "0",
    targetJobRole: "",
    targetCompany: "",
    locationPreference: "",
  });

  // Fetch initial profile & connected accounts summary
  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const [profileRes, ghRes, lcRes] = await Promise.allSettled([
          axios.get(`${NODE_API_URL}/api/users/profile`, { withCredentials: true }),
          axios.get(`${NODE_API_URL}/api/github/profile`, { withCredentials: true }),
          axios.get(`${NODE_API_URL}/api/leetcode/profile`, { withCredentials: true }),
        ]);

        if (profileRes.status === "fulfilled" && profileRes.value?.data) {
          const data = profileRes.value.data;
          const degreeIsStandard = DEGREE_OPTIONS.filter((d) => d !== "Other").includes(data.degree);
          const degreeValue = data.degree ? (degreeIsStandard ? data.degree : "Other") : "";
          const customDegreeVal = data.degree && !degreeIsStandard ? data.degree : "";

          const loaded = {
            name: data.name || "",
            email: data.email || "",
            college: data.college || "",
            degree: degreeValue,
            customDegree: customDegreeVal,
            branch: data.branch || "",
            graduationYear: data.graduationYear ? String(data.graduationYear) : "",
            cgpa: data.cgpa !== null && data.cgpa !== undefined ? String(data.cgpa) : "",
            tenthPercentage:
              data.tenthPercentage !== null && data.tenthPercentage !== undefined
                ? String(data.tenthPercentage)
                : "",
            twelfthPercentage:
              data.twelfthPercentage !== null && data.twelfthPercentage !== undefined
                ? String(data.twelfthPercentage)
                : "",
            activeBacklogs:
              data.activeBacklogs !== null && data.activeBacklogs !== undefined
                ? String(data.activeBacklogs)
                : "0",
            historyOfBacklogs:
              data.historyOfBacklogs !== null && data.historyOfBacklogs !== undefined
                ? String(data.historyOfBacklogs)
                : "0",
            targetJobRole: data.targetJobRole || "",
            targetCompany: data.targetCompany || "",
            locationPreference: data.locationPreference || "",
          };

          setFormData(loaded);
          setInitialData(loaded);
        }

        if (ghRes.status === "fulfilled" && ghRes.value?.data?.profile) {
          setGithubSummary(ghRes.value.data.profile);
        }
        if (lcRes.status === "fulfilled" && lcRes.value?.data?.profile) {
          setLeetcodeSummary(lcRes.value.data.profile);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setErrorMessage(
          err.response?.data?.message || "Failed to load profile. Please make sure you are logged in."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const isDirty = useMemo(() => {
    if (!initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleCustomFieldChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const completion = useMemo(() => {
    const effectiveDegree = formData.degree === "Other" ? formData.customDegree : formData.degree;

    const requiredChecks = [
      Boolean(formData.name?.trim()),
      Boolean(formData.college?.trim()),
      Boolean(effectiveDegree?.trim()),
      Boolean(formData.graduationYear),
      Boolean(formData.cgpa !== "" && !isNaN(Number(formData.cgpa))),
      Boolean(formData.targetJobRole?.trim()),
      Boolean(formData.targetCompany?.trim()),
    ];

    const completed = requiredChecks.filter(Boolean).length;
    return Math.round((completed / requiredChecks.length) * 100);
  }, [formData]);

  const initials = useMemo(() => {
    if (!formData.name?.trim()) return "GP";
    const parts = formData.name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return formData.name.slice(0, 2).toUpperCase();
  }, [formData.name]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name?.trim()) newErrors.name = "Name is required";
    if (!formData.college?.trim()) newErrors.college = "College name is required";

    const effectiveDegree = formData.degree === "Other" ? formData.customDegree : formData.degree;
    if (!effectiveDegree?.trim()) newErrors.degree = "Degree is required";
    if (!formData.graduationYear) newErrors.graduationYear = "Graduation year is required";

    if (formData.cgpa === "" || formData.cgpa === null || formData.cgpa === undefined) {
      newErrors.cgpa = "CGPA is required";
    } else {
      const cgpaNum = Number(formData.cgpa);
      if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
        newErrors.cgpa = "CGPA must be between 0 and 10";
      }
    }

    if (!formData.targetJobRole?.trim()) newErrors.targetJobRole = "Target job role is required";
    if (!formData.targetCompany?.trim()) newErrors.targetCompany = "Target company is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDiscardChanges = () => {
    if (initialData) {
      setFormData(initialData);
      setErrors({});
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!validate()) {
      return;
    }

    setSaving(true);

    try {
      const effectiveDegree =
        formData.degree === "Other" ? formData.customDegree.trim() : formData.degree;

      const payload = {
        name: formData.name.trim(),
        college: formData.college.trim(),
        degree: effectiveDegree,
        branch: formData.branch?.trim() || "",
        graduationYear: formData.graduationYear ? Number(formData.graduationYear) : null,
        cgpa: formData.cgpa !== "" ? Number(formData.cgpa) : null,
        tenthPercentage:
          formData.tenthPercentage !== "" ? Number(formData.tenthPercentage) : null,
        twelfthPercentage:
          formData.twelfthPercentage !== "" ? Number(formData.twelfthPercentage) : null,
        activeBacklogs:
          formData.activeBacklogs !== "" ? Number(formData.activeBacklogs) : 0,
        historyOfBacklogs:
          formData.historyOfBacklogs !== "" ? Number(formData.historyOfBacklogs) : 0,
        targetCompany: normalizeCompanyName(formData.targetCompany.trim()),
        targetJobRole: normalizeRoleName(formData.targetJobRole.trim(), formData.targetCompany.trim()),
        locationPreference: formData.locationPreference.trim(),
      };

      const response = await axios.put(`${NODE_API_URL}/api/users/profile`, payload, {
        withCredentials: true,
      });

      setSuccessMessage("Profile saved successfully!");
      setInitialData({ ...formData });

      // Update stored user name in localStorage
      try {
        const stored = localStorage.getItem("getplaced_user");
        if (stored) {
          const u = JSON.parse(stored);
          u.name = formData.name.trim();
          localStorage.setItem("getplaced_user", JSON.stringify(u));
        }
      } catch (err) {}

      setTimeout(() => {
        setSuccessMessage("");
      }, 4000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setErrorMessage(
        err.response?.data?.message || "Failed to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-3">
        <Loader2 className="w-8 h-8 text-[#17103D] animate-spin" />
        <span className="text-xs font-semibold text-[#6F6A80]">
          Loading candidate profile...
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2DEEC]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#17103D] tracking-tight flex items-center gap-2.5">
            <User className="w-6 h-6 text-[#6E44FF]" />
            <span>Candidate Profile</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6F6A80] mt-1">
            Manage your personal credentials, university information, and placement target preferences.
          </p>
        </div>

        {isDirty && (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#17103D] hover:bg-[#24195A] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Profile</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-[#D8FAF4] border border-[#B7F4E8] text-[#0D7A68] text-xs font-semibold flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-[#FFE8E5] border border-[#FFC5B7] text-[#C7382B] text-xs font-semibold flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Candidate Identity Summary Card */}
      <div className="bg-white border border-[#E2DEEC] rounded-2xl p-5 sm:p-6 shadow-[0_2px_8px_rgba(23,16,61,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#17103D] text-[#FFD84D] flex items-center justify-center font-black text-xl shadow-sm shrink-0">
            {initials}
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-[#17103D] truncate">
                {formData.name || "Candidate Name"}
              </h2>
              {formData.targetCompany && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FEF9CF] border border-[#0D0431] text-xs font-bold text-[#0D0431] shadow-[1px_1px_0_0_#0D0431]">
                  <CompanyLogo company={formData.targetCompany} size="xs" bordered={false} className="bg-transparent" />
                  <span>{formData.targetCompany} Target</span>
                </div>
              )}
            </div>
            <p className="text-xs text-[#6F6A80] flex items-center gap-2 flex-wrap font-medium">
              <span>{formData.targetJobRole || "Role Not Specified"}</span>
              <span>•</span>
              <span>{formData.college || "University Not Specified"}</span>
              {formData.graduationYear && (
                <>
                  <span>•</span>
                  <span>Batch of {formData.graduationYear}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Profile Completion Indicator */}
        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-[#E2DEEC] pt-4 md:pt-0 md:pl-6 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold gap-4">
              <span className="text-[#17103D]">Profile Completeness</span>
              <span className="text-[#6E44FF]">{completion}%</span>
            </div>
            <div className="w-44 h-2 rounded-full bg-[#F2F0FA] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FFD84D] to-[#6E44FF] rounded-full transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Balanced Form Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Column 1: Personal & Education Details */}
        <div className="bg-white border border-[#E2DEEC] rounded-2xl p-5 sm:p-6 shadow-[0_2px_8px_rgba(23,16,61,0.02)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E2DEEC]">
            <GraduationCap className="w-4 h-4 text-[#6E44FF]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#17103D]">
              Personal & Academic Details
            </h3>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#6F6A80] mb-1">
                Full Name *
              </label>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Abhishek Sharma"
                className={`w-full bg-white border ${
                  errors.name ? "border-[#C7382B]" : "border-[#E2DEEC]"
                } rounded-xl px-3.5 py-2 text-sm text-[#17103D] focus:outline-none focus:border-[#6E44FF]`}
              />
              {errors.name && <p className="text-[11px] text-[#C7382B] mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6F6A80] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full bg-[#F8F8F5] border border-[#E2DEEC] rounded-xl px-3.5 py-2 text-sm text-[#6F6A80] cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6F6A80] mb-1">
                College / University *
              </label>
              <input
                name="college"
                type="text"
                value={formData.college}
                onChange={handleChange}
                placeholder="e.g. VIT Chennai"
                className={`w-full bg-white border ${
                  errors.college ? "border-[#C7382B]" : "border-[#E2DEEC]"
                } rounded-xl px-3.5 py-2 text-sm text-[#17103D] focus:outline-none focus:border-[#6E44FF]`}
              />
              {errors.college && <p className="text-[11px] text-[#C7382B] mt-1">{errors.college}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6F6A80] mb-1">
                Branch / Discipline
              </label>
              <input
                name="branch"
                type="text"
                value={formData.branch}
                onChange={handleChange}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full bg-white border border-[#E2DEEC] rounded-xl px-3.5 py-2 text-sm text-[#17103D] focus:outline-none focus:border-[#6E44FF]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#6F6A80] mb-1">
                  Degree Program *
                </label>
                <select
                  name="degree"
                  value={formData.degree}
                  onChange={handleChange}
                  className="w-full bg-white border border-[#E2DEEC] rounded-xl px-3 py-2 text-sm text-[#17103D] focus:outline-none focus:border-[#6E44FF]"
                >
                  <option value="">Select Degree</option>
                  {DEGREE_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6F6A80] mb-1">
                  Graduation Year *
                </label>
                <select
                  name="graduationYear"
                  value={formData.graduationYear}
                  onChange={handleChange}
                  className="w-full bg-white border border-[#E2DEEC] rounded-xl px-3 py-2 text-sm text-[#17103D] focus:outline-none focus:border-[#6E44FF]"
                >
                  <option value="">Select Year</option>
                  {GRADUATION_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#6F6A80] mb-1">
                  CGPA (0-10) *
                </label>
                <input
                  name="cgpa"
                  type="number"
                  step="0.01"
                  value={formData.cgpa}
                  onChange={handleChange}
                  placeholder="8.80"
                  className={`w-full bg-white border ${
                    errors.cgpa ? "border-[#C7382B]" : "border-[#E2DEEC]"
                  } rounded-xl px-3 py-2 text-sm text-[#17103D] focus:outline-none focus:border-[#6E44FF] font-mono`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6F6A80] mb-1">
                  10th %
                </label>
                <input
                  name="tenthPercentage"
                  type="number"
                  step="0.1"
                  value={formData.tenthPercentage}
                  onChange={handleChange}
                  placeholder="92.5"
                  className="w-full bg-white border border-[#E2DEEC] rounded-xl px-3 py-2 text-sm text-[#17103D] focus:outline-none focus:border-[#6E44FF] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6F6A80] mb-1">
                  12th %
                </label>
                <input
                  name="twelfthPercentage"
                  type="number"
                  step="0.1"
                  value={formData.twelfthPercentage}
                  onChange={handleChange}
                  placeholder="89.0"
                  className="w-full bg-white border border-[#E2DEEC] rounded-xl px-3 py-2 text-sm text-[#17103D] focus:outline-none focus:border-[#6E44FF] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6F6A80] mb-1">
                  Active Backlogs
                </label>
                <input
                  name="activeBacklogs"
                  type="number"
                  min="0"
                  value={formData.activeBacklogs}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full bg-white border border-[#E2DEEC] rounded-xl px-3 py-2 text-sm text-[#17103D] focus:outline-none focus:border-[#6E44FF] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6F6A80] mb-1">
                  History of Backlogs
                </label>
                <input
                  name="historyOfBacklogs"
                  type="number"
                  min="0"
                  value={formData.historyOfBacklogs}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full bg-white border border-[#E2DEEC] rounded-xl px-3 py-2 text-sm text-[#17103D] focus:outline-none focus:border-[#6E44FF] font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Placement Ambition & Role Preferences */}
        <div className="bg-white border border-[#E2DEEC] rounded-2xl p-5 sm:p-6 shadow-[0_2px_8px_rgba(23,16,61,0.02)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E2DEEC]">
            <Target className="w-4 h-4 text-[#FFD84D]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#17103D]">
              Placement Ambition & Role Fit
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#6F6A80] mb-1">
                Target Job Role *
              </label>
              <SearchableCombobox
                options={JOB_ROLE_OPTIONS}
                value={formData.targetJobRole}
                onChange={(val) => handleCustomFieldChange("targetJobRole", val)}
                placeholder="Search or select target role (e.g. SDE)"
                error={errors.targetJobRole}
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {POPULAR_ROLES_QUICK.slice(0, 4).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleCustomFieldChange("targetJobRole", role)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      formData.targetJobRole === role
                        ? "bg-[#17103D] text-white border-[#17103D]"
                        : "bg-[#F8F8F5] text-[#6F6A80] border-[#E2DEEC] hover:bg-[#F2F0FA] hover:text-[#17103D]"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6F6A80] mb-1">
                Dream Target Company *
              </label>
              <SearchableCombobox
                options={COMPANY_SUGGESTIONS}
                value={formData.targetCompany}
                onChange={(val) => handleCustomFieldChange("targetCompany", val)}
                placeholder="Select company (e.g. Microsoft, Google)"
                error={errors.targetCompany}
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {POPULAR_COMPANIES_QUICK.map((comp) => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => handleCustomFieldChange("targetCompany", comp)}
                    className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      formData.targetCompany === comp
                        ? "bg-[#17103D] text-white border-[#17103D]"
                        : "bg-[#F8F8F5] text-[#6F6A80] border-[#E2DEEC] hover:bg-[#F2F0FA] hover:text-[#17103D]"
                    }`}
                  >
                    <CompanyLogo company={comp} size="xs" bordered={false} className="bg-transparent" />
                    <span>{comp}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6F6A80] mb-1">
                Preferred Work Location
              </label>
              <SearchableCombobox
                options={LOCATION_SUGGESTIONS}
                value={formData.locationPreference}
                onChange={(val) => handleCustomFieldChange("locationPreference", val)}
                placeholder="e.g. Bangalore, Hyderabad, Remote"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Developer Activity & Linked Profiles Summary (Compact, non-congested) */}
      <div className="bg-white border border-[#E2DEEC] rounded-2xl p-5 sm:p-6 shadow-[0_2px_8px_rgba(23,16,61,0.02)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2DEEC]">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#6E44FF]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#17103D]">
              Developer Activity & Linked Profiles
            </h3>
          </div>
          <span className="text-xs text-[#6F6A80]">
            Detailed metrics available in dedicated workspaces
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GitHub Compact Summary Card */}
          {(() => {
            const isGithubConnected = Boolean(githubSummary && (githubSummary.username || githubSummary.syncStatus === "synced"));
            const reposCount = isGithubConnected
              ? (githubSummary.publicReposCount ?? githubSummary.publicRepos ?? (githubSummary.repositories?.length ?? 0))
              : "—";
            const starsCount = isGithubConnected ? (githubSummary.totalStars ?? 0) : "—";
            const projectScoreVal = isGithubConnected
              ? (githubSummary.projectScore !== undefined && githubSummary.projectScore !== null
                  ? `${githubSummary.projectScore}%`
                  : "—")
              : "—";

            return (
              <div className="p-4 rounded-xl bg-[#F8F8F5] border border-[#E2DEEC] flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#17103D] text-white flex items-center justify-center">
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#17103D]">GitHub Account</h4>
                      <p className="text-[11px] text-[#6F6A80]">
                        {isGithubConnected ? `@${githubSummary.username}` : "No account linked"}
                      </p>
                    </div>
                  </div>

                  <GpBadge theme={isGithubConnected ? "mint" : "yellow"} size="sm">
                    {isGithubConnected ? "Connected" : "Not Connected"}
                  </GpBadge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
                  <div className="p-2 rounded-lg bg-white border border-[#E2DEEC]">
                    <div className="font-bold text-[#17103D]">{reposCount}</div>
                    <div className="text-[10px] text-[#6F6A80]">Repos</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#E2DEEC]">
                    <div className="font-bold text-[#17103D]">{starsCount}</div>
                    <div className="text-[10px] text-[#6F6A80]">Stars</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#E2DEEC]">
                    <div className="font-bold text-[#17103D]">{projectScoreVal}</div>
                    <div className="text-[10px] text-[#6F6A80]">Score</div>
                  </div>
                </div>

                <Link
                  to="/app/development"
                  className="inline-flex items-center justify-between text-xs font-semibold text-[#6E44FF] hover:underline pt-1 border-t border-[#E2DEEC]"
                >
                  <span>{isGithubConnected ? "View Projects & Repos" : "Connect GitHub Profile"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })()}

          {/* LeetCode Compact Summary Card */}
          {(() => {
            const isLeetcodeConnected = Boolean(leetcodeSummary && (leetcodeSummary.username || leetcodeSummary.syncStatus === "synced"));
            const solvedCount = isLeetcodeConnected ? (leetcodeSummary.totalSolved ?? 0) : "—";
            const accuracyVal = isLeetcodeConnected
              ? (leetcodeSummary.acceptanceRate !== undefined && leetcodeSummary.acceptanceRate !== null
                  ? `${Number(leetcodeSummary.acceptanceRate).toFixed(1)}%`
                  : "—")
              : "—";
            const dsaScoreVal = isLeetcodeConnected
              ? (leetcodeSummary.dsaScore !== undefined && leetcodeSummary.dsaScore !== null
                  ? `${leetcodeSummary.dsaScore}%`
                  : (leetcodeSummary.totalSolved > 0
                      ? `${Math.min(100, Math.round(((leetcodeSummary.easySolved || 0) * 0.5) + ((leetcodeSummary.mediumSolved || 0) * 1.0) + ((leetcodeSummary.hardSolved || 0) * 2.0)))}%`
                      : "0%"))
              : "—";

            return (
              <div className="p-4 rounded-xl bg-[#F8F8F5] border border-[#E2DEEC] flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FFD84D] text-[#17103D] flex items-center justify-center">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#17103D]">LeetCode Profile</h4>
                      <p className="text-[11px] text-[#6F6A80]">
                        {isLeetcodeConnected ? `@${leetcodeSummary.username}` : "No account linked"}
                      </p>
                    </div>
                  </div>

                  <GpBadge theme={isLeetcodeConnected ? "mint" : "yellow"} size="sm">
                    {isLeetcodeConnected ? "Connected" : "Not Connected"}
                  </GpBadge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
                  <div className="p-2 rounded-lg bg-white border border-[#E2DEEC]">
                    <div className="font-bold text-[#17103D]">{solvedCount}</div>
                    <div className="text-[10px] text-[#6F6A80]">Solved</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#E2DEEC]">
                    <div className="font-bold text-[#17103D]">{accuracyVal}</div>
                    <div className="text-[10px] text-[#6F6A80]">Accuracy</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#E2DEEC]">
                    <div className="font-bold text-[#17103D]">{dsaScoreVal}</div>
                    <div className="text-[10px] text-[#6F6A80]">DSA Score</div>
                  </div>
                </div>

                <Link
                  to="/app/coding?tab=submissions"
                  className="inline-flex items-center justify-between text-xs font-semibold text-[#6E44FF] hover:underline pt-1 border-t border-[#E2DEEC]"
                >
                  <span>{isLeetcodeConnected ? "Open Coding Workspace & Analytics" : "Connect LeetCode Profile"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Sticky Bottom Save Bar (Appears only on dirty edits) */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-[#17103D] text-white p-3.5 sm:p-4 rounded-2xl shadow-[0_12px_32px_rgba(23,16,61,0.25)] border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-[#FFD84D] font-medium">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>You have unsaved changes</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDiscardChanges}
                disabled={saving}
                className="px-3.5 py-1.5 rounded-xl text-xs text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#FFD84D] hover:bg-[#FEDF6A] text-[#17103D] text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
