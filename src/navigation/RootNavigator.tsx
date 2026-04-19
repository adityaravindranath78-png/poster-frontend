import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';
import {useAuthStore} from '../store/authStore';
import {useUserStore} from '../store/userStore';

import LoginScreen from '../screens/auth/LoginScreen';
import OtpVerifyScreen from '../screens/auth/OtpVerifyScreen';
import HomeScreen from '../screens/home/HomeScreen';
import CategoryScreen from '../screens/home/CategoryScreen';
import TemplatePreviewScreen from '../screens/home/TemplatePreviewScreen';
import EditorScreen from '../screens/editor/EditorScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SubscriptionScreen from '../screens/profile/SubscriptionScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  HomeStackParamList,
  ProfileStackParamList,
} from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false}}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="OtpVerify" component={OtpVerifyScreen} />
    </AuthStack.Navigator>
  );
}

function HomeNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{title: 'Poster'}}
      />
      <HomeStack.Screen
        name="Category"
        component={CategoryScreen}
        options={({route}) => ({title: route.params.categoryLabel})}
      />
      <HomeStack.Screen
        name="TemplatePreview"
        component={TemplatePreviewScreen}
        options={{title: 'Preview'}}
      />
    </HomeStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{title: 'Profile'}}
      />
      <ProfileStack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{title: 'Premium Plans'}}
      />
    </ProfileStack.Navigator>
  );
}

function TabIcon({label, focused}: {label: string; focused: boolean}) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Editor: '✏️',
    Profile: '👤',
    Settings: '⚙️',
  };
  return (
    <Text style={{fontSize: 22, opacity: focused ? 1 : 0.5}}>
      {icons[label] || '📱'}
    </Text>
  );
}

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarIcon: ({focused}) => (
          <TabIcon label={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#999',
      })}>
      <Tab.Screen name="Home" component={HomeNavigator} />
      <Tab.Screen name="Editor" component={EditorScreen} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isProfileComplete = useUserStore((s) => s.isProfileComplete);

  return (
    <RootStack.Navigator screenOptions={{headerShown: false}}>
      {!isAuthenticated ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : !isProfileComplete ? (
        <RootStack.Screen
          name="ProfileSetup"
          component={ProfileScreen}
        />
      ) : (
        <RootStack.Screen name="Main" component={MainNavigator} />
      )}
    </RootStack.Navigator>
  );
}
