import React from 'react';
import MapboxSegmentMap from './MapboxSegmentMap';
import PlatformSegmentMap from './PlatformSegmentMap';
import type { SegmentMapProps } from './SegmentMap.types';
import { useMapbox } from './mapboxConfig';

/**
 * Which map draws the interchange.
 *
 * Mapbox when a token is configured, because the dashboard renders with Mapbox
 * and the two should not look like different products. The platform maps -
 * Apple on iOS, Google on Android - otherwise, which also means the app keeps
 * working with no third-party account at all.
 *
 * Deciding here rather than inside one component keeps react-native-maps and
 * react-native-webview in separate files, so neither is loaded on a path that
 * does not use it.
 *
 * The web build has its own `SegmentMap.web.tsx`: it makes the same choice,
 * but renders the Mapbox page in an iframe, since react-native-maps has no web
 * build at all.
 */
const SegmentMap: React.FC<SegmentMapProps> = (props) =>
  useMapbox() ? <MapboxSegmentMap {...props} /> : <PlatformSegmentMap {...props} />;

export default SegmentMap;
