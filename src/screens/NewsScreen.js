import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NEWS_CATEGORIES = [
  {
    id: 'city-news',
    title: 'City News',
    image: require('../../assets/news-city.jpg'),
  },
  {
    id: 'good-places',
    title: 'Good Places',
    image: require('../../assets/news-places.jpg'),
  },
  {
    id: 'new-train',
    title: 'New Train',
    image: require('../../assets/news-train.jpg'),
  },
  {
    id: 'climate',
    title: 'Climate',
    image: require('../../assets/news-climate.jpg'),
  },
];

export default function NewsScreen({ route, navigation }) {
  const city = route?.params?.city || 'Your city';

  const handlePress = (category) => {
    navigation.navigate('NewsDetails', { category, city });
  };

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#555" />
        </TouchableOpacity>
        <Text style={styles.title}>Explore</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {NEWS_CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => handlePress(item)}
          >
            <Image source={item.image} style={styles.image} />
            <View style={styles.overlay} />
            <Text style={styles.cardTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDEDED', paddingTop: 40 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 26,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#ccc',
  },
  image: {
    width: '100%',
    height: 150,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  cardTitle: {
    position: 'absolute',
    left: 20,
    top: 18,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
