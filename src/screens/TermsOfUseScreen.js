import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TermsOfUseScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Use</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: May 2026</Text>

        <Text style={styles.sectionTitle}>1. Welcome to Navilux</Text>
        <Text style={styles.paragraph}>
          By accessing or using the Navilux mobile application, you agree to be bound by these Terms of Use. If you do not agree with all of these terms, please do not use the app.
        </Text>

        <Text style={styles.sectionTitle}>2. Use of the Service</Text>
        <Text style={styles.paragraph}>
          Navilux provides travel insights, safety analytics, and localized data. Our services are intended for personal, non-commercial use. You agree not to misuse the app or attempt to access our data via unauthorized methods.
        </Text>

        <Text style={styles.sectionTitle}>3. Accuracy of Information</Text>
        <Text style={styles.paragraph}>
          While we strive to provide accurate and up-to-date information regarding weather, crime rates, and travel conditions, Navilux relies on third-party APIs. We cannot guarantee the absolute accuracy or real-time precision of all data provided.
        </Text>

        <Text style={styles.sectionTitle}>4. User Accounts</Text>
        <Text style={styles.paragraph}>
          To unlock certain features, you must create an account. You are responsible for safeguarding your password and for all activities that occur under your account.
        </Text>

        <Text style={styles.sectionTitle}>5. Modifications</Text>
        <Text style={styles.paragraph}>
          Navilux reserves the right to modify or replace these Terms at any time. We will provide notice of significant changes within the app.
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
