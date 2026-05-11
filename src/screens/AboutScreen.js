// src/screens/AboutScreen.js
import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen({ navigation }) {
  const { theme, isDarkMode } = useContext(ThemeContext);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
           <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>About Navilux</Text>
      </View>

      <View style={styles.logoContainer}>
         <Image source={require('../../assets/splash-logo.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <Text style={[styles.text, { color: theme.text }]}>
        Navilux helps you understand a city's weather, air quality, safety,
        network coverage and interesting places, all in a single app.
      </Text>
      <Text style={[styles.text, { color: theme.text }]}>
        This is a student project / travel-assistant concept. You can expand
        this page with your story, team, credits and open-source libraries.
      </Text>

      <View style={[styles.section, { backgroundColor: theme.card, shadowColor: isDarkMode ? '#FFF' : '#000', borderWidth: isDarkMode ? 1 : 0, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Version</Text>
        <Text style={[styles.versionText, { color: theme.subText }]}>1.0.1 (Stable)</Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, shadowColor: isDarkMode ? '#FFF' : '#000', borderWidth: isDarkMode ? 1 : 0, borderColor: theme.border, marginTop: 15 }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Developer</Text>
        <Text style={[styles.versionText, { color: theme.subText }]}>Ayushman Raj</Text>
      </View>
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
  logoContainer: { alignItems: 'center', marginVertical: 30 },
  logo: { width: 200, height: 60 },
  text: { fontSize: 16, marginBottom: 15, lineHeight: 24 },
  section: {
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  versionText: { fontSize: 14, fontWeight: '500' },
});
