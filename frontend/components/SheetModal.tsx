import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet } from 'react-native';
import { useThemedStyles } from '../theme';
import type { ThemePalette } from '../theme';

/**
 * react-native-web has no native animated module, so asking for the native
 * driver there logs a warning on every mount and falls back to JS anyway.
 */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const IN_MS = 240;
const OUT_MS = 170;
/** How far the sheet rises into place. */
const RISE = 44;

export interface SheetModalProps {
  visible: boolean;
  onClose: () => void;
  /** The sheet itself. Given its own rounded top corners by the caller. */
  children: React.ReactNode;
}

/**
 * A bottom sheet whose backdrop fades while the sheet rises.
 *
 * Every sheet in the app used `<Modal animationType="slide">`, which slides
 * the WHOLE modal - scrim included. So the backdrop did not fade in at all: a
 * hard-edged dark slab slid up the screen with the sheet welded to it, which
 * is the thing that looked cheap.
 *
 * React Native's `animationType` only offers one animation for the whole
 * modal, so separating the two means driving both by hand: `animationType`
 * is "none" and the scrim's opacity and the sheet's offset are animated
 * independently. The modal also has to stay mounted through the closing
 * animation, hence `mounted` trailing `visible`.
 */
const SheetModal: React.FC<SheetModalProps> = ({ visible, onClose, children }) => {
  const styles = useThemedStyles(makeStyles);
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: IN_MS,
        // Decelerating: quick off the mark, settles gently.
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: OUT_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start(({ finished }) => {
      // Only unmount once the sheet is actually off screen, or it would
      // vanish mid-animation.
      if (finished) {
        setMounted(false);
      }
    });
  }, [visible, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [RISE, 0],
  });

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.scrim, { opacity: progress }]}>
        {/* Fills the backdrop, so a tap anywhere outside the sheet closes it. */}
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.scrimPress}
        />
      </Animated.View>

      <Animated.View
        style={[styles.sheetWrap, { opacity: progress, transform: [{ translateY }] }]}
      >
        {children}
      </Animated.View>
    </Modal>
  );
};

export default SheetModal;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    scrim: {
      // RN 0.86 removed StyleSheet.absoluteFillObject; absoluteFill is the
      // registered-style equivalent and spreads the same way.
      ...StyleSheet.absoluteFill,
      backgroundColor: c.scrim,
    },
    scrimPress: {
      ...StyleSheet.absoluteFill,
    },
    // Sits over the scrim and pins the sheet to the bottom. Pointer-
    // transparent above the sheet so taps there still reach the scrim.
    sheetWrap: {
      ...StyleSheet.absoluteFill,
      justifyContent: 'flex-end',
      pointerEvents: 'box-none',
    },
  });
