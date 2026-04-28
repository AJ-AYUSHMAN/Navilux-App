import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import {WEATHER_API_KEY as OPENWEATHER_API_KEY} from '@env';

export default function HomeScreen({ navigation }) {
  const [city, setCity] = useState('');
  const [displayCity, setDisplayCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [aqi, setAqi] = useState(null);
  const [oxygen, setOxygen] = useState(null); // derived / placeholder
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get location & initial data
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = loc.coords;

        // reverse geocode to get city name
        const geo = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        const detectedCity = geo[0]?.city || geo[0]?.region || 'Unknown Location';
        setCity(detectedCity);
        setDisplayCity(detectedCity);

        await fetchAllDataByCoords(latitude, longitude, detectedCity);
      } catch (e) {
        console.log(e);
        setError('Could not fetch location');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchAllDataByCity = async (cityName) => {
    try {
      setLoading(true);
      setError(null);

      // Weather by city
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          cityName
        )}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      const weatherJson = await weatherRes.json();
      if (weatherJson.cod !== 200) {
        throw new Error(weatherJson.message || 'City not found');
      }

      setWeather(weatherJson);
      setDisplayCity(weatherJson.name);

      // Then AQI using coordinates from weather
      const { lat, lon } = weatherJson.coord;
      await fetchAqi(lat, lon);
    } catch (e) {
      console.log(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDataByCoords = async (lat, lon, cityName) => {
    try {
      setLoading(true);
      setError(null);

      // Weather by coords
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      const weatherJson = await weatherRes.json();
      setWeather(weatherJson);
      setDisplayCity(cityName || weatherJson.name);

      await fetchAqi(lat, lon);
    } catch (e) {
      console.log(e);
      setError('Could not load weather');
    } finally {
      setLoading(false);
    }
  };

  const fetchAqi = async (lat, lon) => {
    try {
      const aqiRes = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`
      );
      const aqiJson = await aqiRes.json();
      const aqiValue = aqiJson?.list?.[0]?.main?.aqi || null;
      setAqi(aqiValue);

      // OpenWeather air pollution gives components like O3; we’ll treat it as “oxygen level” placeholder
      const o3 = aqiJson?.list?.[0]?.components?.o3;
      setOxygen(o3 ? `${o3.toFixed(0)} μg/m³` : null);
    } catch (e) {
      console.log(e);
      setAqi(null);
      setOxygen(null);
    }
  };

  const handleSearch = () => {
    if (!city.trim()) return;
    fetchAllDataByCity(city.trim());
  };

  const temp = weather?.main?.temp;
  const tempDisplay = temp != null ? `${Math.round(temp)}°C` : '--';

  const aqiLabel = () => {
    if (!aqi) return 'N/A';
    if (aqi === 1) return 'Good';
    if (aqi === 2) return 'Fair';
    if (aqi === 3) return 'Moderate';
    if (aqi === 4) return 'Poor';
    if (aqi === 5) return 'Very Poor';
    return 'N/A';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/splash-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.profileIcon}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle-outline" size={28} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your dream destination"
          placeholderTextColor="#B0B0B0"
          value={city}
          onChangeText={setCity}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Location & weather block */}
        <TouchableOpacity
          style={styles.locationCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Map', { city: displayCity })}
        >
          <View style={styles.locationLeft}>
            <Text style={styles.locationLabel}>Your location</Text>
            <Text style={styles.locationCity}>{displayCity || '—'}</Text>
            {/* small placeholder map preview */}
            <View style={styles.mapPreview}>
              <Text style={styles.mapText}>Map preview</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.weatherCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Weather', { weather, aqi })}
          >
            <Text style={styles.weatherTemp}>{tempDisplay}</Text>
            <Text style={styles.weatherDesc}>
              {weather?.weather?.[0]?.main || 'Weather'}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Metrics row */}
        <View style={styles.metricsRow}>
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => navigation.navigate('AqiDetails', { aqi })}
          >
            <Text style={styles.metricLabel}>AQI</Text>
            <Text style={styles.metricValue}>{aqiLabel()}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => navigation.navigate('Network')}
          >
            <Text style={styles.metricLabel}>Network</Text>
            <Text style={styles.metricValue}>Info</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => navigation.navigate('Oxygen', { oxygen })}
          >
            <Text style={styles.metricLabel}>Oxygen Lvl.</Text>
            <Text style={styles.metricValue}>{oxygen || 'N/A'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => navigation.navigate('Crime')}
          >
            <Text style={styles.metricLabel}>Crime Rate</Text>
            <Text style={styles.metricValue}>Data</Text>
          </TouchableOpacity>
        </View>

        {/* News card */}
        <TouchableOpacity
          style={styles.newsCard}
          onPress={() => navigation.navigate('News', { city: displayCity })}
        >
          <View style={styles.newsContent}>
            <Text style={styles.newsTitle}>What’s happening in your area?</Text>
            <Text style={styles.newsSubtitle}>Tap to view local news</Text>
          </View>
        </TouchableOpacity>

        {/* Explore card */}
        <TouchableOpacity
          style={styles.exploreCard}
          onPress={() => navigation.navigate('Explore', { city: displayCity })}
        >
          <Image
            source={require('../../assets/explore-placeholder.jpg')}
            style={styles.exploreImage}
          />
          <View style={styles.exploreOverlay} />
          <View style={styles.exploreTextWrapper}>
            <Text style={styles.exploreText}>Explore</Text>
            <Text style={styles.exploreText}>Top Places</Text>
            <Text style={styles.exploreText}>around you</Text>
          </View>
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#7EC7FF" />
          </View>
        )}

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  logo: {
    width: 130,
    height: 40,
  },
  profileIcon: {
    marginLeft: 'auto',
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 24,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingRight: 8,
    fontSize: 14,
    color: '#444',
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7EC7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  locationCard: {
    backgroundColor: '#EDEDED',
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    marginBottom: 12,
  },
  locationLeft: {
    flex: 2,
  },
  locationLabel: {
    fontSize: 13,
    color: '#888',
  },
  locationCity: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  mapPreview: {
    height: 80,
    borderRadius: 14,
    backgroundColor: '#D7D7D7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    color: '#777',
    fontSize: 12,
  },
  weatherCard: {
    flex: 1.5,
    marginLeft: 10,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherTemp: {
    fontSize: 22,
    fontWeight: '700',
  },
  weatherDesc: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#777',
  },
  metricValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '700',
  },
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 30,
    marginTop: 14,
  },
  newsContent: {},
  newsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  newsSubtitle: {
    fontSize: 12,
    color: '#777',
  },
  exploreCard: {
    marginTop: 14,
    borderRadius: 22,
    overflow: 'hidden',
    height: 180,
  },
  exploreImage: {
    width: '100%',
    height: '100%',
  },
  exploreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  exploreTextWrapper: {
    position: 'absolute',
    left: 20,
    bottom: 30,
  },
  exploreText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  loadingOverlay: {
    marginTop: 10,
  },
  errorText: {
    marginTop: 10,
    color: 'red',
    textAlign: 'center',
  },
});
