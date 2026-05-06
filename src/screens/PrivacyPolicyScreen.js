import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: May 2026</Text>

        <Text style={styles.sectionTitle}>1. Data Collection</Text>
        <Text style={styles.paragraph}>
          Navilux collects information to provide better services to our users. We may collect your name, email address, travel preferences, and location data (if you grant us permission) to personalize your experience.
        </Text>

        <Text style={styles.sectionTitle}>2. Use of Location Data</Text>
        <Text style={styles.paragraph}>
          We request background and foreground location access strictly to provide relevant, localized information (such as air quality, crime rates, and local news) for your immediate surroundings. We do not sell your location data.
        </Text>

        <Text style={styles.sectionTitle}>3. Third-Party Services</Text>
        <Text style={styles.paragraph}>
          Navilux utilizes third-party APIs (like Google Maps, OpenWeather, and Firebase) to process data. These services may collect information according to their own privacy policies. We do not control their tracking technologies.
        </Text>

        <Text style={styles.sectionTitle}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          Your account is secured via Firebase Authentication. We use industry-standard encryption protocols to protect your personal data and travel preferences stored in our databases.
        </Text>

        <Text style={styles.sectionTitle}>5. Your Rights</Text>
        <Text style={styles.paragraph}>
          You have the right to access, update, or delete your personal data. You can delete your account directly from the Profile Settings page at any time, which will permanently erase your data from our servers.
        </Text>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  backButton: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  content: { padding: 20 },
  lastUpdated: { fontSize: 13, color: '#888', marginBottom: 20, fontStyle: 'italic' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginTop: 15, marginBottom: 8 },
  paragraph: { fontSize: 15, color: '#555', lineHeight: 22, marginBottom: 10 },
  footer: { height: 40 },
});
