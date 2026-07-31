import { useEffect, useState, useCallback, type ReactNode } from "react";
import { RefreshCw, Trophy } from "lucide-react";
import { getDeviceId } from "@/lib/deviceId";
import { checkAccount, getPendingRequests, ApiError } from "@/lib/api";
import { RegisterScreen } from "@/screens/RegisterScreen";
import { DashboardScreen } from "@/screens/DashboardScreen";
import { CompetitionsScreen } from "@/screens/CompetitionsScreen";
import { EvidenceListScreen } from "@/screens/EvidenceListScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { CompetitionCreateScreen } from "@/screens/CompetitionCreateScreen";
import { CompetitionManageScreen } from "@/screens/CompetitionManageScreen";
import { RepresentativeManageScreen } from "@/screens/RepresentativeManageScreen";
import { CompetitionDetailScreen } from "@/screens/CompetitionDetailScreen";
import { QRCodeListScreen } from "@/screens/QRCodeListScreen";
import { EvidenceRegisterScreen } from "@/screens/EvidenceRegisterScreen";
import { BottomNav, type TabKey } from "@/components/BottomNav";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { View } from "@/types/navigation";

type AppState = "loading" | "error" | "unregistered" | "registered";

function App() {
  const deviceId = getDeviceId();
  const [appState, setAppState] = useState<AppState>("loading");
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [bootError, setBootError] = useState("");
  const [subView, setSubView] = useState<View>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingDeepLink, setPendingDeepLink] = useState<{
    competitionId: string;
    holeNumber: number;
    awardType: string;
    repNames: string[];
  } | null>(null);

  const refreshPendingCount = useCallback(async () => {
    try {
      const res = await getPendingRequests(deviceId);
      setPendingCount(res.requests?.length ?? 0);
    } catch {
      // ignore — non-critical
    }
  }, [deviceId]);

  const checkRegistration = useCallback(async () => {
    setAppState("loading");
    setBootError("");
    try {
      const res = await checkAccount(deviceId);
      if (res.registered) {
        setAppState("registered");
      } else {
        setAppState("unregistered");
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setBootError(apiErr.message);
      setAppState("error");
    }
  }, [deviceId]);

  useEffect(() => {
    checkRegistration();
  }, [checkRegistration]);

  // Handle QR code launch: URL params like ?competition_id=...&hole_number=...&award_type=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const compId = params.get("competition_id");
    const holeNum = params.get("hole_number");
    const award = params.get("award_type");
    if (compId && holeNum && award) {
      const repsParam = params.get("reps");
      setPendingDeepLink({
        competitionId: compId,
        holeNumber: parseInt(holeNum, 10),
        awardType: award,
        repNames: repsParam ? repsParam.split(",").filter(Boolean) : [],
      });
    }
  }, []);

  // Poll for pending representative requests every 30s when registered
  useEffect(() => {
    if (appState !== "registered") return;
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 30000);
    return () => clearInterval(interval);
  }, [appState, refreshPendingCount]);

  // Navigate to evidence register when launched via QR deep link
  useEffect(() => {
    if (appState === "registered" && pendingDeepLink && !subView) {
      setSubView({
        view: "evidence-register",
        competitionId: pendingDeepLink.competitionId,
        holeNumber: pendingDeepLink.holeNumber,
        awardType: pendingDeepLink.awardType,
        repNames: pendingDeepLink.repNames,
      });
      setPendingDeepLink(null);
    }
  }, [appState, pendingDeepLink, subView]);

  // Loading screen
  if (appState === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-forest-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-forest-600 rounded-2xl shadow-lg mb-4 animate-pulse">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 text-forest-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">読み込み中...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error screen - network or server issue
  if (appState === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-forest-100 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-forest-600 rounded-2xl shadow-lg mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-lg font-bold text-forest-800 mb-2">接続エラー</h1>
          <p className="text-sm text-gray-500 mb-6">{bootError}</p>
          <button type="button"
            onClick={checkRegistration}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest-600 text-white rounded-xl font-medium hover:bg-forest-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            再接続
          </button>
        </div>
      </div>
    );
  }

  // Unregistered - show registration screen
  if (appState === "unregistered") {
    return (
      <>
        {bootError && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 text-amber-700 text-sm px-4 py-2 text-center safe-top">
            {bootError} - 登録画面を表示します
          </div>
        )}
        <RegisterScreen
          deviceId={deviceId}
          onRegistered={() => {
            setAppState("registered");
            setActiveTab("dashboard");
          }}
        />
      </>
    );
  }

  // Sub-view rendering (full-screen overlays)
  if (subView) {
    let content: ReactNode = null;
    switch (subView.view) {
      case "competition-create":
        content = (
          <CompetitionCreateScreen
            deviceId={deviceId}
            onBack={() => setSubView(null)}
            onSaved={() => {
              setSubView(null);
              setActiveTab("competitions");
            }}
          />
        );
        break;
      case "competition-edit":
        content = (
          <CompetitionCreateScreen
            deviceId={deviceId}
            competitionId={subView.competitionId}
            onBack={() => setSubView(null)}
            onSaved={() => setSubView(null)}
          />
        );
        break;
      case "competition-manage":
        content = (
          <CompetitionManageScreen
            deviceId={deviceId}
            competitionId={subView.competitionId}
            onBack={() => setSubView(null)}
            onEdit={(id) => setSubView({ view: "competition-edit", competitionId: id })}
            onManageReps={(id) => setSubView({ view: "representative-manage", competitionId: id })}
            onShowQR={(id) => setSubView({ view: "qr-codes", competitionId: id })}
          />
        );
        break;
      case "representative-manage":
        content = (
          <RepresentativeManageScreen
            deviceId={deviceId}
            competitionId={subView.competitionId}
            onBack={() => setSubView({ view: "competition-manage", competitionId: subView.competitionId })}
          />
        );
        break;
      case "competition-detail":
        content = (
          <div className="min-h-screen bg-gradient-to-b from-forest-50 to-white w-full">
            <div className="max-w-lg mx-auto pb-24 w-full">
              <CompetitionDetailScreen
                deviceId={deviceId}
                competitionId={subView.competitionId}
                onBack={() => setSubView(null)}
              />
            </div>
            <BottomNav
              activeTab={activeTab}
              onTabChange={(tab) => {
                setSubView(null);
                setActiveTab(tab);
              }}
              dashboardBadge={pendingCount}
            />
          </div>
        );
        break;
      case "qr-codes":
        content = (
          <div className="min-h-screen bg-gradient-to-b from-forest-50 to-white w-full">
            <div className="max-w-lg mx-auto pb-24 w-full">
              <QRCodeListScreen
                deviceId={deviceId}
                competitionId={subView.competitionId}
                onBack={() => setSubView({ view: "competition-manage", competitionId: subView.competitionId })}
              />
            </div>
            <BottomNav
              activeTab={activeTab}
              onTabChange={(tab) => {
                setSubView(null);
                setActiveTab(tab);
              }}
              dashboardBadge={pendingCount}
            />
          </div>
        );
        break;
      case "evidence-register":
        content = (
          <EvidenceRegisterScreen
            deviceId={deviceId}
            competitionId={subView.competitionId}
            holeNumber={subView.holeNumber}
            awardType={subView.awardType}
            repNames={subView.repNames ?? []}
            onBack={() => setSubView(null)}
            onUploaded={() => {
              setSubView(null);
              setActiveTab("evidence");
            }}
          />
        );
        break;
    }
    return (
      <ErrorBoundary
        fallback={() => (
          <div className="min-h-screen bg-gradient-to-b from-forest-50 to-white flex flex-col items-center justify-center p-4">
            <div className="text-center max-w-sm">
              <h1 className="text-lg font-bold text-forest-800 mb-2">表示エラー</h1>
              <p className="text-sm text-gray-500 mb-6">
                画面の表示中にエラーが発生しました。再試行してください。
              </p>
              <button
                type="button"
                onClick={() => setSubView(null)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest-600 text-white rounded-xl font-medium hover:bg-forest-700 transition-colors"
              >
                戻る
              </button>
            </div>
          </div>
        )}
      >
        {content}
      </ErrorBoundary>
    );
  }

  // Registered - show dashboard with bottom nav
  return (
    <div className="min-h-screen bg-gradient-to-b from-forest-50 to-white w-full">
      <div className="max-w-lg mx-auto pb-24 w-full">
        {activeTab === "dashboard" && (
          <DashboardScreen
            deviceId={deviceId}
            onNavigate={setActiveTab}
            onRepActionComplete={refreshPendingCount}
            onOpenRepRequest={(repId) => {
              // Navigate to representative management from dashboard notification
              // This is handled within the dashboard screen
            }}
          />
        )}
        {activeTab === "competitions" && (
          <CompetitionsScreen
            deviceId={deviceId}
            onOpenManage={(id) => setSubView({ view: "competition-manage", competitionId: id })}
            onOpenDetail={(id) => setSubView({ view: "competition-detail", competitionId: id })}
            onOpenCreate={() => setSubView({ view: "competition-create" })}
          />
        )}
        {activeTab === "evidence" && (
          <EvidenceListScreen
            deviceId={deviceId}
            onUpload={(compId, holeNum, award) =>
              setSubView({ view: "evidence-register", competitionId: compId, holeNumber: holeNum, awardType: award })
            }
          />
        )}
        {activeTab === "settings" && (
          <SettingsScreen deviceId={deviceId} />
        )}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} dashboardBadge={pendingCount} />
    </div>
  );
}

export default App;
