import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { User, CheckCircle, AlertCircle, Trophy } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { checkAccountName, registerAccount, ApiError } from '@/lib/api';
import { colors, spacing, radius, typography } from '@/theme';

interface RegisterScreenProps {
  deviceId: string;
  onRegistered: () => void;
}

export function RegisterScreen({ deviceId, onRegistered }: RegisterScreenProps) {
  const [accountName, setAccountName] = useState('');
  const [checkStatus, setCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const handleCheck = async () => {
    const name = accountName.trim();
    if (name.length < 2) {
      setCheckStatus('idle');
      setMessage('アカウント名は2文字以上で入力してください');
      setSuggestions([]);
      return;
    }

    setCheckStatus('checking');
    setMessage('');
    setSuggestions([]);
    setRegisterError('');

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

  const handleRegister = async () => {
    const name = accountName.trim();
    if (name.length < 2) {
      setRegisterError('アカウント名は2文字以上で入力してください');
      return;
    }

    setRegistering(true);
    setRegisterError('');

    try {
      await registerAccount(deviceId, name);
      onRegistered();
    } catch (err) {
      const apiErr = err as ApiError;
      setRegisterError(apiErr.message);
      if (apiErr.suggestions) {
        setSuggestions(apiErr.suggestions);
        setCheckStatus('taken');
      }
    } finally {
      setRegistering(false);
    }
  };

  const useSuggestion = (suggestion: string) => {
    setAccountName(suggestion);
    setCheckStatus('idle');
    setMessage('');
    setSuggestions([]);
    setRegisterError('');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Trophy size={36} color={colors.white} />
        </View>
        <Text style={styles.heroTitle}>ゴルフ証拠画像管理</Text>
        <Text style={styles.heroSubtitle}>ドラコン賞・ニアピン賞の記録を残そう</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>アカウント登録</Text>
        <Text style={styles.cardSubtitle}>あなたのアカウント名を設定してください</Text>

        <View style={styles.inputRow}>
          <View style={styles.flex1}>
            <Input
              value={accountName}
              onChangeText={(text) => {
                setAccountName(text);
                setCheckStatus('idle');
                setMessage('');
                setSuggestions([]);
                setRegisterError('');
              }}
              placeholder="アカウント名"
              maxLength={30}
            />
          </View>
          <Button
            variant="outline"
            onPress={handleCheck}
            loading={checkStatus === 'checking'}
            disabled={!accountName.trim() || checkStatus === 'checking'}
          >
            重複確認
          </Button>
        </View>

        {message ? (
          <View style={[styles.messageBox, checkStatus === 'available' ? styles.messageAvailable : styles.messageTaken]}>
            {checkStatus === 'available' ? (
              <CheckCircle size={18} color={colors.forest[700]} />
            ) : (
              <AlertCircle size={18} color={colors.amber[700]} />
            )}
            <Text style={[styles.messageText, checkStatus === 'available' ? { color: colors.forest[700] } : { color: colors.amber[700] }]}>
              {message}
            </Text>
          </View>
        ) : null}

        {suggestions.length > 0 ? (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsLabel}>こちらの候補名はいかがですか？</Text>
            <View style={styles.suggestionsRow}>
              {suggestions.map((s) => (
                <TouchableOpacity key={s} onPress={() => useSuggestion(s)} style={styles.suggestionChip}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {registerError ? (
          <View style={[styles.messageBox, { backgroundColor: colors.red[50] }]}>
            <AlertCircle size={18} color={colors.red[600]} />
            <Text style={[styles.messageText, { color: colors.red[600] }]}>{registerError}</Text>
          </View>
        ) : null}

        <Button
          variant="primary"
          size="lg"
          onPress={handleRegister}
          loading={registering}
          disabled={!accountName.trim() || registering || checkStatus === 'taken'}
        >
          アカウント名を登録
        </Button>
      </View>

      <Text style={styles.footer}>端末IDで自動識別されます。パスワードは不要です。</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.forest[50],
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.forest[700],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: typography['2xl'],
    fontWeight: '700',
    color: colors.forest[800],
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: typography.sm,
    color: colors.forest[600],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTitle: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: colors.forest[800],
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.sm,
    color: colors.gray[500],
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  messageAvailable: {
    backgroundColor: colors.forest[50],
  },
  messageTaken: {
    backgroundColor: colors.amber[50],
  },
  messageText: {
    fontSize: typography.sm,
    flex: 1,
  },
  suggestionsContainer: {
    marginBottom: spacing.md,
  },
  suggestionsLabel: {
    fontSize: typography.xs,
    color: colors.gray[500],
    marginBottom: spacing.sm,
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
  footer: {
    textAlign: 'center',
    fontSize: typography.xs,
    color: colors.gray[400],
    marginTop: spacing.lg,
  },
});
