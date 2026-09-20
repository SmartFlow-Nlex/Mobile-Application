import {
  centrelineVertexCount,
  corridorStatusFromFeed,
  type ExitStatus,
  type FeatureCollection,
  type JamOnCorridor,
  type NlexExit,
} from '../corridor/deriveStatus';

export type { JamOnCorridor };

/**
 * Live NLEX corridor data, read from the dashboard/intelligence system.
 *
 * This is the only source of traffic facts the assistant is allowed to use.
 * When it cannot be reached we say so explicitly rather than returning an
 * empty result - a chatbot that answers "no traffic" because a fetch failed
 * would be worse than one that admits it does not know.
 */

const CORRIDOR_API_BASE_URL =
  process.env.CORRIDOR_API_URL ?? 'http://localhost:4000';
/*
 * The dashboard's own live feed, plus the exit roster that keys it.
 *
 * Deliberately NOT /api/dashboard/corridor-status/full any more. That endpoint
 * aggregates in SQL, and the dashboard stopped rendering from it because the
 * two pipelines disagreed - the SQL side counted jams near the corridor that
 * the map had discarded for not lying on it. Reading it left this app showing
 * different numbers from the dashboard for the same moment.
 *
 * These two are what the dashboard itself reads. The per-exit status is then
 * derived here with the dashboard's own function, so both agree by
 * construction rather than by coincidence.
 */
const REALTIME_PATH = '/api/map-comparison/real-time';
const EXITS_PATH = '/api/map-comparison/exits';

/**
 * A dead host never refuses, it just stops answering - so there has to be a
 * bound. 8s was too tight: the dashboard is on a free tier that sleeps, and
 * waking it takes 20-25s, during which Render answers 502. Every first request
 * after an idle spell therefore failed, and the app showed "data unavailable"
 * on a system that was merely starting up.
 */
const REQUEST_TIMEOUT_MS = 25000;

/**
 * Render answers 502/503 while a sleeping service starts. That is "wait", not
 * "broken", so it is worth one more try - by then the service is usually awake.
 * Anything else, including a 404 or a 500, is a real failure and is reported.
 */
const COLD_START_CODES = new Set([502, 503, 504]);
const RETRY_DELAY_MS = 1500;

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** The ingester writes every few minutes, so a short cache costs nothing. */
const CACHE_TTL_MS = 30000;

export type CorridorStatusValue = 'clear' | 'slow' | 'congested';

export interface CorridorDirectionStatus {
  status: CorridorStatusValue;
  level: number | null;
  speedKmh: number | null;
  jamCount: number;
  observedAt: string | null;
  /** "Entry & Exit", "Entry Only", "Exit Only", "No Access", or null at a barrier. */
  access: string | null;
  hasRamp: boolean;
  /** Where the queues actually are, so the map can colour only those. */
  jams: JamOnCorridor[];
  /** Total length of queue on this stretch, in metres. */
  queueMetres: number;
  /**
   * Time the queues here add, in seconds - Waze's own per-jam estimate, summed.
   * Null when no jam carried one, which is not the same as no delay.
   */
  delaySeconds: number | null;
}

export interface CorridorExit {
  exit_id: number;
  exit_name: string;
  display_name: string;
  km: number;
  latitude: number;
  longitude: number;
  node_type: string;
  directions: { NB: CorridorDirectionStatus; SB: CorridorDirectionStatus };
}

export interface CorridorFeed {
  newestAt: string | null;
  ageMinutes: number | null;
  stale: boolean;
}

export interface CorridorCounts {
  congested: number;
  slow: number;
  clear: number;
}

export interface CorridorStatusData {
  generatedAt: string;
  feed: CorridorFeed;
  counts: CorridorCounts;
  exits: CorridorExit[];
  /**
   * Which centreline the jam indices point into. The app ships its own copy of
   * that line and compares this before drawing, so a change to the geometry or
   * the exit list shows as "no jam detail" rather than as jams in the wrong
   * place.
   */
  geometry: { centrelineVertices: number };
}

/** Either live data, or a plain reason we could not get it. */
export type CorridorResult =
  | { available: true; data: CorridorStatusData }
  | { available: false; reason: string };

/** What /api/map-comparison/real-time returns: GeoJSON plus its own freshness. */
interface RealtimeFeed extends FeatureCollection {
  feed?: {
    newestAt?: string | null;
    ageMinutes?: number | null;
    stale?: boolean;
  };
}

/**
 * The exit roster, however the dashboard wrapped it.
 *
 * It has served both a bare array and a {success, data} envelope at different
 * times, so both are accepted rather than betting on one.
 */
function readExitList(payload: unknown): NlexExit[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data)
      ? ((payload as { data: unknown[] }).data)
      : [];

  return rows.filter((row): row is NlexExit => {
    const exit = row as Partial<NlexExit>;
    return (
      typeof exit.exit_name === 'string' &&
      typeof exit.latitude === 'number' &&
      typeof exit.longitude === 'number' &&
      typeof exit.km === 'number'
    );
  });
}

/**
 * How you can use this exit in this direction.
 *
 * Copied from the dashboard's accessLabel in lib/nlex-exits.ts, including the
 * null at a toll barrier - a barrier is not an exit you take, so "No Access"
 * would read as though something were wrong with it.
 */
/**
 * Does traffic flow through here in this direction?
 *
 * Not the same question as whether there is a ramp. A toll barrier has no
 * entry or exit ramps at all, but the mainline runs straight through it, so
 * both carriageways carry traffic. The Corridor screen draws a direction with
 * hasRamp=false as bare grey tarmac - "no road this way" - which is right for
 * a one-way interchange and wrong for a barrier: it left a grey gap in the
 * northbound carriageway at Bocaue Barrier, on a road that plainly continues.
 *
 * Matches what the SQL endpoint reported for the same exits.
 */
function trafficFlows(exit: NlexExit, direction: 'NB' | 'SB'): boolean {
  if (exit.node_type === 'toll-barrier') {
    return true;
  }
  return direction === 'NB'
    ? exit.nb_entry === true || exit.nb_exit === true
    : exit.sb_entry === true || exit.sb_exit === true;
}

function accessLabel(exit: NlexExit, direction: 'NB' | 'SB'): string | null {
  const entry = direction === 'NB' ? exit.nb_entry : exit.sb_entry;
  const leave = direction === 'NB' ? exit.nb_exit : exit.sb_exit;
  if (exit.node_type === 'toll-barrier') {
    return null;
  }
  if (entry === true && leave === true) {
    return 'Entry & Exit';
  }
  if (entry === true) {
    return 'Entry Only';
  }
  if (leave === true) {
    return 'Exit Only';
  }
  return 'No Access';
}

/** An exit-direction the feed said nothing about: no jams means clear. */
const clearStatus = (hasRamp: boolean, access: string | null): CorridorDirectionStatus => ({
  status: 'clear',
  level: null,
  speedKmh: null,
  jamCount: 0,
  observedAt: null,
  access,
  hasRamp,
  jams: [],
  queueMetres: 0,
  delaySeconds: null,
});

/**
 * Turn the dashboard's feed into the shape this app has always consumed.
 *
 * Keeping the shape identical is the point: the assistant's tools and the Map
 * screen both read it, and neither should have to care that the derivation
 * moved. Only the numbers change - to the dashboard's.
 */
/**
 * Added time across a stretch's jams.
 *
 * Null only when not one jam reported a delay - summing the ones that did and
 * calling that the total would understate it silently, but reporting nothing
 * when some are known would throw away a real figure.
 */
function sumDelay(jams: JamOnCorridor[]): number | null {
  const known = jams.filter((jam) => jam.delaySeconds !== null);
  if (known.length === 0) {
    return null;
  }
  return known.reduce((total, jam) => total + (jam.delaySeconds ?? 0), 0);
}

function buildCorridorStatus(feed: RealtimeFeed, exits: NlexExit[]): CorridorStatusData {
  const derived = corridorStatusFromFeed(feed, exits);

  const byExit = new Map<string, { NB?: ExitStatus; SB?: ExitStatus }>();
  for (const row of derived) {
    const entry = byExit.get(row.exit) ?? {};
    entry[row.direction] = row;
    byExit.set(row.exit, entry);
  }

  const toDirection = (
    row: ExitStatus | undefined,
    hasRamp: boolean,
    access: string | null,
  ): CorridorDirectionStatus =>
    row === undefined
      ? clearStatus(hasRamp, access)
      : {
          status: row.status,
          level: row.level,
          speedKmh: row.speedKmh,
          jamCount: row.jamCount,
          observedAt: row.observedAt,
          access,
          hasRamp,
          jams: row.jams,
          queueMetres: row.jams.reduce((total, jam) => total + jam.lengthMetres, 0),
          delaySeconds: sumDelay(row.jams),
        };

  const ordered = [...exits].sort((a, b) => a.km - b.km);
  const rows: CorridorExit[] = ordered.map((exit) => {
    const found = byExit.get(exit.exit_name) ?? {};
    return {
      exit_id: exit.exit_id,
      exit_name: exit.exit_name,
      // The dashboard's roster carries no separate display name.
      display_name: exit.exit_name,
      km: exit.km,
      // The Corridor screen prints these under each exit, so they are not
      // optional - leaving them out crashed it on exit.latitude.toFixed().
      latitude: exit.latitude,
      longitude: exit.longitude,
      node_type: exit.node_type ?? 'interchange',
      directions: {
        NB: toDirection(found.NB, trafficFlows(exit, 'NB'), accessLabel(exit, 'NB')),
        SB: toDirection(found.SB, trafficFlows(exit, 'SB'), accessLabel(exit, 'SB')),
      },
    };
  });

  const counts: CorridorCounts = { congested: 0, slow: 0, clear: 0 };
  for (const row of rows) {
    for (const key of ['NB', 'SB'] as const) {
      counts[row.directions[key].status] += 1;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    feed: {
      newestAt: feed.feed?.newestAt ?? null,
      ageMinutes: feed.feed?.ageMinutes ?? null,
      // No freshness block means we cannot vouch for the data's age.
      stale: feed.feed?.stale ?? true,
    },
    counts,
    exits: rows,
    geometry: { centrelineVertices: centrelineVertexCount(exits) },
  };
}

let cached: { at: number; result: CorridorResult } | null = null;

export async function getCorridorStatus(): Promise<CorridorResult> {
  if (cached !== null && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.result;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let result: CorridorResult;
  try {
    // Both in flight together: the roster is small and rarely changes, but it
    // keys the derivation, so there is nothing to show without it either.
    /** One retry, and only while the upstream is waking. */
    const get = async (path: string): Promise<Response> => {
      const first = await fetch(`${CORRIDOR_API_BASE_URL}${path}`, {
        signal: controller.signal,
      });
      if (!COLD_START_CODES.has(first.status)) {
        return first;
      }
      await wait(RETRY_DELAY_MS);
      return fetch(`${CORRIDOR_API_BASE_URL}${path}`, { signal: controller.signal });
    };

    const [feedResponse, exitsResponse] = await Promise.all([
      get(REALTIME_PATH),
      get(EXITS_PATH),
    ]);

    if (!feedResponse.ok) {
      result = {
        available: false,
        reason: `The traffic data service answered with HTTP ${feedResponse.status}.`,
      };
    } else if (!exitsResponse.ok) {
      result = {
        available: false,
        reason: `The exit list service answered with HTTP ${exitsResponse.status}.`,
      };
    } else {
      const feed = (await feedResponse.json()) as RealtimeFeed;
      const exits = readExitList(await exitsResponse.json());

      result =
        exits.length === 0
          ? {
              available: false,
              reason: 'The traffic data service returned no NLEX exits.',
            }
          : { available: true, data: buildCorridorStatus(feed, exits) };
    }
  } catch {
    result = {
      available: false,
      reason:
        'The live NLEX traffic service is unreachable right now, so no current road conditions are available.',
    };
  } finally {
    clearTimeout(timeout);
  }

  cached = { at: Date.now(), result };
  return result;
}

/**
 * Resolve whatever the user called an exit to a real one.
 *
 * People say "Bocaue" for "Bocaue Barrier" and "Harbor Link" for "NLEX Harbor
 * Link", so an exact match alone would fail on most natural phrasing.
 */
/**
 * Fold the spellings people actually type onto one form.
 *
 * "Sta Ines" and "Sta. Ines" are the same place to a driver, and both get
 * typed. Punctuation and double spaces are dropped so the match does not hinge
 * on whether someone bothered with the full stop.
 */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.,''`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findExit(exits: CorridorExit[], query: string): CorridorExit | null {
  const needle = normalise(query);
  if (needle.length === 0) {
    return null;
  }

  const names = (exit: CorridorExit): string[] => [
    normalise(exit.display_name),
    normalise(exit.exit_name),
  ];

  const exact = exits.find((exit) => names(exit).includes(needle));
  if (exact !== undefined) {
    return exact;
  }

  const partial = exits.find((exit) =>
    names(exit).some((name) => name.includes(needle) || needle.includes(name)),
  );
  return partial ?? null;
}

/** Human-readable age of the feed, for the model to pass on to the user. */
export function describeFeedAge(feed: CorridorFeed): string {
  if (feed.ageMinutes === null) {
    return 'unknown age';
  }
  if (feed.ageMinutes < 1) {
    return 'updated just now';
  }
  if (feed.ageMinutes === 1) {
    return 'updated 1 minute ago';
  }
  return `updated ${Math.round(feed.ageMinutes)} minutes ago`;
}
