import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  NlexDirectionId,
  exitsInTravelOrder,
  getExit,
  isValidPair,
  nlexDirections,
  reachableExits,
} from '../../constants/nlexSegments';
import Dropdown, { DropdownOption } from '../Dropdown';
import { useTheme, useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';

export type LocationMode = 'single' | 'between';

export interface LocationValue {
  direction: NlexDirectionId;
  mode: LocationMode;
  /** Single-area choice. */
  exitId: string | null;
  /** Between-exits choice. */
  fromExitId: string | null;
  toExitId: string | null;
}

export interface LocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
}

export const emptyLocation = (
  direction: NlexDirectionId = 'northbound',
): LocationValue => ({
  direction,
  mode: 'single',
  exitId: null,
  fromExitId: null,
  toExitId: null,
});

/** Human-readable location for the payload, or null while the choice is incomplete. */
export function formatLocation(value: LocationValue): string | null {
  if (value.mode === 'single') {
    return getExit(value.exitId)?.name ?? null;
  }
  const from = getExit(value.fromExitId);
  const to = getExit(value.toExitId);
  if (from === null || to === null) {
    return null;
  }
  return `${from.name} → ${to.name}`;
}

const directionBadge: Record<NlexDirectionId, string> = {
  northbound: 'NB',
  southbound: 'SB',
};

const directionArrow: Record<NlexDirectionId, keyof typeof Ionicons.glyphMap> = {
  northbound: 'arrow-up',
  southbound: 'arrow-down',
};

/**
 * Northbound climbs the KM markers away from Manila, southbound comes back
 * down them — so the exit list reads in the order the driver actually meets it.
 */
const directionCaption: Record<NlexDirectionId, string> = {
  northbound: 'Exits listed Manila → Clark (ascending KM)',
  southbound: 'Exits listed Clark → Manila (descending KM)',
};

const modes: { id: LocationMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'single', label: 'Single Area', icon: 'location-outline' },
  { id: 'between', label: 'Between Exits', icon: 'swap-horizontal' },
];

function toOptions(exits: ReturnType<typeof exitsInTravelOrder>): DropdownOption[] {
  return exits.map((exit) => ({
    id: exit.id,
    label: exit.name,
    sublabel: exit.city,
  }));
}

/**
 * Location field for a community post: pick a direction, then either one exit
 * or a stretch between two. The exit list re-orders with the direction, and
 * the destination list only offers exits still ahead of the starting point.
 */
const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const orderedOptions = useMemo(
    () => toOptions(exitsInTravelOrder(value.direction)),
    [value.direction],
  );

  const toExitOptions = useMemo(
    () => toOptions(reachableExits(value.direction, value.fromExitId)),
    [value.direction, value.fromExitId],
  );

  const handleDirection = (direction: NlexDirectionId): void => {
    if (direction === value.direction) {
      return;
    }
    // A stretch only reads correctly one way round, so drop a destination that
    // now sits behind the starting point rather than keeping an impossible pair.
    const pairSurvives = isValidPair(direction, value.fromExitId, value.toExitId);
    onChange({ ...value, direction, toExitId: pairSurvives ? value.toExitId : null });
  };

  const handleFrom = (fromExitId: string): void => {
    const pairSurvives = isValidPair(value.direction, fromExitId, value.toExitId);
    onChange({ ...value, fromExitId, toExitId: pairSurvives ? value.toExitId : null });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Location <Text style={styles.required}>*</Text>
      </Text>

      <View style={styles.directionRow}>
        {nlexDirections.map((item) => {
          const active = item.id === value.direction;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => handleDirection(item.id)}
              style={[styles.directionButton, active && styles.directionButtonActive]}
            >
              <Ionicons
                name={directionArrow[item.id]}
                size={15}
                color={active ? colors.accent : colors.textSecondary}
              />
              <Text style={[styles.directionText, active && styles.directionTextActive]}>
                {item.label}
              </Text>
              <View style={[styles.badge, active && styles.badgeActive]}>
                <Text style={[styles.badgeText, active && styles.badgeTextActive]}>
                  {directionBadge[item.id]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.modeTrack}>
        {modes.map((mode) => {
          const active = mode.id === value.mode;
          return (
            <Pressable
              key={mode.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onChange({ ...value, mode: mode.id })}
              style={[styles.modeSegment, active && styles.modeSegmentActive]}
            >
              <Ionicons
                name={mode.icon}
                size={15}
                color={active ? colors.accent : colors.textSecondary}
              />
              <Text style={[styles.modeText, active && styles.modeTextActive]}>{mode.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {value.mode === 'single' ? (
        <Dropdown
          label="Exit or area"
          placeholder="Select an exit or area"
          options={orderedOptions}
          value={value.exitId}
          onChange={(exitId) => onChange({ ...value, exitId })}
          helperText={directionCaption[value.direction]}
        />
      ) : (
        <>
          <Dropdown
            label="From"
            placeholder="From exit"
            options={orderedOptions}
            value={value.fromExitId}
            onChange={handleFrom}
            helperText={directionCaption[value.direction]}
          />
          <Dropdown
            label="To"
            placeholder={value.fromExitId === null ? 'Pick From first' : 'To exit'}
            options={toExitOptions}
            value={value.toExitId}
            onChange={(toExitId) => onChange({ ...value, toExitId })}
            disabled={value.fromExitId === null}
            helperText="Only exits ahead of your starting point are shown."
            emptyText="That is the last exit in this direction."
          />
        </>
      )}
    </View>
  );
};

export default LocationPicker;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    container: {
      marginBottom: 4,
    },
    label: {
      color: c.textSecondary,
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
      marginBottom: 8,
      marginTop: 4,
    },
    required: {
      color: c.danger,
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.bold,
    },
    directionRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },
    directionButton: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    directionButtonActive: {
      borderColor: c.accent,
      backgroundColor: c.primarySoft,
    },
    directionText: {
      color: c.textSecondary,
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
    },
    directionTextActive: {
      color: c.accent,
      fontWeight: Typography.fontWeight.bold,
    },
    badge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: c.surfaceMuted,
    },
    badgeActive: {
      backgroundColor: c.primarySoftBorder,
    },
    badgeText: {
      color: c.textTertiary,
      fontSize: 10,
      fontWeight: Typography.fontWeight.bold,
    },
    badgeTextActive: {
      color: c.accent,
    },
    modeTrack: {
      flexDirection: 'row',
      backgroundColor: c.surfaceMuted,
      borderRadius: 12,
      padding: 4,
      gap: 4,
      marginBottom: 14,
    },
    modeSegment: {
      flex: 1,
      height: 38,
      borderRadius: 9,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    modeSegmentActive: {
      backgroundColor: c.surface,
      shadowColor: c.cardShadow,
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    modeText: {
      color: c.textSecondary,
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
    },
    modeTextActive: {
      color: c.accent,
      fontWeight: Typography.fontWeight.bold,
    },
  });
