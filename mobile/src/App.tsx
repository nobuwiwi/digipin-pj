import React, { useEffect, useState, useCallback } from 'react';
import { View as RNView, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw, Trophy } from 'lucide-react-native';
import { getDeviceId } from '@/lib/deviceId';
import { checkAccount, getPendingRequests, ApiError } from '@/lib/api';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { CompetitionsScreen } from '@/screens/CompetitionsScreen';
import { EvidenceListScreen } from '@/screens/EvidenceListScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { CompetitionCreateScreen } from '@/screens/CompetitionCreateScreen';
import { CompetitionManageScreen } from '@/screens/CompetitionManageScreen';
import { RepresentativeManageScreen } from '@/screens/RepresentativeManageScreen';
import { CompetitionDetailScreen } from '@/screens/CompetitionDetailScreen';
import { QRCodeListScreen } from '@/screens/QRCodeListScreen';
import { EvidenceRegisterScreen } from '@/screens/EvidenceRegisterScreen';
import { BottomNav, type TabKey } from '@/components/BottomNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { colors, spacing, typography, radius } from '@/theme';
import type { View } from '@/types/navigation';

type AppState = 'loading' | 'error' | 'unregistered' | 'registered';

export default function App() {
  const [deviceId, setDeviceId] = useState<string>('');
  const [appState, setAppState] = useState<AppState>('loading');
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [bootError, setBootError] = useState('');
  const [subView, setSubView] = useState<View>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Load device ID on mount
  useEffect(() => {
    (async () => {
      const id = await getDeviceId();
      setDeviceId(id);
    })();
  }, []);

  const refreshPendingCount = useCallback(async () => {
    if (!deviceId) return;
    try {
      const res = await getPendingRequests(deviceId);
      setPendingCount(res.requests?.length ?? 0);
    } catch {
      // ignore
    }
  }, [deviceId]);

  const checkRegistration = useCallback(async () => {
    if (!deviceId) return;
    setAppState('loading');
    setBootError('');
    try {
      const res = await checkAccount(deviceId);
      if (res.registered) {
        setAppState('registered');
      } else {
        setAppState('unregistered');
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setBootError(apiErr.message);
      setAppState('error');
    }
  }, [deviceId]);

  useEffect(() => {
    if (deviceId) checkRegistration();
  }, [deviceId, checkRegistration]);

  useEffect(() => {
    if (appState !== 'registered' || !deviceId) return;
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 30000);
    return () => clearInterval(interval);
  }, [appState, deviceId, refreshPendingCount]);

  if (appState === 'loading' || !deviceId) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <RNView style={styles.loadingContainer}>
          <RNView style={styles.loadingIcon}>
            <Trophy size={32} color={colors.white} />
          </RNView>
          <RNView style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.forest[600]} />
            <Text style={styles.loadingText}>読み込み中...</Text>
          </RNView>
        </RNView>
      </SafeAreaView>
    );
  }

  if (appState === 'error') {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <RNView style={styles.errorContainer}>
          <RNView style={styles.loadingIcon}>
            <Trophy size={32} color={colors.white} />
          </RNView>
          <Text style={styles.errorTitle}>接続エラー</Text>
          <Text style={styles.errorMessage}>{bootError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={checkRegistration}>
            <RefreshCw size={16} color={colors.white} />
            <Text style={styles.retryText}>再接続</Text>
          </TouchableOpacity>
        </RNView>
      </SafeAreaView>
    );
  }

  if (appState === 'unregistered') {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <RegisterScreen
          deviceId={deviceId}
          onRegistered={() => {
            setAppState('registered');
            setActiveTab('dashboard');
          }}
        />
      </SafeAreaView>
    );
  }

  // Sub-view rendering
  if (subView) {
    let content: React.ReactNode = null;
    switch (subView.view) {
      case 'competition-create':
        content = (
          <CompetitionCreateScreen
            deviceId={deviceId}
            onBack={() => setSubView(null)}
            onSaved={() => {
              setSubView(null);
              setActiveTab('competitions');
            }}
          />
        );
        break;
      case 'competition-edit':
        content = (
          <CompetitionCreateScreen
            deviceId={deviceId}
            competitionId={subView.competitionId}
            onBack={() => setSubView(null)}
            onSaved={() => setSubView(null)}
          />
        );
        break;
      case 'competition-manage':
        content = (
          <CompetitionManageScreen
            deviceId={deviceId}
            competitionId={subView.competitionId}
            onBack={() => setSubView(null)}
            onEdit={(id) => setSubView({ view: 'competition-edit', competitionId: id })}
            onManageReps={(id) => setSubView({ view: 'representative-manage', competitionId: id })}
            onShowQR={(id) => setSubView({ view: 'qr-codes', competitionId: id })}
          />
        );
        break;
      case 'representative-manage':
        content = (
          <RepresentativeManageScreen
            deviceId={deviceId}
            competitionId={subView.competitionId}
            onBack={() => setSubView({ view: 'competition-manage', competitionId: subView.competitionId })}
          />
        );
        break;
      case 'competition-detail':
        content = (
          <CompetitionDetailScreen
            deviceId={deviceId}
            competitionId={subView.competitionId}
            onBack={() => setSubView(null)}
          />
        );
        break;
      case 'qr-codes':
        content = (
          <QRCodeListScreen
            deviceId={deviceId}
            competitionId={subView.competitionId}
            onBack={() => setSubView({ view: 'competition-manage', competitionId: subView.competitionId })}
          />
        );
        break;
      case 'evidence-register':
        content = (
          <EvidenceRegisterScreen
            deviceId={deviceId}
            competitionId={subView.competitionId}
            holeNumber={subView.holeNumber}
            awardType={subView.awardType}
            repNames={subView.repNames ?? []}
            onBack={() => setSubView(null)}
            onUploaded={() => {
              setSubView(null);
              setActiveTab('evidence');
            }}
          />
        );
        break;
    }
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ErrorBoundary
          fallback={() => (
            <RNView style={[styles.screen, styles.center]}>
              <Text style={styles.errorTitle}>表示エラー</Text>
              <Text style={styles.errorMessage}>画面の表示中にエラーが発生しました。</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => setSubView(null)}>
                <Text style={styles.retryText}>戻る</Text>
              </TouchableOpacity>
            </RNView>
          )}
        >
          {content}
        </ErrorBoundary>
      </SafeAreaView>
    );
  }

  // Main tab view
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <RNView style={styles.content}>
        {activeTab === 'dashboard' && (
          <DashboardScreen
            deviceId={deviceId}
            onNavigate={setActiveTab}
            onRepActionComplete={refreshPendingCount}
          />
        )}
        {activeTab === 'competitions' && (
          <CompetitionsScreen
            deviceId={deviceId}
            onOpenManage={(id) => setSubView({ view: 'competition-manage', competitionId: id })}
            onOpenDetail={(id) => setSubView({ view: 'competition-detail', competitionId: id })}
            onOpenCreate={() => setSubView({ view: 'competition-create' })}
          />
        )}
        {activeTab === 'evidence' && (
          <EvidenceListScreen
            deviceId={deviceId}
            onUpload={(compId, holeNum, award) =>
              setSubView({ view: 'evidence-register', competitionId: compId, holeNumber: holeNum, awardType: award })
            }
          />
        )}
        {activeTab === 'settings' && (
          <SettingsScreen deviceId={deviceId} />
        )}
      </RNView>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} dashboardBadge={pendingCount} />
    </SafeAreaView>
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.forest[700],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.sm,
    color: colors.forest[600],
  },
  errorContainer: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: colors.forest[800],
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: typography.sm,
    color: colors.gray[500],
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.forest[700],
  },
  retryText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: typography.base,
  },
});
