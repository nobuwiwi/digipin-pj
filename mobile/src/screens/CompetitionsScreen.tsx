import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Trophy, Plus, Calendar, MapPin, Trash2, RefreshCw, Crown, ChevronRight } from 'lucide-react-native';
import { getCompetitions, deleteCompetition, ApiError } from '@/lib/api';
import type { CompetitionWithCount } from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { colors, spacing, radius, typography } from '@/theme';

interface CompetitionsScreenProps {
  deviceId: string;
  onOpenManage: (competitionId: string) => void;
  onOpenDetail: (competitionId: string) => void;
  onOpenCreate: () => void;
}

export function CompetitionsScreen({ deviceId, onOpenManage, onOpenDetail, onOpenCreate }: CompetitionsScreenProps) {
  const [owned, setOwned] = useState<CompetitionWithCount[]>([]);
  const [represented, setRepresented] = useState<CompetitionWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CompetitionWithCount | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getCompetitions(deviceId);
      setOwned(res.competitions ?? []);
      setRepresented(res.represented ?? []);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };

  const CompetitionCard = ({ comp, isOwned }: { comp: CompetitionWithCount; isOwned: boolean }) => {
    const imgCount = comp.evidence_images?.[0]?.count ?? 0;
    return (
      <TouchableOpacity
        style={styles.compCard}
        onPress={() => (isOwned ? onOpenManage(comp.id) : onOpenDetail(comp.id))}
        activeOpacity={0.7}
      >
        <View style={styles.compCardTop}>
          <View style={styles.flex1}>
            <View style={styles.compNameRow}>
              <Text style={styles.compName}>{comp.name}</Text>
              <View style={[styles.roleBadge, isOwned ? styles.ownerBadge : styles.repBadge]}>
                <Text style={[styles.roleBadgeText, isOwned ? { color: colors.forest[700] } : { color: colors.sand[700] }]}>
                  {isOwned ? '主催' : '代表'}
                </Text>
              </View>
            </View>
            <View style={styles.compMetaRow}>
              <View style={styles.compMetaItem}>
                <Calendar size={14} color={colors.gray[500]} />
                <Text style={styles.compMetaText}>{formatDate(comp.date)}</Text>
              </View>
              {comp.course_name ? (
                <View style={styles.compMetaItem}>
                  <MapPin size={14} color={colors.gray[500]} />
                  <Text style={styles.compMetaText}>{comp.course_name}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={[styles.statusBadge, comp.status === 'active' ? styles.statusActive : styles.statusEnded]}>
            <Text style={[styles.statusBadgeText, comp.status === 'active' ? { color: colors.forest[600] } : { color: colors.gray[500] }]}>
              {comp.status === 'active' ? '開催中' : '終了'}
            </Text>
          </View>
        </View>
        <View style={styles.compCardBottom}>
          <Text style={styles.imgCountText}>{imgCount}枚の証拠画像</Text>
          <View style={styles.compCardActions}>
            {isOwned && (
              <TouchableOpacity
                onPress={() => {
                  setDeleteTarget(comp);
                }}
                style={styles.deleteButton}
              >
                <Trash2 size={16} color={colors.gray[400]} />
              </TouchableOpacity>
            )}
            <ChevronRight size={20} color={colors.gray[300]} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCompetitions(); }} />}
    >
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Trophy size={20} color={colors.forest[800]} />
          <Text style={styles.headerTitle}>コンペ</Text>
        </View>
        <Button variant="primary" size="sm" onPress={onOpenCreate}>
          <Plus size={16} color={colors.white} />
          新規作成
        </Button>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <RefreshCw size={24} color={colors.forest[500]} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Button variant="outline" onPress={fetchCompetitions}>再読み込み</Button>
        </View>
      ) : owned.length === 0 && represented.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Trophy size={40} color={colors.forest[400]} />
          </View>
          <Text style={styles.emptyText}>コンペがまだありません</Text>
          <Button variant="primary" onPress={onOpenCreate}>
            コンペを作成
          </Button>
        </View>
      ) : (
        <>
          <View>
            <View style={styles.sectionTitleRow}>
              <Trophy size={16} color={colors.forest[700]} />
              <Text style={styles.sectionTitle}>主催コンペ</Text>
            </View>
            {owned.length === 0 ? (
              <View style={[styles.card, styles.centerCard]}>
                <Text style={styles.emptyText}>主催コンペがありません</Text>
                <Button variant="secondary" size="sm" onPress={onOpenCreate}>コンペを作成</Button>
              </View>
            ) : (
              <View style={styles.list}>
                {owned.map((comp) => (
                  <CompetitionCard key={comp.id} comp={comp} isOwned={true} />
                ))}
              </View>
            )}
          </View>

          <View>
            <View style={styles.sectionTitleRow}>
              <Crown size={16} color={colors.forest[700]} />
              <Text style={styles.sectionTitle}>代表コンペ</Text>
            </View>
            {represented.length === 0 ? (
              <View style={[styles.card, styles.centerCard]}>
                <Text style={styles.emptyText}>代表コンペがありません</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {represented.map((comp) => (
                  <CompetitionCard key={comp.id} comp={comp} isOwned={false} />
                ))}
              </View>
            )}
          </View>
        </>
      )}

      <Modal visible={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="コンペを削除">
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>
            「{deleteTarget?.name}」を削除しますか？{'\n'}
            このコンペの証拠画像もすべて削除されます。この操作は取り消せません。
          </Text>
          <View style={styles.modalButtons}>
            <Button variant="outline" onPress={() => setDeleteTarget(null)} style={styles.flex1}>キャンセル</Button>
            <Button variant="danger" onPress={() => deleteTarget && handleDelete(deleteTarget)} style={styles.flex1}>削除</Button>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.xl,
    fontWeight: '700',
    color: colors.forest[800],
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  centerCard: {
    alignItems: 'center',
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
  compCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  compCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm + 2,
  },
  compNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  compName: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.forest[800],
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  ownerBadge: {
    backgroundColor: colors.forest[100],
  },
  repBadge: {
    backgroundColor: colors.sand[100],
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
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
    fontSize: typography.xs,
    color: colors.gray[500],
  },
  statusBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusActive: {
    backgroundColor: colors.forest[50],
  },
  statusEnded: {
    backgroundColor: colors.gray[100],
  },
  statusBadgeText: {
    fontSize: typography.xs,
    fontWeight: '500',
  },
  compCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imgCountText: {
    fontSize: typography.xs,
    color: colors.gray[400],
  },
  compCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm + 2,
  },
  sectionTitle: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.forest[700],
  },
  list: {
    gap: spacing.sm + 2,
  },
  emptyIcon: {
    padding: spacing.md,
    backgroundColor: colors.forest[50],
    borderRadius: radius.xl,
  },
  emptyText: {
    fontSize: typography.sm,
    color: colors.gray[500],
  },
  errorText: {
    color: colors.red[500],
    fontSize: typography.sm,
  },
  flex1: {
    flex: 1,
  },
  modalContent: {
    gap: spacing.md,
  },
  modalText: {
    fontSize: typography.sm,
    color: colors.gray[600],
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
  },
});
