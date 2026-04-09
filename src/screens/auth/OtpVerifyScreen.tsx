import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AuthStackParamList} from '../../navigation/types';
import {verifyOtp, sendOtp} from '../../services/auth';
import {colors, typography, spacing, radii, shadows, springs, timing, layout} from '../../theme';
import Button from '../../components/Button';
import HapticPressable from '../../components/HapticPressable';
import FadeIn from '../../components/FadeIn';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerify'>;

const OTP_LENGTH = 6;

function OtpCell({
  value,
  focused,
  index,
}: {
  value: string;
  focused: boolean;
  index: number;
}) {
  const scale = useSharedValue(1);
  const borderProgress = useSharedValue(0);

  useEffect(() => {
    borderProgress.value = withSpring(focused ? 1 : value ? 0.5 : 0, springs.quick);
  }, [focused, value]);

  useEffect(() => {
    if (value) {
      scale.value = withSequence(
        withSpring(1.1, springs.snappy),
        withSpring(1, springs.snappy),
      );
    }
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    borderColor:
      focused
        ? colors.primary
        : value
        ? colors.primaryLight
        : colors.border,
    backgroundColor: value ? colors.primaryMuted : colors.background,
  }));

  return (
    <FadeIn delay={index * 50} direction="up" distance={10}>
      <Animated.View style={[styles.cell, animatedStyle]}>
        <Text style={[typography.h1, styles.cellText]}>
          {value}
        </Text>
        {focused && !value && (
          <Animated.View style={styles.cursor} />
        )}
      </Animated.View>
    </FadeIn>
  );
}

export default function OtpVerifyScreen({route, navigation}: Props) {
  const {phoneNumber} = route.params;
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputs = useRef<(TextInput | null)[]>([]);
  const shakeX = useSharedValue(0);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{translateX: shakeX.value}],
  }));

  const triggerShake = useCallback(() => {
    ReactNativeHapticFeedback.trigger('notificationError', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    shakeX.value = withSequence(
      withTiming(-12, {duration: 50}),
      withTiming(12, {duration: 50}),
      withTiming(-8, {duration: 50}),
      withTiming(8, {duration: 50}),
      withTiming(0, {duration: 50}),
    );
  }, []);

  function handleChange(text: string, index: number) {
    // Handle paste (full OTP pasted into one field)
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputs.current[nextIndex]?.focus();
      if (newOtp.every((d) => d.length === 1)) {
        handleVerify(newOtp.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text) {
      ReactNativeHapticFeedback.trigger('selection', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }

    if (text && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d.length === 1)) {
      handleVerify(newOtp.join(''));
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(code?: string) {
    const otpCode = code || otp.join('');
    if (otpCode.length !== OTP_LENGTH) return;

    setLoading(true);
    try {
      await verifyOtp(otpCode);
      ReactNativeHapticFeedback.trigger('notificationSuccess', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    } catch (err: any) {
      triggerShake();
      setOtp(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
      Alert.alert('Verification Failed', err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await sendOtp(phoneNumber);
      setCountdown(30);
      ReactNativeHapticFeedback.trigger('impactLight', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to resend');
    } finally {
      setResending(false);
    }
  }

  return (
    <View style={styles.container}>
      <FadeIn delay={0} direction="down">
        <HapticPressable
          onPress={() => navigation.goBack()}
          haptic="light"
          style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </HapticPressable>
      </FadeIn>

      <View style={styles.content}>
        <FadeIn delay={80}>
          <Text style={[typography.h1, styles.title]}>
            Enter verification code
          </Text>
        </FadeIn>

        <FadeIn delay={160}>
          <Text style={[typography.bodyMedium, styles.subtitle]}>
            We sent a 6-digit code to{' '}
            <Text style={styles.phoneHighlight}>+91 {phoneNumber}</Text>
          </Text>
        </FadeIn>

        {/* OTP Cells */}
        <Animated.View style={[styles.otpRow, shakeStyle]}>
          {otp.map((digit, index) => (
            <View key={index} style={styles.cellWrapper}>
              <OtpCell
                value={digit}
                focused={focusedIndex === index}
                index={index}
              />
              <TextInput
                ref={(ref) => {
                  inputs.current[index] = ref;
                }}
                style={styles.hiddenInput}
                keyboardType="number-pad"
                maxLength={index === 0 ? OTP_LENGTH : 1}
                value=""
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={({nativeEvent}) =>
                  handleKeyPress(nativeEvent.key, index)
                }
                onFocus={() => setFocusedIndex(index)}
                autoFocus={index === 0}
                caretHidden
              />
            </View>
          ))}
        </Animated.View>

        {/* Verify Button */}
        <FadeIn delay={400} style={styles.verifyWrap}>
          <Button
            title="Verify"
            onPress={() => handleVerify()}
            loading={loading}
            disabled={otp.some((d) => !d)}
          />
        </FadeIn>

        {/* Resend */}
        <FadeIn delay={480}>
          {countdown > 0 ? (
            <Text style={[typography.bodySmall, styles.countdownText]}>
              Resend code in{' '}
              <Text style={styles.countdownNumber}>{countdown}s</Text>
            </Text>
          ) : (
            <HapticPressable
              onPress={handleResend}
              haptic="light"
              disabled={resending}
              style={styles.resendButton}>
              <Text style={[typography.labelMedium, styles.resendText]}>
                {resending ? 'Sending...' : 'Resend Code'}
              </Text>
            </HapticPressable>
          )}
        </FadeIn>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: layout.screenPaddingH,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing['5xl'],
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  backArrow: {
    fontSize: 22,
    color: colors.textPrimary,
    marginTop: -2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    marginTop: -spacing['6xl'],
  },
  title: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing['4xl'],
  },
  phoneHighlight: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: spacing['4xl'],
  },
  cellWrapper: {
    position: 'relative',
  },
  cell: {
    width: 50,
    height: 60,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  cellText: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  cursor: {
    width: 2,
    height: 24,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    fontSize: 1,
  },
  verifyWrap: {
    marginBottom: spacing.xl,
  },
  countdownText: {
    textAlign: 'center',
    color: colors.textTertiary,
  },
  countdownNumber: {
    color: colors.primary,
    fontWeight: '700',
  },
  resendButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  resendText: {
    color: colors.primary,
  },
});
