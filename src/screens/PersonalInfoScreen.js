// src/screens/PersonalInfoScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

export default function PersonalInfoScreen() {
  const [name, setName] = useState('Name');
  const [email, setEmail] = useState('navilux.user@example.com');
  const [city, setCity] = useState('City');

  const handleSave = () => {
    // TODO: update Firestore profile
    console.log('Save profile', { name, email, city });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Personal information</Text>

      <Text style={styles.label}>Full name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Home city</Text>
      <TextInput style={styles.input} value={city} onChangeText={setCity} />

      <TouchableOpacity style={styles.btn} onPress={handleSave}>
        <Text style={styles.btnText}>Save changes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#EDEDED' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 14, marginTop: 20, color: '#333' },
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
