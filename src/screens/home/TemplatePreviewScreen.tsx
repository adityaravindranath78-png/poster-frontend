import React, {useEffect, useState, useRef, useCallback} from 'react';
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
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import RNFS from 'react-native-fs';
import {WebView, WebViewMessageEvent} from 'react-native-webview';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Config from 'react-native-config';
import {HomeStackParamList} from '../../navigation/types';
import {useUserStore} from '../../store/userStore';
import {useSubscriptionStore} from '../../store/subscriptionStore';
import {getTemplateSchema} from '../../services/templates';
import {Template} from '../../types/template';
import {getEditorHtml} from '../../canvas/editorHtml';
import Button from '../../components/Button';
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
  const profile = useUserStore(s => s.profile);
  const isPremium = useSubscriptionStore(s => s.isPremium);
  const [schema, setSchema] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [renderComplete, setRenderComplete] = useState(false);

  const cdnBase = Config.CLOUDFRONT_DOMAIN || '';
  const editorHtml = getEditorHtml(cdnBase);

  const imageScale = useSharedValue(0.92);
  const imageOpacity = useSharedValue(0);
  const actionsTranslateY = useSharedValue(40);
  const actionsOpacity = useSharedValue(0);

  useEffect(() => {
    loadSchema();
  }, []);

  // When canvas is ready and schema loaded, send quick render
  useEffect(() => {
    if (canvasReady && schema) {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: 'LOAD_TEMPLATE',
          template: schema,
          profile: profile || undefined,
          cdnBase,
        }),
      );
    }
  }, [canvasReady, schema, profile, cdnBase]);

  async function loadSchema() {
    try {
      const tmpl = await getTemplateSchema(meta.schema_url);
      setSchema(tmpl);
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

  const handleCanvasMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      switch (msg.type) {
        case 'READY':
          setCanvasReady(true);
          break;
        case 'TEMPLATE_LOADED':
          setRenderComplete(true);
          break;
        case 'EXPORT_RESULT':
          saveExport(msg.data);
          break;
      }
    } catch {}
  }, []);

  async function saveExport(base64Data: string) {
    try {
      const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const filename = `Poster_${Date.now()}.png`;
      const path =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/${filename}`
          : `${RNFS.DocumentDirectoryPath}/${filename}`;

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission needed', 'Storage permission required');
          setExporting(false);
          return;
        }
      }

      await RNFS.writeFile(path, base64, 'base64');

      ReactNativeHapticFeedback.trigger('notificationSuccess', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });

      setExporting(false);
      Alert.alert(
        'Downloaded',
        `Saved to ${Platform.OS === 'android' ? 'Downloads' : 'Documents'}`,
        [
          {text: 'OK'},
          {
            text: 'Share',
            onPress: () => handleShare(path),
          },
        ],
      );
    } catch {
      setExporting(false);
      Alert.alert('Error', 'Failed to save image');
    }
  }

  async function handleDownload() {
    ReactNativeHapticFeedback.trigger('impactMedium', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });

    if (!renderComplete) {
      Alert.alert('Please wait', 'Template is still loading');
      return;
    }

    setExporting(true);
    webViewRef.current?.postMessage(
      JSON.stringify({type: 'EXPORT', format: 'png', quality: 1}),
    );
  }

  async function handleShare(filePath?: string) {
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    try {
      await Share.share({
        message: 'Check out this poster I made with Poster!',
        url: filePath
          ? Platform.OS === 'ios'
            ? filePath
            : `file://${filePath}`
          : meta.thumbnail_url,
      });
    } catch {}
  }

  function handleEdit() {
    ReactNativeHapticFeedback.trigger('impactMedium', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    if (schema) {
      navigation.navigate('Editor', {template: schema});
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.surfaceDark}
      />

      {/* Hidden canvas WebView for rendering */}
      <WebView
        ref={webViewRef}
        source={{html: editorHtml}}
        style={styles.hiddenWebView}
        onMessage={handleCanvasMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        originWhitelist={['*']}
        allowFileAccess
        mixedContentMode="always"
      />

      {/* Preview Image */}
      <View style={styles.imageContainer}>
        {!imageLoaded && (
          <SkeletonLoader
            width={IMAGE_SIZE}
            height={IMAGE_SIZE}
            borderRadius={radii.xl}
            style={styles.skeleton}
          />
        )}

        <Animated.Image
          source={{uri: meta.thumbnail_url}}
          style={[styles.heroImage, imageStyle]}
          resizeMode="contain"
          onLoad={handleImageLoad}
        />

        {!isPremium() && meta.premium && <WatermarkOverlay />}

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
          <View style={styles.quickActions}>
            <Button
              title={exporting ? 'Saving...' : 'Download'}
              onPress={handleDownload}
              size="medium"
              style={styles.actionButton}
              disabled={exporting}
            />
            <Button
              title="Share"
              onPress={() => handleShare()}
              variant="secondary"
              size="medium"
              style={styles.actionButton}
            />
          </View>

          <Button
            title="Open in Editor"
            onPress={handleEdit}
            variant="ghost"
            size="medium"
          />

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
  hiddenWebView: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
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
