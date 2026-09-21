import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemedStyles } from '../theme';
import type { ThemePalette } from '../theme';

/**
 * A panel that slides up over whatever is behind it.
 *
 * Built for the corridor screen, where the map is the page and the readings sit
 * on top of it: the user has to be able to push the readings out of the way to
 * see the road, then pull them back. Two ways to do that, because people reach
 * for different ones - drag the handle, or tap it.
 *
 * The drag lives on the handle rather than the whole sheet. Putting it on the
 * sheet means every gesture is ambiguous - is this a scroll or a drag? - and
 * resolving that needs the two gestures to negotiate, which goes wrong in ways
 * that feel broken rather than merely awkward. With the handle owning the drag,
 * the list inside scrolls exactly as a list should, and nothing has to guess.
 */

export interface BottomSheetProps {
  /** Always-visible height when pushed all the way down. */
  peekHeight: number;
  /** Fraction of the screen the sheet covers when fully open. */
  maxFraction?: number;
  /** Fraction it rests at on open. */
  restFraction?: number;
  /** Drawn inside the handle, above the fold - visible at every height. */
  header: React.ReactNode;
  children: React.ReactNode;
}

const SPRING = { damping: 32, stiffness: 260, mass: 0.9, useNativeDriver: true };

/** Below this, a drag is a tap; above it, a flick decides direction on its own. */
const TAP_SLOP = 6;
const FLICK_VELOCITY = 0.5;

const BottomSheet: React.FC<BottomSheetProps> = ({
  peekHeight,
  maxFraction = 0.82,
  restFraction = 0.46,
  header,
  children,
}) => {
  const styles = useThemedStyles(makeStyles);
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const sheetHeight = Math.round(screenHeight * maxFraction);

  /*
   * Offsets from fully open, largest first: open, resting, peeking. A snap is
   * always one of these, so the sheet can never come to rest somewhere that
   * cuts a card in half.
   */
  const stops = useMemo(() => {
    const open = 0;
    const rest = Math.max(0, sheetHeight - Math.round(screenHeight * restFraction));
    const peek = Math.max(0, sheetHeight - peekHeight - insets.bottom);
    return [open, rest, peek].filter((value, index, all) => all.indexOf(value) === index);
  }, [sheetHeight, screenHeight, restFraction, peekHeight, insets.bottom]);

  const [stopIndex, setStopIndex] = useState(() => Math.min(1, stops.length - 1));
  const translateY = useRef(new Animated.Value(stops[Math.min(1, stops.length - 1)])).current;
  const startY = useRef(stops[Math.min(1, stops.length - 1)]);

  const snapTo = (index: number): void => {
    const clamped = Math.max(0, Math.min(stops.length - 1, index));
    setStopIndex(clamped);
    startY.current = stops[clamped];
    Animated.spring(translateY, { toValue: stops[clamped], ...SPRING }).start();
  };

  const nearestStop = (value: number, velocity: number): number => {
    // A deliberate flick beats proximity: it says where the user is going, not
    // where they happen to have let go.
    if (velocity > FLICK_VELOCITY) {
      return Math.min(stopIndex + 1, stops.length - 1);
    }
    if (velocity < -FLICK_VELOCITY) {
      return Math.max(stopIndex - 1, 0);
    }
    let best = 0;
    for (let i = 1; i < stops.length; i += 1) {
      if (Math.abs(stops[i] - value) < Math.abs(stops[best] - value)) {
        best = i;
      }
    }
    return best;
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 2,
      onPanResponderGrant: () => {
        translateY.stopAnimation((value: number) => {
          startY.current = value;
        });
      },
      onPanResponderMove: (_event, gesture) => {
        const next = startY.current + gesture.dy;
        const lowest = stops[stops.length - 1];
        // A little give at each end, so the sheet feels attached rather than
        // hitting a wall, but it never travels somewhere it cannot rest.
        translateY.setValue(Math.max(-24, Math.min(lowest + 24, next)));
      },
      onPanResponderRelease: (_event, gesture) => {
        if (Math.abs(gesture.dy) < TAP_SLOP) {
          // Treated as a tap on the handle: step towards whichever end is
          // further away, so one tap always visibly does something.
          snapToRef.current(stopIndexRef.current === 0 ? stopsRef.current.length - 1 : 0);
          return;
        }
        snapToRef.current(nearestStopRef.current(startY.current + gesture.dy, gesture.vy));
      },
      onPanResponderTerminate: () => snapToRef.current(stopIndexRef.current),
    }),
  ).current;

  /*
   * The PanResponder is created once, so its handlers would otherwise close
   * over the first render's values and keep snapping to stale stops - visible
   * as a sheet that ignores the screen having been rotated. Refs keep the
   * handlers pointed at the current ones without rebuilding the responder,
   * which would drop an in-flight gesture.
   */
  const snapToRef = useRef(snapTo);
  const nearestStopRef = useRef(nearestStop);
  const stopIndexRef = useRef(stopIndex);
  const stopsRef = useRef(stops);
  snapToRef.current = snapTo;
  nearestStopRef.current = nearestStop;
  stopIndexRef.current = stopIndex;
  stopsRef.current = stops;

  return (
    <Animated.View
      style={[styles.sheet, { height: sheetHeight, transform: [{ translateY }] }]}
    >
      <View {...pan.panHandlers} style={styles.handleArea}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={stopIndex === 0 ? 'Collapse the details' : 'Expand the details'}
          onPress={() => snapTo(stopIndex === 0 ? stops.length - 1 : 0)}
          style={styles.grabTarget}
        >
          <View style={styles.grabBar} />
        </Pressable>
        {header}
      </View>

      <View style={[styles.body, { paddingBottom: insets.bottom }]}>{children}</View>
    </Animated.View>
  );
};

export default BottomSheet;

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: c.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: -4 },
      elevation: 16,
      overflow: 'hidden',
    },
    handleArea: {
      paddingBottom: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.hairline,
    },
    /* Generous vertical padding: this is the grab target, and a 4pt bar is far
       too small to hit on a moving bus. */
    grabTarget: {
      alignItems: 'center',
      paddingTop: 10,
      paddingBottom: 8,
    },
    grabBar: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
    },
    body: {
      flex: 1,
      // Android clips shadows to the view bounds; without this the list can
      // paint over the rounded corners on the first frame.
      overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    },
  });
