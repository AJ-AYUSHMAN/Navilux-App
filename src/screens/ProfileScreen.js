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

import * as ImagePicker from 'expo-image-picker';
import { auth } from '../config/firebaseConfig';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

/* 🌗 THEMES */
const lightTheme = {
  background: '#EDEDED',
  card: '#FFFFFF',
  text: '#333',
  subText: '#777',
};

const darkTheme = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  subText: '#AAAAAA',
};

export default function ProfileScreen({ navigation, setIsLoggedIn }) {
  const [userProfile, setUserProfile] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);

  const theme = darkMode ? darkTheme : lightTheme;

  useEffect(() => {
    const current = auth.currentUser;

    if (!current) return;

    setImage(current.photoURL);

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
  }, []);

  /* 📸 Pick Image */
  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert('Permission required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  /* 🔥 Upload Image */
  const uploadImage = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const storage = getStorage();
      const user = auth.currentUser;

      const storageRef = ref(storage, `profileImages/${user.uid}`);

      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);

      await updateProfile(user, {
        photoURL: downloadURL,
      });

      setImage(downloadURL);
    } catch (error) {
      console.log(error);
      alert('Upload failed');
    }
  };

  /* 🚪 Logout */
  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsLoggedIn(false); // 🔥 IMPORTANT
    } catch (err) {
      console.log(err);
    }
  };

  if (loading || !userProfile) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color="#7EC7FF" />
      </View>
    );
  }

  const user = userProfile;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.text }]}>Profile</Text>
        <Ionicons name="create-outline" size={22} color={theme.text} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Header */}
        <View style={[styles.headerCard, { backgroundColor: theme.card }]}>
          
          <View style={styles.avatarWrapper}>
            <Image
              source={
                image
                  ? { uri: image }
                  : require('../../assets/avatar-placeholder.png')
              }
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.avatarEdit} onPress={pickImage}>
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.name, { color: theme.text }]}>{user.name}</Text>
          <Text style={[styles.email, { color: theme.subText }]}>{user.email}</Text>
          <Text style={[styles.city, { color: theme.subText }]}>{user.city}</Text>
        </View>

        {/* Preferences */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.subText }]}>
            Preferences
          </Text>

          <View style={styles.row}>
            <Text style={[styles.rowText, { color: theme.text }]}>
              Dark mode
            </Text>
            <Switch value={darkMode} onValueChange={setDarkMode} />
          </View>
        </View>

        {/* Account */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.subText }]}>
            Account
          </Text>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('PersonalInfo')}
          >
            <Text style={[styles.rowText, { color: theme.text }]}>
              Personal Information
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('Security')}
          >
            <Text style={[styles.rowText, { color: theme.text }]}>
              Security
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('TravelPreferences')}
          >
            <Text style={[styles.rowText, { color: theme.text }]}>
              Travel Preferences
            </Text>
          </TouchableOpacity>
        </View>

        {/* Help */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.subText }]}>
            Help & About
          </Text>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('FAQ')}
          >
            <Text style={[styles.rowText, { color: theme.text }]}>
              FAQ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('About')}
          >
            <Text style={[styles.rowText, { color: theme.text }]}>
              About Navilux
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>App version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

/* 🎨 Styles */
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  topTitle: { fontSize: 18, fontWeight: '600' },

  content: { paddingHorizontal: 16 },

  headerCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },

  avatarWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
  },

  avatar: { width: '100%', height: '100%' },

  avatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#7EC7FF',
    borderRadius: 10,
    padding: 4,
  },

  name: { fontSize: 18, fontWeight: '700', marginTop: 10 },

  email: { fontSize: 13, marginTop: 2 },

  city: { fontSize: 13, marginTop: 2 },

  section: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 13,
    marginBottom: 8,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },

  rowText: { fontSize: 14 },

  logoutBtn: {
    backgroundColor: '#FF5C5C',
    borderRadius: 24,
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },

  logoutText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },

  versionText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 11,
    color: '#999',
  },
});