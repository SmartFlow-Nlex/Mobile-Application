import { Platform } from 'react-native';

/**
 * Live corridor data comes from the Waze-ingest backend, not this app. Expo
 * Go on a real phone - how this project is actually tested throughout this
 * codebase - needs the LAN address; an Android *emulator* instead resolves
 * the dev machine through the special 10.0.2.2 alias. There is no reliable
 * way to detect "running inside an emulator" from JS alone without adding a
 * native module (expo-device is not installed here), so this is a single
 * flag to flip by hand if you switch to emulator-based testing.
 */
const USE_ANDROID_EMULATOR_HOST = false;

export const CORRIDOR_API_BASE_URL =
  Platform.OS === 'android' && USE_ANDROID_EMULATOR_HOST
    ? 'http://10.0.2.2:4000'
    : 'http://192.168.2.196:4000';

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

export async function fetchCorridorStatus(signal?: AbortSignal): Promise<CorridorStatusData> {
  const response = await fetch(`${CORRIDOR_API_BASE_URL}${CORRIDOR_STATUS_PATH}`, { signal });

  if (!response.ok) {
    throw new Error(`Corridor status request failed (HTTP ${response.status})`);
  }

  const payload = (await response.json()) as CorridorStatusApiResponse;

  if (!payload.success) {
    throw new Error('Corridor status request did not succeed');
  }

  return payload.data;
}
