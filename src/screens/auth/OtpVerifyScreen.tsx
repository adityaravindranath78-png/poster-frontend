import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Pressable,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import LinearGradient from 'react-native-linear-gradient';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AuthStackParamList} from '../../navigation/types';
import {verifyOtp, sendOtp} from '../../services/auth';
import FadeIn from '../../components/FadeIn';

// Palette — matches LoginScreen for visual continuity
const ink = '#1A1512';
const paper = '#FAF5EC';
const paperDeep = '#F2E9D7';
const saffron = '#E85D2F';
const saffronDeep = '#C4441C';
const hair = 'rgba(26, 21, 18, 0.10)';
const hairStrong = 'rgba(26, 21, 18, 0.18)';
const ashhalf = 'rgba(26, 21, 18, 0.58)';
const ashmute = 'rgba(26, 21, 18, 0.35)';

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
  const lineProgress = useSharedValue(0);

  useEffect(() => {
    lineProgress.value = withSpring(focused ? 1 : value ? 0.7 : 0, {
      damping: 18,
      stiffness: 180,
    });
  }, [focused, value, lineProgress]);

  useEffect(() => {
    if (value) {
      scale.value = withSequence(
        withSpring(1.14, {damping: 12, stiffness: 300}),
        withSpring(1, {damping: 14, stiffness: 260}),
      );
    }
  }, [value, scale]);

  const digitStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const lineStyle = useAnimatedStyle(() => ({
    backgroundColor:
      lineProgress.value > 0.9
        ? saffron
        : lineProgress.value > 0.3
        ? ink
        : hairStrong,
    height: 1.5 + lineProgress.value * 1.5,
    opacity: 0.45 + lineProgress.value * 0.55,
  }));

  return (
    <FadeIn delay={index * 45} distance={12}>
      <View style={styles.cell}>
        <Animated.Text style={[styles.cellText, digitStyle]}>
          {value || (focused ? '' : '•')}
        </Animated.Text>
        <Animated.View style={[styles.cellLine, lineStyle]} />
      </View>
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
  const [error, setError] = useState('');
  const inputs = useRef<(TextInput | null)[]>([]);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
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
  }, [shakeX]);

  function handleChange(text: string, index: number) {
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      setError('');
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputs.current[nextIndex]?.focus();
      if (newOtp.every(d => d.length === 1)) {
        handleVerify(newOtp.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (error) setError('');

    if (text) {
      ReactNativeHapticFeedback.trigger('selection', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }

    if (text && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    if (newOtp.every(d => d.length === 1)) {
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
    } catch (err: unknown) {
      triggerShake();
      setOtp(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
      const msg = err instanceof Error ? err.message : 'Invalid code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await sendOtp(phoneNumber);
      setCountdown(30);
      setError('');
      ReactNativeHapticFeedback.trigger('impactLight', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend';
      Alert.alert('Error', msg);
    } finally {
      setResending(false);
    }
  }

  const complete = otp.every(d => d.length === 1);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={paper} />
      <LinearGradient
        colors={[paper, paperDeep]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header — back + brand */}
        <FadeIn delay={0} distance={8}>
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              style={({pressed}) => [
                styles.backBtn,
                pressed && styles.backBtnPressed,
              ]}>
              <Text style={styles.backArrow}>←</Text>
            </Pressable>
            <View style={styles.brandRow}>
              <View style={styles.brandDot} />
              <Text style={styles.brand}>POSTER</Text>
            </View>
            <View style={styles.headerRight} />
          </View>
        </FadeIn>

        <View style={styles.body}>
          {/* Kicker */}
          <FadeIn delay={80} distance={10}>
            <View style={styles.kickerRow}>
              <View style={styles.kickerLine} />
              <Text style={styles.kicker}>Step 2 of 2</Text>
            </View>
          </FadeIn>

          {/* Title */}
          <FadeIn delay={160} distance={14}>
            <Text style={styles.title}>
              Enter the <Text style={styles.titleAccent}>6-digit code</Text>
            </Text>
          </FadeIn>

          {/* Subtitle with phone + change */}
          <FadeIn delay={220} distance={10}>
            <Text style={styles.subtitle}>
              Sent to{' '}
              <Text style={styles.phoneHighlight}>+91 {phoneNumber}</Text>
              {'   '}
              <Text
                onPress={() => navigation.goBack()}
                style={styles.changeLink}>
                Change
              </Text>
            </Text>
          </FadeIn>

          {/* OTP cells */}
          <Animated.View style={[styles.otpRow, shakeStyle]}>
            {otp.map((digit, index) => (
              <View key={index} style={styles.cellWrapper}>
                <OtpCell
                  value={digit}
                  focused={focusedIndex === index}
                  index={index}
                />
                <TextInput
                  ref={ref => {
                    inputs.current[index] = ref;
                  }}
                  style={styles.hiddenInput}
                  keyboardType="number-pad"
                  maxLength={index === 0 ? OTP_LENGTH : 1}
                  value=""
                  onChangeText={text => handleChange(text, index)}
                  onKeyPress={({nativeEvent}) =>
                    handleKeyPress(nativeEvent.key, index)
                  }
                  onFocus={() => setFocusedIndex(index)}
                  autoFocus={index === 0}
                  caretHidden
                  selectionColor={saffron}
                />
              </View>
            ))}
          </Animated.View>

          {/* Error */}
          {!!error && (
            <FadeIn delay={0} distance={6}>
              <Text style={styles.errorText}>{error}</Text>
            </FadeIn>
          )}

          {/* Verify CTA */}
          <FadeIn delay={320} distance={12}>
            <Pressable
              onPress={() => handleVerify()}
              disabled={!complete || loading}
              style={({pressed}) => [
                styles.cta,
                !complete && styles.ctaDisabled,
                pressed && complete && styles.ctaPressed,
              ]}>
              <Text
                style={[styles.ctaText, !complete && styles.ctaTextDisabled]}>
                {loading ? 'Verifying…' : 'Verify & continue'}
              </Text>
            </Pressable>
          </FadeIn>

          {/* Resend */}
          <FadeIn delay={400}>
            <View style={styles.resendRow}>
              {countdown > 0 ? (
                <Text style={styles.resendText}>
                  Didn't get it?{' '}
                  <Text style={styles.countdownNumber}>Resend in {countdown}s</Text>
                </Text>
              ) : (
                <Pressable
                  onPress={handleResend}
                  disabled={resending}
                  hitSlop={8}>
                  <Text style={styles.resendActive}>
                    {resending ? 'Sending…' : 'Resend code'}
                  </Text>
                </Pressable>
              )}
            </View>
          </FadeIn>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: paper,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backBtnPressed: {
    opacity: 0.55,
  },
  backArrow: {
    fontSize: 24,
    color: ink,
    marginTop: -2,
    fontWeight: '500',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: saffron,
    marginRight: 10,
  },
  brand: {
    fontSize: 12,
    fontWeight: '800',
    color: ink,
    letterSpacing: 2.4,
  },
  headerRight: {
    width: 38,
  },

  // Body
  body: {
    flex: 1,
  },

  // Kicker
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  kickerLine: {
    width: 22,
    height: 1,
    backgroundColor: saffron,
    marginRight: 10,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: saffron,
    textTransform: 'uppercase',
  },

  // Title
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: ink,
    lineHeight: 36,
    letterSpacing: -0.8,
  },
  titleAccent: {
    color: saffron,
  },

  // Subtitle
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: ashhalf,
    marginTop: 10,
    marginBottom: 40,
    lineHeight: 20,
  },
  phoneHighlight: {
    color: ink,
    fontWeight: '700',
  },
  changeLink: {
    color: saffron,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // OTP row
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cellWrapper: {
    position: 'relative',
    flex: 1,
    maxWidth: 52,
  },
  cell: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 28,
    fontWeight: '800',
    color: ink,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  cellLine: {
    position: 'absolute',
    bottom: 0,
    left: 4,
    right: 4,
    backgroundColor: hairStrong,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    fontSize: 1,
  },

  // Error
  errorText: {
    fontSize: 13,
    color: '#B4271D',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 10,
  },

  // CTA
  cta: {
    backgroundColor: saffron,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    shadowColor: saffronDeep,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaDisabled: {
    backgroundColor: 'rgba(26, 21, 18, 0.20)',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaPressed: {
    backgroundColor: saffronDeep,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  ctaTextDisabled: {
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Resend
  resendRow: {
    alignItems: 'center',
    marginTop: 18,
  },
  resendText: {
    fontSize: 13,
    color: ashmute,
    fontWeight: '500',
  },
  countdownNumber: {
    color: ink,
    fontWeight: '700',
  },
  resendActive: {
    fontSize: 14,
    fontWeight: '700',
    color: saffron,
    letterSpacing: 0.2,
    paddingVertical: 4,
  },
});
