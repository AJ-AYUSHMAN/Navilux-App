// src/screens/TravelPreferencesScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const TAGS = ['Mountains', 'Beaches', 'Cities', 'Road trips', 'Culture', 'Food'];

export default function TravelPreferencesScreen() {
  const [selected, setSelected] = useState(['Mountains', 'Cities']);

  const toggle = (tag) => {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    // TODO: save in Firestore, use to personalize Explore & News
    console.log('Prefs:', selected);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Travel preferences</Text>
      <Text style={styles.text}>
        Choose what you like so Navilux can suggest better places and news.
      </Text>

      <View style={styles.tagsWrapper}>
        {TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.tag,
              selected.includes(tag) && styles.tagSelected,
            ]}
            onPress={() => toggle(tag)}
          >
            <Text
              style={[
                styles.tagText,
                selected.includes(tag) && styles.tagTextSelected,
              ]}
            >
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleSave}>
        <Text style={styles.btnText}>Save preferences</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#EDEDED' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8, color: '#333' },
  text: { fontSize: 13, color: '#555', marginBottom: 12 },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  tagSelected: { backgroundColor: '#7EC7FF' },
  tagText: { fontSize: 13, color: '#444' },
  tagTextSelected: { color: '#fff' },
  btn: {
    marginTop: 10,
    backgroundColor: '#7EC7FF',
    borderRadius: 22,
    alignItems: 'center',
    paddingVertical: 12,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
