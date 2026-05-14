// src/screens/SettingsScreen.js
import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { scheduleLocalNotification } from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen({ navigation }) {
  const { isDarkMode, theme, isModernUI, toggleModernUI, hapticsEnabled, toggleHaptics } = useContext(ThemeContext);
  const [locationAccess, setLocationAccess] = useState(false);
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [travelAlerts, setTravelAlerts] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const notifs = await AsyncStorage.getItem('@notifications_enabled');
        if (notifs !== null) setNotificationsEnabled(notifs === 'true');

        const alerts = await AsyncStorage.getItem('@travel_alerts_enabled');
        if (alerts !== null) setTravelAlerts(alerts === 'true');

        const suggestions = await AsyncStorage.getItem('@personalized_suggestions');
        if (suggestions !== null) setPersonalizedSuggestions(suggestions === 'true');

        const { status } = await Location.getForegroundPermissionsAsync();
        setLocationAccess(status === 'granted');
      } catch (e) {
        console.error('Error loading settings', e);
      }
    };
    loadSettings();
  }, []);

  const handleToggleLocation = async (value) => {
    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationAccess(true);
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable location access in your device settings to enjoy location-based features.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        setLocationAccess(false);
      }
    } else {
      Alert.alert(
        'Disable Location',
        'To revoke location access, please go to your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  const handleToggleSuggestions = async (value) => {
    setPersonalizedSuggestions(value);
    await AsyncStorage.setItem('@personalized_suggestions', value ? 'true' : 'false');
  };

  const handleToggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('@notifications_enabled', value ? 'true' : 'false');
    if (!value) {
      setTravelAlerts(false);
      await AsyncStorage.setItem('@travel_alerts_enabled', 'false');
    }
  };

  const handleToggleTravelAlerts = async (value) => {
    setTravelAlerts(value);
    await AsyncStorage.setItem('@travel_alerts_enabled', value ? 'true' : 'false');
  };

  const handleTestNotification = () => {
    scheduleLocalNotification(
      '🧭 Navilux',
      'Your travel companion is ready! Explore safely.',
      { screen: 'Home' },
      2
    );
    Alert.alert('Notification Sent', 'A test notification will appear in 2 seconds.');
  };

  const handleToggleHaptics = () => {
    if (!hapticsEnabled) {
      // Turning ON — give a preview buzz
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    toggleHaptics();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4, marginLeft: -4 }}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* 🎨 Appearance Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0, marginLeft: 8 }]}>
              Appearance
            </Text>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.rowText, { color: theme.text }]}>Modern UI</Text>
              <Text style={[styles.rowHint, { color: theme.subText }]}>Use the new premium glassmorphic interface on the Home Screen.</Text>
            </View>
            <Switch
              value={isModernUI}
              onValueChange={toggleModernUI}
              trackColor={{ false: '#767577', true: theme.primary }}
              thumbColor={isModernUI ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* 📍 Location & Privacy Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Location & Privacy</Text>

          <View style={styles.row}>
            <Text style={[styles.rowText, { color: theme.text }]}>Location access</Text>
            <Switch 
              value={locationAccess} 
              onValueChange={handleToggleLocation} 
              trackColor={{ false: '#767577', true: theme.primary }}
              thumbColor={locationAccess ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowText, { color: theme.text }]}>Personalized suggestions</Text>
            <Switch 
              value={personalizedSuggestions} 
              onValueChange={handleToggleSuggestions} 
              trackColor={{ false: '#767577', true: theme.primary }}
              thumbColor={personalizedSuggestions ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* 🔔 Notifications Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0, marginLeft: 8 }]}>
              Notifications
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowText, { color: theme.text }]}>Push notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#767577', true: theme.primary }}
              thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowText, { color: notificationsEnabled ? theme.text : theme.subText }]}>
              Travel alerts
            </Text>
            <Switch
              value={travelAlerts && notificationsEnabled}
              onValueChange={handleToggleTravelAlerts}
              disabled={!notificationsEnabled}
              trackColor={{ false: '#767577', true: theme.primary }}
              thumbColor={travelAlerts && notificationsEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.testButton,
              { backgroundColor: isDarkMode ? '#1e3a5f' : '#E3F2FD' },
            ]}
            activeOpacity={0.7}
            onPress={handleTestNotification}
          >
            <Ionicons name="paper-plane-outline" size={16} color={theme.primary} />
            <Text style={[styles.testButtonText, { color: theme.primary }]}>
              Send test notification
            </Text>
          </TouchableOpacity>
        </View>

        {/* 📳 Haptics Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="phone-portrait-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0, marginLeft: 8 }]}>
              Haptic Feedback
            </Text>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.rowText, { color: theme.text }]}>Vibration feedback</Text>
              <Text style={[styles.rowHint, { color: theme.subText }]}>Feel subtle vibrations on scroll and tap</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={handleToggleHaptics}
              trackColor={{ false: '#767577', true: theme.primary }}
              thumbColor={hapticsEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 40 : 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  section: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    alignItems: 'center',
  },
  rowText: { fontSize: 15, fontWeight: '500' },
  rowHint: { fontSize: 12, marginTop: 2 },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 12,
    gap: 6,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
