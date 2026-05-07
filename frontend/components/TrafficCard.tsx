import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { TrafficData, TrafficCondition } from '@smartflow/shared';

interface TrafficCardProps {
  traffic: TrafficData;
  onPress?: () => void;
}

/**
 * TrafficCard Component
 * Displays main traffic information with duration and condition
 */
const TrafficCard: React.FC<TrafficCardProps> = ({ traffic, onPress }) => {
  const getConditionColor = (condition: TrafficCondition): string => {
    switch (condition) {
      case 'normal':
        return Colors.trafficNormal;
      case 'congested':
        return Colors.trafficCongested;
      case 'accident':
        return Colors.trafficAccident;
      case 'construction':
        return Colors.trafficConstruction;
      default:
        return Colors.textSecondary;
    }
  };

  const getConditionLabel = (condition: TrafficCondition): string => {
    return condition.charAt(0).toUpperCase() + condition.slice(1);
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: getConditionColor(traffic.condition) }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <Text style={styles.roadName}>{traffic.roadName}</Text>
        <Text style={styles.condition}>
          {getConditionLabel(traffic.condition)}
        </Text>
      </View>

      <View style={styles.durationContainer}>
        <Text style={styles.duration}>{traffic.duration}</Text>
        <Text style={styles.durationUnit}>min</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.timestamp}>
          Last updated: {new Date(traffic.lastUpdated).toLocaleTimeString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default TrafficCard;

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  cardContent: {
    marginBottom: 12,
  },
  roadName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  condition: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  duration: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: Colors.primary,
    marginRight: 4,
  },
  durationUnit: {
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  footer: {
    paddingTop: 12,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
  },
  timestamp: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '400',
    color: Colors.textTertiary,
  },
});
