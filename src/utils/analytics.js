import { NativeModules } from 'react-native';

// Safely check if the native module for Firebase is actually linked.
// In Expo Go, this will be false. In a built APK/AAB, it will be true.
const isFirebaseNativeAvailable = !!NativeModules.RNFBAppModule;

export const logScreenView = async (screenName, screenClass) => {
  try {
    if (!isFirebaseNativeAvailable) {
      console.log(`[Analytics - DEV] Logged screen view: ${screenName}`);
      return;
    }
    const analytics = require('@react-native-firebase/analytics').default;
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass,
    });
    console.log(`[Analytics] Logged screen view: ${screenName}`);
  } catch (error) {
    console.log(`[Analytics - Error] Could not log screen view: ${screenName}`, error);
  }
};

export const logAnalyticsEvent = async (eventName, params = {}) => {
  try {
    if (!isFirebaseNativeAvailable) {
      console.log(`[Analytics - DEV] Logged event: ${eventName}`, params);
      return;
    }
    const analytics = require('@react-native-firebase/analytics').default;
    await analytics().logEvent(eventName, params);
    console.log(`[Analytics] Logged event: ${eventName}`, params);
  } catch (error) {
    console.log(`[Analytics - Error] Could not log event: ${eventName}`, error);
  }
};
