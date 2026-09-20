import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { regionFor } from '../../lib/corridorGeometry';
import type { SegmentMapProps } from './SegmentMap.types';

/**
 * One stretch of NLEX on a real map.
 *
 * There is a `.web.tsx` beside this file. react-native-maps has no web build,
 * and importing it under react-native-web throws at module load - which would
 * take down the whole bundle, not just this panel. Metro picks the platform
 * file automatically, so the web build never sees this import at all.
 *
 * The map is deliberately not interactive beyond panning and zooming: this is
 * a picture of one segment, not a navigation surface, and letting it rotate or
 * pitch only makes it harder to tell which way the road runs.
 */

const STROKE_WIDTH = 6;

const SegmentMap: React.FC<SegmentMapProps> = ({ segment, nbColor, sbColor, exitName }) => (
  <View style={styles.fill}>
    <MapView
      style={styles.fill}
      initialRegion={regionFor(segment.bounds)}
      rotateEnabled={false}
      pitchEnabled={false}
      toolbarEnabled={false}
      showsCompass={false}
    >
      {/*
        A dark line under both carriageways. Where the two run close enough to
        touch at this zoom it reads as the median rather than as a gap, and it
        keeps a pale carriageway (clear green) legible over pale map tiles.
      */}
      <Polyline
        coordinates={segment.centre}
        strokeColor="rgba(0,0,0,0.30)"
        strokeWidth={STROKE_WIDTH * 2.6}
      />
      <Polyline coordinates={segment.NB} strokeColor={nbColor} strokeWidth={STROKE_WIDTH} />
      <Polyline coordinates={segment.SB} strokeColor={sbColor} strokeWidth={STROKE_WIDTH} />

      <Marker coordinate={segment.exit} title={exitName} description="NLEX interchange" />
    </MapView>
  </View>
);

export default SegmentMap;

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
