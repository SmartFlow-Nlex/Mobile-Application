import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '../../theme';
import type { ThemePalette } from '../../theme';

export interface AIAssistantFABProps {
  onPress: () => void;
}

const AIAssistantFAB: React.FC<AIAssistantFABProps> = ({ onPress }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable onPress={onPress} style={styles.fab}>
      <Ionicons name="chatbubble-ellipses" size={22} color={colors.textInverse} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>AI</Text>
      </View>
    </Pressable>
  );
};

export default AIAssistantFAB;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: c.cardShadow,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: c.dangerRed,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: c.surface,
  },
  badgeText: {
    color: c.textInverse,
    fontSize: 10,
    fontWeight: '800',
  },
});
