import React, {useEffect} from 'react';
import {StatusBar, View, Text, StyleSheet, Platform} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import RootNavigator from './src/navigation/RootNavigator';
import {useAuthStore} from './src/store/authStore';
import {
  requestNotificationPermission,
  registerFcmToken,
  setupForegroundNotifications,
  onTokenRefresh,
} from './src/services/notifications';

GoogleSignin.configure({
  webClientId: '1023925943500-2h3mfnk3ds4jg22vforn5tvjjlbe5c9c.apps.googleusercontent.com',
});

const SPLASH_BG = '#FAF5EC';
const SPLASH_INK = '#1A1512';
const SPLASH_SAFFRON = '#E85D2F';
const SPLASH_MUTE = 'rgba(26, 21, 18, 0.55)';

function SplashScreen() {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.96);
  const dotPulse = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(1, {duration: 300, easing: Easing.out(Easing.quad)});
    scale.value = withSpring(1, {damping: 18, stiffness: 140});
    dotPulse.value = withDelay(
      300,
      withRepeat(withTiming(1.4, {duration: 900, easing: Easing.inOut(Easing.quad)}), -1, true),
    );
  }, [opacity, scale, dotPulse]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{scale: scale.value}],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{scale: dotPulse.value}],
  }));

  return (
    <View style={styles.splash}>
      <StatusBar barStyle="dark-content" backgroundColor={SPLASH_BG} />
      <Animated.View style={[styles.splashInner, containerStyle]}>
        <View style={styles.brandRow}>
          <Animated.View style={[styles.brandDot, dotStyle]} />
          <Text style={styles.brandMark}>POSTER</Text>
        </View>
        <Text style={styles.brandTagline}>for India.</Text>
      </Animated.View>
    </View>
  );
}

function App() {
  const {setUser, isLoading} = useAuthStore();

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        const token = await user.getIdToken();
        useAuthStore.getState().setToken(token);

        // Register FCM token after auth
        const fcmToken = await requestNotificationPermission();
        if (fcmToken) {
          registerFcmToken(fcmToken);
        }
      }
    });

    // Safety net — force splash to dismiss after 4s if Firebase hangs
    const splashTimeout = setTimeout(() => {
      if (useAuthStore.getState().isLoading) {
        useAuthStore.getState().setLoading(false);
      }
    }, 4000);

    return () => {
      unsubscribe();
      clearTimeout(splashTimeout);
    };
  }, []);

  // Foreground notification handler + token refresh
  useEffect(() => {
    const unsubForeground = setupForegroundNotifications();
    const unsubTokenRefresh = onTokenRefresh((token) => {
      registerFcmToken(token);
    });
    return () => {
      unsubForeground();
      unsubTokenRefresh();
    };
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor={SPLASH_BG} />
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SPLASH_BG,
  },
  splashInner: {
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: SPLASH_SAFFRON,
    marginRight: 14,
  },
  brandMark: {
    fontSize: 28,
    fontWeight: '800',
    color: SPLASH_INK,
    letterSpacing: 4,
  },
  brandTagline: {
    fontSize: 14,
    fontStyle: 'italic',
    color: SPLASH_MUTE,
    fontWeight: '400',
    marginLeft: 24,
    letterSpacing: 0.3,
  },
});

export default App;
