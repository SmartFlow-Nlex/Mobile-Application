import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { UserProfile } from '@smartflow/shared';

const API_BASE_URL = 'http://localhost:3000';
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

export const useUserProfile = (): {
  user: UserProfile;
  isLoading: boolean;
  error: string | null;
  setUser: Dispatch<SetStateAction<UserProfile>>;
  refreshUser: () => Promise<void>;
  patchUser: (updated: UserProfile) => Promise<UserProfile>;
} => {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      setUser(defaultUser);
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
