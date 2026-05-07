import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';

export interface AIAssistantFABProps {
  onPress: () => void;
}

const AIAssistantFAB: React.FC<AIAssistantFABProps> = ({ onPress }) => {
  return (
    <Pressable onPress={onPress} style={styles.fab}>
      <Ionicons name="hardware-chip-outline" size={24} color={Colors.textInverse} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>AI</Text>
      </View>
    </Pressable>
  );
};

export default AIAssistantFAB;

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.communityBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
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
    backgroundColor: Colors.dangerRed,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  badgeText: {
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: '800',
  },
});
