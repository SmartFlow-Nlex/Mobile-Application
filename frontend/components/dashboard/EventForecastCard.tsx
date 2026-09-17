import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';
import { EventForecastSeed, eventDate } from '../../constants/dashboardData';
import { getExit } from '../../constants/nlexSegments';
import { describeDayOffset, formatEventDateTime } from '../../lib/datetime';

export interface EventForecastCardProps {
  event: EventForecastSeed;
  now: Date;
  /** True when the event loads the segment the user currently has selected. */
  affectsSelection?: boolean;
}

const EventForecastCard: React.FC<EventForecastCardProps> = ({
  event,
  now,
  affectsSelection = false,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const date = eventDate(event, now);
  const affectedNames = event.affectedExitIds
    .map((id) => getExit(id)?.name)
    .filter((name): name is string => name !== undefined);

  return (
    <View style={[styles.card, affectsSelection && styles.cardHighlighted]}>
      <View style={styles.header}>
        <View style={styles.textGroup}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.venue}>{event.venue}</Text>
          <View style={styles.dateRow}>
            <Text style={styles.date}>{formatEventDateTime(date)}</Text>
            <View style={styles.whenPill}>
              <Text style={styles.whenPillText}>{describeDayOffset(date, now)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.affectedLabel}>Affected:</Text>
        <View style={styles.chipRow}>
          {affectedNames.map((name) => (
            <View key={name} style={styles.chip}>
              <Text style={styles.chipText}>{name}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
        <Text style={styles.footerText}>
          Expected attendance: {event.expectedAttendance.toLocaleString('en-US')}
        </Text>
      </View>

      {affectsSelection ? (
        <View style={styles.routeNote}>
          <Ionicons name="alert-circle" size={13} color={colors.accent} />
          <Text style={styles.routeNoteText}>Affects your selected segment</Text>
        </View>
      ) : null}
    </View>
  );
};

export default EventForecastCard;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: c.cardShadow,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  cardHighlighted: {
    borderColor: c.primaryLight,
    backgroundColor: c.surfaceHighlight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  textGroup: {
    flex: 1,
  },
  title: {
    color: c.text,
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
    marginBottom: 3,
  },
  venue: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: 5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  date: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
  },
  whenPill: {
    backgroundColor: c.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  whenPillText: {
    color: c.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  metaRow: {
    marginTop: 12,
    gap: 8,
  },
  affectedLabel: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: c.primarySoft,
  },
  chipText: {
    color: c.accent,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  footerText: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
  },
  routeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: c.hairline,
  },
  routeNoteText: {
    color: c.accent,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
});
