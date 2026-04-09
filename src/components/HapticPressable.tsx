import React, {useCallback} from 'react';
import {Pressable, ViewStyle, StyleProp} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {pressScale} from '../theme';

interface Props {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
  haptic?: 'light' | 'medium' | 'heavy' | 'selection' | 'none';
  disabled?: boolean;
  children: React.ReactNode;
}

const SPRING_CONFIG = {damping: 15, stiffness: 400, mass: 0.8};

export default function HapticPressable({
  onPress,
  style,
  scaleValue = pressScale.button,
  haptic = 'light',
  disabled = false,
  children,
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(scaleValue, SPRING_CONFIG);
  }, [scaleValue]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, []);

  const handlePress = useCallback(() => {
    if (haptic !== 'none') {
      const typeMap = {
        light: 'impactLight',
        medium: 'impactMedium',
        heavy: 'impactHeavy',
        selection: 'selection',
      } as const;
      ReactNativeHapticFeedback.trigger(typeMap[haptic], {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }
    onPress();
  }, [haptic, onPress]);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}>
      <Animated.View style={[style, animatedStyle, disabled && {opacity: 0.45}]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
