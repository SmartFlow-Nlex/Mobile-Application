import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';
import {
  addHours,
  describeHourOffset,
  formatDate,
  formatDateTime,
  formatTime,
} from '../../lib/datetime';

/** Quick-pick horizons shown as chips. */
export const forecastPresets = [0, 1, 3, 6, 12, 24] as const;

export interface ForecastTimeCardProps {
  /** Base time the offsets are measured from. */
  now: Date;
  offsetHours: number;
  onChangeOffset: (hours: number) => void;
}

function presetLabel(hours: number): string {
  return hours === 0 ? 'Now' : `+${hours}h`;
}

/**
 * Forecast horizon control. Tapping a chip updates the timestamp above it and
 * re-runs every forecast on the screen.
 */
const ForecastTimeCard: React.FC<ForecastTimeCardProps> = ({
  now,
  offsetHours,
  onChangeOffset,
}) => {
  const styles = useThemedStyles(makeStyles);
  const target = useMemo(() => addHours(now, offsetHours), [now, offsetHours]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.label}>Forecast Time</Text>
          <Text style={styles.stamp}>{formatDateTime(target)}</Text>
          <Text style={styles.subtext}>{describeHourOffset(offsetHours)}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset forecast to now"
          disabled={offsetHours === 0}
          onPress={() => onChangeOffset(0)}
          style={({ pressed }) => [
            styles.resetPill,
            pressed && styles.resetPillPressed,
            offsetHours === 0 && styles.resetPillDisabled,
          ]}
        >
          <Text
            style={[styles.resetPillText, offsetHours === 0 && styles.resetPillTextDisabled]}
          >
            Reset
          </Text>
        </Pressable>
      </View>

      <View style={styles.chipRow}>
        {forecastPresets.map((hours) => {
          const active = hours === offsetHours;
          return (
            <Pressable
              key={hours}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onChangeOffset(hours)}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && !active && styles.chipPressed,
              ]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {presetLabel(hours)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.divider} />

      {/* Read-only readout of the selected horizon - the chips above set it. */}
      <Text style={styles.selectedLabel}>Select specific time (hours ahead)</Text>
      <View style={styles.selectedValueBox}>
        <Text style={styles.selectedValue}>
          {presetLabel(offsetHours)} - {formatTime(target)} {formatDate(target)}
        </Text>
      </View>
    </View>
  );
};

export default ForecastTimeCard;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: c.cardShadow,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  label: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: 4,
  },
  stamp: {
    color: c.accent,
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
  },
  subtext: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  resetPill: {
    backgroundColor: c.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  resetPillPressed: {
    backgroundColor: c.borderLight,
  },
  resetPillDisabled: {
    backgroundColor: c.surfaceDisabled,
  },
  resetPillText: {
    color: c.accent,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  resetPillTextDisabled: {
    color: c.textTertiary,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: c.border,
    marginBottom: 14,
  },
  selectedLabel: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    marginBottom: 8,
  },
  selectedValueBox: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.field,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  selectedValue: {
    color: c.text,
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: c.surfaceMuted,
  },
  chipActive: {
    backgroundColor: c.primary,
  },
  chipPressed: {
    backgroundColor: c.borderLight,
  },
  chipText: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  chipTextActive: {
    color: c.textInverse,
  },
});
