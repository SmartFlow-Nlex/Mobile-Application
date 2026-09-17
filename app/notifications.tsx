import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '../frontend/theme';
import type { ThemePalette } from '../frontend/theme';
import { Typography } from '../frontend/constants/typography';

export default function NotificationsScreen(): React.ReactElement {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  /**
   * A deep link or a browser refresh lands here with no history behind it, and
   * a bare `router.back()` then fails with "GO_BACK was not handled by any
   * navigator" and traps the user on the screen. Fall back to the dashboard.
   */
  const goBack = (): void => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/dashboard');
    }
  };


  return (
    // Same missing top inset as the profile screen: without it the back
    // button sits under the status bar.
    <SafeAreaView edges={['top']} style={styles.container}>
      {/*
       * The native header is hidden here (and drawn in-JS instead) because
       * react-native-screens' native header portal does not reliably pass
       * React context - a themed component placed in `headerRight` crashed
       * with "useTheme must be used inside a ThemeProvider" even though the
       * provider is a genuine ancestor in the JS tree. Every other screen in
       * this app already follows this same pattern.
       */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={goBack}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>Notifications</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>Your latest traffic and account updates will show here.</Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      padding: 16,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
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
    topBarTitle: {
      color: c.text,
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.bold,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 22,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    title: {
      color: c.text,
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.bold,
      marginBottom: 8,
    },
    subtitle: {
      color: c.textSecondary,
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.normal,
    },
  });
