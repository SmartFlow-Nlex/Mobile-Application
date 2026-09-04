import { API_TIMEOUT_MS, CORRIDOR_API_BASE_URL } from '../config/api';

export { CORRIDOR_API_BASE_URL };

const CORRIDOR_STATUS_PATH = '/api/dashboard/corridor-status/full';

/** The server has already classified congestion - never re-derive this from `level`. */
export type CorridorStatusValue = 'clear' | 'slow' | 'congested';

export interface CorridorDirectionStatus {
  status: CorridorStatusValue;
  level: number | null;
  speedKmh: number | null;
  jamCount: number;
  observedAt: string | null;
  access: string | null;
  /** False means no ramp exists for this direction at this exit - no traffic ever flows there. */
  hasRamp: boolean;
}

export interface CorridorExit {
  exit_id: number;
  exit_name: string;
  display_name: string;
  /** Kilometres from Balintawak (km 0) - exit_id ascending already matches this order. */
  km: number;
  latitude: number;
  longitude: number;
  node_type: string;
  directions: {
    NB: CorridorDirectionStatus;
    SB: CorridorDirectionStatus;
  };
}

export interface CorridorFeedMeta {
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
  windowMinutes: number;
  generatedAt: string;
  feed: CorridorFeedMeta;
  counts: CorridorCounts;
  /** Ordered by exit_id ascending = Balintawak (km 0) -> Sta. Ines (km ~76.25). */
  exits: CorridorExit[];
}

interface CorridorStatusApiResponse {
  success: boolean;
  data: CorridorStatusData;
}

/** Why a corridor request failed, so the UI can say something useful. */
export type CorridorErrorKind =
  /** Nothing answered at the address - backend down, wrong IP, or firewalled. */
  | 'unreachable'
  /** The server answered, but not with what we expected. */
  | 'badResponse';

export class CorridorApiError extends Error {
  readonly kind: CorridorErrorKind;
  /** The address that was tried, so the message can name it. */
  readonly url: string;

  constructor(kind: CorridorErrorKind, message: string, url: string) {
    super(message);
    this.name = 'CorridorApiError';
    this.kind = kind;
    this.url = url;
  }
}

export async function fetchCorridorStatus(signal?: AbortSignal): Promise<CorridorStatusData> {
  const url = `${CORRIDOR_API_BASE_URL}${CORRIDOR_STATUS_PATH}`;

  // A dead host does not refuse the connection, it simply never answers - without
  // our own deadline the request sits there for the platform default (a minute or
  // more on iOS) and the card looks like it is hanging.
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), API_TIMEOUT_MS);

  // Honour the caller's signal (screen unmount, refresh) as well as our timeout.
  const onCallerAbort = (): void => timeoutController.abort();
  signal?.addEventListener('abort', onCallerAbort);

  let response: Response;
  try {
    response = await fetch(url, { signal: timeoutController.signal });
  } catch (caught) {
    // The caller cancelled deliberately: let the hook drop it, do not surface
    // an error the user would see for a screen they already left.
    if (signal?.aborted === true) {
      throw caught;
    }
    throw new CorridorApiError('unreachable', 'Could not reach the backend', url);
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onCallerAbort);
  }

  if (!response.ok) {
    throw new CorridorApiError(
      'badResponse',
      `The backend answered with HTTP ${response.status}`,
      url,
    );
  }

  let payload: CorridorStatusApiResponse;
  try {
    payload = (await response.json()) as CorridorStatusApiResponse;
  } catch {
    throw new CorridorApiError('badResponse', 'The backend sent a response we could not read', url);
  }

  if (!payload.success || payload.data === undefined) {
    throw new CorridorApiError('badResponse', 'The backend reported the request did not succeed', url);
  }

  return payload.data;
}
