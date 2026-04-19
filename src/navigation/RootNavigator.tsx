import React from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {getFocusedRouteNameFromRoute} from '@react-navigation/native';
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
import MyWorkScreen from '../screens/mywork/MyWorkScreen';

import {HomeIcon, WorkIcon, UserIcon} from './TabIcons';

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

const ink = '#1A1512';
const paper = '#FAF5EC';
const saffron = '#E85D2F';
const hairStrong = 'rgba(26, 21, 18, 0.12)';
const ashmute = 'rgba(26, 21, 18, 0.40)';

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
    <HomeStack.Navigator screenOptions={{headerShown: false}}>
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStack.Screen name="Category" component={CategoryScreen} />
      <HomeStack.Screen name="TemplatePreview" component={TemplatePreviewScreen} />
      <HomeStack.Screen name="Editor" component={EditorScreen} />
    </HomeStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{headerShown: false}}>
      <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
      <ProfileStack.Screen name="Subscription" component={SubscriptionScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    </ProfileStack.Navigator>
  );
}

function TabLabel({label, focused}: {label: string; focused: boolean}) {
  return (
    <Text
      style={[
        styles.tabLabel,
        {color: focused ? saffron : ashmute},
      ]}>
      {label}
    </Text>
  );
}

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarShowLabel: true,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={({route}) => {
          const focused = getFocusedRouteNameFromRoute(route) ?? 'HomeScreen';
          const hideTabBar = focused === 'Editor';
          return {
            tabBarStyle: hideTabBar
              ? {display: 'none'}
              : styles.tabBar,
            tabBarIcon: ({focused: f}) => (
              <HomeIcon color={f ? saffron : ashmute} size={22} />
            ),
            tabBarLabel: ({focused: f}) => (
              <TabLabel label="HOME" focused={f} />
            ),
          };
        }}
      />
      <Tab.Screen
        name="MyWork"
        component={MyWorkScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <WorkIcon color={focused ? saffron : ashmute} size={22} />
          ),
          tabBarLabel: ({focused}) => (
            <TabLabel label="MY WORK" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarIcon: ({focused}) => (
            <UserIcon color={focused ? saffron : ashmute} size={22} />
          ),
          tabBarLabel: ({focused}) => (
            <TabLabel label="PROFILE" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isProfileComplete = useUserStore(s => s.isProfileComplete);

  return (
    <RootStack.Navigator screenOptions={{headerShown: false}}>
      {!isAuthenticated ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : !isProfileComplete ? (
        <RootStack.Screen name="ProfileSetup" component={ProfileScreen} />
      ) : (
        <RootStack.Screen name="Main" component={MainNavigator} />
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: paper,
    borderTopWidth: 1,
    borderTopColor: hairStrong,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: {
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 4,
  },
});
