// src/screens/CrimeScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CrimeScreen({ route }) {
  const { city } = route?.params || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Crime overview</Text>
      <Text style={styles.city}>{city || 'Your area'}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Risk level</Text>
        <Text style={styles.riskValue}>Moderate</Text>
        <Text style={styles.smallText}>
          This is placeholder info. Later, connect with a crime statistics API
          or your own dataset.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Common incidents</Text>
        <Row icon="warning-outline" label="Petty theft / pickpocketing" />
        <Row icon="car-outline" label="Vehicle break-ins" />
        <Row icon="home-outline" label="Residential burglary" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety tips</Text>
        <Text style={styles.text}>• Avoid poorly lit areas late at night.</Text>
        <Text style={styles.text}>• Keep valuables hidden when commuting.</Text>
        <Text style={styles.text}>• Share live location with trusted contacts.</Text>
        <Text style={styles.text}>• Save local emergency numbers in Navilux.</Text>
      </View>
    </ScrollView>
  );
}

function Row({ icon, label }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color="#FF9800" />
      <Text style={styles.rowText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDEDED' },
  title: { fontSize: 20, fontWeight: '700', color: '#333' },
  city: { fontSize: 13, color: '#777', marginBottom: 10 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  riskValue: { fontSize: 22, fontWeight: '700', color: '#FF5722' },
  smallText: { fontSize: 12, color: '#777', marginTop: 6 },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  text: { fontSize: 13, color: '#555', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  rowText: { marginLeft: 8, fontSize: 13, color: '#555' },
});
