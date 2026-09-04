import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  CorridorApiError,
  CorridorErrorKind,
  CorridorStatusData,
  fetchCorridorStatus,
} from '../lib/corridorApi';

/** "Poll every 60s — the Waze ingester writes every few minutes." */
const POLL_INTERVAL_MS = 60000;

export interface CorridorStatusError {
  kind: CorridorErrorKind | 'unknown';
  message: string;
  /** Address that was tried, so the UI can show teammates where to look. */
  url: string | null;
}

export interface CorridorStatusState {
  data: CorridorStatusData | null;
  /** True only until the very first request settles - polling refreshes are silent. */
  isLoading: boolean;
  error: CorridorStatusError | null;
  refresh: () => void;
}

/**
 * Polls the live Waze-derived corridor feed. The first request drives
 * `isLoading`; every request after that (scheduled or via `refresh`) updates
 * `data`/`error` quietly in the background so the UI never flashes a spinner
 * over data it already has.
 */
export function useCorridorStatus(): CorridorStatusState {
  const [data, setData] = useState<CorridorStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<CorridorStatusError | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback((): void => {
    setRefreshToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = async (): Promise<void> => {
      try {
        const next = await fetchCorridorStatus(controller.signal);
        if (!cancelled) {
          setData(next);
          setError(null);
        }
      } catch (caughtError) {
        if (!cancelled && !controller.signal.aborted) {
          setError(
            caughtError instanceof CorridorApiError
              ? { kind: caughtError.kind, message: caughtError.message, url: caughtError.url }
              : {
                  kind: 'unknown',
                  message:
                    caughtError instanceof Error
                      ? caughtError.message
                      : 'Failed to load corridor status',
                  url: null,
                },
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();
    const interval = setInterval(() => void load(), POLL_INTERVAL_MS);

    // Re-sync immediately on returning to the foreground, so a phone left
    // backgrounded for a while doesn't keep showing a stale snapshot until
    // the next scheduled tick.
    const handleAppStateChange = (state: AppStateStatus): void => {
      if (state === 'active') {
        void load();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(interval);
      subscription.remove();
    };
  }, [refreshToken]);

  return { data, isLoading, error, refresh };
}

export default useCorridorStatus;
