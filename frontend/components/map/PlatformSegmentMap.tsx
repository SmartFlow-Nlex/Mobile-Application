import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { regionFor } from '../../lib/corridorGeometry';
import type { SegmentMapProps } from './SegmentMap.types';
import { MUTED_MAP_STYLE } from './mutedMapStyle';

/**
 * One stretch of NLEX on the platform's own map: Apple Maps on iOS, Google
 * Maps on Android.
 *
 * This is the fallback path. With a Mapbox token configured the app draws
 * `MapboxSegmentMap` instead, which matches the dashboard; see
 * `SegmentMap.tsx` for the switch. Kept because it needs no token, no network
 * for the basemap beyond the tiles themselves, and no third-party account -
 * so the app still has a map if the Mapbox account ever lapses.
 *
 * Only ever imported from the native build. react-native-maps has no web build
 * and throws at module load under react-native-web, which would take down the
 * whole bundle rather than just this panel.
 *
 * The map is deliberately not interactive beyond panning and zooming: this is
 * a picture of one segment, not a navigation surface, and letting it rotate or
 * pitch only makes it harder to tell which way the road runs.
 */

/** The road itself. Queues are drawn slightly wider so they read as raised. */
const ROAD_WIDTH = 5;
const JAM_WIDTH = 7;

/**
 * Everything but NLEX, turned down.
 *
 * Two different mechanisms, because the platforms have no common one. Apple
 * Maps has a muted basemap built in and no support for custom styling; Google
 * Maps has no muted type but takes a style array. Using each platform's own
 * tool gets the same result - a quiet grey basemap with the corridor as the
 * only thing with colour in it - where insisting on one would leave the other
 * at full saturation.
 */
const PlatformSegmentMap: React.FC<SegmentMapProps> = ({
  segment,
  nbColor,
  sbColor,
  exitName,
  quietColor,
  jamColorFor,
  bottomInset,
}) => (
  <View style={styles.fill}>
    <MapView
      style={styles.fill}
      // Google on Android for the style array; Apple on iOS, where asking for
      // Google needs an API key the Expo Go build does not carry.
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      customMapStyle={Platform.OS === 'android' ? MUTED_MAP_STYLE : undefined}
      mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
      initialRegion={regionFor(segment.bounds)}
      // Keeps the road above whatever covers the bottom of the map.
      mapPadding={{ top: 0, right: 0, bottom: bottomInset ?? 0, left: 0 }}
      rotateEnabled={false}
      pitchEnabled={false}
      toolbarEnabled={false}
      showsCompass={false}
      showsTraffic={false}
      showsPointsOfInterests={false}
      showsBuildings={false}
    >
      {/*
        A dark line under both carriageways. Where the two run close enough to
        touch at this zoom it reads as the median rather than as a gap, and it
        keeps a pale carriageway legible over pale map tiles.
      */}
      <Polyline
        coordinates={segment.centre}
        strokeColor="rgba(0,0,0,0.28)"
        strokeWidth={ROAD_WIDTH * 3}
      />

      {/*
        Both carriageways full length first, then the queues over the top. With
        queue detail the caller passes the clear colour here, so the road reads
        green for its whole length and only the queues are amber or red -
        colouring the entire stretch red because one 200 m queue sits in it
        overstates the problem by an order of magnitude. Without it, the caller
        passes the stretch's status colour and this is the whole picture.
      */}
      <Polyline coordinates={segment.NB} strokeColor={nbColor} strokeWidth={ROAD_WIDTH} />
      <Polyline coordinates={segment.SB} strokeColor={sbColor} strokeWidth={ROAD_WIDTH} />

      {segment.jamLines.map((line) => (
        <Polyline
          key={`${line.direction}-${line.index}`}
          coordinates={line.coords}
          strokeColor={jamColorFor(line.direction, line.index)}
          strokeWidth={JAM_WIDTH}
        />
      ))}

      <Marker
        coordinate={segment.exit}
        title={exitName}
        description="NLEX interchange"
        pinColor={quietColor}
      />
    </MapView>
  </View>
);

export default PlatformSegmentMap;

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
