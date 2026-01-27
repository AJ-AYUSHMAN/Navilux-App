// src/screens/NetworkScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NetworkScreen({ route }) {
  const { city } = route?.params || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Network coverage</Text>
      <Text style={styles.city}>{city || 'Your area'} • Airtel</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Signal strength</Text>
        <View style={styles.bars}>
          {[1, 2, 3, 4].map((v) => (
            <View key={v} style={[styles.bar, v <= 3 && styles.barActive]} />
          ))}
        </View>
        <Text style={styles.smallText}>Good 4G / upcoming 5G support.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Speed (placeholder)</Text>
        <Text style={styles.text}>Download: 45 Mbps</Text>
        <Text style={styles.text}>Upload: 15 Mbps</Text>
        <Text style={styles.text}>Latency: 24 ms</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tips</Text>
        <Row icon="cellular-outline" label="Move closer to open areas for better signal." />
        <Row icon="wifi-outline" label="Use Wi-Fi calling when indoor signal is weak." />
        <Row icon="settings-outline" label="Switch to automatic network selection." />
      </View>
    </ScrollView>
  );
}

function Row({ icon, label }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color="#2196F3" />
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
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 26, marginBottom: 6 },
  bar: {
    width: 6,
    marginRight: 4,
    borderRadius: 3,
    backgroundColor: '#DDD',
  },
  barActive: { backgroundColor: '#4CAF50', height: '100%' },
  smallText: { fontSize: 12, color: '#777' },
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
