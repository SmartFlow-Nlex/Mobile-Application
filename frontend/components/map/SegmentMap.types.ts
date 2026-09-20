import type { CorridorSegment, DirectionKey, LatLng } from '../../lib/corridorGeometry';

/**
 * Shared by `SegmentMap.tsx` (native, real map tiles) and `SegmentMap.web.tsx`
 * (schematic fallback). Kept in its own file so neither platform build has to
 * import the other - the point of the split is that react-native-maps never
 * reaches the web bundle.
 */
export interface SegmentMapProps {
  segment: CorridorSegment;
  /**
   * The carriageways' base colour.
   *
   * Quiet when the backend told us where the queues are, because then the
   * queues carry the colour and the road under them should not. The status
   * colour when it did not, since the whole stretch is then all we can say.
   */
  nbColor: string;
  sbColor: string;
  /** Colour for one queue, by carriageway and its place in that list. */
  jamColorFor: (direction: DirectionKey, index: number) => string;
  /** Neutral colour for furniture that is not a traffic reading. */
  quietColor: string;
  exitName: string;
}

export type { CorridorSegment, DirectionKey, LatLng };
