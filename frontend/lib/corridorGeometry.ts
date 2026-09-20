import centreline from './nlexCentreline.json';
import type { CorridorExit } from './corridorApi';

/**
 * The NLEX centreline, cut into the stretch that belongs to one exit.
 *
 * `nlexCentreline.json` is NOT the raw OSM geometry the backend derives status
 * from. That file is 2,559 points of both carriageways plus ramps, concatenated
 * in whatever order the ways came back: 1,019 of its steps run south, one jumps
 * 5.2 km, and walking it end to end covers 196 km of a 76 km road. Slicing it
 * directly drew the corridor as a doubling-back tangle - which is exactly what
 * the first version of this file did.
 *
 * What is shipped here instead is the output of the dashboard's own
 * `corridorShape.corridorGuard()`, run once offline and committed: 725 ordered
 * vertices, 77.99 km against the corridor's 76.25, 16 southward steps left as
 * jitter on the curves. It is the same line the statuses are derived on, so the
 * road drawn here is the road that was measured.
 *
 * Baked rather than computed in the app for two reasons: the rebuild is four
 * resampling passes over 2,559 points, which is not something to pay for on
 * every screen open, and carrying the algorithm in the app would be a third
 * copy of it to keep in step. To regenerate after the geometry or the exit list
 * changes, re-run corridorGuard over nlexGeometry.json and write out
 * `guard.centreline`.
 *
 * Ordered south to north - [121.0002, 14.6790] at Balintawak through to
 * [120.5879, 15.2222] at Sta. Ines - the same direction as km ascending, so an
 * exit's km and its position along this line agree.
 *
 * It is committed rather than fetched because it is a fixed description of
 * where the road is: a map that still draws the road when the feed is down is
 * more useful than one that goes blank with it. Only the colours need network.
 */

/** GeoJSON order: [longitude, latitude]. */
type LngLat = [number, number];

/** What react-native-maps wants. */
export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Bounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface CorridorSegment {
  /** The stretch this exit owns, centre of the carriageway. */
  centre: LatLng[];
  /** The same stretch shifted onto each carriageway, for two coloured lines. */
  NB: LatLng[];
  SB: LatLng[];
  /** Where this exit sits, and its neighbours at each end of the stretch. */
  exit: LatLng;
  startLabel: string | null;
  endLabel: string | null;
  /** Length of the drawn stretch, in kilometres. */
  lengthKm: number;
  bounds: Bounds;
}

/*
 * The JSON is typed as number[][] by the importer, which cannot know each pair
 * has exactly two entries. Asserted through `unknown` rather than loosening
 * LngLat, so the tuple shape still holds everywhere it is used below.
 */
const points = (centreline as unknown as { coordinates: LngLat[] }).coordinates;

/*
 * Metres per degree around 15°N. The corridor spans half a degree of latitude,
 * so a single local scale is accurate to well under the width of the road -
 * far tighter than anything drawn here needs.
 */
const M_PER_DEG_LAT = 110574;
const M_PER_DEG_LON = 111320 * Math.cos((15 * Math.PI) / 180);

/**
 * Half the gap between the two carriageways, in metres.
 *
 * NLEX's carriageways sit roughly 20-30m apart centre to centre. Drawing them
 * at true separation makes them merge into one line at the zoom that shows a
 * whole stretch, so this is exaggerated enough to stay legible while still
 * reading as one divided highway rather than two roads.
 */
const CARRIAGEWAY_OFFSET_M = 55;

function metresBetween(a: LngLat, b: LngLat): number {
  return Math.hypot((a[0] - b[0]) * M_PER_DEG_LON, (a[1] - b[1]) * M_PER_DEG_LAT);
}

/** Index of the centreline vertex closest to a point. */
function nearestIndex(lon: number, lat: number): number {
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < points.length; i += 1) {
    const distance = metresBetween(points[i], [lon, lat]);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}

/**
 * Shift a line sideways onto one carriageway.
 *
 * The tangent at each vertex comes from its neighbours, so the offset turns
 * with the road instead of skewing on the bends. `side` is +1 or -1; which one
 * lands on which carriageway depends on the direction of travel along the
 * line, which is why the caller names them rather than this function.
 */
function offsetLine(line: LngLat[], side: number): LatLng[] {
  return line.map((point, index) => {
    const before = line[Math.max(0, index - 1)];
    const after = line[Math.min(line.length - 1, index + 1)];

    // Tangent in metres, so the rotation is done in a square space rather than
    // in degrees, where a degree of longitude is shorter than one of latitude.
    const dx = (after[0] - before[0]) * M_PER_DEG_LON;
    const dy = (after[1] - before[1]) * M_PER_DEG_LAT;
    const length = Math.hypot(dx, dy);
    if (length === 0) {
      return { latitude: point[1], longitude: point[0] };
    }

    // Rotate the unit tangent by 90° to get the perpendicular.
    const nx = (-dy / length) * CARRIAGEWAY_OFFSET_M * side;
    const ny = (dx / length) * CARRIAGEWAY_OFFSET_M * side;

    return {
      latitude: point[1] + ny / M_PER_DEG_LAT,
      longitude: point[0] + nx / M_PER_DEG_LON,
    };
  });
}

function boundsOf(lines: LatLng[][]): Bounds {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  for (const line of lines) {
    for (const point of line) {
      minLat = Math.min(minLat, point.latitude);
      maxLat = Math.max(maxLat, point.latitude);
      minLon = Math.min(minLon, point.longitude);
      maxLon = Math.max(maxLon, point.longitude);
    }
  }
  return { minLat, maxLat, minLon, maxLon };
}

function lengthKmOf(line: LngLat[]): number {
  let total = 0;
  for (let i = 1; i < line.length; i += 1) {
    total += metresBetween(line[i - 1], line[i]);
  }
  return total / 1000;
}

/**
 * The stretch of road an exit is responsible for.
 *
 * Cut at the midpoint to each neighbour, which is not an arbitrary choice: the
 * backend attributes a jam to whichever exit its midpoint is nearest to, so
 * midpoint-to-midpoint is exactly the piece of road whose jams produced this
 * exit's reading. Drawing any more than that would colour road the reading
 * does not cover.
 *
 * `exits` must be the full corridor list; the neighbours are taken from it.
 */
export function segmentForExit(exits: CorridorExit[], exitId: number): CorridorSegment | null {
  if (exits.length === 0) {
    return null;
  }

  const ordered = [...exits].sort((a, b) => a.km - b.km);
  const position = ordered.findIndex((candidate) => candidate.exit_id === exitId);
  if (position === -1) {
    return null;
  }

  const exit = ordered[position];
  const previous = position > 0 ? ordered[position - 1] : null;
  const next = position < ordered.length - 1 ? ordered[position + 1] : null;

  const here = nearestIndex(exit.longitude, exit.latitude);

  /*
   * The stretch is every vertex whose nearest interchange is this one.
   *
   * That is not an approximation of the attribution rule, it IS the rule: the
   * backend gives a jam to whichever exit its midpoint is closest to, by this
   * same straight-line metric. So the run of road that answers to this exit is
   * exactly the run of centreline closer to it than to any other - and
   * colouring precisely that is the difference between "this stretch is
   * congested" being a claim about the right piece of tarmac or the wrong one.
   *
   * Cutting at the halfway VERTEX between neighbours was tried first and is
   * subtly wrong, because the vertices are not evenly spaced - 108 m apart on
   * average but far longer on the straight rural runs - so the halfway vertex
   * is not the halfway point. It gave Pulilan 10.6 km of road for a gap that
   * only entitles it to about 9.
   */
  const walk = (step: number): number => {
    let index = here;
    while (index + step >= 0 && index + step < points.length) {
      const candidate = points[index + step];
      const own = metresBetween(candidate, [exit.longitude, exit.latitude]);
      const rival = Math.min(
        previous === null
          ? Infinity
          : metresBetween(candidate, [previous.longitude, previous.latitude]),
        next === null ? Infinity : metresBetween(candidate, [next.longitude, next.latitude]),
      );
      if (rival < own) {
        // One vertex past the boundary, so neighbouring stretches meet rather
        // than leaving a gap of unclaimed road between them.
        return index + step;
      }
      index += step;
    }
    return index;
  };

  const from = Math.max(0, Math.min(walk(-1), here));
  const to = Math.min(points.length - 1, Math.max(walk(1), here));
  const slice = points.slice(from, to + 1);

  if (slice.length < 2) {
    return null;
  }

  /*
   * The slice runs south to north, the same way northbound traffic does, so
   * the left-hand side of that direction of travel is the west side. Both
   * carriageways are drawn, and which colour goes on which side matters only
   * in that the two must not swap between exits - so it is fixed here rather
   * than derived per segment.
   */
  const NB = offsetLine(slice, -1);
  const SB = offsetLine(slice, 1);
  const centre = slice.map((point) => ({ latitude: point[1], longitude: point[0] }));

  return {
    centre,
    NB,
    SB,
    exit: { latitude: exit.latitude, longitude: exit.longitude },
    startLabel: previous?.display_name ?? null,
    endLabel: next?.display_name ?? null,
    lengthKm: lengthKmOf(slice),
    bounds: boundsOf([NB, SB]),
  };
}

/**
 * A map region that frames a segment with a margin around it.
 *
 * The minimums stop a short stretch - Balintawak to Cloverleaf is barely a
 * kilometre - from zooming in so far that there is no context left around the
 * road.
 */
export function regionFor(bounds: Bounds): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} {
  const latitudeDelta = Math.max((bounds.maxLat - bounds.minLat) * 1.6, 0.012);
  const longitudeDelta = Math.max((bounds.maxLon - bounds.minLon) * 1.6, 0.012);
  return {
    latitude: (bounds.minLat + bounds.maxLat) / 2,
    longitude: (bounds.minLon + bounds.maxLon) / 2,
    latitudeDelta,
    longitudeDelta,
  };
}
