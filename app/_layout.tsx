import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { Colors } from './constants/colors';
import AvatarButton from '../frontend/components/AvatarButton';
import NotificationBell from '../frontend/components/NotificationBell';

function HeaderAvatar(): React.ReactElement {
  const router = useRouter();

  return <AvatarButton initials="NT" onPress={() => router.push('/profile')} />;
}

function HeaderNotifications(): React.ReactElement {
  const router = useRouter();

  return <NotificationBell hasUnread onPress={() => router.push('/notifications')} />;
}

function HeaderActions(): React.ReactElement {
  const router = useRouter();

  return (
    <View style={styles.headerActions}>
      <AvatarButton initials="NT" onPress={() => router.push('/profile')} />
      <NotificationBell hasUnread onPress={() => router.push('/notifications')} />
    </View>
  );
}

export default function RootLayout(): React.ReactElement {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: true,
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTitleStyle: {
            color: Colors.text,
            fontSize: 18,
            fontWeight: '700',
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
