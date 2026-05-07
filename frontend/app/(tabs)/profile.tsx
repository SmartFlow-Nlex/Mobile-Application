import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

interface ProfileScreenProps {}

/**
 * Profile Screen
 * Displays user profile information
 */
const ProfileScreen: React.FC<ProfileScreenProps> = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Coming soon...</Text>
      </View>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
});
