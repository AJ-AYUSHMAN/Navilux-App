// src/screens/WeatherScreen.js
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

// Prefer reading the API key from .env; fallback to your hardcoded key
// Add to .env: OPENWEATHER_API_KEY=your_key_here
import { OPENWEATHER_API_KEY as ENV_OPENWEATHER_KEY } from '@env';
const OPENWEATHER_API_KEY = ENV_OPENWEATHER_KEY || '0f7bc8ce84b7b66d8ba9df224f55d38d';

export default function WeatherScreen({ route, navigation }) {
  // route.params may contain:
  // - weather: passedWeather (object from /weather)
  // - aqi: passedAqi
  // - city: 'CityName'
  // - useCurrent: true
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
          uvi: null, // not provided by this endpoint
          sunrise: jsonCurr.sys?.sunrise,
          sunset: jsonCurr.sys?.sunset,
          weather: jsonCurr.weather,
        });

        // friendly name (city) — prefer passed friendlyName, else api name
        setCityName(friendlyName || jsonCurr.name || cityName);

        // Forecast (free endpoint /forecast returns 3-hour steps)
        const resForecast = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
        );
        const jsonForecast = await resForecast.json();
        if (jsonForecast.cod && jsonForecast.cod !== '200') {
          // Some endpoints return cod as string
          console.warn('Forecast load warning:', jsonForecast);
        } else {
          // hourly: take first 8 entries (~24 hours)
          setHourly(jsonForecast.list?.slice(0, 8) || []);

          // compute daily min/max
          const byDay = {};
          (jsonForecast.list || []).forEach((item) => {
            const dateStr = item.dt_txt.split(' ')[0];
            if (!byDay[dateStr]) {
              byDay[dateStr] = {
                dt: item.dt,
                max: item.main.temp,
                min: item.main.temp,
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
        // Use passedWeather for current block and fetch forecast/aqi
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
        // Step 1: get current by city (so we get coords)
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
            city
          )}&units=metric&appid=${OPENWEATHER_API_KEY}`
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

        // Use fetched current data as "current"
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

        // fetch forecast and aqi using coords
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

        // reverse geocode to get a friendly name if possible
        try {
          const geo = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });
          const detectedCity = geo?.[0]?.city || geo?.[0]?.region || 'Your location';
          setCityName(detectedCity);
        } catch (e) {
          // ignore reverse geocode failures
        }

        await fetchByCoords(latitude, longitude, null);
      } catch (e) {
        console.log('loadByCurrentLocation error:', e);
        if (!cancelled) setError(e.message || 'Could not fetch location/weather');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Decide which flow to execute
    (async () => {
      // reset states for new param changes
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
        // No info provided; attempt to use device location as a fallback
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
    return `${h}:00 ${ampm}`;
  };

  const formatDay = (dt) => {
    const d = new Date(dt * 1000);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatTemp = (t) => (t == null ? '--' : `${Math.round(t)}°C`);

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
  const high = passedWeather?.main?.temp_max;
  const low = passedWeather?.main?.temp_min;

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

  return (
    <View style={styles.safeArea}>
      <StatusBar backgroundColor="#72C8FF" barStyle="light-content" translucent={false} />

      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.cityText}>{cityName || 'Weather'}</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        {!loading && error && (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && !error && current && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Main current block */}
            <View style={styles.currentBlock}>
              <View>
                <Text style={styles.bigTemp}>{formatTemp(currentTemp)}</Text>
                <Text style={styles.conditionText}>
                  {currentDesc ? currentDesc.charAt(0).toUpperCase() + currentDesc.slice(1) : '—'}
                </Text>
                <Text style={styles.subText}>
                  ↑ {formatTemp(high)} / ↓ {formatTemp(low)}
                </Text>
                <Text style={styles.subText}>Feels like {formatTemp(feelsLike)}</Text>
              </View>

              <Ionicons name="partly-sunny-outline" size={70} color="#fff" />
            </View>

            {/* Extra stats row 1 */}
            <View style={styles.statsRow}>
              <StatCard label="Humidity" value={`${current.humidity}%`} />
              <StatCard label="Pressure" value={`${current.pressure} hPa`} />
              <StatCard label="Wind" value={`${current.wind_speed} m/s`} />
            </View>

            {/* Extra stats row 2 */}
            <View style={styles.statsRow}>
              <StatCard label="Visibility" value={`${((current.visibility || 0) / 1000).toFixed(1)} km`} />
              <StatCard label="Clouds" value={`${current.clouds}%`} />
              <StatCard label="UV Index" value={current.uvi?.toFixed(1) ?? '—'} />
            </View>

            {/* Sunrise / Sunset / AQI */}
            <View style={styles.sunRow}>
              <View style={styles.sunItem}>
                <Ionicons name="sunny-outline" size={20} color="#fff" />
                <Text style={styles.sunLabel}>Sunrise</Text>
                <Text style={styles.sunValue}>{formatTime(sunrise)}</Text>
              </View>
              <View style={styles.sunItem}>
                <Ionicons name="moon-outline" size={20} color="#fff" />
                <Text style={styles.sunLabel}>Sunset</Text>
                <Text style={styles.sunValue}>{formatTime(sunset)}</Text>
              </View>
              <View style={styles.sunItem}>
                <Ionicons name="leaf-outline" size={20} color="#fff" />
                <Text style={styles.sunLabel}>AQI</Text>
                <Text style={styles.sunValue}>{aqiLabel()}</Text>
              </View>
            </View>

            {/* Hourly forecast */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Next hours</Text>
              <FlatList
                horizontal
                data={hourly}
                keyExtractor={(item) => item.dt.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 8 }}
                renderItem={({ item }) => (
                  <View style={styles.hourCard}>
                    <Text style={styles.hourTime}>{formatHour(item.dt)}</Text>
                    <Ionicons name="cloud-outline" size={24} color="#fff" />
                    <Text style={styles.hourTemp}>{formatTemp(item.main.temp)}</Text>
                  </View>
                )}
              />
            </View>

            {/* Daily forecast */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Next 7 days</Text>
              {daily.map((d) => (
                <View key={d.dt} style={styles.dayRow}>
                  <Text style={styles.dayName}>{formatDay(d.dt)}</Text>
                  <Ionicons name="cloud-outline" size={20} color="#fff" />
                  <Text style={styles.dayTemp}>
                    {formatTemp(d.max)} / {formatTemp(d.min)}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#72C8FF',
    paddingTop: Platform.OS === 'android' ? 0 : 0,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    paddingHorizontal: 18,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  cityText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: { color: '#fff' },

  currentBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  bigTemp: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '700',
  },
  conditionText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 4,
    fontWeight: '600',
  },
  subText: {
    color: '#EAF7FF',
    fontSize: 13,
    marginTop: 2,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
  },
  statLabel: {
    color: '#EAF7FF',
    fontSize: 12,
  },
  statValue: {
    marginTop: 4,
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  sunRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  sunItem: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
  },
  sunLabel: {
    color: '#EAF7FF',
    fontSize: 12,
    marginTop: 4,
  },
  sunValue: {
    color: '#fff',
    fontWeight: '600',
    marginTop: 2,
  },

  section: {
    marginTop: 16,
    borderRadius: 20,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: '700',
    marginBottom: 8,
  },
  hourCard: {
    width: 80,
    borderRadius: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
  },
  hourTime: {
    color: '#fff',
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '600',
  },
  hourTemp: {
    color: '#fff',
    marginTop: 4,
    fontWeight: '600',
  },

  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  dayName: {
    color: '#fff',
    width: 50,
    fontWeight: '600',
  },
  dayTemp: {
    color: '#fff',
    fontWeight: '600',
  },
});
