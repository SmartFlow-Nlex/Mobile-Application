import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthResult, authenticate, register } from './authApi';

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

/**
 * expo-secure-store is unsupported on web and throws there, so every call is
 * wrapped and falls back to memory. That keeps the flow working in a browser
 * for development; on a real device the SecureStore path is the one used.
 */
const memoryStore = new Map<string, string>();

async function readItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

async function writeItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    memoryStore.set(key, value);
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

function parseSession(raw: string | null): AuthSession | null {
  if (raw === null) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (
      typeof parsed.token === 'string' &&
      typeof parsed.fullName === 'string' &&
      typeof parsed.email === 'string'
    ) {
      return { token: parsed.token, fullName: parsed.fullName, email: parsed.email };
    }
  } catch {
    // A corrupt entry is treated as no session rather than crashing the launch.
  }
  return null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    const restore = async (): Promise<void> => {
      const stored = parseSession(await readItem(AUTH_SESSION_KEY));
      if (cancelled) {
        return;
      }
      setSession(stored);
      setStatus(stored === null ? 'signedOut' : 'signedIn');
    };

    void restore();

    return () => {
      cancelled = true;
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

      if (remember) {
        // "Remember me" is the whole difference between a session that survives
        // a restart and one that lives only in memory for this launch.
        await writeItem(AUTH_SESSION_KEY, JSON.stringify(next));
        await writeItem(AUTH_TOKEN_KEY, next.token);
      } else {
        await removeItem(AUTH_SESSION_KEY);
        await removeItem(AUTH_TOKEN_KEY);
      }
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
