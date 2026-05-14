import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

export default function PrivacyPolicyScreen({ navigation }) {
  const { theme, isDarkMode } = useContext(ThemeContext);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Privacy Policy</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, { color: theme.subText }]}>Last Updated: May 2026</Text>

        <Text style={[styles.introduction, { color: theme.text }]}>
          Welcome to Navilux. Your privacy is important to us. This Privacy Policy explains how Navilux collects, uses, stores, and protects your information when you use our mobile application.
          {"\n\n"}By using Navilux, you agree to the practices described in this Privacy Policy.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Information We Collect</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          <Text style={styles.bold}>a) Location Information</Text>
          {"\n"}Navilux may collect your device's foreground and background location to provide:
          {"\n"}• Nearby places, route planning, and map navigation
          {"\n"}• City analysis, weather, AQI, and travel recommendations
          {"\n"}• <Text style={styles.bold}>Destination Alerts:</Text> If enabled, the App tracks your location in the background to calculate remaining distance and notify you when you near your destination. This tracking automatically stops once the alarm is triggered or manually turned off.
          {"\n\n"}<Text style={styles.bold}>b) Account Information</Text>
          {"\n"}When you sign in using Firebase Authentication or other login methods, we may collect:
          {"\n"}• Name
          {"\n"}• Email address
          {"\n"}• Profile photo
          {"\n\n"}<Text style={styles.bold}>c) Device & Usage Information</Text>
          {"\n"}We may automatically collect:
          {"\n"}• Device type
          {"\n"}• Operating system version
          {"\n"}• App performance and crash reports
          {"\n"}• Analytics data
          {"\n\n"}<Text style={styles.bold}>d) User Preferences & Trip Data</Text>
          {"\n"}Navilux may store travel preferences, theme settings, saved searches, and app personalization settings. Additionally, any custom Trip Plans you generate are saved to your account. You have full control over this data and can view, manage, or delete your saved trips and account data at any time.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>2. How We Use Your Information</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          We use collected information to:
          {"\n"}• Provide map and navigation services
          {"\n"}• Generate AI-powered city analysis and travel insights
          {"\n"}• Improve app functionality and user experience
          {"\n"}• Personalize recommendations and nearby place suggestions
          {"\n"}• Enhance security and prevent misuse
          {"\n"}• Analyze app performance and crashes
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Third-Party Services</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Navilux uses trusted third-party APIs and services to provide functionality. These services may process limited information according to their own privacy policies:
          {"\n"}• Google Firebase
          {"\n"}• OpenWeather API
          {"\n"}• Gemini API
          {"\n"}• Geoapify API
          {"\n"}• Ola Maps API
          {"\n"}• GNews API
          {"\n"}• Pexels API
          {"\n"}• Expo Services
          {"\n\n"}Navilux does not sell personal information to third parties.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>4. WebView Content</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Some sections of Navilux may display external websites or services using WebView technology. Navilux does not control the content, privacy practices, or policies of third-party websites displayed through WebView. Users are encouraged to review the privacy policies of those services separately.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Data Storage & Security</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          We implement reasonable technical and organizational measures to protect user data. However, no internet transmission or electronic storage method is completely secure. We continuously work to improve security and data protection.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>6. Permissions Used</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Navilux may request the following permissions:
          {"\n"}• <Text style={styles.bold}>Location Permission</Text> → For maps, navigation, and nearby places
          {"\n"}• <Text style={styles.bold}>Internet Access</Text> → For APIs and online services
          {"\n"}• <Text style={styles.bold}>Storage/Photos Permission</Text> → For profile image uploads
          {"\n"}• <Text style={styles.bold}>Notification Permission</Text> → For alerts and updates (if enabled)
          {"\n\n"}Permissions are requested only when required.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>7. Children's Privacy</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Navilux is not directed toward children under 13 years of age. We do not knowingly collect personal information from children.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>8. User Rights</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Users may:
          {"\n"}• Update account information
          {"\n"}• Remove profile information
          {"\n"}• Revoke app permissions from device settings
          {"\n"}• Stop using the application at any time
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>9. Changes to This Privacy Policy</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          We may update this Privacy Policy from time to time. Changes will be reflected by updating the "Last Updated" date. Continued use of Navilux after changes means acceptance of the updated policy.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>10. Contact Us</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          If you have questions regarding this Privacy Policy, you may contact:
          {"\n"}Developer: Ayushman Raj
          {"\n"}Email: ajayushmanraj@gmail.com
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>11. Disclaimer</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Navilux provides informational travel insights and AI-generated recommendations. Information such as safety analysis, AQI insights, weather conditions, travel suggestions, and route recommendations may not always be fully accurate or real-time. Users should independently verify important travel, safety, or emergency-related decisions.
          {"\n\n"}© 2026 Navilux. All Rights Reserved.
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
