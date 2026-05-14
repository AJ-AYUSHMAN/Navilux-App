import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { ThemeContext } from '../context/ThemeContext';
import DisclaimerModal from '../components/DisclaimerModal';

export default function TrainScreen({ navigation }) {
  const { isDarkMode, theme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('PNR');
  const [loading, setLoading] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showStatusDisclaimer, setShowStatusDisclaimer] = useState(false);

  const urls = {
    PNR: 'https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?locale=en',
    STATUS: 'https://www.railyatri.in/live-train-status'
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <DisclaimerModal
        visible={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        serviceName="Indian Railways"
        isDarkMode={isDarkMode}
      />

      <DisclaimerModal
        visible={showStatusDisclaimer}
        onClose={() => setShowStatusDisclaimer(false)}
        serviceName="RailYatri"
        isDarkMode={isDarkMode}
      />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Train Info</Text>
        </View>
        <TouchableOpacity style={styles.browserBtn} onPress={() => Linking.openURL(urls[activeTab])}>
          <Ionicons name="open-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'PNR' && { borderBottomColor: theme.primary }]}
          onPress={() => { setActiveTab('PNR'); setLoading(true); }}
        >
          <Text style={[styles.tabText, { color: activeTab === 'PNR' ? theme.primary : theme.subText }]}>PNR Enquiry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'STATUS' && { borderBottomColor: theme.primary }]}
          onPress={() => { setActiveTab('STATUS'); setLoading(true); setShowStatusDisclaimer(true); }}
        >
          <Text style={[styles.tabText, { color: activeTab === 'STATUS' ? theme.primary : theme.subText }]}>Live Status</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.webviewContainer}>
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}
        <WebView
          source={{ uri: urls[activeTab] }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 5, marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  browserBtn: { padding: 5 },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 16, fontWeight: '600' },
  webviewContainer: { flex: 1 },
  webview: { flex: 1 },
  loader: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -20 }, { translateY: -20 }], zIndex: 10 },
});
