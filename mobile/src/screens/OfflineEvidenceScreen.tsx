import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import {
  WifiOff,
  QrCode,
  Camera,
  ImageIcon,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Trophy,
  Target,
  FileText,
  Info,
} from 'lucide-react-native';
import {
  addOfflineEvidence,
  getOfflineEvidenceQueue,
  removeOfflineEvidence,
  type OfflineEvidenceItem,
} from '@/lib/offlineStore';
import { Button } from '@/components/ui/Button';
import { colors, spacing, radius, typography } from '@/theme';

interface OfflineEvidenceScreenProps {
  onRetryOnline: () => void;
}

interface ScannedQRInfo {
  competition_id: string;
  hole_number?: number;
  award_type: string;
  reps?: string[];
  rawText: string;
}

export function OfflineEvidenceScreen({ onRetryOnline }: OfflineEvidenceScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scannedInfo, setScannedInfo] = useState<ScannedQRInfo | null>(null);
  const [imageUri, setImageUri] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [queue, setQueue] = useState<OfflineEvidenceItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const loadQueue = useCallback(async () => {
    const q = await getOfflineEvidenceQueue();
    setQueue(q);
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const parseQRCodeData = (data: string): ScannedQRInfo | null => {
    try {
      let search = '';
      if (data.includes('?')) {
        search = data.substring(data.indexOf('?'));
      } else if (data.startsWith('http://') || data.startsWith('https://')) {
        try {
          const url = new URL(data);
          search = url.search;
        } catch {
          search = '?' + data;
        }
      } else {
        search = '?' + data;
      }

      const params = new URLSearchParams(search);
      const competition_id = params.get('competition_id');
      const award_type = params.get('award_type') || 'none';
      const holeStr = params.get('hole_number');
      const repsStr = params.get('reps');

      if (competition_id) {
        return {
          competition_id,
          hole_number: holeStr ? parseInt(holeStr, 10) : undefined,
          award_type,
          reps: repsStr ? repsStr.split(',').filter(Boolean) : undefined,
          rawText: data,
        };
      }

      try {
        const json = JSON.parse(data);
        if (json.competition_id) {
          return {
            competition_id: json.competition_id,
            hole_number: json.hole_number ? Number(json.hole_number) : undefined,
            award_type: json.award_type || 'none',
            reps: Array.isArray(json.reps) ? json.reps : undefined,
            rawText: data,
          };
        }
      } catch {}

      return null;
    } catch {
      return null;
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    const parsed = parseQRCodeData(data);
    if (parsed) {
      setScannedInfo(parsed);
      setScanning(false);
      setSuccessMessage('QRコードからコンペ・ホール情報を読み込みました。');
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      Alert.alert('無効なQRコード', 'コンペ情報が含まれる対象のQRコードではありません。');
    }
  };

  const pickImageFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      setImageUri(res.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      setImageUri(res.assets[0].uri);
    }
  };

  const handleSaveToOfflineQueue = async () => {
    if (!scannedInfo) {
      Alert.alert('エラー', '先にQRコードをスキャンして対象コンペを選択してください。');
      return;
    }
    if (!imageUri) {
      Alert.alert('エラー', '証拠画像を撮影または選択してください。');
      return;
    }

    setSaving(true);
    try {
      await addOfflineEvidence({
        competition_id: scannedInfo.competition_id,
        award_type: scannedInfo.award_type,
        hole_number: scannedInfo.hole_number,
        memo: memo.trim() || undefined,
        imageUri,
        reps: scannedInfo.reps,
      });

      // Clear form
      setImageUri('');
      setMemo('');
      setScannedInfo(null);
      await loadQueue();

      setSuccessMessage('ローカル（オフラインキュー）に証拠画像を一時保存しました！');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      Alert.alert('保存エラー', 'ローカル保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQueueItem = async (id: string) => {
    Alert.alert('削除確認', 'この未送信データをローカルから削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await removeOfflineEvidence(id);
          await loadQueue();
        },
      },
    ]);
  };

  const getAwardLabel = (type: string) => {
    if (type === 'drancon') return 'ドラコン賞';
    if (type === 'nearpin') return 'ニアピン賞';
    return 'コンペ賞品';
  };

  return (
    <View style={styles.screen}>
      {/* Offline Status Header */}
      <View style={styles.banner}>
        <View style={styles.bannerRow}>
          <WifiOff size={22} color={colors.white} />
          <View style={styles.flex1}>
            <Text style={styles.bannerTitle}>オフラインモード</Text>
            <Text style={styles.bannerSubText}>
              起動時オフラインを検知しました。QR読み取りとローカル一時保存が可能です。
            </Text>
          </View>
          <TouchableOpacity onPress={onRetryOnline} style={styles.retryChip}>
            <RefreshCw size={14} color={colors.forest[700]} />
            <Text style={styles.retryChipText}>再試行</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {successMessage ? (
          <View style={styles.successBox}>
            <CheckCircle2 size={20} color={colors.forest[700]} />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {/* Step 1: Scan QR Code */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>STEP 1</Text>
            </View>
            <Text style={styles.cardTitle}>コンペQRコードの読み取り</Text>
          </View>

          {scannedInfo ? (
            <View style={styles.scannedBox}>
              <View style={styles.scannedHeader}>
                <CheckCircle2 size={18} color={colors.forest[600]} />
                <Text style={styles.scannedTitle}>読み込み完了</Text>
              </View>
              <View style={styles.scannedDetails}>
                {scannedInfo.hole_number && (
                  <Text style={styles.scannedText}>
                    対象ホール: <Text style={styles.bold}>{scannedInfo.hole_number}番ホール</Text>
                  </Text>
                )}
                <Text style={styles.scannedText}>
                  賞種別: <Text style={styles.bold}>{getAwardLabel(scannedInfo.award_type)}</Text>
                </Text>
                {scannedInfo.reps && scannedInfo.reps.length > 0 && (
                  <Text style={styles.scannedText}>
                    代表者: <Text style={styles.bold}>{scannedInfo.reps.join(', ')}</Text>
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setScannedInfo(null)} style={styles.rescanButton}>
                <QrCode size={14} color={colors.gray[600]} />
                <Text style={styles.rescanText}>別のQRをスキャン</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.scanActionContainer}>
              {scanning ? (
                <View style={styles.cameraBox}>
                  {!permission?.granted ? (
                    <View style={styles.permBox}>
                      <Text style={styles.permText}>QRコード撮影のためにカメラ権限が必要です</Text>
                      <Button onPress={requestPermission}>カメラ権限を許可</Button>
                    </View>
                  ) : (
                    <View style={styles.cameraWrapper}>
                      <CameraView
                        style={styles.cameraView}
                        barcodeScannerSettings={{
                          barcodeTypes: ['qr'],
                        }}
                        onBarcodeScanned={handleBarCodeScanned}
                      />
                      <TouchableOpacity onPress={() => setScanning(false)} style={styles.closeCameraBtn}>
                        <Text style={styles.closeCameraText}>キャンセル</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity onPress={() => setScanning(true)} style={styles.scanButton}>
                  <QrCode size={32} color={colors.forest[600]} />
                  <Text style={styles.scanButtonText}>QRコードをカメラで読み込む</Text>
                  <Text style={styles.scanButtonSub}>ホール設置のQRコードにかざしてください</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Step 2: Evidence Photo & Inputs */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>STEP 2</Text>
            </View>
            <Text style={styles.cardTitle}>証拠画像の撮影・入力</Text>
          </View>

          {/* Photo Picker */}
          {imageUri ? (
            <View style={styles.imagePreviewWrapper}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity onPress={() => setImageUri('')} style={styles.changePhotoBtn}>
                <Text style={styles.changePhotoText}>写真を変更</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPickerRow}>
              <TouchableOpacity onPress={takePhoto} style={styles.pickerTile}>
                <Camera size={40} color={colors.forest[600]} />
                <Text style={styles.pickerTileText}>カメラで撮影</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={pickImageFromGallery} style={styles.pickerTile}>
                <ImageIcon size={40} color={colors.forest[600]} />
                <Text style={styles.pickerTileText}>ライブラリから選択</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Memo Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <FileText size={16} color={colors.forest[700]} />
              <Text style={styles.inputLabel}>メモ [任意]</Text>
            </View>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="状況やメモを入力..."
              placeholderTextColor={colors.gray[400]}
              multiline
              numberOfLines={3}
              value={memo}
              onChangeText={setMemo}
            />
          </View>

          <Button
            onPress={handleSaveToOfflineQueue}
            loading={saving}
            disabled={!scannedInfo || !imageUri}
            style={styles.saveQueueButton}
          >
            ローカル（オフラインキュー）に一時保存
          </Button>
        </View>

        {/* Step 3: Saved Offline Queue List */}
        <View style={styles.card}>
          <View style={styles.queueHeader}>
            <Text style={styles.cardTitle}>未送信データ一覧</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{queue.length} 件</Text>
            </View>
          </View>
          <Text style={styles.queueNotice}>
            ※次回オンライン時にアプリを再起動すると自動的に同期（アップロード）されます。
          </Text>

          {queue.length === 0 ? (
            <View style={styles.emptyQueueBox}>
              <Info size={24} color={colors.gray[400]} />
              <Text style={styles.emptyQueueText}>未送信のローカルデータはありません</Text>
            </View>
          ) : (
            <View style={styles.queueList}>
              {queue.map((item) => (
                <View key={item.id} style={styles.queueItem}>
                  <Image source={{ uri: item.imageUri }} style={styles.queueThumb} />
                  <View style={styles.flex1}>
                    <Text style={styles.queueTitle}>
                      {item.hole_number ? `${item.hole_number}番ホール ` : ''}
                      ({getAwardLabel(item.award_type)})
                    </Text>
                    <Text style={styles.queueDate}>
                      保存日時: {new Date(item.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteQueueItem(item.id)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={18} color={colors.red[500]} />
                  </TouchableOpacity>
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
  banner: {
    backgroundColor: colors.forest[800],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  bannerTitle: {
    color: colors.white,
    fontWeight: '700',
    fontSize: typography.md,
  },
  bannerSubText: {
    color: colors.forest[100],
    fontSize: typography.xs,
    marginTop: 2,
  },
  retryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.forest[100],
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  retryChipText: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.forest[800],
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.forest[100],
    borderWidth: 1,
    borderColor: colors.forest[300],
    padding: spacing.md,
    borderRadius: radius.md,
  },
  successText: {
    color: colors.forest[900],
    fontSize: typography.sm,
    fontWeight: '600',
    flex: 1,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBadge: {
    backgroundColor: colors.forest[700],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  stepBadgeText: {
    color: colors.white,
    fontSize: typography.xs,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.forest[900],
  },
  scanActionContainer: {
    alignItems: 'center',
  },
  scanButton: {
    width: '100%',
    backgroundColor: colors.forest[50],
    borderWidth: 1.5,
    borderColor: colors.forest[300],
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  scanButtonText: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.forest[800],
  },
  scanButtonSub: {
    fontSize: typography.xs,
    color: colors.gray[500],
  },
  cameraBox: {
    width: '100%',
    height: 250,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.black,
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  cameraView: {
    flex: 1,
  },
  closeCameraBtn: {
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  closeCameraText: {
    color: colors.white,
    fontSize: typography.xs,
    fontWeight: '600',
  },
  permBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  permText: {
    color: colors.white,
    textAlign: 'center',
    fontSize: typography.xs,
  },
  scannedBox: {
    backgroundColor: colors.forest[50],
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.forest[200],
  },
  scannedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  scannedTitle: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.forest[800],
  },
  scannedDetails: {
    gap: 4,
  },
  scannedText: {
    fontSize: typography.xs,
    color: colors.gray[700],
  },
  bold: {
    fontWeight: '700',
    color: colors.forest[900],
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  rescanText: {
    fontSize: typography.xs,
    color: colors.gray[600],
    textDecorationLine: 'underline',
  },
  photoPickerRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pickerTile: {
    flex: 1,
    height: 140,
    backgroundColor: colors.forest[50],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.forest[200],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pickerTileText: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.forest[800],
  },
  imagePreviewWrapper: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: radius.md,
  },
  changePhotoBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  changePhotoText: {
    fontSize: typography.xs,
    color: colors.forest[700],
    textDecorationLine: 'underline',
  },
  inputGroup: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  inputLabel: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.forest[800],
  },
  textInput: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sm,
    color: colors.gray[900],
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  saveQueueButton: {
    marginTop: spacing.xs,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: colors.forest[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    color: colors.forest[800],
    fontSize: typography.xs,
    fontWeight: '700',
  },
  queueNotice: {
    fontSize: typography.xs,
    color: colors.gray[500],
  },
  emptyQueueBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  emptyQueueText: {
    fontSize: typography.xs,
    color: colors.gray[400],
  },
  queueList: {
    gap: spacing.sm,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  queueThumb: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
  },
  queueTitle: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.forest[900],
  },
  queueSubText: {
    fontSize: typography.xs,
    color: colors.gray[600],
  },
  queueDate: {
    fontSize: 10,
    color: colors.gray[400],
    marginTop: 2,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  flex1: {
    flex: 1,
  },
});
