// src/screens/AqiDetailsScreen.js
import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

export default function AqiDetailsScreen({ route }) {
  const { aqi, city, components } = route?.params || {};
  const { isDarkMode, theme } = useContext(ThemeContext);
  const label = () => {
    if (!aqi) return 'Unknown';
    if (aqi === 1) return 'Good';
    if (aqi === 2) return 'Fair';
    if (aqi === 3) return 'Moderate';
    if (aqi === 4) return 'Poor';
    if (aqi === 5) return 'Very Poor';
    return 'Unknown';
  };

  const polls = components || {
    pm2_5: 18,
    pm10: 25,
    o3: 40,
    no2: 12,
    so2: 4,
    co: 220,
  };

  const renderRow = (name, value, unit = 'µg/m³') => (
    <View style={styles.row} key={name}>
      <Text style={[styles.rowLabel, { color: theme.subText }]}>{name}</Text>
      <Text style={[styles.rowValue, { color: theme.text }]}>
        {value != null ? `${value} ${unit}` : '—'}
      </Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ padding: 16 }}>
      <Text style={[styles.city, { color: theme.text }]}>{city || 'Current location'}</Text>

      <View style={[styles.aqiCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.aqiLabel, { color: theme.subText }]}>Air Quality Index</Text>
        <Text style={[styles.aqiValue, { color: theme.text }]}>{aqi || '--'}</Text>
        <Text style={styles.aqiStatus}>{label()}</Text>

        <View style={styles.aqiScale}>
          {[1, 2, 3, 4, 5].map((v) => (
            <View
              key={v}
              style={[
                styles.aqiBar,
                aqi === v && styles.aqiBarActive,
                v < aqi && styles.aqiBarPast,
              ]}
            />
          ))}
        </View>

        <Text style={[styles.aqiDesc, { color: theme.subText }]}>
          Lower is better. Values above 3 indicate unhealthy air for
          sensitive groups.
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Pollutants</Text>
        {renderRow('PM2.5 (fine particles)', polls.pm2_5)}
        {renderRow('PM10 (coarse particles)', polls.pm10)}
        {renderRow('Ozone (O₃)', polls.o3)}
        {renderRow('Nitrogen dioxide (NO₂)', polls.no2)}
        {renderRow('Sulfur dioxide (SO₂)', polls.so2)}
        {renderRow('Carbon monoxide (CO)', polls.co)}
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Health recommendations</Text>
        <View style={styles.bulletRow}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={[styles.bulletText, { color: theme.subText }]}>
            Sensitive people should reduce outdoor activities when AQI &gt; 3.
          </Text>
        </View>
        <View style={styles.bulletRow}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={[styles.bulletText, { color: theme.subText }]}>
            Wear a suitable mask when pollution is high.
          </Text>
        </View>
        <View style={styles.bulletRow}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={[styles.bulletText, { color: theme.subText }]}>
            Keep windows closed near high-traffic roads.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDEDED' },
  city: { fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 30, color: '#333' },
  aqiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  aqiLabel: { fontSize: 14, color: '#777' },
  aqiValue: { fontSize: 32, fontWeight: '700', marginTop: 4, color: '#333' },
  aqiStatus: { fontSize: 15, marginTop: 4, color: '#4CAF50', fontWeight: '600' },
  aqiScale: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 6,
    gap: 4,
  },
  aqiBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D8D8D8',
  },
  aqiBarActive: { backgroundColor: '#FFC107' },
  aqiBarPast: { backgroundColor: '#8BC34A' },
  aqiDesc: { fontSize: 12, color: '#777', marginTop: 4 },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8, color: '#444' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowLabel: { fontSize: 13, color: '#555' },
  rowValue: { fontSize: 13, fontWeight: '600', color: '#333' },
  bulletRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  bulletText: { marginLeft: 8, fontSize: 13, color: '#555' },
});
