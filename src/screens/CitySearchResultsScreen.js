// src/screens/CitySearchResultsScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function CitySearchResultsScreen({ route }) {
  const { city, weather, aqi } = route?.params || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Search results</Text>
      <Text style={styles.city}>{city}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weather snapshot</Text>
        <Text style={styles.text}>
          Temp: {weather?.main?.temp != null ? `${Math.round(weather.main.temp)}°C` : '--'}
        </Text>
        <Text style={styles.text}>
          Condition: {weather?.weather?.[0]?.description || '--'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Air quality</Text>
        <Text style={styles.text}>AQI: {aqi || '--'}</Text>
      </View>

      <Text style={styles.small}>
        Later you can add more cards here: popular places, news for this city,
        safety, etc.
      </Text>
    </ScrollView>
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
  text: { fontSize: 13, color: '#555', marginBottom: 4 },
  small: { fontSize: 12, color: '#777', marginTop: 4 },
});
