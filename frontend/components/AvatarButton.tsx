import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

export interface AvatarButtonProps {
  uri?: string;
  initials: string;
  onPress: () => void;
}

const AvatarButton: React.FC<AvatarButtonProps> = ({ uri, initials, onPress }) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open profile"
      onPress={onPress}
      style={styles.button}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.image} />
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
      )}
    </Pressable>
  );
};

export default AvatarButton;

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginLeft: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  initials: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
});
