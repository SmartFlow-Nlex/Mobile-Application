import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { HotspotData, AlertSeverity } from '@smartflow/shared';

interface HotspotCardProps {
  hotspot: HotspotData;
  onPress?: () => void;
}

/**
 * HotspotCard Component
 * Displays ML-identified traffic hotspots with location and severity
 */
const HotspotCard: React.FC<HotspotCardProps> = ({ hotspot, onPress }) => {
  const getSeverityColor = (severity: AlertSeverity): string => {
    switch (severity) {
      case 'low':
        return Colors.severityLow;
      case 'medium':
        return Colors.severityMedium;
      case 'high':
        return Colors.severityHigh;
      default:
        return Colors.textSecondary;
    }
  };

  const getSeverityLabel = (severity: AlertSeverity): string => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  const getReasonLabel = (reason: string): string => {
    return reason.charAt(0).toUpperCase() + reason.slice(1);
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderBottomColor: getSeverityColor(hotspot.severity) },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {hotspot.name}
        </Text>
        <View
          style={[
            styles.severityBadge,
            { backgroundColor: getSeverityColor(hotspot.severity) },
          ]}
        >
          <Text style={styles.severityBadgeText}>
            {getSeverityLabel(hotspot.severity)}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Reason</Text>
          <Text style={styles.reasonValue}>
            {getReasonLabel(hotspot.reason)}
          </Text>
        </View>

        <View style={styles.locationContainer}>
          <Text style={styles.locationLabel}>Location</Text>
          <Text style={styles.locationValue}>
            {hotspot.location.latitude.toFixed(4)}, {hotspot.location.longitude.toFixed(4)}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.timestamp}>
          Detected: {new Date(hotspot.timestamp).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default HotspotCard;

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderBottomWidth: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  content: {
    marginBottom: 8,
  },
  reasonContainer: {
    marginBottom: 6,
  },
  reasonLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  reasonValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  locationContainer: {
    marginBottom: 6,
  },
  locationLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  locationValue: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  footer: {
    paddingTop: 8,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
  },
  timestamp: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '400',
    color: Colors.textTertiary,
  },
});
