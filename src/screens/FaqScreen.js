// src/screens/FaqScreen.js
import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

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

export default function FaqScreen({ navigation }) {
  const { theme, isDarkMode } = useContext(ThemeContext);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
           <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>FAQ & Support</Text>
      </View>
      
      {FAQ.map((item, idx) => (
        <View key={idx} style={[styles.card, { backgroundColor: theme.card, shadowColor: isDarkMode ? '#FFF' : '#000', borderWidth: isDarkMode ? 1 : 0, borderColor: theme.border }]}>
          <Text style={[styles.q, { color: theme.text }]}>{item.q}</Text>
          <Text style={[styles.a, { color: theme.subText }]}>{item.a}</Text>
        </View>
      ))}

      <Text style={[styles.text, { color: theme.subText }]}>
        For more help, you can contact us at support@navilux.com
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  backBtn: { marginRight: 8, marginLeft: -4 },
  title: { fontSize: 24, fontWeight: '800' },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  q: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  a: { fontSize: 14, lineHeight: 20 },
  text: { fontSize: 13, marginTop: 20, textAlign: 'center', fontStyle: 'italic' },
});
