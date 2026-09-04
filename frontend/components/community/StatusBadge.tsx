import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TrafficStatus } from '@smartflow/shared';
import { useTheme, useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';

export interface StatusBadgeProps {
  status: TrafficStatus;
}

interface StatusConfig {
  backgroundColor: string;
  color: string;
  icon: string;
  label: string;
}

/**
 * Built from the active palette rather than declared at module scope, so the
 * badge tints follow the theme instead of freezing to the light values.
 */
function statusConfigFor(c: ThemePalette): Record<TrafficStatus, StatusConfig> {
  return {
    smooth: {
      backgroundColor: c.statusSmoothBg,
      color: c.statusSmoothText,
      icon: '✓',
      label: 'smooth',
    },
    moderate: {
      backgroundColor: c.statusModerateBg,
      color: c.statusModerateText,
      icon: '⚠️',
      label: 'moderate',
    },
    heavy: {
      backgroundColor: c.statusHeavyBg,
      color: c.statusHeavyText,
      icon: '🚛',
      label: 'heavy',
    },
    incident: {
      backgroundColor: c.statusHeavyBg,
      color: c.statusHeavyText,
      icon: '🚨',
      label: 'incident',
    },
  };
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const config = statusConfigFor(colors)[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.text, { color: config.color }]}>
        {config.icon} {config.label}
      </Text>
    </View>
  );
};

export default StatusBadge;

const makeStyles = (_c: ThemePalette) =>
  StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
});
