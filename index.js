/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Register background message handler (must be outside React tree)
messaging().setBackgroundMessageHandler(async _remoteMessage => {
  // Notification display is automatic for notification-type messages
});

AppRegistry.registerComponent(appName, () => App);
