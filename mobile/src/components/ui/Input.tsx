import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
}

export function Input({
  value,
  onChangeText,
  placeholder,
  maxLength,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
}: InputProps) {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.gray[400]}
      maxLength={maxLength}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.base,
    color: colors.gray[800],
    backgroundColor: colors.white,
  },
});
