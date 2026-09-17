import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  KeyboardTypeOptions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme, useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';

export interface AuthFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  /** Renders a masked field with an eye button to reveal it. */
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  autoComplete?: 'email' | 'name' | 'password' | 'new-password' | 'off';
  error?: string | null;
  testID?: string;
}

/**
 * Labelled input for the sign-in / sign-up screens: leading icon, an eye
 * toggle on password fields, and a tinted fill once it has a value (the way
 * the web dashboard's form reads).
 */
const AuthField: React.FC<AuthFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  secure = false,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete = 'off',
  error = null,
  testID,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [revealed, setRevealed] = useState(false);
  const hasValue = value.length > 0;
  const hasError = error !== null && error.length > 0;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.field,
          hasValue && styles.fieldFilled,
          hasError && styles.fieldError,
        ]}
      >
        <Ionicons
          name={icon}
          size={17}
          color={hasError ? colors.danger : colors.textTertiary}
        />

        <TextInput
          testID={testID}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={secure && !revealed}
          style={styles.input}
          value={value}
        />

        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            hitSlop={8}
            onPress={() => setRevealed((current) => !current)}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.textTertiary}
            />
          </Pressable>
        ) : null}
      </View>

      {hasError ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

export default AuthField;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: 14,
    },
    label: {
      color: c.textSecondary,
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
      marginBottom: 8,
    },
    field: {
      minHeight: 50,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    fieldFilled: {
      backgroundColor: c.primarySoft,
      borderColor: c.primarySoftBorder,
    },
    fieldError: {
      borderColor: c.danger,
    },
    input: {
      flex: 1,
      color: c.text,
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.medium,
      // Removes the default focus ring react-native-web puts on inputs.
      outlineStyle: 'none',
    } as object,
    errorText: {
      color: c.danger,
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.medium,
      marginTop: 6,
    },
  });
