// src/screens/FaqScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const FAQ = [
  {
    q: 'How does Navilux get weather data?',
    a: 'Weather and AQI are fetched from the OpenWeather API.',
  },
  {
    q: 'Can I use Navilux offline?',
    a: 'Some info is cached, but live data (weather, news) needs internet.',
  },
  {
    q: 'How is my location used?',
    a: 'Your device location is used to show local insights; it is not shared publicly.',
  },
];

export default function FaqScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>FAQ & Support</Text>
      {FAQ.map((item, idx) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.q}>{item.q}</Text>
          <Text style={styles.a}>{item.a}</Text>
        </View>
      ))}

      <Text style={styles.text}>
        For more help, you can add a contact form or support email here.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDEDED' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 10, color: '#333' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  q: { fontSize: 14, fontWeight: '600', marginBottom: 4, color: '#444' },
  a: { fontSize: 13, color: '#555' },
  text: { fontSize: 12, color: '#777', marginTop: 10 },
});
