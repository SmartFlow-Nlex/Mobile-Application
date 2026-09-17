import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';
import { addHours, describeHourOffset, formatLongDate, formatTime } from '../../lib/datetime';
import {
  congestionLevelLabel,
  corridorProbability,
  levelFor,
  predictSegment,
  type SegmentPrediction,
} from '../../lib/trafficModel';
import { exitsInTravelOrder, type NlexDirectionId } from '../../constants/nlexSegments';
import { toneFor } from '../dashboard/severity';
import CorridorRoad, { type RoadDirectionReading, type RoadRow } from './CorridorRoad';

type ForecastStep = 'Now' | '+6h' | '+12h' | '+24h' | '+48h';
const forecastSteps: ForecastStep[] = ['Now', '+6h', '+12h', '+24h', '+48h'];

/** Hours-ahead each forecast stop represents. */
const forecastHours: Record<ForecastStep, number> = {
  Now: 0,
  '+6h': 6,
  '+12h': 12,
  '+24h': 24,
  '+48h': 48,
};

const summaryDirections: {
  id: NlexDirectionId;
  label: string;
  arrow: 'arrow-up' | 'arrow-down';
}[] = [
  { id: 'northbound', label: 'Northbound', arrow: 'arrow-up' },
  { id: 'southbound', label: 'Southbound', arrow: 'arrow-down' },
];

/**
 * Northbound travel order is km ascending - Balintawak (0) up to Sta. Ines -
 * which is the same order the live feed returns its exits in. Using it here
 * means the forecast road and the live road list the corridor identically.
 */
const orderedExits = exitsInTravelOrder('northbound');

function readingFor(prediction: SegmentPrediction): RoadDirectionReading {
  const delay = Math.round(prediction.delayMinutes);
  return {
    level: prediction.level,
    // The delay is the one number the colour does not already carry.
    value: delay >= 1 ? `+${delay} min` : 'No delay',
  };
}

function detailFor(prediction: SegmentPrediction): string {
  return [
    `${congestionLevelLabel[prediction.level]} · ${prediction.probability}% risk`,
    `+${Math.round(prediction.delayMinutes)} min over free flow`,
    `${Math.round(prediction.averageSpeedKph)} km/h average`,
    prediction.primaryDriver,
  ].join('\n');
}

/**
 * The corridor as the model expects it to be at `at`.
 *
 * The model predicts per-SEGMENT, which is what a road diagram actually draws:
 * each row's pavement is the stretch leaving that interchange. The final row
 * has nothing leaving it, so it borrows the stretch arriving into it rather
 * than rendering a gap.
 */
function forecastRows(at: Date): RoadRow[] {
  return orderedExits.map((exit, index) => {
    const nextIndex = index + 1 < orderedExits.length ? index + 1 : index - 1;
    const other = orderedExits[nextIndex]!;
    const lower = index < nextIndex ? exit : other;
    const upper = index < nextIndex ? other : exit;

    // Northbound runs km ascending, southbound km descending - so the two
    // directions use the same pair of exits with from/to swapped.
    const nb = predictSegment({
      direction: 'northbound',
      fromId: lower.id,
      toId: upper.id,
      at,
    });
    const sb = predictSegment({
      direction: 'southbound',
      fromId: upper.id,
      toId: lower.id,
      at,
    });

    return {
      id: exit.id,
      name: exit.name,
      km: exit.km,
      NB: readingFor(nb),
      SB: readingFor(sb),
      detail: [
        { label: `Northbound · ${lower.name} to ${upper.name}`, value: detailFor(nb) },
        { label: `Southbound · ${upper.name} to ${lower.name}`, value: detailFor(sb) },
      ],
      detailFooter: `${exit.city} · KM ${exit.km}`,
    };
  });
}

export interface ForecastCorridorViewProps {
  now: Date;
}

/**
 * The forecast view: the same road, filled with modelled values.
 *
 * The horizon control used to sit above live-only data and change nothing but
 * a caption in its own card. It drives the whole road now - move the slider
 * and every stretch of pavement recolours - so the control and the picture
 * finally refer to the same thing.
 */
const ForecastCorridorView: React.FC<ForecastCorridorViewProps> = ({ now }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [selectedStep, setSelectedStep] = useState<ForecastStep>('Now');

  const selectedIndex = forecastSteps.indexOf(selectedStep);
  const lastIndex = forecastSteps.length - 1;

  /**
   * Drag support for the forecast track.
   *
   * Built on PanResponder rather than a slider package: this has to work in
   * Expo Go without adding a native module, and on react-native-web for the
   * browser build.
   *
   * Movement is derived from the gesture's `dx` against the index the drag
   * started on, not from the touch's absolute position. `locationX` is
   * measured against whatever element is under the finger, which on web stops
   * being the track as soon as the pointer strays outside it - so a drag would
   * jump erratically near the ends.
   */
  const trackWidthRef = useRef<number>(0);
  const dragStartIndexRef = useRef<number>(0);
  const selectedIndexRef = useRef<number>(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  const setIndex = useCallback((index: number): void => {
    const clamped = Math.min(Math.max(index, 0), forecastSteps.length - 1);
    const next = forecastSteps[clamped];
    if (next !== undefined) {
      setSelectedStep(next);
    }
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Claim the gesture before the enclosing ScrollView can treat a
        // sideways drag as a scroll.
        onMoveShouldSetPanResponderCapture: (_event, gesture) => Math.abs(gesture.dx) > 2,
        onPanResponderGrant: (event) => {
          const width = trackWidthRef.current;
          const x = event.nativeEvent.locationX;
          // Tap anywhere on the track to jump there; the drag then continues
          // from wherever it landed.
          if (width > 0 && Number.isFinite(x)) {
            const tapped = Math.round((x / width) * lastIndex);
            dragStartIndexRef.current = Math.min(Math.max(tapped, 0), lastIndex);
            setIndex(tapped);
          } else {
            dragStartIndexRef.current = selectedIndexRef.current;
          }
        },
        onPanResponderMove: (_event, gesture) => {
          const width = trackWidthRef.current;
          if (width <= 0) {
            return;
          }
          const stepWidth = width / lastIndex;
          const next = dragStartIndexRef.current + Math.round(gesture.dx / stepWidth);
          if (next !== selectedIndexRef.current) {
            setIndex(next);
          }
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [lastIndex, setIndex],
  );

  const offsetHours = forecastHours[selectedStep];
  const forecastAt = useMemo(() => addHours(now, offsetHours), [now, offsetHours]);
  const horizonLabel = describeHourOffset(offsetHours);
  const timestampLabel = useMemo(() => formatLongDate(forecastAt), [forecastAt]);
  const clockLabel = useMemo(() => formatTime(forecastAt), [forecastAt]);

  const summary = useMemo(
    () =>
      summaryDirections.map((direction) => {
        const probability = corridorProbability(direction.id, forecastAt);
        return { ...direction, probability, level: levelFor(probability) };
      }),
    [forecastAt],
  );

  // 40 segment predictions per horizon - pure deterministic maths, but there is
  // no reason to redo it on an unrelated re-render.
  const rows = useMemo(() => forecastRows(forecastAt), [forecastAt]);

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <View style={styles.eyebrowRow}>
              <Text style={styles.eyebrow}>FORECAST</Text>
              <View style={styles.modelPill}>
                <Ionicons name="analytics-outline" size={9} color={colors.accent} />
                <Text style={styles.modelPillText}>MODEL</Text>
              </View>
            </View>
            <Text style={styles.timestamp}>{timestampLabel}</Text>
            <Text style={styles.horizon}>
              {clockLabel} · {horizonLabel}
            </Text>
          </View>

          {selectedStep === 'Now' ? null : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset the forecast to now"
              onPress={() => setSelectedStep('Now')}
              style={({ pressed }) => [styles.resetButton, pressed && styles.pressedDim]}
            >
              <Ionicons name="refresh-outline" size={17} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* The whole strip is the grab area - a 14px dot is too small to drag
            comfortably, so the padding gives it a proper touch target. */}
        <View
          accessibilityRole="adjustable"
          accessibilityLabel="Forecast time"
          accessibilityValue={{
            min: 0,
            max: lastIndex,
            now: selectedIndex,
            text: `${timestampLabel}, ${horizonLabel}`,
          }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'increment') {
              setIndex(selectedIndex + 1);
            } else if (event.nativeEvent.actionName === 'decrement') {
              setIndex(selectedIndex - 1);
            }
          }}
          onLayout={(event) => {
            trackWidthRef.current = event.nativeEvent.layout.width;
          }}
          style={styles.sliderTrack}
          {...panResponder.panHandlers}
        >
          <View style={styles.sliderRail} />
          <View style={[styles.sliderFill, { width: `${selectedIndex * 25}%` }]} />

          {forecastSteps.map((step, index) => (
            <View
              key={step}
              style={[
                styles.sliderDot,
                {
                  left: `${index * 25}%`,
                  backgroundColor: index <= selectedIndex ? colors.accent : colors.border,
                },
              ]}
            />
          ))}

          {/* Drawn last so it sits above the ticks it overlaps. */}
          <View style={[styles.sliderThumb, { left: `${selectedIndex * 25}%` }]} />
        </View>

        <View style={styles.tickRow}>
          {forecastSteps.map((step) => (
            <Pressable
              key={step}
              accessibilityRole="button"
              accessibilityState={{ selected: step === selectedStep }}
              hitSlop={10}
              onPress={() => setSelectedStep(step)}
              style={styles.tick}
            >
              <Text style={[styles.tickText, step === selectedStep && styles.tickTextActive]}>
                {step}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.summaryRow}>
          {summary.map((reading) => {
            const tone = toneFor(reading.level, colors);
            return (
              <View key={reading.id} style={styles.summary}>
                <View style={styles.summaryTop}>
                  <Ionicons name={reading.arrow} size={12} color={colors.textSecondary} />
                  <Text style={styles.summaryLabel}>{reading.label}</Text>
                </View>
                <Text style={[styles.summaryLevel, { color: tone.text }]}>
                  {congestionLevelLabel[reading.level]}
                </Text>
                <View style={styles.meterTrack}>
                  <View
                    style={[
                      styles.meterFill,
                      { width: `${reading.probability}%`, backgroundColor: tone.solid },
                    ]}
                  />
                </View>
                <Text style={styles.summaryMeta}>{reading.probability}% congestion risk</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={12} color={colors.textTertiary} />
          <Text style={styles.footerText}>
            Modelled from historical patterns, not the live feed. Switch to Live now for
            current readings.
          </Text>
        </View>
      </View>

      <CorridorRoad rows={rows} />
    </View>
  );
};

export default ForecastCorridorView;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    wrap: {
      gap: 14,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      shadowColor: c.cardShadow,
      shadowOpacity: 0.07,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 5 },
      elevation: 3,
    },
    pressedDim: {
      opacity: 0.65,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 16,
    },
    headerText: {
      flex: 1,
    },
    eyebrowRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginBottom: 5,
    },
    eyebrow: {
      color: c.textTertiary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
    },
    modelPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: c.primarySoft,
    },
    modelPillText: {
      color: c.accent,
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    timestamp: {
      color: c.text,
      fontSize: Typography.fontSize.lg,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    horizon: {
      color: c.accent,
      fontSize: Typography.fontSize.xs,
      fontWeight: '700',
      marginTop: 3,
    },
    resetButton: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
    },

    sliderTrack: {
      height: 36,
      justifyContent: 'center',
      marginBottom: 6,
    },
    // The unfilled part of the track. Without it the control read as five loose
    // dots rather than something with a range to drag along.
    sliderRail: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 5,
      backgroundColor: c.track,
      borderRadius: 999,
    },
    sliderFill: {
      position: 'absolute',
      left: 0,
      height: 5,
      backgroundColor: c.accent,
      borderRadius: 999,
    },
    sliderDot: {
      // In style rather than as a prop: the `pointerEvents` prop is deprecated
      // in RN 0.86 and warns on every render.
      pointerEvents: 'none',
      position: 'absolute',
      width: 10,
      height: 10,
      borderRadius: 5,
      marginLeft: -5,
    },
    sliderThumb: {
      pointerEvents: 'none',
      position: 'absolute',
      width: 26,
      height: 26,
      borderRadius: 13,
      marginLeft: -13,
      backgroundColor: c.surface,
      borderWidth: 3,
      borderColor: c.accent,
      shadowColor: c.cardShadow,
      shadowOpacity: 0.22,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    tickRow: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    tick: {
      flex: 1,
      paddingVertical: 5,
    },
    tickText: {
      color: c.textTertiary,
      fontSize: Typography.fontSize.xs,
      fontWeight: '600',
      textAlign: 'center',
    },
    tickTextActive: {
      color: c.accent,
      fontWeight: '800',
    },

    summaryRow: {
      flexDirection: 'row',
      gap: 10,
    },
    summary: {
      flex: 1,
      gap: 6,
      padding: 12,
      borderRadius: 14,
      backgroundColor: c.surfaceSubtle,
      borderWidth: 1,
      borderColor: c.hairline,
    },
    summaryTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    summaryLabel: {
      color: c.textSecondary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    summaryLevel: {
      fontSize: Typography.fontSize.lg,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    meterTrack: {
      height: 6,
      borderRadius: 999,
      backgroundColor: c.track,
      overflow: 'hidden',
    },
    meterFill: {
      height: 6,
      borderRadius: 999,
    },
    summaryMeta: {
      color: c.textTertiary,
      fontSize: 10,
      fontWeight: '600',
    },

    footer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.hairline,
    },
    footerText: {
      flex: 1,
      color: c.textTertiary,
      fontSize: 10,
      fontWeight: '600',
      lineHeight: 15,
    },
  });
