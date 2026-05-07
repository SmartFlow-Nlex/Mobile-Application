import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export interface NotificationBellProps {
  hasUnread: boolean;
  onPress: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ hasUnread, onPress }) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open notifications"
      onPress={onPress}
      style={styles.button}
    >
      <Ionicons name="notifications-outline" size={21} color={Colors.text} />
      {hasUnread ? <View style={styles.badge} /> : null}
    </Pressable>
  );
};

export default NotificationBell;

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    marginRight: 8,
    shadowColor: '#0F172A',
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
    backgroundColor: Colors.danger,
    borderWidth: 1,
    borderColor: Colors.surface,
  },
});
