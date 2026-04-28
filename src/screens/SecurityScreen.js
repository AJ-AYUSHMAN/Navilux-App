import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';

import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';

export default function SecurityScreen() {
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
      // 🔐 Step 1: Re-authenticate
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPwd
      );

      await reauthenticateWithCredential(user, credential);

      // 🔥 Step 2: Update password
      await updatePassword(user, newPwd);

      Alert.alert('Success', 'Password updated successfully');

      // clear fields
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
    <View style={styles.container}>
      <Text style={styles.title}>Security</Text>
      <Text style={styles.text}>
        Manage your password and login security settings.
      </Text>

      <Text style={styles.label}>Current password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={currentPwd}
        onChangeText={setCurrentPwd}
      />

      <Text style={styles.label}>New password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={newPwd}
        onChangeText={setNewPwd}
      />

      <Text style={styles.label}>Confirm new password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={confirmPwd}
        onChangeText={setConfirmPwd}
      />

      <TouchableOpacity style={styles.btn} onPress={handleChangePassword}>
        <Text style={styles.btnText}>Update password</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 20,
    paddingTop: 40,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },

  text: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
  },

  label: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',

    // subtle shadow (premium feel)
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  btn: {
    marginTop: 30,
    backgroundColor: '#7EC7FF',
    borderRadius: 25,
    alignItems: 'center',
    paddingVertical: 14,

    // button shadow
    elevation: 3,
    shadowColor: '#7EC7FF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});