import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { UserProfile } from '@smartflow/shared';
import { COMMUNITY_API_BASE_URL as API_BASE_URL } from '../config/api';

const AUTH_TOKEN_KEY = 'authToken';

const defaultUser: UserProfile = {
  id: '1',
  displayName: 'NLEX Traveler',
  username: 'nlextraveler',
  email: 'traveler@example.com',
};

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

  if (!token) {
    return {
      'Content-Type': 'application/json',
    };
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

/**
 * @param fallback Profile to show when the API is unreachable. Pass the signed-in
 *   account so the user sees their own name rather than a placeholder — the
 *   profile endpoint is not wired to the auth session yet. Memoise it.
 */
export const useUserProfile = (
  fallback?: UserProfile,
): {
  user: UserProfile;
  isLoading: boolean;
  error: string | null;
  setUser: Dispatch<SetStateAction<UserProfile>>;
  refreshUser: () => Promise<void>;
  patchUser: (updated: UserProfile) => Promise<UserProfile>;
} => {
  const initialUser = fallback ?? defaultUser;
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Read inside async callbacks without making them re-fire on every render.
  const fallbackRef = useRef<UserProfile>(initialUser);
  fallbackRef.current = initialUser;

  const refreshUser = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/current`, {
        headers: await getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Profile request failed with ${response.status}`);
      }

      const payload = (await response.json()) as { data?: UserProfile };

      if (payload.data) {
        setUser(payload.data);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load profile');
      setUser(fallbackRef.current);
    } finally {
      setIsLoading(false);
    }
  };

  const patchUser = async (updated: UserProfile): Promise<UserProfile> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${updated.id}`, {
        method: 'PATCH',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          displayName: updated.displayName,
          username: updated.username,
          email: updated.email,
          avatarUri: updated.avatarUri,
        }),
      });

      if (!response.ok) {
        throw new Error(`Profile update failed with ${response.status}`);
      }

      const payload = (await response.json()) as { data?: UserProfile };
      const nextUser = payload.data ?? updated;
      setUser(nextUser);
      return nextUser;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to update profile');
      setUser(updated);
      return updated;
    }
  };

  useEffect(() => {
    void refreshUser();
  }, []);

  return {
    user,
    isLoading,
    error,
    setUser,
    refreshUser,
    patchUser,
  };
};

export const authTokenKey = AUTH_TOKEN_KEY;
