import React, {useEffect} from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {colors, typography, spacing, radii, springs, timing} from '../theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  snapPoints?: number[];
  children: React.ReactNode;
}

export default function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: Props) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayOpacity = useSharedValue(0);
  const {height: windowHeight} = useWindowDimensions();

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, springs.smooth);
      overlayOpacity.value = withTiming(1, timing.normal);
    } else {
      translateY.value = withSpring(windowHeight, springs.smooth);
      overlayOpacity.value = withTiming(0, timing.fast);
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 500) {
        translateY.value = withSpring(windowHeight, springs.smooth);
        overlayOpacity.value = withTiming(0, timing.fast);
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, springs.smooth);
      }
    });

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} statusBarTranslucent>
      <View style={styles.wrapper}>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sheet, sheetStyle]}>
            <View style={styles.handle} />
            {title && (
              <Text style={[typography.h2, styles.title]}>{title}</Text>
            )}
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceOverlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii['2xl'],
    borderTopRightRadius: radii['2xl'],
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['5xl'],
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.lg,
  },
});
