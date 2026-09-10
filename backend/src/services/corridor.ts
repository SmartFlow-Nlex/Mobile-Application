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
const CORRIDOR_STATUS_PATH = '/api/dashboard/corridor-status/full';

/** A dead host never refuses, it just stops answering. Fail fast instead. */
const REQUEST_TIMEOUT_MS = 8000;

/** The ingester writes every few minutes, so a short cache costs nothing. */
const CACHE_TTL_MS = 30000;

export type CorridorStatusValue = 'clear' | 'slow' | 'congested';

export interface CorridorDirectionStatus {
  status: CorridorStatusValue;
  level: number | null;
  speedKmh: number | null;
  jamCount: number;
  observedAt: string | null;
  hasRamp: boolean;
}

export interface CorridorExit {
  exit_id: number;
  exit_name: string;
  display_name: string;
  km: number;
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
}

/** Either live data, or a plain reason we could not get it. */
export type CorridorResult =
  | { available: true; data: CorridorStatusData }
  | { available: false; reason: string };

let cached: { at: number; result: CorridorResult } | null = null;

export async function getCorridorStatus(): Promise<CorridorResult> {
  if (cached !== null && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.result;
  }

  const url = `${CORRIDOR_API_BASE_URL}${CORRIDOR_STATUS_PATH}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let result: CorridorResult;
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      result = {
        available: false,
        reason: `The traffic data service answered with HTTP ${response.status}.`,
      };
    } else {
      const payload = (await response.json()) as {
        success?: boolean;
        data?: CorridorStatusData;
      };
      result =
        payload.success === true && payload.data !== undefined
          ? { available: true, data: payload.data }
          : {
              available: false,
              reason: 'The traffic data service returned an unexpected response.',
            };
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
export function findExit(exits: CorridorExit[], query: string): CorridorExit | null {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return null;
  }

  const names = (exit: CorridorExit): string[] => [
    exit.display_name.toLowerCase(),
    exit.exit_name.toLowerCase(),
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
