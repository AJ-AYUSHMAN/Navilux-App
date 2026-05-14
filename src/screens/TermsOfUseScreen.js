import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

export default function TermsOfUseScreen({ navigation }) {
  const { theme, isDarkMode } = useContext(ThemeContext);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Terms of Use</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, { color: theme.subText }]}>Last Updated: May 2026</Text>

        <Text style={[styles.introduction, { color: theme.text }]}>
          Please read these Terms of Use ("Terms", "Terms of Use") carefully before using the Navilux mobile application (the "Service") operated by Navilux Developers ("us", "we", or "our"). Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Acceptance of Terms</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Description of Service</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Navilux provides localized travel assistance, including AI-powered city analysis and travel insights, route planning, map functionality, weather updates, air quality monitoring, network coverage information, and a Destination Alert System that uses background location monitoring to notify users when they are nearing a selected geographical location.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>3. User Accounts & Responsibilities</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Accuracy of Services and Third-Party Data</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Navilux relies on the GPS hardware in your mobile device and various third-party APIs (such as Ola Maps API, Gemini API, OpenWeather API, Geoapify API, GNews API, Pexels API, and Google Firebase) to provide features like routing, map rendering, and AI insights. 
          {"\n\n"}
          <Text style={styles.bold}>Disclaimer:</Text> You acknowledge that GPS data, AI-generated insights, safety analysis, and weather conditions can be inaccurate due to environmental factors, hardware limitations, or network issues. The Service is provided for informational purposes only. The Destination Alert System is a convenience feature and should <Text style={styles.bold}>not</Text> be relied upon as a foolproof method for waking you up. We are not responsible if an alarm fails to trigger, or for any decisions made based on the provided travel and safety insights. Users should independently verify important travel, safety, or emergency-related information.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Intellectual Property</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          The Service and its original content, features, and functionality are and will remain the exclusive property of Navilux Developers and its licensors. The Service is protected by copyright, trademark, and other laws.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>6. Links To Other Web Sites</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Our Service may display external websites or services using WebView technology and contain links to third-party web sites that are not owned or controlled by us. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party web sites or services.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>7. Limitation of Liability</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          In no event shall Navilux, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>8. Termination</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>9. Changes</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
        </Text>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  backButton: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 20 },
  lastUpdated: { fontSize: 13, marginBottom: 20, fontStyle: 'italic' },
  introduction: { fontSize: 15, lineHeight: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 15, marginBottom: 10 },
  paragraph: { fontSize: 15, lineHeight: 24, marginBottom: 15 },
  bold: { fontWeight: '700' },
  footer: { height: 60 },
});
