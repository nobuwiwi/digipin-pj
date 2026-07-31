import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import {
  Image as ImageIcon,
  Calendar,
  ChevronRight,
  RefreshCw,
  Info,
  BellRing,
  Check,
  X,
} from 'lucide-react-native';
import { getDashboard, updateRepresentativeStatus, ApiError } from '@/lib/api';
import type { DashboardData, RepresentativeStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import type { TabKey } from '@/components/BottomNav';
import { colors, spacing, radius, typography } from '@/theme';

interface DashboardScreenProps {
  deviceId: string;
  onNavigate: (tab: TabKey) => void;
  onRepActionComplete?: () => void;
}

export function DashboardScreen({ deviceId, onNavigate, onRepActionComplete }: DashboardScreenProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getDashboard(deviceId);
      setData(res);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  if (loading && !refreshing) {
    return (
      <View style={[styles.screen, styles.center]}>
        <RefreshCw size={24} color={colors.forest[500]} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.errorText}>{error || 'データの取得に失敗しました'}</Text>
        <Button variant="outline" onPress={fetchData}>再読み込み</Button>
      </View>
    );
  }

  const { account, stats, recentImages } = data;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
    >
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.headerGreeting}>ようこそ</Text>
        <Text style={styles.headerName}>{account.account_name}さん</Text>
      </View>

      {/* Pending Requests Banner */}
      {data.pendingRequests && data.pendingRequests.length > 0 && (
        <View style={styles.bannerCard}>
          <View style={styles.bannerHeader}>
            <View style={styles.bannerIconContainer}>
              <BellRing size={18} color={colors.amber[600]} />
              <View style={styles.bannerBadge}>
                <Text style={styles.bannerBadgeText}>{data.pendingRequests.length}</Text>
              </View>
            </View>
            <Text style={styles.bannerTitle}>
              代表者申請が{data.pendingRequests.length}件届いています
            </Text>
          </View>
          <View style={styles.bannerList}>
            {data.pendingRequests.map((req) => (
              <View key={req.id} style={styles.bannerItem}>
                <View style={styles.flex1}>
                  <Text style={styles.bannerItemName} numberOfLines={1}>{req.requester_name}</Text>
                  <Text style={styles.bannerItemComp} numberOfLines={1}>{req.competition_name}</Text>
                </View>
                <View style={styles.bannerActions}>
                  <TouchableOpacity
                    onPress={() => handleRepAction(req.id, 'approved')}
                    disabled={actionLoading === req.id}
                    style={styles.approveButton}
                  >
                    <Check size={16} color={colors.white} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRepAction(req.id, 'rejected')}
                    disabled={actionLoading === req.id}
                    style={styles.rejectButton}
                  >
                    <X size={16} color={colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* How to Use */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Info size={16} color={colors.forest[600]} />
          <Text style={styles.cardTitle}>本アプリの使い方</Text>
        </View>
        <View style={styles.stepsContainer}>
          {[
            '「コンペ」タブから新しいコンペを作成',
            'ドラコン・ニアピンの証拠画像を撮影・アップロード',
            '「証拠画像」タブから証拠画像を確認可能',
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Active Competitions */}
      <View>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Calendar size={16} color={colors.forest[800]} />
            <Text style={styles.sectionTitle}>開催中のコンペ</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate('competitions')} style={styles.sectionLink}>
            <Text style={styles.sectionLinkText}>すべて</Text>
            <ChevronRight size={16} color={colors.forest[600]} />
          </TouchableOpacity>
        </View>

        {stats.activeCompetitions.length === 0 ? (
          <View style={[styles.card, styles.centerCard]}>
            <Text style={styles.emptyText}>開催中のコンペがありません</Text>
            <Button variant="secondary" size="sm" onPress={() => onNavigate('competitions')}>
              コンペを作成する
            </Button>
          </View>
        ) : (
          <View style={styles.compList}>
            {stats.activeCompetitions.map((comp) => (
              <TouchableOpacity
                key={comp.id}
                onPress={() => onNavigate('competitions')}
                style={styles.compCard}
              >
                <View style={styles.flex1}>
                  <Text style={styles.compName}>{comp.name}</Text>
                  <Text style={styles.compDate}>
                    {comp.date}
                    {comp.course_name ? ` / ${comp.course_name}` : ''}
                  </Text>
                </View>
                <View style={styles.compBadges}>
                  <View style={[styles.roleBadge, comp.role === 'owner' ? styles.ownerBadge : styles.repBadge]}>
                    <Text style={[styles.roleBadgeText, comp.role === 'owner' ? { color: colors.forest[600] } : { color: colors.sand[600] }]}>
                      {comp.role === 'owner' ? '主催' : '代表'}
                    </Text>
                  </View>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>開催中</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Recent Evidence Images */}
      <View>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <ImageIcon size={16} color={colors.forest[800]} />
            <Text style={styles.sectionTitle}>最近の証拠画像</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate('evidence')} style={styles.sectionLink}>
            <Text style={styles.sectionLinkText}>すべて</Text>
            <ChevronRight size={16} color={colors.forest[600]} />
          </TouchableOpacity>
        </View>

        {recentImages.length === 0 ? (
          <View style={[styles.card, styles.centerCard]}>
            <Text style={styles.emptyText}>証拠画像がまだありません</Text>
            <Button variant="secondary" size="sm" onPress={() => onNavigate('evidence')}>
              画像を追加する
            </Button>
          </View>
        ) : (
          <View style={styles.imageGrid}>
            {recentImages.map((img) => (
              <TouchableOpacity key={img.id} onPress={() => onNavigate('evidence')} style={styles.imageCard}>
                <Image source={{ uri: img.image_url }} style={styles.image} resizeMode="cover" />
                <View style={styles.imageBadge}>
                  <Text style={[styles.imageBadgeText, { backgroundColor: img.award_type === 'drancon' ? colors.forest[700] : colors.sand[500] }]}>
                    {img.award_type === 'drancon' ? 'ドラコン' : 'ニアピン'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.forest[50],
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    backgroundColor: colors.forest[700],
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  headerGreeting: {
    fontSize: typography.sm,
    color: colors.forest[100],
    marginBottom: spacing.xs,
  },
  headerName: {
    fontSize: typography['2xl'],
    fontWeight: '700',
    color: colors.white,
  },
  bannerCard: {
    backgroundColor: colors.amber[50],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.amber[200],
    padding: spacing.md,
    overflow: 'hidden',
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  bannerIconContainer: {
    position: 'relative',
  },
  bannerBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.amber[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  bannerTitle: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.amber[800],
    flex: 1,
  },
  bannerList: {
    gap: spacing.sm,
  },
  bannerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
  },
  bannerItemName: {
    fontSize: typography.sm,
    fontWeight: '500',
    color: colors.forest[800],
  },
  bannerItemComp: {
    fontSize: typography.xs,
    color: colors.gray[500],
  },
  bannerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
  approveButton: {
    padding: spacing.sm,
    backgroundColor: colors.forest[700],
    borderRadius: radius.sm,
  },
  rejectButton: {
    padding: spacing.sm,
    backgroundColor: colors.red[500],
    borderRadius: radius.sm,
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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.forest[800],
  },
  stepsContainer: {
    gap: spacing.sm + 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.forest[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: colors.white,
    fontSize: typography.xs,
    fontWeight: '700',
  },
  stepText: {
    fontSize: typography.sm,
    color: colors.gray[600],
    flex: 1,
    paddingTop: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm + 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.forest[800],
  },
  sectionLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionLinkText: {
    fontSize: typography.sm,
    color: colors.forest[600],
  },
  centerCard: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: typography.sm,
    color: colors.gray[400],
    marginBottom: spacing.sm + 2,
  },
  compList: {
    gap: spacing.sm,
  },
  compCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  compName: {
    fontSize: typography.base,
    fontWeight: '500',
    color: colors.forest[800],
  },
  compDate: {
    fontSize: typography.xs,
    color: colors.gray[400],
    marginTop: 2,
  },
  compBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  ownerBadge: {
    backgroundColor: colors.forest[50],
  },
  repBadge: {
    backgroundColor: colors.sand[50],
  },
  roleBadgeText: {
    fontSize: typography.xs,
    fontWeight: '500',
  },
  activeBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    backgroundColor: colors.forest[100],
    borderRadius: radius.full,
  },
  activeBadgeText: {
    fontSize: typography.xs,
    fontWeight: '500',
    color: colors.forest[700],
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  imageCard: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xs,
  },
  imageBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  errorText: {
    color: colors.red[500],
    fontSize: typography.sm,
    marginBottom: spacing.md,
  },
  flex1: {
    flex: 1,
  },
});
