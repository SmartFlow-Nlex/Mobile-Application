import React from 'react';
import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from './constants/colors';
import { Typography } from './constants/typography';

export default function NotificationsScreen(): React.ReactElement {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Notifications' }} />
      <View style={styles.card}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>Your latest traffic and account updates will show here.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    color: Colors.text,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal,
  },
});
