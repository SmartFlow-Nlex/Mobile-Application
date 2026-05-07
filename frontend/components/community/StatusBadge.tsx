import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TrafficStatus } from '@smartflow/shared';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

export interface StatusBadgeProps {
  status: TrafficStatus;
}

const statusConfig: Record<
  TrafficStatus,
  { backgroundColor: string; color: string; icon: string; label: string }
> = {
  smooth: {
    backgroundColor: Colors.statusSmoothBg,
    color: Colors.statusSmoothText,
    icon: '✓',
    label: 'smooth',
  },
  moderate: {
    backgroundColor: Colors.statusModerateBg,
    color: Colors.statusModerateText,
    icon: '⚠️',
    label: 'moderate',
  },
  heavy: {
    backgroundColor: Colors.statusHeavyBg,
    color: Colors.statusHeavyText,
    icon: '🚛',
    label: 'heavy',
  },
  incident: {
    backgroundColor: Colors.statusHeavyBg,
    color: Colors.statusHeavyText,
    icon: '🚨',
    label: 'incident',
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.text, { color: config.color }]}>
        {config.icon} {config.label}
      </Text>
    </View>
  );
};

export default StatusBadge;

const styles = StyleSheet.create({
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
