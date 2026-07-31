import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, radius, typography } from '@/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  style,
  textStyle,
  children,
}: ButtonProps) {
  const variantStyles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[baseStyles.button, variantStyles.button, sizeStyles.button, style, (disabled || loading) && baseStyles.disabled]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.spinnerColor} size="small" />
      ) : (
        <Text style={[baseStyles.text, variantStyles.text, sizeStyles.text, textStyle]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function getVariantStyles(variant: Variant) {
  switch (variant) {
    case 'primary':
      return {
        button: { backgroundColor: colors.forest[700] },
        text: { color: colors.white },
        spinnerColor: colors.white,
      };
    case 'secondary':
      return {
        button: { backgroundColor: colors.forest[50], borderWidth: 1, borderColor: colors.forest[200] },
        text: { color: colors.forest[700] },
        spinnerColor: colors.forest[700],
      };
    case 'outline':
      return {
        button: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.forest[300] },
        text: { color: colors.forest[700] },
        spinnerColor: colors.forest[700],
      };
    case 'danger':
      return {
        button: { backgroundColor: colors.red[500] },
        text: { color: colors.white },
        spinnerColor: colors.white,
      };
  }
}

function getSizeStyles(size: Size) {
  switch (size) {
    case 'sm':
      return {
        button: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
        text: { fontSize: typography.sm },
      };
    case 'md':
      return {
        button: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2 },
        text: { fontSize: typography.base },
      };
    case 'lg':
      return {
        button: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
        text: { fontSize: typography.md },
      };
  }
}

const baseStyles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
