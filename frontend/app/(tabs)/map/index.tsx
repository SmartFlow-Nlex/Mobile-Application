import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AIAssistantFAB from '../../../components/community/AIAssistantFAB';
import { useTheme, useThemedStyles } from '../../../theme';
import AvatarButton from '../../../components/AvatarButton';
import type { ThemePalette } from '../../../theme';
import { addHours, describeHourOffset, formatDateTime } from '../../../lib/datetime';
import useNow from '../../../hooks/useNow';
import LiveCorridorStatus from '../../../components/map/LiveCorridorStatus';
import { Typography } from '../../../constants/typography';

type ForecastStep = 'Now' | '+6h' | '+12h' | '+24h' | '+48h';
const forecastSteps: ForecastStep[] = ['Now', '+6h', '+12h', '+24h', '+48h'];

/** Hours-ahead each forecast chip represents. */
const forecastHours: Record<ForecastStep, number> = {
  Now: 0,
  '+6h': 6,
  '+12h': 12,
  '+24h': 24,
  '+48h': 48,
};

export default function MapScreen(): React.ReactElement {
  const { colors } = useTheme();
  const router = useRouter();
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
        onMoveShouldSetPanResponderCapture: (_event, gesture) =>
          Math.abs(gesture.dx) > 2,
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

  // Coarse ticker: minute-level precision is plenty for a 6h/12h/24h/48h horizon.
  const now = useNow(30000);
  const forecastAt = useMemo(
    () => addHours(now, forecastHours[selectedStep]),
    [now, selectedStep],
  );
  const horizonLabel = describeHourOffset(forecastHours[selectedStep]);
  const timestampLabel = useMemo(() => formatDateTime(forecastAt), [forecastAt]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerBar}>
            <View style={styles.brandGroup}>
              <View style={styles.logoWrap}>
                <Image
                  source={require('../../../assets/smartflow-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>SmartFlow NLEX</Text>
              </View>
            </View>

            <AvatarButton initials="NT" onPress={() => router.push('/profile')} />
          </View>

          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderIcon}>
              <Ionicons name="map-outline" size={18} color={colors.textInverse} />
            </View>
            <View style={styles.pageHeaderText}>
              <Text style={styles.pageTitle}>Map</Text>
              <Text style={styles.pageSubtitle}>
                Visualize predicted congestion up to 48 hours ahead
              </Text>
            </View>
          </View>

          <View style={styles.forecastCard}>
            <View style={styles.forecastTopRow}>
              <View>
                <Text style={styles.forecastCaption}>Viewing forecast for</Text>
                <Text style={styles.forecastTime}>{timestampLabel}</Text>
                <Text style={styles.forecastStatus}>{horizonLabel}</Text>
              </View>

              <Pressable onPress={() => setSelectedStep('Now')} style={styles.resetButton}>
                <Ionicons name="refresh-outline" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* The whole strip is the grab area - a 14px dot is too small to
                drag comfortably, so the padding gives it a proper touch target. */}
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
                  pointerEvents="none"
                  style={[
                    styles.sliderDot,
                    {
                      left: `${index * 25}%`,
                      backgroundColor:
                        index <= selectedIndex ? colors.accent : colors.border,
                    },
                  ]}
                />
              ))}

              {/* Drawn last so it sits above the ticks it overlaps. */}
              <View
                pointerEvents="none"
                style={[styles.sliderThumb, { left: `${selectedIndex * 25}%` }]}
              />
            </View>

            <View style={styles.timeChipRow}>
              {forecastSteps.map((step) => (
                <Pressable
                  key={step}
                  onPress={() => setSelectedStep(step)}
                  style={[styles.timeChip, step === selectedStep && styles.timeChipActive]}
                >
                  <Text
                    style={[styles.timeChipText, step === selectedStep && styles.timeChipTextActive]}
                  >
                    {step}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.mapCard}>
            <LiveCorridorStatus />
          </View>
        </ScrollView>

        <AIAssistantFAB onPress={() => undefined} />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
  safeArea: {
    // Brand colour so the status-bar inset runs into the header instead of
    // leaving a white strip above it.
    flex: 1,
    backgroundColor: c.primary,
  },
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  content: {
    paddingBottom: 120,
  },
  headerBar: {
    backgroundColor: c.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
    overflow: 'hidden',
  },
  logo: {
    width: 22,
    height: 22,
  },
  headerTitle: {
    color: c.textInverse,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  headerIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  pageHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
  },
  pageHeaderText: {
    flex: 1,
  },
  pageTitle: {
    color: c.text,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  pageSubtitle: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.xs,
    marginTop: 4,
  },
  forecastCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: c.cardShadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  forecastTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  forecastCaption: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.xs,
    marginBottom: 4,
  },
  forecastTime: {
    color: c.accent,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 4,
  },
  forecastStatus: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.xs,
  },
  resetButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 36,
    justifyContent: 'center',
    marginBottom: 14,
  },
  // The unfilled part of the track. Without it the control read as five loose
  // dots rather than something with a range to drag along.
  sliderRail: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: c.hairline,
    borderRadius: 999,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    backgroundColor: c.primary,
    borderRadius: 999,
  },
  sliderDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5,
  },
  sliderThumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: -11,
    backgroundColor: c.surface,
    borderWidth: 3,
    borderColor: c.primary,
    shadowColor: c.cardShadow,
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  timeChipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeChip: {
    flex: 1,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.hairline,
  },
  timeChipActive: {
    backgroundColor: c.primary,
  },
  timeChipText: {
    color: c.text,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  timeChipTextActive: {
    color: c.textInverse,
  },
  mapCard: {
    marginHorizontal: 10,
    backgroundColor: c.surfaceSubtle,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: c.primarySoft,
  },
});
