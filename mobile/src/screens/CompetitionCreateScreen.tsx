import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { ArrowLeft, Trophy, Target, Minus, Calendar, Check } from 'lucide-react-native';
import { createCompetition, updateCompetition, getCompetitionFull, ApiError } from '@/lib/api';
import type { HoleAwardType } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { colors, spacing, radius, typography } from '@/theme';

const HOLE_COUNT = 18;

const AWARD_CONFIG: Record<HoleAwardType, { label: string; icon: typeof Trophy; color: string; bg: string; border: string }> = {
  none: { label: '設定なし', icon: Minus, color: colors.gray[400], bg: colors.gray[50], border: colors.gray[200] },
  drancon: { label: 'ドラコン', icon: Trophy, color: colors.forest[600], bg: colors.forest[50], border: colors.forest[300] },
  nearpin: { label: 'ニアピン', icon: Target, color: colors.sand[600], bg: colors.sand[50], border: colors.sand[300] },
};

interface CompetitionCreateScreenProps {
  deviceId: string;
  competitionId?: string;
  onBack: () => void;
  onSaved: () => void;
}

export function CompetitionCreateScreen({ deviceId, competitionId, onBack, onSaved }: CompetitionCreateScreenProps) {
  const isEdit = !!competitionId;
  const [name, setName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [date, setDate] = useState('');
  const [holes, setHoles] = useState<Record<number, HoleAwardType>>(
    Object.fromEntries(Array.from({ length: HOLE_COUNT }, (_, i) => [i + 1, 'none' as HoleAwardType])),
  );
  const [pickerHole, setPickerHole] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!competitionId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getCompetitionFull(deviceId, competitionId);
        if (cancelled) return;
        setName(res.competition.name);
        setCourseName(res.competition.course_name ?? '');
        setDate(res.competition.date);
        const holeMap: Record<number, HoleAwardType> = {};
        for (let i = 1; i <= HOLE_COUNT; i++) {
          const h = res.holes.find((ho) => ho.hole_number === i);
          holeMap[i] = h ? h.award_type : 'none';
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
      setError('コンペ名を入力してください');
      return;
    }
    if (!date) {
      setError('開催日を入力してください');
      return;
    }
    setSaving(true);
    setError('');
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
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.forest[500]} />
      </View>
    );
  }

  const renderHoleItem = ({ item: holeNum }: { item: number }) => {
    const award = holes[holeNum];
    const cfg = AWARD_CONFIG[award];
    const Icon = cfg.icon;
    return (
      <TouchableOpacity
        onPress={() => setPickerHole(holeNum)}
        style={[styles.holeButton, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
        activeOpacity={0.7}
      >
        <Text style={styles.holeNumberText}>{holeNum}H</Text>
        <View style={styles.holeAwardRow}>
          <Icon size={16} color={cfg.color} />
          <Text style={[styles.holeAwardText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.forest[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'コンペ編集' : 'コンペ作成'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Basic Info */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>コンペ名</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="例: 〇〇社ゴルフコンペ"
            maxLength={50}
          />
          <Text style={styles.fieldLabel}>開催場所</Text>
          <Input
            value={courseName}
            onChangeText={setCourseName}
            placeholder="例: 〇〇カントリークラブ"
            maxLength={50}
          />
          <Text style={styles.fieldLabel}>開催日</Text>
          <Input
            value={date}
            onChangeText={setDate}
            placeholder="例: 2024-01-15"
            maxLength={10}
          />
        </View>

        {/* 18 Hole Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ホール賞設定</Text>
          <Text style={styles.cardSubtitle}>各ホールをタップして「ドラコン」「ニアピン」を選択できます</Text>

          {/* Legend */}
          <View style={styles.legendRow}>
            {(Object.keys(AWARD_CONFIG) as HoleAwardType[]).map((type) => {
              const cfg = AWARD_CONFIG[type];
              const Icon = cfg.icon;
              return (
                <View key={type} style={styles.legendItem}>
                  <View style={[styles.legendIcon, { backgroundColor: cfg.bg }]}>
                    <Icon size={12} color={cfg.color} />
                  </View>
                  <Text style={styles.legendText}>{cfg.label}</Text>
                </View>
              );
            })}
          </View>

          <FlatList
            data={Array.from({ length: HOLE_COUNT }, (_, i) => i + 1)}
            keyExtractor={(item) => String(item)}
            numColumns={3}
            scrollEnabled={false}
            columnWrapperStyle={styles.holeGridRow}
            renderItem={renderHoleItem}
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button variant="primary" size="lg" onPress={handleSave} loading={saving} disabled={saving}>
          {isEdit ? '更新' : '登録'}
        </Button>
      </ScrollView>

      {/* Hole Award Picker Modal */}
      <Modal visible={pickerHole !== null} onClose={() => setPickerHole(null)}>
        {pickerHole !== null && (
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>{pickerHole}H 賞設定</Text>
            <View style={styles.pickerList}>
              {(Object.keys(AWARD_CONFIG) as HoleAwardType[]).map((type) => {
                const cfg = AWARD_CONFIG[type];
                const Icon = cfg.icon;
                const isSelected = holes[pickerHole] === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => handleHoleSelect(pickerHole, type)}
                    style={[
                      styles.pickerItem,
                      isSelected && { backgroundColor: cfg.bg, borderColor: cfg.border },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.pickerItemIcon, { backgroundColor: cfg.bg }]}>
                      <Icon size={20} color={cfg.color} />
                    </View>
                    <Text style={[styles.pickerItemText, isSelected && { color: cfg.color }]}>
                      {cfg.label}
                    </Text>
                    {isSelected && (
                      <View style={[styles.pickerItemCheck, { backgroundColor: cfg.bg }]}>
                        <Check size={16} color={cfg.color} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.forest[50],
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.forest[100],
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: colors.forest[800],
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: typography.sm,
    fontWeight: '500',
    color: colors.forest[800],
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.forest[800],
  },
  cardSubtitle: {
    fontSize: typography.xs,
    color: colors.gray[400],
    marginBottom: spacing.md,
  },
  legendRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendIcon: {
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  legendText: {
    fontSize: typography.xs,
    color: colors.gray[500],
  },
  holeGridRow: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  holeButton: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    borderWidth: 2,
  },
  holeNumberText: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  holeAwardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  holeAwardText: {
    fontSize: typography.xs,
    fontWeight: '500',
  },
  errorBox: {
    backgroundColor: colors.red[50],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  errorText: {
    fontSize: typography.sm,
    color: colors.red[600],
  },
  pickerContent: {
    gap: spacing.md,
  },
  pickerTitle: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.forest[800],
  },
  pickerList: {
    gap: spacing.sm,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.gray[100],
    backgroundColor: colors.white,
  },
  pickerItemIcon: {
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  pickerItemText: {
    flex: 1,
    fontSize: typography.sm,
    fontWeight: '500',
    color: colors.gray[600],
  },
  pickerItemCheck: {
    padding: spacing.xs,
    borderRadius: radius.full,
  },
});
