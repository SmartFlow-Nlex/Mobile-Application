import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';
import {
  NlexDirectionId,
  exitsBetween,
  isValidPair,
} from '../../constants/nlexSegments';
import {
  eventDate,
  eventForecasts,
  eventLoadForSegment,
  mlHotspots,
  EventForecastSeed,
} from '../../constants/dashboardData';
import { addHours, describeHourOffset } from '../../lib/datetime';
import { SegmentPrediction, predictNetwork, predictSegment } from '../../lib/trafficModel';
import { useLiveClock } from '../../hooks/useNow';
import AvatarButton from '../../components/AvatarButton';
import StatusSummaryCard from '../../components/dashboard/StatusSummaryCard';
import ForecastTimeCard from '../../components/dashboard/ForecastTimeCard';
import SegmentForecastCard from '../../components/dashboard/SegmentForecastCard';
import EventForecastCard from '../../components/dashboard/EventForecastCard';
import MlHotspotCard from '../../components/dashboard/MlHotspotCard';
import OutlookStrip from '../../components/dashboard/OutlookStrip';

const filterOptions = ['Right Now', 'Today', 'This Week'] as const;
type FilterOption = (typeof filterOptions)[number];

export default function DashboardScreen(): React.ReactElement {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();

  // Coarse ticker: the seconds-accurate clock lives inside StatusSummaryCard so
  // the whole screen is not re-rendered every second.
  const { now, refresh } = useLiveClock(15000);

  const [activeFilter, setActiveFilter] = useState<FilterOption>('Right Now');
  const [offsetHours, setOffsetHours] = useState(0);
  const [direction, setDirection] = useState<NlexDirectionId>('northbound');
  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const forecastAt = useMemo(() => addHours(now, offsetHours), [now, offsetHours]);
  const horizonLabel = describeHourOffset(offsetHours);

  const networkStatus = useMemo(() => predictNetwork(now), [now]);

  /** Every exit the selected trip passes through, endpoints included. */
  const segmentExitIds = useMemo(() => {
    if (fromId === null || toId === null) {
      return [];
    }
    return [fromId, ...exitsBetween(direction, fromId, toId).map((exit) => exit.id), toId];
  }, [direction, fromId, toId]);

  const eventImpact = useMemo(
    () => eventLoadForSegment(segmentExitIds, forecastAt, now),
    [segmentExitIds, forecastAt, now],
  );

  const prediction: SegmentPrediction | null = useMemo(() => {
    if (fromId === null || toId === null || !isValidPair(direction, fromId, toId)) {
      return null;
    }
    return predictSegment({
      direction,
      fromId,
      toId,
      at: forecastAt,
      eventLoad: eventImpact.load,
    });
  }, [direction, fromId, toId, forecastAt, eventImpact.load]);

  const upcomingEvents = useMemo(() => {
    return [...eventForecasts].sort(
      (a, b) => eventDate(a, now).getTime() - eventDate(b, now).getTime(),
    );
  }, [now]);

  const affectsSelection = useCallback(
    (event: EventForecastSeed): boolean =>
      segmentExitIds.length > 0 &&
      event.affectedExitIds.some((id) => segmentExitIds.includes(id)),
    [segmentExitIds],
  );

  /**
   * Reversing direction reverses the trip, so carry the endpoints over swapped
   * rather than making the user re-pick them.
   */
  const handleDirectionChange = useCallback(
    (next: NlexDirectionId): void => {
      if (next === direction) {
        return;
      }
      setDirection(next);
      setFromId(toId);
      setToId(fromId);
    },
    [direction, fromId, toId],
  );

  const handleFromChange = useCallback(
    (id: string): void => {
      setFromId(id);
      // The old destination may now be behind the new starting point.
      if (toId !== null && !isValidPair(direction, id, toId)) {
        setToId(null);
      }
    },
    [direction, toId],
  );

  const handleRefresh = useCallback((): void => {
    setRefreshing(true);
    refresh();
    setRefreshing(false);
  }, [refresh]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.screen}>
        {/* Status-bar style is set once for all tabs in app/(tabs)/_layout.tsx. */}
        <View style={styles.headerBar}>
          <View style={styles.brandGroup}>
            <View style={styles.brandIcon}>
              <Image
                source={require('../../assets/smartflow-logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.brandText}>
              <Text style={styles.brandTitle}>SmartFlow NLEX</Text>
            </View>
          </View>

          <AvatarButton initials="NT" onPress={() => router.push('/profile')} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        >
          <StatusSummaryCard status={networkStatus} />

          <SectionTitle icon="trending-up" title="Traffic Forecast" />
          <ForecastTimeCard
            now={now}
            offsetHours={offsetHours}
            onChangeOffset={setOffsetHours}
          />

          <View style={styles.filterRow}>
            {filterOptions.map((item) => {
              const active = item === activeFilter;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setActiveFilter(item)}
                  style={({ pressed }) => [
                    styles.filterPill,
                    active && styles.filterPillActive,
                    pressed && !active && styles.filterPillPressed,
                  ]}
                >
                  <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {activeFilter === 'Right Now' ? null : (
            <OutlookStrip
              scope={activeFilter === 'Today' ? 'today' : 'week'}
              direction={direction}
              now={now}
            />
          )}

          <SectionTitle icon="swap-horizontal" title="Segment Status" />
          <SegmentForecastCard
            direction={direction}
            fromId={fromId}
            toId={toId}
            onChangeDirection={handleDirectionChange}
            onChangeFrom={handleFromChange}
            onChangeTo={setToId}
            prediction={prediction}
            eventDriver={eventImpact.source}
            horizonLabel={horizonLabel}
          />

          <SectionTitle
            icon="calendar"
            title="Event-Triggered Forecasts"
            badge={String(upcomingEvents.length)}
          />
          <View style={styles.cardList}>
            {upcomingEvents.map((event) => (
              <EventForecastCard
                key={event.id}
                event={event}
                now={now}
                affectsSelection={affectsSelection(event)}
              />
            ))}
          </View>

          <SectionTitle icon="alert-circle" title="ML-Identified Hotspots" tone="danger" />
          <View style={styles.cardList}>
            {mlHotspots.map((hotspot) => (
              <MlHotspotCard key={hotspot.id} hotspot={hotspot} />
            ))}
          </View>
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open the AI assistant"
          onPress={() => router.push('/(tabs)/assistant')}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <Ionicons name="chatbubble-ellipses" size={22} color={colors.textInverse} />
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

interface SectionTitleProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  badge?: string;
  tone?: 'primary' | 'danger';
}

const SectionTitle: React.FC<SectionTitleProps> = ({
  icon,
  title,
  badge,
  tone = 'primary',
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.sectionHeader}>
      <Ionicons
        name={icon}
        size={18}
        color={tone === 'danger' ? colors.danger : colors.primary}
      />
      <Text style={styles.sectionTitle}>{title}</Text>
      {badge !== undefined ? (
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
};

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.primary,
  },
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 128,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: c.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandLogo: {
    width: 22,
    height: 22,
  },
  brandText: {
    flex: 1,
  },
  brandTitle: {
    color: c.textInverse,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  filterPillActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  filterPillPressed: {
    backgroundColor: c.surfaceLight,
  },
  filterPillText: {
    color: c.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: c.textInverse,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: c.text,
  },
  sectionBadge: {
    minWidth: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: c.surfaceLight,
    alignItems: 'center',
  },
  sectionBadgeText: {
    color: c.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  cardList: {
    gap: 12,
    marginBottom: 22,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: c.primaryShadow,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  fabPressed: {
    backgroundColor: c.primaryDark,
  },
  aiBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: c.surface,
  },
  aiBadgeText: {
    color: c.textInverse,
    fontSize: 9,
    fontWeight: '800',
  },
});
