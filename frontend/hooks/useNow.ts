import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export interface LiveClock {
  now: Date;
  /** Re-syncs the clock immediately, e.g. from a pull-to-refresh. */
  refresh: () => void;
}

/**
 * A clock that re-renders the caller on a fixed cadence.
 *
 * Pass 1000 for a seconds-accurate readout (the status card) or something
 * coarser for anything that only needs minute precision, so the whole screen
 * is not re-rendered every second.
 *
 * The timer is torn down while the app is backgrounded and the clock is
 * resynced on return, so a phone left in a pocket does not wake up showing a
 * stale time.
 */
export function useLiveClock(intervalMs: number = 1000): LiveClock {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = (): void => {
      if (timer !== null) {
        return;
      }
      timer = setInterval(() => setNow(new Date()), intervalMs);
    };

    const stop = (): void => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    const handleAppStateChange = (state: AppStateStatus): void => {
      if (state === 'active') {
        setNow(new Date());
        start();
      } else {
        stop();
      }
    };

    start();
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      stop();
      subscription.remove();
    };
  }, [intervalMs]);

  const refresh = useCallback((): void => {
    setNow(new Date());
  }, []);

  return { now, refresh };
}

/** Convenience wrapper for callers that only need the ticking value. */
export function useNow(intervalMs: number = 1000): Date {
  return useLiveClock(intervalMs).now;
}

export default useNow;
