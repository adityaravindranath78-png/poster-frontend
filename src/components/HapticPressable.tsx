import React, {useCallback} from 'react';
import {ViewStyle, StyleProp} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {springs, pressScale} from '../theme';

interface Props {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
  haptic?: 'light' | 'medium' | 'heavy' | 'selection' | 'none';
  disabled?: boolean;
  children: React.ReactNode;
}

export default function HapticPressable({
  onPress,
  style,
  scaleValue = pressScale.button,
  haptic = 'light',
  disabled = false,
  children,
}: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: opacity.value,
  }));

  const fireHaptic = useCallback(() => {
    if (haptic === 'none') return;
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
  }, [haptic]);

  const gesture = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      scale.value = withSpring(scaleValue, springs.snappy);
      opacity.value = withSpring(0.85, springs.snappy);
    })
    .onFinalize(() => {
      scale.value = withSpring(1, springs.snappy);
      opacity.value = withSpring(1, springs.snappy);
    })
    .onEnd(() => {
      fireHaptic();
      onPress();
    });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[style, animatedStyle, disabled && {opacity: 0.45}]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
