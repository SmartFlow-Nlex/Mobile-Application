import React, { useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
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
import { SettingsState, UserProfile } from '@smartflow/shared';
import EditProfileModal from '../../components/EditProfileModal';
import SectionHeader from '../../components/SectionHeader';
import SettingsRow from '../../components/SettingsRow';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { authTokenKey, useUserProfile } from '../../hooks/useUserProfile';

export default function ProfileScreen(): React.ReactElement {
  const router = useRouter();
  const { user, isLoading, error, patchUser } = useUserProfile();
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
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
          await SecureStore.deleteItemAsync(authTokenKey);
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
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
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>

      <EditProfileModal
        onClose={() => setIsEditModalVisible(false)}
        onSave={(updated) => void handleSaveProfile(updated)}
        user={user}
        visible={isEditModalVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    marginBottom: 22,
    shadowColor: Colors.primaryShadow,
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
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  userTextGroup: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    color: Colors.textInverse,
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
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 22,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF2F7',
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
    color: Colors.danger,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
});
