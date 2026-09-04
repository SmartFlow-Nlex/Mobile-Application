import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../theme';
import type { ThemePalette } from '../theme';
import { Typography } from '../constants/typography';

export interface AvatarButtonProps {
  uri?: string;
  initials: string;
  onPress: () => void;
}

const AvatarButton: React.FC<AvatarButtonProps> = ({ uri, initials, onPress }) => {
  const styles = useThemedStyles(makeStyles);
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

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
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
    // The ring needs its own radius: a square border inside the circular,
    // clipped parent renders as two side arcs instead of a ring.
    borderRadius: 18,
    backgroundColor: c.primaryDark,
    borderWidth: 2,
    borderColor: c.surface,
  },
  initials: {
    color: c.textInverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
});
