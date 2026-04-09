import React, {useState} from 'react';
import {View, Image, Text, StyleSheet, ViewStyle, StyleProp} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import HapticPressable from './HapticPressable';
import SkeletonLoader from './SkeletonLoader';
import {TemplateMeta} from '../types/template';
import {colors, typography, radii, shadows, spacing, timing, pressScale} from '../theme';

interface Props {
  template: TemplateMeta;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  index?: number;
}

export default function TemplateCard({template, onPress, style, index = 0}: Props) {
  const [loaded, setLoaded] = useState(false);
  const imageOpacity = useSharedValue(0);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  function handleLoad() {
    setLoaded(true);
    imageOpacity.value = withTiming(1, timing.normal);
  }

  return (
    <HapticPressable
      onPress={onPress}
      scaleValue={pressScale.card}
      haptic="light"
      style={[styles.container, shadows.md, style]}>
      {/* Skeleton underneath */}
      {!loaded && (
        <SkeletonLoader
          width="100%"
          height={0}
          borderRadius={0}
          style={styles.skeleton}
        />
      )}

      {/* Image fades in on load */}
      <Animated.Image
        source={{uri: template.thumbnail_url}}
        style={[styles.thumbnail, fadeStyle]}
        resizeMode="cover"
        onLoad={handleLoad}
      />

      {/* Premium badge */}
      {template.premium && (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumText}>PRO</Text>
        </View>
      )}
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.skeletonBase,
  },
  skeleton: {
    ...StyleSheet.absoluteFillObject,
    aspectRatio: 1,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  premiumBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    ...shadows.sm,
  },
  premiumText: {
    ...typography.labelSmall,
    fontSize: 9,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
});
