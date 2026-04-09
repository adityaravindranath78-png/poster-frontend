import React, {useRef} from 'react';
import {View, Text, StyleSheet, StatusBar} from 'react-native';
import {WebView} from 'react-native-webview';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useEditorStore} from '../../store/editorStore';
import HapticPressable from '../../components/HapticPressable';
import FadeIn from '../../components/FadeIn';
import {colors, typography, spacing, radii, shadows, pressScale} from '../../theme';

const EDITOR_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1A1A1A; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
    canvas { max-width: 100%; max-height: 100%; }
    .empty {
      color: rgba(255,255,255,0.35);
      font-family: -apple-system, 'SF Pro Display', sans-serif;
      text-align: center;
      padding: 40px;
    }
    .empty h2 { font-size: 20px; font-weight: 600; margin-bottom: 8px; color: rgba(255,255,255,0.5); }
    .empty p { font-size: 14px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="empty" id="placeholder">
    <h2>Canvas Editor</h2>
    <p>Choose a template from Home<br/>and tap "Open in Editor"</p>
  </div>
  <canvas id="canvas" style="display:none"></canvas>
  <script>
    window.addEventListener('message', function(event) {
      try {
        var msg = JSON.parse(event.data);
        if (msg.type === 'LOAD_TEMPLATE') {
          document.getElementById('placeholder').style.display = 'none';
          document.getElementById('canvas').style.display = 'block';
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'TEMPLATE_LOADED',
            layerCount: msg.template.layers.length
          }));
        }
        if (msg.type === 'EXPORT') {
          var dataUrl = document.getElementById('canvas').toDataURL('image/png');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'EXPORT_RESULT',
            data: dataUrl
          }));
        }
      } catch(e) {}
    });
  </script>
</body>
</html>
`;

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

export default function EditorScreen() {
  const webViewRef = useRef<WebView>(null);
  const {canUndo, canRedo, undo, redo} = useEditorStore();

  function handleMessage(event: any) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'TEMPLATE_LOADED') {
        ReactNativeHapticFeedback.trigger('impactLight', {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
      }
    } catch {}
  }

  function sendToWebView(message: object) {
    webViewRef.current?.postMessage(JSON.stringify(message));
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.surfaceDark} />

      {/* Canvas */}
      <WebView
        ref={webViewRef}
        source={{html: EDITOR_HTML}}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        originWhitelist={['*']}
      />

      {/* Floating Toolbar */}
      <FadeIn delay={200} direction="up" distance={20}>
        <View style={styles.toolbar}>
          <View style={styles.toolbarInner}>
            {/* History */}
            <View style={styles.toolGroup}>
              <ToolButton
                label="Undo"
                icon="↩"
                onPress={undo}
                disabled={!canUndo()}
              />
              <ToolButton
                label="Redo"
                icon="↪"
                onPress={redo}
                disabled={!canRedo()}
              />
            </View>

            <View style={styles.toolDivider} />

            {/* Creation Tools */}
            <View style={styles.toolGroup}>
              <ToolButton label="Text" icon="T" onPress={() => {}} />
              <ToolButton label="Image" icon="🖼" onPress={() => {}} />
              <ToolButton label="Sticker" icon="⭐" onPress={() => {}} />
              <ToolButton label="BG" icon="◐" onPress={() => {}} />
            </View>

            <View style={styles.toolDivider} />

            {/* Export */}
            <ToolButton
              label="Export"
              icon="↗"
              onPress={() => sendToWebView({type: 'EXPORT'})}
              accent
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
