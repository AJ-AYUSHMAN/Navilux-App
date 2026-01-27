// src/screens/ExploreDetailsScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ExploreDetailsScreen({ route }) {
  const { place, city } = route.params || {};
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{place?.title}</Text>
      <Text>{place?.subtitle}</Text>
      <Text style={{ marginTop: 8 }}>City: {city}</Text>
      {/* later: show photos, map, reviews, etc. */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
});
