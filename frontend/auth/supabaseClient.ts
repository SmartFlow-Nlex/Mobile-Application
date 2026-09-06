import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase connection.
 *
 * Both values are read from the environment so no credential is committed.
 * Put them in a `.env` file at the repo root (see `.env.example`) and restart
 * the dev server - Expo inlines `EXPO_PUBLIC_*` at bundle time, so a Fast
 * Refresh will not pick up a change.
 *
 * The anon/publishable key is meant to be shipped in the client; it is
 * protected by Row Level Security. The `service_role` key is NOT - it bypasses
 * RLS and must never appear in this app.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** False when the project has not been configured yet, so callers can say so. */
export const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

let client: SupabaseClient | null = null;

/**
 * Built on first use rather than at import.
 *
 * `createClient` throws "supabaseUrl is required" when handed an empty string,
 * and a throw at module scope takes down the whole app before a single screen
 * renders - so an unconfigured checkout would show a blank crash instead of the
 * sign-in form. Deferring it keeps the app bootable and lets the error surface
 * where the user can actually read it.
 */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and ' +
        'EXPO_PUBLIC_SUPABASE_ANON_KEY in .env, then restart the dev server.',
    );
  }

  if (client === null) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Sessions go in AsyncStorage rather than expo-secure-store: a Supabase
        // session carries a JWT plus a refresh token and comfortably exceeds
        // SecureStore's ~2 KB per-value limit, which fails at write time.
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // There is no URL bar to parse a callback out of in a native app, and
        // leaving this on makes supabase-js reach for browser globals.
        detectSessionInUrl: false,
      },
    });
  }

  return client;
}
