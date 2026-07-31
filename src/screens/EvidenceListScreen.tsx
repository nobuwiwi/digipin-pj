import { useEffect, useState, useCallback } from "react";
import {
  Image as ImageIcon,
  Camera,
  Trophy,
  Target,
  RefreshCw,
  User,
  Calendar,
  X,
} from "lucide-react";
import {
  getCompetitions,
  getEvidenceByCompetition,
  getCompetitionFull,
  ApiError,
} from "@/lib/api";
import type {
  EvidenceImageWithRelations,
  CompetitionWithCount,
  CompetitionHole,
  AwardType,
} from "@/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface EvidenceListScreenProps {
  deviceId: string;
  onUpload?: (competitionId: string, holeNumber: number, awardType: string) => void;
}

export function EvidenceListScreen({ deviceId, onUpload }: EvidenceListScreenProps) {
  const [competitions, setCompetitions] = useState<CompetitionWithCount[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>("");
  const [holes, setHoles] = useState<CompetitionHole[]>([]);
  const [selectedHole, setSelectedHole] = useState<number | "all">("all");
  const [images, setImages] = useState<EvidenceImageWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState<EvidenceImageWithRelations | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadHoles, setUploadHoles] = useState<CompetitionHole[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedUploadHole, setSelectedUploadHole] = useState<number | null>(null);
  const [selectedUploadAward, setSelectedUploadAward] = useState<string>("");

  const fetchCompetitions = useCallback(async () => {
    try {
      const res = await getCompetitions(deviceId);
      const owned = res.competitions ?? [];
      const represented = res.represented ?? [];
      // Merge and deduplicate (in case a user is both owner and representative)
      const seen = new Set<string>();
      const merged = [...owned, ...represented].filter((c) => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });
      setCompetitions(merged);
      if (merged.length > 0 && !selectedCompId) {
        setSelectedCompId(merged[0].id);
      }
    } catch {
      // handled by main fetch
    }
  }, [deviceId, selectedCompId]);

  const fetchImages = useCallback(async () => {
    if (!selectedCompId) {
      setImages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await getEvidenceByCompetition(deviceId, selectedCompId);
      setImages(res.evidenceImages ?? []);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId, selectedCompId]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Extract unique hole numbers from images
  const availableHoles = Array.from(
    new Set(images.map((img) => img.hole_number).filter((h): h is number => h !== null)),
  ).sort((a, b) => a - b);

  // Also get holes from the selected competition
  const compHoles = competitions.find((c) => c.id === selectedCompId)?.competition_holes ?? [];
  const awardedHoles = compHoles.filter((h) => h.award_type === "drancon" || h.award_type === "nearpin");

  const filteredImages = selectedHole === "all"
    ? images
    : images.filter((img) => img.hole_number === selectedHole);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const handleOpenUpload = async () => {
    if (!selectedCompId) return;
    setUploadLoading(true);
    setUploadModalOpen(true);
    try {
      const res = await getCompetitionFull(deviceId, selectedCompId);
      const awarded = (res.holes ?? []).filter((h) => h.award_type === "drancon" || h.award_type === "nearpin");
      setUploadHoles(awarded);
      if (awarded.length > 0) {
        setSelectedUploadHole(awarded[0].hole_number);
        setSelectedUploadAward(awarded[0].award_type);
      }
    } catch {
      setUploadHoles([]);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleConfirmUpload = () => {
    if (selectedUploadHole === null || !selectedUploadAward || !onUpload) return;
    setUploadModalOpen(false);
    onUpload(selectedCompId, selectedUploadHole, selectedUploadAward);
  };

  return (
    <div className="px-4 py-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-forest-800 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          証拠画像
        </h1>
        {onUpload && (
          <Button variant="primary" size="sm" onClick={handleOpenUpload}>
            <Camera className="w-4 h-4 mr-1" />
            画像登録
          </Button>
        )}
      </div>

      {/* Competition Tabs */}
      {competitions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="p-4 bg-forest-50 rounded-2xl mb-4">
            <ImageIcon className="w-10 h-10 text-forest-400" />
          </div>
          <p className="text-sm text-gray-500">コンペがありません</p>
        </div>
      ) : (
        <>
          {/* Competition selector - horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {competitions.map((c) => (
              <button type="button"
                key={c.id}
                onClick={() => {
                  setSelectedCompId(c.id);
                  setSelectedHole("all");
                }}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCompId === c.id
                    ? "bg-forest-600 text-white shadow-md"
                    : "bg-white text-gray-500 border border-gray-200 hover:bg-forest-50"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Hole Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            <button type="button"
              onClick={() => setSelectedHole("all")}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                selectedHole === "all"
                  ? "bg-forest-100 text-forest-700"
                  : "bg-white text-gray-400 border border-gray-100"
              }`}
            >
              すべて
            </button>
            {awardedHoles.map((h) => (
              <button type="button"
                key={h.id}
                onClick={() => setSelectedHole(h.hole_number)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                  selectedHole === h.hole_number
                    ? h.award_type === "drancon"
                      ? "bg-forest-100 text-forest-700"
                      : "bg-sand-100 text-sand-700"
                    : "bg-white text-gray-400 border border-gray-100"
                }`}
              >
                {h.award_type === "drancon" ? (
                  <Trophy className="w-3 h-3" />
                ) : (
                  <Target className="w-3 h-3" />
                )}
                {h.hole_number}H
              </button>
            ))}
            {/* Show holes from images that aren't in awardedHoles */}
            {availableHoles
              .filter((hNum) => !awardedHoles.some((ah) => ah.hole_number === hNum))
              .map((hNum) => (
                <button type="button"
                  key={`img-${hNum}`}
                  onClick={() => setSelectedHole(hNum)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    selectedHole === hNum
                      ? "bg-gray-100 text-gray-700"
                      : "bg-white text-gray-400 border border-gray-100"
                  }`}
                >
                  {hNum}H
                </button>
              ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 text-forest-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-red-500 text-sm mb-4">{error}</p>
              <Button variant="outline" onClick={fetchImages}>再読み込み</Button>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="p-4 bg-forest-50 rounded-2xl mb-4">
                <ImageIcon className="w-10 h-10 text-forest-400" />
              </div>
              <p className="text-sm text-gray-500">
                {selectedHole === "all" ? "証拠画像がまだありません" : `${selectedHole}番ホールの画像がありません`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredImages.map((img) => (
                <div
                  key={img.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-forest-50"
                >
                  <div
                    className="aspect-square bg-gray-100 cursor-pointer relative group"
                    onClick={() => setPreviewImage(img)}
                  >
                    <img
                      src={img.image_url}
                      alt="証拠画像"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2">
                      <span
                        className={`text-xs font-bold text-white px-2 py-1 rounded-lg flex items-center gap-1 ${
                          img.award_type === "drancon" ? "bg-forest-600" : "bg-sand-500"
                        }`}
                      >
                        {img.award_type === "drancon" ? (
                          <Trophy className="w-3 h-3" />
                        ) : (
                          <Target className="w-3 h-3" />
                        )}
                        {img.award_type === "drancon" ? "ドラコン" : "ニアピン"}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <User className="w-3 h-3 text-gray-400" />
                      <p className="text-xs font-medium text-forest-800 truncate">
                        {img.accounts?.account_name ?? "不明"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      {img.hole_number && <span>{img.hole_number}H</span>}
                      {img.distance && (
                        <>
                          {img.hole_number && <span>/</span>}
                          <span>{img.distance}m</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Image Preview Modal */}
      <Modal
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="max-w-2xl"
      >
        {previewImage && (
          <div className="space-y-3">
            <img
              src={previewImage.image_url}
              alt="証拠画像"
              className="w-full rounded-xl"
            />
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold text-white px-2 py-1 rounded-lg flex items-center gap-1 ${
                  previewImage.award_type === "drancon" ? "bg-forest-600" : "bg-sand-500"
                }`}
              >
                {previewImage.award_type === "drancon" ? (
                  <Trophy className="w-3 h-3" />
                ) : (
                  <Target className="w-3 h-3" />
                )}
                {previewImage.award_type === "drancon" ? "ドラコン賞" : "ニアピン賞"}
              </span>
              <span className="text-sm font-medium text-forest-800">
                {previewImage.competitions?.name}
              </span>
            </div>
            <div className="text-sm text-gray-500 space-y-1">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{previewImage.accounts?.account_name ?? "不明なユーザー"}</span>
              </div>
              {previewImage.competitions && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(previewImage.competitions.date)}</span>
                  {previewImage.competitions?.course_name && ` @ ${previewImage.competitions.course_name}`}
                </div>
              )}
              {previewImage.hole_number && <p>ホール: {previewImage.hole_number}番</p>}
              {previewImage.distance && (
                <p>
                  {previewImage.award_type === "drancon" ? "飛距離" : "残り距離"}: {previewImage.distance}m
                </p>
              )}
              {previewImage.memo && <p>メモ: {previewImage.memo}</p>}
            </div>
          </div>
        )}
      </Modal>

      {/* Upload Selection Modal */}
      <Modal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <h3 className="text-base font-bold text-forest-800 flex items-center gap-2">
            <Camera className="w-5 h-5 text-forest-600" />
            証拠画像を登録
          </h3>
          {(() => {
            const comp = competitions.find((c) => c.id === selectedCompId);
            return comp ? (
              <div className="bg-forest-50 rounded-xl p-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-forest-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-forest-800 truncate">{comp.name}</p>
                  <p className="text-xs text-gray-500">{formatDate(comp.date)}{comp.course_name ? ` @ ${comp.course_name}` : ""}</p>
                </div>
              </div>
            ) : null;
          })()}
          {uploadLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-forest-500 animate-spin" />
            </div>
          ) : uploadHoles.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-2">このコンペにはホール設定がありません。</p>
              <p className="text-xs text-gray-400">コンペ主催者がホールと賞を設定する必要があります。</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs text-gray-500 mb-2">ホールと賞を選択</p>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {uploadHoles.map((h) => {
                    const isSelected = selectedUploadHole === h.hole_number && selectedUploadAward === h.award_type;
                    return (
                      <button type="button"
                        key={h.id}
                        onClick={() => {
                          setSelectedUploadHole(h.hole_number);
                          setSelectedUploadAward(h.award_type);
                        }}
                        className={`p-2.5 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                          isSelected
                            ? h.award_type === "drancon"
                              ? "bg-forest-600 text-white"
                              : "bg-sand-600 text-white"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-forest-50"
                        }`}
                      >
                        {h.award_type === "drancon" ? (
                          <Trophy className="w-4 h-4" />
                        ) : (
                          <Target className="w-4 h-4" />
                        )}
                        <span>{h.hole_number}H</span>
                        <span className="text-xs opacity-80">
                          {h.award_type === "drancon" ? "ドラコン" : "ニアピン"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setUploadModalOpen(false)}>
                  キャンセル
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleConfirmUpload}
                  disabled={selectedUploadHole === null || !selectedUploadAward}
                >
                  <Camera className="w-4 h-4 mr-1" />
                  登録へ進む
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
