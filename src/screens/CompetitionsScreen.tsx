import { useEffect, useState, useCallback } from "react";
import {
  Trophy,
  Plus,
  Calendar,
  MapPin,
  Trash2,
  RefreshCw,
  Crown,
  ChevronRight,
} from "lucide-react";
import { getCompetitions, deleteCompetition, ApiError } from "@/lib/api";
import type { CompetitionWithCount } from "@/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface CompetitionsScreenProps {
  deviceId: string;
  onOpenManage: (competitionId: string) => void;
  onOpenDetail: (competitionId: string) => void;
  onOpenCreate: () => void;
}

export function CompetitionsScreen({
  deviceId,
  onOpenManage,
  onOpenDetail,
  onOpenCreate,
}: CompetitionsScreenProps) {
  const [owned, setOwned] = useState<CompetitionWithCount[]>([]);
  const [represented, setRepresented] = useState<CompetitionWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CompetitionWithCount | null>(null);

  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCompetitions(deviceId);
      setOwned(res.competitions ?? []);
      setRepresented(res.represented ?? []);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  const handleDelete = async (comp: CompetitionWithCount) => {
    try {
      await deleteCompetition(deviceId, comp.id);
      setDeleteTarget(null);
      await fetchCompetitions();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  };

  const CompetitionCard = ({
    comp,
    isOwned,
  }: {
    comp: CompetitionWithCount;
    isOwned: boolean;
  }) => {
    const imgCount = comp.evidence_images?.[0]?.count ?? 0;
    return (
      <div
        className="bg-white rounded-2xl p-4 shadow-sm border border-forest-50 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => isOwned ? onOpenManage(comp.id) : onOpenDetail(comp.id)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-forest-800">{comp.name}</h3>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  isOwned
                    ? "bg-forest-100 text-forest-700"
                    : "bg-sand-100 text-sand-700"
                }`}
              >
                {isOwned ? "主催" : "代表"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(comp.date)}
              </span>
              {comp.course_name && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {comp.course_name}
                </span>
              )}
            </div>
          </div>
          <span
            className={`px-2.5 py-1 text-xs font-medium rounded-full ${
              comp.status === "active"
                ? "bg-forest-50 text-forest-600"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {comp.status === "active" ? "開催中" : "終了"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{imgCount}枚の証拠画像</span>
          <div className="flex items-center gap-1">
            {isOwned && (
              <button type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(comp);
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-forest-800 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          コンペ
        </h1>
        <Button variant="primary" size="sm" onClick={onOpenCreate}>
          <Plus className="w-4 h-4 mr-1" />
          新規作成
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-forest-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <Button variant="outline" onClick={fetchCompetitions}>再読み込み</Button>
        </div>
      ) : owned.length === 0 && represented.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="p-4 bg-forest-50 rounded-2xl mb-4">
            <Trophy className="w-10 h-10 text-forest-400" />
          </div>
          <p className="text-sm text-gray-500 mb-4">コンペがまだありません</p>
          <Button variant="primary" onClick={onOpenCreate}>
            <Plus className="w-4 h-4 mr-1" />
            コンペを作成
          </Button>
        </div>
      ) : (
        <>
          {/* Owned Competitions */}
          <div>
            <h2 className="text-sm font-bold text-forest-700 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              主催コンペ
            </h2>
            {owned.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-forest-50">
                <p className="text-sm text-gray-400 mb-3">主催コンペがありません</p>
                <Button variant="secondary" size="sm" onClick={onOpenCreate}>
                  <Plus className="w-4 h-4 mr-1" />
                  コンペを作成
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {owned.map((comp) => (
                  <CompetitionCard key={comp.id} comp={comp} isOwned={true} />
                ))}
              </div>
            )}
          </div>

          {/* Represented Competitions */}
          <div>
            <h2 className="text-sm font-bold text-forest-700 mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4" />
              代表コンペ
            </h2>
            {represented.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-forest-50">
                <p className="text-sm text-gray-400">代表コンペがありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {represented.map((comp) => (
                  <CompetitionCard key={comp.id} comp={comp} isOwned={false} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="コンペを削除"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            「{deleteTarget?.name}」を削除しますか？
            <br />
            このコンペの証拠画像もすべて削除されます。この操作は取り消せません。
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
            >
              キャンセル
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              削除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
