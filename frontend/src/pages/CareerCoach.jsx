import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import confetti from "canvas-confetti";
import {
  ArrowRight,
  Check,
  Github,
  Code2,
  Loader2,
  X,
  Edit3,
  AlertCircle,
  ChevronRight,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  FileText,
  Upload,
  Sparkles,
  ExternalLink,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Trash2,
  Send,
  Target,
  Layers,
  Terminal,
  Activity,
  Zap,
  BookOpen,
  Briefcase,
  Award,
  BarChart3,
  CheckCircle2,
  Compass,
} from "lucide-react";
import { NODE_API_URL, PY_API_URL } from "@/config/api";
import MarkdownRenderer from "@/components/coach/MarkdownRenderer";
import ToolExecutionAccordion from "@/components/coach/ToolExecutionAccordion";
import ActionCard from "@/components/coach/ActionCard";
import GpButton, { GpArrow } from "@/components/gp/GpButton";
import GpBadge from "@/components/gp/GpBadge";
import GpCard from "@/components/gp/GpCard";
import CompanyLogo from "@/components/common/CompanyLogo";
import { normalizeCaptchaImageSrc } from "@/utils/captchaImage";
import {
  CURATED_COMPANIES,
  getRolesForCompany,
  normalizeCompanyName,
  normalizeRoleName,
  getCompanyDetails,
} from "@/data/curatedCompanies";

const STEPS_MAP = [
  { step: 1, label: "Target Ambition", shortLabel: "Ambition" },
  { step: 2, label: "Academics", shortLabel: "Academics" },
  { step: 3, label: "GitHub Proof", shortLabel: "GitHub" },
  { step: 4, label: "LeetCode DSA", shortLabel: "LeetCode" },
  { step: 5, label: "Skills Calibration", shortLabel: "Skills" },
  { step: 6, label: "Report & Synthesis", shortLabel: "Synthesis" },
];

export default function CareerCoach() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [chips, setChips] = useState([]);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [extractedProfile, setExtractedProfile] = useState({});
  const [collectedData, setCollectedData] = useState({});
  const [connectedProfiles, setConnectedProfiles] = useState({});
  const [discoveredProjects, setDiscoveredProjects] = useState([]);
  const [evidenceSkills, setEvidenceSkills] = useState([]);
  const [readinessSnapshot, setReadinessSnapshot] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [applyingProfile, setApplyingProfile] = useState(false);
  const [showSummaryDrawer, setShowSummaryDrawer] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState("chat");

  const isOnboardingParam = searchParams.get("onboarding") === "true";
  const isOnboardingPath = location.pathname.startsWith("/onboarding");
  const isOnboardingMode = isOnboardingPath || (isOnboardingParam && !isCompleted);

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState(null);
  const recognitionRef = useRef(null);

  // Unmount cleanup for Voice & TTS
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Escape key to close any active modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowVtopModal(false);
        setShowGhModal(false);
        setShowLcModal(false);
        setShowResumeModal(false);
        setShowEditModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // VTOP connect states
  const [showVtopModal, setShowVtopModal] = useState(false);
  const [vtopUsername, setVtopUsername] = useState("");
  const [vtopPassword, setVtopPassword] = useState("");
  const [vtopCaptchaText, setVtopCaptchaText] = useState("");
  const [vtopCaptchaImage, setVtopCaptchaImage] = useState("");
  const [vtopSessionId, setVtopSessionId] = useState("");
  const [vtopLoading, setVtopLoading] = useState(false);
  const [vtopLoadingCaptcha, setVtopLoadingCaptcha] = useState(false);
  const [vtopError, setVtopError] = useState("");

  // Quick connect states
  const [showGhModal, setShowGhModal] = useState(false);
  const [ghInput, setGhInput] = useState("");
  const [ghLoading, setGhLoading] = useState(false);
  const [ghError, setGhError] = useState("");

  const [showLcModal, setShowLcModal] = useState(false);
  const [lcInput, setLcInput] = useState("");
  const [lcLoading, setLcLoading] = useState(false);
  const [lcError, setLcError] = useState("");

  // Resume upload states
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [resumeSuccessData, setResumeSuccessData] = useState(null);

  // Edit Inferred Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    targetCompany: "",
    targetJobRole: "",
    cgpa: "",
    graduationYear: "",
    college: "",
    degree: "",
  });

  const chatScrollRef = useRef(null);

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#896EE2", "#FEDF6A", "#D4FDF7", "#F85B52"],
      });
    } catch (e) {
      // non-fatal
    }
  };

  const handleUploadResumeDirect = async (fileToUpload) => {
    const file = fileToUpload || resumeFile;
    if (!file || resumeUploading) return;
    setResumeUploading(true);
    setResumeError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("job_description", extractedProfile?.targetJobRole || "");

      const pyRes = await axios.post(`${PY_API_URL}/api/resume/analyze-upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const analysisResult = pyRes.data?.evaluation || pyRes.data?.data || pyRes.data;
      const extractedText = pyRes.data?.extracted_text || analysisResult?.extracted_text || "";

      const saveRes = await axios.post(
        `${NODE_API_URL}/api/coach/save-resume-analysis`,
        {
          resumeScore: analysisResult.ats_score,
          resumeText: extractedText,
          resumeAnalysis: analysisResult,
          filename: file.name,
        },
        { withCredentials: true }
      );

      if (saveRes.data) {
        syncSessionData(saveRes.data);
      }
      setResumeSuccessData(analysisResult);
      setShowResumeModal(false);
      triggerCelebration();
    } catch (err) {
      console.error("Failed to upload/analyze resume:", err);
      setResumeError(err.response?.data?.detail || err.message || "Failed to analyze resume with AI");
    } finally {
      setResumeUploading(false);
    }
  };

  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  const syncSessionData = (data) => {
    if (!data) return;
    const sessionObj = data.session || data;
    setMessages(sessionObj.messages || data.messages || []);
    const step = data.onboardingStep ?? sessionObj.onboardingStep ?? 1;
    setOnboardingStep(step);
    setIsCompleted(Boolean(data.isCompleted ?? sessionObj.isCompleted));
    setExtractedProfile(sessionObj.extractedProfile || data.extractedProfile || {});
    setCollectedData(sessionObj.collectedData || data.collectedData || {});
    setConnectedProfiles(sessionObj.connectedProfiles || data.connectedProfiles || {});
    setDiscoveredProjects(sessionObj.discoveredProjects || data.discoveredProjects || []);
    setEvidenceSkills(sessionObj.evidenceSkills || data.evidenceSkills || []);
    if (sessionObj.readinessSnapshot || data.readinessSnapshot) {
      setReadinessSnapshot(sessionObj.readinessSnapshot || data.readinessSnapshot);
    }
    const comp = data.profileCompletion ?? sessionObj.profileCompletion;
    if (comp !== undefined && comp !== null) {
      setProfileCompletion(comp);
    } else {
      setProfileCompletion(Math.min(100, Math.max(15, Math.round((step / STEPS_MAP.length) * 100))));
    }

    if (data.chips && data.chips.length > 0) {
      setChips(data.chips);
    } else {
      const msgs = sessionObj.messages || data.messages || [];
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.chips) {
        setChips(lastMsg.chips);
      }
    }

    const ext = sessionObj.extractedProfile || data.extractedProfile || {};
    setEditForm({
      targetCompany: ext.targetCompany || "",
      targetJobRole: ext.targetJobRole || "",
      cgpa: ext.cgpa ?? "",
      graduationYear: ext.graduationYear ?? "",
      college: ext.college || "",
      degree: ext.degree || "",
    });
  };

  useEffect(() => {
    const initCoachSession = async () => {
      try {
        const mode = isOnboardingMode ? "onboarding" : "coach";
        const res = await axios.get(`${NODE_API_URL}/api/coach/session?mode=${mode}`, {
          withCredentials: true,
        });
        if (res.data) {
          syncSessionData(res.data);
        }
      } catch (err) {
        console.warn("Could not init coach session from backend:", err.message);
      } finally {
        setLoading(false);
      }
    };

    initCoachSession();
  }, [isOnboardingMode]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Speech Recognition
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e) => {
        console.warn("Speech recognition error:", e.error);
        setIsListening(false);
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript || "";
        if (transcript) {
          setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Speech init error:", e.message);
      setIsListening(false);
    }
  };

  // Text-to-Speech (TTS)
  const handleSpeakText = (text, idx) => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingMsgIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[#*`_~-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMsgIdx(null);
    utterance.onerror = () => setSpeakingMsgIdx(null);

    setSpeakingMsgIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  const handleSkip = async (mode = "step") => {
    if (sending) return;
    if (mode === "all") {
      await handleSendMessage("Skip all to dashboard");
    } else {
      await handleSendMessage("Skip this step for now");
    }
  };

  const handleSendMessage = async (textToSend) => {
    const isDirectText = typeof textToSend === "string" && textToSend.trim().length > 0;
    const text = isDirectText ? textToSend : inputMessage;
    if (!text || !text.trim() || sending) return;

    const trimmed = text.trim();
    const previousInput = inputMessage;

    // Normalize skip commands typed by the user
    let messagePayload = trimmed;
    if (trimmed.toLowerCase() === "skip" || trimmed.toLowerCase() === "skip step") {
      messagePayload = "Skip this step for now";
    } else if (trimmed.toLowerCase() === "skip all") {
      messagePayload = "Skip all to dashboard";
    }

    const tempUserMsg = {
      sender: "user",
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    if (!isDirectText) {
      setInputMessage("");
    }
    setChips([]);
    setMessageError("");
    setSending(true);

    const mode = isOnboardingMode ? "onboarding" : "coach";
    try {
      const res = await axios.post(
        `${NODE_API_URL}/api/coach/message`,
        { message: messagePayload, mode },
        { withCredentials: true, timeout: 35000 }
      );
      if (res.data) {
        syncSessionData(res.data);
      }
    } catch (err) {
      console.error("Could not send message to coach:", err);
      setInputMessage(trimmed);
      setMessageError(
        err.response?.status === 504
          ? "The coach took too long to respond. Your answer has been restored so you can retry."
          : err.response?.data?.message || "The coach is temporarily unavailable. Your answer has been restored."
      );

      try {
        const sessionRes = await axios.get(`${NODE_API_URL}/api/coach/session?mode=${mode}`, {
          withCredentials: true,
        });
        if (sessionRes.data) syncSessionData(sessionRes.data);
      } catch (syncError) {
        console.warn("Could not resync coach session after message failure:", syncError.message);
      }

    } finally {
      setSending(false);
      setTimeout(() => scrollToBottom(), 50);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to reset the getPlaced conversation?")) return;
    try {
      const mode = isOnboardingMode ? "onboarding" : "coach";
      const res = await axios.post(
        `${NODE_API_URL}/api/coach/clear-chat`,
        { mode },
        { withCredentials: true }
      );
      if (res.data?.session) {
        syncSessionData(res.data.session);
      }
    } catch (err) {
      console.warn("Could not clear chat:", err.message);
    }
  };

  const handleConnectGitHubDirect = async (e) => {
    e?.preventDefault();
    if (!ghInput.trim() || ghLoading) return;
    setGhLoading(true);
    setGhError("");
    try {
      const res = await axios.post(
        `${NODE_API_URL}/api/coach/connect-github`,
        { username: ghInput.trim() },
        { withCredentials: true }
      );
      setShowGhModal(false);
      setGhInput("");
      if (res.data?.session) {
        syncSessionData(res.data.session);
      } else {
        const sessionRes = await axios.get(`${NODE_API_URL}/api/coach/session`, { withCredentials: true });
        if (sessionRes.data) syncSessionData(sessionRes.data);
      }
      triggerCelebration();
    } catch (err) {
      console.error("GitHub connect error:", err);
      setGhError(err.response?.data?.message || "Failed to retrieve GitHub profile.");
    } finally {
      setGhLoading(false);
    }
  };

  const handleConnectLeetCodeDirect = async (e) => {
    e?.preventDefault();
    if (!lcInput.trim() || lcLoading) return;
    setLcLoading(true);
    setLcError("");
    try {
      const res = await axios.post(
        `${NODE_API_URL}/api/coach/connect-leetcode`,
        { username: lcInput.trim() },
        { withCredentials: true }
      );
      setShowLcModal(false);
      setLcInput("");
      if (res.data?.session) {
        syncSessionData(res.data.session);
      } else {
        const sessionRes = await axios.get(`${NODE_API_URL}/api/coach/session`, { withCredentials: true });
        if (sessionRes.data) syncSessionData(sessionRes.data);
      }
      triggerCelebration();
    } catch (err) {
      console.error("LeetCode connect error:", err);
      setLcError(err.response?.data?.message || "Failed to retrieve LeetCode profile.");
    } finally {
      setLcLoading(false);
    }
  };

  const fetchLiveVtopCaptcha = async (currentSessionId = null) => {
    try {
      setVtopLoadingCaptcha(true);
      setVtopError("");
      setVtopCaptchaText("");
      const activeSess = currentSessionId || vtopSessionId;
      const url = activeSess
        ? `${NODE_API_URL}/api/vtop/live-captcha?sessionId=${encodeURIComponent(activeSess)}`
        : `${NODE_API_URL}/api/vtop/live-captcha`;

      const res = await axios.get(url, { withCredentials: true });
      if (res.data?.success && res.data.captchaImage) {
        setVtopCaptchaImage(res.data.captchaImage);
        setVtopSessionId(res.data.sessionId);
      } else {
        setVtopError(res.data?.error || "Could not fetch dynamic captcha from VTOP.");
      }
    } catch (err) {
      console.warn("Failed to fetch live captcha from VTOP:", err);
      setVtopError(err.response?.data?.error || "Could not load live captcha from VTOP portal.");
    } finally {
      setVtopLoadingCaptcha(false);
    }
  };

  const handleOpenVtopModal = () => {
    setShowVtopModal(true);
    setVtopError("");
    fetchLiveVtopCaptcha();
  };

  const handleConnectVtopDirect = async (e) => {
    e?.preventDefault();
    if (!vtopUsername.trim() || vtopLoading) return;
    setVtopLoading(true);
    setVtopError("");

    try {
      const payload = vtopPassword && vtopCaptchaText
        ? {
            username: vtopUsername.trim(),
            password: vtopPassword.trim(),
            captchaStr: vtopCaptchaText.trim(),
            sessionId: vtopSessionId,
          }
        : {
            regNo: vtopUsername.trim(),
          };

      const res = await axios.post(
        `${NODE_API_URL}/api/coach/connect-vtop`,
        payload,
        { withCredentials: true }
      );

      if (res.data?.success) {
        setShowVtopModal(false);
        setVtopPassword("");
        setVtopCaptchaText("");
        if (res.data?.session) {
          syncSessionData(res.data.session);
        } else {
          const sessionRes = await axios.get(`${NODE_API_URL}/api/coach/session`, { withCredentials: true });
          if (sessionRes.data) syncSessionData(sessionRes.data);
        }
        triggerCelebration();
      } else {
        setVtopError(res.data?.error || "VTOP sync failed. Please verify credentials.");
        if (res.data?.newCaptchaImage) {
          setVtopCaptchaImage(res.data.newCaptchaImage);
          if (res.data.sessionId) setVtopSessionId(res.data.sessionId);
        } else {
          fetchLiveVtopCaptcha(vtopSessionId);
        }
      }
    } catch (err) {
      console.error("VTOP connect error:", err);
      setVtopError(err.response?.data?.error || err.response?.data?.message || "Failed to authenticate with VTOP.");
      fetchLiveVtopCaptcha(vtopSessionId);
    } finally {
      setVtopLoading(false);
    }
  };

  const handleSaveProfileEdits = async (e) => {
    e?.preventDefault();
    setShowEditModal(false);
    const comp = normalizeCompanyName(editForm.targetCompany || "Google");
    const role = normalizeRoleName(editForm.targetJobRole, comp);
    const updated = {
      ...extractedProfile,
      ...editForm,
      targetCompany: comp,
      targetJobRole: role,
    };
    setExtractedProfile(updated);
    try {
      await axios.post(
        `${NODE_API_URL}/api/coach/apply-profile`,
        { extractedProfile: updated },
        { withCredentials: true }
      );
      const sessionRes = await axios.get(`${NODE_API_URL}/api/coach/session`, { withCredentials: true });
      if (sessionRes.data) syncSessionData(sessionRes.data);
      triggerCelebration();
    } catch (err) {
      console.error("Failed to save edited profile:", err);
    }
  };

  const handleFinalizeAndEnterDashboard = async () => {
    setApplyingProfile(true);
    try {
      await axios.post(
        `${NODE_API_URL}/api/coach/apply-onboarding`,
        { extractedProfile },
        { withCredentials: true }
      );
      navigate("/app?onboarding=complete");
    } catch (err) {
      console.error("Failed to apply onboarding profile:", err);
      try {
        await axios.post(
          `${NODE_API_URL}/api/coach/apply-profile`,
          { extractedProfile },
          { withCredentials: true }
        );
      } catch (e2) {}
      navigate("/app?onboarding=complete");
    } finally {
      setApplyingProfile(false);
    }
  };

  const isVtopConnected = Boolean(connectedProfiles?.vtop?.connected || extractedProfile?.vtopConnected);
  const isGhConnected = Boolean(connectedProfiles?.github?.connected);
  const isLcConnected = Boolean(connectedProfiles?.leetcode?.connected);

  const dynamicStepPercent = Math.round((onboardingStep / STEPS_MAP.length) * 100);
  const rawProgress = profileCompletion > 0 ? profileCompletion : dynamicStepPercent;
  const progressPercent = isCompleted
    ? 100
    : Math.min(100, Math.max(15, rawProgress));

  const QUICK_MODULES = [
    { label: "DSA Sheets", path: "/app/sheets", icon: Zap, bg: "bg-[#FEDF6A]" },
    { label: "Sandbox IDE", path: "/app/coding", icon: Terminal, bg: "bg-[#E4CDFB]" },
    { label: "ATS Resume", path: "/app/resume", icon: FileText, bg: "bg-[#D4FDF7]" },
    { label: "Mock Interview", path: "/app/interview", icon: Sparkles, bg: "bg-[#FFC5B7]" },
    { label: "Sprint Roadmap", path: "/app/roadmap", icon: Compass, bg: "bg-[#FEF9CF]" },
    { label: "Live Jobs", path: "/app/job", icon: Briefcase, bg: "bg-white" },
  ];

  return (
    <div className="w-full min-h-screen bg-[#FEF9CF] u-background-grid-yellow text-[#0D0431] font-sans selection:bg-[#FEDF6A] selection:text-[#0D0431] flex flex-col justify-between">
      
      {/* 1. TOP EDITORIAL NAVIGATION BAR */}
      <header className="border-b-2 border-[#0D0431] bg-white/95 backdrop-blur sticky top-0 z-30 flex flex-col shadow-sm">
        {/* Onboarding Top Progress Bar Strip (Shown only in Onboarding mode) */}
        {isOnboardingMode && (
          <div className="w-full h-2 bg-[#FEF9CF] overflow-hidden relative border-b border-[#0D0431]">
            <div
              className="h-full bg-[#896EE2] transition-all duration-500 ease-out border-r-2 border-[#0D0431]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        <div className="px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={isOnboardingMode ? "/onboarding" : "/app"} className="font-heading font-black text-base md:text-lg tracking-tight text-[#0D0431] no-underline">
              get<span className="text-[#896EE2]">Placed</span>
            </Link>

            {isOnboardingMode ? (
              <GpBadge theme="light-purple" size="sm">
                Placement Calibration
              </GpBadge>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <GpBadge theme="mint" size="sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1 animate-pulse" />
                  Autonomous Coach
                </GpBadge>
                <span className="text-xs font-mono font-bold text-[#0D0431]/70">
                  Target: {extractedProfile?.targetCompany ? `${extractedProfile.targetCompany} · ${extractedProfile?.targetJobRole || "SDE"}` : "Unset"}
                </span>
              </div>
            )}
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            {isOnboardingMode && (
              <button
                type="button"
                onClick={() => handleSkip("step")}
                title="Skip Current Calibration Step"
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold text-[#0D0431] border-2 border-[#0D0431] bg-white hover:bg-[#FEDF6A] transition-all shadow-[2px_2px_0_0_#0D0431] flex items-center gap-1.5 font-mono cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Skip Step</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClearChat}
              title="Reset Conversation"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold text-[#0D0431] border-2 border-[#0D0431] bg-white hover:bg-[#FFC5B7] transition-all shadow-[2px_2px_0_0_#0D0431] flex items-center gap-1.5 font-mono cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileActiveTab((prev) => (prev === "chat" ? "telemetry" : "chat"))}
              className="lg:hidden px-3 py-1.5 rounded-xl text-xs font-bold text-[#0D0431] border-2 border-[#0D0431] bg-[#FEDF6A] transition-all shadow-[2px_2px_0_0_#0D0431] cursor-pointer font-mono flex items-center gap-1"
            >
              <Activity className="w-3.5 h-3.5 text-[#0D0431]" />
              <span>{mobileActiveTab === "chat" ? (isOnboardingMode ? "Profile" : "Radar") : "Chat"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold text-[#0D0431] border-2 border-[#0D0431] bg-white hover:bg-[#E4CDFB] transition-all shadow-[2px_2px_0_0_#0D0431] flex items-center gap-1.5 font-mono cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit Target</span>
            </button>

            {isOnboardingMode ? (
              <GpButton
                onClick={handleFinalizeAndEnterDashboard}
                variant="stacked"
                size="sm"
              >
                Dashboard →
              </GpButton>
            ) : (
              <GpButton
                to="/app"
                variant="stacked"
                size="sm"
              >
                Dashboard
              </GpButton>
            )}
          </div>
        </div>

        {/* Stepper Breadcrumbs Bar (Shown in Onboarding mode) */}
        {isOnboardingMode && (
          <div className="hidden sm:flex items-center justify-between px-8 py-2 bg-[#FAF7EE] border-t border-[#0D0431]/20 font-mono text-[11px] font-bold text-[#0D0431]/80 overflow-x-auto">
            <div className="flex items-center gap-3">
              {STEPS_MAP.map((st, idx) => {
                const isActive = onboardingStep === st.step;
                const isPassed = onboardingStep > st.step || isCompleted;
                return (
                  <div key={st.step} className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        isActive
                          ? "bg-[#FEDF6A] border-[#0D0431] text-[#0D0431] font-black shadow-[1px_1px_0_0_#0D0431]"
                          : isPassed
                          ? "bg-[#D4FDF7] border-[#0D0431]/40 text-[#0D0431]"
                          : "bg-white/60 border-zinc-300 text-zinc-400"
                      }`}
                    >
                      {isPassed && <Check className="w-2.5 h-2.5 text-emerald-600" />}
                      <span>{st.step}. {st.shortLabel}</span>
                    </span>
                    {idx < STEPS_MAP.length - 1 && <ChevronRight className="w-3 h-3 text-zinc-400" />}
                  </div>
                );
              })}
            </div>
            <span className="text-[10px] text-[#0D0431]/60">
              Calibration {progressPercent}% Complete
            </span>
          </div>
        )}

        {/* Quick Modules Toolbar (Shown in Day-to-Day Coach mode) */}
        {!isOnboardingMode && (
          <div className="hidden md:flex items-center gap-2 px-8 py-2 bg-[#FAF7EE] border-t border-[#0D0431]/20 font-mono text-xs font-bold text-[#0D0431] overflow-x-auto">
            <span className="text-[11px] text-[#0D0431]/60 uppercase tracking-wider mr-1">Workspace Hub:</span>
            {QUICK_MODULES.map((m) => {
              const IconComponent = m.icon;
              return (
                <Link
                  key={m.label}
                  to={m.path}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border-2 border-[#0D0431] text-[11px] text-[#0D0431] shadow-[2px_2px_0_0_#0D0431] hover:scale-[1.02] active:scale-[0.98] transition-all no-underline ${m.bg}`}
                >
                  <IconComponent className="w-3 h-3" />
                  <span>{m.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* 2. MAIN CONVERSATIONAL WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 flex flex-col items-stretch gap-4">
        {/* Mobile View Switcher (Visible on < lg screens) */}
        <div className="lg:hidden flex items-center p-1.5 rounded-2xl bg-white border-2 border-[#0D0431] shadow-[3px_3px_0_0_#0D0431] font-mono text-xs">
          <button
            type="button"
            onClick={() => setMobileActiveTab("chat")}
            className={`flex-1 py-2 rounded-xl text-center font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileActiveTab === "chat"
                ? "bg-[#FEDF6A] text-[#0D0431] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431]"
                : "text-[#0D0431]/70 hover:text-[#0D0431]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0D0431]" />
            <span>Coach</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileActiveTab("telemetry")}
            className={`flex-1 py-2 rounded-xl text-center font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileActiveTab === "telemetry"
                ? "bg-[#FEDF6A] text-[#0D0431] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431]"
                : "text-[#0D0431]/70 hover:text-[#0D0431]"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-[#0D0431]" />
            <span>{isOnboardingMode ? `Profile (${profileCompletion}%)` : `Radar (${readinessSnapshot?.overallScore || 74})`}</span>
          </button>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Center: Full Interactive Chat Feed (8 cols on lg) */}
          <div className={`${mobileActiveTab === "chat" ? "flex" : "hidden lg:flex"} lg:col-span-8 flex-col h-[calc(100vh-170px)] min-h-[520px] bg-white border-2 border-[#0D0431] rounded-3xl overflow-hidden shadow-[8px_8px_0_0_#0D0431]`}>
            
            {/* Subtle status header */}
            <div className="px-5 py-3 border-b-2 border-[#0D0431] bg-[#FEF9CF] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#0D0431] animate-pulse" />
                <span className="text-[#0D0431] font-heading font-black flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#896EE2]" />
                  <span>{isOnboardingMode ? "Placement Calibration Assistant" : "AI Career Coach • Daily Mentorship"}</span>
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-[#0D0431] font-bold">
                {isOnboardingMode ? (
                  <>
                    <span>Step {onboardingStep} of 6</span>
                    <span>·</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#E4CDFB] border border-[#0D0431]">
                      {progressPercent}% calibrated
                    </span>
                  </>
                ) : (
                  <>
                    <span>Active SDE Track</span>
                    <span>·</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#D4FDF7] border border-[#0D0431]">
                      Readiness: {readinessSnapshot?.overallScore || 74}/100
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 font-sans bg-[#FAF7EE]/40">
              {messages.map((msg, idx) => {
                const isCoach = msg.sender === "coach";
                const toolCalls = msg.metadata?.toolCalls || [];
                const actionCards = msg.metadata?.actionCards || [];
                const modelUsed = msg.metadata?.modelUsed || "";

                return (
                  <div
                    key={idx}
                    className={`flex gap-3.5 ${isCoach ? "items-start" : "items-end justify-end"}`}
                  >
                    {isCoach && (
                      <div className="w-9 h-9 rounded-2xl bg-[#E4CDFB] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] text-[#0D0431] flex items-center justify-center shrink-0 text-xs font-mono font-black mt-0.5">
                        <Sparkles className="w-4 h-4 text-[#0D0431]" />
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] rounded-3xl p-5 border-2 border-[#0D0431] ${
                        isCoach
                          ? "bg-white text-[#0D0431] shadow-[4px_4px_0_0_#0D0431]"
                          : "bg-[#FEDF6A] text-[#0D0431] font-medium shadow-[4px_4px_0_0_#0D0431]"
                      }`}
                    >
                      {isCoach && toolCalls.length > 0 && (
                        <ToolExecutionAccordion toolCalls={toolCalls} modelUsed={modelUsed} />
                      )}

                      {isCoach ? (
                        <div>
                          <MarkdownRenderer content={msg.text} />

                          {actionCards && actionCards.length > 0 && (
                            <div className="mt-4 space-y-2 pt-3 border-t-2 border-[#0D0431]/20">
                              {actionCards.map((card, cIdx) => (
                                <ActionCard key={cIdx} url={card.url} customTitle={card.label} />
                              ))}
                            </div>
                          )}

                          <div className="mt-3.5 pt-2 border-t-2 border-[#0D0431]/10 flex items-center justify-between text-[11px] text-[#0D0431]/60 font-mono font-bold">
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSpeakText(msg.text, idx)}
                              className="flex items-center gap-1.5 text-[#0D0431] hover:text-[#896EE2] transition-colors cursor-pointer px-2 py-0.5 rounded-lg hover:bg-[#FEF9CF] border border-transparent hover:border-[#0D0431]"
                            >
                              {speakingMsgIdx === idx ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 text-[#896EE2]" />
                                  <span className="text-[#896EE2] font-mono">Playing</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>Speak</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-line text-sm sm:text-[15px] text-[#0D0431] font-bold leading-relaxed">{msg.text}</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {sending && (
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#E4CDFB] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] text-[#0D0431] flex items-center justify-center shrink-0 text-xs font-mono font-black mt-0.5">
                    <Sparkles className="w-4 h-4 text-[#0D0431]" />
                  </div>
                  <div className="bg-white border-2 border-[#0D0431] shadow-[3px_3px_0_0_#0D0431] rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#0D0431] flex items-center gap-2.5 font-mono font-bold">
                    <Loader2 className="w-4 h-4 animate-spin text-[#896EE2]" />
                    <span>Analyzing context and preparing advice...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick-Select Suggestion Chips */}
            {chips && chips.length > 0 && (
              <div className="px-5 py-3 bg-[#FEF9CF] border-t-2 border-[#0D0431] flex flex-wrap items-center gap-2">
                {chips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(chip)}
                    className="text-xs sm:text-sm px-4 py-2 rounded-xl bg-white hover:bg-[#FEDF6A] text-[#0D0431] border-2 border-[#0D0431] font-bold font-mono shadow-[2px_2px_0_0_#0D0431] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{chip}</span>
                  </button>
                ))}
              </div>
            )}

            {messageError && (
              <div
                role="alert"
                className="mx-3.5 mt-3 flex items-center justify-between gap-3 rounded-2xl border-2 border-[#0D0431] bg-[#FFC5B7] px-4 py-3 text-xs font-bold text-[#0D0431] shadow-[2px_2px_0_0_#0D0431]"
              >
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {messageError}
                </span>
                <button
                  type="button"
                  onClick={() => setMessageError("")}
                  aria-label="Dismiss message error"
                  className="rounded-lg border border-[#0D0431] bg-white p-1 hover:bg-[#FEDF6A]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Message Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!sending && inputMessage.trim()) {
                  handleSendMessage();
                }
              }}
              className="p-3.5 bg-white border-t-2 border-[#0D0431] flex items-center gap-2.5"
            >
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                title={isListening ? "Listening..." : "Dictate via Microphone"}
                className={`p-3 sm:p-3.5 rounded-2xl border-2 border-[#0D0431] transition-all cursor-pointer shadow-[2px_2px_0_0_#0D0431] ${
                  isListening
                    ? "bg-[#FFC5B7] text-[#0D0431] animate-pulse"
                    : "bg-[#FEF9CF] text-[#0D0431] hover:bg-[#FEDF6A]"
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <textarea
                rows={1}
                placeholder={
                  isOnboardingMode
                    ? "Answer coach questions, type your details, or click a chip / type 'skip' to skip..."
                    : "Ask about target company requirements, today's DSA drills, roadmap sprints..."
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!sending && inputMessage.trim()) {
                      handleSendMessage();
                    }
                  }
                }}
                disabled={sending}
                className="flex-1 bg-[#FEF9CF] text-sm sm:text-base text-[#0D0431] placeholder-[#0D0431]/50 px-4 py-2.5 sm:py-3 rounded-2xl border-2 border-[#0D0431] shadow-[3px_3px_0_0_#0D0431] focus:outline-none focus:bg-white transition-all font-sans font-medium resize-none min-h-[46px] max-h-32 leading-relaxed"
              />

              <button
                type="submit"
                disabled={sending || !inputMessage.trim()}
                className="px-5 py-2.5 sm:py-3 rounded-2xl bg-[#FEDF6A] hover:bg-[#FFE995] disabled:opacity-50 disabled:cursor-not-allowed text-[#0D0431] text-xs sm:text-sm font-bold font-mono border-2 border-[#0D0431] shadow-[3px_3px_0_0_#0D0431] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Right Column: Candidate Telemetry & Evidence Ledger (4 cols on lg) */}
          <aside
            className={`${
              mobileActiveTab === "telemetry" ? "block" : "hidden lg:block"
            } lg:col-span-4 space-y-4`}
          >
            <div className="bg-white border-2 border-[#0D0431] rounded-3xl p-6 space-y-5 shadow-[6px_6px_0_0_#0D0431]">
              
              {/* Ledger Header */}
              <div className="flex items-center justify-between border-b-2 border-[#0D0431] pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#896EE2]" />
                  <h2 className="text-xs font-heading font-black uppercase tracking-wider text-[#0D0431]">
                    {isOnboardingMode ? "Calibration Ledger" : "Placement Telemetry"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="text-[11px] text-[#0D0431] font-mono font-bold underline hover:text-[#896EE2] cursor-pointer"
                >
                  Edit Target
                </button>
              </div>

              {/* Target Ambition Badge */}
              <div className="p-4 rounded-2xl bg-[#FEF9CF] border-2 border-[#0D0431] shadow-[3px_3px_0_0_#0D0431] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                  <span className="text-[#0D0431]/70 uppercase tracking-wider">Target Goal</span>
                  <span className="text-[#0D0431] bg-[#FEDF6A] px-2 py-0.5 rounded-md border border-[#0D0431]">
                    {extractedProfile?.targetCompany
                      ? `${readinessSnapshot?.targetBenchmark || 80}/100 Bar`
                      : "Pending"}
                  </span>
                </div>
                <div className="text-sm font-bold text-[#0D0431] flex items-center gap-2.5 font-heading">
                  {extractedProfile?.targetCompany ? (
                    <CompanyLogo company={extractedProfile.targetCompany} size="sm" />
                  ) : (
                    <Target className="w-4 h-4 text-[#0D0431] shrink-0" />
                  )}
                  <span className="truncate">
                    {extractedProfile?.targetCompany ? (
                      `${extractedProfile.targetCompany} · ${extractedProfile?.targetJobRole || "Software Engineer"}`
                    ) : (
                      <span className="text-[#0D0431]/60 font-sans font-normal italic">
                        {isOnboardingMode ? "Not set yet (Calibrating in chat...)" : "Not set"}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Readiness Score Breakdown (if available) */}
              {readinessSnapshot && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between font-mono text-xs font-bold">
                    <span className="text-[#0D0431]">Placement Readiness</span>
                    <span className="text-sm font-black text-[#0D0431]">
                      {readinessSnapshot.overallScore} / 100
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#FEF9CF] overflow-hidden border-2 border-[#0D0431]">
                    <div
                      className="h-full bg-[#896EE2] rounded-full transition-all duration-700 border-r-2 border-[#0D0431]"
                      style={{ width: `${Math.min(100, Math.max(5, readinessSnapshot.overallScore || 0))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#0D0431]/70">
                    <span>Status: {readinessSnapshot.statusLabel || "Active"}</span>
                    <span>Gap: {Math.max(0, (readinessSnapshot.targetBenchmark || 80) - (readinessSnapshot.overallScore || 0))} pts</span>
                  </div>

                  {/* Readiness Dimension Pills */}
                  {readinessSnapshot.breakdown && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#0D0431]/20 text-[11px] font-mono font-bold text-[#0D0431]">
                      <div className="p-2 rounded-xl bg-[#FAF7EE] border border-[#0D0431] flex items-center justify-between">
                        <span>💻 DSA</span>
                        <span>{readinessSnapshot.breakdown.dsa ?? 65}%</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#FAF7EE] border border-[#0D0431] flex items-center justify-between">
                        <span>🛠️ Projects</span>
                        <span>{readinessSnapshot.breakdown.projects ?? 70}%</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#FAF7EE] border border-[#0D0431] flex items-center justify-between">
                        <span>📄 Resume</span>
                        <span>{readinessSnapshot.breakdown.resume ?? 75}%</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#FAF7EE] border border-[#0D0431] flex items-center justify-between">
                        <span>📘 Academics</span>
                        <span>{readinessSnapshot.breakdown.academics ?? 80}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Day-to-Day Quick Sprint Actions (Shown only in Day-to-Day Coach mode) */}
              {!isOnboardingMode && (
                <div className="pt-3 border-t-2 border-[#0D0431] space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#0D0431]/70 block">
                    Daily Drill Commands
                  </span>
                  <div className="grid grid-cols-1 gap-1.5 font-mono text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => handleSendMessage("What 3 high-impact DSA problems should I solve today for my target company?")}
                      className="p-2.5 rounded-xl bg-[#FEDF6A] hover:bg-[#FFE995] text-[#0D0431] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] text-left flex items-center justify-between cursor-pointer transition-all"
                    >
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-[#0D0431]" />
                        <span>Today's 3 DSA Problems</span>
                      </span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendMessage("Audit my ATS resume keywords and tell me top 3 action fixes")}
                      className="p-2.5 rounded-xl bg-[#D4FDF7] hover:bg-[#BDF6ED] text-[#0D0431] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] text-left flex items-center justify-between cursor-pointer transition-all"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#0D0431]" />
                        <span>Audit ATS Resume Gaps</span>
                      </span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendMessage("Give me a behavioral interview question tailored to my target company using STAR")}
                      className="p-2.5 rounded-xl bg-[#E4CDFB] hover:bg-[#D5B9F7] text-[#0D0431] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] text-left flex items-center justify-between cursor-pointer transition-all"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#0D0431]" />
                        <span>Behavioral Mock Question</span>
                      </span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Evidence Connections */}
              <div className="pt-3 border-t-2 border-[#0D0431] space-y-3">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#0D0431]/70 block">
                  Connected Proof of Work
                </span>

                {/* VTOP Academics */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7EE] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#FEDF6A] border border-[#0D0431] flex items-center justify-center">
                      <GraduationCap className="w-3.5 h-3.5 text-[#0D0431] shrink-0" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[#0D0431] font-bold block truncate">VTOP Academics</span>
                      {isVtopConnected && (
                        <span className="text-[10px] text-[#0D0431]/70 font-mono font-bold block truncate">
                          {connectedProfiles?.vtop?.cgpa || extractedProfile?.cgpa} CGPA · {connectedProfiles?.vtop?.regNo || extractedProfile?.vtopRegNo || "Verified"}
                        </span>
                      )}
                    </div>
                  </div>
                  {isVtopConnected ? (
                    <span className="font-mono text-[11px] font-bold text-[#0D0431] bg-[#D4FDF7] px-2 py-0.5 rounded-full border border-[#0D0431] flex items-center gap-1 shrink-0">
                      <ShieldCheck className="w-3 h-3 text-[#0D0431]" />
                      Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleOpenVtopModal}
                      className="text-[11px] font-mono font-bold px-3 py-1 rounded-xl bg-white hover:bg-[#FEDF6A] text-[#0D0431] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] transition-all shrink-0 cursor-pointer"
                    >
                      Connect
                    </button>
                  )}
                </div>

                {/* GitHub */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7EE] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#E4CDFB] border border-[#0D0431] flex items-center justify-center">
                      <Github className="w-3.5 h-3.5 text-[#0D0431]" />
                    </div>
                    <span className="text-[#0D0431] font-bold">GitHub</span>
                  </div>
                  {isGhConnected ? (
                    <span className="font-mono text-[11px] font-bold text-[#0D0431] bg-[#D4FDF7] px-2 py-0.5 rounded-full border border-[#0D0431] flex items-center gap-1">
                      <Check className="w-3 h-3 text-[#0D0431]" />
                      @{connectedProfiles?.github?.username}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowGhModal(true)}
                      className="text-[11px] font-mono font-bold px-3 py-1 rounded-xl bg-white hover:bg-[#FEDF6A] text-[#0D0431] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] transition-all cursor-pointer"
                    >
                      Connect
                    </button>
                  )}
                </div>

                {/* LeetCode */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7EE] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#FEDF6A] border border-[#0D0431] flex items-center justify-center">
                      <Code2 className="w-3.5 h-3.5 text-[#0D0431]" />
                    </div>
                    <span className="text-[#0D0431] font-bold">LeetCode</span>
                  </div>
                  {isLcConnected ? (
                    <span className="font-mono text-[11px] font-bold text-[#0D0431] bg-[#D4FDF7] px-2 py-0.5 rounded-full border border-[#0D0431] flex items-center gap-1">
                      <Check className="w-3 h-3 text-[#0D0431]" />
                      @{connectedProfiles?.leetcode?.username}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowLcModal(true)}
                      className="text-[11px] font-mono font-bold px-3 py-1 rounded-xl bg-white hover:bg-[#FEDF6A] text-[#0D0431] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] transition-all cursor-pointer"
                    >
                      Connect
                    </button>
                  )}
                </div>

                {/* AI Resume ATS */}
                <div className="p-3.5 rounded-2xl bg-[#FAF7EE] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0 pr-1">
                      <div className="w-7 h-7 rounded-lg bg-[#FFC5B7] border border-[#0D0431] flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-[#0D0431] shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[#0D0431] block truncate font-bold">Resume ATS</span>
                        {connectedProfiles?.resume?.score || extractedProfile?.resumeScore ? (
                          <span className="text-[10px] text-[#0D0431]/70 font-mono font-bold block truncate">
                            ATS Score: {connectedProfiles?.resume?.score || extractedProfile?.resumeScore}/100
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#0D0431]/60 font-mono font-medium block truncate">
                            Not uploaded yet
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowResumeModal(true)}
                      className="text-[11px] font-mono font-bold px-3 py-1 rounded-xl bg-white hover:bg-[#FEDF6A] text-[#0D0431] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] transition-all shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{connectedProfiles?.resume?.score || extractedProfile?.resumeScore ? "Re-upload" : "Upload"}</span>
                    </button>
                  </div>

                  {(connectedProfiles?.resume?.score || extractedProfile?.resumeScore) && (
                    <div className="pt-2 border-t border-[#0D0431]/20 flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#0D0431] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#0D0431]" />
                        Evaluated
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate("/app/resume")}
                        className="text-[10px] font-mono font-bold text-[#0D0431] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Resume Details</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t-2 border-[#0D0431] space-y-2.5">
                {isOnboardingMode ? (
                  <>
                    <GpButton
                      onClick={handleFinalizeAndEnterDashboard}
                      disabled={applyingProfile}
                      variant="stacked"
                      size="md"
                      fullWidth
                    >
                      {applyingProfile ? "Entering Dashboard..." : "Enter Dashboard →"}
                    </GpButton>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSkip("step")}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-white hover:bg-[#FEDF6A] text-xs font-mono font-bold text-[#0D0431] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] transition-all cursor-pointer text-center"
                      >
                        Skip Step ⏭
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSkip("all")}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-[#FAF7EE] hover:bg-[#FFC5B7] text-xs font-mono font-bold text-[#0D0431] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] transition-all cursor-pointer text-center"
                      >
                        Skip All
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <GpButton
                      to="/app/roadmap"
                      variant="stacked"
                      size="md"
                      fullWidth
                    >
                      Open Placement Roadmap →
                    </GpButton>

                    <GpButton
                      to="/app"
                      variant="outline"
                      size="sm"
                      fullWidth
                    >
                      Return to Dashboard
                    </GpButton>
                  </>
                )}
              </div>

            </div>
          </aside>
        </div>
      </main>

      {/* VTOP Connect Modal */}
      {showVtopModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowVtopModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0431]/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm bg-[#FEF9CF] border-2 border-[#0D0431] rounded-3xl p-6 space-y-4 shadow-[8px_8px_0_0_#0D0431] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-[#0D0431] pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#0D0431]" />
                <h3 className="text-base font-heading font-black text-[#0D0431]">Connect VTOP</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVtopModal(false)}
                className="w-7 h-7 rounded-lg border-2 border-[#0D0431] bg-white hover:bg-[#FEDF6A] flex items-center justify-center text-[#0D0431] shadow-[2px_2px_0_0_#0D0431] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {vtopError && (
              <div className="p-3 rounded-xl bg-[#FFC5B7] border-2 border-[#0D0431] text-xs font-bold text-[#0D0431] flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#0D0431]" />
                <span>{vtopError}</span>
              </div>
            )}

            <form onSubmit={handleConnectVtopDirect} className="space-y-3.5">
              <div>
                <label className="text-xs text-[#0D0431] font-mono font-bold mb-1 block uppercase">
                  Registration Number
                </label>
                <input
                  type="text"
                  placeholder="Enter Registration Number"
                  value={vtopUsername}
                  onChange={(e) => setVtopUsername(e.target.value.toUpperCase())}
                  className="w-full bg-white text-xs font-bold text-[#0D0431] px-3.5 py-2.5 rounded-xl border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] focus:outline-none focus:bg-[#FEF9CF] font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-[#0D0431] font-mono font-bold mb-1 block uppercase">
                  VTOP Password
                </label>
                <input
                  type="password"
                  placeholder="Enter VTOP password"
                  value={vtopPassword}
                  onChange={(e) => setVtopPassword(e.target.value)}
                  className="w-full bg-white text-xs font-bold text-[#0D0431] px-3.5 py-2.5 rounded-xl border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] focus:outline-none focus:bg-[#FEF9CF] font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-[#0D0431] font-mono font-bold uppercase">
                    Captcha
                  </label>
                  <button
                    type="button"
                    onClick={() => fetchLiveVtopCaptcha()}
                    className="text-[10px] text-[#0D0431] hover:underline font-mono font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${vtopLoadingCaptcha ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {vtopCaptchaImage && (
                  <div className="mb-2 p-2 bg-white rounded-xl border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] flex items-center justify-center">
                    <img
                      src={normalizeCaptchaImageSrc(vtopCaptchaImage)}
                      alt="VTOP Captcha"
                      className="h-10 rounded object-contain"
                    />
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Enter captcha text"
                  value={vtopCaptchaText}
                  onChange={(e) => setVtopCaptchaText(e.target.value)}
                  className="w-full bg-white text-xs font-bold text-[#0D0431] px-3.5 py-2.5 rounded-xl border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] focus:outline-none focus:bg-[#FEF9CF] font-mono uppercase"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVtopModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-xs font-mono font-bold text-[#0D0431] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] cursor-pointer"
                >
                  Cancel
                </button>
                <GpButton
                  type="submit"
                  disabled={vtopLoading || !vtopUsername}
                  variant="stacked"
                  size="sm"
                  className="flex-1 py-2.5"
                >
                  {vtopLoading ? "Verifying..." : "Verify VTOP"}
                </GpButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GitHub Connect Modal */}
      {showGhModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGhModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0431]/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm bg-[#FEF9CF] border-2 border-[#0D0431] rounded-3xl p-6 space-y-4 shadow-[8px_8px_0_0_#0D0431] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-[#0D0431] pb-3">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-[#0D0431]" />
                <h3 className="text-base font-heading font-black text-[#0D0431]">Connect GitHub</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGhModal(false)}
                className="w-7 h-7 rounded-lg border-2 border-[#0D0431] bg-white hover:bg-[#FEDF6A] flex items-center justify-center text-[#0D0431] shadow-[2px_2px_0_0_#0D0431] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {ghError && (
              <div className="p-3 rounded-xl bg-[#FFC5B7] border-2 border-[#0D0431] text-xs font-bold text-[#0D0431] flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#0D0431]" />
                <span>{ghError}</span>
              </div>
            )}

            <form onSubmit={handleConnectGitHubDirect} className="space-y-3.5">
              <div>
                <label className="text-xs text-[#0D0431] font-mono font-bold mb-1 block uppercase">
                  GitHub Username or URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. torvalds or https://github.com/torvalds"
                  value={ghInput}
                  onChange={(e) => setGhInput(e.target.value)}
                  className="w-full bg-white text-xs font-bold text-[#0D0431] px-3.5 py-2.5 rounded-xl border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] focus:outline-none focus:bg-[#FEF9CF] font-mono"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGhModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-xs font-mono font-bold text-[#0D0431] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] cursor-pointer"
                >
                  Cancel
                </button>
                <GpButton
                  type="submit"
                  disabled={ghLoading || !ghInput.trim()}
                  variant="stacked"
                  size="sm"
                  className="flex-1 py-2.5"
                >
                  {ghLoading ? "Linking..." : "Link GitHub"}
                </GpButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LeetCode Connect Modal */}
      {showLcModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLcModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0431]/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm bg-[#FEF9CF] border-2 border-[#0D0431] rounded-3xl p-6 space-y-4 shadow-[8px_8px_0_0_#0D0431] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-[#0D0431] pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#0D0431]" />
                <h3 className="text-base font-heading font-black text-[#0D0431]">Connect LeetCode</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLcModal(false)}
                className="w-7 h-7 rounded-lg border-2 border-[#0D0431] bg-white hover:bg-[#FEDF6A] flex items-center justify-center text-[#0D0431] shadow-[2px_2px_0_0_#0D0431] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {lcError && (
              <div className="p-3 rounded-xl bg-[#FFC5B7] border-2 border-[#0D0431] text-xs font-bold text-[#0D0431] flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#0D0431]" />
                <span>{lcError}</span>
              </div>
            )}

            <form onSubmit={handleConnectLeetCodeDirect} className="space-y-3.5">
              <div>
                <label className="text-xs text-[#0D0431] font-mono font-bold mb-1 block uppercase">
                  LeetCode Username or URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. neetcode or https://leetcode.com/neetcode"
                  value={lcInput}
                  onChange={(e) => setLcInput(e.target.value)}
                  className="w-full bg-white text-xs font-bold text-[#0D0431] px-3.5 py-2.5 rounded-xl border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] focus:outline-none focus:bg-[#FEF9CF] font-mono"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLcModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-xs font-mono font-bold text-[#0D0431] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] cursor-pointer"
                >
                  Cancel
                </button>
                <GpButton
                  type="submit"
                  disabled={lcLoading || !lcInput.trim()}
                  variant="stacked-yellow"
                  size="sm"
                  className="flex-1 py-2.5"
                >
                  {lcLoading ? "Linking..." : "Link LeetCode"}
                </GpButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resume Upload Modal */}
      {showResumeModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowResumeModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0431]/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-[#FEF9CF] border-2 border-[#0D0431] rounded-3xl p-6 space-y-4 shadow-[8px_8px_0_0_#0D0431] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-[#0D0431] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#896EE2]" />
                <h3 className="text-base font-heading font-black text-[#0D0431]">Upload Resume</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResumeModal(false)}
                className="w-7 h-7 rounded-lg border-2 border-[#0D0431] bg-white hover:bg-[#FEDF6A] flex items-center justify-center text-[#0D0431] shadow-[2px_2px_0_0_#0D0431] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {resumeError && (
              <div className="p-3 rounded-xl bg-[#FFC5B7] border-2 border-[#0D0431] text-xs font-bold text-[#0D0431] flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#0D0431]" />
                <span>{resumeError}</span>
              </div>
            )}

            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#0D0431] hover:bg-[#FEDF6A]/40 rounded-2xl cursor-pointer bg-white transition-colors shadow-[3px_3px_0_0_#0D0431]">
                <Upload className="w-8 h-8 text-[#0D0431] mb-2" />
                <span className="text-xs text-[#0D0431] font-bold font-mono">
                  {resumeFile ? resumeFile.name : "Select PDF Document (Max 10MB)"}
                </span>
                <span className="text-[10px] text-[#0D0431]/70 font-mono mt-1">
                  Evaluated for ATS keyword match and structure
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResumeModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-xs font-mono font-bold text-[#0D0431] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] cursor-pointer"
                >
                  Cancel
                </button>
                <GpButton
                  onClick={() => handleUploadResumeDirect()}
                  disabled={resumeUploading || !resumeFile}
                  variant="stacked"
                  size="sm"
                  className="flex-1 py-2.5"
                >
                  {resumeUploading ? "Analyzing..." : "Analyze ATS"}
                </GpButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Inferred Profile Modal */}
      {showEditModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0431]/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-[#FEF9CF] border-2 border-[#0D0431] rounded-3xl p-6 space-y-4 shadow-[8px_8px_0_0_#0D0431] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-[#0D0431] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#0D0431]" />
                <h3 className="text-base font-heading font-black text-[#0D0431]">Edit Target & Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-7 h-7 rounded-lg border-2 border-[#0D0431] bg-white hover:bg-[#FEDF6A] flex items-center justify-center text-[#0D0431] shadow-[2px_2px_0_0_#0D0431] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfileEdits} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-mono font-bold text-[#0D0431] block mb-1 uppercase">
                  Target Company (Curated Premier Tech Whitelist)
                </label>
                <div className="flex items-center gap-2">
                  <CompanyLogo company={editForm.targetCompany || "Google"} size="md" />
                  <select
                    value={normalizeCompanyName(editForm.targetCompany || "Google")}
                    onChange={(e) => {
                      const selectedComp = e.target.value;
                      const validRoles = getRolesForCompany(selectedComp);
                      setEditForm({
                        ...editForm,
                        targetCompany: selectedComp,
                        targetJobRole: validRoles.includes(editForm.targetJobRole) ? editForm.targetJobRole : validRoles[0],
                      });
                    }}
                    className="flex-1 bg-white text-xs font-bold text-[#0D0431] px-3.5 py-2.5 rounded-xl border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] focus:outline-none focus:bg-[#FEF9CF] font-mono cursor-pointer"
                  >
                    {CURATED_COMPANIES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.tier.split("/")[0].trim()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold text-[#0D0431] block mb-1 uppercase">
                  Target Role ({getRolesForCompany(editForm.targetCompany || "Google").length} Calibrated Roles)
                </label>
                <select
                  value={normalizeRoleName(editForm.targetJobRole || "", editForm.targetCompany || "Google")}
                  onChange={(e) => setEditForm({ ...editForm, targetJobRole: e.target.value })}
                  className="w-full bg-white text-xs font-bold text-[#0D0431] px-3.5 py-2.5 rounded-xl border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] focus:outline-none focus:bg-[#FEF9CF] font-mono cursor-pointer"
                >
                  {getRolesForCompany(editForm.targetCompany || "Google").map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono font-bold text-[#0D0431] block mb-1 uppercase">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.cgpa}
                    onChange={(e) => setEditForm({ ...editForm, cgpa: e.target.value })}
                    placeholder="e.g. 8.85"
                    className="w-full bg-white text-xs font-bold text-[#0D0431] px-3.5 py-2.5 rounded-xl border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] focus:outline-none focus:bg-[#FEF9CF] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono font-bold text-[#0D0431] block mb-1 uppercase">Graduation Year</label>
                  <input
                    type="number"
                    value={editForm.graduationYear}
                    onChange={(e) => setEditForm({ ...editForm, graduationYear: e.target.value })}
                    placeholder="e.g. 2026"
                    className="w-full bg-white text-xs font-bold text-[#0D0431] px-3.5 py-2.5 rounded-xl border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] focus:outline-none focus:bg-[#FEF9CF] font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-xs font-mono font-bold text-[#0D0431] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] cursor-pointer"
                >
                  Cancel
                </button>
                <GpButton
                  type="submit"
                  variant="stacked"
                  size="sm"
                  className="flex-1"
                >
                  Save Changes
                </GpButton>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
