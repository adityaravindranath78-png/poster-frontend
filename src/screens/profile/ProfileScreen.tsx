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
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {launchImageLibrary} from 'react-native-image-picker';
import {useUserStore} from '../../store/userStore';
import {updateProfile} from '../../services/user';
import {uploadProfilePhoto, uploadLogo} from '../../services/storage';
import {useAuthStore} from '../../store/authStore';
import Button from '../../components/Button';
import Input from '../../components/Input';
import HapticPressable from '../../components/HapticPressable';
import FadeIn from '../../components/FadeIn';
import {colors, typography, spacing, radii, shadows, layout, springs} from '../../theme';

export default function ProfileScreen() {
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const updateLocalProfile = useUserStore((s) => s.updateProfile);
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [businessName, setBusinessName] = useState(profile?.businessName || '');
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
    const result = await launchImageLibrary({
      mediaType: 'photo',
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.8,
    });
    if (result.assets?.[0]?.uri) {
      if (type === 'photo') {
        setPhotoUri(result.assets[0].uri);
        avatarScale.value = withSpring(1.05, springs.bouncy);
        setTimeout(() => {
          avatarScale.value = withSpring(1, springs.smooth);
        }, 200);
      } else {
        setLogoUri(result.assets[0].uri);
      }
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
        photoUrl = await uploadProfilePhoto(photoUri);
      }
      if (logoUri && logoUri !== profile?.logoUrl) {
        logoUrl = await uploadLogo(logoUri);
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
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <FadeIn delay={0}>
          <HapticPressable
            onPress={() => pickImage('photo')}
            haptic="light"
            style={styles.avatarWrap}>
            <Animated.View style={[styles.avatarContainer, avatarStyle]}>
              {photoUri ? (
                <Image source={{uri: photoUri}} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {name ? name[0].toUpperCase() : '+'}
                  </Text>
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeText}>Edit</Text>
              </View>
            </Animated.View>
          </HapticPressable>
        </FadeIn>

        {/* Form Fields */}
        <FadeIn delay={80}>
          <Input
            label="NAME"
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            containerStyle={styles.field}
          />
        </FadeIn>

        <FadeIn delay={140}>
          <Input
            label="PHONE NUMBER"
            placeholder="10-digit number"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
            containerStyle={styles.field}
          />
        </FadeIn>

        <FadeIn delay={200}>
          <Input
            label="BUSINESS NAME"
            placeholder="Your business or brand"
            value={businessName}
            onChangeText={setBusinessName}
            containerStyle={styles.field}
          />
        </FadeIn>

        {/* Logo Picker */}
        <FadeIn delay={260}>
          <Text style={[typography.labelSmall, styles.logoLabel]}>
            BUSINESS LOGO
          </Text>
          <HapticPressable
            onPress={() => pickImage('logo')}
            haptic="light"
            style={styles.logoPicker}>
            {logoUri ? (
              <Image source={{uri: logoUri}} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoPlus}>+</Text>
                <Text style={[typography.caption, styles.logoHint]}>
                  Add Logo
                </Text>
              </View>
            )}
          </HapticPressable>
        </FadeIn>

        {/* Save */}
        <FadeIn delay={320} style={styles.saveWrap}>
          <Button
            title="Save Profile"
            onPress={handleSave}
            loading={saving}
            disabled={!name.trim()}
          />
        </FadeIn>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: layout.screenPaddingH,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['6xl'],
  },

  // Avatar
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: spacing['3xl'],
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: colors.primaryMuted,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primaryLight,
    borderStyle: 'dashed',
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.primary,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    ...shadows.sm,
  },
  avatarBadgeText: {
    ...typography.labelSmall,
    fontSize: 10,
    color: colors.textOnPrimary,
  },

  // Fields
  field: {
    marginBottom: spacing.xl,
  },

  // Logo
  logoLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  logoPicker: {
    marginBottom: spacing['2xl'],
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  logoPlus: {
    fontSize: 24,
    color: colors.textTertiary,
    fontWeight: '300',
  },
  logoHint: {
    color: colors.textTertiary,
    marginTop: 2,
  },

  saveWrap: {
    marginTop: spacing.sm,
  },
});
