import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '../theme';
import type { ThemePalette } from '../theme';
import { Typography } from '../constants/typography';

export interface SettingsRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
  destructive?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  label,
  value,
  onPress,
  toggle = false,
  toggleValue = false,
  onToggle,
  destructive = false,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const color = destructive ? colors.danger : colors.text;

  return (
    <Pressable
      disabled={!onPress && !toggle}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.left}>
        <View style={[styles.iconWrap, destructive && styles.iconWrapDanger]}>
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={color} />
        </View>
        <Text style={[styles.label, destructive && styles.labelDanger]}>{label}</Text>
      </View>

      <View style={styles.right}>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        {toggle ? (
          <Switch
            onValueChange={onToggle}
            value={toggleValue}
            trackColor={{ false: colors.border, true: '#93C5FD' }}
            thumbColor={toggleValue ? colors.primary : colors.surface}
          />
        ) : onPress ? (
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        ) : null}
      </View>
    </Pressable>
  );
};

export default SettingsRow;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowPressed: {
    backgroundColor: c.pressed,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.iconTint,
  },
  iconWrapDanger: {
    backgroundColor: c.iconTintDanger,
  },
  label: {
    color: c.text,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  labelDanger: {
    color: c.danger,
  },
  value: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});
