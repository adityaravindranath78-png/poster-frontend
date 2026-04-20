import React, {useRef, useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  Share,
  Platform,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import {WebView, WebViewMessageEvent} from 'react-native-webview';
import RNFS from 'react-native-fs';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import ImageCropPicker from 'react-native-image-crop-picker';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import FadeIn from '../../components/FadeIn';
import {HomeStackParamList} from '../../navigation/types';
import {useUserStore} from '../../store/userStore';
import {getEditorHtml} from '../../canvas/editorHtml';
import Config from 'react-native-config';

// Editorial palette
const ink = '#1A1512';
const paper = '#FAF5EC';
const paperDeep = '#F2E9D7';
const saffron = '#E85D2F';
const saffronDeep = '#C4441C';
const canvasBg = '#0F0C0A';
const surfaceHigh = '#1F1814';
const hairDark = 'rgba(255, 255, 255, 0.08)';
const hairDarkStrong = 'rgba(255, 255, 255, 0.16)';
const ashOnDark = 'rgba(255, 255, 255, 0.58)';
const mutedOnDark = 'rgba(255, 255, 255, 0.36)';

// Preset background swatches
const BG_COLORS = [
  '#1A1512', // ink
  '#FFFFFF',
  '#FAF5EC',
  '#E85D2F',
  '#9C2223',
  '#143B5E',
  '#2E7D5C',
  '#8B1E8B',
  '#4C3A7B',
  '#F4A72C',
];

type Props = NativeStackScreenProps<HomeStackParamList, 'Editor'>;

type ToolProps = {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
};

function Tool({icon, label, onPress, disabled, active}: ToolProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({pressed}) => [
        styles.tool,
        active && styles.toolActive,
        pressed && !disabled && styles.toolPressed,
        disabled && styles.toolDisabled,
      ]}>
      <View style={styles.toolIcon}>{icon}</View>
      <Text
        style={[
          styles.toolLabel,
          active && styles.toolLabelActive,
          disabled && styles.toolLabelDisabled,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ───── Icon primitives (View-based, no icon-font dependency) ───── */
function UndoIcon({muted}: {muted?: boolean}) {
  const c = muted ? mutedOnDark : '#FFFFFF';
  return (
    <View style={iconStyles.wrap}>
      <View
        style={{
          width: 14,
          height: 9,
          borderTopWidth: 2,
          borderLeftWidth: 2,
          borderColor: c,
          borderTopLeftRadius: 8,
          transform: [{translateX: 2}],
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 6,
          width: 0,
          height: 0,
          borderTopWidth: 5,
          borderBottomWidth: 0,
          borderRightWidth: 6,
          borderLeftWidth: 0,
          borderStyle: 'solid',
          backgroundColor: 'transparent',
          borderTopColor: c,
          borderRightColor: 'transparent',
        }}
      />
    </View>
  );
}

function RedoIcon({muted}: {muted?: boolean}) {
  const c = muted ? mutedOnDark : '#FFFFFF';
  return (
    <View style={iconStyles.wrap}>
      <View
        style={{
          width: 14,
          height: 9,
          borderTopWidth: 2,
          borderRightWidth: 2,
          borderColor: c,
          borderTopRightRadius: 8,
          transform: [{translateX: -2}],
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: 6,
          width: 0,
          height: 0,
          borderTopWidth: 5,
          borderLeftWidth: 6,
          borderStyle: 'solid',
          backgroundColor: 'transparent',
          borderTopColor: c,
          borderLeftColor: 'transparent',
        }}
      />
    </View>
  );
}

function TextIcon() {
  return (
    <View style={iconStyles.wrap}>
      <Text style={{fontSize: 18, fontWeight: '900', color: '#FFFFFF'}}>T</Text>
    </View>
  );
}

function ImageIcon() {
  return (
    <View style={iconStyles.wrap}>
      <View
        style={{
          width: 18,
          height: 14,
          borderWidth: 1.5,
          borderColor: '#FFFFFF',
          borderRadius: 2,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}>
        <View
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 3,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: '#FFFFFF',
          }}
        />
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 5,
            borderRightWidth: 5,
            borderBottomWidth: 6,
            borderStyle: 'solid',
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: '#FFFFFF',
            marginBottom: 0,
          }}
        />
      </View>
    </View>
  );
}

function BgIcon() {
  return (
    <View style={iconStyles.wrap}>
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          overflow: 'hidden',
          flexDirection: 'row',
        }}>
        <View style={{flex: 1, backgroundColor: saffron}} />
        <View style={{flex: 1, backgroundColor: '#143B5E'}} />
      </View>
    </View>
  );
}

function DeleteIcon({muted}: {muted?: boolean}) {
  const c = muted ? mutedOnDark : '#FFFFFF';
  return (
    <View style={iconStyles.wrap}>
      <View
        style={{
          width: 14,
          height: 2,
          backgroundColor: c,
          transform: [{rotate: '45deg'}],
          position: 'absolute',
        }}
      />
      <View
        style={{
          width: 14,
          height: 2,
          backgroundColor: c,
          transform: [{rotate: '-45deg'}],
          position: 'absolute',
        }}
      />
    </View>
  );
}

function ShareIcon() {
  return (
    <View style={iconStyles.wrap}>
      <View
        style={{
          width: 14,
          height: 2,
          backgroundColor: '#FFFFFF',
          transform: [{rotate: '-45deg'}],
          position: 'absolute',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 2,
          right: 2,
          width: 0,
          height: 0,
          borderTopWidth: 0,
          borderBottomWidth: 6,
          borderLeftWidth: 6,
          borderRightWidth: 0,
          borderStyle: 'solid',
          borderBottomColor: '#FFFFFF',
          borderLeftColor: 'transparent',
        }}
      />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  wrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/* ───── Screen ───── */
export default function EditorScreen({route, navigation}: Props) {
  const webViewRef = useRef<WebView>(null);
  const profile = useUserStore(s => s.profile);
  const [ready, setReady] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [bgPanelOpen, setBgPanelOpen] = useState(false);

  const cdnBase =
    Config.CLOUDFRONT_DOMAIN || 'dklcr2on9ks6p.cloudfront.net';
  const editorHtml = getEditorHtml(cdnBase);

  // BG panel slide animation
  const bgPanelY = useSharedValue(80);
  const bgPanelOpacity = useSharedValue(0);

  useEffect(() => {
    if (bgPanelOpen) {
      bgPanelY.value = withSpring(0, {damping: 18, stiffness: 160});
      bgPanelOpacity.value = withTiming(1, {duration: 200});
    } else {
      bgPanelY.value = withTiming(80, {duration: 200});
      bgPanelOpacity.value = withTiming(0, {duration: 160});
    }
  }, [bgPanelOpen, bgPanelY, bgPanelOpacity]);

  const bgPanelStyle = useAnimatedStyle(() => ({
    transform: [{translateY: bgPanelY.value}],
    opacity: bgPanelOpacity.value,
  }));

  const send = useCallback((message: object) => {
    webViewRef.current?.postMessage(JSON.stringify(message));
  }, []);

  // Load template when canvas becomes ready OR when the nav-param template
  // changes. Single effect prevents the race where two load-starts double-fire
  // and the second canvas.clear() wipes the first's objects.
  const loadedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!ready) return;
    const tmpl = route.params?.template;
    if (!tmpl) return;
    if (loadedIdRef.current === tmpl.id) return;
    loadedIdRef.current = tmpl.id;
    setTemplateLoaded(false);
    send({
      type: 'LOAD_TEMPLATE',
      template: tmpl,
      profile: profile || undefined,
      cdnBase,
    });
  }, [ready, route.params?.template, send, profile, cdnBase]);

  function haptic(kind: 'light' | 'medium' | 'success') {
    const map = {
      light: 'impactLight',
      medium: 'impactMedium',
      success: 'notificationSuccess',
    } as const;
    ReactNativeHapticFeedback.trigger(map[kind], {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  }

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      switch (msg.type) {
        case 'READY':
          setReady(true);
          break;
        case 'TEMPLATE_LOADED':
          setTemplateLoaded(true);
          haptic('light');
          break;
        case 'STATE_CHANGED':
          setCanUndo(msg.canUndo);
          setCanRedo(msg.canRedo);
          break;
        case 'SELECTION':
          setHasSelection(msg.hasSelection);
          break;
        case 'EXPORT_RESULT':
          handleExportResult(msg.data);
          break;
        case 'ERROR':
          console.warn('[Canvas]', msg.message);
          break;
        case 'DEBUG':
          console.log('[Canvas debug]', JSON.stringify(msg));
          break;
      }
    } catch {}
  }

  async function handleExportResult(base64Data: string) {
    try {
      const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const filename = `Poster_${Date.now()}.png`;

      const cachePath = `${RNFS.CachesDirectoryPath}/${filename}`;
      await RNFS.writeFile(cachePath, base64, 'base64');

      haptic('success');

      if (Platform.OS === 'android') {
        try {
          const downloadPath = `${RNFS.DownloadDirectoryPath}/${filename}`;
          await RNFS.copyFile(cachePath, downloadPath);
        } catch {}
      }

      setExporting(false);
      Alert.alert('Saved', 'Your poster is ready', [
        {text: 'Done'},
        {
          text: 'Share',
          onPress: () => {
            Share.share({
              url: Platform.OS === 'ios' ? cachePath : `file://${cachePath}`,
              message: 'Made with Poster',
            }).catch(() => {});
          },
        },
      ]);
    } catch {
      setExporting(false);
      Alert.alert('Error', 'Failed to save image');
    }
  }

  /* ── Tool actions ── */
  function doUndo() {
    if (!canUndo) return;
    haptic('light');
    send({type: 'UNDO'});
  }
  function doRedo() {
    if (!canRedo) return;
    haptic('light');
    send({type: 'REDO'});
  }
  function doAddText() {
    haptic('medium');
    send({type: 'ADD_TEXT', text: 'Tap to edit', size: 40, color: '#FFFFFF'});
  }
  async function doAddImage() {
    haptic('medium');
    try {
      const img = await ImageCropPicker.openPicker({
        width: 800,
        height: 800,
        cropping: true,
        mediaType: 'photo',
        compressImageQuality: 0.9,
        hideBottomControls: true,
        cropperChooseText: 'Add',
        cropperCancelText: 'Cancel',
      });
      const uri = Platform.OS === 'ios' ? img.path : img.path;
      send({type: 'ADD_IMAGE', src: uri});
    } catch {
      // User cancelled picker — silent
    }
  }
  function doToggleBg() {
    haptic('light');
    setBgPanelOpen(v => !v);
  }
  function doSetBg(color: string) {
    haptic('light');
    send({type: 'SET_BG_COLOR', color});
    setBgPanelOpen(false);
  }
  function doDelete() {
    if (!hasSelection) return;
    haptic('medium');
    send({type: 'DELETE_SELECTED'});
  }
  function doShare() {
    if (!templateLoaded) return;
    haptic('medium');
    setExporting(true);
    send({type: 'EXPORT', format: 'png', quality: 1});
  }
  function doSave() {
    if (!templateLoaded || exporting) return;
    haptic('medium');
    setExporting(true);
    send({type: 'EXPORT', format: 'png', quality: 1});
  }
  function doBack() {
    haptic('light');
    navigation.goBack();
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={canvasBg} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={doBack}
          style={({pressed}) => [
            styles.headerBtn,
            pressed && styles.headerBtnPressed,
          ]}
          hitSlop={10}>
          <View style={styles.backArrow} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerKicker}>EDITING</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {templateLoaded ? 'Your Poster' : 'Loading…'}
          </Text>
        </View>

        <Pressable
          onPress={doSave}
          disabled={!templateLoaded || exporting}
          style={({pressed}) => [
            styles.saveBtn,
            pressed && templateLoaded && styles.saveBtnPressed,
            (!templateLoaded || exporting) && styles.saveBtnDisabled,
          ]}>
          {exporting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </Pressable>
      </View>

      {/* Canvas */}
      <View style={styles.canvasArea}>
        <WebView
          ref={webViewRef}
          source={{html: editorHtml}}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          bounces={false}
          originWhitelist={['*']}
          allowFileAccess
          mixedContentMode="always"
        />

        {!templateLoaded && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator color={saffron} size="large" />
            <Text style={styles.loadingText}>Preparing canvas…</Text>
          </View>
        )}
      </View>

      {/* BG swatch panel — animates up from below toolbar */}
      <Animated.View
        style={[styles.bgPanel, bgPanelStyle]}
        pointerEvents={bgPanelOpen ? 'auto' : 'none'}>
        <Text style={styles.bgPanelHint}>Background colour</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bgSwatchRow}>
          {BG_COLORS.map(c => (
            <Pressable
              key={c}
              onPress={() => doSetBg(c)}
              style={({pressed}) => [
                styles.swatch,
                {backgroundColor: c},
                pressed && {opacity: 0.75},
              ]}>
              {c === '#FFFFFF' || c === '#FAF5EC' ? (
                <View style={styles.swatchRing} />
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Toolbar */}
      <FadeIn delay={100} direction="up" distance={20}>
        <View style={styles.toolbar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolbarRow}>
            <Tool
              icon={<UndoIcon muted={!canUndo} />}
              label="Undo"
              onPress={doUndo}
              disabled={!canUndo}
            />
            <Tool
              icon={<RedoIcon muted={!canRedo} />}
              label="Redo"
              onPress={doRedo}
              disabled={!canRedo}
            />
            <View style={styles.toolSep} />
            <Tool icon={<TextIcon />} label="Text" onPress={doAddText} />
            <Tool icon={<ImageIcon />} label="Image" onPress={doAddImage} />
            <Tool
              icon={<BgIcon />}
              label="BG"
              onPress={doToggleBg}
              active={bgPanelOpen}
            />
            <Tool
              icon={<DeleteIcon muted={!hasSelection} />}
              label="Delete"
              onPress={doDelete}
              disabled={!hasSelection}
            />
            <View style={styles.toolSep} />
            <Tool icon={<ShareIcon />} label="Share" onPress={doShare} />
          </ScrollView>
        </View>
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: canvasBg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 12,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: canvasBg,
    borderBottomWidth: 1,
    borderBottomColor: hairDark,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: hairDarkStrong,
    backgroundColor: surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnPressed: {
    backgroundColor: '#2A211B',
  },
  backArrow: {
    width: 9,
    height: 9,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{rotate: '45deg'}],
    marginLeft: 4,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerKicker: {
    fontSize: 10,
    fontWeight: '800',
    color: saffron,
    letterSpacing: 1.8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: saffron,
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 82,
  },
  saveBtnPressed: {
    backgroundColor: saffronDeep,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  // Canvas
  canvasArea: {
    flex: 1,
    backgroundColor: canvasBg,
  },
  webview: {
    flex: 1,
    backgroundColor: canvasBg,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: canvasBg,
  },
  loadingText: {
    color: ashOnDark,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
  },

  // Background swatch panel
  bgPanel: {
    backgroundColor: surfaceHigh,
    paddingTop: 14,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: hairDark,
  },
  bgPanelHint: {
    fontSize: 10,
    fontWeight: '800',
    color: ashOnDark,
    letterSpacing: 1.8,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  bgSwatchRow: {
    paddingHorizontal: 20,
    gap: 10,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: hairDarkStrong,
  },

  // Toolbar
  toolbar: {
    backgroundColor: surfaceHigh,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: hairDark,
  },
  toolbarRow: {
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 4,
  },
  tool: {
    width: 64,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 4,
  },
  toolPressed: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  toolActive: {
    backgroundColor: 'rgba(232, 93, 47, 0.18)',
  },
  toolDisabled: {
    opacity: 0.4,
  },
  toolIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  toolLabelActive: {
    color: saffron,
  },
  toolLabelDisabled: {
    color: mutedOnDark,
  },
  toolSep: {
    width: 1,
    height: 28,
    backgroundColor: hairDark,
    marginHorizontal: 8,
  },
});
