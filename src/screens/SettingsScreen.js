// src/screens/SettingsScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [locationAccess, setLocationAccess] = useState(true);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>

        <View style={styles.row}>
          <Text style={styles.rowText}>Dark mode</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowText}>Use device language</Text>
          <Text style={styles.valueText}>On</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location & privacy</Text>

        <View style={styles.row}>
          <Text style={styles.rowText}>Location access</Text>
          <Switch value={locationAccess} onValueChange={setLocationAccess} />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowText}>Personalized suggestions</Text>
          <Text style={styles.valueText}>Enabled</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDEDED' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 10, color: '#333' },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    alignItems: 'center',
  },
  rowText: { fontSize: 14, color: '#444' },
  valueText: { fontSize: 13, color: '#777' },
});
