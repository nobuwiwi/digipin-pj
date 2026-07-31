import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Trophy, Target, MapPin, Calendar, Minus } from "lucide-react";
import { getCompetitionFull, ApiError } from "@/lib/api";
import type { Competition, CompetitionHole, HoleAwardType } from "@/types";
import { Button } from "@/components/ui/Button";

interface CompetitionDetailScreenProps {
  deviceId: string;
  competitionId: string;
  onBack: () => void;
}

const AWARD_LABEL: Record<HoleAwardType, { label: string; icon: typeof Trophy; color: string; bg: string }> = {
  none: { label: "設定なし", icon: Minus, color: "text-gray-400", bg: "bg-gray-50" },
  drancon: { label: "ドラコン", icon: Trophy, color: "text-forest-600", bg: "bg-forest-50" },
  nearpin: { label: "ニアピン", icon: Target, color: "text-sand-600", bg: "bg-sand-50" },
};

export function CompetitionDetailScreen({
  deviceId,
  competitionId,
  onBack,
}: CompetitionDetailScreenProps) {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [holes, setHoles] = useState<CompetitionHole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCompetitionFull(deviceId, competitionId);
      setCompetition(res.competition);
      setHoles(res.holes);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
    } finally {
      setLoading(false);
    }
  }, [deviceId, competitionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-forest-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-red-500 text-sm mb-4">{error || "コンペが見つかりません"}</p>
        <Button variant="outline" onClick={onBack}>戻る</Button>
      </div>
    );
  }

  const dranconHoles = holes.filter((h) => h.award_type === "drancon");
  const nearpinHoles = holes.filter((h) => h.award_type === "nearpin");

  return (
    <div className="w-full">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-forest-100">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
          <button type="button"
            onClick={onBack}
            className="p-2 -ml-2 text-forest-700 hover:bg-forest-50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-forest-800">コンペ詳細</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Competition Info Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-forest-50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-forest-800 mb-2">{competition.name}</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(competition.date)}
                </span>
                {competition.course_name && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {competition.course_name}
                  </span>
                )}
              </div>
            </div>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              competition.status === "active"
                ? "bg-forest-50 text-forest-600"
                : "bg-gray-100 text-gray-500"
            }`}>
              {competition.status === "active" ? "開催中" : "終了"}
            </span>
          </div>

          {/* Award Summary */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-forest-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-forest-600" />
                <span className="text-sm font-medium text-forest-700">ドラコン賞</span>
              </div>
              {dranconHoles.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {dranconHoles.map((h) => (
                    <span key={h.id} className="px-2 py-0.5 bg-white text-forest-700 text-xs font-medium rounded-md">
                      {h.hole_number}H
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">設定なし</p>
              )}
            </div>
            <div className="bg-sand-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-sand-600" />
                <span className="text-sm font-medium text-sand-700">ニアピン賞</span>
              </div>
              {nearpinHoles.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {nearpinHoles.map((h) => (
                    <span key={h.id} className="px-2 py-0.5 bg-white text-sand-700 text-xs font-medium rounded-md">
                      {h.hole_number}H
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">設定なし</p>
              )}
            </div>
          </div>
        </div>

        {/* 18 Hole Grid */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-forest-50">
          <h3 className="text-sm font-bold text-forest-800 mb-3">ホール別賞設定</h3>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 18 }, (_, i) => i + 1).map((holeNum) => {
              const hole = holes.find((h) => h.hole_number === holeNum);
              const award = hole?.award_type ?? "none";
              const cfg = AWARD_LABEL[award];
              const Icon = cfg.icon;
              return (
                <div key={holeNum} className={`rounded-xl p-2.5 ${cfg.bg}`}>
                  <div className="text-xs font-bold text-gray-600 mb-0.5">{holeNum}H</div>
                  <div className="flex items-center gap-1">
                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
