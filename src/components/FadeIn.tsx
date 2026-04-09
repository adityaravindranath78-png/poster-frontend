import React, {useEffect} from 'react';
import {ViewStyle, StyleProp} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import {springs} from '../theme';

interface Props {
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  spring?: 'smooth' | 'bouncy' | 'gentle';
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export default function FadeIn({
  delay = 0,
  direction = 'up',
  distance = 16,
  spring = 'smooth',
  style,
  children,
}: Props) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(
    direction === 'left' ? -distance : direction === 'right' ? distance : 0,
  );
  const translateY = useSharedValue(
    direction === 'up' ? distance : direction === 'down' ? -distance : 0,
  );

  useEffect(() => {
    const config = springs[spring];
    opacity.value = withDelay(delay, withSpring(1, config));
    translateX.value = withDelay(delay, withSpring(0, config));
    translateY.value = withDelay(delay, withSpring(0, config));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      {translateX: translateX.value},
      {translateY: translateY.value},
    ],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
