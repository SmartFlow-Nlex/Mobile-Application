import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, type StyleProp, type ImageStyle } from 'react-native';

/** The assistant's face, shared by the chat, the heading and the FAB. */
export const mascotSource = require('../assets/ai-mascot.png');

/**
 * react-native-web has no native animated module, so asking for the native
 * driver there logs a warning on every mount and falls back to JS anyway.
 * Ask for it only where it exists.
 */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export interface AssistantMascotProps {
  size: number;
  /** Bob and wobble while the assistant is working. */
  thinking?: boolean;
  style?: StyleProp<ImageStyle>;
}

/**
 * The mascot, which comes alive while the assistant is thinking.
 *
 * A spinner already sits in the reply bubble, but a spinner only says "busy".
 * The character leaning and bobbing says "it is working on your question",
 * which is the thing worth saying while a corridor lookup and a model round
 * trip run - several seconds during which the screen otherwise does nothing.
 *
 * One driving value looped 0 -> 1, with both ends mapped to the neutral pose
 * so the restart is seamless. Transforms only, so the native driver can take
 * it off the JS thread on a phone.
 */
const AssistantMascot: React.FC<AssistantMascotProps> = ({ size, thinking = false, style }) => {
  const beat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!thinking) {
      beat.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.timing(beat, {
        toValue: 1,
        duration: 1100,
        // Sine in/out, so it eases at the top and bottom of the bob instead
        // of snapping between them.
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    );
    loop.start();

    // Stop on unmount or the moment the reply lands: a loop left running
    // holds a timer alive and keeps re-rendering a screen nobody is watching.
    return () => {
      loop.stop();
      beat.setValue(0);
    };
  }, [thinking, beat]);

  const translateY = beat.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -size * 0.11, 0],
  });

  const rotate = beat.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0deg', '-6deg', '0deg', '6deg', '0deg'],
  });

  return (
    <Animated.Image
      source={mascotSource}
      resizeMode="contain"
      style={[{ width: size, height: size }, style, { transform: [{ translateY }, { rotate }] }]}
    />
  );
};

export default AssistantMascot;
