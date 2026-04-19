import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Pressable,
  TextInput,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {AuthStackParamList} from '../../navigation/types';
import {sendOtp, signInWithGoogle} from '../../services/auth';
import {useLoginVariants, LoginHero} from '../../services/loginHero';
import FadeIn from '../../components/FadeIn';

// Warm Indian palette — scoped to this screen
const ink = '#1A1512';
const inkSoft = '#3A302B';
const paper = '#FAF5EC';
const paperDeep = '#F2E9D7';
const saffron = '#E85D2F';
const saffronDeep = '#C4441C';
const hair = 'rgba(26, 21, 18, 0.10)';
const hairStrong = 'rgba(26, 21, 18, 0.20)';
const ashhalf = 'rgba(26, 21, 18, 0.58)';
const ashmute = 'rgba(26, 21, 18, 0.35)';
const errorInk = '#B4271D';
const cream = '#FFF5E0';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

// Rendered poster preview — template-style output
function PosterDemo({data}: {data: LoginHero['poster']; callout: string}) {
  return null;
}

function Poster({hero}: {hero: LoginHero}) {
  const {poster, callout} = hero;
  return (
    <View style={styles.demoWrap}>
      <View style={styles.demoShadow} />

      <LinearGradient
        colors={poster.gradient}
        start={{x: 0.1, y: 0}}
        end={{x: 0.9, y: 1}}
        style={styles.demoPoster}>
        {/* Decorative inner frame */}
        <View style={styles.demoFrame} />

        {/* Corner motifs */}
        <Text style={[styles.demoMotif, styles.demoMotifTL]}>{poster.motif}</Text>
        <Text style={[styles.demoMotif, styles.demoMotifTR]}>{poster.motif}</Text>
        <Text style={[styles.demoMotif, styles.demoMotifBL]}>{poster.motif}</Text>
        <Text style={[styles.demoMotif, styles.demoMotifBR]}>{poster.motif}</Text>

        {/* Divider top */}
        <View style={styles.demoDivider}>
          <View style={styles.demoDividerLine} />
          <Text style={styles.demoDividerDot}>◆</Text>
          <View style={styles.demoDividerLine} />
        </View>

        {/* Greeting */}
        <Text style={styles.demoGreetingHi} numberOfLines={1}>
          {poster.greetingHi}
        </Text>
        <Text style={styles.demoGreetingEn} numberOfLines={1}>
          {poster.greetingEn}
        </Text>

        {/* Photo placeholder */}
        <View style={styles.demoAvatarOuter}>
          <View style={styles.demoAvatarRing} />
          <View style={styles.demoAvatar}>
            <Text style={styles.demoAvatarIcon}>☺</Text>
          </View>
        </View>

        {/* Name ribbon */}
        <View style={styles.demoNameRibbon}>
          <Text style={styles.demoNameText}>{poster.nameLabel}</Text>
        </View>

        {/* Divider bottom */}
        <View style={styles.demoDividerBottom}>
          <View style={styles.demoDividerLine} />
          <Text style={styles.demoDividerDot}>✦</Text>
          <View style={styles.demoDividerLine} />
        </View>
      </LinearGradient>

      {/* Callout badge */}
      <View style={styles.demoCallout}>
        <Text style={styles.demoCalloutText}>{callout}</Text>
      </View>
    </View>
  );
}

export default function LoginScreen({navigation}: Props) {
  const variants = useLoginVariants();
  const [heroIndex, setHeroIndex] = useState(0);
  const hero = variants[heroIndex] ?? variants[0];
  const heroOpacity = useSharedValue(1);
  const heroShift = useSharedValue(0);

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (variants.length <= 1) return;

    const tick = () => {
      heroOpacity.value = withTiming(
        0,
        {duration: 360, easing: Easing.in(Easing.quad)},
        finished => {
          if (!finished) return;
          runOnJS(setHeroIndex)((heroIndex + 1) % variants.length);
          heroShift.value = 12;
          heroOpacity.value = withTiming(1, {
            duration: 480,
            easing: Easing.out(Easing.cubic),
          });
          heroShift.value = withTiming(0, {
            duration: 480,
            easing: Easing.out(Easing.cubic),
          });
        },
      );
    };

    const timer = setInterval(tick, 3800);
    return () => clearInterval(timer);
  }, [variants.length, heroIndex, heroOpacity, heroShift]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{translateY: heroShift.value}],
  }));

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const code = (err as {code?: string})?.code;
      if (code !== 'SIGN_IN_CANCELLED') {
        const msg = err instanceof Error ? err.message : 'Google sign-in failed';
        Alert.alert('Error', msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  const canContinue = phone.length === 10;

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
        {/* Top zone — brand + rotating showcase */}
        <View style={styles.topZone}>
          <FadeIn delay={0} distance={8}>
            <View style={styles.brandRow}>
              <View style={styles.brandDot} />
              <Text style={styles.brand}>POSTER</Text>
            </View>
          </FadeIn>

          <Animated.View style={[styles.heroShuffle, heroStyle]}>
            <View style={styles.demoOuter}>
              <Poster hero={hero} />
            </View>

            <View style={styles.headlineWrap}>
              <Text style={styles.headline}>
                {hero.headline.before}
                <Text style={styles.headlineAccent}>{hero.headline.accent}</Text>
                {hero.headline.after}
              </Text>
            </View>

            <Text style={styles.subtitle}>{hero.subtitle}</Text>
          </Animated.View>
        </View>

        {/* Bottom zone — form sticks to bottom */}
        <View style={styles.bottomZone}>
          <FadeIn delay={440} style={styles.inputBlock}>
            <View
              style={[
                styles.inputRow,
                focused && styles.inputRowFocused,
                !!error && styles.inputRowError,
              ]}>
              <Text style={styles.prefix}>+91</Text>
              <View style={styles.prefixDivider} />
              <TextInput
                value={phone}
                onChangeText={text => {
                  setPhone(text.replace(/\D/g, '').slice(0, 10));
                  if (error) setError('');
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                keyboardType="phone-pad"
                placeholder="Phone number"
                placeholderTextColor={ashmute}
                selectionColor={saffron}
                maxLength={10}
                style={styles.inputField}
              />
            </View>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </FadeIn>

          <FadeIn delay={520} style={styles.ctaWrap}>
            <Pressable
              onPress={handleSendOtp}
              disabled={!canContinue || loading}
              style={({pressed}) => [
                styles.cta,
                !canContinue && styles.ctaDisabled,
                pressed && canContinue && styles.ctaPressed,
              ]}>
              <Text
                style={[
                  styles.ctaText,
                  !canContinue && styles.ctaTextDisabled,
                ]}>
                {loading ? 'Sending OTP…' : 'Send OTP'}
              </Text>
            </Pressable>
          </FadeIn>

          <FadeIn delay={600}>
            <View style={styles.altRow}>
              <View style={styles.altLine} />
              <Text style={styles.altLabel}>or</Text>
              <View style={styles.altLine} />
            </View>
          </FadeIn>

          <FadeIn delay={660}>
            <Pressable
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
              style={({pressed}) => [
                styles.googleBtn,
                pressed && styles.googleBtnPressed,
              ]}>
              <View style={styles.googleG}>
                <Text style={styles.googleGText}>G</Text>
              </View>
              <Text style={styles.googleText}>
                {googleLoading ? 'Signing in…' : 'Continue with Google'}
              </Text>
            </Pressable>
          </FadeIn>

          <FadeIn delay={760} style={styles.termsWrap}>
            <Text style={styles.terms}>
              By continuing you agree to our{' '}
              <Text style={styles.termsLink}>Terms</Text>
              {' & '}
              <Text style={styles.termsLink}>Privacy</Text>
            </Text>
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

  // Zones — natural flow, content close together
  topZone: {},
  bottomZone: {
    marginTop: 20,
  },

  // Brand
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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

  // Demo poster
  demoOuter: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 22,
  },
  demoWrap: {
    width: 248,
    height: 312,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoShadow: {
    position: 'absolute',
    top: 14,
    bottom: -4,
    left: 14,
    right: 14,
    backgroundColor: saffronDeep,
    borderRadius: 14,
    opacity: 0.25,
  },
  demoPoster: {
    width: 248,
    height: 312,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 26,
    paddingHorizontal: 20,
    transform: [{rotate: '-2deg'}],
    overflow: 'hidden',
  },
  demoFrame: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 245, 224, 0.35)',
    borderRadius: 5,
  },
  demoMotif: {
    position: 'absolute',
    fontSize: 14,
    color: cream,
    opacity: 0.6,
  },
  demoMotifTL: {top: 14, left: 18},
  demoMotifTR: {top: 14, right: 18},
  demoMotifBL: {bottom: 14, left: 18},
  demoMotifBR: {bottom: 14, right: 18},
  demoDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 124,
    marginTop: 2,
    marginBottom: 10,
  },
  demoDividerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 124,
    marginTop: 10,
  },
  demoDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 245, 224, 0.6)',
  },
  demoDividerDot: {
    fontSize: 10,
    color: cream,
    marginHorizontal: 6,
  },
  demoGreetingHi: {
    fontSize: 28,
    fontWeight: '800',
    color: cream,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
    marginBottom: 4,
  },
  demoGreetingEn: {
    fontSize: 10,
    fontStyle: 'italic',
    fontWeight: '500',
    color: 'rgba(255, 245, 224, 0.85)',
    letterSpacing: 3.2,
    marginBottom: 12,
  },
  demoAvatarOuter: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  demoAvatarRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 245, 224, 0.45)',
    borderStyle: 'dashed',
  },
  demoAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 245, 224, 0.22)',
    borderWidth: 2,
    borderColor: cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoAvatarIcon: {
    fontSize: 34,
    color: cream,
    marginTop: -2,
  },
  demoNameRibbon: {
    backgroundColor: cream,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginTop: 14,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  demoNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: saffronDeep,
    letterSpacing: 1.6,
  },
  demoCallout: {
    position: 'absolute',
    bottom: 8,
    right: -16,
    backgroundColor: ink,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 4,
    transform: [{rotate: '3deg'}],
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  demoCalloutText: {
    fontSize: 12,
    fontWeight: '600',
    color: paper,
    letterSpacing: 0.2,
  },

  // Hero shuffle wrapper (poster + headline + subtitle crossfade together)
  heroShuffle: {},

  // Headline
  headlineWrap: {
    marginBottom: 10,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: ink,
    lineHeight: 34,
    letterSpacing: -0.7,
  },
  headlineAccent: {
    color: saffron,
  },

  // Subtitle
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: ashhalf,
    lineHeight: 22,
  },

  // Input — minimal underline
  inputBlock: {
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: hairStrong,
    paddingVertical: 6,
  },
  inputRowFocused: {
    borderBottomColor: saffron,
    borderBottomWidth: 2,
  },
  inputRowError: {
    borderBottomColor: errorInk,
  },
  prefix: {
    fontSize: 18,
    fontWeight: '700',
    color: ink,
    marginRight: 8,
  },
  prefixDivider: {
    width: 1,
    height: 18,
    backgroundColor: hair,
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: ink,
    paddingVertical: 4,
    paddingHorizontal: 0,
    letterSpacing: 0.3,
  },
  errorText: {
    fontSize: 12,
    color: errorInk,
    marginTop: 6,
  },

  // CTA
  ctaWrap: {
    marginBottom: 14,
  },
  cta: {
    backgroundColor: saffron,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
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

  // OR divider
  altRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  altLine: {
    flex: 1,
    height: 1,
    backgroundColor: hair,
  },
  altLabel: {
    fontSize: 12,
    color: ashhalf,
    marginHorizontal: 12,
  },

  // Google
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: hairStrong,
    marginBottom: 14,
  },
  googleBtnPressed: {
    backgroundColor: 'rgba(26, 21, 18, 0.04)',
  },
  googleG: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleGText: {
    fontSize: 12,
    fontWeight: '800',
    color: paper,
    marginTop: -1,
  },
  googleText: {
    fontSize: 14,
    fontWeight: '600',
    color: ink,
  },

  // Terms
  termsWrap: {
    alignItems: 'center',
    paddingTop: 4,
  },
  terms: {
    fontSize: 11,
    color: ashhalf,
    textAlign: 'center',
    lineHeight: 17,
  },
  termsLink: {
    fontWeight: '600',
    color: inkSoft,
    textDecorationLine: 'underline',
  },
});
