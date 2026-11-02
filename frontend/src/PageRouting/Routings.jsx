import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import LandingPage from '../pages/LandingPage'
import Layout from './Layout'
import AnalyzeResume from '@/pages/AnalyzeResume'
import MockInterview from '@/pages/MockInterview'
import HRPrep from '@/pages/HRPrep'
import CompanyIntelligence from '@/pages/CompanyIntelligence'

import LoginPage from '@/pages/Login'
import RegisterPage from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import JobRecommendations from '@/pages/JobRecommendations'
import Profile from '@/pages/Profile'
import DSAContent from '@/pages/DSAcontent'
import CodingArena from '@/pages/CodingArena'
import CodingWorkspace from '@/pages/CodingWorkspace'
import Development from '@/pages/Development'

// Group C Pages (#28 - #44)
import Academics from '@/pages/Academics'
import ProgressTracker from '@/pages/ProgressTracker'
import Milestones from '@/pages/Milestones'
import PlacementRoadmap from '@/pages/PlacementRoadmap'
import PlacementArena from '@/pages/PlacementArena'
import CareerCoach from '@/pages/CareerCoach'
import VtopDetails from '@/pages/VtopDetails'
import PrivacyProtection from '@/pages/PrivacyProtection'
import CanIApply from '@/pages/CanIApply'
import WhichRoleFitsMe from '@/pages/WhichRoleFitsMe'
import GpBadge from '@/components/gp/GpBadge'
import GpButton, { GpArrow } from '@/components/gp/GpButton'

function ProtectedAppLayout() {
  const location = useLocation()
  let hasToken = false
  try {
    hasToken = Boolean(localStorage.getItem('getplaced_token'))
  } catch (error) {
    // Private browsing or storage restrictions should send the visitor through sign-in.
  }

  if (!hasToken) {
    const returnTo = `${location.pathname}${location.search}`
    return <Navigate to={`/login?redirect=${encodeURIComponent(returnTo)}`} replace />
  }

  return <Layout />
}

function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FEF9CF] u-background-grid-yellow text-[#0D0431] font-sans selection:bg-[#FEDF6A] selection:text-[#0D0431] p-4 sm:p-8 md:p-12">
      <div className="max-w-4xl mx-auto space-y-6 pt-8 pb-16">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border-2 border-[#0D0431] text-xs font-mono font-bold text-[#0D0431] shadow-[3px_3px_0_0_#0D0431] hover:bg-[#FEDF6A] transition-all"
          >
            <GpArrow className="w-3.5 h-3.5 rotate-180" />
            <span>Return to Home</span>
          </Link>

          <GpBadge theme="light-purple">
            Platform Policies
          </GpBadge>
        </div>

        <div className="bg-white border-2 border-[#0D0431] rounded-3xl p-6 sm:p-10 md:p-12 shadow-[8px_8px_0_0_#0D0431] space-y-8">
          <div className="space-y-3 border-b-2 border-[#0D0431] pb-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-[#0D0431] tracking-tight">
              Terms of Service
            </h1>
            <p className="text-sm text-[#0D0431]/80 leading-relaxed font-medium">
              Welcome to getPlaced. By accessing or using the platform, interview simulation tools, resume analysis, and preparation resources, you agree to these terms.
            </p>
          </div>

          <div className="space-y-6 text-[#0D0431]">
            <section className="p-5 rounded-2xl bg-[#FEF9CF] border-2 border-[#0D0431] shadow-[3px_3px_0_0_#0D0431] space-y-2">
              <h2 className="text-lg font-heading font-bold text-[#0D0431] flex items-center gap-2">
                <span>1. User Account & Security</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#0D0431]/90 leading-relaxed font-sans font-medium">
                Users are responsible for maintaining credential confidentiality. Session telemetry and simulation data are protected under standard encryption protocols. You agree to notify us immediately of any unauthorized access to your account.
              </p>
            </section>

            <section className="p-5 rounded-2xl bg-[#E4CDFB] border-2 border-[#0D0431] shadow-[3px_3px_0_0_#0D0431] space-y-2">
              <h2 className="text-lg font-heading font-bold text-[#0D0431] flex items-center gap-2">
                <span>2. Platform Usage & AI Telemetry</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#0D0431]/90 leading-relaxed font-sans font-medium">
                The platform provides interview practice, speech analysis, LeetCode performance synchronization, and coding environments for placement preparation. User data is strictly isolated and never utilized for public model training.
              </p>
            </section>

            <section className="p-5 rounded-2xl bg-[#D4FDF7] border-2 border-[#0D0431] shadow-[3px_3px_0_0_#0D0431] space-y-2">
              <h2 className="text-lg font-heading font-bold text-[#0D0431] flex items-center gap-2">
                <span>3. Code Sandbox & Contest Rules</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#0D0431]/90 leading-relaxed font-sans font-medium">
                All code submissions, challenge solutions, and squad competitions must adhere to fair-play guidelines. Automated exploitation of code execution sandboxes or submission fraud is strictly prohibited.
              </p>
            </section>

            <section className="p-5 rounded-2xl bg-[#FFC5B7] border-2 border-[#0D0431] shadow-[3px_3px_0_0_#0D0431] space-y-2">
              <h2 className="text-lg font-heading font-bold text-[#0D0431] flex items-center gap-2">
                <span>4. Privacy & Third-Party Integrations</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#0D0431]/90 leading-relaxed font-sans font-medium">
                Public profile data retrieved from GitHub and LeetCode is processed in read-only mode to calculate candidate readiness scores. You can disconnect linked accounts anytime from your profile settings.
              </p>
            </section>
          </div>

          <div className="pt-6 border-t-2 border-[#0D0431] flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-mono font-bold text-[#0D0431]/70">
              Last Updated: August 2026 • getPlaced Platform
            </span>

            <GpButton
              to="/app"
              variant="stacked"
              size="md"
            >
              Enter Dashboard
            </GpButton>
          </div>
        </div>
      </div>
    </div>
  )
}

function Routings() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/resume" element={<AnalyzeResume />} />
          <Route path="/interview" element={<MockInterview />} />
          <Route path="/hr-prep" element={<HRPrep />} />
          <Route path="/company-intel" element={<CompanyIntelligence />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/coding" element={<CodingArena />} />
          <Route path="/coding/:slug" element={<CodingWorkspace />} />
          <Route path="/problems" element={<CodingArena />} />
          <Route path="/problems/:slug" element={<CodingWorkspace />} />
          <Route path="/dsa" element={<DSAContent />} />
          <Route path="/library" element={<DSAContent defaultTab="sheets" />} />
          <Route path="/sheets" element={<DSAContent defaultTab="sheets" />} />
          <Route path="/sheets/:sheetId" element={<DSAContent defaultTab="sheets" />} />
          <Route path="/development" element={<Development />} />
          <Route path="/job" element={<JobRecommendations />} />
          <Route path="/jobs" element={<JobRecommendations />} />
          <Route path="/role-fit" element={<WhichRoleFitsMe />} />
          <Route path="/which-role-fits-me" element={<WhichRoleFitsMe />} />
          <Route path="/can-i-apply" element={<CanIApply />} />
          <Route path="/onboarding" element={<CareerCoach />} />
          <Route path="/onboarding/coach" element={<CareerCoach />} />
          <Route path="/privacy" element={<div className="min-h-screen bg-[#1A312C] text-[#FFF4E1]"><PrivacyProtection /></div>} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Authenticated Dashboard App Shell */}
          <Route path="/app" element={<ProtectedAppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dsa" element={<DSAContent />} />
            <Route path="library" element={<DSAContent defaultTab="sheets" />} />
            <Route path="sheets" element={<DSAContent defaultTab="sheets" />} />
            <Route path="sheets/:sheetId" element={<DSAContent defaultTab="sheets" />} />
            <Route path="coding" element={<CodingArena />} />
            <Route path="coding/:slug" element={<CodingWorkspace />} />
            <Route path="problems" element={<CodingArena />} />
            <Route path="problems/:slug" element={<CodingWorkspace />} />
            <Route path="development" element={<Development />} />
            <Route path="resume" element={<AnalyzeResume />} />
            <Route path="interview" element={<MockInterview />} />
            <Route path="hr-prep" element={<HRPrep />} />
            <Route path="company-intel" element={<CompanyIntelligence />} />
            <Route path="job" element={<JobRecommendations />} />
            <Route path="jobs" element={<JobRecommendations />} />
            <Route path="role-fit" element={<WhichRoleFitsMe />} />
            <Route path="which-role-fits-me" element={<WhichRoleFitsMe />} />
            <Route path="can-i-apply" element={<CanIApply />} />
            <Route path="profile" element={<Profile />} />

            {/* New Group C Surfaces */}
            <Route path="academics" element={<Academics />} />
            <Route path="vtop" element={<VtopDetails />} />
            <Route path="progress" element={<ProgressTracker />} />
            <Route path="milestones" element={<Milestones />} />
            <Route path="roadmap" element={<PlacementRoadmap />} />
            <Route path="arena" element={<PlacementArena />} />
            <Route path="coach" element={<CareerCoach />} />
          </Route>
        </Routes>
      </Router>
    </div>
  )
}

export default Routings
