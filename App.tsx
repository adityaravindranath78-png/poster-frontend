import React, {useEffect} from 'react';
import {StatusBar, View, Text, StyleSheet} from 'react-native';
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
  interpolate,
} from 'react-native-reanimated';
import RootNavigator from './src/navigation/RootNavigator';
import {useAuthStore} from './src/store/authStore';
import {
  requestNotificationPermission,
  registerFcmToken,
  setupForegroundNotifications,
  onTokenRefresh,
} from './src/services/notifications';
import {colors} from './src/theme';

GoogleSignin.configure({
  webClientId: '1023925943500-2h3mfnk3ds4jg22vforn5tvjjlbe5c9c.apps.googleusercontent.com',
});

function SplashScreen() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, {duration: 1200}), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.6, 1]),
    transform: [{scale: interpolate(pulse.value, [0, 1], [0.97, 1.03])}],
  }));

  return (
    <View style={styles.splash}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Animated.View style={[styles.splashBrand, animatedStyle]}>
        <Text style={styles.splashMark}>P</Text>
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
    return unsubscribe;
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
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
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
    backgroundColor: colors.surface,
  },
  splashBrand: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  splashMark: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.textOnPrimary,
    marginTop: -2,
  },
});

export default App;
