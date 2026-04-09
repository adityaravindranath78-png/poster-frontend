import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import {AuthStackParamList} from '../../navigation/types';
import {sendOtp, signInWithGoogle} from '../../services/auth';
import {colors, typography, spacing, radii, shadows, layout} from '../../theme';
import Button from '../../components/Button';
import Input from '../../components/Input';
import FadeIn from '../../components/FadeIn';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({navigation}: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSendOtp() {
    setError('');
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError('Enter a valid 10-digit number');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(cleaned);
      navigation.navigate('OtpVerify', {phoneNumber: cleaned});
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Error', err.message || 'Google sign-in failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Subtle gradient glow behind brand */}
      <LinearGradient
        colors={['rgba(255,107,53,0.06)', 'transparent']}
        style={styles.gradientOrb}
        start={{x: 0.5, y: 0}}
        end={{x: 0.5, y: 1}}
      />

      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={20}>
        {/* Brand */}
        <FadeIn delay={0} direction="down" distance={24}>
          <View style={styles.brand}>
            <Text style={styles.brandMark}>P</Text>
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <Text style={[typography.displayLarge, styles.title]}>Poster</Text>
        </FadeIn>

        <FadeIn delay={160}>
          <Text style={[typography.bodyMedium, styles.subtitle]}>
            Create stunning posters{'\n'}& status in seconds
          </Text>
        </FadeIn>

        {/* Phone Input */}
        <FadeIn delay={260} style={styles.formSection}>
          <Input
            label="PHONE NUMBER"
            placeholder="Enter your number"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (error) setError('');
            }}
            error={error}
            prefix={
              <View style={styles.countryCode}>
                <Text style={[typography.labelMedium, {color: colors.textPrimary}]}>
                  +91
                </Text>
              </View>
            }
          />
        </FadeIn>

        {/* Send OTP */}
        <FadeIn delay={340} style={styles.buttonWrap}>
          <Button
            title="Continue"
            onPress={handleSendOtp}
            loading={loading}
            disabled={phone.length < 10}
          />
        </FadeIn>

        {/* Divider */}
        <FadeIn delay={400}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={[typography.labelSmall, styles.dividerText]}>OR</Text>
            <View style={styles.dividerLine} />
          </View>
        </FadeIn>

        {/* Google */}
        <FadeIn delay={460}>
          <Button
            title="Continue with Google"
            onPress={handleGoogleSignIn}
            variant="secondary"
            loading={googleLoading}
            icon={<Text style={styles.googleIcon}>G</Text>}
          />
        </FadeIn>

        {/* Footer */}
        <FadeIn delay={540}>
          <Text style={[typography.caption, styles.terms]}>
            By continuing, you agree to our Terms of Service{'\n'}and Privacy Policy
          </Text>
        </FadeIn>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  gradientOrb: {
    position: 'absolute',
    top: -100,
    left: -50,
    right: -50,
    height: 400,
    borderRadius: 200,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingH,
  },
  brand: {
    width: 72,
    height: 72,
    borderRadius: radii.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
    ...shadows.glow,
  },
  brandMark: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.textOnPrimary,
    marginTop: -2,
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
    lineHeight: 22,
  },
  formSection: {
    marginBottom: spacing.lg,
  },
  countryCode: {
    paddingRight: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
    marginRight: spacing.sm,
  },
  buttonWrap: {
    marginBottom: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  dividerText: {
    marginHorizontal: spacing.lg,
    color: colors.textTertiary,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  terms: {
    textAlign: 'center',
    marginTop: spacing['3xl'],
    lineHeight: 18,
    color: colors.textTertiary,
  },
});
