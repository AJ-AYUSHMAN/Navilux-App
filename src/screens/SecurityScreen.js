// src/screens/SecurityScreen.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';

import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { ThemeContext } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function SecurityScreen({ navigation }) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const auth = getAuth();
  const user = auth.currentUser;

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (newPwd !== confirmPwd) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPwd.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPwd
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPwd);

      Alert.alert('Success', 'Password updated successfully');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');

    } catch (error) {
      console.log(error);
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Current password is incorrect');
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert('Error', 'Too many attempts. Try later');
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
           <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Security</Text>
      </View>
      
      <Text style={[styles.text, { color: theme.subText }]}>
        Manage your password and login security settings.
      </Text>

      <View style={[styles.form, { backgroundColor: theme.card, shadowColor: isDarkMode ? '#FFF' : '#000', borderWidth: isDarkMode ? 1 : 0, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.subText }]}>Current password</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? theme.background : '#F3F4F6', color: theme.text }]}
          secureTextEntry
          value={currentPwd}
          onChangeText={setCurrentPwd}
          placeholder="Required for verification"
          placeholderTextColor={theme.subText}
        />

        <Text style={[styles.label, { color: theme.subText }]}>New password</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? theme.background : '#F3F4F6', color: theme.text }]}
          secureTextEntry
          value={newPwd}
          onChangeText={setNewPwd}
          placeholder="At least 6 characters"
          placeholderTextColor={theme.subText}
        />

        <Text style={[styles.label, { color: theme.subText }]}>Confirm new password</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? theme.background : '#F3F4F6', color: theme.text }]}
          secureTextEntry
          value={confirmPwd}
          onChangeText={setConfirmPwd}
          placeholder="Repeat new password"
          placeholderTextColor={theme.subText}
        />

        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary }]} onPress={handleChangePassword}>
          <Text style={styles.btnText}>Update password</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  backBtn: { marginRight: 8, marginLeft: -4 },
  title: { fontSize: 24, fontWeight: '800' },
  text: { fontSize: 14, marginBottom: 25, lineHeight: 20 },
  form: {
    padding: 20,
    borderRadius: 24,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  label: { fontSize: 14, fontWeight: '600', marginTop: 15, marginBottom: 8 },
  input: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  btn: {
    marginTop: 30,
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 15,
    elevation: 4,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});