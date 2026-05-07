import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { EventForecast, AlertSeverity } from '@smartflow/shared';

interface EventForecastCardProps {
  forecast: EventForecast;
  onPress?: () => void;
}

/**
 * EventForecastCard Component
 * Displays event forecasts with severity badge and details
 */
const EventForecastCard: React.FC<EventForecastCardProps> = ({
  forecast,
  onPress,
}) => {
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

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {forecast.title}
        </Text>
        <View
          style={[
            styles.severityBadge,
            { backgroundColor: getSeverityColor(forecast.severity) },
          ]}
        >
          <Text style={styles.severityBadgeText}>
            {getSeverityLabel(forecast.severity)}
          </Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {forecast.description}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.timestamp}>
          {new Date(forecast.timestamp).toLocaleString()}
        </Text>
        <Text style={styles.affectedCount}>
          Affects {forecast.affectedSegments.length} segment
          {forecast.affectedSegments.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default EventForecastCard;

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderLeftColor: Colors.primary,
    borderLeftWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
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
  description: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginBottom: 8,
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
    marginBottom: 4,
  },
  affectedCount: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
