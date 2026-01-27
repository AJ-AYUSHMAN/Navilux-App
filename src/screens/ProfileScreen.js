// src/screens/ProfileScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { auth } from '../config/firebaseConfig';

export default function ProfileScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const current = auth.currentUser;

    if (!current) {
      navigation.replace('AuthStart');
      return;
    }

    const profile = {
      name: current.displayName || 'Navilux Traveller',
      email: current.email || 'user@example.com',
      city: 'Unknown city',
      trips: 0,
      savedPlaces: 0,
      daysActive: 0,
    };

    setUserProfile(profile);
    setLoading(false);
  }, [navigation]);

  const handleLogout = async () => {
    try {
      await auth.signOut(); // compat signOut
      navigation.replace('AuthStart');
    } catch (err) {
      console.log('Logout error:', err);
      alert('Error logging out. Please try again.');
    }
  };

  if (loading || !userProfile) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color="#7EC7FF" />
      </View>
    );
  }

  const user = userProfile;

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View className="topBar" style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#555" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Profile</Text>
        <TouchableOpacity onPress={() => console.log('Edit profile')}>
          <Ionicons name="create-outline" size={22} color="#555" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={require('../../assets/avatar-placeholder.png')}
              style={styles.avatar}
            />
            <TouchableOpacity
              style={styles.avatarEdit}
              onPress={() => console.log('Change avatar')}
            >
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.city}>{user.city}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.trips}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.savedPlaces}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.daysActive}</Text>
              <Text style={styles.statLabel}>Days Active</Text>
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="moon-outline" size={20} color="#555" />
              <Text style={styles.rowText}>Dark mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              thumbColor={darkMode ? '#7EC7FF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#555"
              />
              <Text style={styles.rowText}>Push notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              thumbColor={notificationsEnabled ? '#7EC7FF' : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity
            style={styles.row}
            onPress={() => console.log('Language pressed')}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="globe-outline" size={20} color="#555" />
              <Text style={styles.rowText}>Language</Text>
            </View>
            <Text style={styles.rowRightText}>English</Text>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.row}
            onPress={() => console.log('Edit personal info')}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="person-outline" size={20} color="#555" />
              <Text style={styles.rowText}>Personal information</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => console.log('Security pressed')}
          >
            <View style={styles.rowLeft}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#555"
              />
              <Text style={styles.rowText}>Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => console.log('Travel preferences')}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="airplane-outline" size={20} color="#555" />
              <Text style={styles.rowText}>Travel preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Help & about */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & About</Text>

          <TouchableOpacity
            style={styles.row}
            onPress={() => console.log('FAQ')}
          >
            <View style={styles.rowLeft}>
              <Ionicons
                name="help-circle-outline"
                size={20}
                color="#555"
              />
              <Text style={styles.rowText}>FAQ & support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => console.log('About Navilux')}
          >
            <View style={styles.rowLeft}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#555"
              />
              <Text style={styles.rowText}>About Navilux</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Logout button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>App version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDEDED', paddingTop: 40 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  topTitle: { fontSize: 18, fontWeight: '600', color: '#444' },
  content: { paddingHorizontal: 16, paddingBottom: 20 },

  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    marginBottom: 10,
  },
  avatar: { width: '100%', height: '100%' },
  avatarEdit: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#7EC7FF',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 4 },
  email: { fontSize: 13, color: '#777', marginTop: 2 },
  city: { fontSize: 13, color: '#999', marginTop: 2 },

  statsRow: {
    flexDirection: 'row',
    marginTop: 14,
    width: '80%',
    justifyContent: 'space-between',
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#333' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowText: { marginLeft: 10, fontSize: 14, color: '#444' },
  rowRightText: { fontSize: 13, color: '#777' },

  logoutBtn: {
    marginTop: 4,
    backgroundColor: '#FF5C5C',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  versionText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 11,
    color: '#999',
  },
});
