import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { SegmentStatusData, TrafficCondition } from '@smartflow/shared';

interface SegmentStatusCardProps {
  segment: SegmentStatusData;
  onPress?: () => void;
}

/**
 * SegmentStatusCard Component
 * Displays segment status with starting point, destination, and traffic condition
 */
const SegmentStatusCard: React.FC<SegmentStatusCardProps> = ({
  segment,
  onPress,
}) => {
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

  const getDirectionLabel = (direction: string): string => {
    return direction.charAt(0).toUpperCase() + direction.slice(1);
  };

  const getConditionLabel = (condition: TrafficCondition): string => {
    return condition.charAt(0).toUpperCase() + condition.slice(1);
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderLeftColor: getConditionColor(segment.condition) },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.directionBadge}>
        <Text style={styles.directionBadgeText}>
          {getDirectionLabel(segment.direction)}
        </Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.label}>Starting Point</Text>
        <Text style={styles.value}>{segment.startingPoint}</Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.label}>Destination</Text>
        <Text style={styles.value}>{segment.destination}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.condition}>
            {getConditionLabel(segment.condition)}
          </Text>
        </View>
        <View style={styles.footerRight}>
          <Text style={styles.distance}>{segment.distance} km</Text>
          <Text style={styles.time}>{segment.estimatedTime} min</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default SegmentStatusCard;

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  directionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.primary,
    borderRadius: 4,
    marginBottom: 8,
  },
  directionBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  cardContent: {
    marginBottom: 8,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  condition: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  distance: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.text,
  },
  time: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
