import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';
import { CongestionLevel } from '../../lib/trafficModel';
import { CorridorDirectionStatus, CorridorExit, CorridorStatusValue } from '../../lib/corridorApi';
import { useCorridorStatus } from '../../hooks/useCorridorStatus';
import { toneFor } from '../dashboard/severity';
import Dropdown, { DropdownOption } from '../Dropdown';

/** How tall the independently-scrolling list gets before it clips. */
const LIST_MAX_HEIGHT = 460;
/** NB lane (30) + KM marker (46) + SB lane (30) - kept in sync with those column widths below. */
const ROAD_GROUP_WIDTH = 106;

/** The server's own vocabulary - never the synthetic model's Low/Moderate/High/Severe. */
const statusLabel: Record<CorridorStatusValue, string> = {
  clear: 'Clear',
  slow: 'Slow',
  congested: 'Congested',
};

/** Server status -> our shared colour tiers. `slow` maps to moderate, not high, to leave room for a real intermediate reading later. */
const statusTone: Record<CorridorStatusValue, CongestionLevel> = {
  clear: 'low',
  slow: 'moderate',
  congested: 'severe',
};

function formatFeedAge(ageMinutes: number | null): string {
  if (ageMinutes === null) {
    return 'no data yet';
  }
  if (ageMinutes < 1) {
    return 'updated moments ago';
  }
  const rounded = Math.round(ageMinutes);
  return `updated ${rounded} min${rounded === 1 ? '' : 's'} ago`;
}

interface RoadLaneProps {
  color: string;
  /** False draws a bare, undashed grey bar - no ramp means no traffic ever flows here. */
  active: boolean;
  /** Rounds the top corners - only the very first segment of the road. */
  capStart?: boolean;
  /** Rounds the bottom corners - only the very last segment of the road. */
  capEnd?: boolean;
}

/**
 * One exit's worth of coloured pavement, with dashed lane markings down the
 * centre. Fills its column completely - no margin, no padding around the
 * fill itself - so consecutive segments butt directly against each other and
 * read as one unbroken road rather than a stack of separate pills.
 */
const RoadLane: React.FC<RoadLaneProps> = ({ color, active, capStart = false, capEnd = false }) => {
  const styles = useThemedStyles(makeStyles);
  return (
    <View
      style={[
        styles.roadBar,
        { backgroundColor: color },
        capStart && styles.roadBarCapStart,
        capEnd && styles.roadBarCapEnd,
      ]}
    >
      {active ? (
        <View style={styles.roadDashes}>
          <View style={styles.roadDash} />
          <View style={styles.roadDash} />
          <View style={styles.roadDash} />
        </View>
      ) : null}
    </View>
  );
};

interface CountPillProps {
  label: string;
  count: number;
  level: CongestionLevel;
}

const CountPill: React.FC<CountPillProps> = ({ label, count, level }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const tone = toneFor(level, colors);
  return (
    <View style={[styles.countPill, { backgroundColor: tone.background }]}>
      <Text style={[styles.countPillValue, { color: tone.text }]}>{count}</Text>
      <Text style={[styles.countPillLabel, { color: tone.text }]}>{label}</Text>
    </View>
  );
};

/** Resolves a lane's fill colour, defaulting unrecognised server values to the least alarming tier rather than guessing. */
function laneTone(direction: CorridorDirectionStatus, colors: ThemePalette): { solid: string; background: string; text: string } {
  const level = statusTone[direction.status] ?? 'low';
  return toneFor(level, colors);
}

/**
 * A vertical, two-carriageway corridor diagram driven by the live Waze-derived
 * feed: real road-style bars, one column per direction, coloured by that
 * exit's own reported `status` (never re-derived from `level` - the server
 * has already classified it). Reading top to bottom follows the physical
 * highway from Balintawak (km 0) up to Sta. Ines (km ~76) in `exit_id` order,
 * exactly as the API returns it.
 *
 * The full corridor (20 interchanges) does not fit on screen, so the list
 * scrolls inside its own bounded box (LIST_MAX_HEIGHT) rather than growing
 * the whole tab - a drag inside the card never hijacks the page scroll.
 */
const LiveCorridorStatus: React.FC = () => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { data, isLoading, error, refresh } = useCorridorStatus();

  const exitOptions: DropdownOption[] = useMemo(() => {
    if (data === null) {
      return [];
    }
    return data.exits.map((exit) => ({
      id: String(exit.exit_id),
      label: exit.display_name,
      sublabel: `KM ${exit.km.toFixed(1)}`,
    }));
  }, [data]);

  const [selectedExitId, setSelectedExitId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  // Each row reports its own on-screen offset as it lays out, since exit
  // names can wrap to two lines - a fixed row-height guess would drift off
  // target after the first wrapped row.
  const rowOffsets = useRef<Record<string, number>>({});

  const handleRowLayout = (id: string) => (event: LayoutChangeEvent): void => {
    rowOffsets.current[id] = event.nativeEvent.layout.y;
  };

  const handleJumpToExit = (id: string): void => {
    setSelectedExitId(id);
    const y = rowOffsets.current[id];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
    }
  };

  // Nothing to show and not still trying: the feed is genuinely unavailable.
  const isOffline = data === null && !isLoading;

  const headerBlock = (
    <View style={styles.header}>
      <View style={styles.headerIcon}>
        <Ionicons name="git-network-outline" size={16} color={colors.textInverse} />
      </View>
      <View style={styles.headerText}>
        <Text style={styles.title}>Live Corridor Status</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {data === null
            ? isLoading
              ? 'Connecting to live feed...'
              : 'Live feed unavailable'
            : `Both directions - ${formatFeedAge(data.feed.ageMinutes)}`}
        </Text>
      </View>
      {/*
        Three honest states. Claiming LIVE while the body says the feed is
        unreachable is worse than saying nothing, so a failed fetch reads
        OFFLINE rather than staying green.
      */}
      <View
        style={[
          styles.liveBadge,
          data?.feed.stale === true && styles.liveBadgeStale,
          isOffline && styles.liveBadgeOffline,
        ]}
      >
        <View
          style={[
            styles.liveDot,
            data?.feed.stale === true && styles.liveDotStale,
            isOffline && styles.liveDotOffline,
          ]}
        />
        <Text
          style={[
            styles.liveText,
            data?.feed.stale === true && styles.liveTextStale,
            isOffline && styles.liveTextOffline,
          ]}
        >
          {isOffline ? 'OFFLINE' : data?.feed.stale === true ? 'STALE' : 'LIVE'}
        </Text>
      </View>
    </View>
  );

  // First load never resolved and nothing to show - a plain loading state,
  // not an "empty corridor".
  if (data === null && isLoading) {
    return (
      <View>
        {headerBlock}
        <View style={styles.statusBox}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.statusBoxText}>Loading live corridor status...</Text>
        </View>
      </View>
    );
  }

  // The request failed and we have never had data to fall back on. Say what is
  // wrong and what to do about it - the raw fetch exception means nothing to
  // whoever is holding the phone.
  if (data === null) {
    const unreachable = error === null || error.kind === 'unreachable';
    return (
      <View>
        {headerBlock}
        <View style={styles.statusBox}>
          <Ionicons name="cloud-offline-outline" size={22} color={colors.textTertiary} />
          <Text style={styles.statusBoxTitle}>
            {unreachable ? "Can't reach the backend" : 'The backend returned an error'}
          </Text>
          <Text style={styles.statusBoxText}>
            {unreachable
              ? 'Nothing answered at this address. Check that the SmartFlow dashboard server is running and that your phone is on the same Wi-Fi.'
              : error.message}
          </Text>
          {error?.url !== null && error?.url !== undefined ? (
            <Text style={styles.statusBoxUrl} numberOfLines={2}>
              {error.url}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={refresh}
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const { counts, exits, feed } = data;

  return (
    <View>
      {headerBlock}

      <View style={styles.countRow}>
        <CountPill label="Clear" count={counts.clear} level="low" />
        <CountPill label="Slow" count={counts.slow} level="moderate" />
        <CountPill label="Congested" count={counts.congested} level="severe" />
      </View>

      {feed.stale ? (
        <View style={styles.staleBanner}>
          <Ionicons name="alert-circle-outline" size={15} color={toneFor('moderate', colors).text} />
          <Text style={[styles.staleBannerText, { color: toneFor('moderate', colors).text }]}>
            This feed may be stale - the last update was {formatFeedAge(feed.ageMinutes)}.
          </Text>
        </View>
      ) : null}

      <Dropdown
        label="Exit"
        placeholder="Choose an interchange"
        options={exitOptions}
        value={selectedExitId}
        onChange={handleJumpToExit}
        helperText="Scrolls the corridor list straight to that exit."
      />

      <View style={styles.listFrame}>
        <View style={styles.columnHeader}>
          <View style={styles.exitCol} />
          <View style={styles.roadGroup}>
            <View style={styles.roadCol}>
              <Ionicons name="arrow-down" size={13} color={colors.textSecondary} />
            </View>
            <View style={styles.kmCol}>
              <Text style={styles.columnLabel}>KM</Text>
            </View>
            <View style={styles.roadCol}>
              <Ionicons name="arrow-up" size={13} color={colors.textSecondary} />
            </View>
          </View>
          <View style={styles.rowSpacer} />
        </View>
        <View style={styles.columnCaption}>
          <View style={styles.captionCol}>
            <Text style={styles.captionTitle} numberOfLines={1}>
              Northbound
            </Text>
            <Text style={styles.captionText} numberOfLines={1}>
              to Central Luzon
            </Text>
          </View>
          <View style={[styles.captionCol, styles.captionColEnd]}>
            <Text style={styles.captionTitle} numberOfLines={1}>
              Southbound
            </Text>
            <Text style={styles.captionText} numberOfLines={1}>
              to Metro Manila
            </Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          nestedScrollEnabled
          showsVerticalScrollIndicator
          persistentScrollbar
        >
          {exits.map((exit: CorridorExit, index) => {
            const rowId = String(exit.exit_id);
            const nb = exit.directions.NB;
            const sb = exit.directions.SB;
            const nbTone = laneTone(nb, colors);
            const sbTone = laneTone(sb, colors);
            const capStart = index === 0;
            const capEnd = index === exits.length - 1;
            const isSelected = rowId === selectedExitId;

            return (
              <View
                key={rowId}
                style={[styles.row, isSelected && styles.rowSelected]}
                onLayout={handleRowLayout(rowId)}
              >
                <View style={styles.exitCol}>
                  <Text style={[styles.exitName, isSelected && styles.exitNameSelected]} numberOfLines={2}>
                    {exit.display_name}
                  </Text>
                </View>

                <View style={styles.roadGroup}>
                  <View style={styles.roadCol}>
                    <RoadLane
                      color={nb.hasRamp ? nbTone.solid : colors.border}
                      active={nb.hasRamp}
                      capStart={capStart}
                      capEnd={capEnd}
                    />
                  </View>

                  <View style={styles.kmCol}>
                    <View style={[styles.kmBadge, isSelected && styles.kmBadgeSelected]}>
                      <Text style={[styles.kmBadgeText, isSelected && styles.kmBadgeTextSelected]}>
                        {exit.km.toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.roadCol}>
                    <RoadLane
                      color={sb.hasRamp ? sbTone.solid : colors.border}
                      active={sb.hasRamp}
                      capStart={capStart}
                      capEnd={capEnd}
                    />
                  </View>
                </View>

                <View style={styles.rowSpacer} />
              </View>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.legend}>
        {(['clear', 'slow', 'congested'] as CorridorStatusValue[]).map((status) => (
          <View key={status} style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: toneFor(statusTone[status], colors).solid }]}
            />
            <Text style={styles.legendText}>{statusLabel[status]}</Text>
          </View>
        ))}
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
          <Text style={styles.legendText}>No ramp</Text>
        </View>
      </View>
    </View>
  );
};

export default LiveCorridorStatus;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
    },
    headerIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
    },
    headerText: {
      flex: 1,
    },
    title: {
      color: c.text,
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.bold,
    },
    subtitle: {
      color: c.textSecondary,
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.medium,
      marginTop: 2,
    },
    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: c.statusSmoothBg,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    liveBadgeStale: {
      backgroundColor: c.statusModerateBg,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.statusSmoothSolid,
    },
    liveDotStale: {
      backgroundColor: c.statusModerateSolid,
    },
    liveText: {
      color: c.statusSmoothText,
      fontSize: 9,
      fontWeight: Typography.fontWeight.bold,
      letterSpacing: 0.5,
    },
    liveTextStale: {
      color: c.statusModerateText,
    },
    liveBadgeOffline: {
      backgroundColor: c.surfaceMuted,
    },
    liveDotOffline: {
      backgroundColor: c.textTertiary,
    },
    liveTextOffline: {
      color: c.textTertiary,
    },
    statusBox: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 36,
    },
    statusBoxTitle: {
      color: c.text,
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.bold,
      textAlign: 'center',
    },
    statusBoxText: {
      color: c.textSecondary,
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.medium,
      textAlign: 'center',
      paddingHorizontal: 24,
    },
    statusBoxUrl: {
      color: c.textTertiary,
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.normal,
      textAlign: 'center',
      paddingHorizontal: 16,
    },
    retryButton: {
      marginTop: 4,
      backgroundColor: c.primary,
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 10,
    },
    retryButtonPressed: {
      backgroundColor: c.primaryDark,
    },
    retryButtonText: {
      color: c.textInverse,
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.bold,
    },
    countRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 14,
    },
    countPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },
    countPillValue: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.bold,
    },
    countPillLabel: {
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.medium,
    },
    staleBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: c.statusModerateBg,
      borderRadius: 12,
      padding: 10,
      marginBottom: 14,
    },
    staleBannerText: {
      flex: 1,
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.medium,
      lineHeight: 16,
    },
    // A bounded, bordered "sub-panel" - this is what actually scrolls, so it
    // needs a clear edge telling the user a drag here stays inside the box.
    listFrame: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      overflow: 'hidden',
    },
    columnHeader: {
      flexDirection: 'row',
      paddingTop: 10,
      paddingHorizontal: 14,
    },
    columnLabel: {
      color: c.textSecondary,
      fontSize: 9,
      fontWeight: Typography.fontWeight.bold,
      letterSpacing: 0.5,
      marginTop: 1,
    },
    columnCaption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingTop: 4,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.hairline,
    },
    // The road sits dead centre of the card: it has a fixed width, and the
    // exit-name column on its left and an empty spacer on its right both take
    // `flex: 1`, so the leftover space is split evenly on either side of it.
    roadGroup: {
      width: ROAD_GROUP_WIDTH,
      flexDirection: 'row',
    },
    /** Mirrors `exitCol`'s flex so the road group stays centred. */
    rowSpacer: {
      flex: 1,
    },
    captionCol: {
      alignItems: 'flex-start',
    },
    captionColEnd: {
      alignItems: 'flex-end',
    },
    captionTitle: {
      color: c.textSecondary,
      fontSize: 10,
      fontWeight: Typography.fontWeight.bold,
    },
    captionText: {
      color: c.textTertiary,
      fontSize: 9,
      fontWeight: Typography.fontWeight.medium,
    },
    list: {
      maxHeight: LIST_MAX_HEIGHT,
    },
    listContent: {
      paddingHorizontal: 14,
      paddingVertical: 4,
    },
    row: {
      flexDirection: 'row',
      minHeight: 68,
    },
    // Highlight for the exit the user jumped to via the dropdown - a tinted
    // background band plus an accent bar down the left edge.
    rowSelected: {
      backgroundColor: c.primarySoft,
      marginHorizontal: -14,
      paddingHorizontal: 14,
      borderLeftWidth: 3,
      borderLeftColor: c.accent,
    },
    exitCol: {
      flex: 1,
      justifyContent: 'center',
      paddingRight: 6,
    },
    exitName: {
      color: c.text,
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.bold,
      lineHeight: 14,
    },
    exitNameSelected: {
      color: c.accent,
    },
    // No padding, no alignItems offset - the lane fills this column exactly,
    // so it stretches edge-to-edge with the row above and below it.
    roadCol: {
      width: 30,
      alignItems: 'center',
    },
    // Fills its column completely (flex:1 inside a row stretched to the
    // row's full height) with zero margin, so back-to-back segments touch.
    roadBar: {
      flex: 1,
      width: 20,
    },
    roadBarCapStart: {
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    roadBarCapEnd: {
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
    },
    roadDashes: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-evenly',
      paddingVertical: 6,
    },
    roadDash: {
      width: 2.5,
      height: 8,
      borderRadius: 1.5,
      backgroundColor: 'rgba(255,255,255,0.9)',
    },
    kmCol: {
      width: 46,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kmBadge: {
      minWidth: 38,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
    },
    kmBadgeText: {
      color: c.textSecondary,
      fontSize: 10,
      fontWeight: Typography.fontWeight.bold,
    },
    kmBadgeSelected: {
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    kmBadgeTextSelected: {
      color: c.textInverse,
    },
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 14,
      marginTop: 16,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
    },
    legendText: {
      color: c.textSecondary,
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.medium,
    },
  });
