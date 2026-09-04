import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';
import { formatClock } from '../../lib/datetime';
import { NetworkStatus, congestionLevelLabel } from '../../lib/trafficModel';
import useNow from '../../hooks/useNow';
import { toneFor } from './severity';

export interface StatusSummaryCardProps {
  status: NetworkStatus;
}

/**
 * The headline card. It owns its own one-second clock so the "Updated" stamp
 * ticks live without re-rendering the rest of the dashboard every second.
 */
const StatusSummaryCard: React.FC<StatusSummaryCardProps> = ({ status }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const now = useNow(1000);
  const tone = toneFor(status.level, colors);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.label}>Current Status</Text>
          <Text style={styles.title}>NLEX Traffic</Text>
        </View>

        <View style={styles.levelPill}>
          <View style={[styles.levelDot, { backgroundColor: tone.solid }]} />
          <Text style={styles.levelPillText}>{congestionLevelLabel[status.level]}</Text>
        </View>
      </View>

      <View style={styles.updatedRow}>
        <Ionicons name="time-outline" size={15} color={colors.textInverse} />
        <Text style={styles.updatedText}>Updated {formatClock(now)}</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.metricGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Active Incidents</Text>
          <Text style={styles.metricValue}>{status.activeIncidents}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Avg Delay</Text>
          <Text style={styles.metricValue}>
            {status.averageDelayMinutes} <Text style={styles.metricUnit}>min</Text>
          </Text>
        </View>
      </View>

      {status.busiestSegment.length > 0 ? (
        <View style={styles.footerRow}>
          <Ionicons name="alert-circle-outline" size={14} color="rgba(255,255,255,0.85)" />
          <Text style={styles.footerText} numberOfLines={1}>
            Heaviest right now: {status.busiestSegment}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export default StatusSummaryCard;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
  card: {
    backgroundColor: c.primary,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    shadowColor: c.primaryShadow,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleGroup: {
    flex: 1,
  },
  label: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    marginBottom: 6,
  },
  title: {
    color: c.textInverse,
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelPillText: {
    color: c.textInverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
  },
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    marginBottom: 14,
  },
  updatedText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginLeft: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  liveText: {
    color: c.textInverse,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 14,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    marginBottom: 6,
  },
  metricValue: {
    color: c.textInverse,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
  },
  metricUnit: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  footerText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    flex: 1,
  },
});
