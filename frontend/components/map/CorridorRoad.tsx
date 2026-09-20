import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';
import { Typography } from '../../constants/typography';
import type { CongestionLevel } from '../../lib/trafficModel';
import { toneFor } from '../dashboard/severity';

export type DirectionKey = 'NB' | 'SB';

/** Both carriageways, always - reading one without the other is half a road. */
const BOTH: DirectionKey[] = ['NB', 'SB'];

export const directionLabel: Record<DirectionKey, string> = { NB: 'NB', SB: 'SB' };
/**
 * Which way each carriageway is DRAWN on this diagram.
 *
 * Northbound points up and southbound points down, because that is the
 * convention a reader brings to any road diagram: up is north. This is a
 * presentation choice, asked for by the team, and it is worth being clear that
 * it does not follow the order of the list beneath it.
 *
 * The rows are ordered by km ascending from Balintawak, and the feed's own
 * latitudes say what that means: 14.679 at the top of the list rising to
 * 15.222 at the bottom. So on this list the north end of NLEX is at the
 * BOTTOM, and an upward arrow therefore points from Sta. Ines back towards
 * Balintawak. Read the arrows as a compass for the carriageway, not as travel
 * along the rows.
 *
 * If that ever needs to be literally true instead, flip the row order so the
 * north end sits at the top - do not flip these back on their own, or the
 * arrows and the flow will disagree with each other again.
 */
export const directionArrow: Record<DirectionKey, 'arrow-up' | 'arrow-down'> = {
  NB: 'arrow-up',
  SB: 'arrow-down',
};

/**
 * The flowing sheen that shows which way a carriageway runs.
 *
 * This project carries no gradient library, so the softness is built from
 * stacked bands. Six 13pt bands were tried first and read as visible steps;
 * twelve 8pt bands on a sine bell are below the threshold where the eye picks
 * out an edge, which is what makes it look poured rather than drawn.
 *
 * One streak every FLOW_PERIOD, and the whole pattern is translated by exactly
 * one period per cycle - so streak n lands where streak n+1 began and the loop
 * has no seam and no gap. That is the difference between a flow and a pulse:
 * there is always a streak on the road.
 */
const FLOW_BAND_HEIGHT = 8;
const FLOW_BAND_COUNT = 12;
const FLOW_PERIOD = 170;

/** A sine bell: faint at both ends, brightest in the middle. */
function flowBell(peak: number): number[] {
  return Array.from({ length: FLOW_BAND_COUNT }, (_, index) =>
    Number((peak * Math.sin((Math.PI * (index + 0.5)) / FLOW_BAND_COUNT)).toFixed(3)),
  );
}

/**
 * One bell per theme.
 *
 * The dark palette's pavement is the more saturated of the two - clear is
 * #22C55E against light's #16A34A - so the same white wash reads noticeably
 * hotter on it. Dropping the peak keeps the sheen at the same apparent
 * strength in both themes rather than shouting on one.
 */
const FLOW_BANDS_LIGHT = flowBell(0.34);
const FLOW_BANDS_DARK = flowBell(0.24);

/**
 * react-native-web has no native animated module, so asking for the native
 * driver there logs a warning on every mount and falls back to JS anyway.
 */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/** Width of one carriageway column, at each outer edge of the row. */
const LANE_COL = 42;
/** The pavement itself, centred in that column. */
const BAR_WIDTH = 34;
/**
 * The shoulder down each side of the pavement.
 *
 * Left and right only - a border on all four sides would draw a line at every
 * row boundary and chop the continuous ribbon into twenty separate tiles.
 * Black at low alpha rather than a per-tone colour, so one value darkens the
 * green, the amber and the red alike, in both themes.
 */
const ROAD_EDGE = 1.5;
const ROAD_EDGE_COLOR = 'rgba(0,0,0,0.24)';

/**
 * Radius of the rounded cap at each end of a carriageway.
 *
 * Shared with the flow overlay's clip. The clip used to be a plain rectangle
 * over a ribbon with rounded ends, so at the top and bottom of the road the
 * sheen filled the corner where there was no pavement - a hard square edge
 * against the card, which on the dark theme is the most visible thing on the
 * screen. The clip has to carry the same silhouette as the thing it masks.
 */
const ROAD_CAP_RADIUS = 11;

/**
 * How wide the median between the carriageways is allowed to get.
 *
 * Without a cap the median is plain `flex: 1`, so it swallowed every spare
 * point and pushed the two roads out to the edges of the card. Capping it and
 * centring the row keeps them a readable distance apart on a phone and stops
 * them drifting apart entirely on a wide window.
 */
const MEDIAN_MAX = 200;

/**
 * One carriageway at one exit.
 *
 * `level: null` means there is no carriageway here at all - the live feed's
 * `hasRamp: false`. That is not "clear", which would read as good news about
 * a road that does not exist.
 */
export interface RoadDirectionReading {
  level: CongestionLevel | null;
  /** The headline figure: "2 km/h", "Moderate", "+8 min". */
  value: string;
}

export interface RoadRow {
  id: string;
  name: string;
  km: number;
  NB: RoadDirectionReading;
  SB: RoadDirectionReading;
  /** Revealed on tap. */
  detail?: { label: string; value: string }[];
  detailFooter?: string;
}

// ---------------------------------------------------------------------------
// The road
// ---------------------------------------------------------------------------

interface RoadLaneProps {
  color: string;
  /** False draws a bare, undashed grey bar - no ramp means no traffic ever flows here. */
  active: boolean;
  capStart?: boolean;
  capEnd?: boolean;
}

/**
 * One exit's worth of coloured pavement, with still lane markings down the
 * centre. Fills its column completely - no margin, no padding around the fill
 * itself - so consecutive segments butt directly against each other and read
 * as one unbroken road rather than a stack of separate pills.
 *
 * The markings deliberately do NOT move. Sliding them was tried: because the
 * ribbon is drawn per row, twenty rows meant twenty synchronised strips of
 * travelling dashes, and the whole card fizzed. The direction cue lives on the
 * two header arrows instead - two moving glyphs for the entire screen.
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
        <>
          {/*
            Edge lines, then a dashed centre line. Three markings is what
            separates a road surface from a coloured stripe - at the old 28pt
            deck they crowded each other, but 34pt has room for a lane either
            side of the centre.
          */}
          <View style={[styles.edgeLine, styles.edgeLineStart]} />
          <View style={[styles.edgeLine, styles.edgeLineEnd]} />
          <View style={styles.roadDashes}>
            <View style={styles.roadDash} />
            <View style={styles.roadDash} />
            <View style={styles.roadDash} />
          </View>
        </>
      ) : null}
    </View>
  );
};

interface ReadingProps {
  direction: DirectionKey;
  reading: RoadDirectionReading;
}

/**
 * True when the reading adds something the pavement has not already said.
 *
 * A green lane next to a green chip reading "Clear" is the same fact twice,
 * and with twenty interchanges that was forty chips of pure noise - the road
 * itself became the smallest thing in its own diagram. Clear stretches now say
 * nothing and the chips appear only where there is trouble, which is also the
 * only place the feed has a speed worth printing.
 */
function isWorthShowing(reading: RoadDirectionReading): boolean {
  return reading.level !== null && reading.level !== 'low';
}

const Reading: React.FC<ReadingProps> = ({ direction, reading }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  if (reading.level === null) {
    return null;
  }

  const tone = toneFor(reading.level, colors);

  return (
    <View
      style={[styles.reading, { backgroundColor: tone.background }]}
    >
      <Ionicons name={directionArrow[direction]} size={11} color={tone.solid} />
      <Text style={[styles.readingDirection, { color: tone.text }]}>
        {directionLabel[direction]}
      </Text>
      <Text style={[styles.readingValue, { color: tone.text }]} numberOfLines={1}>
        {reading.value}
      </Text>
    </View>
  );
};

interface ExitRowProps {
  row: RoadRow;
  first: boolean;
  last: boolean;
  expanded: boolean;
  onToggle: () => void;
  /**
   * Set only by the live view, where tapping opens the interchange on a real
   * map instead of expanding the detail in place. The forecast view leaves it
   * undefined and keeps the inline panel, because that map shows live traffic
   * and opening it from a modelled row would put a live reading behind a
   * forecast the user tapped.
   */
  onOpen?: () => void;
}

const ExitRow: React.FC<ExitRowProps> = ({ row, first, last, expanded, onToggle, onOpen }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const lane = (key: DirectionKey): React.ReactElement => {
    const reading = row[key];
    return (
      <View style={styles.laneCol}>
        <RoadLane
          color={reading.level === null ? colors.border : toneFor(reading.level, colors).solid}
          active={reading.level !== null}
          capStart={first}
          capEnd={last}
        />
      </View>
    );
  };

  const shown = BOTH.filter((key) => isWorthShowing(row[key]));
  const hasDetail = row.detail !== undefined && row.detail.length > 0;
  const opens = onOpen !== undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={opens || !hasDetail ? undefined : { expanded }}
      accessibilityLabel={`${row.name}, kilometre ${row.km.toFixed(1)}`}
      accessibilityHint={opens ? 'Opens this stretch of NLEX on a map' : undefined}
      disabled={!opens && !hasDetail}
      onPress={opens ? onOpen : onToggle}
      style={styles.exitRow}
    >
      {/*
        alignItems: stretch on the row, zero vertical padding here and the bars
        on flex: 1 - that chain is what keeps one exit's pavement touching the
        next one's instead of breaking into separate pills.
      */}
      {lane('NB')}

      {/*
        The median. Everything about the exit sits between the carriageways,
        centred, the way signage does on a divided highway - which is what NLEX
        is. The lanes used to be crammed against the left edge with the text
        ranged beside them; centring the whole assembly is what makes it read
        as a road rather than a table with a decorative stripe.
      */}
      <View style={styles.median}>
        <Text style={styles.exitName} numberOfLines={2}>
          {row.name}
        </Text>

        <View style={styles.medianMeta}>
          <View style={styles.kmBadge}>
            <Text style={styles.kmBadgeText}>KM {row.km.toFixed(1)}</Text>
          </View>
          {/* Forward chevron where the row navigates, up/down where it expands
              in place - the glyph is the only thing telling the two apart. */}
          {opens ? (
            <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
          ) : hasDetail ? (
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={15}
              color={colors.textTertiary}
            />
          ) : null}
        </View>

        {shown.length > 0 ? (
          <View style={styles.readingRow}>
            {shown.map((key) => (
              <Reading key={key} direction={key} reading={row[key]} />
            ))}
          </View>
        ) : null}

        {!opens && expanded && hasDetail ? (
          <View style={styles.detail}>
            {row.detail!.map((line) => (
              <View key={line.label} style={styles.detailLine}>
                <Text style={styles.detailLabel}>{line.label}</Text>
                <Text style={styles.detailValue}>{line.value}</Text>
              </View>
            ))}
            {row.detailFooter !== undefined ? (
              <Text style={styles.detailFooter}>{row.detailFooter}</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {lane('SB')}
    </Pressable>
  );
};

interface FlowStreaksProps {
  drift: Animated.AnimatedInterpolation<number>;
  count: number;
  /**
   * Which carriageway this sheen belongs to. Only used as a testID: the
   * direction of travel is the one thing on this diagram that has been wrong
   * before, and reading it off a screenshot cannot tell up from down.
   */
  direction: DirectionKey;
}

/**
 * The repeating sheen for one carriageway.
 *
 * Sized to the pavement and clipped, so a streak slides out of sight at each
 * end of the road rather than escaping the card.
 */
const FlowStreaks: React.FC<FlowStreaksProps> = ({ drift, count, direction }) => {
  const { isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const bands = isDark ? FLOW_BANDS_DARK : FLOW_BANDS_LIGHT;
  return (
    <View style={styles.flowClip}>
      <Animated.View
        testID={`corridor-flow-${direction}`}
        style={[styles.flowTrack, { transform: [{ translateY: drift }] }]}
      >
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={[styles.streak, { top: index * FLOW_PERIOD - FLOW_PERIOD }]}>
            {bands.map((band, bandIndex) => (
              <View key={bandIndex} style={[styles.band, { opacity: band }]} />
            ))}
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

export interface CorridorRoadProps {
  rows: RoadRow[];
  emptyTitle?: string;
  emptyText?: string;
  /**
   * Makes each row navigate rather than expand. Receives the row's `id`, which
   * the live view sets to the exit_id the map screen looks up.
   */
  onOpenRow?: (id: string) => void;
}

/**
 * The corridor, drawn as the road it is.
 *
 * One component for both the live feed and the forecast: the diagram is the
 * identifying thing about this screen, so the two views must be pixel-identical
 * and only their numbers different. Feeding both from one `RoadRow[]` is what
 * guarantees that.
 */
const CorridorRoad: React.FC<CorridorRoadProps> = ({
  rows,
  emptyTitle = 'Nothing to show',
  emptyText = 'Adjust the filters to see the corridor.',
  onOpenRow,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /*
   * One highlight per carriageway, gliding the whole length of the road.
   *
   * Two earlier attempts were worse. Sliding the dashed markings put twenty
   * synchronised strips of motion on screen at once, because the ribbon is
   * drawn per row - the card fizzed. Bobbing the header arrows was quiet but
   * moved nothing on the road itself.
   *
   * The fix is to stop treating the lanes as per-row. The rows still paint
   * their own coloured segments, and two absolutely-positioned overlays sit on
   * top of the whole stack - one per carriageway - each carrying a single
   * translucent pulse. So the motion is on the pavement, it runs the full
   * corridor rather than restarting every row, and the entire animation is two
   * moving views.
   *
   * It needs the stack's measured height, so nothing runs until the first
   * layout lands.
   */
  const [roadHeight, setRoadHeight] = useState(0);
  const travel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (roadHeight <= 0) {
      return;
    }
    const loop = Animated.loop(
      Animated.timing(travel, {
        toValue: 1,
        // One period per cycle, linear. Constant speed is what makes it read
        // as a current; any easing would make the road breathe instead.
        // One FLOW_PERIOD per cycle, so this is the speed: 170pt / 2.6s = 65pt/s.
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
      travel.setValue(0);
    };
  }, [travel, roadHeight]);

  /** One spare streak at each end, so the pattern never runs short mid-slide. */
  const streakCount = Math.ceil(roadHeight / FLOW_PERIOD) + 2;

  const drift = useMemo(
    () => ({
      // Matches `directionArrow`: northbound sheen travels up the page,
      // southbound travels down. Negative translateY is up.
      NB: travel.interpolate({ inputRange: [0, 1], outputRange: [0, -FLOW_PERIOD] }),
      SB: travel.interpolate({ inputRange: [0, 1], outputRange: [0, FLOW_PERIOD] }),
    }),
    [travel],
  );

  if (rows.length === 0) {
    return (
      <View style={styles.frame}>
        <View style={styles.empty}>
          <Ionicons
            name="checkmark-done-circle-outline"
            size={24}
            color={toneFor('low', colors).solid}
          />
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      </View>
    );
  }

  const cap = (key: DirectionKey): React.ReactElement => (
    <View style={styles.laneCol}>
      <Ionicons name={directionArrow[key]} size={13} color={colors.accent} />
      <Text style={styles.laneCapText}>{directionLabel[key]}</Text>
    </View>
  );

  return (
    <View style={styles.frame}>
      {/* The caps line up over the carriageways they label, so the header and
          the rows below it share one geometry. */}
      <View style={styles.header}>
        {cap('NB')}
        <Text style={styles.headerHint} numberOfLines={1}>
          {rows.length} interchanges
        </Text>
        {cap('SB')}
      </View>

      <View
        onLayout={(event) => setRoadHeight(event.nativeEvent.layout.height)}
        style={styles.roadStack}
      >
        {rows.map((row, index) => (
          <ExitRow
            key={row.id}
            row={row}
            first={index === 0}
            last={index === rows.length - 1}
            expanded={expandedId === row.id}
            onToggle={() => setExpandedId((current) => (current === row.id ? null : row.id))}
            onOpen={onOpenRow === undefined ? undefined : () => onOpenRow(row.id)}
          />
        ))}

        {/*
          Drawn after the rows so it sits on top of the pavement, and
          pointer-transparent so a tap still reaches the row underneath.

          It mirrors ExitRow's own flex structure - laneCol, flexible middle,
          laneCol - rather than positioning each lane by a hand-computed
          offset. Matching numbers by hand is what put the sheen beside the
          bar instead of on it; sharing the layout makes that impossible.
        */}
        <View style={styles.flowOverlay}>
          <View style={styles.laneCol}>
            <FlowStreaks drift={drift.NB} count={streakCount} direction="NB" />
          </View>
          <View style={styles.flowSpacer} />
          <View style={styles.laneCol}>
            <FlowStreaks drift={drift.SB} count={streakCount} direction="SB" />
          </View>
        </View>
      </View>
    </View>
  );
};

export default CorridorRoad;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    frame: {
      backgroundColor: c.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 12,
      paddingBottom: 12,
      overflow: 'hidden',
      // Stops the carriageways flying to the far edges of a desktop window;
      // beyond this width the median is all the row would grow.
      maxWidth: 560,
      width: '100%',
      alignSelf: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 12,
      paddingBottom: 7,
      marginBottom: 2,
      borderBottomWidth: 1,
      borderBottomColor: c.hairline,
    },
    laneCapText: {
      color: c.textSecondary,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    headerHint: {
      flex: 1,
      maxWidth: MEDIAN_MAX,
      textAlign: 'center',
      color: c.textTertiary,
      fontSize: 10,
      fontWeight: '700',
    },

    /** Positioning context for the two lane overlays. */
    roadStack: {
      position: 'relative',
    },
    /*
     * One per carriageway, spanning the whole stack of rows. Clipped, so the
     * pulse slides out of sight at each end instead of escaping the card.
     */
    /** Lies over the whole row stack, laid out exactly like a row. */
    flowOverlay: {
      ...StyleSheet.absoluteFill,
      flexDirection: 'row',
      // Mirrors exitRow, cap and centring included, or the sheen would sit
      // where the lanes used to be.
      justifyContent: 'center',
      // In style rather than as a prop: the `pointerEvents` prop is deprecated
      // in RN 0.86 and warns on every render.
      pointerEvents: 'none',
    },
    /** Stands in for the median, which is `flex: 1` in a row. */
    flowSpacer: {
      flex: 1,
      maxWidth: MEDIAN_MAX,
    },
    /** The pavement's own width, centred in the lane column by `laneCol`. */
    /*
     * `flex: 1`, not `alignSelf: 'stretch'`.
     *
     * `laneCol` is a column container, so its cross axis is horizontal -
     * stretch widened this instead of filling it vertically, and its only
     * children are absolutely positioned, so it collapsed to zero height and
     * clipped the entire animation out of existence. `roadBar` fills the same
     * column the same way.
     */
    flowClip: {
      width: BAR_WIDTH,
      flex: 1,
      overflow: 'hidden',
      // Matches the caps at both ends of the ribbon, so the sheen is masked to
      // the road's own shape instead of its bounding box.
      borderTopLeftRadius: ROAD_CAP_RADIUS,
      borderTopRightRadius: ROAD_CAP_RADIUS,
      borderBottomLeftRadius: ROAD_CAP_RADIUS,
      borderBottomRightRadius: ROAD_CAP_RADIUS,
    },
    flowTrack: {
      ...StyleSheet.absoluteFill,
    },
    // Inset by the shoulder width, so the sheen washes over the pavement and
    // leaves the dark edges reading as edges.
    streak: {
      position: 'absolute',
      left: ROAD_EDGE,
      right: ROAD_EDGE,
    },
    band: {
      height: FLOW_BAND_HEIGHT,
      backgroundColor: '#FFFFFF',
    },
    // No vertical padding, and stretch: the lanes inside have to reach the
    // full height of the row for the pavement to stay unbroken.
    exitRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      justifyContent: 'center',
      // Without a floor, a run of clear exits (which now render name-only)
      // collapsed to one line of text each and the road went with them.
      minHeight: 56,
    },
    laneCol: {
      width: LANE_COL,
      alignItems: 'center',
      justifyContent: 'center',
    },
    /*
     * The median: everything about the exit, centred between the two
     * carriageways.
     *
     * The lanes used to be crammed against the left edge of the card with the
     * name and readings ranged beside them, which read as a table with a
     * decorative stripe down one side. Pushing the pavement out to the edges
     * and centring the signage between it is how a divided highway is actually
     * drawn - and NLEX is one.
     */
    median: {
      flex: 1,
      maxWidth: MEDIAN_MAX,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    medianMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    /*
     * No `alignSelf` here, deliberately.
     *
     * `laneCol` is a column, so alignSelf governs the HORIZONTAL axis. A
     * `stretch` overrode the column's `alignItems: 'center'` and, because the
     * width is explicit, parked the bar at the start of the 42pt column while
     * the flow overlay's clip stayed centred - four points apart, which is
     * exactly the sheen sitting beside the pavement instead of on it.
     *
     * `flex: 1` is what fills the height. Both the bar and `flowClip` now
     * carry the same two rules and nothing else, so they cannot diverge.
     */
    roadBar: {
      flex: 1,
      width: BAR_WIDTH,
      /*
       * Clips the markings to the rounded cap.
       *
       * A View's borderRadius does not clip its children unless this is set,
       * so at the first and last row the edge lines and the centre dash ran
       * straight out through the corner where the pavement had already curved
       * away - two hard little marks sitting outside the road's silhouette,
       * and obvious against the dark card.
       */
      overflow: 'hidden',
      borderLeftWidth: ROAD_EDGE,
      borderRightWidth: ROAD_EDGE,
      borderLeftColor: ROAD_EDGE_COLOR,
      borderRightColor: ROAD_EDGE_COLOR,
    },
    roadBarCapStart: {
      borderTopLeftRadius: ROAD_CAP_RADIUS,
      borderTopRightRadius: ROAD_CAP_RADIUS,
    },
    roadBarCapEnd: {
      borderBottomLeftRadius: ROAD_CAP_RADIUS,
      borderBottomRightRadius: ROAD_CAP_RADIUS,
    },
    edgeLine: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 1.5,
      // Fainter than the centre line: on a real carriageway the edge line is
      // the quieter of the two, and at this size a second bright stripe just
      // reads as noise.
      backgroundColor: 'rgba(255,255,255,0.42)',
    },
    edgeLineStart: {
      left: 4.5,
    },
    edgeLineEnd: {
      right: 4.5,
    },
    roadDashes: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-evenly',
      paddingVertical: 6,
    },
    roadDash: {
      width: 3,
      height: 12,
      borderRadius: 1.5,
      // White lane markings, as on the real road. Correct on both themes
      // because the bar behind it is always a saturated status colour.
      backgroundColor: 'rgba(255,255,255,0.9)',
    },
    kmBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
    },
    kmBadgeText: {
      color: c.textSecondary,
      fontSize: 11,
      fontWeight: '800',
    },

    exitName: {
      color: c.text,
      fontSize: Typography.fontSize.base,
      fontWeight: '700',
      textAlign: 'center',
    },
    readingRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 6,
    },
    // Hugs its content. These were `flex: 1`, so two of them stretched to fill
    // the whole row - on a wide window that produced a pair of enormous bars
    // reading "Clear" beside a hairline of actual road.
    reading: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 9,
    },
    readingDirection: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    readingValue: {
      fontSize: Typography.fontSize.xs,
      fontWeight: '800',
    },

    detail: {
      alignSelf: 'stretch',
      gap: 8,
      marginTop: 3,
      padding: 12,
      borderRadius: 12,
      backgroundColor: c.surfaceSubtle,
      borderWidth: 1,
      borderColor: c.hairline,
    },
    detailLine: {
      gap: 2,
    },
    detailLabel: {
      color: c.textTertiary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    detailValue: {
      color: c.textSecondary,
      fontSize: Typography.fontSize.xs,
      fontWeight: '600',
      lineHeight: 17,
    },
    detailFooter: {
      color: c.textTertiary,
      fontSize: 10,
      fontWeight: '600',
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: c.hairline,
    },

    empty: {
      alignItems: 'center',
      gap: 9,
      paddingVertical: 34,
      paddingHorizontal: 22,
    },
    emptyTitle: {
      color: c.text,
      fontSize: Typography.fontSize.base,
      fontWeight: '800',
      textAlign: 'center',
    },
    emptyText: {
      color: c.textSecondary,
      fontSize: Typography.fontSize.sm,
      fontWeight: '500',
      lineHeight: 20,
      textAlign: 'center',
    },
  });
