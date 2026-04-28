import React, { useRef, useState } from 'react';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

/* Screens */
import SplashScreen from './src/screens/SplashScreen';
import AuthStartScreen from './src/screens/AuthStartScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import WeatherScreen from './src/screens/WeatherScreen';

import ExploreScreen from './src/screens/ExploreScreen';
import ExploreDetailsScreen from './src/screens/ExploreDetailsScreen';

import NewsScreen from './src/screens/NewsScreen';
import NewsDetailsScreen from './src/screens/NewsDetailsScreen';

import ProfileScreen from './src/screens/ProfileScreen';

import AqiDetailsScreen from './src/screens/AqiDetailsScreen';
import OxygenScreen from './src/screens/OxygenScreen';
import CrimeScreen from './src/screens/CrimeScreen';
import NetworkScreen from './src/screens/NetworkScreen';
import CitySearchResultsScreen from './src/screens/CitySearchResultsScreen';

import SettingsScreen from './src/screens/SettingsScreen';
import AboutScreen from './src/screens/AboutScreen';
import FaqScreen from './src/screens/FaqScreen';
import PersonalInfoScreen from './src/screens/PersonalInfoScreen';
import SecurityScreen from './src/screens/SecurityScreen';
import TravelPreferencesScreen from './src/screens/TravelPreferencesScreen';

import ChatScreen from './src/screens/ChatScreen';
import FloatingChatButton from './src/components/FloatingChatButton';

const Stack = createNativeStackNavigator();

export default function App() {
  const navigationRef = useNavigationContainerRef();
  const routeNameRef = useRef();

  const [currentRouteName, setCurrentRouteName] = useState('Splash');

  // 🔥 Auth state (change this later using AsyncStorage)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 🚫 Routes where chat button should NOT appear
  const hideChatRoutes = [
    'Splash',
    'Login',
    'Signup',
    'AuthStart',
    'Chat',
    'Map',
  ];

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        const initialName =
          navigationRef.getCurrentRoute()?.name || 'Splash';
        routeNameRef.current = initialName;
        setCurrentRouteName(initialName);
      }}
      onStateChange={() => {
        const name = navigationRef.getCurrentRoute()?.name;
        if (name && routeNameRef.current !== name) {
          routeNameRef.current = name;
          setCurrentRouteName(name);
        }
      }}
    >
      <>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          
          {/* 🔐 AUTH FLOW */}
          {!isLoggedIn ? (
            <>
              <Stack.Screen name="Splash">
                {(props) => (
                  <SplashScreen
                    {...props}
                    setIsLoggedIn={setIsLoggedIn}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="AuthStart" component={AuthStartScreen} />

              <Stack.Screen name="Login">
                {(props) => (
                  <LoginScreen
                    {...props}
                    setIsLoggedIn={setIsLoggedIn}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="Signup">
                {(props) => (
                  <SignupScreen {...props} setIsLoggedIn={setIsLoggedIn} />
                  )}
              </Stack.Screen>
              
              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
              />
            </>
          ) : (
            /* 🏠 MAIN APP */
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Map" component={MapScreen} />
              <Stack.Screen name="Weather" component={WeatherScreen} />

              {/* Explore */}
              <Stack.Screen name="Explore" component={ExploreScreen} />
              <Stack.Screen
                name="ExploreDetails"
                component={ExploreDetailsScreen}
              />

              {/* News */}
              <Stack.Screen name="News" component={NewsScreen} />
              <Stack.Screen
                name="NewsDetails"
                component={NewsDetailsScreen}
              />

              {/* Profile */}
              
              <Stack.Screen name="Profile">
                {(props) => (
                  <ProfileScreen {...props} setIsLoggedIn={setIsLoggedIn} />
                  )}
              </Stack.Screen>
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="About" component={AboutScreen} />
              <Stack.Screen name="FAQ" component={FaqScreen} />
              <Stack.Screen
                name="PersonalInfo"
                component={PersonalInfoScreen}
              />
              <Stack.Screen name="Security" component={SecurityScreen} />
              <Stack.Screen
                name="TravelPreferences"
                component={TravelPreferencesScreen}
              />

              {/* Environment */}
              <Stack.Screen name="AqiDetails" component={AqiDetailsScreen} />
              <Stack.Screen name="Oxygen" component={OxygenScreen} />
              <Stack.Screen name="Crime" component={CrimeScreen} />
              <Stack.Screen name="Network" component={NetworkScreen} />

              {/* Search */}
              <Stack.Screen
                name="CitySearchResults"
                component={CitySearchResultsScreen}
              />

              {/* Chat */}
              <Stack.Screen name="Chat" component={ChatScreen} />
            </>
          )}
        </Stack.Navigator>

        {/* 💬 Floating Chat Button */}
        {!hideChatRoutes.includes(currentRouteName) && isLoggedIn && (
          <FloatingChatButton />
        )}
      </>
    </NavigationContainer>
  );
}