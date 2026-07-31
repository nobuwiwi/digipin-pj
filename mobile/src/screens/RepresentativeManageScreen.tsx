import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { ArrowLeft, Search, UserCheck, UserPlus, Clock, Check, X, RefreshCw } from 'lucide-react-native';
import {
  getRepresentatives,
  getFriends,
  searchAccounts,
  requestRepresentative,
  updateRepresentativeStatus,
  ApiError,
} from '@/lib/api';
import type { RepresentativeWithAccount, FriendWithAccount, RepresentativeStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, spacing, radius, typography } from '@/theme';

interface RepresentativeManageScreenProps {
  deviceId: string;
  competitionId: string;
  onBack: () => void;
}

export function RepresentativeManageScreen({ deviceId, competitionId, onBack }: RepresentativeManageScreenProps) {
  const [representatives, setRepresentatives] = useState<RepresentativeWithAccount[]>([]);
  const [friends, setFriends] = useState<FriendWithAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ device_id: string; account_name: string }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [repRes, friendRes] = await Promise.all([
        getRepresentatives(deviceId, competitionId),
        getFriends(deviceId),
      ]);
      setRepresentatives(repRes.representatives ?? []);
      setFriends(friendRes.friends ?? []);
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    setSearchLoading(true);
    setHasSearched(true);
    setError('');
    try {
      const res = await searchAccounts(deviceId, searchQuery.trim());
      setSearchResults(res.accounts ?? []);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRequest = async (targetDeviceId: string) => {
    setActionLoading(targetDeviceId);
    try {
      await requestRepresentative(deviceId, competitionId, targetDeviceId);
      await fetchData();
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (repId: string, status: RepresentativeStatus) => {
    setActionLoading(repId);
    try {
      await updateRepresentativeStatus(deviceId, repId, status);
      await fetchData();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
    } finally {
      setActionLoading(null);
    }
  };

  const approvedReps = representatives.filter((r) => r.status === 'approved');
  const pendingReps = representatives.filter((r) => r.status === 'pending');
  const rejectedReps = representatives.filter((r) => r.status === 'rejected');
  const repDeviceIds = new Set(representatives.map((r) => r.representative_id));
  const candidates = friends.filter((f) => !repDeviceIds.has(f.device_id));

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.forest[500]} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.forest[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>代表者招待</Text>
        <TouchableOpacity onPress={fetchData} style={styles.refreshButton}>
          <RefreshCw size={16} color={colors.forest[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Search Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>アカウント名検索</Text>
          <View style={styles.searchRow}>
            <View style={styles.flex1}>
              <Input
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="アカウント名で検索"
              />
            </View>
            <Button variant="outline" onPress={handleSearch} disabled={!searchQuery.trim()}>
              <Search size={16} color={colors.forest[700]} />
            </Button>
          </View>

          {searchLoading ? (
            <View style={styles.searchLoadingRow}>
              <ActivityIndicator size="small" color={colors.forest[500]} />
              <Text style={styles.searchLoadingText}>検索中...</Text>
            </View>
          ) : null}

          {!searchLoading && hasSearched && searchResults.length === 0 ? (
            <Text style={styles.searchEmptyText}>
              「{searchQuery}」に一致するアカウントが見つかりませんでした
            </Text>
          ) : null}

          {!searchLoading && searchResults.length > 0 ? (
            <View style={styles.searchResults}>
              {searchResults.map((account) => {
                const alreadyRep = representatives.find((r) => r.representative_id === account.device_id);
                return (
                  <View key={account.device_id} style={styles.searchResultItem}>
                    <Text style={styles.searchResultName}>{account.account_name}</Text>
                    {alreadyRep ? (
                      <Text style={styles.alreadyRepText}>
                        {alreadyRep.status === 'approved' ? '承認済み' : alreadyRep.status === 'pending' ? '申請中' : '拒否済み'}
                      </Text>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onPress={() => handleRequest(account.device_id)}
                        loading={actionLoading === account.device_id}
                      >
                        申請
                      </Button>
                    )}
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>

        {/* Approved Representatives */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <UserCheck size={16} color={colors.forest[600]} />
            <Text style={styles.cardTitle}>代表者一覧</Text>
          </View>
          {approvedReps.length === 0 ? (
            <Text style={styles.emptyText}>代表者がいません</Text>
          ) : (
            <View style={styles.repList}>
              {approvedReps.map((rep) => (
                <View key={rep.id} style={styles.repItem}>
                  <Text style={styles.repName}>{rep.accounts?.account_name ?? '不明'}</Text>
                  <View style={styles.approvedBadge}>
                    <Text style={styles.approvedBadgeText}>承認済み</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Pending Requests */}
        {pendingReps.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Clock size={16} color={colors.amber[500]} />
              <Text style={styles.cardTitle}>申請中</Text>
            </View>
            <View style={styles.repList}>
              {pendingReps.map((rep) => (
                <View key={rep.id} style={styles.pendingItem}>
                  <Text style={styles.repName}>{rep.accounts?.account_name ?? '不明'}</Text>
                  <View style={styles.pendingActions}>
                    <TouchableOpacity
                      onPress={() => handleUpdateStatus(rep.id, 'approved')}
                      disabled={actionLoading === rep.id}
                      style={styles.approveButton}
                    >
                      <Check size={16} color={colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleUpdateStatus(rep.id, 'rejected')}
                      disabled={actionLoading === rep.id}
                      style={styles.rejectButton}
                    >
                      <X size={16} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Rejected */}
        {rejectedReps.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>拒否済み</Text>
            <View style={styles.repList}>
              {rejectedReps.map((rep) => (
                <View key={rep.id} style={styles.rejectedItem}>
                  <Text style={styles.rejectedName}>{rep.accounts?.account_name ?? '不明'}</Text>
                  <Text style={styles.rejectedText}>拒否</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Friends candidates */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>代表者候補（フレンド）</Text>
          {candidates.length === 0 ? (
            <Text style={styles.emptyText}>
              フレンドがいません。アカウント名検索から代表者申請を行ってください。
            </Text>
          ) : (
            <View style={styles.repList}>
              {candidates.map((friend) => (
                <View key={friend.device_id} style={styles.searchResultItem}>
                  <Text style={styles.searchResultName}>{friend.account_name}</Text>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => handleRequest(friend.device_id)}
                    loading={actionLoading === friend.device_id}
                  >
                    申請
                  </Button>
                </View>
              ))}
            </View>
          )}
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
    flex: 1,
  },
  refreshButton: {
    padding: spacing.sm,
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
  cardTitle: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.forest[800],
    marginBottom: spacing.sm + 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm + 2,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  searchLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  searchLoadingText: {
    fontSize: typography.sm,
    color: colors.forest[600],
  },
  searchEmptyText: {
    fontSize: typography.sm,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: spacing.md,
  },
  searchResults: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm + 2,
    backgroundColor: colors.forest[50],
    borderRadius: radius.md,
  },
  searchResultName: {
    fontSize: typography.sm,
    fontWeight: '500',
    color: colors.forest[800],
  },
  alreadyRepText: {
    fontSize: typography.xs,
    color: colors.gray[500],
  },
  repList: {
    gap: spacing.sm,
  },
  repItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm + 2,
    backgroundColor: colors.forest[50],
    borderRadius: radius.md,
  },
  repName: {
    fontSize: typography.sm,
    fontWeight: '500',
    color: colors.forest[800],
  },
  approvedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.forest[100],
    borderRadius: radius.full,
  },
  approvedBadgeText: {
    fontSize: typography.xs,
    color: colors.forest[600],
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm + 2,
    backgroundColor: colors.amber[50],
    borderRadius: radius.md,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  rejectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm + 2,
    backgroundColor: colors.gray[50],
    borderRadius: radius.md,
  },
  rejectedName: {
    fontSize: typography.sm,
    fontWeight: '500',
    color: colors.gray[500],
  },
  rejectedText: {
    fontSize: typography.xs,
    color: colors.gray[400],
  },
  emptyText: {
    fontSize: typography.sm,
    color: colors.gray[400],
    textAlign: 'center',
    paddingVertical: spacing.md,
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
  flex1: {
    flex: 1,
  },
});
