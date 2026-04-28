import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ExploreDetailsScreen({ route, navigation }) {
  const { place, city } = route.params || {};

  if (!place) {
    return (
      <View style={styles.container}>
        <Text>No place data</Text>
      </View>
    );
  }

  const openMaps = () => {
    const query = encodeURIComponent(place.title + " " + city);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>

      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#000" />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Image */}
        <Image source={{ uri: place.image }} style={styles.image} />

        {/* Content */}
        <View style={styles.content}>

          <Text style={styles.title}>{place.title}</Text>

          <Text style={styles.subtitle}>{place.subtitle}</Text>

          {/* Meta */}
          <View style={styles.metaRow}>
            <Text style={styles.meta}>📍 {place.distance}</Text>
            <Text style={styles.meta}>⭐ {place.rating}</Text>
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>
            This is a beautiful place located in {city}. It is a great destination
            for travelers who enjoy exploring nature, culture, and local experiences.
          </Text>

          {/* Button */}
          <TouchableOpacity style={styles.button} onPress={openMaps}>
            <Text style={styles.buttonText}>Open in Google Maps</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },

  backBtn: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 10,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 20,
  },

  image: {
    width: '100%',
    height: 250,
  },

  content: {
    padding: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
  },

  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },

  metaRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 16,
  },

  meta: {
    fontSize: 13,
    color: '#444',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
  },

  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },

  button: {
    marginTop: 20,
    backgroundColor: '#7EC7FF',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});