import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Trophy, Target, Minus, Calendar, Check } from "lucide-react";
import { createCompetition, updateCompetition, getCompetitionFull, ApiError } from "@/lib/api";
import type { HoleAwardType } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface CompetitionCreateScreenProps {
  deviceId: string;
  competitionId?: string;
  onBack: () => void;
  onSaved: () => void;
}

const HOLE_COUNT = 18;

const AWARD_CONFIG: Record<HoleAwardType, { label: string; icon: typeof Trophy; color: string; bg: string; border: string }> = {
  none: { label: "設定なし", icon: Minus, color: "text-gray-400", bg: "bg-gray-50", border: "border-gray-200" },
  drancon: { label: "ドラコン", icon: Trophy, color: "text-forest-600", bg: "bg-forest-50", border: "border-forest-300" },
  nearpin: { label: "ニアピン", icon: Target, color: "text-sand-600", bg: "bg-sand-50", border: "border-sand-300" },
};

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[0]}/${parts[1]}/${parts[2]}`;
  return dateStr;
}

export function CompetitionCreateScreen({ deviceId, competitionId, onBack, onSaved }: CompetitionCreateScreenProps) {
  const isEdit = !!competitionId;
  const [name, setName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [date, setDate] = useState("");
  const [holes, setHoles] = useState<Record<number, HoleAwardType>>(
    Object.fromEntries(Array.from({ length: HOLE_COUNT }, (_, i) => [i + 1, "none" as HoleAwardType])),
  );
  const [pickerHole, setPickerHole] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Load existing competition data if editing
  useEffect(() => {
    if (!competitionId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getCompetitionFull(deviceId, competitionId);
        if (cancelled) return;
        setName(res.competition.name);
        setCourseName(res.competition.course_name ?? "");
        setDate(res.competition.date);
        const holeMap: Record<number, HoleAwardType> = {};
        for (let i = 1; i <= HOLE_COUNT; i++) {
          const h = res.holes.find((ho) => ho.hole_number === i);
          holeMap[i] = h ? h.award_type : "none";
        }
        setHoles(holeMap);
      } catch (err) {
        const apiErr = err as ApiError;
        if (!cancelled) setError(apiErr.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [deviceId, competitionId]);

  const handleHoleSelect = (holeNum: number, award: HoleAwardType) => {
    setHoles({ ...holes, [holeNum]: award });
    setPickerHole(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("コンペ名を入力してください");
      return;
    }
    if (!date) {
      setError("開催日を入力してください");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const holeData = Object.entries(holes).map(([num, type]) => ({
        hole_number: parseInt(num, 10),
        award_type: type,
      }));

      if (isEdit && competitionId) {
        await updateCompetition(deviceId, competitionId, {
          name: name.trim(),
          date,
          course_name: courseName.trim() || undefined,
          holes: holeData,
        });
      } else {
        await createCompetition(deviceId, {
          name: name.trim(),
          date,
          course_name: courseName.trim() || undefined,
          holes: holeData,
        });
      }
      onSaved();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-forest-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-forest-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-forest-100">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
          <button type="button"
            onClick={onBack}
            className="p-2 -ml-2 text-forest-700 hover:bg-forest-50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-forest-800">
            {isEdit ? "コンペ編集" : "コンペ作成"}
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-forest-50 space-y-4">
          <Input
            label="コンペ名"
            type="text"
            placeholder="例: 〇〇社ゴルフコンペ"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
          />
          <Input
            label="開催場所"
            type="text"
            placeholder="例: 〇〇カントリークラブ"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            maxLength={50}
          />
          {/* Date field with manual input + calendar picker */}
          <div className="w-full">
            <label className="block text-sm font-medium text-forest-800 mb-1.5">
              開催日
            </label>
            <div className="relative flex items-center">
              <input
                ref={dateInputRef}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="absolute right-0 w-10 h-10 opacity-0 cursor-pointer z-20"
                tabIndex={-1}
                aria-hidden="true"
              />
              <input
                type="text"
                value={date ? formatDateDisplay(date) : ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[\/\s]/g, "-");
                  const parts = raw.split("-");
                  if (parts.length === 3) {
                    const [y, m, d] = parts;
                    if (y.length === 4 && m.length <= 2 && d.length <= 2) {
                      const mm = m.padStart(2, "0");
                      const dd = d.padStart(2, "0");
                      setDate(`${y}-${mm}-${dd}`);
                    } else {
                      setDate(raw);
                    }
                  } else if (raw === "") {
                    setDate("");
                  } else {
                    setDate(raw);
                  }
                }}
                placeholder="例: 2024/01/15 または 2024-01-15"
                className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 text-sm outline-none ${
                  date
                    ? "border-forest-500 text-forest-800"
                    : "border-gray-200 text-gray-800"
                } focus:border-forest-500`}
              />
              <button
                type="button"
                onClick={() => dateInputRef.current?.showPicker?.()}
                className="absolute right-2 p-2 text-forest-600 hover:bg-forest-50 rounded-lg transition-colors z-10"
                aria-label="カレンダーを開く"
              >
                <Calendar className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 18 Hole Settings */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-forest-50">
          <h2 className="text-sm font-bold text-forest-800 mb-1">ホール賞設定</h2>
          <p className="text-xs text-gray-400 mb-4">
            各ホールをタップして「ドラコン」「ニアピン」を選択できます
          </p>

          {/* Legend */}
          <div className="flex items-center gap-3 mb-4 text-xs">
            {(Object.keys(AWARD_CONFIG) as HoleAwardType[]).map((type) => {
              const cfg = AWARD_CONFIG[type];
              const Icon = cfg.icon;
              return (
                <div key={type} className="flex items-center gap-1">
                  <div className={`p-1 rounded-lg ${cfg.bg}`}>
                    <Icon className={`w-3 h-3 ${cfg.color}`} />
                  </div>
                  <span className="text-gray-500">{cfg.label}</span>
                </div>
              );
            })}
          </div>

          {/* 18 Holes Grid - 3 columns */}
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: HOLE_COUNT }, (_, i) => i + 1).map((holeNum) => {
              const award = holes[holeNum];
              const cfg = AWARD_CONFIG[award];
              const Icon = cfg.icon;
              return (
                <button type="button"
                  key={holeNum}
                  onClick={() => setPickerHole(holeNum)}
                  className={`rounded-xl p-3 border-2 transition-all duration-200 active:scale-95 ${cfg.bg} ${cfg.border} hover:shadow-sm`}
                >
                  <div className="text-xs font-bold text-gray-600 mb-1">{holeNum}H</div>
                  <div className="flex items-center gap-1">
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                    <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Save Button */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleSave}
          loading={saving}
          disabled={saving}
        >
          {isEdit ? "更新" : "登録"}
        </Button>
      </div>

      {/* Hole Award Picker Modal */}
      {pickerHole !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 animate-fade-in"
          onClick={() => setPickerHole(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-forest-800">{pickerHole}H 賞設定</h3>
              <button type="button"
                onClick={() => setPickerHole(null)}
                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
            <div className="space-y-2">
              {(Object.keys(AWARD_CONFIG) as HoleAwardType[]).map((type) => {
                const cfg = AWARD_CONFIG[type];
                const Icon = cfg.icon;
                const isSelected = holes[pickerHole] === type;
                return (
                  <button type="button"
                    key={type}
                    onClick={() => handleHoleSelect(pickerHole, type)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 active:scale-[0.98] ${
                      isSelected
                        ? `${cfg.bg} ${cfg.border} shadow-sm`
                        : "border-gray-100 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${cfg.bg}`}>
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <span className={`flex-1 text-left text-sm font-medium ${
                      isSelected ? cfg.color : "text-gray-600"
                    }`}>
                      {cfg.label}
                    </span>
                    {isSelected && (
                      <div className={`p-1 rounded-full ${cfg.bg}`}>
                        <Check className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
