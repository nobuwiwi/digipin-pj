import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Image, FlatList } from 'react-native';
import {
  Image as ImageIcon,
  Camera,
  Trophy,
  Target,
  RefreshCw,
  User,
  Calendar,
} from 'lucide-react-native';
import {
  getCompetitions,
  getEvidenceByCompetition,
  getCompetitionFull,
  ApiError,
} from '@/lib/api';
import type {
  EvidenceImageWithRelations,
  CompetitionWithCount,
  CompetitionHole,
} from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { colors, spacing, radius, typography } from '@/theme';

interface EvidenceListScreenProps {
  deviceId: string;
  onUpload?: (competitionId: string, holeNumber: number, awardType: string) => void;
}

export function EvidenceListScreen({ deviceId, onUpload }: EvidenceListScreenProps) {
  const [competitions, setCompetitions] = useState<CompetitionWithCount[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [images, setImages] = useState<EvidenceImageWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<EvidenceImageWithRelations | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadHoles, setUploadHoles] = useState<CompetitionHole[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedUploadHole, setSelectedUploadHole] = useState<number | null>(null);
  const [selectedUploadAward, setSelectedUploadAward] = useState<string>('');
  const [selectedHole, setSelectedHole] = useState<number | 'all'>('all');

  const fetchCompetitions = useCallback(async () => {
    try {
      const res = await getCompetitions(deviceId);
      const owned = res.competitions ?? [];
      const represented = res.represented ?? [];
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
    setError('');
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

  const compHoles = competitions.find((c) => c.id === selectedCompId)?.competition_holes ?? [];
  const awardedHoles = compHoles.filter((h) => h.award_type === 'drancon' || h.award_type === 'nearpin');

  const availableHoles = Array.from(
    new Set(images.map((img) => img.hole_number).filter((h): h is number => h !== null)),
  ).sort((a, b) => a - b);

  const filteredImages = selectedHole === 'all'
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
      const awarded = (res.holes ?? []).filter((h) => h.award_type === 'drancon' || h.award_type === 'nearpin');
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
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <ImageIcon size={20} color={colors.forest[800]} />
          <Text style={styles.headerTitle}>証拠画像</Text>
        </View>
        {onUpload && (
          <Button variant="primary" size="sm" onPress={handleOpenUpload}>
            <Camera size={16} color={colors.white} />
            画像登録
          </Button>
        )}
      </View>

      {competitions.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <ImageIcon size={40} color={colors.forest[400]} />
          </View>
          <Text style={styles.emptyText}>コンペがありません</Text>
        </View>
      ) : (
        <>
          {/* Competition selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
            {competitions.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => { setSelectedCompId(c.id); setSelectedHole('all'); }}
                style={[styles.compTab, selectedCompId === c.id && styles.compTabActive]}
              >
                <Text style={[styles.compTabText, selectedCompId === c.id && styles.compTabTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Hole tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
            <TouchableOpacity
              onPress={() => setSelectedHole('all')}
              style={[styles.holeTab, selectedHole === 'all' && styles.holeTabActive]}
            >
              <Text style={[styles.holeTabText, selectedHole === 'all' && styles.holeTabTextActive]}>すべて</Text>
            </TouchableOpacity>
            {awardedHoles.map((h) => (
              <TouchableOpacity
                key={h.id}
                onPress={() => setSelectedHole(h.hole_number)}
                style={[styles.holeTab, selectedHole === h.hole_number && (h.award_type === 'drancon' ? styles.holeTabDrancon : styles.holeTabNearpin)]}
              >
                {h.award_type === 'drancon' ? <Trophy size={12} color={colors.forest[700]} /> : <Target size={12} color={colors.sand[700]} />}
                <Text style={styles.holeTabText}>{h.hole_number}H</Text>
              </TouchableOpacity>
            ))}
            {availableHoles
              .filter((hNum) => !awardedHoles.some((ah) => ah.hole_number === hNum))
              .map((hNum) => (
                <TouchableOpacity
                  key={`img-${hNum}`}
                  onPress={() => setSelectedHole(hNum)}
                  style={[styles.holeTab, selectedHole === hNum && styles.holeTabActive]}
                >
                  <Text style={styles.holeTabText}>{hNum}H</Text>
                </TouchableOpacity>
              ))}
          </ScrollView>

          {/* Content */}
          {loading ? (
            <View style={styles.center}>
              <RefreshCw size={24} color={colors.forest[500]} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>{error}</Text>
              <Button variant="outline" onPress={fetchImages}>再読み込み</Button>
            </View>
          ) : filteredImages.length === 0 ? (
            <View style={styles.center}>
              <View style={styles.emptyIcon}>
                <ImageIcon size={40} color={colors.forest[400]} />
              </View>
              <Text style={styles.emptyText}>
                {selectedHole === 'all' ? '証拠画像がまだありません' : `${selectedHole}番ホールの画像がありません`}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredImages}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={styles.gridRow}
              renderItem={({ item: img }: { item: EvidenceImageWithRelations }) => (
                <TouchableOpacity style={styles.imageCard} onPress={() => setPreviewImage(img)} activeOpacity={0.8}>
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: img.image_url }} style={styles.image} resizeMode="cover" />
                    <View style={styles.imageBadge}>
                      <View style={[styles.imageBadgeInner, { backgroundColor: img.award_type === 'drancon' ? colors.forest[700] : colors.sand[500] }]}>
                        {img.award_type === 'drancon' ? <Trophy size={12} color={colors.white} /> : <Target size={12} color={colors.white} />}
                        <Text style={styles.imageBadgeText}>
                          {img.award_type === 'drancon' ? 'ドラコン' : 'ニアピン'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.imageInfo}>
                    <View style={styles.imageInfoUser}>
                      <User size={12} color={colors.gray[400]} />
                      <Text style={styles.imageInfoName} numberOfLines={1}>
                        {img.accounts?.account_name ?? '不明'}
                      </Text>
                    </View>
                    <View style={styles.imageInfoMeta}>
                      {img.hole_number && <Text style={styles.imageInfoMetaText}>{img.hole_number}H</Text>}
                      {img.hole_number && img.distance && <Text style={styles.imageInfoMetaText}>/</Text>}
                      {img.distance && <Text style={styles.imageInfoMetaText}>{img.distance}m</Text>}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}

      {/* Preview Modal */}
      <Modal visible={!!previewImage} onClose={() => setPreviewImage(null)}>
        {previewImage && (
          <View style={styles.previewContent}>
            <Image source={{ uri: previewImage.image_url }} style={styles.previewImage} resizeMode="contain" />
            <View style={styles.previewInfoRow}>
              <View style={[styles.previewBadge, { backgroundColor: previewImage.award_type === 'drancon' ? colors.forest[700] : colors.sand[500] }]}>
                {previewImage.award_type === 'drancon' ? <Trophy size={12} color={colors.white} /> : <Target size={12} color={colors.white} />}
                <Text style={styles.previewBadgeText}>
                  {previewImage.award_type === 'drancon' ? 'ドラコン賞' : 'ニアピン賞'}
                </Text>
              </View>
              <Text style={styles.previewCompName}>{previewImage.competitions?.name}</Text>
            </View>
            <View style={styles.previewDetails}>
              <View style={styles.previewDetailRow}>
                <User size={14} color={colors.gray[400]} />
                <Text style={styles.previewDetailText}>{previewImage.accounts?.account_name ?? '不明なユーザー'}</Text>
              </View>
              {previewImage.competitions && (
                <View style={styles.previewDetailRow}>
                  <Calendar size={14} color={colors.gray[400]} />
                  <Text style={styles.previewDetailText}>
                    {formatDate(previewImage.competitions.date)}
                    {previewImage.competitions?.course_name ? ` @ ${previewImage.competitions.course_name}` : ''}
                  </Text>
                </View>
              )}
              {previewImage.hole_number && <Text style={styles.previewDetailText}>ホール: {previewImage.hole_number}番</Text>}
              {previewImage.distance && (
                <Text style={styles.previewDetailText}>
                  {previewImage.award_type === 'drancon' ? '飛距離' : '残り距離'}: {previewImage.distance}m
                </Text>
              )}
              {previewImage.memo && <Text style={styles.previewDetailText}>メモ: {previewImage.memo}</Text>}
            </View>
          </View>
        )}
      </Modal>

      {/* Upload Selection Modal */}
      <Modal visible={uploadModalOpen} onClose={() => setUploadModalOpen(false)}>
        <View style={styles.uploadContent}>
          <View style={styles.uploadHeader}>
            <Camera size={20} color={colors.forest[600]} />
            <Text style={styles.uploadTitle}>証拠画像を登録</Text>
          </View>
          {(() => {
            const comp = competitions.find((c) => c.id === selectedCompId);
            return comp ? (
              <View style={styles.uploadCompInfo}>
                <Trophy size={16} color={colors.forest[600]} />
                <View style={styles.flex1}>
                  <Text style={styles.uploadCompName}>{comp.name}</Text>
                  <Text style={styles.uploadCompDate}>{formatDate(comp.date)}{comp.course_name ? ` @ ${comp.course_name}` : ''}</Text>
                </View>
              </View>
            ) : null;
          })()}
          {uploadLoading ? (
            <View style={styles.center}>
              <RefreshCw size={24} color={colors.forest[500]} />
            </View>
          ) : uploadHoles.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>このコンペにはホール設定がありません。</Text>
              <Text style={styles.uploadSubText}>コンペ主催者がホールと賞を設定する必要があります。</Text>
            </View>
          ) : (
            <>
              <Text style={styles.uploadLabel}>ホールと賞を選択</Text>
              <View style={styles.uploadGrid}>
                {uploadHoles.map((h) => {
                  const isSelected = selectedUploadHole === h.hole_number && selectedUploadAward === h.award_type;
                  return (
                    <TouchableOpacity
                      key={h.id}
                      onPress={() => { setSelectedUploadHole(h.hole_number); setSelectedUploadAward(h.award_type); }}
                      style={[
                        styles.uploadHoleButton,
                        isSelected && (h.award_type === 'drancon' ? { backgroundColor: colors.forest[700] } : { backgroundColor: colors.sand[600] }),
                      ]}
                    >
                      {h.award_type === 'drancon' ? <Trophy size={16} color={isSelected ? colors.white : colors.forest[600]} /> : <Target size={16} color={isSelected ? colors.white : colors.sand[600]} />}
                      <Text style={[styles.uploadHoleText, isSelected && { color: colors.white }]}>{h.hole_number}H</Text>
                      <Text style={[styles.uploadHoleSubText, isSelected && { color: colors.white }]}>
                        {h.award_type === 'drancon' ? 'ドラコン' : 'ニアピン'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.uploadButtons}>
                <Button variant="outline" style={styles.flex1} onPress={() => setUploadModalOpen(false)}>キャンセル</Button>
                <Button
                  variant="primary"
                  style={styles.flex1}
                  onPress={handleConfirmUpload}
                  disabled={selectedUploadHole === null || !selectedUploadAward}
                >
                  登録へ進む
                </Button>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.forest[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
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
  tabsScroll: {
    maxHeight: 50,
  },
  tabsContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  compTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  compTabActive: {
    backgroundColor: colors.forest[700],
    borderColor: colors.forest[700],
  },
  compTabText: {
    fontSize: typography.sm,
    fontWeight: '500',
    color: colors.gray[500],
  },
  compTabTextActive: {
    color: colors.white,
  },
  holeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  holeTabActive: {
    backgroundColor: colors.forest[100],
    borderColor: colors.forest[200],
  },
  holeTabDrancon: {
    backgroundColor: colors.forest[100],
    borderColor: colors.forest[200],
  },
  holeTabNearpin: {
    backgroundColor: colors.sand[100],
    borderColor: colors.sand[200],
  },
  holeTabText: {
    fontSize: typography.xs,
    fontWeight: '500',
    color: colors.gray[400],
  },
  holeTabTextActive: {
    color: colors.forest[700],
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
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
  },
  errorText: {
    color: colors.red[500],
    fontSize: typography.sm,
  },
  grid: {
    padding: spacing.md,
  },
  gridRow: {
    gap: spacing.sm + 2,
    marginBottom: spacing.sm + 2,
  },
  imageCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: colors.gray[100],
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  imageBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  imageBadgeText: {
    color: colors.white,
    fontSize: typography.xs,
    fontWeight: '700',
  },
  imageInfo: {
    padding: spacing.sm + 2,
  },
  imageInfoUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  imageInfoName: {
    fontSize: typography.xs,
    fontWeight: '500',
    color: colors.forest[800],
    flex: 1,
  },
  imageInfoMeta: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  imageInfoMetaText: {
    fontSize: typography.xs,
    color: colors.gray[400],
  },
  previewContent: {
    gap: spacing.sm + 2,
  },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: radius.md,
  },
  previewInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  previewBadgeText: {
    color: colors.white,
    fontSize: typography.xs,
    fontWeight: '700',
  },
  previewCompName: {
    fontSize: typography.sm,
    fontWeight: '500',
    color: colors.forest[800],
  },
  previewDetails: {
    gap: spacing.xs,
  },
  previewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewDetailText: {
    fontSize: typography.sm,
    color: colors.gray[500],
  },
  uploadContent: {
    gap: spacing.md,
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  uploadTitle: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.forest[800],
  },
  uploadCompInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.forest[50],
    borderRadius: radius.md,
    padding: spacing.sm + 2,
  },
  uploadCompName: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.forest[800],
  },
  uploadCompDate: {
    fontSize: typography.xs,
    color: colors.gray[500],
  },
  uploadSubText: {
    fontSize: typography.xs,
    color: colors.gray[400],
  },
  uploadLabel: {
    fontSize: typography.xs,
    color: colors.gray[500],
  },
  uploadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  uploadHoleButton: {
    width: '31%',
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  uploadHoleText: {
    fontSize: typography.sm,
    fontWeight: '500',
    color: colors.gray[600],
  },
  uploadHoleSubText: {
    fontSize: typography.xs,
    color: colors.gray[400],
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
  },
  flex1: {
    flex: 1,
  },
});
