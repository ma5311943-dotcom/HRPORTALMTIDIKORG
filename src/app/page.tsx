"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardTopBar from "@/components/DashboardTopBar";
import LandingPage from "@/components/LandingPage";
import DashboardView from "@/components/DashboardView";
import CandidateRegistrationView from "@/components/CandidateRegistrationView";
import SeatAllocationView from "@/components/SeatAllocationView";
import InternalChatView from "@/components/InternalChatView";
import ReportsView from "@/components/ReportsView";
import CandidatePortalView from "@/components/CandidatePortalView";

import AppointmentLetterModal from "@/components/AppointmentLetterModal";
import { Candidate, District, Allocation, ChatMessage, SystemAnalytics } from "@/types";
import { UserSession, clearSession } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2, ArrowRight, Landmark, RefreshCw, AlertTriangle } from "lucide-react";

interface PublicOverview {
  districts: District[];
  stats: {
    totalCandidates: number;
    totalVerified: number;
    totalAllocated: number;
    totalDistricts: number;
    totalQuota: number;
    quotaAlignment: number;
  };
}

const EMPTY_OVERVIEW: PublicOverview = {
  districts: [],
  stats: {
    totalCandidates: 0,
    totalVerified: 0,
    totalAllocated: 0,
    totalDistricts: 0,
    totalQuota: 0,
    quotaAlignment: 0,
  },
};


export default function Home() {
  const router = useRouter();

  // Navigation & View Mode
  // If not logged in, viewMode is "landing". If logged in, can view "dashboard" or "landing"
  const [viewMode, setViewMode] = useState<"landing" | "dashboard">("landing");
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All");

  // User Authentication Session
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [publicOverview, setPublicOverview] = useState<PublicOverview>(EMPTY_OVERVIEW);

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Core Data
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modals State
  const [letterAllocation, setLetterAllocation] = useState<Allocation | null>(null);
  const [preSelectedAllocCandidate, setPreSelectedAllocCandidate] = useState<Candidate | null>(null);

  // Load the server-side session and public overview once.
  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const [sessionRes, overviewRes] = await Promise.all([
          fetch("/api/auth/session", { cache: "no-store" }),
          fetch("/api/public/overview", { cache: "no-store" }),
        ]);
        const sessionData = await sessionRes.json();
        const overviewData = await overviewRes.json();
        if (!active) return;

        if (overviewData.success) {
          setPublicOverview(overviewData.data as PublicOverview);
        }

        if (sessionData.success && sessionData.data) {
          const session = sessionData.data as UserSession;
          setUserSession(session);
          setViewMode("dashboard");
          if (session.district && session.district !== "All") {
            setSelectedDistrict(session.district);
          }
          await fetchAllData(false, session);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Unable to restore session", error);
        if (active) setIsLoading(false);
      } finally {
        if (active) setIsAuthChecking(false);
      }
    };

    void bootstrap();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial Data Fetching
  async function fetchAllData(
    silent: boolean = false,
    sessionOverride?: UserSession | null
  ) {
    const activeSession = sessionOverride === undefined ? userSession : sessionOverride;
    if (!activeSession) return;

    try {
      if (!silent) setIsLoading(true);
      setLoadError(null);

      const canReadMessages = activeSession.permissions.canSendMessage;
      const [candRes, distRes, allocRes, msgRes, analyticsRes] = await Promise.all([
        fetch("/api/candidates", { cache: "no-store" }),
        fetch("/api/districts", { cache: "no-store" }),
        fetch("/api/allocations", { cache: "no-store" }),
        canReadMessages
          ? fetch("/api/messages", { cache: "no-store" })
          : Promise.resolve(null),
        fetch(`/api/analytics?district=${selectedDistrict}`, { cache: "no-store" }),
      ]);

      if (
        !candRes.ok ||
        !distRes.ok ||
        !allocRes.ok ||
        !analyticsRes.ok ||
        (msgRes && !msgRes.ok)
      ) {
        throw new Error("One or more constituency services returned an error.");
      }

      const [candData, distData, allocData, msgData, analyticsData] = await Promise.all([
        candRes.json(),
        distRes.json(),
        allocRes.json(),
        msgRes ? msgRes.json() : Promise.resolve({ success: true, data: [] }),
        analyticsRes.json(),
      ]);

      if (
        !candData.success ||
        !distData.success ||
        !allocData.success ||
        !msgData.success ||
        !analyticsData.success
      ) {
        throw new Error(
          candData.error ||
            distData.error ||
            allocData.error ||
            msgData.error ||
            analyticsData.error ||
            "The constituency ledger could not be loaded."
        );
      }

      setCandidates(candData.data);
      setDistricts(distData.data);
      setAllocations(allocData.data);
      setMessages(msgData.data);
      setAnalytics(analyticsData.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to reach the server.";
      console.error("Failed to load initial data", err);
      setLoadError(message);
      if (!silent) {
        toast.error("Failed to sync constituency records.", {
          description: message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Re-fetch analytics when selectedDistrict changes
  useEffect(() => {
    if (!userSession) return;
    const fetchScopedAnalytics = async () => {
      try {
        const res = await fetch(`/api/analytics?district=${selectedDistrict}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (data.success) {
          setAnalytics(data.data);
          setLoadError(null);
        }
      } catch (e) {
        console.error(e);
      }
    };
    void fetchScopedAnalytics();
  }, [selectedDistrict, userSession]);

  // Mark memorandums as read when the communications module is opened.
  useEffect(() => {
    if (!userSession || activeTab !== "chat") return;
    const unreadIds = messages.filter((m) => m.unread).map((m) => m.id);
    if (unreadIds.length === 0) return;

    let cancelled = false;
    fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unreadIds }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unable to mark messages as read.");
        if (!cancelled) {
          setMessages((prev) => prev.map((m) => (m.unread ? { ...m, unread: false } : m)));
        }
      })
      .catch((error) => console.error("Unable to mark messages as read", error));

    return () => {
      cancelled = true;
    };
  }, [activeTab, messages, userSession]);

  const canAccessTab = (tab: string) => {
    if (!userSession || userSession.isCandidate) return tab === "dashboard";
    return (
      tab === "dashboard" ||
      (tab === "candidates" &&
        (userSession.permissions.canRegisterCandidates ||
          userSession.permissions.canAllocateSeats ||
          userSession.permissions.canGenerateReports)) ||
      (tab === "allocation" &&
        (userSession.permissions.canAllocateSeats ||
          userSession.permissions.canRevokeAllocations)) ||
      (tab === "chat" && userSession.permissions.canSendMessage) ||
      (tab === "reports" && userSession.permissions.canGenerateReports)
    );
  };

  const navigateToTab = (tab: string) => {
    setActiveTab(canAccessTab(tab) ? tab : "dashboard");
  };

  const handleSwitchRole = () => {
    if (userSession?.isCandidate) {
      router.push("/login?mode=candidate");
      return;
    }
    router.push(`/login?role=${userSession?.username ?? "admin"}`);
  };

  // Auth Handlers
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Unable to clear server session", error);
    }
    clearSession();
    setUserSession(null);
    setViewMode("landing");
    setActiveTab("dashboard");
    setLetterAllocation(null);
    toast.info("Logged out from Internal HR System");
  };

  const handleOpenLoginRoute = (roleKey: string = "admin") => {
    router.push(`/login?role=${roleKey}`);
  };

  // Content Handlers
  const handleCandidateCreated = (newCand: Candidate) => {
    setCandidates((prev) => [newCand, ...prev]);
    fetchAllData(true);
  };

  const handleAllocationCreated = (newAlloc: Allocation) => {
    setAllocations((prev) => [newAlloc, ...prev]);
    setCandidates((prev) =>
      prev.map((c) => (c.id === newAlloc.candidateId ? { ...c, status: "Allocated", allocatedRoleId: newAlloc.id } : c))
    );
    fetchAllData(true);
  };

  const handleAllocationRevoked = (allocId: string) => {
    setAllocations((prev) =>
      prev.map((a) => (a.id === allocId ? { ...a, status: "Revoked" } : a))
    );
    fetchAllData(true);
  };

  const handleMessageSent = (newMsg: ChatMessage) => {
    setMessages((prev) => [newMsg, ...prev]);
  };

  const handleOpenAllocationForCandidate = (cand: Candidate) => {
    if (!userSession?.permissions.canAllocateSeats) {
      toast.error("You do not have permission to allocate seats.");
      return;
    }
    setPreSelectedAllocCandidate(cand);
    navigateToTab("allocation");
  };

  const districtNames = districts.map((d) => d.name);
  const unreadMessagesCount = messages.filter((m) => m.unread).length;
  const candidateRecord =
    userSession?.isCandidate
      ? candidates.find(
          (c) => c.id === userSession.candidateId || c.cnic === userSession.cnic
        ) ?? null
      : null;
  const candidateAllocation = candidateRecord
    ? allocations.find((a) => a.candidateId === candidateRecord.id && a.status === "Active")
    : undefined;

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-white text-emerald-700 flex items-center justify-center shadow-md border border-emerald-200 mb-4"><Landmark className="w-8 h-8" /></div>
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
          <span>Verifying secure session...</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-white text-emerald-700 flex items-center justify-center shadow-md border border-emerald-200 mb-4"><Landmark className="w-8 h-8" /></div>
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
          <span>Connecting to Constituency Human Resources Database...</span>
        </div>
        <p className="text-xs text-slate-400 mt-1 font-mono text-center">
          Synchronizing verified candidate archives and regional quota ledgers
        </p>
      </div>
    );
  }

  // 1. First Landing Page View
  if (viewMode === "landing" || !userSession) {
    return (
      <>
        {/* If user is logged in and viewing landing page, show a small return to dashboard floating bar */}
        {userSession && (
          <div className="sticky top-0 z-50 bg-white text-slate-700 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">
                Signed in as <strong className="text-slate-900">{userSession.name}</strong> ({userSession.role})
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setViewMode("dashboard")}
                className="inline-flex items-center gap-1 bg-[#047857] hover:bg-[#065f46] text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 font-semibold hover:underline cursor-pointer px-1"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        <LandingPage
          onOpenLogin={handleOpenLoginRoute}
          overview={publicOverview}
        />
      </>
    );
  }

  // 2. Authenticated Dashboard Layout with Left Side Sidebar
  if (!analytics) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8f6] p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Constituency ledger unavailable</h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            {loadError ||
              "The national analytics service could not be reached. Check your connection and try again."}
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void fetchAllData()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-800"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Sync
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Sign Out
            </button>
          </div>
          <button
            type="button"
            onClick={() => setViewMode("landing")}
            className="mt-3 text-xs font-semibold text-emerald-800 hover:underline"
          >
            Return to public landing page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 flex">
      {/* Left Side Dashboard Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        selectedDistrict={selectedDistrict}
        setSelectedDistrict={setSelectedDistrict}
        districts={districtNames}
        unreadCount={unreadMessagesCount}
        user={userSession}
        onLogout={handleLogout}
        onOpenSwitchRole={handleSwitchRole}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Dashboard Content Area (Offset by Sidebar on desktop) */}
      <div
        className={`dashboard-shell flex-1 flex flex-col min-w-0 transition-all duration-300 print:pl-0 ${
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-72"
        }`}
      >
        {/* Top Header Bar */}
        <DashboardTopBar
          activeTab={activeTab}
          selectedDistrict={selectedDistrict}
          setSelectedDistrict={setSelectedDistrict}
          districts={districtNames}
          user={userSession}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenSwitchRole={handleSwitchRole}
          onLogout={handleLogout}
          onGoToLandingPage={() => setViewMode("landing")}
          unreadCount={unreadMessagesCount}
        />

        {/* Active Module View Switcher */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {userSession.isCandidate ? (
            <CandidatePortalView
              user={userSession}
              candidate={candidateRecord}
              allocation={candidateAllocation}
              districts={districts}
              onViewLetter={(alloc) => setLetterAllocation(alloc)}
            />
          ) : (
            <>
              {activeTab === "dashboard" && (
                <DashboardView
                  analytics={analytics}
                  candidates={candidates}
                  allocations={allocations}
                  selectedDistrict={selectedDistrict}
                  setSelectedDistrict={setSelectedDistrict}
                  onNavigateTab={navigateToTab}
                  onSelectCandidate={(cand) => router.push(`/candidates/${cand.id}`)}
                  canGenerateReports={userSession.permissions.canGenerateReports}
                  canAllocateSeats={userSession.permissions.canAllocateSeats}
                />
              )}

              {activeTab === "candidates" && (
                <CandidateRegistrationView
                  candidates={candidates}
                  districts={districts}
                  onCandidateCreated={handleCandidateCreated}
                  onSelectCandidate={(cand) => router.push(`/candidates/${cand.id}`)}
                  onAllocateCandidate={handleOpenAllocationForCandidate}
                  canRegisterCandidates={userSession.permissions.canRegisterCandidates}
                  canAllocateSeats={userSession.permissions.canAllocateSeats}
                />
              )}

              {activeTab === "allocation" && (
                <SeatAllocationView
                  candidates={candidates}
                  districts={districts}
                  allocations={allocations}
                  onAllocationCreated={handleAllocationCreated}
                  onAllocationRevoked={handleAllocationRevoked}
                  onViewLetter={(alloc) => setLetterAllocation(alloc)}
                  canRevokeAllocations={userSession.permissions.canRevokeAllocations}
                  canAllocateSeats={userSession.permissions.canAllocateSeats}
                  preSelectedCandidate={preSelectedAllocCandidate}
                  onClearPreSelectedCandidate={() => setPreSelectedAllocCandidate(null)}
                />
              )}

              {activeTab === "chat" && (
                <InternalChatView
                  messages={messages}
                  districts={districts}
                  currentUser={userSession}
                  onMessageSent={handleMessageSent}
                />
              )}

              {activeTab === "reports" && (
                <ReportsView
                  candidates={candidates}
                  districts={districts}
                  allocations={allocations}
                  selectedDistrict={selectedDistrict}
                  setSelectedDistrict={setSelectedDistrict}
                />
              )}
            </>
          )}
        </main>

        {/* Dashboard Footer */}
        <footer className="mt-auto bg-white border-t border-slate-200 py-3.5 px-4 sm:px-8 text-center text-xs text-slate-600 print:hidden">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex flex-wrap items-center justify-center gap-2 text-slate-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Internal HR System Portal • Islamic Republic of Pakistan</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="text-[11px] text-emerald-700 font-semibold">
                {userSession.name} ({userSession.role})
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500 font-mono">
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                Scope: {selectedDistrict}
              </span>
              <span>AES-256 Verified Node</span>
            </div>
          </div>
        </footer>
      </div>



      {/* Official Gazette Appointment Notification Letter Modal */}
      {letterAllocation && (
        <AppointmentLetterModal
          allocation={letterAllocation}
          onClose={() => setLetterAllocation(null)}
        />
      )}
    </div>
  );
}
