import React from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useAuthStore} from '../../store/authStore';
import {useUserStore} from '../../store/userStore';
import {useTemplateStore} from '../../store/templateStore';
import {LANGUAGES} from '../../utils/constants';
import HapticPressable from '../../components/HapticPressable';
import Button from '../../components/Button';
import FadeIn from '../../components/FadeIn';
import {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  layout,
  springs,
  pressScale,
} from '../../theme';

function LanguageChip({
  id,
  label,
  selected,
  onPress,
  index,
}: {
  id: string;
  label: string;
  selected: boolean;
  onPress: () => void;
  index: number;
}) {
  return (
    <FadeIn delay={index * 30} direction="up" distance={6}>
      <HapticPressable
        onPress={onPress}
        haptic="selection"
        scaleValue={pressScale.card}
        style={[styles.chip, selected && styles.chipActive]}>
        <Text
          style={[
            typography.labelMedium,
            styles.chipText,
            selected && styles.chipTextActive,
          ]}>
          {label}
        </Text>
      </HapticPressable>
    </FadeIn>
  );
}

function SettingsRow({
  label,
  onPress,
  icon,
  delay = 0,
}: {
  label: string;
  onPress: () => void;
  icon: string;
  delay?: number;
}) {
  return (
    <FadeIn delay={delay}>
      <HapticPressable
        onPress={onPress}
        haptic="light"
        scaleValue={pressScale.subtle}
        style={styles.row}>
        <Text style={styles.rowIcon}>{icon}</Text>
        <Text style={[typography.bodyLarge, styles.rowText]}>{label}</Text>
        <Text style={styles.rowArrow}>›</Text>
      </HapticPressable>
    </FadeIn>
  );
}

export default function SettingsScreen() {
  const signOut = useAuthStore((s) => s.signOut);
  const clearProfile = useUserStore((s) => s.clearProfile);
  const {selectedLanguage, setSelectedLanguage} = useTemplateStore();

  function handleLanguageSelect(langId: string) {
    setSelectedLanguage(langId);
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          ReactNativeHapticFeedback.trigger('impactMedium', {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false,
          });
          clearProfile();
          await signOut();
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Language */}
      <FadeIn delay={0}>
        <Text style={[typography.h3, styles.sectionTitle]}>
          Content Language
        </Text>
      </FadeIn>
      <View style={styles.chipGrid}>
        {LANGUAGES.map((lang, index) => (
          <LanguageChip
            key={lang.id}
            id={lang.id}
            label={lang.label}
            selected={selectedLanguage === lang.id}
            onPress={() => handleLanguageSelect(lang.id)}
            index={index}
          />
        ))}
      </View>

      {/* Links */}
      <FadeIn delay={200}>
        <Text style={[typography.h3, styles.sectionTitle]}>About</Text>
      </FadeIn>
      <View style={styles.section}>
        <SettingsRow label="Privacy Policy" icon="🔒" onPress={() => {}} delay={220} />
        <SettingsRow label="Terms of Service" icon="📄" onPress={() => {}} delay={250} />
        <SettingsRow label="Contact Support" icon="💬" onPress={() => {}} delay={280} />
        <SettingsRow label="Rate Us" icon="⭐" onPress={() => {}} delay={310} />
      </View>

      {/* Sign Out */}
      <FadeIn delay={380} style={styles.signOutWrap}>
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="danger"
          size="medium"
        />
      </FadeIn>

      <FadeIn delay={420}>
        <Text style={[typography.caption, styles.version]}>
          Poster v1.0.0
        </Text>
      </FadeIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: layout.screenPaddingH,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['6xl'],
  },
  sectionTitle: {
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // Language Chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing['3xl'],
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.glow,
  },
  chipText: {
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textOnPrimary,
  },

  // Settings Rows
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing['3xl'],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowIcon: {
    fontSize: 18,
    marginRight: spacing.md,
    width: 24,
    textAlign: 'center',
  },
  rowText: {
    flex: 1,
    color: colors.textPrimary,
  },
  rowArrow: {
    fontSize: 20,
    color: colors.textTertiary,
    fontWeight: '300',
  },

  // Sign Out
  signOutWrap: {
    marginBottom: spacing.xl,
  },
  version: {
    textAlign: 'center',
    color: colors.textTertiary,
  },
});
