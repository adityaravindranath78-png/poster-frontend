import React, {useRef, useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  Share,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {WebView, WebViewMessageEvent} from 'react-native-webview';
import RNFS from 'react-native-fs';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {useUserStore} from '../../store/userStore';
import {getEditorHtml} from '../../canvas/editorHtml';
import HapticPressable from '../../components/HapticPressable';
import FadeIn from '../../components/FadeIn';
import {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  pressScale,
} from '../../theme';
import {MainTabParamList} from '../../navigation/types';
import Config from 'react-native-config';

type Props = BottomTabScreenProps<MainTabParamList, 'Editor'>;

interface ToolButtonProps {
  label: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
  accent?: boolean;
}

function ToolButton({label, icon, onPress, disabled, accent}: ToolButtonProps) {
  return (
    <HapticPressable
      onPress={onPress}
      haptic="selection"
      disabled={disabled}
      scaleValue={pressScale.icon}
      style={[
        styles.toolButton,
        accent && styles.toolButtonAccent,
        disabled && styles.toolButtonDisabled,
      ]}>
      <Text style={[styles.toolIcon, accent && styles.toolIconAccent]}>
        {icon}
      </Text>
      <Text
        style={[
          typography.labelSmall,
          styles.toolLabel,
          accent && styles.toolLabelAccent,
          disabled && styles.toolLabelDisabled,
        ]}>
        {label}
      </Text>
    </HapticPressable>
  );
}

export default function EditorScreen({route}: Props) {
  const webViewRef = useRef<WebView>(null);
  const profile = useUserStore(s => s.profile);
  const [ready, setReady] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const pendingTemplate = useRef(route.params?.template || null);

  const cdnBase = Config.CLOUDFRONT_DOMAIN || '';
  const editorHtml = getEditorHtml(cdnBase);

  const send = useCallback(
    (message: object) => {
      webViewRef.current?.postMessage(JSON.stringify(message));
    },
    [],
  );

  // When the WebView is ready, load pending template if any
  useEffect(() => {
    if (ready && pendingTemplate.current) {
      send({
        type: 'LOAD_TEMPLATE',
        template: pendingTemplate.current,
        profile: profile || undefined,
        cdnBase,
      });
      pendingTemplate.current = null;
    }
  }, [ready, send, profile, cdnBase]);

  // Watch for new template from navigation params
  useEffect(() => {
    const tmpl = route.params?.template;
    if (tmpl && ready) {
      send({
        type: 'LOAD_TEMPLATE',
        template: tmpl,
        profile: profile || undefined,
        cdnBase,
      });
      setTemplateLoaded(false);
    } else if (tmpl) {
      pendingTemplate.current = tmpl;
    }
  }, [route.params?.template, ready, send, profile, cdnBase]);

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      switch (msg.type) {
        case 'READY':
          setReady(true);
          break;
        case 'TEMPLATE_LOADED':
          setTemplateLoaded(true);
          ReactNativeHapticFeedback.trigger('impactLight', {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false,
          });
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
      }
    } catch {}
  }

  async function handleExportResult(base64Data: string) {
    try {
      // Strip data URI prefix
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
          return;
        }
      }

      await RNFS.writeFile(path, base64, 'base64');

      ReactNativeHapticFeedback.trigger('notificationSuccess', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });

      Alert.alert('Saved', `Image saved to ${Platform.OS === 'android' ? 'Downloads' : 'Documents'}`, [
        {text: 'OK'},
        {
          text: 'Share',
          onPress: () => {
            Share.share({
              url: Platform.OS === 'ios' ? path : `file://${path}`,
              message: 'Made with Poster',
            }).catch(() => {});
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to save image');
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.surfaceDark}
      />

      {/* Canvas WebView */}
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

      {/* Empty state overlay */}
      {!templateLoaded && (
        <View style={styles.emptyOverlay}>
          <FadeIn delay={200}>
            <Text style={styles.emptyTitle}>Canvas Editor</Text>
            <Text style={styles.emptyDesc}>
              Choose a template from Home{'\n'}and tap "Open in Editor"
            </Text>
          </FadeIn>
        </View>
      )}

      {/* Floating Toolbar */}
      <FadeIn delay={200} direction="up" distance={20}>
        <View style={styles.toolbar}>
          <View style={styles.toolbarInner}>
            {/* History */}
            <View style={styles.toolGroup}>
              <ToolButton
                label="Undo"
                icon="↩"
                onPress={() => send({type: 'UNDO'})}
                disabled={!canUndo}
              />
              <ToolButton
                label="Redo"
                icon="↪"
                onPress={() => send({type: 'REDO'})}
                disabled={!canRedo}
              />
            </View>

            <View style={styles.toolDivider} />

            {/* Creation Tools */}
            <View style={styles.toolGroup}>
              <ToolButton
                label="Text"
                icon="T"
                onPress={() =>
                  send({
                    type: 'ADD_TEXT',
                    text: 'Tap to edit',
                    size: 40,
                    color: '#FFFFFF',
                  })
                }
              />
              <ToolButton
                label="Delete"
                icon="✕"
                onPress={() => send({type: 'DELETE_SELECTED'})}
                disabled={!hasSelection}
              />
            </View>

            <View style={styles.toolDivider} />

            {/* Export */}
            <ToolButton
              label="Export"
              icon="↗"
              onPress={() => send({type: 'EXPORT', format: 'png', quality: 1})}
              accent
              disabled={!templateLoaded}
            />
          </View>
        </View>
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
  },

  // Empty overlay
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceDark,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },

  // Toolbar
  toolbar: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.sm,
  },
  toolbarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDarkElevated,
    borderRadius: radii.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...shadows.lg,
  },
  toolGroup: {
    flexDirection: 'row',
    gap: spacing.xxs,
  },
  toolDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: spacing.sm,
  },
  toolButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  toolButtonAccent: {
    backgroundColor: colors.primary,
  },
  toolButtonDisabled: {
    opacity: 0.3,
  },
  toolIcon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  toolIconAccent: {
    color: colors.textOnPrimary,
  },
  toolLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
  toolLabelAccent: {
    color: colors.textOnPrimary,
  },
  toolLabelDisabled: {
    color: 'rgba(255,255,255,0.2)',
  },
});
