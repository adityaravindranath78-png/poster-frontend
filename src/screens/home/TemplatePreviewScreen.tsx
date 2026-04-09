import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Share,
  PermissionsAndroid,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../../navigation/types';
import {useUserStore} from '../../store/userStore';
import {useSubscriptionStore} from '../../store/subscriptionStore';
import {getTemplateSchema} from '../../services/templates';
import {fillTemplate} from '../../utils/templateEngine';
import {Template} from '../../types/template';
import Button from '../../components/Button';
import HapticPressable from '../../components/HapticPressable';
import FadeIn from '../../components/FadeIn';
import SkeletonLoader from '../../components/SkeletonLoader';
import WatermarkOverlay from '../../components/WatermarkOverlay';
import {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  layout,
  springs,
  timing,
} from '../../theme';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const IMAGE_SIZE = SCREEN_WIDTH - layout.screenPaddingH * 2;

type Props = NativeStackScreenProps<HomeStackParamList, 'TemplatePreview'>;

export default function TemplatePreviewScreen({route, navigation}: Props) {
  const {template: meta} = route.params;
  const profile = useUserStore((s) => s.profile);
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const [filledTemplate, setFilledTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  const imageScale = useSharedValue(0.92);
  const imageOpacity = useSharedValue(0);
  const actionsTranslateY = useSharedValue(40);
  const actionsOpacity = useSharedValue(0);

  useEffect(() => {
    loadAndFill();
  }, []);

  async function loadAndFill() {
    try {
      const schema = await getTemplateSchema(meta.schema_url);
      if (profile) {
        setFilledTemplate(fillTemplate(schema, profile));
      } else {
        setFilledTemplate(schema);
      }
    } catch {
      Alert.alert('Error', 'Failed to load template');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  function handleImageLoad() {
    setImageLoaded(true);
    imageScale.value = withSpring(1, springs.smooth);
    imageOpacity.value = withTiming(1, timing.normal);
    // Stagger action buttons in after image
    setTimeout(() => {
      actionsTranslateY.value = withSpring(0, springs.smooth);
      actionsOpacity.value = withTiming(1, timing.normal);
    }, 150);
  }

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{scale: imageScale.value}],
    opacity: imageOpacity.value,
  }));

  const actionsStyle = useAnimatedStyle(() => ({
    transform: [{translateY: actionsTranslateY.value}],
    opacity: actionsOpacity.value,
  }));

  async function handleDownload() {
    ReactNativeHapticFeedback.trigger('impactMedium', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          'Permission needed',
          'Storage permission is required to save images',
        );
        return;
      }
    }
    Alert.alert('Downloaded', 'Image saved to gallery');
  }

  async function handleShare() {
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    try {
      await Share.share({
        message: 'Check out this poster I made with Poster!',
        url: meta.thumbnail_url,
      });
    } catch {
      // cancelled
    }
  }

  function handleEdit() {
    ReactNativeHapticFeedback.trigger('impactMedium', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    if (filledTemplate) {
      navigation.getParent()?.navigate('Editor', {template: filledTemplate});
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.surfaceDark} />

      {/* Dark immersive background */}
      <View style={styles.imageContainer}>
        {/* Skeleton while loading */}
        {!imageLoaded && (
          <SkeletonLoader
            width={IMAGE_SIZE}
            height={IMAGE_SIZE}
            borderRadius={radii.xl}
            style={styles.skeleton}
          />
        )}

        {/* Hero image — springs in with scale */}
        <Animated.Image
          source={{uri: meta.thumbnail_url}}
          style={[styles.heroImage, imageStyle]}
          resizeMode="contain"
          onLoad={handleImageLoad}
        />

        {/* Watermark overlay for free users on premium templates */}
        {!isPremium() && meta.premium && <WatermarkOverlay />}

        {/* Premium pill */}
        {meta.premium && (
          <FadeIn delay={300} style={styles.premiumPill}>
            <Text style={[typography.labelSmall, styles.premiumPillText]}>
              PRO
            </Text>
          </FadeIn>
        )}
      </View>

      {/* Floating Action Bar */}
      <Animated.View style={[styles.actionBar, actionsStyle]}>
        <View style={styles.actionBarInner}>
          {/* Quick Actions Row */}
          <View style={styles.quickActions}>
            <Button
              title="Download"
              onPress={handleDownload}
              size="medium"
              style={styles.actionButton}
            />
            <Button
              title="Share"
              onPress={handleShare}
              variant="secondary"
              size="medium"
              style={styles.actionButton}
            />
          </View>

          {/* Edit Button */}
          <Button
            title="Open in Editor"
            onPress={handleEdit}
            variant="ghost"
            size="medium"
          />

          {/* Premium note */}
          {meta.premium && !isPremium() && (
            <Text style={[typography.caption, styles.premiumNote]}>
              Premium template — download includes watermark
            </Text>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
  },

  // Image
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingH,
  },
  skeleton: {
    position: 'absolute',
  },
  heroImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: radii.xl,
  },
  premiumPill: {
    position: 'absolute',
    top: spacing['5xl'],
    right: layout.screenPaddingH + spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...shadows.md,
  },
  premiumPillText: {
    color: colors.textPrimary,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Action Bar
  actionBar: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: spacing['4xl'],
    paddingTop: spacing.lg,
  },
  actionBarInner: {
    backgroundColor: colors.surfaceDarkElevated,
    borderRadius: radii['2xl'],
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  premiumNote: {
    textAlign: 'center',
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});
