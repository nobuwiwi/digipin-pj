import { useEffect, useState, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Trophy,
  Target,
  Image as ImageIcon,
  Camera,
  Upload,
  X,
  Check,
  RefreshCw,
  AlertCircle,
  User,
} from "lucide-react";
import {
  getCompetitionFull,
  checkRepresentative,
  createEvidence,
  ApiError,
} from "@/lib/api";
import type { Competition, CompetitionHole, AwardType } from "@/types";
import { Button } from "@/components/ui/Button";

interface EvidenceRegisterScreenProps {
  deviceId: string;
  competitionId: string;
  holeNumber: number;
  awardType: string;
  repNames?: string[];
  onBack: () => void;
  onUploaded?: () => void;
}

type Step = "select" | "confirm" | "uploading" | "done" | "error";

export function EvidenceRegisterScreen({
  deviceId,
  competitionId,
  holeNumber,
  awardType,
  repNames = [],
  onBack,
  onUploaded,
}: EvidenceRegisterScreenProps) {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [holes, setHoles] = useState<CompetitionHole[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [step, setStep] = useState<Step>("select");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [compRes, repRes] = await Promise.all([
        getCompetitionFull(deviceId, competitionId),
        checkRepresentative(deviceId, competitionId),
      ]);
      setCompetition(compRes.competition);
      setHoles(compRes.holes);
      setIsAuthorized(repRes.isRepresentative || repRes.isOwner);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  }, [deviceId, competitionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("画像ファイルを選択してください");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("画像サイズは10MB以下にしてください");
      return;
    }

    setImageFile(file);
    setUploadError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
      setStep("confirm");
    };
    reader.readAsDataURL(file);
  };

  const handleGallerySelect = () => {
    fileInputRef.current?.click();
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!imageFile) return;

    setStep("uploading");
    setUploadError("");
    try {
      await createEvidence(deviceId, {
        competition_id: competitionId,
        award_type: awardType as AwardType,
        image: imageFile,
        hole_number: holeNumber,
      });
      setStep("done");
      onUploaded?.();
    } catch (err) {
      const apiErr = err as ApiError;
      setUploadError(apiErr.message);
      setStep("error");
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadError("");
    setStep("select");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const awardLabel = awardType === "drancon" ? "ドラコン" : "ニアピン";
  const AwardIcon = awardType === "drancon" ? Trophy : Target;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-forest-50 to-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-forest-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-forest-50 to-white flex flex-col items-center justify-center p-4">
        <p className="text-red-500 text-sm mb-4">{error || "コンペが見つかりません"}</p>
        <Button variant="outline" onClick={onBack}>戻る</Button>
      </div>
    );
  }

  // Not authorized - user is not a representative
  if (authChecked && !isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-forest-50 to-white">
        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button type="button"
              onClick={onBack}
              className="p-2 -ml-2 text-forest-700 hover:bg-forest-50 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-forest-800">証拠画像登録</h1>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-forest-50 text-center">
            <div className="p-4 bg-amber-50 rounded-2xl mb-4 inline-flex">
              <AlertCircle className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-base font-bold text-forest-800 mb-2">登録権限がありません</h2>
            <p className="text-sm text-gray-500 mb-2">
              このQRコードの代表者リストにあなたが含まれていないため、証拠画像を登録できません。
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">このホールの代表者:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {repNames.length > 0 ? (
                  repNames.map((name, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-forest-50 text-forest-700 text-xs font-medium rounded-full flex items-center gap-1"
                    >
                      <User className="w-3 h-3" />
                      {name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">代表者が登録されていません</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Done state
  if (step === "done") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-forest-50 to-white">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-lg font-bold text-forest-800">証拠画像登録</h1>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-forest-50 text-center">
            <div className="p-4 bg-forest-50 rounded-2xl mb-4 inline-flex">
              <Check className="w-12 h-12 text-forest-600" />
            </div>
            <h2 className="text-lg font-bold text-forest-800 mb-2">アップロード完了</h2>
            <p className="text-sm text-gray-500 mb-6">
              証拠画像が正常に登録されました。
            </p>
            <Button variant="primary" onClick={onBack} className="w-full">
              確認画面に戻る
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-forest-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button type="button"
            onClick={onBack}
            className="p-2 -ml-2 text-forest-700 hover:bg-forest-50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-forest-800">証拠画像登録</h1>
        </div>

        {/* Competition & Hole Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-forest-50">
          <div className="flex items-start gap-3 mb-4">
            <div className={`p-2.5 rounded-xl ${awardType === "drancon" ? "bg-forest-50" : "bg-sand-50"}`}>
              <AwardIcon className={`w-6 h-6 ${awardType === "drancon" ? "text-forest-600" : "text-sand-600"}`} />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-forest-800">{competition.name}</h2>
              <p className="text-xs text-gray-500">{formatDate(competition.date)}</p>
              {competition.course_name && (
                <p className="text-xs text-gray-500">{competition.course_name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <span className="px-3 py-1.5 bg-gray-50 text-gray-700 text-sm font-bold rounded-lg">
              {holeNumber}番ホール
            </span>
            <span className={`px-3 py-1.5 text-sm font-bold rounded-lg ${
              awardType === "drancon" ? "bg-forest-50 text-forest-700" : "bg-sand-50 text-sand-700"
            }`}>
              {awardLabel}賞
            </span>
          </div>

          {/* Representatives */}
          {repNames.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <User className="w-3 h-3" />
                代表者
              </p>
              <div className="flex flex-wrap gap-2">
                {repNames.map((name, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      name === "自分" || i === 0
                        ? "bg-forest-50 text-forest-700"
                        : "bg-gray-50 text-gray-600"
                    }`}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Select step */}
        {step === "select" && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-forest-50">
              <h3 className="text-sm font-bold text-forest-800 mb-4 text-center">
                画像の登録方法を選択
              </h3>
              <div className="space-y-3">
                <button type="button"
                  onClick={handleGallerySelect}
                  className="w-full flex items-center gap-3 p-4 bg-forest-50 rounded-xl hover:bg-forest-100 transition-colors active:scale-95"
                >
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <ImageIcon className="w-6 h-6 text-forest-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-forest-800">ギャラリーから選択</p>
                    <p className="text-xs text-gray-500">保存済みの画像から選択</p>
                  </div>
                </button>
                <button type="button"
                  onClick={handleCameraCapture}
                  className="w-full flex items-center gap-3 p-4 bg-sand-50 rounded-xl hover:bg-sand-100 transition-colors active:scale-95"
                >
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Camera className="w-6 h-6 text-sand-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-forest-800">新しく撮影</p>
                    <p className="text-xs text-gray-500">カメラを起動して撮影</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm step */}
        {(step === "confirm" || step === "uploading") && imagePreview && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-forest-50">
              <h3 className="text-sm font-bold text-forest-800 mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-forest-600" />
                登録内容の確認
              </h3>

              {/* Image Preview */}
              <div className="relative mb-4">
                <img
                  src={imagePreview}
                  alt="プレビュー"
                  className="w-full aspect-video object-cover rounded-xl"
                />
                {step === "confirm" && (
                  <button type="button"
                    onClick={handleReset}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Info Summary */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">コンペ</span>
                  <span className="font-medium text-forest-800">{competition.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">ホール</span>
                  <span className="font-medium text-forest-800">{holeNumber}番</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">賞の種類</span>
                  <span className={`font-medium ${awardType === "drancon" ? "text-forest-700" : "text-sand-700"}`}>
                    {awardLabel}賞
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {step === "confirm" && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleReset}
                  >
                    キャンセル
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleUpload}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    アップロード
                  </Button>
                </div>
              )}

              {step === "uploading" && (
                <div className="flex items-center justify-center py-3">
                  <RefreshCw className="w-5 h-5 text-forest-500 animate-spin mr-2" />
                  <span className="text-sm text-forest-600">アップロード中...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error step */}
        {step === "error" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="text-sm font-bold text-red-700">アップロードエラー</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">{uploadError}</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onBack}>
                戻る
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleReset}>
                再選択
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
