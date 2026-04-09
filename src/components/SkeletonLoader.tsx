import React, {useEffect} from 'react';
import {ViewStyle, StyleProp, StyleSheet} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import {colors, radii, timing} from '../theme';

interface Props {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export default function SkeletonLoader({
  width,
  height,
  borderRadius = radii.md,
  style,
}: Props) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, timing.shimmer),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.4, 0.7, 0.4]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.skeletonBase,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard({style}: {style?: StyleProp<ViewStyle>}) {
  return (
    <Animated.View style={[styles.card, style]}>
      <SkeletonLoader width="100%" height={0} style={styles.cardImage} />
    </Animated.View>
  );
}

export function SkeletonRow() {
  return (
    <Animated.View style={styles.row}>
      <SkeletonLoader width={48} height={48} borderRadius={radii.full} />
      <Animated.View style={styles.rowText}>
        <SkeletonLoader width="70%" height={14} />
        <SkeletonLoader width="45%" height={12} style={{marginTop: 8}} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.skeletonBase,
  },
  cardImage: {
    aspectRatio: 1,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowText: {
    flex: 1,
    marginLeft: 12,
    gap: 4,
  },
});
