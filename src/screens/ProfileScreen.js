// src/screens/ProfileScreen.js
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import * as ImagePicker from 'expo-image-picker';
import { auth } from '../config/firebaseConfig';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { updateProfile, signOut } from 'firebase/auth';
import { ThemeContext } from '../context/ThemeContext';

export default function ProfileScreen({ navigation, setIsLoggedIn }) {
  const { isDarkMode, toggleDarkMode, theme } = useContext(ThemeContext);
  const [userProfile, setUserProfile] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const current = auth.currentUser;
    if (!current) return;

    setImage(current.photoURL);

    // Initial profile state
    const profile = {
      name: current.displayName || 'Navilux Traveller',
      email: current.email || 'user@example.com',
      city: 'Detecting...',
      trips: 0,
      savedPlaces: 0,
      daysActive: 0,
    };
    setUserProfile(profile);

    // Fetch actual location
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setUserProfile(prev => ({ ...prev, city: 'Permission Denied' }));
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const geo = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });

        const detectedCity = geo[0]?.city || geo[0]?.region || 'Unknown city';
        setUserProfile(prev => ({ ...prev, city: detectedCity }));
      } catch (error) {
        console.error('Error fetching location:', error);
        setUserProfile(prev => ({ ...prev, city: 'Location Error' }));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* 📸 Pick Image */
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

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
      await signOut(auth);
      setIsLoggedIn(false); // 🔥 IMPORTANT
    } catch (err) {
      console.log(err);
    }
  };

  if (loading || !userProfile) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const user = userProfile;
  // Provide random user avatar if user has no photo
  const defaultAvatarUrl = `https://i.pravatar.cc/200?u=${user.email}`;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.text }]}>Profile</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="create-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={[styles.headerCard, { backgroundColor: theme.card, shadowColor: '#000' }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarWrapper, { borderColor: theme.background }]}>
              <Image
                source={{ uri: image || defaultAvatarUrl }}
                style={styles.avatar}
              />
            </View>
            <TouchableOpacity style={styles.avatarEdit} onPress={pickImage} activeOpacity={0.8}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.name, { color: theme.text }]}>{user.name}</Text>
          <Text style={[styles.email, { color: theme.subText }]}>{user.email}</Text>
          <View style={[styles.cityBadge, { backgroundColor: theme.background }]}>
            <Ionicons name="location" size={12} color={theme.primary} />
            <Text style={[styles.city, { color: theme.subText }]}>{user.city}</Text>
          </View>
        </View>

        {/* Preferences */}
        <View style={[styles.section, { backgroundColor: theme.card, shadowColor: '#000' }]}>
          <Text style={[styles.sectionTitle, { color: theme.subText }]}>Preferences</Text>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="moon-outline" size={20} color={theme.text} style={styles.rowIcon} />
              <Text style={[styles.rowText, { color: theme.text }]}>Dark mode</Text>
            </View>
            <Switch 
              value={isDarkMode} 
              onValueChange={toggleDarkMode} 
              trackColor={{ false: '#767577', true: theme.primary }}
              thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Account */}
        <View style={[styles.section, { backgroundColor: theme.card, shadowColor: '#000' }]}>
          <Text style={[styles.sectionTitle, { color: theme.subText }]}>Account</Text>

          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => navigation.navigate('PersonalInfo')}>
            <View style={styles.rowLeft}>
              <Ionicons name="person-outline" size={20} color={theme.text} style={styles.rowIcon} />
              <Text style={[styles.rowText, { color: theme.text }]}>Personal Information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.subText} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => navigation.navigate('Security')}>
            <View style={styles.rowLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.text} style={styles.rowIcon} />
              <Text style={[styles.rowText, { color: theme.text }]}>Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.subText} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => navigation.navigate('TravelPreferences')}>
            <View style={styles.rowLeft}>
              <Ionicons name="airplane-outline" size={20} color={theme.text} style={styles.rowIcon} />
              <Text style={[styles.rowText, { color: theme.text }]}>Travel Preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.subText} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => navigation.navigate('Settings')}>
            <View style={styles.rowLeft}>
              <Ionicons name="settings-outline" size={20} color={theme.text} style={styles.rowIcon} />
              <Text style={[styles.rowText, { color: theme.text }]}>App Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.subText} />
          </TouchableOpacity>
        </View>

        {/* Help */}
        <View style={[styles.section, { backgroundColor: theme.card, shadowColor: '#000' }]}>
          <Text style={[styles.sectionTitle, { color: theme.subText }]}>Help & About</Text>

          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => navigation.navigate('FAQ')}>
            <View style={styles.rowLeft}>
              <Ionicons name="help-circle-outline" size={20} color={theme.text} style={styles.rowIcon} />
              <Text style={[styles.rowText, { color: theme.text }]}>FAQ</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.subText} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => navigation.navigate('About')}>
            <View style={styles.rowLeft}>
              <Ionicons name="information-circle-outline" size={20} color={theme.text} style={styles.rowIcon} />
              <Text style={[styles.rowText, { color: theme.text }]}>About Navilux</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.subText} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: theme.danger }]} activeOpacity={0.8} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>App version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

/* 🎨 Styles */
const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 40 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  iconButton: {
    padding: 4,
  },
  topTitle: { fontSize: 20, fontWeight: '700', letterSpacing: 0.5 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  headerCard: {
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 4,
  },
  avatar: { width: '100%', height: '100%' },
  avatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#7EC7FF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 2,
  },
  name: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  email: { fontSize: 14, marginBottom: 12 },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  city: { fontSize: 13, fontWeight: '600', marginLeft: 4 },
  section: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  rowText: { fontSize: 16, fontWeight: '500' },
  divider: {
    height: 1,
    width: '100%',
    marginLeft: 1,
  },
  logoutBtn: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  versionText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
});