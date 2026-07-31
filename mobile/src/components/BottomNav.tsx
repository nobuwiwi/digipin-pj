import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Home, Trophy, Image as ImageIcon, Settings, type LucideIcon } from 'lucide-react-native';
import { colors, spacing, typography } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabKey = 'dashboard' | 'competitions' | 'evidence' | 'settings';

interface BottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  dashboardBadge?: number;
}

const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'dashboard', label: 'ホーム', icon: Home },
  { key: 'competitions', label: 'コンペ', icon: Trophy },
  { key: 'evidence', label: '証拠画像', icon: ImageIcon },
  { key: 'settings', label: '設定', icon: Settings },
];

export function BottomNav({ activeTab, onTabChange, dashboardBadge }: BottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Icon size={22} color={isActive ? colors.forest[700] : colors.gray[400]} />
              {tab.key === 'dashboard' && dashboardBadge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{dashboardBadge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, { color: isActive ? colors.forest[700] : colors.gray[400] }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: typography.xs,
    marginTop: 2,
    fontWeight: '500',
  },
  badge: {
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
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
