// src/screens/WeatherScreen.js
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ScrollView,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { WEATHER_API_KEY as ENV_OPENWEATHER_KEY } from '@env';
import { ThemeContext } from '../context/ThemeContext';

const OPENWEATHER_API_KEY = ENV_OPENWEATHER_KEY;

export default function WeatherScreen({ route, navigation }) {
  const { isDarkMode } = useContext(ThemeContext);

  const { weather: passedWeather, aqi: passedAqi, city: cityParam, useCurrent } =
    route?.params || {};

  const [cityName, setCityName] = useState(
    passedWeather?.name || cityParam || (useCurrent ? 'Your location' : '')
  );
  const [current, setCurrent] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aqi, setAqi] = useState(passedAqi || null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchByCoords = async (lat, lon, friendlyName) => {
      try {
        setError(null);
        // Fetch current weather (by coords)
        const resCurr = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
        );
        const jsonCurr = await resCurr.json();
        if (jsonCurr.cod && jsonCurr.cod !== 200) {
          throw new Error(jsonCurr.message || 'Failed to load weather');
        }

        if (cancelled) return;
        setCurrent({
          temp: jsonCurr.main?.temp,
          feels_like: jsonCurr.main?.feels_like,
          pressure: jsonCurr.main?.pressure,
          humidity: jsonCurr.main?.humidity,
          wind_speed: jsonCurr.wind?.speed,
          visibility: jsonCurr.visibility,
          clouds: jsonCurr.clouds?.all ?? 0,
          uvi: null,
          sunrise: jsonCurr.sys?.sunrise,
          sunset: jsonCurr.sys?.sunset,
          weather: jsonCurr.weather,
        });

        setCityName(friendlyName || jsonCurr.name || cityName);

        // Forecast
        const resForecast = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
        );
        const jsonForecast = await resForecast.json();
        if (jsonForecast.cod && jsonForecast.cod !== '200') {
          console.warn('Forecast load warning:', jsonForecast);
        } else {
          setHourly(jsonForecast.list?.slice(0, 12) || []);

          const byDay = {};
          (jsonForecast.list || []).forEach((item) => {
            const dateStr = item.dt_txt.split(' ')[0];
            if (!byDay[dateStr]) {
              byDay[dateStr] = {
                dt: item.dt,
                max: item.main.temp,
                min: item.main.temp,
                icon: item.weather[0].icon,
              };
            } else {
              byDay[dateStr].max = Math.max(byDay[dateStr].max, item.main.temp);
              byDay[dateStr].min = Math.min(byDay[dateStr].min, item.main.temp);
            }
          });
          setDaily(Object.values(byDay).slice(0, 7));
        }

        // AQI
        const resAqi = await fetch(
          `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`
        );
        const jsonAqi = await resAqi.json();
        const val = jsonAqi?.list?.[0]?.main?.aqi ?? null;
        setAqi(val);
      } catch (e) {
        console.log('fetchByCoords error:', e);
        if (!cancelled) setError(e.message || 'Could not load weather');
      }
    };

    const loadForPassedWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        const lat = passedWeather.coord?.lat;
        const lon = passedWeather.coord?.lon;
        if (!lat || !lon) {
          setError('No coordinates in passed weather');
          return;
        }
        setCurrent({
          temp: passedWeather.main?.temp,
          feels_like: passedWeather.main?.feels_like,
          pressure: passedWeather.main?.pressure,
          humidity: passedWeather.main?.humidity,
          wind_speed: passedWeather.wind?.speed,
          visibility: passedWeather.visibility,
          clouds: passedWeather.clouds?.all ?? 0,
          uvi: null,
          sunrise: passedWeather.sys?.sunrise,
          sunset: passedWeather.sys?.sunset,
          weather: passedWeather.weather,
        });
        setCityName(passedWeather.name || cityName);
        await fetchByCoords(lat, lon, passedWeather.name);
      } catch (e) {
        console.log(e);
        setError(e.message || 'Failed to load passed weather');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const loadByCity = async (city) => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${OPENWEATHER_API_KEY}`
        );
        const json = await res.json();
        if (json.cod && json.cod !== 200) {
          throw new Error(json.message || 'City not found');
        }
        const lat = json.coord?.lat;
        const lon = json.coord?.lon;
        if (!lat || !lon) {
          throw new Error('Coordinates not available for city');
        }

        setCurrent({
          temp: json.main?.temp,
          feels_like: json.main?.feels_like,
          pressure: json.main?.pressure,
          humidity: json.main?.humidity,
          wind_speed: json.wind?.speed,
          visibility: json.visibility,
          clouds: json.clouds?.all ?? 0,
          uvi: null,
          sunrise: json.sys?.sunrise,
          sunset: json.sys?.sunset,
          weather: json.weather,
        });
        setCityName(json.name || city);

        await fetchByCoords(lat, lon, json.name || city);
      } catch (e) {
        console.log('loadByCity error:', e);
        if (!cancelled) setError(e.message || 'Failed to load city weather');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const loadByCurrentLocation = async () => {
      try {
        setLoading(true);
        setError(null);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = loc.coords;

        try {
          const geo = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });
          const detectedCity = geo?.[0]?.city || geo?.[0]?.region || 'Your location';
          setCityName(detectedCity);
        } catch (e) {}

        await fetchByCoords(latitude, longitude, null);
      } catch (e) {
        console.log('loadByCurrentLocation error:', e);
        if (!cancelled) setError(e.message || 'Could not fetch location/weather');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    (async () => {
      setHourly([]);
      setDaily([]);
      setAqi(passedAqi || null);
      setError(null);

      if (useCurrent) {
        await loadByCurrentLocation();
      } else if (cityParam) {
        await loadByCity(cityParam);
      } else if (passedWeather) {
        await loadForPassedWeather();
      } else {
        await loadByCurrentLocation();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [passedWeather, passedAqi, cityParam, useCurrent]);

  const formatHour = (dt) => {
    const d = new Date(dt * 1000);
    let h = d.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h} ${ampm}`;
  };

  const formatDay = (dt) => {
    const d = new Date(dt * 1000);
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const formatTemp = (t) => (t == null ? '--' : `${Math.round(t)}°`);

  const aqiLabel = () => {
    if (!aqi) return 'N/A';
    if (aqi === 1) return 'Good';
    if (aqi === 2) return 'Fair';
    if (aqi === 3) return 'Moderate';
    if (aqi === 4) return 'Poor';
    if (aqi === 5) return 'Very Poor';
    return 'N/A';
  };

  const currentTemp = current?.temp;
  const feelsLike = current?.feels_like;
  const currentDesc = current?.weather?.[0]?.description;
  const currentIcon = current?.weather?.[0]?.icon;
  const high = daily[0]?.max;
  const low = daily[0]?.min;

  const sunrise = current?.sunrise;
  const sunset = current?.sunset;

  const formatTime = (ts) => {
    if (!ts) return '--';
    const d = new Date(ts * 1000);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Samsung UI professional gradients based on Dark Mode
  const bgGradient = isDarkMode 
    ? ['#0F2027', '#203A43', '#2C5364'] // Dark elegant gradient
    : ['#4CA1AF', '#2C3E50']; // Light/Day gradient

  const cardColor = isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.2)';
  const textColor = '#ffffff'; // White text looks best on both gradients

  return (
    <LinearGradient colors={bgGradient} style={styles.safeArea}>
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent={true} />

      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={28} color={textColor} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={textColor} />
          </View>
        )}

        {!loading && error && (
          <View style={styles.center}>
            <Text style={[styles.errorText, { color: textColor }]}>{error}</Text>
          </View>
        )}

        {!loading && !error && current && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            
            {/* Main current block */}
            <View style={styles.mainHeader}>
              <Text style={[styles.cityName, { color: textColor }]}>{cityName}</Text>
              
              <View style={styles.tempContainer}>
                {currentIcon && (
                  <Image 
                    source={{ uri: `https://openweathermap.org/img/wn/${currentIcon}@4x.png` }} 
                    style={styles.mainIcon} 
                  />
                )}
                <Text style={[styles.bigTemp, { color: textColor }]}>{formatTemp(currentTemp)}</Text>
              </View>

              <Text style={[styles.conditionText, { color: textColor }]}>
                {currentDesc ? currentDesc.charAt(0).toUpperCase() + currentDesc.slice(1) : '—'}
              </Text>
              <Text style={[styles.hlText, { color: textColor }]}>
                H: {formatTemp(high)}  L: {formatTemp(low)}
              </Text>
            </View>

            {/* Hourly forecast */}
            <View style={[styles.section, { backgroundColor: cardColor }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Hourly Forecast</Text>
              <FlatList
                horizontal
                data={hourly}
                keyExtractor={(item) => item.dt.toString()}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.hourCard}>
                    <Text style={[styles.hourTime, { color: textColor }]}>{formatHour(item.dt)}</Text>
                    <Image 
                      source={{ uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png` }} 
                      style={styles.hourIcon} 
                    />
                    <Text style={[styles.hourTemp, { color: textColor }]}>{formatTemp(item.main.temp)}</Text>
                  </View>
                )}
              />
            </View>

            {/* Daily forecast */}
            <View style={[styles.section, { backgroundColor: cardColor }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>7-Day Forecast</Text>
              {daily.map((d) => (
                <View key={d.dt} style={styles.dayRow}>
                  <Text style={[styles.dayName, { color: textColor }]}>{formatDay(d.dt)}</Text>
                  <View style={styles.dayCenter}>
                    <Image 
                      source={{ uri: `https://openweathermap.org/img/wn/${d.icon}@2x.png` }} 
                      style={styles.dayIcon} 
                    />
                  </View>
                  <View style={styles.dayTemps}>
                    <Text style={[styles.dayTempMin, { color: textColor }]}>{formatTemp(d.min)}</Text>
                    <View style={styles.tempBar} />
                    <Text style={[styles.dayTempMax, { color: textColor }]}>{formatTemp(d.max)}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Details Grid */}
            <View style={styles.grid}>
              <View style={[styles.gridCard, { backgroundColor: cardColor }]}>
                <View style={styles.gridHeader}>
                  <Ionicons name="thermometer-outline" size={18} color={textColor} />
                  <Text style={[styles.gridTitle, { color: textColor }]}>FEELS LIKE</Text>
                </View>
                <Text style={[styles.gridValue, { color: textColor }]}>{formatTemp(feelsLike)}</Text>
                <Text style={[styles.gridSub, { color: textColor }]}>Similar to the actual temperature.</Text>
              </View>

              <View style={[styles.gridCard, { backgroundColor: cardColor }]}>
                <View style={styles.gridHeader}>
                  <Ionicons name="leaf-outline" size={18} color={textColor} />
                  <Text style={[styles.gridTitle, { color: textColor }]}>AQI</Text>
                </View>
                <Text style={[styles.gridValue, { color: textColor }]}>{aqiLabel()}</Text>
                <Text style={[styles.gridSub, { color: textColor }]}>Air quality is {aqiLabel().toLowerCase()}.</Text>
              </View>

              <View style={[styles.gridCard, { backgroundColor: cardColor }]}>
                <View style={styles.gridHeader}>
                  <Ionicons name="water-outline" size={18} color={textColor} />
                  <Text style={[styles.gridTitle, { color: textColor }]}>HUMIDITY</Text>
                </View>
                <Text style={[styles.gridValue, { color: textColor }]}>{current.humidity}%</Text>
              </View>

              <View style={[styles.gridCard, { backgroundColor: cardColor }]}>
                <View style={styles.gridHeader}>
                  <Ionicons name="eye-outline" size={18} color={textColor} />
                  <Text style={[styles.gridTitle, { color: textColor }]}>VISIBILITY</Text>
                </View>
                <Text style={[styles.gridValue, { color: textColor }]}>{((current.visibility || 0) / 1000).toFixed(0)} km</Text>
              </View>

              <View style={[styles.gridCard, { backgroundColor: cardColor }]}>
                <View style={styles.gridHeader}>
                  <Ionicons name="speedometer-outline" size={18} color={textColor} />
                  <Text style={[styles.gridTitle, { color: textColor }]}>PRESSURE</Text>
                </View>
                <Text style={[styles.gridValue, { color: textColor }]}>{current.pressure}</Text>
                <Text style={[styles.gridSub, { color: textColor }]}>hPa</Text>
              </View>

              <View style={[styles.gridCard, { backgroundColor: cardColor }]}>
                <View style={styles.gridHeader}>
                  <Ionicons name="sunny-outline" size={18} color={textColor} />
                  <Text style={[styles.gridTitle, { color: textColor }]}>SUNRISE</Text>
                </View>
                <Text style={[styles.gridValue, { color: textColor }]}>{formatTime(sunrise)}</Text>
                <Text style={[styles.gridSub, { color: textColor }]}>Sunset: {formatTime(sunset)}</Text>
              </View>
            </View>

          </ScrollView>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconButton: {
    padding: 5,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Header
  mainHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  cityName: {
    fontSize: 34,
    fontWeight: '400',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20, // Offset for the icon to center the text visually
  },
  mainIcon: {
    width: 100,
    height: 100,
    marginRight: -10,
  },
  bigTemp: {
    fontSize: 86,
    fontWeight: '200',
    includeFontPadding: false,
  },
  conditionText: {
    fontSize: 20,
    fontWeight: '500',
    marginTop: -5,
    marginBottom: 5,
  },
  hlText: {
    fontSize: 18,
    fontWeight: '500',
  },

  // Sections (Cards)
  section: {
    marginTop: 15,
    borderRadius: 24,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  
  // Hourly
  hourCard: {
    alignItems: 'center',
    marginRight: 20,
  },
  hourTime: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  hourIcon: {
    width: 50,
    height: 50,
  },
  hourTemp: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 5,
  },

  // Daily
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  dayName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
  },
  dayCenter: {
    flex: 1,
    alignItems: 'center',
  },
  dayIcon: {
    width: 40,
    height: 40,
  },
  dayTemps: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  dayTempMin: {
    fontSize: 18,
    fontWeight: '500',
    opacity: 0.7,
  },
  tempBar: {
    width: 40,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 10,
  },
  dayTempMax: {
    fontSize: 18,
    fontWeight: '600',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  gridCard: {
    width: '48%',
    borderRadius: 24,
    padding: 16,
    marginBottom: 15,
    aspectRatio: 1, // Make them square like Samsung/iOS
    justifyContent: 'space-between',
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    opacity: 0.8,
  },
  gridValue: {
    fontSize: 28,
    fontWeight: '400',
    marginTop: 'auto',
  },
  gridSub: {
    fontSize: 13,
    marginTop: 5,
    fontWeight: '400',
    opacity: 0.8,
  },
});
