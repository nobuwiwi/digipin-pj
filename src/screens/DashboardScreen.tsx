import { useEffect, useState, useCallback } from "react";
import {
  Image as ImageIcon,
  Calendar,
  ChevronRight,
  RefreshCw,
  UserPlus,
  Check,
  X,
  Info,
  BellRing,
} from "lucide-react";
import { getDashboard, updateRepresentativeStatus, ApiError } from "@/lib/api";
import type { DashboardData, RepresentativeStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import type { TabKey } from "@/components/BottomNav";

interface DashboardScreenProps {
  deviceId: string;
  onNavigate: (tab: TabKey) => void;
  onOpenRepRequest?: (repId: string) => void;
  onRepActionComplete?: () => void;
}

export function DashboardScreen({ deviceId, onNavigate, onRepActionComplete }: DashboardScreenProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getDashboard(deviceId);
      setData(res);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  const handleRepAction = async (repId: string, status: RepresentativeStatus) => {
    setActionLoading(repId);
    try {
      await updateRepresentativeStatus(deviceId, repId, status);
      await fetchData();
      onRepActionComplete?.();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-forest-500 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-red-500 text-sm mb-4">{error || "データの取得に失敗しました"}</p>
        <Button variant="outline" onClick={fetchData}>
          再読み込み
        </Button>
      </div>
    );
  }

  const { account, stats, recentImages } = data;

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-forest-600 to-forest-700 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-forest-100 text-sm mb-1">ようこそ</p>
        <h1 className="text-2xl font-bold">{account.account_name}さん</h1>
      </div>

      {/* Representative Request Notification Banner */}
      {data.pendingRequests && data.pendingRequests.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm border border-amber-200 animate-fade-in">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-100/30 rounded-full -translate-y-12 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-amber-100/30 rounded-full translate-y-8 -translate-x-8" />
          <div className="relative p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative">
                <BellRing className="w-5 h-5 text-amber-600" />
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-amber-50">
                  {data.pendingRequests.length}
                </span>
              </div>
              <h2 className="text-sm font-bold text-amber-800">
                代表者申請が{data.pendingRequests.length}件届いています
              </h2>
            </div>
            <div className="space-y-2">
              {data.pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 bg-white/95 rounded-xl backdrop-blur-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-forest-800 truncate">
                      {req.requester_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {req.competition_name}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-2 shrink-0">
                    <button type="button"
                      onClick={() => handleRepAction(req.id, "approved")}
                      disabled={actionLoading === req.id}
                      className="p-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors disabled:opacity-50 active:scale-95"
                      aria-label="承認"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button type="button"
                      onClick={() => handleRepAction(req.id, "rejected")}
                      disabled={actionLoading === req.id}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 active:scale-95"
                      aria-label="拒否"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* How to Use */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-forest-50">
        <h2 className="text-sm font-bold text-forest-800 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-forest-600" />
          本アプリの使い方
        </h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 bg-forest-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
              1
            </span>
            <p className="text-sm text-gray-600 pt-0.5">
              「コンペ」タブから新しいコンペを作成
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 bg-forest-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
              2
            </span>
            <p className="text-sm text-gray-600 pt-0.5">
              ドラコン・ニアピンの証拠画像を撮影・アップロード
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 bg-forest-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
              3
            </span>
            <p className="text-sm text-gray-600 pt-0.5">
              「証拠画像」タブから証拠画像を確認可能
            </p>
          </div>
        </div>
      </div>

      {/* Active Competitions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-forest-800 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            開催中のコンペ
          </h2>
          <button type="button"
            onClick={() => onNavigate("competitions")}
            className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-0.5"
          >
            すべて <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {stats.activeCompetitions.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-forest-50">
            <p className="text-sm text-gray-400 mb-3">開催中のコンペがありません</p>
            <Button variant="secondary" size="sm" onClick={() => onNavigate("competitions")}>
              コンペを作成する
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.activeCompetitions.map((comp) => (
              <div
                key={comp.id}
                onClick={() => onNavigate("competitions")}
                className="bg-white rounded-xl p-4 shadow-sm border border-forest-50 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-medium text-forest-800">{comp.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {comp.date}
                    {comp.course_name && ` / ${comp.course_name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      comp.role === "owner"
                        ? "bg-forest-50 text-forest-600"
                        : "bg-sand-50 text-sand-600"
                    }`}
                  >
                    {comp.role === "owner" ? "主催" : "代表"}
                  </span>
                  <span className="px-2.5 py-1 bg-forest-100 text-forest-700 text-xs font-medium rounded-full">
                    開催中
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Evidence Images */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-forest-800 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            最近の証拠画像
          </h2>
          <button type="button"
            onClick={() => onNavigate("evidence")}
            className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-0.5"
          >
            すべて <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentImages.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-forest-50">
            <p className="text-sm text-gray-400 mb-3">証拠画像がまだありません</p>
            <Button variant="secondary" size="sm" onClick={() => onNavigate("evidence")}>
              画像を追加する
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {recentImages.map((img) => (
              <div
                key={img.id}
                className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative group cursor-pointer"
                onClick={() => onNavigate("evidence")}
              >
                <img
                  src={img.image_url}
                  alt="証拠画像"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                  <span
                    className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded ${
                      img.award_type === "drancon"
                        ? "bg-forest-600"
                        : "bg-sand-500"
                    }`}
                  >
                    {img.award_type === "drancon" ? "ドラコン" : "ニアピン"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
