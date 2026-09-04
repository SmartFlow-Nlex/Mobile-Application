import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../theme';
import type { ThemePalette } from '../theme';

export interface NotificationBellProps {
  hasUnread: boolean;
  onPress: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ hasUnread, onPress }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open notifications"
      onPress={onPress}
      style={styles.button}
    >
      <Ionicons name="notifications-outline" size={21} color={colors.text} />
      {hasUnread ? <View style={styles.badge} /> : null}
    </Pressable>
  );
};

export default NotificationBell;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surface,
    marginRight: 8,
    shadowColor: c.cardShadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: c.danger,
    borderWidth: 1,
    borderColor: c.surface,
  },
});
