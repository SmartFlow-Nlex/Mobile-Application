import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';
import {
  NlexDirectionId,
  getDirection,
  getExit,
  exitsInTravelOrder,
  nlexDirections,
  reachableExits,
} from '../../constants/nlexSegments';
import { SegmentPrediction, congestionLevelLabel } from '../../lib/trafficModel';
import { EventForecastSeed } from '../../constants/dashboardData';
import Dropdown, { DropdownOption } from '../Dropdown';
import { toneFor } from './severity';

export interface SegmentForecastCardProps {
  direction: NlexDirectionId;
  fromId: string | null;
  toId: string | null;
  onChangeDirection: (direction: NlexDirectionId) => void;
  onChangeFrom: (id: string) => void;
  onChangeTo: (id: string) => void;
  /** Null until both endpoints are chosen. */
  prediction: SegmentPrediction | null;
  /** Event pushing extra load onto this segment at the forecast time, if any. */
  eventDriver: EventForecastSeed | null;
  /** e.g. "Right now" or "In 3 hours". */
  horizonLabel: string;
}

const directionIcon: Record<NlexDirectionId, keyof typeof Ionicons.glyphMap> = {
  northbound: 'caret-up-circle',
  southbound: 'caret-down-circle',
};

function toOptions(exits: ReturnType<typeof exitsInTravelOrder>): DropdownOption[] {
  return exits.map((exit) => ({
    id: exit.id,
    label: exit.name,
    sublabel: exit.city,
  }));
}

const SegmentForecastCard: React.FC<SegmentForecastCardProps> = ({
  direction,
  fromId,
  toId,
  onChangeDirection,
  onChangeFrom,
  onChangeTo,
  prediction,
  eventDriver,
  horizonLabel,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const directionOptions: DropdownOption[] = useMemo(
    () =>
      nlexDirections.map((item) => ({
        id: item.id,
        label: item.label,
        sublabel: item.hint,
        icon: directionIcon[item.id],
      })),
    [],
  );

  const fromOptions = useMemo(() => toOptions(exitsInTravelOrder(direction)), [direction]);

  const toOptionsList = useMemo(
    () => toOptions(reachableExits(direction, fromId)),
    [direction, fromId],
  );

  const from = getExit(fromId);
  const to = getExit(toId);

  return (
    <View style={styles.card}>
      <Dropdown
        label="Direction"
        placeholder="Select direction"
        options={directionOptions}
        value={direction}
        onChange={(id) => onChangeDirection(id as NlexDirectionId)}
        helperText="Northbound heads towards Sta. Ines, southbound towards Balintawak."
      />

      <Dropdown
        label="From"
        placeholder="Starting point"
        options={fromOptions}
        value={fromId}
        onChange={onChangeFrom}
        helperText={`Exits listed in travel order: ${getDirection(direction).hint}.`}
      />

      <Dropdown
        label="To"
        placeholder="Destination"
        options={toOptionsList}
        value={toId}
        onChange={onChangeTo}
        disabled={fromId === null}
        helperText="Only exits ahead of your starting point are shown."
        emptyText={
          fromId === null
            ? 'Choose a starting point first.'
            : 'This is the last exit in that direction.'
        }
      />

      {prediction === null || from === null || to === null ? (
        <View style={styles.emptyState}>
          <Ionicons name="navigate-circle-outline" size={22} color={colors.textTertiary} />
          <Text style={styles.emptyStateText}>
            Pick a direction, starting point and destination to see the congestion
            forecast for that stretch.
          </Text>
        </View>
      ) : (
        <CongestionResult
          fromName={from.name}
          toName={to.name}
          directionLabel={getDirection(direction).label}
          prediction={prediction}
          eventDriver={eventDriver}
          horizonLabel={horizonLabel}
        />
      )}
    </View>
  );
};

interface CongestionResultProps {
  fromName: string;
  toName: string;
  directionLabel: string;
  prediction: SegmentPrediction;
  eventDriver: EventForecastSeed | null;
  horizonLabel: string;
}

const CongestionResult: React.FC<CongestionResultProps> = ({
  fromName,
  toName,
  directionLabel,
  prediction,
  eventDriver,
  horizonLabel,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const tone = toneFor(prediction.level, colors);

  return (
    <View style={styles.result}>
      <View style={styles.resultHeader}>
        <View style={styles.resultTitleGroup}>
          <Ionicons name="navigate" size={15} color={colors.accent} />
          <Text style={styles.resultTitle} numberOfLines={2}>
            {fromName} - {toName}
          </Text>
        </View>

        <View style={[styles.levelPill, { backgroundColor: tone.background }]}>
          <Text style={[styles.levelPillText, { color: tone.text }]}>
            {congestionLevelLabel[prediction.level]}
          </Text>
        </View>
      </View>

      <Text style={styles.resultRoute}>
        {fromName} to {toName} ({directionLabel})
      </Text>

      <View style={styles.probabilityRow}>
        <Text style={styles.probabilityLabel}>Congestion Probability</Text>
        <Text style={[styles.probabilityValue, { color: tone.text }]}>
          {prediction.probability}%
        </Text>
      </View>

      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: prediction.probability }}
      >
        <View
          style={[
            styles.trackFill,
            { width: `${prediction.probability}%`, backgroundColor: tone.solid },
          ]}
        />
      </View>

      <View style={styles.statRow}>
        <Stat icon="time-outline" label={`+${prediction.delayMinutes} min delay`} />
        <Stat icon="speedometer-outline" label={`${prediction.travelMinutes} min travel`} />
        <Stat icon="git-commit-outline" label={`${prediction.distanceKm} km`} />
      </View>

      <View style={styles.driverRow}>
        <Ionicons name="analytics-outline" size={13} color={colors.textSecondary} />
        <Text style={styles.driverText} numberOfLines={2}>
          {prediction.primaryDriver} - {horizonLabel.toLowerCase()}, averaging{' '}
          {prediction.averageSpeedKph} km/h
        </Text>
      </View>

      {eventDriver !== null ? (
        <View style={styles.eventNote}>
          <Ionicons name="calendar" size={13} color={colors.accent} />
          <Text style={styles.eventNoteText} numberOfLines={2}>
            Includes added load from {eventDriver.title}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

interface StatProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const Stat: React.FC<StatProps> = ({ icon, label }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={13} color={colors.textSecondary} />
      <Text style={styles.statText}>{label}</Text>
    </View>
  );
};

export default SegmentForecastCard;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: c.cardShadow,
      shadowOpacity: 0.05,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
      marginBottom: 20,
    },
    emptyState: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: c.surfaceSubtle,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.hairline,
      borderStyle: 'dashed',
      padding: 14,
      marginTop: 2,
    },
    emptyStateText: {
      flex: 1,
      color: c.textSecondary,
      fontSize: Typography.fontSize.xs,
      fontWeight: '500',
      lineHeight: 17,
    },
    result: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.field,
      padding: 14,
      marginTop: 2,
    },
    resultHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
    },
    resultTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    resultTitle: {
      color: c.text,
      fontSize: Typography.fontSize.base,
      fontWeight: '800',
      flex: 1,
    },
    levelPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
    },
    levelPillText: {
      fontSize: Typography.fontSize.xs,
      fontWeight: '800',
    },
    resultRoute: {
      color: c.textSecondary,
      fontSize: Typography.fontSize.xs,
      fontWeight: '600',
      marginTop: 6,
      marginBottom: 12,
    },
    probabilityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 7,
    },
    probabilityLabel: {
      color: c.textSecondary,
      fontSize: Typography.fontSize.xs,
      fontWeight: '600',
    },
    probabilityValue: {
      fontSize: Typography.fontSize.base,
      fontWeight: '800',
    },
    track: {
      height: 8,
      borderRadius: 4,
      backgroundColor: c.track,
      overflow: 'hidden',
    },
    trackFill: {
      height: '100%',
      borderRadius: 4,
    },
    statRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 14,
      marginTop: 12,
    },
    stat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      color: c.textSecondary,
      fontSize: Typography.fontSize.xs,
      fontWeight: '600',
    },
    driverRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 5,
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: c.hairline,
    },
    driverText: {
      flex: 1,
      color: c.textSecondary,
      fontSize: Typography.fontSize.xs,
      fontWeight: '500',
      lineHeight: 16,
    },
    eventNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 8,
      backgroundColor: c.primarySoft,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    eventNoteText: {
      flex: 1,
      color: c.accent,
      fontSize: Typography.fontSize.xs,
      fontWeight: '700',
    },
  });
