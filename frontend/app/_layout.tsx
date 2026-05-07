import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../constants/colors';
import AvatarButton from '../components/AvatarButton';
import NotificationBell from '../components/NotificationBell';

function HeaderActions(): React.ReactElement {
  const router = useRouter();

  return (
    <View style={styles.headerActions}>
      <AvatarButton initials="NT" onPress={() => router.push('/profile')} />
      <NotificationBell hasUnread onPress={() => router.push('/notifications')} />
    </View>
  );
}

/**
 * Root Layout Component
 * Sets up the navigation structure for the entire app
 */
export default function RootLayout(): React.ReactElement {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: true,
          headerTitleStyle: {
            color: Colors.text,
            fontSize: 18,
            fontWeight: '700',
          },
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerLeft: () => <View />,
          headerRight: () => <HeaderActions />,
          contentStyle: {
            backgroundColor: Colors.background,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile/index" options={{ title: 'Profile' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      </Stack>
      <StatusBar style="dark" backgroundColor={Colors.background} />
    </>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },
});
