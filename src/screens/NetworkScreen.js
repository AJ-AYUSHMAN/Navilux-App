// src/screens/NetworkScreen.js
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DATA_API } from '@env';
import { ThemeContext } from '../context/ThemeContext';

const API_BASE = `https://script.google.com/macros/s/${DATA_API}/exec`;

export default function NetworkScreen({ route }) {
  const { city } = route?.params || {};
  const { isDarkMode, theme } = useContext(ThemeContext);

  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNetworkData();
  }, [city]);

  const fetchNetworkData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API_BASE);
      const json = await res.json();

      // Find the matching city entry (case-insensitive)
      const searchCity = (city || '').trim().toLowerCase();
      const match = json.find(
        (item) => item.City && item.City.trim().toLowerCase() === searchCity
      );

      if (match) {
        setNetworkData(match);
      } else {
        setNetworkData(null);
        setError('No network data available for this city.');
      }
    } catch (e) {
      console.log('Network API Error:', e);
      setError('Failed to fetch network data.');
    } finally {
      setLoading(false);
    }
  };

  // Derive a signal strength from network coverage provider name (visual only)
  const getSignalBars = () => {
    if (!networkData) return 0;
    // Default to 3 bars for any known provider
    return 3;
  };

  const provider = networkData?.['Network Covrage'] || networkData?.['Network Coverage'] || '--';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text style={[styles.title, { color: theme.text }]}>Network Coverage</Text>
      <Text style={[styles.city, { color: theme.subText }]}>
        {city || 'Your area'} {networkData ? `• ${provider}` : ''}
      </Text>

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loaderText, { color: theme.subText }]}>
            Fetching network data…
          </Text>
        </View>
      )}

      {!loading && error && (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={22} color={theme.danger} />
            <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
          </View>
        </View>
      )}

      {!loading && networkData && (
        <>
          {/* Provider & signal card */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Primary Provider</Text>
            <View style={styles.providerRow}>
              <View style={[styles.providerBadge, { backgroundColor: isDarkMode ? '#1e3a5f' : '#E3F2FD' }]}>
                <Ionicons name="cellular" size={22} color="#4CAF50" />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.providerName, { color: theme.text }]}>{provider}</Text>
                <Text style={[styles.smallText, { color: theme.subText }]}>
                  More Than Average Coverage in {city || 'this area'}
                </Text>
              </View>
            </View>
          </View>

          {/* Signal strength card */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Signal Strength</Text>
            <View style={styles.bars}>
              {[1, 2, 3, 4].map((v) => (
                <View
                  key={v}
                  style={[
                    styles.bar,
                    { height: 8 + v * 6, backgroundColor: isDarkMode ? '#333' : '#DDD' },
                    v <= getSignalBars() && styles.barActive,
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.smallText, { color: theme.subText }]}>
              {getSignalBars() >= 3 ? 'Good coverage expected' : 'Limited coverage expected'}
            </Text>
          </View>
        </>
      )}

      {/* Tips section — always visible */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Tips</Text>
        <Row icon="cellular-outline" label="Move closer to open areas for better signal." theme={theme} />
        <Row icon="wifi-outline" label="Use Wi-Fi calling when indoor signal is weak." theme={theme} />
        <Row icon="settings-outline" label="Switch to automatic network selection." theme={theme} />
        <Row icon="download-outline" label="Download offline maps before you travel." theme={theme} />
      </View>
    </ScrollView>
  );
}

function Row({ icon, label, theme }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={theme.primary} />
      <Text style={[styles.rowText, { color: theme.subText }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', marginTop: 30 },
  city: { fontSize: 13, marginBottom: 10 },
  loaderContainer: { alignItems: 'center', marginTop: 40 },
  loaderText: { marginTop: 10, fontSize: 13 },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  providerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  providerBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerName: { fontSize: 18, fontWeight: '700' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 36, marginBottom: 8, gap: 6 },
  bar: {
    width: 10,
    borderRadius: 4,
  },
  barActive: { backgroundColor: '#4CAF50' },
  smallText: { fontSize: 12 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { fontSize: 13, flex: 1 },
  section: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  rowText: { marginLeft: 10, fontSize: 13, flex: 1 },
});
