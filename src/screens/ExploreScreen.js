// src/screens/ExploreScreen.js
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GEOAPIFY_API_KEY as GEO_API_KEY, PEXELS_API_KEY } from '@env';
import { ThemeContext } from '../context/ThemeContext';
import { logScreenView, logAnalyticsEvent } from '../utils/analytics';

export default function ExploreScreen({ route, navigation }) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const city = route?.params?.city || 'Phagwara';

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logScreenView('ExploreScreen', 'ExploreScreen');
    logAnalyticsEvent('explore_places', { city_name: city });
    fetchPlaces();
  }, []);

  // 🔥 Get coordinates safely
  const getCoordinates = async () => {
    try {
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${city}&apiKey=${GEO_API_KEY}`
      );

      const data = await res.json();

      if (!data.features || data.features.length === 0) {
        return null;
      }

      const { lat, lon } = data.features[0].properties;
      return { lat, lon };

    } catch (err) {
      console.log(err);
      return null;
    }
  };

  // 🔥 Fetch Pexels Image
  const fetchPexelsImage = async (placeName, cityName) => {
    try {
      if (!PEXELS_API_KEY) return null;
      
      let res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(placeName + ' ' + cityName)}&per_page=1`, {
        headers: { Authorization: PEXELS_API_KEY }
      });
      let data = await res.json();

      if (!data.photos || data.photos.length === 0) {
        res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(cityName + ' city landmark')}&per_page=15`, {
          headers: { Authorization: PEXELS_API_KEY }
        });
        data = await res.json();
      }
      
      if (!data.photos || data.photos.length === 0) {
        res = await fetch(`https://api.pexels.com/v1/search?query=beautiful travel destination&per_page=15`, {
          headers: { Authorization: PEXELS_API_KEY }
        });
        data = await res.json();
      }

      if (data.photos && data.photos.length > 0) {
        const randomPhoto = data.photos[Math.floor(Math.random() * data.photos.length)];
        return randomPhoto.src.large;
      }
    } catch (error) {
      console.log("Pexels API Error:", error);
    }
    return null;
  };

  // 🔥 Fetch places
  const fetchPlaces = async () => {
    try {
      const coords = await getCoordinates();

      if (!coords) {
        setPlaces([]);
        return;
      }

      let res = await fetch(
        `https://api.geoapify.com/v2/places?categories=tourism,leisure,natural&filter=circle:${coords.lon},${coords.lat},20000&limit=10&apiKey=${GEO_API_KEY}`
      );

      let data = await res.json();

      // fallback
      if (!data.features || data.features.length === 0) {
        res = await fetch(
          `https://api.geoapify.com/v2/places?categories=tourism&filter=circle:${coords.lon},${coords.lat},50000&limit=10&apiKey=${GEO_API_KEY}`
        );

        data = await res.json();
      }

      if (!data.features || data.features.length === 0) {
        setPlaces([]);
        return;
      }

      const formattedPromises = data.features.map(async (item, index) => {
        const p = item.properties;
        const title = p.name || p.address_line1 || "Unknown Place";
        const subtitle = p.address_line2 || p.city || city;
        
        const pexelsImage = await fetchPexelsImage(title, city);

        return {
          id: index.toString(),
          title: title,
          subtitle: subtitle,
          distance: p.distance
            ? (p.distance / 1000).toFixed(1) + " km"
            : null,
          // 🔥 fallback to picsum if Pexels fails
          image: pexelsImage || `https://picsum.photos/400/300?random=${index + 1}`,
          rating: (Math.random() * (5 - 4) + 4).toFixed(1),
        };
      });

      const formatted = await Promise.all(formattedPromises);
      setPlaces(formatted);

    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Card UI
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />

      <View style={styles.overlay} />

      <View style={styles.infoTop}>
        <Text style={styles.placeTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.placeSubtitle} numberOfLines={1}>
          {item.subtitle}
        </Text>
      </View>

      <View style={styles.bottomRow}>
        {item.distance && <Text style={styles.metaText}>📍 {item.distance}</Text>}
        <Text style={styles.metaText}>⭐ {item.rating}</Text>
      </View>

      <TouchableOpacity
        style={styles.detailsBtn}
        onPress={() =>
          navigation.navigate('ExploreDetails', { place: item, city })
        }
      >
        <Text style={styles.detailsText}>Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.topTitle, { color: theme.text }]}>
          Explore places around {city}
        </Text>

        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : places.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.subText }]}>
          No places found nearby
        </Text>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDEDED',
    paddingTop: 40,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
    justifyContent: 'space-between',
  },

  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
    marginHorizontal: 8,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#777',
  },

  card: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#000',
  },

  image: {
    width: '100%',
    height: 220,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  infoTop: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },

  placeTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  placeSubtitle: {
    color: '#eee',
    fontSize: 13,
    marginTop: 4,
  },

  bottomRow: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    gap: 12,
  },

  metaText: {
    color: '#fff',
    fontSize: 12,
  },

  detailsBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  detailsText: {
    color: '#fff',
    fontWeight: '600',
  },
});