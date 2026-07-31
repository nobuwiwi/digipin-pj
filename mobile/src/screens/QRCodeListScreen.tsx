import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { ArrowLeft, QrCode as QrCodeIcon, Trophy, Target, Users } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { getQRCodeData, ApiError } from '@/lib/api';
import type { Competition, CompetitionHole, RepresentativeWithAccount, HoleAwardType } from '@/types';
import { Button } from '@/components/ui/Button';
import { colors, spacing, radius, typography } from '@/theme';

const AWARD_LABEL: Record<HoleAwardType, { label: string; icon: typeof Trophy; color: string; bg: string }> = {
  none: { label: '設定なし', icon: Trophy, color: colors.gray[400], bg: colors.gray[50] },
  drancon: { label: 'ドラコン', icon: Trophy, color: colors.forest[600], bg: colors.forest[50] },
  nearpin: { label: 'ニアピン', icon: Target, color: colors.sand[600], bg: colors.sand[50] },
};

const WEB_URL = 'https://frontend-production-0a2c7.up.railway.app';

function buildDeepLink(competitionId: string, holeNumber: number, awardType: string, repNames: string[]): string {
  const params = new URLSearchParams({
    competition_id: competitionId,
    hole_number: String(holeNumber),
    award_type: awardType,
  });
  if (repNames.length > 0) {
    params.set('reps', repNames.join(','));
  }
  return `${WEB_URL}?${params.toString()}`;
}

interface QRCodeListScreenProps {
  deviceId: string;
  competitionId: string;
  onBack: () => void;
}

export function QRCodeListScreen({ deviceId, competitionId, onBack }: QRCodeListScreenProps) {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [holes, setHoles] = useState<CompetitionHole[]>([]);
  const [representatives, setRepresentatives] = useState<RepresentativeWithAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
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

  const awardedHoles = holes.filter((h) => h.award_type === 'drancon' || h.award_type === 'nearpin');
  const repNames = representatives
    .map((r) => r.accounts?.account_name)
    .filter((n): n is string => !!n);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.forest[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QRコード一覧</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Competition Info */}
        <View style={styles.card}>
          <View style={styles.compInfoRow}>
            <View style={styles.compIconBox}>
              <QrCodeIcon size={20} color={colors.forest[600]} />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.compName}>{competition.name}</Text>
              <Text style={styles.compDate}>{formatDate(competition.date)}</Text>
            </View>
          </View>

          <View style={styles.repsSection}>
            <View style={styles.repsHeader}>
              <Users size={16} color={colors.forest[600]} />
              <Text style={styles.repsTitle}>代表者</Text>
            </View>
            {representatives.length > 0 ? (
              <View style={styles.repsList}>
                {representatives.map((r) => (
                  <View key={r.id} style={styles.repChip}>
                    <Text style={styles.repChipText}>{r.accounts?.account_name ?? '不明'}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.repsEmpty}>承認済みの代表者がいません</Text>
            )}
          </View>
        </View>

        {/* QR Code Cards */}
        {awardedHoles.length === 0 ? (
          <View style={styles.center}>
            <View style={styles.emptyIcon}>
              <QrCodeIcon size={40} color={colors.forest[400]} />
            </View>
            <Text style={styles.emptyText}>
              ドラコン・ニアピンが設定されたホールがありません。{'\n'}コンペ編集からホールの賞を設定してください。
            </Text>
          </View>
        ) : (
          <View style={styles.qrList}>
            {awardedHoles.map((hole) => {
              const cfg = AWARD_LABEL[hole.award_type];
              const Icon = cfg.icon;
              const deeplink = buildDeepLink(competitionId, hole.hole_number, hole.award_type, repNames);
              return (
                <View key={hole.id} style={styles.qrCard}>
                  <View style={[styles.qrCardHeader, { backgroundColor: cfg.bg }]}>
                    <Icon size={20} color={cfg.color} />
                    <Text style={[styles.qrCardHole, { color: cfg.color }]}>{hole.hole_number}番ホール</Text>
                    <Text style={styles.qrCardSeparator}>|</Text>
                    <Text style={[styles.qrCardAward, { color: cfg.color }]}>{cfg.label}賞</Text>
                  </View>
                  <View style={styles.qrCardBody}>
                    <View style={styles.qrCodeContainer}>
                      <QRCode
                        value={deeplink}
                        size={200}
                        color={colors.forest[900]}
                        backgroundColor={colors.white}
                      />
                    </View>
                    <Text style={styles.qrUrlText} numberOfLines={2}>{deeplink}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
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
    paddingVertical: spacing.xxl,
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
  compInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  compIconBox: {
    padding: spacing.sm,
    backgroundColor: colors.forest[50],
    borderRadius: radius.md,
  },
  compName: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.forest[800],
  },
  compDate: {
    fontSize: typography.xs,
    color: colors.gray[500],
  },
  repsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: spacing.md,
  },
  repsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  repsTitle: {
    fontSize: typography.sm,
    fontWeight: '500',
    color: colors.forest[700],
  },
  repsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  repChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.forest[50],
    borderRadius: radius.full,
  },
  repChipText: {
    fontSize: typography.xs,
    fontWeight: '500',
    color: colors.forest[700],
  },
  repsEmpty: {
    fontSize: typography.xs,
    color: colors.gray[400],
  },
  emptyIcon: {
    padding: spacing.md,
    backgroundColor: colors.forest[50],
    borderRadius: radius.xl,
  },
  emptyText: {
    fontSize: typography.sm,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  qrList: {
    gap: spacing.md,
  },
  qrCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  qrCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  qrCardHole: {
    fontSize: typography.sm,
    fontWeight: '700',
  },
  qrCardSeparator: {
    fontSize: typography.sm,
    color: colors.gray[300],
  },
  qrCardAward: {
    fontSize: typography.sm,
    fontWeight: '500',
  },
  qrCardBody: {
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  qrCodeContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
  },
  qrUrlText: {
    fontSize: typography.xs,
    color: colors.gray[400],
    textAlign: 'center',
  },
  errorText: {
    color: colors.red[500],
    fontSize: typography.sm,
  },
  flex1: {
    flex: 1,
  },
});
