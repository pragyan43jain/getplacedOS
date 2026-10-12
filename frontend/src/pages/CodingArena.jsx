import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import gsap from "gsap";
import {
  Search,
  Code2,
  CheckCircle2,
  Circle,
  Shuffle,
  Sparkles,
  Flame,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Zap,
  Trophy,
  BrainCircuit,
  ExternalLink,
  Layers,
  Terminal,
  ArrowRight,
  Activity,
  Play,
  Check,
  RotateCcw,
  Compass,
} from "lucide-react";
import { leetcodeService } from "@/services/leetcodeService";
import LeetCodeConnectCard from "@/components/leetcode/LeetCodeConnectCard";
import LeetCodeSubmissionAnalysis from "@/components/leetcode/LeetCodeSubmissionAnalysis";
import GpCard from "@/components/gp/GpCard";
import GpBadge from "@/components/gp/GpBadge";
import GpButton from "@/components/gp/GpButton";
import GpToggle from "@/components/gp/GpToggle";

const CURATED_LISTS = [
  { id: "all", label: "All Problems", icon: Layers },
  { id: "blind75", label: "Blind 75", icon: Flame, tag: "Array" },
  { id: "top150", label: "Top Interview 150", icon: Trophy, tag: "Hash Table" },
  { id: "dp", label: "Dynamic Programming", icon: BrainCircuit, tag: "Dynamic Programming" },
  { id: "trees", label: "Trees & Graphs", icon: Zap, tag: "Tree" },
];

export default function CodingArena() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab") || "overview";
  const initialTab = rawTab === "sheets" ? "overview" : rawTab;

  const containerRef = useRef(null);

  // Pillar Workspace Tab: 'overview' | 'practice' | 'submissions'
  const [workspaceTab, setWorkspaceTab] = useState(initialTab);

  // State for Problems Catalog
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, easy: 0, medium: 0, hard: 0 });
  const [tags, setTags] = useState([]);
  const [solvedMap, setSolvedMap] = useState({});
  const [leetcodeProfile, setLeetcodeProfile] = useState(null);

  // Filters & Pagination for Practice Tab
  const [activeCuratedTrack, setActiveCuratedTrack] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState("question_id");
  const [sortOrder, setSortOrder] = useState("asc");

  // Sync tab with URL query parameter
  const handleTabChange = (newTab) => {
    setWorkspaceTab(newTab);
    setSearchParams({ tab: newTab }, { replace: true });
  };

  // Load initial stats, tags, solved cache, and profile
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [statsData, tagsData, profileData] = await Promise.all([
          leetcodeService.getStats().catch(() => ({ total: 0, easy: 0, medium: 0, hard: 0 })),
          leetcodeService.getTags().catch(() => []),
          leetcodeService.getProfile().catch(() => null),
        ]);
        if (statsData) setStats(statsData);
        if (tagsData) setTags(tagsData.slice(0, 25)); // Top 25 tags
        if (profileData?.connected && profileData?.profile) {
          setLeetcodeProfile(profileData.profile);
        }
      } catch (err) {
        console.error("Failed to load leetcode metadata:", err);
      }

      await leetcodeService.fetchWorkspaceState();
      setSolvedMap(leetcodeService.getSolvedProblems());
    }
    loadMetadata();
  }, []);

  // GSAP Tab Reveal
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".gsap-reveal"),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power2.out" }
      );
    }
  }, [workspaceTab]);

  // Fetch problems on filter/page change
  useEffect(() => {
    let isCancelled = false;
    async function fetchProblemsList() {
      setLoading(true);
      setError(null);
      try {
        const data = await leetcodeService.getProblems({
          page,
          pageSize,
          search: searchQuery,
          difficulty: selectedDifficulty,
          tag:
            selectedTag !== "all"
              ? selectedTag
              : activeCuratedTrack !== "all"
              ? CURATED_LISTS.find((c) => c.id === activeCuratedTrack)?.tag
              : "",
          sortBy,
          sortOrder,
        });

        if (!isCancelled) {
          setProblems(data.problems || []);
          setTotalCount(data.total || 0);
          setTotalPages(data.total_pages || 1);
        }
      } catch (err) {
        if (!isCancelled) {
          setError("Failed to load problems. Please ensure backend services are running.");
          console.error(err);
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchProblemsList();
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [page, pageSize, searchQuery, selectedDifficulty, selectedTag, activeCuratedTrack, sortBy, sortOrder]);

  // Solved Stats calculation - combine / prioritize verified LeetCode breakdown with local solvedMap
  const localSolvedList = useMemo(() => Object.values(solvedMap), [solvedMap]);
  const localSolvedEasy = useMemo(
    () => localSolvedList.filter((p) => p.difficulty?.toLowerCase() === "easy").length,
    [localSolvedList]
  );
  const localSolvedMed = useMemo(
    () => localSolvedList.filter((p) => p.difficulty?.toLowerCase() === "medium").length,
    [localSolvedList]
  );
  const localSolvedHard = useMemo(
    () => localSolvedList.filter((p) => p.difficulty?.toLowerCase() === "hard").length,
    [localSolvedList]
  );

  const totalSolvedCount = useMemo(() => {
    if (leetcodeProfile?.totalSolved !== undefined && leetcodeProfile?.totalSolved !== null) {
      return Math.max(leetcodeProfile.totalSolved, Object.keys(solvedMap).length);
    }
    return Object.keys(solvedMap).length;
  }, [leetcodeProfile, solvedMap]);

  const solvedEasy = useMemo(() => {
    if (leetcodeProfile?.easySolved !== undefined && leetcodeProfile?.easySolved !== null) {
      return Math.max(leetcodeProfile.easySolved, localSolvedEasy);
    }
    return localSolvedEasy;
  }, [leetcodeProfile, localSolvedEasy]);

  const solvedMed = useMemo(() => {
    if (leetcodeProfile?.mediumSolved !== undefined && leetcodeProfile?.mediumSolved !== null) {
      return Math.max(leetcodeProfile.mediumSolved, localSolvedMed);
    }
    return localSolvedMed;
  }, [leetcodeProfile, localSolvedMed]);

  const solvedHard = useMemo(() => {
    if (leetcodeProfile?.hardSolved !== undefined && leetcodeProfile?.hardSolved !== null) {
      return Math.max(leetcodeProfile.hardSolved, localSolvedHard);
    }
    return localSolvedHard;
  }, [leetcodeProfile, localSolvedHard]);

  // Handle Pick Random
  const handlePickRandom = async () => {
    try {
      const res = await leetcodeService.getRandomProblem({
        difficulty: selectedDifficulty !== "all" ? selectedDifficulty : "",
        tag: selectedTag !== "all" ? selectedTag : "",
      });
      if (res && res.task_id) {
        navigate(`/app/coding/${res.task_id}`);
      }
    } catch (err) {
      console.error("Pick random error:", err);
      navigate("/app/coding/two-sum");
    }
  };

  const getDifficultyBadgeTheme = (diff) => {
    switch (diff?.toLowerCase()) {
      case "easy":
        return "mint";
      case "medium":
        return "yellow";
      case "hard":
        return "coral";
      default:
        return "light-purple";
    }
  };

  return (
    <main
      ref={containerRef}
      className="w-full min-w-0 font-sans selection:bg-[#FEDF6A] selection:text-[#0D0431] py-2 sm:py-4 overflow-x-hidden"
    >
      <div className="w-full max-w-6xl mx-auto space-y-8 min-w-0">
        
        {/* Workspace Top Header */}
        <header className="gsap-reveal flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b-2 border-[#0D0431] pb-6">
          <div className="space-y-2 max-w-2xl">
            <GpBadge theme="light-purple">
              Coding Practice & DSA Catalog
            </GpBadge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-[#0D0431] tracking-tight">
              Coding Arena
            </h1>
            <p className="text-xs sm:text-sm text-[#0D0431]/80 font-sans leading-relaxed">
              Solve interview coding challenges with real-time test evaluations, topic gap tracking, and structured placement curricula.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <GpButton
              onClick={handlePickRandom}
              variant="stacked-yellow"
              size="sm"
              icon={false}
            >
              <span className="flex items-center gap-1.5 font-bold text-[#0D0431]">
                <Shuffle className="w-4 h-4" /> Pick Random
              </span>
            </GpButton>
            <GpButton
              to="/app/coding/two-sum"
              variant="secondary"
              size="sm"
              icon={false}
            >
              <span className="flex items-center gap-1.5 font-bold">
                <Zap className="w-4 h-4 text-[#FEDF6A]" /> Daily Problem
              </span>
            </GpButton>
          </div>
        </header>

        {/* 3 Workspace Pillar Tabs */}
        <nav className="gsap-reveal flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: "overview", label: "Overview", icon: Layers },
            { id: "practice", label: "Problem Catalog", icon: Terminal },
            { id: "submissions", label: "LeetCode Analysis", icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = workspaceTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold font-sans transition-all border-2 border-[#0D0431] shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#0D0431] text-white shadow-[3px_3px_0_0_#FEDF6A]"
                    : "bg-white text-[#0D0431] hover:bg-[#FEDF6A] shadow-[2px_2px_0_0_#0D0431]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* TAB 1: OVERVIEW */}
        {workspaceTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Hero Banner Card */}
            <GpCard
              theme="white"
              shadow="lg"
              className="gsap-reveal p-6 sm:p-8 space-y-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#E4CDFB] text-[#0D0431] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431]">
                      <Sparkles className="w-3.5 h-3.5 text-[#0D0431]" />
                      DSA Readiness Score
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#FEF9CF] text-[#0D0431] border-2 border-[#0D0431] font-mono font-bold">
                      25% Weight
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl sm:text-6xl font-heading font-black text-[#0D0431] tracking-tight">
                      {totalSolvedCount > 0
                        ? Math.min(100, Math.round((totalSolvedCount / 150) * 100))
                        : 0}
                    </span>
                    <span className="text-xl font-heading font-bold text-[#0D0431]/50">/ 100</span>

                    <div className="hidden sm:flex flex-col text-xs text-[#0D0431]/80 pl-4 border-l-2 border-[#0D0431] space-y-1 font-mono">
                      <div>
                        Target Benchmark: <span className="font-bold text-[#0D0431]">85 / 100</span>
                      </div>
                      <div>
                        Status: <span className="font-bold text-[#346538] bg-[#D4FDF7] px-2 py-0.5 rounded border border-[#0D0431]">
                          {totalSolvedCount >= 120 ? "Competitive" : "In Progress"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#0D0431]/80 max-w-xl leading-relaxed font-sans font-medium">
                    Evaluated across Arrays, Trees, Dynamic Programming, and Graph algorithms with automated testcase evaluation.
                  </p>
                </div>

                {/* Score vs Target Box */}
                <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-1 gap-3 bg-[#FEF9CF] border-2 border-[#0D0431] p-4 rounded-2xl shadow-[3px_3px_0_0_#0D0431] shrink-0 text-xs font-mono">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1 lg:gap-6">
                    <span className="text-[#0D0431]/70 font-bold uppercase text-[10px]">Total Solved</span>
                    <span className="font-heading font-bold text-[#0D0431] text-sm">
                      {totalSolvedCount} / {stats.total || "2,800+"}
                    </span>
                  </div>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1 lg:gap-6 border-l-2 lg:border-l-0 lg:border-t-2 border-[#0D0431]/20 pl-3 lg:pl-0 lg:pt-2">
                    <span className="text-[#0D0431]/70 font-bold uppercase text-[10px]">Target</span>
                    <span className="font-heading font-bold text-[#0D0431] text-sm">150 Problems</span>
                  </div>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1 lg:gap-6 border-l-2 lg:border-l-0 lg:border-t-2 border-[#0D0431]/20 pl-3 lg:pl-0 lg:pt-2">
                    <span className="text-[#0D0431]/70 font-bold uppercase text-[10px]">Acceptance</span>
                    <span className="font-heading font-bold text-[#346538] text-sm">
                      {leetcodeProfile?.acceptanceRate ? `${leetcodeProfile.acceptanceRate}%` : totalSolvedCount > 0 ? "100%" : "Unassessed"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 pt-4 border-t-2 border-[#0D0431]">
                <div className="flex justify-between text-xs font-mono font-bold text-[#0D0431]/80">
                  <span>Solved: {totalSolvedCount} problems</span>
                  <span>Target Benchmark: 150 problems</span>
                </div>
                <div className="relative w-full bg-white rounded-full h-3.5 overflow-hidden border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431]">
                  <div
                    className="h-full rounded-full bg-[#FEDF6A] border-r-2 border-[#0D0431] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(8, (totalSolvedCount / 150) * 100))}%` }}
                  />
                </div>
              </div>
            </GpCard>

            {/* 4 Bento Stat Cards with Pastel Accents */}
            <section className="gsap-reveal grid grid-cols-2 md:grid-cols-4 gap-4">
              <GpCard
                theme="white"
                className="p-4 sm:p-5 flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-[#FEDF6A] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] flex items-center justify-center text-[#0D0431] shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0D0431]/60">Total Solved</div>
                  <div className="text-xl font-heading font-black text-[#0D0431] flex items-baseline gap-1 mt-0.5">
                    <span>{totalSolvedCount}</span>
                    <span className="text-xs font-normal text-[#0D0431]/50">/ {stats.total}</span>
                  </div>
                </div>
              </GpCard>

              <GpCard
                theme="light-green"
                className="p-4 sm:p-5 flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-white border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] flex items-center justify-center text-[#346538] font-heading font-black text-sm shrink-0">
                  E
                </div>
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0D0431]/60">Easy Solved</div>
                  <div className="text-xl font-heading font-black text-[#0D0431] flex items-baseline gap-1 mt-0.5">
                    <span>{solvedEasy}</span>
                    <span className="text-xs font-normal text-[#0D0431]/50">/ {stats.easy}</span>
                  </div>
                </div>
              </GpCard>

              <GpCard
                theme="light-yellow"
                className="p-4 sm:p-5 flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-white border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] flex items-center justify-center text-[#956400] font-heading font-black text-sm shrink-0">
                  M
                </div>
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0D0431]/60">Medium Solved</div>
                  <div className="text-xl font-heading font-black text-[#0D0431] flex items-baseline gap-1 mt-0.5">
                    <span>{solvedMed}</span>
                    <span className="text-xs font-normal text-[#0D0431]/50">/ {stats.medium}</span>
                  </div>
                </div>
              </GpCard>

              <GpCard
                theme="white"
                className="p-4 sm:p-5 flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-[#FFC5B7] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] flex items-center justify-center text-[#0D0431] font-heading font-black text-sm shrink-0">
                  H
                </div>
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0D0431]/60">Hard Solved</div>
                  <div className="text-xl font-heading font-black text-[#0D0431] flex items-baseline gap-1 mt-0.5">
                    <span>{solvedHard}</span>
                    <span className="text-xs font-normal text-[#0D0431]/50">/ {stats.hard}</span>
                  </div>
                </div>
              </GpCard>
            </section>

            {/* Quick Action Matrix Grid */}
            <section className="gsap-reveal grid grid-cols-1 md:grid-cols-2 gap-4">
              <GpCard
                theme="white"
                hoverEffect={true}
                onClick={() => handleTabChange("practice")}
                className="p-5 sm:p-6 space-y-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#E4CDFB] border-2 border-[#0D0431] flex items-center justify-center text-[#0D0431]">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <h4 className="font-heading font-bold text-sm text-[#0D0431]">
                      Problem Catalog
                    </h4>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#0D0431]" />
                </div>
                <p className="text-xs text-[#0D0431]/75 leading-relaxed font-sans">
                  Browse catalog with difficulty filters, curated tracks, and interactive editor.
                </p>
              </GpCard>

              <GpCard
                theme="white"
                hoverEffect={true}
                onClick={() => handleTabChange("submissions")}
                className="p-5 sm:p-6 space-y-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FEDF6A] border-2 border-[#0D0431] flex items-center justify-center text-[#0D0431]">
                      <Activity className="w-4 h-4" />
                    </div>
                    <h4 className="font-heading font-bold text-sm text-[#0D0431]">
                      LeetCode Analysis
                    </h4>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#0D0431]" />
                </div>
                <p className="text-xs text-[#0D0431]/75 leading-relaxed font-sans">
                  Deep-dive into acceptance accuracy, topic mastery, and active practice streaks.
                </p>
              </GpCard>
            </section>
          </div>
        )}

        {/* TAB 2: PROBLEM CATALOG (PRACTICE) */}
        {workspaceTab === "practice" && (
          <div className="space-y-6">
            {/* Curated Track Tabs */}
            <div className="gsap-reveal flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CURATED_LISTS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeCuratedTrack === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveCuratedTrack(tab.id);
                      setPage(1);
                      if (tab.id !== "all") setSelectedTag("all");
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold font-sans transition-all border-2 border-[#0D0431] shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-[#0D0431] text-white shadow-[3px_3px_0_0_#FEDF6A]"
                        : "bg-white text-[#0D0431] hover:bg-[#FEF9CF] shadow-[2px_2px_0_0_#0D0431]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Filter and Search Bar Card */}
            <GpCard
              theme="white"
              shadow="lg"
              className="gsap-reveal p-5 space-y-4"
            >
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0D0431]/50" />
                  <input
                    type="text"
                    placeholder="Search problem title, tags, or ID..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#0D0431] rounded-xl text-xs font-sans font-medium text-[#0D0431] placeholder-[#0D0431]/40 shadow-[3px_3px_0_0_#0D0431] focus:outline-none focus:bg-[#FEF9CF] transition-all"
                  />
                </div>

                {/* Difficulty Buttons */}
                <div className="flex items-center gap-1.5 p-1 bg-[#FEF9CF] border-2 border-[#0D0431] rounded-xl shadow-[2px_2px_0_0_#0D0431]">
                  {["all", "Easy", "Medium", "Hard"].map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setSelectedDifficulty(d.toLowerCase());
                        setPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer ${
                        selectedDifficulty === d.toLowerCase()
                          ? "bg-[#0D0431] text-white shadow-sm"
                          : "text-[#0D0431]/70 hover:text-[#0D0431] hover:bg-white"
                      }`}
                    >
                      {d === "all" ? "All Levels" : d}
                    </button>
                  ))}
                </div>

                {/* Sort Selector */}
                <div className="flex items-center gap-2">
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [sb, so] = e.target.value.split("-");
                      setSortBy(sb);
                      setSortOrder(so);
                    }}
                    className="px-3.5 py-2.5 bg-white border-2 border-[#0D0431] rounded-xl text-xs font-bold font-sans text-[#0D0431] shadow-[3px_3px_0_0_#0D0431] focus:outline-none focus:bg-[#FEF9CF] cursor-pointer"
                  >
                    <option value="question_id-asc">Sort: ID (Ascending)</option>
                    <option value="question_id-desc">Sort: ID (Descending)</option>
                    <option value="difficulty-asc">Sort: Difficulty (Easy → Hard)</option>
                    <option value="difficulty-desc">Sort: Difficulty (Hard → Easy)</option>
                    <option value="title-asc">Sort: Title (A → Z)</option>
                  </select>
                </div>
              </div>

              {/* Topic Tag Chips */}
              {tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-3 border-t-2 border-[#0D0431]/15">
                  <span className="text-xs font-mono font-bold text-[#0D0431]/70 flex items-center gap-1 mr-1">
                    <Filter className="w-3.5 h-3.5" /> Topics:
                  </span>
                  <button
                    onClick={() => {
                      setSelectedTag("all");
                      setPage(1);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold font-sans border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] transition-all cursor-pointer ${
                      selectedTag === "all"
                        ? "bg-[#0D0431] text-white"
                        : "bg-white text-[#0D0431] hover:bg-[#FEDF6A]"
                    }`}
                  >
                    All Topics
                  </button>
                  {tags.map(({ tag, count }) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTag(selectedTag === tag ? "all" : tag);
                        setPage(1);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold font-sans border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedTag === tag
                          ? "bg-[#0D0431] text-white"
                          : "bg-white text-[#0D0431] hover:bg-[#FEDF6A]"
                      }`}
                    >
                      <span>{tag}</span>
                      <span className="text-[10px] font-mono opacity-75">({count})</span>
                    </button>
                  ))}
                </div>
              )}
            </GpCard>

            {/* Problems List Table Bento Card */}
            <GpCard
              theme="white"
              shadow="lg"
              className="gsap-reveal overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 bg-[#FEF9CF] border-b-2 border-[#0D0431] flex items-center justify-between">
                <div className="text-xs sm:text-sm font-heading font-black text-[#0D0431] flex items-center gap-2">
                  <span>Problem Catalog</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-xs font-mono font-bold text-[#0D0431] border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431]">
                    Showing {problems.length} of {totalCount}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-[#0D0431]">
                  <span className="text-[11px] font-mono">Per page:</span>
                  {[20, 50, 100].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => {
                        setPageSize(sz);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border-2 border-[#0D0431] transition-all cursor-pointer ${
                        pageSize === sz
                          ? "bg-[#0D0431] text-white shadow-[2px_2px_0_0_#FEDF6A]"
                          : "bg-white text-[#0D0431] hover:bg-[#FEDF6A] shadow-[2px_2px_0_0_#0D0431]"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="p-16 text-center space-y-3">
                  <div className="w-8 h-8 border-4 border-[#0D0431] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-mono font-bold text-[#0D0431]">Loading problem catalog...</p>
                </div>
              ) : error ? (
                <div className="p-12 text-center space-y-3">
                  <p className="text-[#F85B52] text-xs font-mono font-bold">{error}</p>
                  <GpButton
                    onClick={() => setPage(page)}
                    variant="secondary"
                    size="sm"
                    icon={false}
                  >
                    Retry
                  </GpButton>
                </div>
              ) : problems.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <Code2 className="w-10 h-10 text-[#0D0431]/40 mx-auto" />
                  <h3 className="text-sm font-heading font-black text-[#0D0431]">No matching problems found</h3>
                  <p className="text-xs text-[#0D0431]/70 font-sans">Adjust your search query, difficulty, or tag filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#0D0431] text-[11px] font-mono font-bold text-[#0D0431] uppercase tracking-wider bg-[#FEF9CF]/50">
                        <th className="py-3.5 px-4 w-14 text-center">Status</th>
                        <th className="py-3.5 px-4 w-16">#</th>
                        <th className="py-3.5 px-4">Title</th>
                        <th className="py-3.5 px-4 w-28">Difficulty</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">Topics</th>
                        <th className="py-3.5 px-4 w-28 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-[#0D0431]/10 text-xs">
                      {problems.map((prob) => {
                        const isSolved = !!solvedMap[prob.task_id];
                        return (
                          <tr
                            key={prob.id}
                            className="hover:bg-[#FEF9CF]/60 transition-colors group cursor-pointer"
                            onClick={() => navigate(`/app/coding/${prob.task_id}`)}
                          >
                            <td className="py-4 px-4 text-center">
                              {isSolved ? (
                                <div className="inline-flex items-center justify-center text-[#346538] bg-[#D4FDF7] border-2 border-[#0D0431] rounded-full p-0.5 shadow-[1px_1px_0_0_#0D0431]" title="Solved">
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="inline-flex items-center justify-center text-[#0D0431]/30">
                                  <Circle className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </td>

                            <td className="py-4 px-4 font-mono font-bold text-xs text-[#0D0431]/70">
                              {prob.question_id}
                            </td>

                            <td className="py-4 px-4">
                              <div className="space-y-0.5">
                                <Link
                                  to={`/app/coding/${prob.task_id}`}
                                  className="font-bold text-[#0D0431] group-hover:underline transition-colors flex items-center gap-2 text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>{prob.title}</span>
                                </Link>
                                {prob.preview && (
                                  <p className="text-xs text-[#0D0431]/70 line-clamp-1 max-w-xl font-sans">
                                    {prob.preview}
                                  </p>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <GpBadge
                                theme={getDifficultyBadgeTheme(prob.difficulty)}
                                size="sm"
                              >
                                {prob.difficulty}
                              </GpBadge>
                            </td>

                            <td className="py-4 px-4 hidden md:table-cell">
                              <div className="flex flex-wrap gap-1.5 max-w-md">
                                {prob.tags?.slice(0, 3).map((t) => (
                                  <span
                                    key={t}
                                    className="px-2 py-0.5 bg-[#FEF9CF] text-[#0D0431] rounded-md text-[10px] font-mono font-bold border border-[#0D0431]"
                                  >
                                    {t}
                                  </span>
                                ))}
                                {prob.tags?.length > 3 && (
                                  <span className="px-1.5 py-0.5 text-[#0D0431]/60 text-[10px] font-mono font-bold">
                                    +{prob.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-4 text-right">
                              <Link
                                to={`/app/coding/${prob.task_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold font-sans border-2 border-[#0D0431] transition-all shadow-[2px_2px_0_0_#0D0431] hover:-translate-y-0.5 ${
                                  isSolved
                                    ? "bg-[#D4FDF7] text-[#0D0431]"
                                    : "bg-[#FEDF6A] text-[#0D0431]"
                                }`}
                              >
                                <span>{isSolved ? "Review" : "Solve"}</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Footer */}
              <div className="p-4 border-t-2 border-[#0D0431] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono font-bold text-[#0D0431]">
                <div>
                  Page <span className="underline">{page}</span> of{" "}
                  <span className="underline">{totalPages}</span> ({totalCount} total problems)
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] hover:bg-[#FEF9CF] disabled:opacity-40 disabled:cursor-not-allowed text-[#0D0431] transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum =
                        page <= 3
                          ? i + 1
                          : page >= totalPages - 2
                          ? totalPages - 4 + i
                          : page - 2 + i;
                      if (pageNum < 1 || pageNum > totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-8 h-8 rounded-lg font-mono text-xs font-bold border-2 border-[#0D0431] transition-all cursor-pointer ${
                            page === pageNum
                              ? "bg-[#0D0431] text-white shadow-[2px_2px_0_0_#FEDF6A]"
                              : "bg-white text-[#0D0431] hover:bg-[#FEF9CF] shadow-[2px_2px_0_0_#0D0431]"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] hover:bg-[#FEF9CF] disabled:opacity-40 disabled:cursor-not-allowed text-[#0D0431] transition-all cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </GpCard>
          </div>
        )}

        {/* TAB 3: SUBMISSIONS & LEETCODE ANALYTICS */}
        {workspaceTab === "submissions" && (
          <section className="gsap-reveal space-y-6">
            <LeetCodeConnectCard
              onProfileUpdate={(p) => {
                setLeetcodeProfile(p);
              }}
            />
          </section>
        )}

      </div>
    </main>
  );
}
