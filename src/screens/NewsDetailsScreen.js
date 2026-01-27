// src/screens/NewsDetailsScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NewsDetailsScreen({ route }) {
  const { category, city } = route.params || {};
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{category?.title}</Text>
      <Text style={styles.subtitle}>City: {city}</Text>
      <Text style={styles.text}>
        Here you can later load real articles / API data for this category.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 12 },
  text: { fontSize: 14, color: '#444' },
});
