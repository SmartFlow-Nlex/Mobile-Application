import { Platform } from 'react-native';

/**
 * Every backend address the app talks to, in one place.
 *
 * The SmartFlow backend runs on whichever teammate's laptop is hosting, so the
 * host changes person to person. Override it without editing code by setting an
 * environment variable before starting the dev server - Expo inlines any
 * `EXPO_PUBLIC_*` variable into the bundle:
 *
 *   EXPO_PUBLIC_API_HOST=192.168.1.42 npx expo start
 *
 * Restart the dev server after changing it; the value is baked in at bundle
 * time, so a Fast Refresh will not pick it up.
 *
 * To point one service somewhere else entirely (say the dashboard runs on a
 * different machine from the community API), override that whole URL instead:
 *
 *   EXPO_PUBLIC_CORRIDOR_API_URL=http://10.0.0.5:4000 npx expo start
 */

/** Host to use when nothing is configured - the machine this was developed against. */
const DEFAULT_API_HOST = '192.168.2.196';

/**
 * An Android *emulator* reaches the dev machine through the special 10.0.2.2
 * alias rather than the LAN address. There is no reliable way to detect "inside
 * an emulator" from JS without a native module (expo-device is not installed),
 * so this is a flag to flip by hand if you switch to emulator-based testing.
 * Expo Go on a real phone - how this project is actually tested - wants the LAN
 * address and should leave this false.
 */
const USE_ANDROID_EMULATOR_HOST = false;

function resolveHost(): string {
  if (Platform.OS === 'android' && USE_ANDROID_EMULATOR_HOST) {
    return '10.0.2.2';
  }
  const configured = process.env.EXPO_PUBLIC_API_HOST;
  return configured !== undefined && configured.length > 0 ? configured : DEFAULT_API_HOST;
}

/** Host only, no scheme or port. Exported so error messages can name it. */
export const API_HOST = resolveHost();

const CORRIDOR_API_PORT = 4000;
const COMMUNITY_API_PORT = 3000;

/**
 * Dashboard / Waze-ingest backend: live corridor status.
 * This is the one that has to be running for the Map screen to show real data.
 */
export const CORRIDOR_API_BASE_URL =
  process.env.EXPO_PUBLIC_CORRIDOR_API_URL ?? `http://${API_HOST}:${CORRIDOR_API_PORT}`;

/**
 * Community feed and user profile API.
 *
 * Note this deliberately uses the LAN host rather than localhost: on a phone,
 * "localhost" is the phone itself, so the previous hardcoded localhost:3000
 * could never have reached anything. Both callers fall back to local data when
 * it is unreachable, which is why that went unnoticed.
 */
export const COMMUNITY_API_BASE_URL =
  process.env.EXPO_PUBLIC_COMMUNITY_API_URL ?? `http://${API_HOST}:${COMMUNITY_API_PORT}`;

/** How long to wait before declaring a backend unreachable, in milliseconds. */
export const API_TIMEOUT_MS = 10000;
