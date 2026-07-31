import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import {
  ArrowLeft,
  Trophy,
  Target,
  Image as ImageIcon,
  Camera,
  Check,
  AlertCircle,
  User,
  RefreshCw,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  getCompetitionFull,
  checkRepresentative,
  createEvidence,
  ApiError,
} from '@/lib/api';
import type { Competition } from '@/types';
import { Button } from '@/components/ui/Button';
import { colors, spacing, radius, typography } from '@/theme';

interface EvidenceRegisterScreenProps {
  deviceId: string;
  competitionId: string;
  holeNumber: number;
  awardType: string;
  repNames?: string[];
  onBack: () => void;
  onUploaded?: () => void;
}

type Step = 'select' | 'confirm' | 'uploading' | 'done' | 'error';

export function EvidenceRegisterScreen({
  deviceId,
  competitionId,
  holeNumber,
  awardType,
  repNames = [],
  onBack,
  onUploaded,
}: EvidenceRegisterScreenProps) {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>('select');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [compRes, repRes] = await Promise.all([
        getCompetitionFull(deviceId, competitionId),
        checkRepresentative(deviceId, competitionId),
      ]);
      setCompetition(compRes.competition);
      setIsAuthorized(repRes.isRepresentative || repRes.isOwner);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  }, [deviceId, competitionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setUploadError('ギャラリーへのアクセス許可が必要です');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setUploadError('');
      setStep('confirm');
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setUploadError('カメラへのアクセス許可が必要です');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setUploadError('');
      setStep('confirm');
    }
  };

  const handleUpload = async () => {
    if (!imageUri) return;
    setStep('uploading');
    setUploadError('');
    try {
      await createEvidence(deviceId, {
        competition_id: competitionId,
        award_type: awardType,
        imageUri,
        hole_number: holeNumber,
      });
      setStep('done');
      onUploaded?.();
    } catch (err) {
      const apiErr = err as ApiError;
      setUploadError(apiErr.message);
      setStep('error');
    }
  };

  const handleReset = () => {
    setImageUri(null);
    setUploadError('');
    setStep('select');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const awardLabel = awardType === 'drancon' ? 'ドラコン' : 'ニアピン';
  const AwardIcon = awardType === 'drancon' ? Trophy : Target;

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

  // Not authorized
  if (authChecked && !isAuthorized) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={20} color={colors.forest[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>証拠画像登録</Text>
        </View>
        <View style={[styles.content, styles.center]}>
          <View style={styles.card}>
            <View style={styles.warnIconBox}>
              <AlertCircle size={40} color={colors.amber[500]} />
            </View>
            <Text style={styles.warnTitle}>登録権限がありません</Text>
            <Text style={styles.warnText}>
              このQRコードの代表者リストにあなたが含まれていないため、証拠画像を登録できません。
            </Text>
            <View style={styles.repsSection}>
              <Text style={styles.repsLabelText}>このホールの代表者:</Text>
              <View style={styles.repsList}>
                {repNames.length > 0 ? (
                  repNames.map((name, i) => (
                    <View key={i} style={styles.repChip}>
                      <User size={12} color={colors.forest[700]} />
                      <Text style={styles.repChipText}>{name}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.repsEmpty}>代表者が登録されていません</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Done state
  if (step === 'done') {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>証拠画像登録</Text>
        </View>
        <View style={[styles.content, styles.center]}>
          <View style={styles.card}>
            <View style={styles.doneIconBox}>
              <Check size={48} color={colors.forest[600]} />
            </View>
            <Text style={styles.doneTitle}>アップロード完了</Text>
            <Text style={styles.doneText}>証拠画像が正常に登録されました。</Text>
            <Button variant="primary" onPress={onBack}>確認画面に戻る</Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.forest[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>証拠画像登録</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Competition & Hole Info */}
        <View style={styles.card}>
          <View style={styles.compInfoRow}>
            <View style={[styles.awardIconBox, { backgroundColor: awardType === 'drancon' ? colors.forest[50] : colors.sand[50] }]}>
              <AwardIcon size={24} color={awardType === 'drancon' ? colors.forest[600] : colors.sand[600]} />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.compName}>{competition.name}</Text>
              <Text style={styles.compDate}>{formatDate(competition.date)}</Text>
              {competition.course_name ? <Text style={styles.compDate}>{competition.course_name}</Text> : null}
            </View>
          </View>
          <View style={styles.holeInfoRow}>
            <View style={styles.holeBadge}>
              <Text style={styles.holeBadgeText}>{holeNumber}番ホール</Text>
            </View>
            <View style={[styles.awardBadge, { backgroundColor: awardType === 'drancon' ? colors.forest[50] : colors.sand[50] }]}>
              <Text style={[styles.awardBadgeText, { color: awardType === 'drancon' ? colors.forest[700] : colors.sand[700] }]}>
                {awardLabel}賞
              </Text>
            </View>
          </View>

          {repNames.length > 0 ? (
            <View style={styles.repsSection}>
              <View style={styles.repsLabelRow}>
                <User size={12} color={colors.gray[400]} />
                <Text style={styles.repsLabelText}>代表者</Text>
              </View>
              <View style={styles.repsList}>
                {repNames.map((name, i) => (
                  <View key={i} style={[styles.repChip, (name === '自分' || i === 0) ? { backgroundColor: colors.forest[50] } : { backgroundColor: colors.gray[50] }]}>
                    <Text style={[styles.repChipText, (name === '自分' || i === 0) ? { color: colors.forest[700] } : { color: colors.gray[600] }]}>
                      {name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        {/* Select step */}
        {step === 'select' && (
          <View style={styles.card}>
            <Text style={styles.selectTitle}>画像の登録方法を選択</Text>
            <View style={styles.selectOptions}>
              <TouchableOpacity onPress={pickFromGallery} style={[styles.selectButton, { backgroundColor: colors.forest[50] }]} activeOpacity={0.7}>
                <View style={styles.selectIconBox}>
                  <ImageIcon size={24} color={colors.forest[600]} />
                </View>
                <View>
                  <Text style={styles.selectButtonTitle}>ギャラリーから選択</Text>
                  <Text style={styles.selectButtonSub}>保存済みの画像から選択</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={takePhoto} style={[styles.selectButton, { backgroundColor: colors.sand[50] }]} activeOpacity={0.7}>
                <View style={styles.selectIconBox}>
                  <Camera size={24} color={colors.sand[600]} />
                </View>
                <View>
                  <Text style={styles.selectButtonTitle}>新しく撮影</Text>
                  <Text style={styles.selectButtonSub}>カメラを起動して撮影</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Confirm step */}
        {(step === 'confirm' || step === 'uploading') && imageUri ? (
          <View style={styles.card}>
            <View style={styles.confirmHeader}>
              <Check size={16} color={colors.forest[600]} />
              <Text style={styles.confirmTitle}>登録内容の確認</Text>
            </View>

            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            </View>

            <View style={styles.confirmInfo}>
              <View style={styles.confirmInfoRow}>
                <Text style={styles.confirmInfoLabel}>コンペ</Text>
                <Text style={styles.confirmInfoValue}>{competition.name}</Text>
              </View>
              <View style={styles.confirmInfoRow}>
                <Text style={styles.confirmInfoLabel}>ホール</Text>
                <Text style={styles.confirmInfoValue}>{holeNumber}番</Text>
              </View>
              <View style={styles.confirmInfoRow}>
                <Text style={styles.confirmInfoLabel}>賞の種類</Text>
                <Text style={[styles.confirmInfoValue, { color: awardType === 'drancon' ? colors.forest[700] : colors.sand[700] }]}>
                  {awardLabel}賞
                </Text>
              </View>
            </View>

            {step === 'confirm' && (
              <View style={styles.confirmButtons}>
                <Button variant="outline" style={styles.flex1} onPress={handleReset}>キャンセル</Button>
                <Button variant="primary" style={styles.flex1} onPress={handleUpload}>アップロード</Button>
              </View>
            )}

            {step === 'uploading' && (
              <View style={styles.uploadingRow}>
                <ActivityIndicator size="small" color={colors.forest[500]} />
                <Text style={styles.uploadingText}>アップロード中...</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Error step */}
        {step === 'error' && (
          <View style={[styles.card, { borderColor: colors.red[100] }]}>
            <View style={styles.errorHeader}>
              <AlertCircle size={20} color={colors.red[500]} />
              <Text style={styles.errorTitle}>アップロードエラー</Text>
            </View>
            <Text style={styles.errorBodyText}>{uploadError}</Text>
            <View style={styles.confirmButtons}>
              <Button variant="outline" style={styles.flex1} onPress={onBack}>戻る</Button>
              <Button variant="primary" style={styles.flex1} onPress={handleReset}>再選択</Button>
            </View>
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
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  compInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
    marginBottom: spacing.sm + 2,
    alignSelf: 'stretch',
  },
  awardIconBox: {
    padding: spacing.sm + 2,
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
  holeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    alignSelf: 'stretch',
  },
  holeBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.gray[50],
    borderRadius: radius.md,
  },
  holeBadgeText: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.gray[700],
  },
  awardBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
  },
  awardBadgeText: {
    fontSize: typography.sm,
    fontWeight: '700',
  },
  repsSection: {
    paddingTop: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    alignSelf: 'stretch',
  },
  repsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  repsLabelText: {
    fontSize: typography.xs,
    color: colors.gray[400],
  },
  repsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  repChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  repChipText: {
    fontSize: typography.xs,
    fontWeight: '500',
  },
  repsEmpty: {
    fontSize: typography.xs,
    color: colors.gray[400],
  },
  selectTitle: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.forest[800],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  selectOptions: {
    gap: spacing.sm + 2,
    alignSelf: 'stretch',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  selectIconBox: {
    padding: spacing.sm + 2,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectButtonTitle: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.forest[800],
  },
  selectButtonSub: {
    fontSize: typography.xs,
    color: colors.gray[500],
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  confirmTitle: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.forest[800],
  },
  previewContainer: {
    alignSelf: 'stretch',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
  },
  confirmInfo: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  confirmInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmInfoLabel: {
    fontSize: typography.sm,
    color: colors.gray[500],
  },
  confirmInfoValue: {
    fontSize: typography.sm,
    fontWeight: '500',
    color: colors.forest[800],
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    alignSelf: 'stretch',
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  uploadingText: {
    fontSize: typography.sm,
    color: colors.forest[600],
  },
  warnIconBox: {
    padding: spacing.md,
    backgroundColor: colors.amber[50],
    borderRadius: radius.xl,
  },
  warnTitle: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.forest[800],
    marginBottom: spacing.sm,
  },
  warnText: {
    fontSize: typography.sm,
    color: colors.gray[500],
    textAlign: 'center',
  },
  doneIconBox: {
    padding: spacing.md,
    backgroundColor: colors.forest[50],
    borderRadius: radius.xl,
  },
  doneTitle: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: colors.forest[800],
    marginBottom: spacing.sm,
  },
  doneText: {
    fontSize: typography.sm,
    color: colors.gray[500],
    marginBottom: spacing.sm,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  errorTitle: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.red[700],
  },
  errorBodyText: {
    fontSize: typography.sm,
    color: colors.gray[600],
    alignSelf: 'stretch',
  },
  errorText: {
    color: colors.red[500],
    fontSize: typography.sm,
  },
  flex1: {
    flex: 1,
  },
});
