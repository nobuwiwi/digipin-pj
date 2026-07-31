import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import {
  Settings as SettingsIcon,
  User,
  Smartphone,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Edit3,
  Save,
} from 'lucide-react-native';
import { getAccount, updateAccount, checkAccountName, issueTransferCode, executeTransfer, ApiError } from '@/lib/api';
import type { Account } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, spacing, radius, typography } from '@/theme';

interface SettingsScreenProps {
  deviceId: string;
}

export function SettingsScreen({ deviceId }: SettingsScreenProps) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [checkStatus, setCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');
  const [issuedCode, setIssuedCode] = useState('');
  const [transferCodeInput, setTransferCodeInput] = useState('');

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAccount(deviceId);
      setAccount(res.account);
      setEditName(res.account.account_name);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  const handleCheck = async () => {
    const name = editName.trim();
    if (name.length < 2) {
      setCheckStatus('idle');
      setMessage('アカウント名は2文字以上で入力してください');
      return;
    }
    if (name === account?.account_name) {
      setCheckStatus('available');
      setMessage('現在のアカウント名と同じです');
      return;
    }
    setCheckStatus('checking');
    setMessage('');
    setSuggestions([]);
    try {
      const res = await checkAccountName(deviceId, name);
      if (res.available) {
        setCheckStatus('available');
        setMessage(res.message);
      } else {
        setCheckStatus('taken');
        setMessage(res.message);
        setSuggestions(res.suggestions ?? []);
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setCheckStatus('taken');
      setMessage(apiErr.message);
      setSuggestions(apiErr.suggestions ?? []);
    }
  };

  const handleSave = async () => {
    const name = editName.trim();
    if (name.length < 2) {
      setSaveError('アカウント名は2文字以上で入力してください');
      return;
    }
    if (name === account?.account_name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const res = await updateAccount(deviceId, name);
      setAccount(res.account);
      setEditing(false);
      setCheckStatus('idle');
      setMessage('');
      setSuggestions([]);
    } catch (err) {
      const apiErr = err as ApiError;
      setSaveError(apiErr.message);
      if (apiErr.suggestions) {
        setSuggestions(apiErr.suggestions);
        setCheckStatus('taken');
      }
    } finally {
      setSaving(false);
    }
  };

  const useSuggestion = (s: string) => {
    setEditName(s);
    setCheckStatus('idle');
    setMessage('');
    setSuggestions([]);
    setSaveError('');
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <RefreshCw size={24} color={colors.forest[500]} />
      </View>
    );
  }

  if (error || !account) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.errorText}>{error || 'アカウント情報の取得に失敗しました'}</Text>
        <Button variant="outline" onPress={fetchAccount}>再読み込み</Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerTitleRow}>
        <SettingsIcon size={20} color={colors.forest[800]} />
        <Text style={styles.headerTitle}>設定</Text>
      </View>

      {/* Account name card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <User size={16} color={colors.forest[700]} />
          <Text style={styles.cardHeaderText}>アカウント情報</Text>
        </View>
        <View style={styles.cardBody}>
          {!editing ? (
            <View>
              <Text style={styles.label}>アカウント名</Text>
              <View style={styles.nameRow}>
                <Text style={styles.nameText}>{account.account_name}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setEditing(true);
                    setEditName(account.account_name);
                    setCheckStatus('idle');
                    setMessage('');
                    setSuggestions([]);
                    setSaveError('');
                  }}
                  style={styles.editButton}
                >
                  <Edit3 size={16} color={colors.forest[600]} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.editContainer}>
              <View style={styles.editInputRow}>
                <View style={styles.flex1}>
                  <Input
                    value={editName}
                    onChangeText={(text) => {
                      setEditName(text);
                      setCheckStatus('idle');
                      setMessage('');
                      setSuggestions([]);
                      setSaveError('');
                    }}
                    maxLength={30}
                    placeholder="アカウント名"
                  />
                </View>
                <Button
                  variant="outline"
                  onPress={handleCheck}
                  loading={checkStatus === 'checking'}
                  disabled={!editName.trim() || checkStatus === 'checking'}
                >
                  重複確認
                </Button>
              </View>

              {message ? (
                <View style={[styles.messageBox, checkStatus === 'available' ? { backgroundColor: colors.forest[50] } : { backgroundColor: colors.amber[50] }]}>
                  {checkStatus === 'available' ? <CheckCircle size={16} color={colors.forest[700]} /> : <AlertCircle size={16} color={colors.amber[700]} />}
                  <Text style={[styles.messageText, checkStatus === 'available' ? { color: colors.forest[700] } : { color: colors.amber[700] }]}>
                    {message}
                  </Text>
                </View>
              ) : null}

              {suggestions.length > 0 ? (
                <View style={styles.suggestionsRow}>
                  {suggestions.map((s) => (
                    <TouchableOpacity key={s} onPress={() => useSuggestion(s)} style={styles.suggestionChip}>
                      <Text style={styles.suggestionText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}

              <View style={styles.editButtons}>
                <Button
                  variant="outline"
                  style={styles.flex1}
                  onPress={() => {
                    setEditing(false);
                    setEditName(account.account_name);
                    setCheckStatus('idle');
                    setMessage('');
                    setSuggestions([]);
                    setSaveError('');
                  }}
                  disabled={saving}
                >
                  キャンセル
                </Button>
                <Button
                  variant="primary"
                  style={styles.flex1}
                  onPress={handleSave}
                  loading={saving}
                  disabled={!editName.trim() || saving || checkStatus === 'taken'}
                >
                  保存
                </Button>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Device ID card */}
      <View style={styles.card}>
        <View style={[styles.cardHeader, { backgroundColor: colors.gray[50] }]}>
          <Smartphone size={16} color={colors.gray[600]} />
          <Text style={[styles.cardHeaderText, { color: colors.gray[600] }]}>デバッグ情報</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.label}>端末ID（UUID）</Text>
          <View style={styles.deviceIdBox}>
            <Text style={styles.deviceIdText}>{deviceId}</Text>
          </View>
          <Text style={styles.deviceIdNote}>
            このIDはデバイスに保存されており、端末を識別するために使用されます。
          </Text>
        </View>
      </View>

      {/* Device Transfer card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Smartphone size={16} color={colors.forest[700]} />
          <Text style={styles.cardHeaderText}>端末引き継ぎ</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.transferDescription}>
            新しい端末にアカウントとデータを引き継げます。旧端末で6桁のコードを発行し、新端末で入力してください。コードの有効期限は10分です。
          </Text>

          <View style={styles.transferSection}>
            <Text style={styles.transferSectionTitle}>旧端末：コード発行</Text>
            <Button
              variant="primary"
              onPress={async () => {
                setTransferLoading(true);
                setTransferError('');
                setIssuedCode('');
                try {
                  const res = await issueTransferCode(deviceId);
                  setIssuedCode(res.code);
                } catch (err) {
                  const apiErr = err as ApiError;
                  setTransferError(apiErr.message);
                } finally {
                  setTransferLoading(false);
                }
              }}
              loading={transferLoading}
              disabled={transferLoading}
            >
              引き継ぎコードを発行
            </Button>
            {issuedCode ? (
              <View style={styles.issuedCodeBox}>
                <Text style={styles.issuedCodeLabel}>引き継ぎコード（10分有効）</Text>
                <Text style={styles.issuedCodeText}>{issuedCode}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.transferSection}>
            <Text style={styles.transferSectionTitle}>新端末：コード入力</Text>
            <View style={styles.transferInputRow}>
              <View style={styles.flex1}>
                <Input
                  value={transferCodeInput}
                  onChangeText={(text) => {
                    setTransferCodeInput(text.replace(/\D/g, '').slice(0, 6));
                    setTransferError('');
                  }}
                  placeholder="6桁のコード"
                  maxLength={6}
                  keyboardType="numeric"
                />
              </View>
              <Button
                variant="primary"
                onPress={async () => {
                  if (transferCodeInput.length !== 6) {
                    setTransferError('6桁のコードを入力してください');
                    return;
                  }
                  setTransferLoading(true);
                  setTransferError('');
                  try {
                    await executeTransfer(deviceId, transferCodeInput);
                    setTransferSuccess('端末の引き継ぎが完了しました。');
                  } catch (err) {
                    const apiErr = err as ApiError;
                    setTransferError(apiErr.message);
                  } finally {
                    setTransferLoading(false);
                  }
                }}
                loading={transferLoading}
                disabled={transferLoading || transferCodeInput.length !== 6}
              >
                引き継ぎ
              </Button>
            </View>
            {transferError ? (
              <View style={[styles.messageBox, { backgroundColor: colors.red[50] }]}>
                <AlertCircle size={16} color={colors.red[600]} />
                <Text style={[styles.messageText, { color: colors.red[600] }]}>{transferError}</Text>
              </View>
            ) : null}
            {transferSuccess ? (
              <View style={[styles.messageBox, { backgroundColor: colors.forest[50] }]}>
                <CheckCircle size={16} color={colors.forest[700]} />
                <Text style={[styles.messageText, { color: colors.forest[700] }]}>{transferSuccess}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <Text style={styles.versionText}>デジピン v1.0.0</Text>
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
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.forest[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.forest[100],
  },
  cardHeaderText: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.forest[700],
  },
  cardBody: {
    padding: spacing.md,
    gap: spacing.md,
  },
  label: {
    fontSize: typography.xs,
    color: colors.gray[400],
    marginBottom: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameText: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: colors.forest[800],
  },
  editButton: {
    padding: spacing.sm,
  },
  editContainer: {
    gap: spacing.sm + 2,
  },
  editInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
  },
  messageText: {
    fontSize: typography.sm,
    flex: 1,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.forest[50],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.forest[200],
  },
  suggestionText: {
    fontSize: typography.sm,
    fontWeight: '500',
    color: colors.forest[700],
  },
  saveErrorText: {
    fontSize: typography.sm,
    color: colors.red[500],
  },
  editButtons: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
  },
  deviceIdBox: {
    backgroundColor: colors.gray[50],
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  deviceIdText: {
    fontSize: typography.xs,
    color: colors.gray[600],
    fontFamily: 'monospace',
  },
  deviceIdNote: {
    fontSize: typography.xs,
    color: colors.gray[400],
  },
  transferDescription: {
    fontSize: typography.sm,
    color: colors.gray[600],
    lineHeight: 20,
  },
  transferSection: {
    borderTopWidth: 1,
    borderTopColor: colors.forest[50],
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  transferSectionTitle: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.forest[700],
  },
  transferInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  issuedCodeBox: {
    backgroundColor: colors.forest[50],
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  issuedCodeLabel: {
    fontSize: typography.xs,
    color: colors.forest[600],
    marginBottom: spacing.xs,
  },
  issuedCodeText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.forest[800],
    letterSpacing: 8,
    fontFamily: 'monospace',
  },
  errorText: {
    color: colors.red[500],
    fontSize: typography.sm,
    marginBottom: spacing.md,
  },
  versionText: {
    textAlign: 'center',
    fontSize: typography.xs,
    color: colors.gray[400],
    paddingVertical: spacing.md,
  },
  flex1: {
    flex: 1,
  },
});
