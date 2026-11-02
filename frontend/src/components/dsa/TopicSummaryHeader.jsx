import React from "react";
import { Link } from "react-router-dom";
import {
  Code2,
  Trophy,
  Target,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Flame,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building2,
  Briefcase,
} from "lucide-react";
import GpBadge from "@/components/gp/GpBadge";

const hasFiniteNumber = (value) =>
  value !== null && value !== undefined && Number.isFinite(Number(value));

export default function TopicSummaryHeader({ dsaData, targetCompany = "", targetJobRole = "" }) {
  const summary = dsaData?.summary || {};
  const leetcodeUser = dsaData?.leetcodeUser;
  const isConnected = dsaData?.isConnected;

  const overallLevel = summary.overallDsaLevel;
  const overallScore = summary.overallDsaScore;
  const coveragePercent = summary.coveragePercent || 0;
  const analyzedCount = summary.topicsAnalyzedCount || 0;
  const totalCount = summary.totalTopicsCount || 35;

  const strongest = summary.strongestTopics?.[0];
  const weakest = summary.largestGapTopic || summary.weakestTopics?.[0];

  return (
    <div className="rounded-3xl bg-white border-2 border-[#0D0431] p-6 md:p-8 space-y-6 shadow-[6px_6px_0_0_#0D0431]">
      {/* Top Banner Row: Overall Level & LeetCode Sync */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#0D0431] flex items-center gap-1.5 font-black bg-[#E4CDFB] px-3 py-1 rounded-full border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431]">
              <Code2 className="w-3.5 h-3.5" />
              Topic Analysis
            </span>

            {isConnected ? (
              <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-[#D3F8C6] text-[#0D0431] border-2 border-[#0D0431] font-mono font-bold shadow-[2px_2px_0_0_#0D0431]">
                <CheckCircle2 className="w-3 h-3 text-[#0D0431]" />
                LeetCode Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-[#FEF9CF] text-[#0D0431] border-2 border-[#0D0431] font-mono font-bold shadow-[2px_2px_0_0_#0D0431]">
                Standalone Mode
              </span>
            )}

            {(targetCompany || targetJobRole) && (
              <span className="text-xs px-3 py-1 rounded-full bg-[#FEDF6A] text-[#0D0431] border-2 border-[#0D0431] font-mono font-bold shadow-[2px_2px_0_0_#0D0431] flex items-center gap-1">
                <Target className="w-3 h-3 text-[#0D0431]" />
                Target: {targetCompany || "Any"}{targetJobRole ? ` · ${targetJobRole}` : ""}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl md:text-6xl font-black font-heading tracking-tight text-[#0D0431]">
                {hasFiniteNumber(overallLevel) ? Number(overallLevel).toFixed(1) : "—"}
              </span>
              <span className="text-sm md:text-base font-mono font-bold text-[#0D0431]/60">/ 10.0</span>
            </div>

            <div className="hidden sm:flex flex-col text-xs text-[#0D0431] pl-4 border-l-2 border-[#0D0431]/20 space-y-0.5 font-mono font-semibold">
              <div className="text-[#0D0431] font-black">
                {hasFiniteNumber(overallScore) ? `${overallScore}/100 Placement Score` : "Uncalculated"}
              </div>
              <div className="text-[11px] text-[#0D0431]/70">
                {analyzedCount} of {totalCount} topics evaluated ({coveragePercent}%)
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#0D0431]/80 max-w-xl leading-relaxed font-sans font-medium">
            {isConnected
              ? `Multi-topic proficiency derived from ${leetcodeUser?.totalSolved || 0} solved problems on LeetCode (@${leetcodeUser?.username}), weighted across difficulty tiers and algorithmic breadth.`
              : "Connect your public LeetCode handle in Profile to calculate dynamic topic proficiency and pinpoint company-specific skill gaps."}
          </p>
        </div>

        {/* LeetCode Sync / Connect Status Widget */}
        <div className="bg-[#FEF9CF] border-2 border-[#0D0431] p-5 rounded-2xl shadow-[4px_4px_0_0_#0D0431] shrink-0 flex flex-col justify-between space-y-3 self-start lg:self-auto min-w-[280px]">
          {isConnected && leetcodeUser ? (
            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#0D0431]/70 font-bold text-[11px]">LeetCode Solved</span>
                <a
                  href={leetcodeUser.profileUrl || `https://leetcode.com/u/${leetcodeUser.username}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0D0431] hover:text-[#896EE2] font-black inline-flex items-center gap-1 underline underline-offset-2"
                >
                  <span>@{leetcodeUser.username}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Solved Big Numbers & Difficulty Breakdown Badges */}
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-3xl font-black text-[#0D0431] font-heading">
                  {leetcodeUser.totalSolved || 0}
                </span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded-full bg-[#D3F8C6] text-[#0D0431] border-2 border-[#0D0431] font-bold shadow-[1px_1px_0_0_#0D0431]">
                    {leetcodeUser.easySolved || 0}E
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEDF6A] text-[#0D0431] border-2 border-[#0D0431] font-bold shadow-[1px_1px_0_0_#0D0431]">
                    {leetcodeUser.mediumSolved || 0}M
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FFC5B7] text-[#0D0431] border-2 border-[#0D0431] font-bold shadow-[1px_1px_0_0_#0D0431]">
                    {leetcodeUser.hardSolved || 0}H
                  </span>
                </div>
              </div>

              {leetcodeUser.ranking && (
                <div className="flex items-center justify-between text-[#0D0431] text-[11px] pt-2 border-t-2 border-[#0D0431]/15 font-bold">
                  <span className="text-[#0D0431]/70">Global Rank:</span>
                  <span className="text-[#0D0431] font-black">#{leetcodeUser.ranking.toLocaleString()}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-[#0D0431] text-xs font-heading font-black">
                <Code2 className="w-4 h-4 text-[#0D0431]" />
                <span>Connect LeetCode</span>
              </div>
              <p className="text-[11px] text-[#0D0431]/75 leading-snug font-medium font-sans">
                Import verified problem statistics for automated topic gap detection.
              </p>
              <Link
                to="/app/profile"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-[#896EE2] hover:bg-[#7859D9] text-white border-2 border-[#0D0431] shadow-[2px_2px_0_0_#0D0431] hover:scale-105 active:scale-95 text-xs font-mono font-bold transition-all"
              >
                <span>Connect Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Highlights Grid: Strongest, Weakest / Largest Gap, Coverage */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t-2 border-[#0D0431]/15">
        {/* Strongest Topic Card */}
        <div className="bg-[#D4FDF7] border-2 border-[#0D0431] rounded-2xl p-4 space-y-2 shadow-[4px_4px_0_0_#0D0431]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#0D0431] flex items-center gap-1 font-black">
              <Trophy className="w-3.5 h-3.5" />
              Strongest Topic
            </span>
            {strongest && (
              <span className="text-[10px] font-mono text-[#0D0431] font-black px-2 py-0.5 rounded-full bg-white border border-[#0D0431]">
                {hasFiniteNumber(strongest.currentLevel) ? `${Number(strongest.currentLevel).toFixed(1)}/10` : ""}
              </span>
            )}
          </div>

          {strongest ? (
            <div>
              <div className="text-sm font-heading font-black text-[#0D0431]">{strongest.name}</div>
              <div className="text-[11px] text-[#0D0431]/75 font-mono font-semibold mt-0.5">
                {strongest.problemsSolved} solved · {strongest.category}
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#0D0431]/60 italic font-medium">No topic data available yet</div>
          )}
        </div>

        {/* Weakest / Largest Gap Card */}
        <div className="bg-[#FFC5B7] border-2 border-[#0D0431] rounded-2xl p-4 space-y-2 shadow-[4px_4px_0_0_#0D0431]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#0D0431] flex items-center gap-1 font-black">
              <AlertCircle className="w-3.5 h-3.5" />
              Priority Focus Area
            </span>
            {hasFiniteNumber(weakest?.gap) && (
              <span className="text-[10px] font-mono font-black text-[#0D0431] px-2 py-0.5 rounded-full bg-white border border-[#0D0431]">
                {Number(weakest.gap) < 0 ? `${Number(weakest.gap).toFixed(1)} Gap` : "Target Met"}
              </span>
            )}
          </div>

          {weakest ? (
            <div>
              <div className="text-sm font-heading font-black text-[#0D0431]">{weakest.name}</div>
              <div className="text-[11px] text-[#0D0431]/75 font-mono font-semibold mt-0.5">
                Level: {hasFiniteNumber(weakest.currentLevel) ? Number(weakest.currentLevel).toFixed(1) : "—"} · Req:{" "}
                {hasFiniteNumber(weakest.requiredLevel) ? Number(weakest.requiredLevel).toFixed(1) : "—"}
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#0D0431]/60 italic font-medium">No target benchmark configured</div>
          )}
        </div>

        {/* Taxonomy Breadth Coverage Card */}
        <div className="bg-[#CDE1FF] border-2 border-[#0D0431] rounded-2xl p-4 space-y-2 shadow-[4px_4px_0_0_#0D0431]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#0D0431] flex items-center gap-1 font-black">
              <ShieldCheck className="w-3.5 h-3.5" />
              Taxonomy Breadth
            </span>
            <span className="text-[10px] font-mono text-[#0D0431] font-black px-2 py-0.5 rounded-full bg-white border border-[#0D0431]">
              {coveragePercent}%
            </span>
          </div>

          <div>
            <div className="text-sm font-heading font-black text-[#0D0431]">
              {analyzedCount} of {totalCount} Topics
            </div>
            <div className="w-full bg-white border-2 border-[#0D0431] rounded-full h-3 mt-2 overflow-hidden p-[1px]">
              <div
                className="bg-[#896EE2] h-full rounded-full transition-all duration-500"
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
