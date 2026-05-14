// src/screens/NewsScreen.js
import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GNEWS_API_KEY } from '@env'; // 🔥 make sure to add GNEWS_API_KEY in .env
import { ThemeContext } from '../context/ThemeContext';
import * as Haptics from 'expo-haptics';

const API_KEY = GNEWS_API_KEY; // 🔥 replace

export default function NewsScreen({ navigation }) {
  const { theme, isDarkMode, hapticsEnabled } = useContext(ThemeContext);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const lastVisibleIndex = useRef(0);
  const hapticsRef = useRef(hapticsEnabled);

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => { hapticsRef.current = hapticsEnabled; }, [hapticsEnabled]);

  const fetchNews = async () => {
    try {
      const res = await fetch(
        `https://gnews.io/api/v4/search?q=india&lang=en&country=in&max=10&apikey=${API_KEY}`
      );

      const data = await res.json();

      setNews(data.articles); // ✅ IMPORTANT
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = (item) => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('NewsDetails', { article: item });
  };

  const handleRefresh = useCallback(async () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRefreshing(true);
    try {
      const res = await fetch(
        `https://gnews.io/api/v4/search?q=india&lang=en&country=in&max=10&apikey=${API_KEY}`
      );
      const data = await res.json();
      setNews(data.articles);
    } catch (err) {
      console.log(err);
    } finally {
      setRefreshing(false);
    }
  }, [hapticsEnabled]);

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

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isDarkMode ? '#1E1E2D' : '#FFFFFF', borderColor: isDarkMode ? '#333' : '#E5E5E5', borderWidth: 1 }]}
      activeOpacity={0.85}
      onPress={() => handlePress(item)}
    >
      <Image
        source={{
          uri:
            item.image ||
            'https://via.placeholder.com/300x150.png?text=No+Image',
        }}
        style={styles.image}
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.overlay}
      />

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={3}>
          {item.title}
        </Text>
        
        <View style={styles.sourceRow}>
          <Ionicons name="newspaper-outline" size={14} color="#EAF7FF" style={{ marginRight: 6 }} />
          <Text style={styles.source} numberOfLines={1}>
            {item.source?.name || 'Unknown Source'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.text }]}>Latest News</Text>

        <Ionicons name="newspaper-outline" size={22} color={theme.text} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : (
        <FlatList
          data={news}
          keyExtractor={(item) => item.url}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
              progressBackgroundColor={theme.card}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    paddingTop: 40,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  card: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  image: {
    width: '100%',
    height: 240,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  cardContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  source: {
    fontSize: 11,
    color: '#EAF7FF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});