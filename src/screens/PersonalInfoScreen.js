// src/screens/PersonalInfoScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { auth, db } from '../config/firebaseConfig';
import { updateProfile, updateEmail, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

export default function PersonalInfoScreen({ navigation }) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          setName(user.displayName || '');
          setEmail(user.email || '');

          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setHomeCity(userDoc.data().homeCity || '');
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setSaving(true);
      await updateProfile(user, { displayName: name });

      if (email !== user.email) {
        try {
          await updateEmail(user, email);
        } catch (e) {
          if (e.code === 'auth/requires-recent-login') {
            Alert.alert(
              'Security Alert',
              'To change your email, you need to have logged in recently. Please log out and log back in to update your email.'
            );
          } else {
            throw e;
          }
        }
      }

      await setDoc(doc(db, 'users', user.uid), {
        displayName: name,
        email: email,
        homeCity: homeCity,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      Alert.alert('Success', 'Your information has been updated.');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure? This action cannot be undone. All your saved data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (user) {
                await deleteUser(user);
              }
            } catch (error) {
              console.error('Error deleting account:', error);
              if (error.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Security Alert',
                  'To delete your account, you need to have logged in recently. Please log out and log back in to delete your account.'
                );
              } else {
                Alert.alert('Error', 'Failed to delete account. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
           <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Personal information</Text>
      </View>

      <View style={[styles.form, { backgroundColor: theme.card, shadowColor: isDarkMode ? '#FFF' : '#000', borderWidth: isDarkMode ? 1 : 0, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.subText }]}>Full name</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: isDarkMode ? theme.background : '#F3F4F6', color: theme.text }]} 
          value={name} 
          onChangeText={setName} 
          placeholder="Enter your name"
          placeholderTextColor={theme.subText}
        />

        <Text style={[styles.label, { color: theme.subText }]}>Email address</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? theme.background : '#F3F4F6', color: theme.text }]}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Enter your email"
          placeholderTextColor={theme.subText}
        />

        <Text style={[styles.label, { color: theme.subText }]}>Home town / City</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: isDarkMode ? theme.background : '#F3F4F6', color: theme.text }]} 
          value={homeCity} 
          onChangeText={setHomeCity} 
          placeholder="e.g. Mumbai, New York"
          placeholderTextColor={theme.subText}
        />

        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: theme.primary }, saving && styles.btnDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Save changes</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={[styles.dangerZone, { backgroundColor: isDarkMode ? 'rgba(255,82,82,0.1)' : '#FFF5F5', borderColor: isDarkMode ? '#FF5252' : '#FFEAEA' }]}>
        <Text style={styles.dangerTitle}>Danger Zone</Text>
        <Text style={[styles.dangerText, { color: theme.subText }]}>
          Deleting your account is permanent and will remove all your data.
        </Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={20} color="#FF5252" style={{ marginRight: 8 }} />
          <Text style={styles.deleteBtnText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  backBtn: { marginRight: 10, marginLeft: -4 },
  title: { fontSize: 24, fontWeight: '800' },
  form: {
    padding: 20,
    borderRadius: 24,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  label: { fontSize: 14, fontWeight: '600', marginTop: 15, marginBottom: 8 },
  input: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  btn: {
    marginTop: 30,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 15,
    elevation: 3,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  divider: { height: 1, marginVertical: 35 },
  dangerZone: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  dangerTitle: { fontSize: 18, fontWeight: '700', color: '#FF5252', marginBottom: 8 },
  dangerText: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#FF5252',
    borderRadius: 16,
  },
  deleteBtnText: { color: '#FF5252', fontSize: 15, fontWeight: '700' },
});
