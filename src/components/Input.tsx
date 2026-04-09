import React, {useState, useRef} from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import {colors, typography, spacing, radii, springs} from '../theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  prefix?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export default function Input({
  label,
  error,
  prefix,
  containerStyle,
  ...inputProps
}: Props) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const focusProgress = useSharedValue(0);

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [error ? colors.error : colors.border, colors.primary],
    ),
    borderWidth: 1.5,
  }));

  function handleFocus() {
    setFocused(true);
    focusProgress.value = withSpring(1, springs.quick);
  }

  function handleBlur() {
    setFocused(false);
    focusProgress.value = withSpring(0, springs.quick);
  }

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={[typography.labelSmall, styles.label]}>
          {label}
        </Text>
      )}
      <AnimatedView style={[styles.container, animatedBorder]}>
        {prefix && <View style={styles.prefix}>{prefix}</View>}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            typography.bodyLarge,
            prefix ? {paddingLeft: 0} : null,
          ]}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.primary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...inputProps}
        />
      </AnimatedView>
      {error && (
        <Text style={[typography.caption, styles.error]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderColor: colors.border,
    borderWidth: 1.5,
  },
  prefix: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    color: colors.textPrimary,
  },
  error: {
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
