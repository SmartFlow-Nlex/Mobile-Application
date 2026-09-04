import React, { useMemo, useState } from 'react';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SettingsState, UserProfile } from '../../shared/types/index';
import EditProfileModal from '../../frontend/components/EditProfileModal';
import SectionHeader from '../../frontend/components/SectionHeader';
import SettingsRow from '../../frontend/components/SettingsRow';
import ThemeModePicker, { themeModeLabel } from '../../frontend/components/ThemeModePicker';
import { useTheme, useThemedStyles } from '../../frontend/theme';
import type { ThemePalette } from '../../frontend/theme';
import { Typography } from '../constants/typography';
import { useUserProfile } from '../../frontend/hooks/useUserProfile';
import { useAuth } from '../../frontend/auth';

export default function ProfileScreen(): React.ReactElement {
  const { colors, mode: themeMode } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { session, signOut } = useAuth();

  // The profile endpoint has no notion of the signed-in account yet, so the
  // session is what the screen falls back to instead of a stock placeholder.
  const sessionUser = useMemo<UserProfile | undefined>(
    () =>
      session === null
        ? undefined
        : {
            id: 'local-account',
            displayName: session.fullName,
            username: session.email.split('@')[0] ?? 'nlextraveler',
            email: session.email,
          },
    [session],
  );

  const { user, isLoading, error, patchUser } = useUserProfile(sessionUser);
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [isThemePickerVisible, setIsThemePickerVisible] = useState<boolean>(false);
  const [settings, setSettings] = useState<SettingsState>({
    notificationsEnabled: true,
    darkModeEnabled: false,
    language: 'English',
  });

  const initials = useMemo(
    () =>
      user.displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'NT',
    [user.displayName]
  );

  const handleSaveProfile = async (updated: UserProfile): Promise<void> => {
    await patchUser(updated);
    setIsEditModalVisible(false);
  };

  const handleOpenLink = async (url: string): Promise<void> => {
    await Linking.openURL(url);
  };

  const handleLogout = (): void => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/sign-in');
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.userCard}>
          {user.avatarUri ? (
            <Image source={{ uri: user.avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}

          <View style={styles.userTextGroup}>
            <Text style={styles.userName}>{user.displayName}</Text>
            <Text style={styles.userSubtitle}>{user.email || `@${user.username}`}</Text>
            {isLoading ? <Text style={styles.helperText}>Loading profile...</Text> : null}
            {error ? <Text style={styles.helperText}>{error}</Text> : null}
          </View>
        </View>

        <SectionHeader title="Personal" />
        <View style={styles.sectionCard}>
          <SettingsRow
            icon="create-outline"
            label="Edit Profile"
            onPress={() => setIsEditModalVisible(true)}
          />
        </View>

        <SectionHeader title="General" />
        <View style={styles.sectionCard}>
          <SettingsRow
            icon="notifications-outline"
            label="Notifications"
            toggle
            toggleValue={settings.notificationsEnabled}
            onToggle={(notificationsEnabled) =>
              setSettings((current) => ({ ...current, notificationsEnabled }))
            }
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="moon-outline"
            label="Dark Mode"
            value={themeModeLabel[themeMode]}
            onPress={() => setIsThemePickerVisible(true)}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => void handleOpenLink('https://example.com/privacy')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => void handleOpenLink('https://example.com/terms')}
          />
        </View>

        <SectionHeader title="Help" />
        <View style={styles.sectionCard}>
          <SettingsRow
            icon="help-circle-outline"
            label="FAQ"
            onPress={() => void handleOpenLink('https://example.com/faq')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="information-circle-outline"
            label="App Version"
            value="v1.0.0"
          />
        </View>

        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>

      <EditProfileModal
        onClose={() => setIsEditModalVisible(false)}
        onSave={(updated) => void handleSaveProfile(updated)}
        user={user}
        visible={isEditModalVisible}
      />

      <ThemeModePicker
        visible={isThemePickerVisible}
        onClose={() => setIsThemePickerVisible(false)}
      />
    </View>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },
  topBar: {
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    backgroundColor: c.primary,
    marginBottom: 22,
    shadowColor: c.primaryShadow,
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarInitials: {
    color: c.textInverse,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  userTextGroup: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    color: c.textInverse,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 4,
  },
  userSubtitle: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  helperText: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: c.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden',
    marginBottom: 22,
    shadowColor: c.cardShadow,
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  divider: {
    height: 1,
    backgroundColor: c.hairline,
    marginLeft: 62,
  },
  logoutButton: {
    marginTop: 4,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  logoutText: {
    color: c.danger,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
});
