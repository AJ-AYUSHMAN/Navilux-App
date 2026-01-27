// src/screens/ExploreScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PLACES = [
  {
    id: '1',
    title: 'Sunrise Viewpoint',
    subtitle: 'Best spot for morning hikes',
    distance: '3.2 km',
    rating: 4.7,
    image: require('../../assets/explore1.jpg'),
  },
  {
    id: '2',
    title: 'Canyon Trail',
    subtitle: 'Popular trekking route',
    distance: '7.5 km',
    rating: 4.5,
    image: require('../../assets/explore2.jpg'),
  },
  {
    id: '3',
    title: 'Lakeside Camp',
    subtitle: 'Perfect for a weekend camp',
    distance: '12 km',
    rating: 4.8,
    image: require('../../assets/explore3.jpg'),
  },
];

export default function ExploreScreen({ route, navigation }) {
  const city = route?.params?.city || 'Your area';

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={item.image} style={styles.image} />
      <View style={styles.overlay} />

      <View style={styles.infoTop}>
        <Text style={styles.placeTitle}>{item.title}</Text>
        <Text style={styles.placeSubtitle}>{item.subtitle}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color="#fff" />
            <Text style={styles.metaText}>{item.distance}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={14} color="#FFD75E" />
            <Text style={styles.metaText}>{item.rating}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.detailsBtn}
        onPress={() =>
          navigation.navigate('ExploreDetails', { place: item, city })
        }
      >
        <Text style={styles.detailsText}>Get Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#555" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Explore places around {city}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={PLACES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDEDED', paddingTop: 40 },
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
    left: 18,
    top: 16,
    right: 18,
  },
  placeTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  placeSubtitle: {
    color: '#f4f4f4',
    fontSize: 13,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  detailsBtn: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#000',
  },
  detailsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
