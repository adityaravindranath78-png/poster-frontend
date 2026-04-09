import React from 'react';
import {Text, ActivityIndicator, ViewStyle, StyleProp, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import HapticPressable from './HapticPressable';
import {colors, typography, radii, shadows, spacing} from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'large' | 'medium' | 'small';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  icon,
  style,
}: Props) {
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';

  const heightMap = {large: 56, medium: 48, small: 40};
  const textSizeMap = {large: typography.labelLarge, medium: typography.labelMedium, small: typography.labelSmall};

  const content = (
    <>
      {loading ? (
        <ActivityIndicator
          color={isPrimary ? colors.textOnPrimary : colors.primary}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              textSizeMap[size],
              {
                color: isPrimary
                  ? colors.textOnPrimary
                  : variant === 'danger'
                  ? colors.error
                  : isGhost
                  ? colors.primary
                  : colors.textPrimary,
              },
              icon ? {marginLeft: spacing.sm} : null,
            ]}>
            {title}
          </Text>
        </>
      )}
    </>
  );

  if (isPrimary) {
    return (
      <HapticPressable
        onPress={onPress}
        disabled={disabled || loading}
        haptic="medium"
        style={style}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[
            styles.base,
            {height: heightMap[size]},
            shadows.glow,
          ]}>
          {content}
        </LinearGradient>
      </HapticPressable>
    );
  }

  return (
    <HapticPressable
      onPress={onPress}
      disabled={disabled || loading}
      haptic="light"
      style={[
        styles.base,
        {height: heightMap[size]},
        variant === 'secondary' && styles.secondary,
        isGhost && styles.ghost,
        variant === 'danger' && styles.danger,
        style,
      ]}>
      {content}
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    paddingHorizontal: spacing['2xl'],
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: colors.primaryMuted,
  },
  danger: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
});
