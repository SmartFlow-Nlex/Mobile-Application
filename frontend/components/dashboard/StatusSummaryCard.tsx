import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';
import { formatClock, formatLongDate } from '../../lib/datetime';
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

        {/*
          Says what it measures. On its own this pill read "Low" next to the
          words "NLEX Traffic" - low what? Everywhere else the tier has context
          ("Congestion Probability" sits directly under it), but here it was a
          bare magnitude with no noun attached.
        */}
        <View style={styles.levelPill}>
          <View style={[styles.levelDot, { backgroundColor: tone.solid }]} />
          <Text style={styles.levelPillText}>
            {congestionLevelLabel[status.level]} congestion
          </Text>
        </View>
      </View>

      {/*
        Two lines, because the full date plus "Updated 3:05:40 AM" will not fit
        across a phone on one. The date leads and the timestamp sits under it,
        so the card says what day it is without the stamp losing its own line.

        The ticking seconds are the live signal now that the LIVE pill is gone:
        a stamp visibly counting is the thing that says the data is current,
        and the badge next to it only repeated that in words.
      */}
      <View style={styles.updatedRow}>
        <Ionicons name="time-outline" size={15} color={colors.textInverse} />
        <View style={styles.updatedGroup}>
          <Text style={styles.updatedDate}>{formatLongDate(now)}</Text>
          <Text style={styles.updatedText}>Updated {formatClock(now)}</Text>
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
        <View style={styles.heaviestPanel}>
          <View style={styles.heaviestIcon}>
            <Ionicons name="alert-circle" size={15} color={colors.primary} />
          </View>
          <View style={styles.heaviestGroup}>
            <Text style={styles.heaviestLabel}>HEAVIEST RIGHT NOW</Text>
            <Text style={styles.heaviestValue} numberOfLines={2}>
              {status.busiestSegment}
            </Text>
          </View>
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
    gap: 8,
    marginTop: 14,
    marginBottom: 14,
  },
  updatedGroup: {
    flex: 1,
  },
  updatedDate: {
    color: c.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  updatedText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    marginTop: 1,
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
  /*
    This names the one segment actually worth acting on, and it used to be the
    least prominent thing on the card: a 12pt line at 85% white sitting flush
    on the navy, reading as a footnote under the metrics.

    It now gets the same inset-panel treatment as the metric cards above, with
    the same label-over-value split, so it belongs to the card rather than
    trailing off the bottom of it. What makes it carry is contrast, not colour:
    a brighter panel than the metrics (0.16 against their 0.12), a defining
    hairline they do not have, a solid-white icon chip for a focal point, and
    the segment name at 16pt/800 in full white instead of 12pt/600 at 85%.

    Deliberately not a red band. The level pill at the top already carries the
    severity colour, so a second alarm colour here would both repeat it and
    make an ordinary glance at the dashboard feel like a warning - and on a
    quiet morning it would be shouting about the busiest of several clear
    segments.
  */
  heaviestPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  heaviestIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.textInverse,
  },
  heaviestGroup: {
    flex: 1,
  },
  heaviestLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  heaviestValue: {
    color: c.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
    // Two lines, because "Paso de Blas - NLEX Harbor Link" was already close
    // to the edge at 12pt and truncates outright at 16.
    lineHeight: 20,
  },
});
