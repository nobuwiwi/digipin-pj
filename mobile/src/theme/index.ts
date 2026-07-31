import { StyleSheet } from 'react-native';

// Color palette matching the web app's forest/sand theme
export const colors = {
  forest: {
    50: '#f0f9f4',
    100: '#dcf0e3',
    200: '#bbe1ca',
    300: '#8fccaa',
    400: '#5ab087',
    500: '#3a9568',
    600: '#2a7a52',
    700: '#1a6b4c',
    800: '#155440',
    900: '#0f3d2f',
  },
  sand: {
    50: '#fbf7f0',
    100: '#f5ead5',
    200: '#ead0a8',
    300: '#ddb077',
    400: '#d09a55',
    500: '#c4843a',
    600: '#a86d2e',
    700: '#855528',
    800: '#6b4422',
    900: '#52351b',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    500: '#f59e0b',
    600: '#d97706',
    700: '#92400e',
    800: '#78350f',
  },
  white: '#ffffff',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
};

export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.forest[50],
  },
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
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
  textBold: {
    fontWeight: '700',
  },
  textCenter: {
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flex1: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
