/**
 * PORTED FROM THE DASHBOARD - keep in step with it.
 *
 * Source: SmartFlow-Nlex/SmartFlow-NLEX, branch Dashboard,
 *         Front-End-Dashboard/lib/corridor-status.ts
 *
 * Why this exists rather than reading /api/dashboard/corridor-status/full:
 * that endpoint aggregates in SQL, and the dashboard stopped using it because
 * the two pipelines disagreed. Its own comment says the SQL panel "would call a
 * stretch congested on the strength of a jam the map had thrown away" - the SQL
 * side applied the NLEX street-name test but not the geometric one, so jams
 * near the corridor but not on it counted. The mobile app was still reading
 * that older pipeline, so it could show different numbers from the dashboard
 * for the same moment.
 *
 * NOT CURRENTLY WIRED UP. The deployed dashboard still renders from the SQL
 * endpoint, not from this derivation - its own footnote still reads "direction
 * from jam bearing", which is the older rule. Running this instead made the app
 * disagree with the dashboard people actually look at, and it is wrong at
 * Balintawak besides: the toll plaza is wider than the 200m corridor tolerance,
 * so a real level-4 jam there is discarded as off-corridor.
 *
 * Kept ready for the day the dashboard team deploys their newer derivation.
 * Until then services/corridor.ts reads their corridor-status endpoint directly.
 */

import {
  corridorGuard,
  type CorridorGuard,
  type LngLat,
} from './corridorShape';
import nlexGeometry from './nlexGeometry.json';

export type SegmentStatus = 'clear' | 'slow' | 'congested';

/** One exit the feed said something about, in one direction. */
export interface ExitStatus {
  exit: string;
  direction: 'NB' | 'SB';
  status: SegmentStatus;
  level: number | null;
  speedKmh: number | null;
  jamCount: number;
  observedAt: string | null;
}

/** The exit rows the dashboard serves from nlex_exits. */
export interface NlexExit {
  exit_id: number;
  exit_name: string;
  latitude: number;
  longitude: number;
  km: number;
  nb_entry?: boolean;
  nb_exit?: boolean;
  sb_entry?: boolean;
  sb_exit?: boolean;
  node_type?: string;
}

interface GeoFeature {
  properties?: Record<string, unknown> | null;
  geometry?: { type?: string; coordinates?: unknown } | null;
}

export interface FeatureCollection {
  features?: GeoFeature[];
}

/**
 * Waze's own bands. Unchanged from both the SQL version and the dashboard's,
 * so the words on screen do not shift with the source.
 */
function classify(level: number | null, speedKmh: number | null): SegmentStatus {
  if (level === null && speedKmh === null) {
    return 'clear';
  }
  if (level === 0) {
    return 'clear';
  }
  if ((level !== null && level >= 3) || (speedKmh !== null && speedKmh < 10)) {
    return 'congested';
  }
  return 'slow';
}

const M_PER_DEG_LAT = 110574;
const M_PER_DEG_LON = 111320 * Math.cos((15 * Math.PI) / 180);

const orderedExits = (exits: NlexExit[]): NlexExit[] =>
  [...exits].sort((a, b) => a.km - b.km);

/**
 * Building the centreline resamples 2,559 OSM points over four passes, which is
 * far too slow to repeat per request. The geometry never changes, so it is
 * built once per process - but keyed on the exit list, since a changed exit set
 * would invalidate it.
 */
let cached: { key: string; guard: CorridorGuard } | null = null;

function guardFor(exits: NlexExit[]): CorridorGuard {
  const ordered = orderedExits(exits);
  const key = ordered.map((e) => `${e.exit_id}:${e.km}`).join(',');
  if (cached !== null && cached.key === key) {
    return cached.guard;
  }
  const guard = corridorGuard(
    (nlexGeometry as unknown as { coordinates: LngLat[] }).coordinates,
    ordered.map((e) => [e.longitude, e.latitude] as LngLat),
  );
  cached = { key, guard };
  return guard;
}

/**
 * One row per exit and direction the feed says something about. Exits it is
 * silent on are absent, and the caller reads that as clear - matching how the
 * dashboard's panel treats them.
 */
export function corridorStatusFromFeed(
  fc: FeatureCollection | null | undefined,
  exits: NlexExit[],
): ExitStatus[] {
  if (fc?.features === undefined || fc.features.length === 0 || exits.length === 0) {
    return [];
  }

  const guard = guardFor(exits);
  const ordered = orderedExits(exits);
  const kept = guard.filter(fc as { features?: unknown[] }) as FeatureCollection;

  interface Acc {
    level: number | null;
    speed: number | null;
    count: number;
    observedAt: string | null;
  }
  const byKey = new Map<string, Acc>();

  for (const feature of kept.features ?? []) {
    const props = feature.properties;
    if (props?.feature_type !== 'jam' || feature.geometry?.type !== 'LineString') {
      continue;
    }

    const coords = feature.geometry.coordinates as number[][];
    const snapped = guard.snap(
      coords,
      typeof props.street === 'string' ? props.street : undefined,
    );
    if (snapped === null) {
      continue;
    }

    /*
     * Attributed to the nearest exit, which is how the panel is keyed. A jam
     * spans a stretch, so its midpoint decides which exit owns it.
     */
    const mid = coords[Math.floor(coords.length / 2)];
    let nearest = ordered[0];
    let best = Infinity;
    for (const exit of ordered) {
      const distance = Math.hypot(
        (exit.longitude - mid[0]) * M_PER_DEG_LON,
        (exit.latitude - mid[1]) * M_PER_DEG_LAT,
      );
      if (distance < best) {
        best = distance;
        nearest = exit;
      }
    }

    const key = `${nearest.exit_name}|${snapped.direction}`;
    const level = Number.isFinite(Number(props.level)) ? Number(props.level) : null;
    const speed = Number.isFinite(Number(props.speed)) ? Number(props.speed) : null;
    const at = typeof props.observed_at === 'string' ? props.observed_at : null;

    const acc = byKey.get(key);
    if (acc === undefined) {
      byKey.set(key, { level, speed, count: 1, observedAt: at });
    } else {
      // Worst level and slowest speed seen, matching the SQL this replaces.
      acc.level =
        acc.level === null ? level : level === null ? acc.level : Math.max(acc.level, level);
      acc.speed =
        acc.speed === null ? speed : speed === null ? acc.speed : Math.min(acc.speed, speed);
      acc.count += 1;
      if (at !== null && (acc.observedAt === null || at > acc.observedAt)) {
        acc.observedAt = at;
      }
    }
  }

  return [...byKey.entries()].map(([key, acc]) => {
    const [exit, direction] = key.split('|');
    return {
      exit,
      direction: direction as 'NB' | 'SB',
      status: classify(acc.level, acc.speed),
      level: acc.level,
      speedKmh: acc.speed,
      jamCount: acc.count,
      observedAt: acc.observedAt,
    };
  });
}
