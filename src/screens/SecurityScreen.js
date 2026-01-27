// src/screens/SecurityScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

export default function SecurityScreen() {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const handleChangePassword = () => {
    // TODO: Firebase updatePassword()
    console.log('Change password');
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
  container: { flex: 1, padding: 16, backgroundColor: '#EDEDED' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8, color: '#333' },
  text: { fontSize: 13, color: '#555', marginBottom: 12 },
  label: { fontSize: 13, color: '#555', marginTop: 10 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
    fontSize: 14,
  },
  btn: {
    marginTop: 22,
    backgroundColor: '#7EC7FF',
    borderRadius: 22,
    alignItems: 'center',
    paddingVertical: 12,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
