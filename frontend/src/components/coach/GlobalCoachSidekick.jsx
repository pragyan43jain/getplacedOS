import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import gsap from "gsap";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Trash2,
  Maximize2,
  Minimize2,
  Bot,
  Compass,
} from "lucide-react";
import { NODE_API_URL } from "@/config/api";
import MarkdownRenderer from "./MarkdownRenderer";
import ToolExecutionAccordion from "./ToolExecutionAccordion";
import ActionCard from "./ActionCard";

const CONTEXT_PROMPTS = {
  "/app": [
    "Audit my placement readiness",
    "What are my highest priority gaps?",
    "Show me what to do next today",
  ],
  "/app/vtop": [
    "Which subjects have attendance warnings?",
    "Am I placement eligible for Tier-1 Super Dream?",
    "Explain my standing arrears and credit backlog",
  ],
  "/app/academics": [
    "How much SGPA do I need for 9.0 CGPA?",
    "Which company cutoffs do I qualify for right now?",
    "Calculate required marks for remaining semesters",
  ],
  "/app/resume": [
    "Which resume bullet points should I rewrite with XYZ formula?",
    "What critical keywords am I missing for SDE roles?",
    "How do I raise my ATS score above 85?",
  ],
  "/app/sheets": [
    "What DSA topic should I solve today?",
    "Explain Binary Search patterns and common templates",
    "Which sheet is best for SDE interviews?",
  ],
  "/app/coding": [
    "Give me an intuitive hint without spoiling the full answer",
    "What is the time and space complexity bottleneck?",
    "Explain edge cases for this DSA problem",
  ],
  "/app/interview": [
    "Start a technical mock interview session",
    "How do I structure behavioral answers using the STAR method?",
    "Give me top interview questions for backend engineers",
  ],
  "/app/jobs": [
    "Which tech job openings match my profile score best?",
    "What skills should I learn for Microsoft SDE roles?",
    "Filter high-match software opportunities",
  ],
  "/app/roadmap": [
    "Generate a 4-week placement sprint roadmap",
    "How should I distribute time between DSA and development?",
    "What milestones should I target this week?",
  ],
  "/app/company-intel": [
    "What is the interview breakdown for Google and Amazon?",
    "Show historical compensation and hiring patterns",
    "What DSA topics are asked most frequently?",
  ],
};

export default function GlobalCoachSidekick() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [chips, setChips] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState(null);
  const [showGlow, setShowGlow] = useState(true);

  const chatScrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const popupRef = useRef(null);
  const headerRef = useRef(null);
  const inputRef = useRef(null);
  const triggerBtnRef = useRef(null);
  const backdropRef = useRef(null);

  // If candidate is already on dedicated /app/coach page, don't show floating sidekick to avoid redundancy
  const isDedicatedCoachPage =
    location.pathname.includes("/app/coach") || location.pathname.includes("/onboarding");

  // GSAP Smooth Bottom Slide-Up & Background Blur Reveal Animation
  useEffect(() => {
    if (isOpen && popupRef.current) {
      if (backdropRef.current) {
        gsap.fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.32, ease: "power2.out" }
        );
      }

      gsap.fromTo(
        popupRef.current,
        { opacity: 0, y: 45, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "power3.out" }
      );
    }
  }, [isOpen]);

  // Close AI Helper automatically on route change
  const prevPathnameRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      prevPathnameRef.current = location.pathname;
      if (isOpen) {
        handleClose();
      }
    }
  }, [location.pathname, isOpen]);

  // Glowing gradient animation runs for 5.5 seconds on page load, then smoothly stops
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGlow(false);
    }, 5500);

    return () => clearTimeout(timer);
  }, []);

  // Contextual chips when route changes
  useEffect(() => {
    const defaultChips =
      CONTEXT_PROMPTS[location.pathname] ||
      CONTEXT_PROMPTS["/app"] || [
        "Audit my placement readiness",
        "What should I focus on today?",
        "How to improve my ATS score?",
      ];
    setChips(defaultChips);
  }, [location.pathname]);

  // Fetch session history & quick contextual suggestions on open
  useEffect(() => {
    if (!isOpen || isDedicatedCoachPage) return;

    const loadSession = async () => {
      setLoadingHistory(true);
      try {
        const [sessionRes, suggRes] = await Promise.allSettled([
          axios.get(`${NODE_API_URL}/api/coach/session`, { withCredentials: true }),
          axios.get(
            `${NODE_API_URL}/api/coach/quick-suggestions?path=${encodeURIComponent(
              location.pathname
            )}`,
            { withCredentials: true }
          ),
        ]);

        if (sessionRes.status === "fulfilled" && sessionRes.value.data?.messages) {
          setMessages(sessionRes.value.data.messages);
        }
        if (suggRes.status === "fulfilled" && suggRes.value.data?.suggestions?.length > 0) {
          setChips(suggRes.value.data.suggestions);
        }
      } catch (err) {
        console.warn("Could not load coach sidekick session:", err.message);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadSession();
  }, [isOpen, location.pathname, isDedicatedCoachPage]);

  // Unmount cleanup for TTS & Speech Recognition
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

  const handleClose = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setSpeakingMsgIdx(null);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);

    if (backdropRef.current) {
      gsap.to(backdropRef.current, {
        opacity: 0,
        duration: 0.22,
        ease: "power2.inOut",
      });
    }

    if (popupRef.current) {
      gsap.to(popupRef.current, {
        opacity: 0,
        y: 40,
        scale: 0.98,
        duration: 0.24,
        ease: "power2.inOut",
        onComplete: () => setIsOpen(false),
      });
    } else {
      setIsOpen(false);
    }
  };

  // Keyboard shortcuts: Cmd+J or Ctrl+J to toggle, Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        if (!isDedicatedCoachPage) {
          e.preventDefault();
          if (isOpen) {
            handleClose();
          } else {
            setIsOpen(true);
          }
        }
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDedicatedCoachPage, isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, sending, isOpen]);

  // Speech Recognition (Web Speech API)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {}
      }
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
        console.warn("Speech recognition error:", e?.error || e);
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

  const handleSendMessage = async (textToSend) => {
    const isDirect = typeof textToSend === "string" && textToSend.trim().length > 0;
    const text = isDirect ? textToSend : inputMessage;
    if (!text || !text.trim() || sending) return;

    const trimmed = text.trim();
    const previousInput = inputMessage;
    const tempUserMsg = {
      sender: "user",
      role: "user",
      text: trimmed,
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    if (!isDirect) {
      setInputMessage("");
    }
    setSending(true);

    try {
      const res = await axios.post(
        `${NODE_API_URL}/api/coach/message`,
        { message: trimmed, path: location.pathname },
        { withCredentials: true, timeout: 35000 }
      );

      if (res.data?.messages) {
        setMessages(res.data.messages);
      } else if (res.data?.reply || res.data?.text) {
        const coachReply = {
          sender: "coach",
          role: "assistant",
          text: res.data.reply || res.data.text,
          content: res.data.reply || res.data.text,
          metadata: {
            toolCalls: res.data.toolCalls || res.data.toolExecutions || [],
            actionCards: res.data.actionCards || (res.data.actionCard ? [res.data.actionCard] : []),
            modelUsed: res.data.modelUsed || "Gemini 3.5 Flash",
          },
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, coachReply]);
      }

      if (res.data?.chips) {
        setChips(res.data.chips);
      }
    } catch (err) {
      console.error("Could not send message to coach sidekick:", err);
      if (!isDirect) {
        setInputMessage(previousInput);
      }
      const errDetail = err.response?.data?.message || err.message || "Request timed out";
      setMessages((prev) => [
        ...prev,
        {
          sender: "coach",
          role: "assistant",
          text: `⚠️ **Unable to get a response right now.** (${errDetail})\n\nPlease check your connection and try again.`,
          content: `⚠️ **Unable to get a response right now.** (${errDetail})\n\nPlease check your connection and try again.`,
          timestamp: new Date().toISOString(),
          metadata: { isError: true },
        },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => scrollToBottom(), 50);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to reset the AI Career Coach conversation?")) return;
    try {
      const res = await axios.post(
        `${NODE_API_URL}/api/coach/clear-chat`,
        {},
        { withCredentials: true }
      );
      if (res.data?.session?.messages) {
        setMessages(res.data.session.messages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.warn("Could not clear chat:", err.message);
      setMessages([]);
    }
  };

  if (isDedicatedCoachPage) return null;

  const currentSurfaceName = (() => {
    const raw = location.pathname.replace("/app/", "").replace("/app", "");
    if (!raw) return "Overview";
    return raw
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  })();

  return (
    <>
      {/* 1. FLOATING AMBIENT BUTTON (BOTTOM CENTER DOCK) */}
      {!isOpen && (
        <div
          ref={triggerBtnRef}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6 z-50 flex items-center gap-2 group select-none"
        >
          <div className="relative inline-flex items-center justify-center">
            {/* Glowing Gradient Aura & Border (Active on page load for a few seconds) */}
            <div
              className={`absolute -inset-[3px] rounded-full pointer-events-none transition-opacity duration-1000 ease-out ${
                showGlow ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden="true"
            >
              {/* Soft Ambient Diffused Pulsing Glow */}
              <div className="absolute -inset-2.5 rounded-full bg-gradient-to-r from-[#6E44FF]/70 via-[#FFD84D]/50 to-[#00D2FF]/70 blur-xl animate-coach-glow-pulse" />

              {/* Rotating Gradient Blur Aura */}
              <div className="absolute -inset-1 rounded-full blur-md flex items-center justify-center overflow-hidden opacity-90">
                <div
                  className="w-[360px] h-[360px] shrink-0 animate-coach-glow-spin"
                  style={{
                    background:
                      "conic-gradient(from 0deg, #6E44FF 0%, #FFD84D 25%, #00D2FF 50%, #EC4899 75%, #6E44FF 100%)",
                  }}
                />
              </div>

              {/* Sharp Rotating Gradient Border Ring */}
              <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center">
                <div
                  className="w-[360px] h-[360px] shrink-0 animate-coach-glow-spin"
                  style={{
                    background:
                      "conic-gradient(from 0deg, #6E44FF 0%, #FFD84D 25%, #00D2FF 50%, #EC4899 75%, #6E44FF 100%)",
                  }}
                />
              </div>
            </div>

            {/* Main Interactive Button */}
            <button
              id="global-ai-coach-trigger"
              type="button"
              onClick={() => setIsOpen(true)}
              className="relative z-10 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#17103D] hover:bg-[#24195A] active:scale-95 text-white font-medium text-xs sm:text-sm shadow-[0_12px_32px_rgba(23,16,61,0.28),0_2px_8px_rgba(23,16,61,0.12)] hover:shadow-[0_16px_40px_rgba(23,16,61,0.36)] transition-all duration-200 cursor-pointer border border-[#2E245E] hover:border-[#6E44FF]/40 backdrop-blur-md"
              title="Open getPlaced Coach (⌘J)"
            >
              {/* Glowing Accent Badge */}
              <div className="w-5 h-5 rounded-full bg-[#FFD84D]/20 border border-[#FFD84D]/30 flex items-center justify-center">
                <Sparkles
                  className={`w-3 h-3 text-[#FFD84D] group-hover:rotate-12 transition-transform duration-300 ${
                    showGlow ? "animate-pulse" : ""
                  }`}
                />
              </div>

              {/* Floater Label */}
              <span className="font-heading font-bold tracking-tight text-white">
                getPlaced Coach
              </span>

              {/* Keyboard Shortcut Pill */}
              <span className="hidden sm:inline-flex items-center text-[10px] font-mono font-semibold text-[#FFD84D] bg-white/10 px-2 py-0.5 rounded-md border border-white/15">
                ⌘J
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 2. FULLSCREEN BACKDROP OVERLAY */}
      {isOpen && (
        <div
          ref={backdropRef}
          onClick={handleClose}
          className="fixed inset-0 z-40 bg-[#17103D]/60 backdrop-blur-md cursor-pointer transition-opacity"
          title="Click backdrop to dismiss"
        />
      )}

      {/* 3. ASSISTANT POPUP DRAWER (CENTERED BOTTOM FLOATER) */}
      {isOpen && (
        <div
          ref={popupRef}
          className={`fixed z-50 transition-[width,height] duration-300 ease-out flex flex-col bg-white border border-[#E2DEEC] shadow-[0_24px_64px_rgba(23,16,61,0.24),0_6px_20px_rgba(23,16,61,0.1)] rounded-3xl overflow-hidden ${
            isExpanded
              ? "bottom-0 left-0 right-0 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:w-[980px] md:w-[1140px] lg:w-[1240px] max-w-[96vw] h-[92vh] sm:h-[88vh] max-h-[92vh] sm:max-h-[88vh] rounded-b-none sm:rounded-3xl"
              : "bottom-0 left-0 right-0 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:w-[760px] md:w-[840px] lg:w-[920px] max-w-[94vw] h-[88vh] sm:h-[680px] max-h-[88vh] sm:max-h-[88vh] rounded-b-none sm:rounded-3xl"
          }`}
        >
          {/* Header */}
          <div
            ref={headerRef}
            className="px-5 py-3.5 bg-[#17103D] border-b border-[#2A2058] flex items-center justify-between shrink-0 text-white"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 text-[#FFD84D] flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-white">getPlaced Coach</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono text-[#FFD84D] bg-white/10 px-2 py-0.5 rounded-md border border-white/15 font-medium">
                    Surface: {currentSurfaceName}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                title="Reset Chat Session"
                className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse View" : "Expand Full View"}
                className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer hidden sm:inline-flex"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleClose}
                title="Close (Esc)"
                className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-sans text-xs sm:text-sm bg-[#F8F8F5]"
          >
            {loadingHistory && (
              <div className="flex items-center justify-center py-12 text-[#6F6A80] gap-2.5 font-medium text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-[#6E44FF]" />
                <span>Loading career coach intelligence...</span>
              </div>
            )}

            {!loadingHistory && messages.length === 0 && (
              <div className="text-center py-10 px-4 max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EFEAFF] border border-[#E2DEEC] text-[#6E44FF] flex items-center justify-center mx-auto shadow-xs">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading font-bold text-sm text-[#17103D]">
                    Placement Advisory & Intelligence Coach
                  </h4>
                  <p className="text-xs text-[#6F6A80] leading-relaxed font-sans font-medium">
                    Ask me to audit your resume for ATS gaps, check company cutoff eligibility, explain DSA patterns, or simulate technical interviews.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isCoach =
                msg.sender === "coach" ||
                msg.role === "assistant" ||
                msg.role === "coach" ||
                msg.sender === "assistant";
              const textContent = msg.text || msg.content || msg.reply || "";
              const toolCalls =
                msg.metadata?.toolCalls || msg.toolCalls || msg.toolExecutions || [];
              const actionCards =
                msg.metadata?.actionCards ||
                msg.actionCards ||
                (msg.actionCard ? [msg.actionCard] : []);
              const modelUsed = msg.metadata?.modelUsed || msg.modelUsed || "";

              return (
                <div
                  key={idx}
                  className={`flex gap-3 ${isCoach ? "items-start" : "items-end justify-end"}`}
                >
                  {isCoach && (
                    <div className="w-7 h-7 rounded-xl bg-[#17103D] text-[#FFD84D] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[94%] sm:max-w-[88%] rounded-2xl px-4 py-3.5 ${
                      isCoach
                        ? "bg-white border border-[#E2DEEC] text-[#17103D] shadow-[0_2px_8px_rgba(23,16,61,0.03)]"
                        : "bg-[#17103D] text-white font-medium rounded-tr-sm shadow-[0_2px_8px_rgba(23,16,61,0.08)]"
                    }`}
                  >
                    {isCoach && toolCalls.length > 0 && (
                      <ToolExecutionAccordion toolCalls={toolCalls} modelUsed={modelUsed} />
                    )}

                    {isCoach ? (
                      <div>
                        <MarkdownRenderer content={textContent} onNavigate={handleClose} />

                        {actionCards && actionCards.length > 0 && (
                          <div className="mt-3 space-y-2 pt-2.5 border-t border-[#E2DEEC]">
                            {actionCards.map((card, cIdx) => (
                              <ActionCard
                                key={cIdx}
                                url={card.url}
                                customTitle={card.label || card.title}
                                customDescription={card.description}
                                action={card}
                                onAction={handleClose}
                              />
                            ))}
                          </div>
                        )}

                        <div className="mt-3 pt-2 border-t border-[#E2DEEC] flex items-center justify-between text-[10px] text-[#6F6A80]">
                          <span className="font-mono">
                            {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSpeakText(textContent, idx)}
                            className="flex items-center gap-1.5 text-[#6E44FF] hover:text-[#5B33E8] font-mono font-semibold transition-colors cursor-pointer"
                          >
                            {speakingMsgIdx === idx ? (
                              <>
                                <VolumeX className="w-3 h-3 text-[#0D7A68] animate-pulse" />
                                <span className="text-[#0D7A68]">Speaking...</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3" />
                                <span>Speak</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed">
                        {textContent}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-[#17103D] text-[#FFD84D] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-[#E2DEEC] rounded-2xl px-4 py-3 text-xs text-[#17103D] flex items-center gap-2.5 font-medium shadow-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-[#6E44FF]" />
                  <span>Synthesizing intelligence & analyzing context...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick-Select Context Suggestion Chips */}
          {chips && chips.length > 0 && (
            <div className="px-4 py-2.5 bg-[#F2F0FA] border-t border-[#E2DEEC] flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
              {chips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  disabled={sending}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-white hover:bg-[#EFEAFF] text-[#17103D] hover:text-[#6E44FF] border border-[#E2DEEC] hover:border-[#6E44FF]/40 transition-all font-sans font-semibold cursor-pointer text-left shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Message Input Box */}
          <form
            ref={inputRef}
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3.5 sm:p-4 border-t border-[#E2DEEC] bg-white flex items-center gap-2.5 shrink-0"
          >
            {/* Microphone Dictate Button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              title={isListening ? "Listening..." : "Dictate via Voice"}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isListening
                  ? "bg-[#FFE8E5] border-[#C7382B]/40 text-[#C7382B] animate-pulse"
                  : "bg-[#F8F8F5] hover:bg-[#EFEAFF] text-[#6F6A80] hover:text-[#6E44FF] border-[#E2DEEC]"
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Text Input */}
            <textarea
              rows={1}
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
              placeholder="Ask coach anything about requirements, roadmap, gaps, cutoffs..."
              disabled={sending}
              className="flex-1 bg-[#F8F8F5] focus:bg-white border border-[#E2DEEC] focus:border-[#6E44FF] focus:ring-2 focus:ring-[#6E44FF]/15 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#17103D] placeholder-[#77718A] font-sans transition-all resize-none min-h-[38px] max-h-28 leading-relaxed"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputMessage.trim() || sending}
              className="p-2.5 rounded-xl bg-[#17103D] hover:bg-[#24195A] active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

