import messaging from '@react-native-firebase/messaging';
import {Platform, PermissionsAndroid, Alert} from 'react-native';
import api from './api';

/**
 * Request notification permissions and get FCM token.
 * Call this after user logs in.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  // Android 13+ requires POST_NOTIFICATIONS permission
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      return null;
    }
  }

  // iOS permission
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) return null;

  const token = await messaging().getToken();
  return token;
}

/**
 * Register FCM token with the backend.
 */
export async function registerFcmToken(token: string): Promise<void> {
  try {
    await api.post('/user/fcm-token', {token, platform: Platform.OS});
  } catch {
    // Non-critical — silently fail
  }
}

/**
 * Set up foreground message handler.
 * Call this in App.tsx or root component.
 */
export function setupForegroundNotifications(): () => void {
  return messaging().onMessage(async remoteMessage => {
    const {title, body} = remoteMessage.notification || {};
    if (title) {
      Alert.alert(title, body || '');
    }
  });
}

/**
 * Set up background message handler.
 * Must be called in index.js (outside of React component tree).
 */
export function setupBackgroundNotifications(): void {
  messaging().setBackgroundMessageHandler(async _remoteMessage => {
    // Handle background data messages if needed
    // Notification display is automatic for notification messages
  });
}

/**
 * Listen for token refresh events.
 */
export function onTokenRefresh(
  callback: (token: string) => void,
): () => void {
  return messaging().onTokenRefresh(callback);
}
