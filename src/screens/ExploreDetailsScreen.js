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
import { ThemeContext } from '../context/ThemeContext';
import { useContext } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

export default function ExploreDetailsScreen({ route, navigation }) {
  const { place, city } = route.params || {};
  const { isDarkMode, theme } = useContext(ThemeContext);

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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Floating Back Button */}
      <TouchableOpacity 
        style={[styles.backBtn, { backgroundColor: isDarkMode ? 'rgba(30,30,30,0.75)' : 'rgba(255,255,255,0.75)' }]} 
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Ionicons name="chevron-back" size={24} color={theme.text} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: place.image }} style={styles.image} />
          <LinearGradient
            colors={['transparent', theme.background]}
            style={styles.imageGradient}
          />
        </View>

        {/* Content Section (Overlaps Image) */}
        <View style={[styles.content, { backgroundColor: theme.background }]}>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: theme.text }]}>{place.title}</Text>
              <Text style={[styles.subtitle, { color: theme.subText }]}>{place.subtitle}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{place.rating}</Text>
            </View>
          </View>

          {/* Meta Info */}
          <View style={styles.metaRow}>
            {place.distance && (
              <View style={[styles.metaBadge, { backgroundColor: isDarkMode ? '#222' : '#F0F0F0' }]}>
                <Ionicons name="location" size={16} color={theme.primary} />
                <Text style={[styles.meta, { color: theme.text }]}>{place.distance}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
          <Text style={[styles.description, { color: theme.subText }]}>
            Discover the beauty of {place.title}, located in {city}. It is a highly recommended destination 
            for travelers looking to explore the natural surroundings, culture, and rich local experiences.
          </Text>

          {/* Action Button */}
          <TouchableOpacity 
            style={styles.buttonContainer} 
            onPress={openMaps}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#7EC7FF', theme.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Ionicons name="map-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Open in Google Maps</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    backdropFilter: 'blur(10px)',
  },

  imageContainer: {
    width: '100%',
    height: 400,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },

  content: {
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    minHeight: 500,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  titleContainer: {
    flex: 1,
    paddingRight: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },

  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },

  ratingText: {
    color: '#FFB800',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },

  metaRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },

  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },

  meta: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  description: {
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 32,
  },

  buttonContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#146baeff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});