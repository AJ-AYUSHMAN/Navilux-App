// src/services/notificationService.js
// Push notification service using expo-notifications with Firebase Cloud Messaging

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Configure how notifications behave when the app is in the FOREGROUND ───
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Set up Android notification channels.
 * This must run even on emulators so that local notifications work.
 */
async function setupAndroidChannels() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7EC7FF',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('travel-alerts', {
      name: 'Travel Alerts',
      description: 'Important alerts about your travel destinations',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF9800',
      sound: 'default',
    });
  }
}

/**
 * Register the device for push notifications and return the Expo push token.
 * The token is also persisted in AsyncStorage so other parts of the app can read it.
 *
 * NOTE: Remote push tokens (FCM) only work on physical devices with a
 * development or production build — NOT in Expo Go or on emulators.
 * Local notifications will still work everywhere.
 *
 * @returns {Promise<string|null>} Expo push token string, or null if registration fails.
 */
export async function registerForPushNotificationsAsync() {
  let token = null;

  // Always set up channels so local notifications work on emulators too
  await setupAndroidChannels();

  // Check / request permission (works on both emulators and devices)
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted.');
    return null;
  }

  // Remote push token registration — only attempt on real devices
  if (Device.isDevice) {
    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.log('No EAS projectId found – cannot get push token.');
      } else {
        const pushTokenData = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        token = pushTokenData.data;
        console.log('Expo push token:', token);

        // Persist locally
        await AsyncStorage.setItem('@expo_push_token', token);
      }
    } catch (error) {
      console.log('Error getting push token:', error);
    }
  } else {
    console.log(
      '📱 Running on emulator — remote push tokens are unavailable.\n' +
      '   Local notifications will still work.\n' +
      '   To receive FCM messages, use a physical device with a dev build.'
    );
  }

  return token;
}

/**
 * Schedule a local notification (works on both emulators and physical devices).
 *
 * @param {string} title   – Notification title
 * @param {string} body    – Notification body text
 * @param {object} [data]  – Extra payload to attach
 * @param {number} [delaySec] – Seconds to wait before showing (default: 1)
 */
export async function scheduleLocalNotification(
  title,
  body,
  data = {},
  delaySec = 1
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger:
      delaySec > 0
        ? {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: delaySec,
          }
        : null, // null = show immediately
  });
}

// ─── TRAVEL TIPS POOL ────────────────────────────────────────────────────────
const TRAVEL_TIPS = [
  '🔋 Keep a portable charger handy. Navigation eats battery fast!',
  '💧 Stay hydrated! Carry a reusable water bottle wherever you go.',
  '📸 Back up your travel photos to the cloud every night.',
  '🔒 Always share your live location with a trusted contact when exploring alone.',
  '🌦️ Check the weather forecast before you head out — dress smart, travel smart!',
  '💳 Keep a photocopy of your ID and important documents in a separate bag.',
  '🧳 Pack light! You\'ll thank yourself when navigating crowded streets.',
  '📶 Check network coverage for your destination before you travel.',
  '🛡️ Review the crime overview for unfamiliar areas — safety first!',
  '🚂 Book train tickets early for the best prices and availability.',
  '🌙 Avoid poorly lit streets at night — stick to main roads.',
  '🏥 Note the nearest hospital and police station when you arrive somewhere new.',
];

/**
 * Show a one-time welcome notification after the user's first login.
 * Uses AsyncStorage to ensure it only fires once.
 */
export async function scheduleWelcomeNotification() {
  try {
    const alreadySent = await AsyncStorage.getItem('@welcome_notif_sent');
    if (alreadySent === 'true') return; // Already shown once

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '👋 Welcome to Navilux!',
        body: 'Your smart travel companion is ready. Explore cities, check safety, and travel smarter!',
        data: { screen: 'Home' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
      },
    });

    await AsyncStorage.setItem('@welcome_notif_sent', 'true');
    console.log('🎉 Welcome notification scheduled (5s)');
  } catch (error) {
    console.log('Error scheduling welcome notification:', error);
  }
}

/**
 * Schedule a daily travel tip notification at 9:00 AM.
 * Cancels any existing daily tip before scheduling a new one to avoid duplicates.
 */
export async function scheduleDailyTravelTip() {
  try {
    // Cancel any previously scheduled daily tips
    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of allScheduled) {
      if (notif.content.data?.type === 'daily_travel_tip') {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    // Pick a random tip
    const tip = TRAVEL_TIPS[Math.floor(Math.random() * TRAVEL_TIPS.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧭 Daily Travel Tip',
        body: tip,
        data: { type: 'daily_travel_tip', screen: 'Home' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9 || 12 || 15 || 18,
        minute: 0,
      },
    });

    console.log('📅 Daily travel tip scheduled for 9:00 AM, 12:00PM, 3:00PM and 6:00PM');
  } catch (error) {
    console.log('Error scheduling daily travel tip:', error);
  }
}

/**
 * Get the stored push token without re-registering.
 * @returns {Promise<string|null>}
 */
export async function getStoredPushToken() {
  return AsyncStorage.getItem('@expo_push_token');
}
