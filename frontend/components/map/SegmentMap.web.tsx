import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';
import type { LatLng, SegmentMapProps } from './SegmentMap.types';

/**
 * The web stand-in for the map panel.
 *
 * react-native-maps has no web build, so the browser cannot show map tiles
 * here. Rather than an empty box, this plots the same road geometry the native
 * map draws - the real OSM centreline for this stretch, both carriageways,
 * coloured by the same live statuses - as a schematic.
 *
 * It is labelled as a schematic because it is one: there are no streets,
 * landmarks or scale around the road. The phone gets the real map. This keeps
 * the browser useful for checking layout and colours during development, which
 * is the only thing the web build is used for on this project.
 *
 * Drawn with rotated Views rather than SVG because the project carries no SVG
 * dependency, and adding a native module for a development-only fallback would
 * be the wrong trade.
 */

/** Enough vertices to keep the curve, few enough to stay cheap as plain Views. */
const MAX_VERTICES = 80;

function downsample(line: LatLng[]): LatLng[] {
  if (line.length <= MAX_VERTICES) {
    return line;
  }
  const step = (line.length - 1) / (MAX_VERTICES - 1);
  return Array.from({ length: MAX_VERTICES }, (_, i) => line[Math.round(i * step)]);
}

interface PlotBox {
  width: number;
  height: number;
}

interface Projection {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

const PADDING = 18;

/**
 * Longitude to x, latitude to y, with north up.
 *
 * One scale for both axes, chosen as the tighter of the two, so the road keeps
 * its shape instead of being stretched to fill the box.
 */
function project(point: LatLng, bounds: Projection, box: PlotBox): { x: number; y: number } {
  const spanLon = Math.max(bounds.maxLon - bounds.minLon, 1e-6);
  const spanLat = Math.max(bounds.maxLat - bounds.minLat, 1e-6);
  const usableW = Math.max(box.width - PADDING * 2, 1);
  const usableH = Math.max(box.height - PADDING * 2, 1);
  const scale = Math.min(usableW / spanLon, usableH / spanLat);

  const drawnW = spanLon * scale;
  const drawnH = spanLat * scale;
  const offsetX = (box.width - drawnW) / 2;
  const offsetY = (box.height - drawnH) / 2;

  return {
    x: offsetX + (point.longitude - bounds.minLon) * scale,
    // Latitude increases northward; y increases downward.
    y: offsetY + (bounds.maxLat - point.latitude) * scale,
  };
}

interface PolylineProps {
  line: LatLng[];
  color: string;
  width: number;
  bounds: Projection;
  box: PlotBox;
}

/** One polyline, as a chain of rotated rectangles. */
const Polyline: React.FC<PolylineProps> = ({ line, color, width, bounds, box }) => {
  const vertices = downsample(line).map((point) => project(point, bounds, box));
  return (
    <>
      {vertices.slice(1).map((end, index) => {
        const start = vertices[index];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.hypot(dx, dy);
        if (length === 0) {
          return null;
        }
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        /*
         * Laid out centred on the midpoint and rotated about its own centre,
         * which is React Native's default transform origin. Anchoring at the
         * start vertex instead would need `transformOrigin`, and getting that
         * wrong swings each piece off its line rather than turning it in
         * place. Overlapped by one stroke width so the joints on a bend do not
         * open into gaps.
         */
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        return (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: midX - (length + width) / 2,
              top: midY - width / 2,
              width: length + width,
              height: width,
              borderRadius: width / 2,
              backgroundColor: color,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}
    </>
  );
};

const SegmentMap: React.FC<SegmentMapProps> = ({ segment, nbColor, sbColor, exitName }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [box, setBox] = useState<PlotBox>({ width: 0, height: 0 });

  const bounds: Projection = segment.bounds;
  const ready = box.width > 0 && box.height > 0;
  const exit = ready ? project(segment.exit, bounds, box) : null;

  return (
    <View
      style={styles.plot}
      onLayout={(event) =>
        setBox({
          width: event.nativeEvent.layout.width,
          height: event.nativeEvent.layout.height,
        })
      }
    >
      {ready ? (
        <>
          {/*
            Opaque, not translucent. The polyline is a chain of overlapping
            rounded rectangles, and a see-through colour compounds at every
            overlap - which drew the median as a string of dark beads rather
            than a line. The native map has no such problem: it gets a real
            polyline, so it can keep its translucent casing.
          */}
          <Polyline
            line={segment.centre}
            color={colors.textTertiary}
            width={15}
            bounds={bounds}
            box={box}
          />
          <Polyline line={segment.NB} color={nbColor} width={6} bounds={bounds} box={box} />
          <Polyline line={segment.SB} color={sbColor} width={6} bounds={bounds} box={box} />

          {exit !== null ? (
            <View
              accessibilityLabel={exitName}
              style={[styles.pin, { left: exit.x - 7, top: exit.y - 7 }]}
            />
          ) : null}
        </>
      ) : null}

      <View style={styles.badge}>
        <Text style={styles.badgeText}>Schematic - the map view needs the phone</Text>
      </View>

      <View style={styles.compass}>
        <Text style={[styles.compassText, { color: colors.textTertiary }]}>N</Text>
      </View>
    </View>
  );
};

export default SegmentMap;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    plot: {
      flex: 1,
      backgroundColor: c.surfaceMuted,
      overflow: 'hidden',
    },
    pin: {
      position: 'absolute',
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: c.surface,
      borderWidth: 3,
      borderColor: c.accent,
    },
    /* Top-left, opposite the compass: at the bottom it sat on top of the
       exit pin whenever the interchange was at the south end of its stretch. */
    badge: {
      position: 'absolute',
      left: 10,
      top: 10,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    badgeText: {
      color: c.textTertiary,
      fontSize: 10,
      fontWeight: '700',
    },
    compass: {
      position: 'absolute',
      right: 12,
      top: 10,
    },
    compassText: {
      fontSize: 12,
      fontWeight: '800',
    },
  });
