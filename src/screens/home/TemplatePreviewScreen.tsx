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
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
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
import FadeIn from '../../components/FadeIn';
import WatermarkOverlay from '../../components/WatermarkOverlay';
import {CATEGORIES} from '../../utils/constants';

// Editorial palette — matches Home / Login / Profile
const ink = '#1A1512';
const paper = '#FAF5EC';
const paperDeep = '#F2E9D7';
const saffron = '#E85D2F';
const saffronDeep = '#C4441C';
const hair = 'rgba(26, 21, 18, 0.08)';
const hairStrong = 'rgba(26, 21, 18, 0.18)';
const ashhalf = 'rgba(26, 21, 18, 0.58)';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const SIDE_PAD = 20;
const POSTER_W = SCREEN_WIDTH - SIDE_PAD * 2;

type Props = NativeStackScreenProps<HomeStackParamList, 'TemplatePreview'>;

export default function TemplatePreviewScreen({route, navigation}: Props) {
  const {template: meta} = route.params;
  const profile = useUserStore(s => s.profile);
  const isPremium = useSubscriptionStore(s => s.isPremium);
  const [schema, setSchema] = useState<Template | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [renderComplete, setRenderComplete] = useState(false);

  const cdnBase =
    Config.CLOUDFRONT_DOMAIN || 'dklcr2on9ks6p.cloudfront.net';
  const editorHtml = getEditorHtml(cdnBase);

  const imageScale = useSharedValue(0.96);
  const imageOpacity = useSharedValue(0);
  const actionsTranslateY = useSharedValue(30);
  const actionsOpacity = useSharedValue(0);

  useEffect(() => {
    loadSchema();
  }, []);

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
    }
  }

  function handleImageLoad() {
    setImageLoaded(true);
    imageScale.value = withSpring(1, {damping: 14, stiffness: 120});
    imageOpacity.value = withTiming(1, {duration: 320});
    setTimeout(() => {
      actionsTranslateY.value = withSpring(0, {damping: 16, stiffness: 140});
      actionsOpacity.value = withTiming(1, {duration: 260});
    }, 120);
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
        'Saved',
        `Your poster is in ${Platform.OS === 'android' ? 'Downloads' : 'Documents'}.`,
        [
          {text: 'Done'},
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
      Alert.alert('Almost ready', 'Template is still loading — try again in a second.');
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
        message: 'Check out this poster I made.',
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

  function handleBack() {
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    navigation.goBack();
  }

  const categoryMeta = CATEGORIES.find(c => c.id === meta.category);
  const categoryLabel = categoryMeta?.label ?? 'Poster';
  const categoryHi = categoryMeta?.hi;
  const categoryColor = categoryMeta?.color ?? saffron;
  const languageLabel = (meta.language || '').toUpperCase();

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={paper} />
      <LinearGradient
        colors={[paper, paperDeep]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Hidden canvas for rendering export */}
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

      {/* Header */}
      <FadeIn delay={0} distance={6}>
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={({pressed}) => [
              styles.backBtn,
              pressed && styles.backBtnPressed,
            ]}
            hitSlop={10}>
            <View style={styles.backArrow} />
          </Pressable>
          <View style={styles.headerMeta}>
            <View style={styles.kickerRow}>
              <View
                style={[styles.kickerDot, {backgroundColor: categoryColor}]}
              />
              <Text style={styles.kicker} numberOfLines={1}>
                {categoryLabel.toUpperCase()}
              </Text>
              {!!languageLabel && (
                <>
                  <View style={styles.kickerSep} />
                  <Text style={styles.kicker}>{languageLabel}</Text>
                </>
              )}
            </View>
            {!!categoryHi && (
              <Text style={styles.headerTitle} numberOfLines={1}>
                {categoryHi}
              </Text>
            )}
          </View>
          {meta.premium && (
            <View style={styles.proPill}>
              <Text style={styles.proPillText}>PRO</Text>
            </View>
          )}
        </View>
      </FadeIn>

      {/* Poster */}
      <View style={styles.posterArea}>
        <FadeIn delay={60} distance={10} style={styles.posterWrap}>
          <Animated.View style={[styles.posterCard, imageStyle]}>
            {!imageLoaded && (
              <View style={styles.posterLoading}>
                <ActivityIndicator color={ashhalf} />
              </View>
            )}
            <Image
              source={{uri: meta.thumbnail_url}}
              style={styles.posterImage}
              resizeMode="cover"
              onLoad={handleImageLoad}
            />
            {!isPremium() && meta.premium && <WatermarkOverlay />}
          </Animated.View>
        </FadeIn>
      </View>

      {/* Action bar */}
      <Animated.View style={[styles.actionBar, actionsStyle]}>
        <View style={styles.ctaRow}>
          <Pressable
            onPress={handleDownload}
            disabled={exporting}
            style={({pressed}) => [
              styles.ctaPrimary,
              pressed && styles.ctaPrimaryPressed,
              exporting && styles.ctaDisabled,
            ]}>
            {exporting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.ctaPrimaryText}>Download</Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => handleShare()}
            style={({pressed}) => [
              styles.ctaSecondary,
              pressed && styles.ctaSecondaryPressed,
            ]}>
            <Text style={styles.ctaSecondaryText}>Share</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={handleEdit}
          style={({pressed}) => [
            styles.ctaGhost,
            pressed && styles.ctaGhostPressed,
          ]}>
          <Text style={styles.ctaGhostText}>Open in Editor</Text>
          <Text style={styles.ctaGhostArrow}>→</Text>
        </Pressable>
        {meta.premium && !isPremium() && (
          <Text style={styles.premiumNote}>
            Premium template — free download includes a watermark
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: paper,
  },
  hiddenWebView: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: SIDE_PAD,
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: hairStrong,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    backgroundColor: paperDeep,
  },
  backArrow: {
    width: 9,
    height: 9,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: ink,
    transform: [{rotate: '45deg'}],
    marginLeft: 4,
  },
  headerMeta: {
    flex: 1,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kickerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: ink,
    letterSpacing: 1.8,
  },
  kickerSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: hairStrong,
    marginHorizontal: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ink,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  proPill: {
    backgroundColor: ink,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  proPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.4,
  },

  // Poster
  posterArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIDE_PAD,
  },
  posterWrap: {
    width: POSTER_W,
    aspectRatio: 1,
  },
  posterCard: {
    width: POSTER_W,
    aspectRatio: 1,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: ink,
    shadowColor: ink,
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: paperDeep,
  },

  // Action bar
  actionBar: {
    paddingHorizontal: SIDE_PAD,
    paddingTop: 20,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: hair,
    backgroundColor: paper,
    gap: 12,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ctaPrimary: {
    flex: 1,
    height: 54,
    borderRadius: 2,
    backgroundColor: saffron,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: saffronDeep,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaPrimaryPressed: {
    backgroundColor: saffronDeep,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaPrimaryText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  ctaSecondary: {
    flex: 1,
    height: 54,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: hairStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaSecondaryPressed: {
    backgroundColor: paperDeep,
  },
  ctaSecondaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: ink,
    letterSpacing: 0.3,
  },
  ctaGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  ctaGhostPressed: {
    opacity: 0.6,
  },
  ctaGhostText: {
    fontSize: 14,
    fontWeight: '700',
    color: ink,
    letterSpacing: 0.2,
  },
  ctaGhostArrow: {
    fontSize: 16,
    color: saffron,
    fontWeight: '800',
  },
  premiumNote: {
    textAlign: 'center',
    fontSize: 12,
    color: ashhalf,
    marginTop: 2,
  },
});
