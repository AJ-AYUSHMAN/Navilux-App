import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import {WEATHER_API_KEY as OPENWEATHER_API_KEY} from '@env';
import { ThemeContext } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';


export default function HomeScreen({ navigation }) {
  const { isDarkMode, theme, hapticsEnabled, isModernUI } = useContext(ThemeContext);
  const [city, setCity] = useState('');
  const [displayCity, setDisplayCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [aqi, setAqi] = useState(null);
  const [oxygen, setOxygen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [coords, setCoords] = useState(null);
  const [randomImageId, setRandomImageId] = useState(Date.now());
  const [imageError, setImageError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const lastSnapIndex = React.useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRandomImageId(Date.now());
      setImageError(false); // Reset error state to try fetching the new image
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

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
        setCoords({ latitude, longitude });

        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
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
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      const weatherJson = await weatherRes.json();
      if (weatherJson.cod !== 200) throw new Error(weatherJson.message || 'City not found');
      
      setWeather(weatherJson);
      setDisplayCity(weatherJson.name);
      setCoords({ latitude: weatherJson.coord.lat, longitude: weatherJson.coord.lon });
      await fetchAqi(weatherJson.coord.lat, weatherJson.coord.lon);
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
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      const weatherJson = await weatherRes.json();
      setWeather(weatherJson);
      setDisplayCity(cityName || weatherJson.name);
      setCoords({ latitude: lat, longitude: lon });
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

  const handleRefresh = useCallback(async () => {
    try {
      if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setRefreshing(true);
      setError(null);
      setRandomImageId(Date.now());
      setImageError(false);

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setRefreshing(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      setCoords({ latitude, longitude });

      const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
      const detectedCity = geo[0]?.city || geo[0]?.region || 'Unknown Location';
      setCity(detectedCity);
      setDisplayCity(detectedCity);

      await fetchAllDataByCoords(latitude, longitude, detectedCity);
    } catch (e) {
      console.log(e);
      setError('Could not refresh data');
    } finally {
      setRefreshing(false);
    }
  }, [hapticsEnabled]);

  // Haptic on metric card press
  const handleMetricPress = useCallback((screen, params) => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(screen, params);
  }, [navigation, hapticsEnabled]);

  // Haptic on horizontal scroll snap
  const CARD_WIDTH = 97; // 85 width + 12 margin
  const handleMetricsScroll = useCallback((e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const snapIndex = Math.round(offsetX / CARD_WIDTH);
    if (snapIndex !== lastSnapIndex.current && snapIndex >= 0) {
      lastSnapIndex.current = snapIndex;
      if (hapticsEnabled) Haptics.selectionAsync();
    }
  }, [hapticsEnabled]);

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

  const bgGradient = isDarkMode 
    ? ['#0F172A', '#1E293B', '#334155']
    : ['#E0E7FF', '#F8FAFC', '#DBEAFE'];

  const glassCardStyle = isModernUI ? {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1.5,
    borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.8)',
    borderLeftColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.6)',
    borderRightColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.15)',
    borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.15)',
    shadowColor: isDarkMode ? '#000' : '#475569',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: isDarkMode ? 0.4 : 0.15,
    shadowRadius: 20,
    elevation: 0,
  } : {};

  const getCardStyle = (baseStyle) => {
    return [
      baseStyle,
      isModernUI ? glassCardStyle : { backgroundColor: theme.card, borderWidth: isDarkMode ? 1 : 0, borderColor: theme.border }
    ];
  };

  const Container = isModernUI ? LinearGradient : View;
  const containerProps = isModernUI ? { colors: bgGradient, style: styles.container } : { style: [styles.container, { backgroundColor: theme.background }] };

  return (
    <Container {...containerProps}>
      <View style={styles.header}>
        <Image source={isDarkMode ? require('../../assets/splash-logo2.png') : require('../../assets/splash-logo.png')} style={styles.logo} resizeMode="contain" />
        <TouchableOpacity style={styles.profileIcon} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-circle-outline" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, getCardStyle({})]}>
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search your dream destination"
          placeholderTextColor={theme.subText}
          value={city}
          onChangeText={setCity}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
            progressBackgroundColor={theme.card}
          />
        }
      >
        <TouchableOpacity
          style={getCardStyle(styles.locationCard)}
          activeOpacity={0.8}
          onPress={() => {
            if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Map', { city: displayCity });
          }}
        >
          <View style={styles.locationLeft}>
            <Text style={[styles.locationLabel, { color: theme.subText }]}>Your location</Text>
            <Text style={[styles.locationCity, { color: theme.text }]} numberOfLines={1}>{displayCity || '—'}</Text>
            <View style={[styles.mapPreview, getCardStyle({})]}>
              <Image source={isDarkMode ? require('../../assets/maps_preview_dark.png') : require('../../assets/maps_preview.png')} style={StyleSheet.absoluteFillObject} />
              <View style={[styles.glassOverlay, { backgroundColor: isDarkMode ? 'rgba(30,30,30,0.35)' : 'rgba(255,255,255,0.35)' }]} />
              <View style={styles.mapPreviewContent}>
                <Ionicons name="map" size={24} color={isDarkMode ? '#FFF' : '#333'} />
                <Text style={[styles.mapText, { color: isDarkMode ? '#FFF' : '#333' }]}>Map View</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.weatherCard, isModernUI ? {
              backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(20, 107, 174, 0.15)',
              borderWidth: 1.5, 
              borderTopColor: isDarkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.4)',
              borderLeftColor: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.3)',
              borderRightColor: 'rgba(59, 130, 246, 0.05)',
              borderBottomColor: 'rgba(59, 130, 246, 0.05)',
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
            } : { backgroundColor: isDarkMode ? '#1e293b' : '#E8F4FD' }]}
            activeOpacity={0.8}
            onPress={() => {
              if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Weather', { weather, aqi });
            }}
          >
            {weather?.weather?.[0]?.icon ? (
              <Image source={{ uri: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png` }} style={styles.weatherIcon} />
            ) : (
              <Ionicons name="partly-sunny" size={40} color="#146baeff" style={{ marginBottom: 4 }} />
            )}
            <Text style={[styles.weatherTemp, { color: theme.text }]}>{tempDisplay}</Text>
            <Text style={[styles.weatherDesc, { color: theme.subText }]} numberOfLines={1}>{weather?.weather?.[0]?.main || 'Weather'}</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsRow} onScroll={handleMetricsScroll} scrollEventThrottle={16}>
          <TouchableOpacity style={getCardStyle(styles.metricCard)} activeOpacity={0.7} onPress={() => handleMetricPress('AqiDetails', { aqi })}>
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#172554' : '#E3F2FD' }]}>
              <Ionicons name="leaf" size={20} color="#146baeff" />
            </View>
            <Text style={[styles.metricLabel, { color: theme.subText }]}>AQI</Text>
            <Text style={[styles.metricValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>{aqiLabel()}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={getCardStyle(styles.metricCard)} activeOpacity={0.7} onPress={() => handleMetricPress('CityAnalysis', { city: displayCity })}>
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#4c1d95' : '#EDE9FE' }]}>
              <Ionicons name="analytics" size={20} color="#8B5CF6" />
            </View>
            <Text style={[styles.metricLabel, { color: theme.subText }]}>Analysis</Text>
            <Text style={[styles.metricValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>City Report</Text>
          </TouchableOpacity>

          <TouchableOpacity style={getCardStyle(styles.metricCard)} activeOpacity={0.7} onPress={() => handleMetricPress('DestinationAlert')}>
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#1e3a8a' : '#DBEAFE' }]}>
              <Ionicons name="alarm" size={20} color="#3B82F6" />
            </View>
            <Text style={[styles.metricLabel, { color: theme.subText }]}>Alerts</Text>
            <Text style={[styles.metricValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>Wake Up</Text>
          </TouchableOpacity>

          <TouchableOpacity style={getCardStyle(styles.metricCard)} activeOpacity={0.7} onPress={() => handleMetricPress('TripPlanner')}>
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#064e3b' : '#D1FAE5' }]}>
              <Ionicons name="calendar" size={20} color="#10B981" />
            </View>
            <Text style={[styles.metricLabel, { color: theme.subText }]}>Planner</Text>
            <Text style={[styles.metricValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>AI Trip</Text>
          </TouchableOpacity>

          <TouchableOpacity style={getCardStyle(styles.metricCard)} activeOpacity={0.7} onPress={() => handleMetricPress('Network', { city: displayCity })}>
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#3b0764' : '#F3E5F5' }]}>
              <Ionicons name="cellular" size={20} color="#BA68C8" />
            </View>
            <Text style={[styles.metricLabel, { color: theme.subText }]}>Network</Text>
            <Text style={[styles.metricValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>Info</Text>
          </TouchableOpacity>

          <TouchableOpacity style={getCardStyle(styles.metricCard)} activeOpacity={0.7} onPress={() => handleMetricPress('Oxygen', { oxygen })}>
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#164e63' : '#E0F7FA' }]}>
              <Ionicons name="water" size={20} color="#4DD0E1" />
            </View>
            <Text style={[styles.metricLabel, { color: theme.subText }]}>Oxygen</Text>
            <Text style={[styles.metricValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>{oxygen || 'N/A'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={getCardStyle(styles.metricCard)} activeOpacity={0.7} onPress={() => handleMetricPress('Crime', { city: displayCity })}>
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#7f1d1d' : '#FFEBEE' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#E57373" />
            </View>
            <Text style={[styles.metricLabel, { color: theme.subText }]}>Crime</Text>
            <Text style={[styles.metricValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>Data</Text>
          </TouchableOpacity>

          

          <TouchableOpacity style={getCardStyle(styles.metricCard)} activeOpacity={0.7} onPress={() => handleMetricPress('Train')}>
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#422006' : '#FFF3E0' }]}>
              <Ionicons name="train" size={20} color="#FF9800" />
            </View>
            <Text style={[styles.metricLabel, { color: theme.subText }]}>Train</Text>
            <Text style={[styles.metricValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>Status</Text>
          </TouchableOpacity>

          <TouchableOpacity style={getCardStyle(styles.metricCard)} activeOpacity={0.7} onPress={() => handleMetricPress('Ola')}>
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#064e3b' : '#D1FAE5' }]}>
              <Ionicons name="car" size={20} color="#10B981" />
            </View>
            <Text style={[styles.metricLabel, { color: theme.subText }]}>Ola</Text>
            <Text style={[styles.metricValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>Book Cab</Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity style={getCardStyle(styles.newsCard)} activeOpacity={0.8} onPress={() => {
          if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('News', { city: displayCity });
        }}>
          <View style={styles.newsContent}>
            <Text style={[styles.newsTitle, { color: theme.text }]}>What’s happening in your area?</Text>
            <Text style={[styles.newsSubtitle, { color: theme.subText }]}>Tap to view news</Text>
          </View>
          <Ionicons name="newspaper-outline" size={32} color="#146baeff" />
        </TouchableOpacity>

        <TouchableOpacity style={getCardStyle(styles.exploreCard)} activeOpacity={0.8} onPress={() => {
          if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('Explore', { city: displayCity });
        }}>
          <Image 
            source={imageError ? require('../../assets/explore-placeholder.jpg') : { uri: `https://picsum.photos/400/300?random=${randomImageId}` }} 
            style={styles.exploreImage} 
            onError={() => setImageError(true)}
          />
          <View style={styles.exploreOverlay} />
          <View style={styles.exploreTextWrapper}>
            <Text style={styles.exploreText}>Explore</Text>
            <Text style={styles.exploreText}>Top Places</Text>
            <Text style={styles.exploreText}>around you</Text>
          </View>
        </TouchableOpacity>

        {loading && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#146baeff" /></View>}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  logo: { width: 130, height: 40 },
  profileIcon: { marginLeft: 'auto' },
  searchContainer: {
    flexDirection: 'row', marginHorizontal: 16, borderRadius: 24, alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8,
  },
  searchInput: { flex: 1, paddingVertical: 8, paddingRight: 8, fontSize: 14 },
  searchButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#146baeff', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  locationCard: {
    borderRadius: 24, padding: 16, flexDirection: 'row', marginBottom: 16,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
  },
  locationLeft: { flex: 2, justifyContent: 'center' },
  locationLabel: { fontSize: 14, marginBottom: 4 },
  locationCity: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  mapPreview: { height: 90, borderRadius: 16, overflow: 'hidden' },
  glassOverlay: { ...StyleSheet.absoluteFillObject },
  mapPreviewContent: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  previewMarker: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, elevation: 4 },
  mapText: { fontSize: 12, fontWeight: '700', marginTop: 4, textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2 },
  weatherCard: { flex: 1.5, marginLeft: 12, borderRadius: 20, justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  weatherIcon: { width: 60, height: 60 },
  weatherTemp: { fontSize: 26, fontWeight: '800' },
  weatherDesc: { fontSize: 13, marginTop: 2, fontWeight: '600', textTransform: 'capitalize' },
  metricsRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, paddingBottom: 5 },
  metricCard: {
    width: 85, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 4, marginRight: 12,
    alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
  },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  metricLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  metricValue: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  newsCard: {
    borderRadius: 24, padding: 24, marginTop: 16, elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, flexDirection: 'row', alignItems: 'center',
  },
  newsContent: { flex: 1 },
  newsTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  newsSubtitle: { fontSize: 13 },
  exploreCard: {
    marginTop: 20, borderRadius: 24, overflow: 'hidden', height: 200, elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10,
  },
  exploreImage: { width: '100%', height: '100%' },
  exploreOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  exploreTextWrapper: { position: 'absolute', left: 20, bottom: 30 },
  exploreText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  loadingOverlay: { marginTop: 10 },
  errorText: { marginTop: 10, color: 'red', textAlign: 'center' },
});
