// src/screens/ExploreScreen.js
import React, { useEffect, useState, useContext, useRef } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';

import { GEOAPIFY_API_KEY as GEO_API_KEY, PEXELS_API_KEY } from '@env';
import { ThemeContext } from '../context/ThemeContext';
import { logScreenView, logAnalyticsEvent } from '../utils/analytics';
import * as Haptics from 'expo-haptics';

export default function ExploreScreen({ route, navigation }) {
  const { theme, isDarkMode, hapticsEnabled } = useContext(ThemeContext);
  const city = route?.params?.city || 'Phagwara';

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastVisibleIndex = useRef(0);
  const hapticsRef = useRef(hapticsEnabled);

  useEffect(() => { hapticsRef.current = hapticsEnabled; }, [hapticsEnabled]);

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

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const topIndex = viewableItems[0].index;
      if (topIndex !== lastVisibleIndex.current) {
        lastVisibleIndex.current = topIndex;
        if (hapticsRef.current) Haptics.selectionAsync();
      }
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  // 🔥 Card UI
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isDarkMode ? '#1E1E2D' : '#FFFFFF', borderColor: isDarkMode ? '#333' : '#E5E5E5', borderWidth: 1 }]}
      activeOpacity={0.85}
      onPress={() => {
        if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('ExploreDetails', { place: item, city });
      }}
    >
      <Image source={{ uri: item.image }} style={styles.image} />

      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
        style={styles.overlay}
      />

      <View style={styles.infoTop}>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>

      <View style={styles.infoBottom}>
        <Text style={styles.placeTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.placeSubtitle} numberOfLines={1}>
          {item.subtitle}
        </Text>
        <View style={styles.bottomRow}>
          {item.distance && (
            <View style={styles.metaBadge}>
              <Ionicons name="location" size={14} color={theme.primary} />
              <Text style={styles.metaText}>{item.distance}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
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
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
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
    paddingHorizontal: 20,
    marginBottom: 16,
    justifyContent: 'space-between',
  },

  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  image: {
    width: '100%',
    height: 260,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  infoTop: {
    position: 'absolute',
    top: 16,
    right: 16,
  },

  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backdropFilter: 'blur(10px)',
  },

  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },

  infoBottom: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },

  placeTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  placeSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },

  metaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});