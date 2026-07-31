import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { ArrowLeft, Trophy, Target, MapPin, Calendar, Minus } from 'lucide-react-native';
import { getCompetitionFull, ApiError } from '@/lib/api';
import type { Competition, CompetitionHole, HoleAwardType } from '@/types';
import { Button } from '@/components/ui/Button';
import { colors, spacing, radius, typography } from '@/theme';

const AWARD_LABEL: Record<HoleAwardType, { label: string; icon: typeof Trophy; color: string; bg: string }> = {
  none: { label: '設定なし', icon: Minus, color: colors.gray[400], bg: colors.gray[50] },
  drancon: { label: 'ドラコン', icon: Trophy, color: colors.forest[600], bg: colors.forest[50] },
  nearpin: { label: 'ニアピン', icon: Target, color: colors.sand[600], bg: colors.sand[50] },
};

interface CompetitionDetailScreenProps {
  deviceId: string;
  competitionId: string;
  onBack: () => void;
}

export function CompetitionDetailScreen({ deviceId, competitionId, onBack }: CompetitionDetailScreenProps) {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [holes, setHoles] = useState<CompetitionHole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
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
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.forest[500]} />
      </View>
    );
  }

  if (error || !competition) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.errorText}>{error || 'コンペが見つかりません'}</Text>
        <Button variant="outline" onPress={onBack}>戻る</Button>
      </View>
    );
  }

  const dranconHoles = holes.filter((h) => h.award_type === 'drancon');
  const nearpinHoles = holes.filter((h) => h.award_type === 'nearpin');

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.forest[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>コンペ詳細</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.compInfoTop}>
            <View style={styles.flex1}>
              <Text style={styles.compName}>{competition.name}</Text>
              <View style={styles.compMetaRow}>
                <View style={styles.compMetaItem}>
                  <Calendar size={16} color={colors.gray[500]} />
                  <Text style={styles.compMetaText}>{formatDate(competition.date)}</Text>
                </View>
                {competition.course_name ? (
                  <View style={styles.compMetaItem}>
                    <MapPin size={16} color={colors.gray[500]} />
                    <Text style={styles.compMetaText}>{competition.course_name}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <View style={[styles.statusBadge, competition.status === 'active' ? styles.statusActive : styles.statusEnded]}>
              <Text style={[styles.statusText, competition.status === 'active' ? { color: colors.forest[600] } : { color: colors.gray[500] }]}>
                {competition.status === 'active' ? '開催中' : '終了'}
              </Text>
            </View>
          </View>

          <View style={styles.awardSummaryRow}>
            <View style={[styles.awardSummaryCard, { backgroundColor: colors.forest[50] }]}>
              <View style={styles.awardSummaryHeader}>
                <Trophy size={16} color={colors.forest[600]} />
                <Text style={[styles.awardSummaryTitle, { color: colors.forest[700] }]}>ドラコン賞</Text>
              </View>
              {dranconHoles.length > 0 ? (
                <View style={styles.awardHolesRow}>
                  {dranconHoles.map((h) => (
                    <View key={h.id} style={styles.awardHoleChip}>
                      <Text style={[styles.awardHoleText, { color: colors.forest[700] }]}>{h.hole_number}H</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.awardEmptyText}>設定なし</Text>
              )}
            </View>
            <View style={[styles.awardSummaryCard, { backgroundColor: colors.sand[50] }]}>
              <View style={styles.awardSummaryHeader}>
                <Target size={16} color={colors.sand[600]} />
                <Text style={[styles.awardSummaryTitle, { color: colors.sand[700] }]}>ニアピン賞</Text>
              </View>
              {nearpinHoles.length > 0 ? (
                <View style={styles.awardHolesRow}>
                  {nearpinHoles.map((h) => (
                    <View key={h.id} style={styles.awardHoleChip}>
                      <Text style={[styles.awardHoleText, { color: colors.sand[700] }]}>{h.hole_number}H</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.awardEmptyText}>設定なし</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>ホール別賞設定</Text>
          <View style={styles.holeGrid}>
            {Array.from({ length: 18 }, (_, i) => i + 1).map((holeNum) => {
              const hole = holes.find((h) => h.hole_number === holeNum);
              const award = hole?.award_type ?? 'none';
              const cfg = AWARD_LABEL[award];
              const Icon = cfg.icon;
              return (
                <View key={holeNum} style={[styles.holeItem, { backgroundColor: cfg.bg }]}>
                  <Text style={styles.holeNumberText}>{holeNum}H</Text>
                  <View style={styles.holeAwardRow}>
                    <Icon size={14} color={cfg.color} />
                    <Text style={[styles.holeAwardText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
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
    gap: spacing.md,
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
  },
  compInfoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  compName: {
    fontSize: typography.xl,
    fontWeight: '700',
    color: colors.forest[800],
    marginBottom: spacing.sm,
  },
  compMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  compMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  compMetaText: {
    fontSize: typography.sm,
    color: colors.gray[500],
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusActive: {
    backgroundColor: colors.forest[50],
  },
  statusEnded: {
    backgroundColor: colors.gray[100],
  },
  statusText: {
    fontSize: typography.xs,
    fontWeight: '500',
  },
  awardSummaryRow: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    marginTop: spacing.sm,
  },
  awardSummaryCard: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
  },
  awardSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  awardSummaryTitle: {
    fontSize: typography.sm,
    fontWeight: '500',
  },
  awardHolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  awardHoleChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
  },
  awardHoleText: {
    fontSize: typography.xs,
    fontWeight: '500',
  },
  awardEmptyText: {
    fontSize: typography.xs,
    color: colors.gray[400],
  },
  cardTitle: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.forest[800],
    marginBottom: spacing.sm + 2,
  },
  holeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  holeItem: {
    width: '31%',
    borderRadius: radius.md,
    padding: spacing.sm + 2,
  },
  holeNumberText: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.gray[600],
    marginBottom: 2,
  },
  holeAwardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  holeAwardText: {
    fontSize: typography.xs,
  },
  errorText: {
    color: colors.red[500],
    fontSize: typography.sm,
  },
  flex1: {
    flex: 1,
  },
});
