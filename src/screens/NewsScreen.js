// src/screens/NewsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GNEWS_API_KEY } from '@env'; // 🔥 make sure to add GNEWS_API_KEY in .env

const API_KEY = GNEWS_API_KEY; // 🔥 replace

export default function NewsScreen({ navigation }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

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
    navigation.navigate('NewsDetails', { article: item });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
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

      <View style={styles.overlay} />

      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>

      <Text style={styles.source}>
        {item.source?.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.title}>Latest News</Text>

        <Ionicons name="newspaper-outline" size={22} color="#333" />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#7EC7FF" />
      ) : (
        <FlatList
          data={news}
          keyExtractor={(item) => item.url}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#ddd',

    // ✨ shadow
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  image: {
    width: '100%',
    height: 170,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  cardTitle: {
    position: 'absolute',
    left: 16,
    bottom: 36,
    right: 16,
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  source: {
    position: 'absolute',
    left: 16,
    bottom: 12,
    fontSize: 12,
    color: '#EAF7FF',
  },
});