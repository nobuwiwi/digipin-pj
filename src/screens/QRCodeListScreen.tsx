import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, QrCode as QrCodeIcon, Trophy, Target, Download, Users } from "lucide-react";
import QRCode from "qrcode";
import { getQRCodeData, ApiError } from "@/lib/api";
import type { Competition, CompetitionHole, RepresentativeWithAccount, HoleAwardType } from "@/types";
import { Button } from "@/components/ui/Button";

interface QRCodeListScreenProps {
  deviceId: string;
  competitionId: string;
  onBack: () => void;
}

interface QRCardData {
  hole: CompetitionHole;
  qrDataUrl: string;
}

const AWARD_LABEL: Record<HoleAwardType, { label: string; icon: typeof Trophy; color: string; bg: string }> = {
  none: { label: "設定なし", icon: Trophy, color: "text-gray-400", bg: "bg-gray-50" },
  drancon: { label: "ドラコン", icon: Trophy, color: "text-forest-600", bg: "bg-forest-50" },
  nearpin: { label: "ニアピン", icon: Target, color: "text-sand-600", bg: "bg-sand-50" },
};

export function QRCodeListScreen({ deviceId, competitionId, onBack }: QRCodeListScreenProps) {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [holes, setHoles] = useState<CompetitionHole[]>([]);
  const [representatives, setRepresentatives] = useState<RepresentativeWithAccount[]>([]);
  const [qrCards, setQRCards] = useState<QRCardData[]>([]);
  const [qrError, setQrError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getQRCodeData(deviceId, competitionId);
      setCompetition(res.competition);
      setHoles(res.holes);
      setRepresentatives(res.representatives);
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

  // Generate QR codes for holes with awards
  useEffect(() => {
    const awardedHoles = holes.filter((h) => h.award_type === "drancon" || h.award_type === "nearpin");
    if (awardedHoles.length === 0 || !competition) {
      setQRCards([]);
      return;
    }

    const repNames = representatives
      .map((r) => r.accounts?.account_name)
      .filter((n): n is string => !!n);

    const generateQRs = async () => {
      const cards: QRCardData[] = [];
      for (const hole of awardedHoles) {
        const deeplink = buildDeepLink(competitionId, hole.hole_number, hole.award_type, repNames);
        try {
          const qrDataUrl = await QRCode.toDataURL(deeplink, {
            width: 400,
            margin: 2,
            color: { dark: "#1a3c2e", light: "#ffffff" },
            errorCorrectionLevel: "M",
          });
          cards.push({ hole, qrDataUrl });
        } catch {
          // skip failed QR generation
        }
      }
      setQRCards(cards);
    };

    generateQRs();
  }, [holes, competition, representatives, competitionId]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const handleDownload = (card: QRCardData) => {
    const link = document.createElement("a");
    link.href = card.qrDataUrl;
    link.download = `QR_${competition?.name ?? "comp"}_${card.hole.hole_number}H_${card.hole.award_type}.png`;
    link.click();
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

  if (qrError) {
    return (
      <div className="w-full">
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-forest-100">
          <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
            <button type="button"
              onClick={onBack}
              className="p-2 -ml-2 text-forest-700 hover:bg-forest-50 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-forest-800">QRコード一覧</h1>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-red-500 text-center mb-4">{qrError}</p>
            <Button variant="outline" onClick={onBack}>戻る</Button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-lg font-bold text-forest-800">QRコード一覧</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Competition Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-forest-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-forest-50 rounded-xl">
              <QrCodeIcon className="w-5 h-5 text-forest-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-forest-800">{competition.name}</h2>
              <p className="text-xs text-gray-500">{formatDate(competition.date)}</p>
            </div>
          </div>

          {/* Representatives */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-forest-600" />
              <span className="text-sm font-medium text-forest-700">代表者</span>
            </div>
            {representatives.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {representatives.map((r) => (
                  <span
                    key={r.id}
                    className="px-3 py-1 bg-forest-50 text-forest-700 text-xs font-medium rounded-full"
                  >
                    {r.accounts?.account_name ?? "不明"}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">承認済みの代表者がいません</p>
            )}
          </div>
        </div>

        {/* QR Code Cards */}
        {qrCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-forest-50 rounded-2xl mb-4">
              <QrCodeIcon className="w-10 h-10 text-forest-400" />
            </div>
            <p className="text-sm text-gray-500 text-center">
              ドラコン・ニアピンが設定されたホールがありません。<br />
              コンペ編集からホールの賞を設定してください。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {qrCards.map((card) => {
              const cfg = AWARD_LABEL[card.hole.award_type];
              const Icon = cfg.icon;
              return (
                <div
                  key={card.hole.id}
                  className="bg-white rounded-2xl shadow-sm border border-forest-50 overflow-hidden"
                >
                  <div className={`px-4 py-3 ${cfg.bg} flex items-center gap-2`}>
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                    <span className={`text-sm font-bold ${cfg.color}`}>{card.hole.hole_number}番ホール</span>
                    <span className="text-gray-300">|</span>
                    <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}賞</span>
                  </div>
                  <div className="p-4 flex flex-col items-center gap-3">
                    <img
                      src={card.qrDataUrl}
                      alt={`QR ${card.hole.hole_number}H ${cfg.label}`}
                      className="w-48 h-48"
                    />
                    <p className="text-xs text-gray-400 text-center break-all">
                      {buildDeepLink(
                        competitionId,
                        card.hole.hole_number,
                        card.hole.award_type,
                        representatives.map((r) => r.accounts?.account_name).filter((n): n is string => !!n),
                      )}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(card)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      画像を保存
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function buildDeepLink(competitionId: string, holeNumber: number, awardType: string, repNames: string[]): string {
  const params = new URLSearchParams({
    competition_id: competitionId,
    hole_number: String(holeNumber),
    award_type: awardType,
  });
  if (repNames.length > 0) {
    params.set("reps", repNames.join(","));
  }
  const base = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
  return `${base}?${params.toString()}`;
}
