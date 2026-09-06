import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Session } from '@supabase/supabase-js';
import { AuthResult, authenticate, nameForUser, register, signOutRemote } from './authApi';
import { getSupabase, isSupabaseConfigured } from './supabaseClient';

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

export interface AuthSession {
  token: string;
  fullName: string;
  email: string;
}

export interface AuthContextValue {
  /** `loading` until the stored session has been read back on launch. */
  status: AuthStatus;
  session: AuthSession | null;
  signIn: (input: { email: string; password: string; remember: boolean }) => Promise<void>;
  signUp: (input: { fullName: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_SESSION_KEY = 'authSession';
const REMEMBER_ME_KEY = 'authRememberMe';

/**
 * expo-secure-store is unsupported on web and throws there, so every call is
 * wrapped and falls back to memory. That keeps the flow working in a browser
 * for development; on a real device the SecureStore path is the one used.
 */
const memoryStore = new Map<string, string>();

async function writeItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

/**
 * The "remember me" flag lives in AsyncStorage, deliberately alongside the
 * Supabase session rather than in SecureStore.
 *
 * It is not a secret, and keeping the two in the same store means they cannot
 * disagree. When it lived in SecureStore the flag was lost on every web reload
 * (SecureStore is unsupported there and falls back to memory), so a remembered
 * user was silently signed out on refresh while their session was still valid.
 */
async function readRemembered(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(REMEMBER_ME_KEY)) === 'true';
  } catch {
    return false;
  }
}

async function writeRemembered(remember: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(REMEMBER_ME_KEY, remember ? 'true' : 'false');
  } catch {
    // Worst case the next cold start treats the session as not remembered.
  }
}

async function clearRemembered(): Promise<void> {
  try {
    await AsyncStorage.removeItem(REMEMBER_ME_KEY);
  } catch {
    // Nothing to clear.
  }
}

async function removeItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Nothing stored on this platform; the memory copy below is the real one.
  }
  memoryStore.delete(key);
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    /** Supabase's session is the source of truth; ours just mirrors it. */
    const toAuthSession = (session: Session): AuthSession => ({
      token: session.access_token,
      fullName: nameForUser(session.user),
      email: session.user.email ?? '',
    });

    const apply = (session: Session | null): void => {
      if (cancelled) {
        return;
      }
      setSession(session === null ? null : toAuthSession(session));
      setStatus(session === null ? 'signedOut' : 'signedIn');
    };

    const restore = async (): Promise<void> => {
      if (!isSupabaseConfigured) {
        // Nothing to restore from, and every call would throw anyway. Land on
        // the sign-in screen so the error is shown where it can be read.
        if (!cancelled) {
          setSession(null);
          setStatus('signedOut');
        }
        return;
      }

      const { data } = await getSupabase().auth.getSession();

      // Supabase always persists. "Remember me" is honoured here instead: an
      // unremembered session is ended the next time the app cold-starts.
      if (data.session !== null && !(await readRemembered())) {
        await signOutRemote();
        apply(null);
        return;
      }

      apply(data.session);
    };

    void restore();

    // Keeps state correct when the token refreshes, or the session is ended
    // from somewhere other than the Log Out button.
    const { data: subscription } = isSupabaseConfigured
      ? getSupabase().auth.onAuthStateChange((_event, nextSession) => {
          if (nextSession !== null) {
            void writeItem(AUTH_TOKEN_KEY, nextSession.access_token);
          }
          apply(nextSession);
        })
      : { data: null };

    return () => {
      cancelled = true;
      subscription?.subscription.unsubscribe();
    };
  }, []);

  const startSession = useCallback(
    async (result: AuthResult, remember: boolean): Promise<void> => {
      const next: AuthSession = {
        token: result.token,
        fullName: result.fullName,
        email: result.email,
      };
      setSession(next);
      setStatus('signedIn');

      // The session itself is Supabase's to store. We keep the flag that
      // decides whether it survives a restart, plus a copy of the access token
      // for the API helpers that build Authorization headers.
      await writeRemembered(remember);
      await writeItem(AUTH_TOKEN_KEY, next.token);
    },
    [],
  );

  const signIn = useCallback(
    async ({
      email,
      password,
      remember,
    }: {
      email: string;
      password: string;
      remember: boolean;
    }): Promise<void> => {
      const result = await authenticate({ email, password });
      await startSession(result, remember);
    },
    [startSession],
  );

  const signUp = useCallback(
    async ({
      fullName,
      email,
      password,
    }: {
      fullName: string;
      email: string;
      password: string;
    }): Promise<void> => {
      const result = await register({ fullName, email, password });
      // A brand new account stays signed in; there is nothing to "remember"
      // beyond the account the user just made.
      await startSession(result, true);
    },
    [startSession],
  );

  const signOut = useCallback(async (): Promise<void> => {
    setSession(null);
    setStatus('signedOut');
    await signOutRemote();
    await clearRemembered();
    await removeItem(AUTH_SESSION_KEY);
    await removeItem(AUTH_TOKEN_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, session, signIn, signUp, signOut }),
    [status, session, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}

export const authTokenKey = AUTH_TOKEN_KEY;
export const authSessionKey = AUTH_SESSION_KEY;
