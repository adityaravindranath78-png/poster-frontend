import React, {useState} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import ImagePicker from 'react-native-image-crop-picker';
import LinearGradient from 'react-native-linear-gradient';
import {useRoute} from '@react-navigation/native';
import {useUserStore} from '../../store/userStore';
import {updateProfile} from '../../services/user';
import {uploadProfilePhoto, uploadLogo} from '../../services/storage';
import {useAuthStore} from '../../store/authStore';
import FadeIn from '../../components/FadeIn';

// Editorial palette — matches LoginScreen / OtpVerifyScreen
const ink = '#1A1512';
const paper = '#FAF5EC';
const paperDeep = '#F2E9D7';
const saffron = '#E85D2F';
const saffronDeep = '#C4441C';
const hair = 'rgba(26, 21, 18, 0.10)';
const hairStrong = 'rgba(26, 21, 18, 0.18)';
const ashhalf = 'rgba(26, 21, 18, 0.58)';
const ashmute = 'rgba(26, 21, 18, 0.35)';
const cream = '#FFF5E0';

type FieldProps = {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad';
  maxLength?: number;
  optional?: boolean;
  readOnly?: boolean;
  trailing?: React.ReactNode;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  optional,
  readOnly,
  trailing,
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldBlock}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {optional && <Text style={styles.fieldOptional}>Optional</Text>}
      </View>
      <View
        style={[
          styles.fieldUnderline,
          !readOnly && focused && styles.fieldUnderlineFocused,
          !!value && !focused && !readOnly && styles.fieldUnderlineFilled,
          readOnly && styles.fieldUnderlineReadOnly,
        ]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={ashmute}
          selectionColor={saffron}
          keyboardType={keyboardType}
          maxLength={maxLength}
          editable={!readOnly}
          style={[
            styles.fieldInput,
            readOnly && styles.fieldInputReadOnly,
          ]}
        />
        {trailing}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const route = useRoute();
  const isInitialSetup = route.name === 'ProfileSetup';

  const profile = useUserStore(s => s.profile);
  const setProfile = useUserStore(s => s.setProfile);
  const updateLocalProfile = useUserStore(s => s.updateProfile);
  const user = useAuthStore(s => s.user);

  // Strip +91 (or any country code) from Firebase phone; keep last 10 digits
  const firebasePhone = user?.phoneNumber
    ? user.phoneNumber.replace(/\D/g, '').slice(-10)
    : '';
  const verifiedPhone = firebasePhone || profile?.phone || '';

  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(verifiedPhone);
  const [businessName, setBusinessName] = useState(profile?.businessName || '');
  const [photoMime, setPhotoMime] = useState<string | undefined>();
  const [logoMime, setLogoMime] = useState<string | undefined>();
  const phoneLocked = !!firebasePhone;
  const [photoUri, setPhotoUri] = useState(profile?.photoUrl || '');
  const [logoUri, setLogoUri] = useState(profile?.logoUrl || '');
  const [saving, setSaving] = useState(false);

  const avatarScale = useSharedValue(1);
  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{scale: avatarScale.value}],
  }));

  async function pickImage(type: 'photo' | 'logo') {
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    try {
      const result = await ImagePicker.openPicker({
        width: 512,
        height: 512,
        cropping: true,
        cropperCircleOverlay: type === 'photo',
        mediaType: 'photo',
        compressImageQuality: 0.85,
        compressImageMaxWidth: 1024,
        compressImageMaxHeight: 1024,
        cropperToolbarTitle:
          type === 'photo' ? 'Crop your photo' : 'Crop your logo',
        cropperActiveWidgetColor: '#E85D2F',
        cropperStatusBarColor: '#FAF5EC',
        cropperToolbarColor: '#FAF5EC',
        cropperToolbarWidgetColor: '#1A1512',
        forceJpg: type === 'photo',
        includeBase64: false,
      });

      if (type === 'photo') {
        setPhotoUri(result.path);
        setPhotoMime(result.mime);
        avatarScale.value = withSpring(1.06, {damping: 10, stiffness: 300});
        setTimeout(() => {
          avatarScale.value = withSpring(1, {damping: 14, stiffness: 220});
        }, 200);
      } else {
        setLogoUri(result.path);
        setLogoMime(result.mime);
      }
    } catch (err: unknown) {
      const code = (err as {code?: string})?.code;
      if (code === 'E_PICKER_CANCELLED') return;
      const msg = err instanceof Error ? err.message : 'Could not pick image';
      Alert.alert('Error', msg);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    setSaving(true);
    try {
      let photoUrl = profile?.photoUrl || '';
      let logoUrl = profile?.logoUrl || '';
      if (photoUri && photoUri !== profile?.photoUrl) {
        photoUrl = await uploadProfilePhoto(photoUri, photoMime);
      }
      if (logoUri && logoUri !== profile?.logoUrl) {
        logoUrl = await uploadLogo(logoUri, logoMime);
      }
      const updates = {
        name: name.trim(),
        phone: phone.trim(),
        businessName: businessName.trim(),
        photoUrl,
        logoUrl,
        language: profile?.language || 'hi',
      };
      await updateProfile(updates);
      if (profile) {
        updateLocalProfile(updates);
      } else {
        setProfile({
          userId: user?.uid || '',
          subscriptionStatus: 'free',
          ...updates,
        });
      }
      ReactNativeHapticFeedback.trigger('notificationSuccess', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  }

  const canSave = !!name.trim();

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
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}>
          {/* Header */}
          <FadeIn delay={0} distance={8}>
            <View style={styles.header}>
              <View style={styles.brandRow}>
                <View style={styles.brandDot} />
                <Text style={styles.brand}>POSTER</Text>
              </View>
              {isInitialSetup && (
                <View style={styles.stepPill}>
                  <Text style={styles.stepText}>3 / 3</Text>
                </View>
              )}
            </View>
          </FadeIn>

          {/* Kicker */}
          <FadeIn delay={80} distance={10}>
            <View style={styles.kickerRow}>
              <View style={styles.kickerLine} />
              <Text style={styles.kicker}>
                {isInitialSetup ? 'One last thing' : 'Your details'}
              </Text>
            </View>
          </FadeIn>

          {/* Title */}
          <FadeIn delay={140} distance={14}>
            <Text style={styles.title}>
              {isInitialSetup ? (
                <>
                  Who goes on the{' '}
                  <Text style={styles.titleAccent}>poster</Text>?
                </>
              ) : (
                <>
                  Edit your <Text style={styles.titleAccent}>details</Text>
                </>
              )}
            </Text>
          </FadeIn>

          {/* Subtitle */}
          <FadeIn delay={200} distance={10}>
            <Text style={styles.subtitle}>
              Your name, photo and brand will appear on every poster you make.
              You can change any of this later.
            </Text>
          </FadeIn>

          {/* Avatar */}
          <FadeIn delay={280} distance={14}>
            <Pressable
              onPress={() => pickImage('photo')}
              style={styles.avatarWrap}>
              <Animated.View style={[styles.avatarContainer, avatarStyle]}>
                <View style={styles.avatarRing} />
                {photoUri ? (
                  <Image source={{uri: photoUri}} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {name ? name[0].toUpperCase() : '☺'}
                    </Text>
                  </View>
                )}
                <View style={styles.avatarBadge}>
                  <Text style={styles.avatarBadgeText}>
                    {photoUri ? 'Change' : 'Add photo'}
                  </Text>
                </View>
              </Animated.View>
            </Pressable>
          </FadeIn>

          {/* Fields */}
          <FadeIn delay={360}>
            <Field
              label="YOUR NAME"
              placeholder="e.g. Aditya"
              value={name}
              onChangeText={setName}
            />
          </FadeIn>

          <FadeIn delay={420}>
            <Field
              label="PHONE NUMBER"
              placeholder="10-digit number"
              value={phone}
              onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
              keyboardType="phone-pad"
              maxLength={10}
              optional={!phoneLocked}
              readOnly={phoneLocked}
              trailing={
                phoneLocked ? (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedCheck}>✓</Text>
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                ) : null
              }
            />
          </FadeIn>

          <FadeIn delay={480}>
            <Field
              label="BUSINESS / BRAND"
              placeholder="Your shop or brand name"
              value={businessName}
              onChangeText={setBusinessName}
              optional
            />
          </FadeIn>

          {/* Logo */}
          <FadeIn delay={540}>
            <View style={styles.logoBlock}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>BUSINESS LOGO</Text>
                <Text style={styles.fieldOptional}>Optional</Text>
              </View>
              <Pressable
                onPress={() => pickImage('logo')}
                style={({pressed}) => [
                  styles.logoPicker,
                  pressed && styles.logoPickerPressed,
                ]}>
                {logoUri ? (
                  <Image source={{uri: logoUri}} style={styles.logoImage} />
                ) : (
                  <View style={styles.logoPlaceholderInner}>
                    <Text style={styles.logoPlus}>+</Text>
                  </View>
                )}
                <View style={styles.logoCopy}>
                  <Text style={styles.logoHintTitle}>
                    {logoUri ? 'Tap to change' : 'Tap to add your logo'}
                  </Text>
                  <Text style={styles.logoHintSub}>
                    PNG with transparent background works best.
                  </Text>
                </View>
              </Pressable>
            </View>
          </FadeIn>

          {/* Save */}
          <FadeIn delay={620} style={styles.saveWrap}>
            <Pressable
              onPress={handleSave}
              disabled={!canSave || saving}
              style={({pressed}) => [
                styles.cta,
                !canSave && styles.ctaDisabled,
                pressed && canSave && styles.ctaPressed,
              ]}>
              <Text
                style={[styles.ctaText, !canSave && styles.ctaTextDisabled]}>
                {saving
                  ? 'Saving…'
                  : isInitialSetup
                  ? 'Save & start creating'
                  : 'Save changes'}
              </Text>
            </Pressable>
          </FadeIn>

        </ScrollView>
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
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
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
  stepPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: hairStrong,
    borderRadius: 2,
  },
  stepText: {
    fontSize: 11,
    fontWeight: '700',
    color: ink,
    letterSpacing: 1.6,
  },

  // Kicker
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
    fontSize: 24,
    fontWeight: '800',
    color: ink,
    lineHeight: 30,
    letterSpacing: -0.6,
  },
  titleAccent: {
    color: saffron,
  },

  // Subtitle
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: ashhalf,
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 18,
  },

  // Avatar
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: 18,
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  avatarRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: saffron,
    borderStyle: 'dashed',
    opacity: 0.7,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: cream,
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(232, 93, 47, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: cream,
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '800',
    color: saffron,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: ink,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  avatarBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: paper,
    letterSpacing: 0.8,
  },

  // Field
  fieldBlock: {
    marginBottom: 12,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ink,
    letterSpacing: 1.8,
  },
  fieldOptional: {
    fontSize: 10,
    fontWeight: '500',
    color: ashmute,
    letterSpacing: 0.4,
    fontStyle: 'italic',
  },
  fieldUnderline: {
    borderBottomWidth: 1.5,
    borderBottomColor: hairStrong,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldUnderlineFocused: {
    borderBottomColor: saffron,
    borderBottomWidth: 2,
  },
  fieldUnderlineFilled: {
    borderBottomColor: ink,
  },
  fieldUnderlineReadOnly: {
    borderBottomColor: hair,
  },
  fieldInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: ink,
    paddingVertical: 6,
    paddingHorizontal: 0,
    letterSpacing: 0.2,
  },
  fieldInputReadOnly: {
    color: ashhalf,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(46, 125, 92, 0.12)',
    borderRadius: 2,
    marginLeft: 8,
  },
  verifiedCheck: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D5C',
    marginRight: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D5C',
    letterSpacing: 0.4,
  },

  // Logo
  logoBlock: {
    marginTop: 2,
    marginBottom: 4,
  },
  logoPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: hairStrong,
    borderStyle: 'dashed',
    padding: 10,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  logoPickerPressed: {
    opacity: 0.65,
  },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: 2,
    marginRight: 12,
  },
  logoPlaceholderInner: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(232, 93, 47, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 2,
  },
  logoPlus: {
    fontSize: 22,
    color: saffron,
    fontWeight: '400',
    marginTop: -2,
  },
  logoCopy: {
    flex: 1,
  },
  logoHintTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ink,
    marginBottom: 1,
  },
  logoHintSub: {
    fontSize: 11,
    color: ashhalf,
    fontWeight: '400',
    lineHeight: 14,
  },

  // Save — pinned to bottom
  saveWrap: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  cta: {
    backgroundColor: saffron,
    height: 54,
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

  bottomSpacer: {
    height: 20,
  },
});
