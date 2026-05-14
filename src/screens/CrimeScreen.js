// src/screens/CrimeScreen.js
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DATA_API } from '@env';
import { ThemeContext } from '../context/ThemeContext';

const API_BASE = `https://script.google.com/macros/s/${DATA_API}/exec`;

// Map risk level strings to visual config
const RISK_CONFIG = {
  low: { color: '#4CAF50', icon: 'shield-checkmark', label: 'Low Risk', bars: 1 },
  moderate: { color: '#FF9800', icon: 'warning', label: 'Moderate Risk', bars: 2 },
  medium: { color: '#FF9800', icon: 'warning', label: 'Medium Risk', bars: 2 },
  high: { color: '#F44336', icon: 'alert-circle', label: 'High Risk', bars: 3 },
  'very high': { color: '#B71C1C', icon: 'skull', label: 'Very High Risk', bars: 4 },
};

export default function CrimeScreen({ route }) {
  const { city } = route?.params || {};
  const { isDarkMode, theme } = useContext(ThemeContext);

  const [crimeData, setCrimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCrimeData();
  }, [city]);

  const fetchCrimeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API_BASE);
      const json = await res.json();

      const dataArray = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : null);

      if (!dataArray) {
        setCrimeData(null);
        setError('Invalid data format received from crime API.');
        setLoading(false);
        return;
      }

      // Find the matching city entry (case-insensitive)
      const searchCity = (city || '').trim().toLowerCase();
      const match = dataArray.find(
        (item) => item.City && item.City.trim().toLowerCase() === searchCity
      );

      if (match) {
        setCrimeData(match);
      } else {
        setCrimeData(null);
        setError('No crime data available for this city.');
      }
    } catch (e) {
      console.log('Crime API Error:', e);
      setError('Failed to fetch crime data.');
    } finally {
      setLoading(false);
    }
  };

  const riskLevel = crimeData?.['Risk Level'] || '';
  const riskKey = riskLevel.trim().toLowerCase();
  const riskInfo = RISK_CONFIG[riskKey] || { color: '#9E9E9E', icon: 'help-circle', label: riskLevel || 'Unknown', bars: 0 };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text style={[styles.title, { color: theme.text }]}>Crime Overview</Text>
      <Text style={[styles.city, { color: theme.subText }]}>{city || 'Your area'}</Text>

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loaderText, { color: theme.subText }]}>
            Analysing safety data…
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

      {!loading && crimeData && (
        <>
          {/* Risk level card */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Risk Level</Text>
            <View style={styles.riskRow}>
              <View style={[styles.riskBadge, { backgroundColor: riskInfo.color + '20' }]}>
                <Ionicons name={riskInfo.icon} size={28} color={riskInfo.color} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[styles.riskValue, { color: riskInfo.color }]}>{riskInfo.label}</Text>
                <Text style={[styles.smallText, { color: theme.subText }]}>
                  Based on reported data for {city}
                </Text>
              </View>
            </View>

            {/* Risk bar indicator */}
            <View style={styles.riskBarContainer}>
              {[1, 2, 3, 4].map((v) => (
                <View
                  key={v}
                  style={[
                    styles.riskBarSegment,
                    { backgroundColor: isDarkMode ? '#333' : '#E0E0E0' },
                    v <= riskInfo.bars && { backgroundColor: riskInfo.color },
                  ]}
                />
              ))}
            </View>
            <View style={styles.riskLabelRow}>
              <Text style={[styles.riskLabelText, { color: theme.subText }]}>Low</Text>
              <Text style={[styles.riskLabelText, { color: theme.subText }]}>Very High</Text>
            </View>
          </View>
        </>
      )}

      {/* Common incidents — always visible */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Common Incidents</Text>
        <Row icon="warning-outline" label="Petty theft / pickpocketing" theme={theme} />
        <Row icon="car-outline" label="Vehicle break-ins" theme={theme} />
        <Row icon="home-outline" label="Residential burglary" theme={theme} />
      </View>

      {/* Safety tips — always visible */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Safety Tips</Text>
        <Text style={[styles.text, { color: theme.subText }]}>• Avoid poorly lit areas late at night.</Text>
        <Text style={[styles.text, { color: theme.subText }]}>• Keep valuables hidden when commuting.</Text>
        <Text style={[styles.text, { color: theme.subText }]}>• Share live location with trusted contacts.</Text>
        <Text style={[styles.text, { color: theme.subText }]}>• Save local emergency numbers in Navilux.</Text>
      </View>
    </ScrollView>
  );
}

function Row({ icon, label, theme }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color="#FF9800" />
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
  riskRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  riskBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskValue: { fontSize: 22, fontWeight: '700' },
  smallText: { fontSize: 12, marginTop: 2 },
  riskBarContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 4,
  },
  riskBarSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  riskLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  riskLabelText: { fontSize: 10 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { fontSize: 13, flex: 1 },
  section: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  text: { fontSize: 13, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  rowText: { marginLeft: 8, fontSize: 13 },
});
