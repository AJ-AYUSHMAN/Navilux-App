// src/screens/AboutScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>About Navilux</Text>
      <Text style={styles.text}>
        Navilux helps you understand a city's weather, air quality, safety,
        network coverage and interesting places, all in a single app.
      </Text>
      <Text style={styles.text}>
        This is a student project / travel-assistant concept. You can expand
        this page with your story, team, credits and open-source libraries.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Version</Text>
        <Text style={styles.text}>1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDEDED' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 10, color: '#333' },
  text: { fontSize: 13, color: '#555', marginBottom: 8 },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginTop: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
});
