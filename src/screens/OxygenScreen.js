// src/screens/OxygenScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OxygenScreen({ route }) {
  const { oxygen, city } = route?.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Oxygen level</Text>
      <Text style={styles.city}>{city || 'Current location'}</Text>

      <View style={styles.card}>
        <Text style={styles.value}>{oxygen || 'N/A'}</Text>
        <Text style={styles.label}>Approximate O₃ / air component</Text>
        <Text style={styles.desc}>
          This value is derived from air pollution data. Higher values may
          correlate with smog or ozone peaks in your area.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tips</Text>
        <Text style={styles.text}>• Avoid heavy outdoor exercise during high ozone hours.</Text>
        <Text style={styles.text}>• Prefer early morning or evening walks.</Text>
        <Text style={styles.text}>• Keep indoor plants and proper ventilation.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#EDEDED' },
  title: { fontSize: 20, fontWeight: '700', color: '#333' },
  city: { fontSize: 13, color: '#777', marginBottom: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  value: { fontSize: 28, fontWeight: '700', marginBottom: 4, color: '#333' },
  label: { fontSize: 13, color: '#777' },
  desc: { fontSize: 13, color: '#555', marginTop: 8 },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  text: { fontSize: 13, color: '#555', marginBottom: 4 },
});
