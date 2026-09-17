import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, type DimensionValue } from 'react-native';
import { useThemedStyles } from '../theme';
import type { ThemePalette } from '../theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
}

/**
 * react-native-web has no native animated module, so asking for the native
 * driver there logs a warning on every mount and falls back to JS anyway.
 * Ask for it only where it exists.
 */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * A pulsing placeholder block.
 *
 * Replaces the "Loading community feed..." line the feed used to show. A line
 * of text gives no sense of what is coming or how much; a block the shape of
 * the card that will replace it means the layout does not jump when the data
 * lands, which is the actual complaint behind "make it easy to view".
 *
 * Opacity only - no translating highlight sweep. A sweep needs a gradient
 * dependency this project does not carry, and it animates badly under
 * react-native-web at the width of a phone screen.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 14, radius = 7 }) => {
  const styles = useThemedStyles(makeStyles);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );
    animation.start();
    // Stop on unmount: a loop left running holds a JS timer alive and keeps
    // re-rendering a screen nobody is looking at.
    return () => animation.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] });

  return (
    <Animated.View
      style={[styles.block, { width, height, borderRadius: radius, opacity }]}
    />
  );
};

/**
 * The community feed's loading shape - an avatar, two lines of name/meta, a
 * paragraph and an action row, at the same rhythm as CommunityPostCard.
 */
export const SkeletonPostCard: React.FC = () => {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.card} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.cardTop}>
        <Skeleton width={40} height={40} radius={20} />
        <View style={styles.cardTopText}>
          <Skeleton width="55%" height={13} />
          <Skeleton width="34%" height={11} />
        </View>
        <Skeleton width={62} height={22} radius={11} />
      </View>

      <View style={styles.cardBody}>
        <Skeleton height={12} />
        <Skeleton height={12} />
        <Skeleton width="72%" height={12} />
      </View>

      <View style={styles.cardFooter}>
        <Skeleton width={70} height={26} radius={13} />
        <Skeleton width={70} height={26} radius={13} />
      </View>
    </View>
  );
};

export default Skeleton;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    block: {
      backgroundColor: c.surfaceMuted,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      marginBottom: 12,
      gap: 14,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    cardTopText: {
      flex: 1,
      gap: 7,
    },
    cardBody: {
      gap: 9,
    },
    cardFooter: {
      flexDirection: 'row',
      gap: 10,
    },
  });
