import type { CorridorSegment, LatLng } from '../../lib/corridorGeometry';

/**
 * Shared by `SegmentMap.tsx` (native, real map tiles) and `SegmentMap.web.tsx`
 * (schematic fallback). Kept in its own file so neither platform build has to
 * import the other - the point of the split is that react-native-maps never
 * reaches the web bundle.
 */
export interface SegmentMapProps {
  segment: CorridorSegment;
  /** Status colours for the two carriageways, from the same palette as the list. */
  nbColor: string;
  sbColor: string;
  exitName: string;
}

export type { CorridorSegment, LatLng };
