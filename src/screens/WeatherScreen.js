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
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Circle } from 'react-native-svg';

import { WEATHER_API_KEY as ENV_OPENWEATHER_KEY } from '@env';
import { ThemeContext } from '../context/ThemeContext';

const OPENWEATHER_API_KEY = ENV_OPENWEATHER_KEY;

export default function WeatherScreen({ route, navigation }) {
  const { isDarkMode } = useContext(ThemeContext);

  const { weather: passedWeather, aqi: passedAqi, city: cityParam, useCurrent } =
    route?.params || {};

  const [weatherList, setWeatherList] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Settings & Saved Cities
  const [savedCities, setSavedCities] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [newCityText, setNewCityText] = useState('');

  // Toggle state: 'DAY' for hourly, 'WEEK' for daily
  const [forecastType, setForecastType] = useState('DAY');

  // Helper to fetch data for one city
  const getWeatherData = async (cityStr, lat, lon) => {
    try {
      let urlCurr = '';
      let urlForecast = '';
      let urlAqi = '';
      let usedLat = lat;
      let usedLon = lon;

      if (lat && lon) {
        urlCurr = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
      } else {
        urlCurr = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityStr)}&units=metric&appid=${OPENWEATHER_API_KEY}`;
      }

      const resCurr = await fetch(urlCurr);
      const jsonCurr = await resCurr.json();
      if (jsonCurr.cod !== 200 && jsonCurr.cod !== '200') {
        throw new Error(jsonCurr.message);
      }

      usedLat = jsonCurr.coord.lat;
      usedLon = jsonCurr.coord.lon;
      const finalCityName = jsonCurr.name || cityStr;

      // Forecast
      urlForecast = `https://api.openweathermap.org/data/2.5/forecast?lat=${usedLat}&lon=${usedLon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
      const resForecast = await fetch(urlForecast);
      const jsonForecast = await resForecast.json();
      
      // AQI
      urlAqi = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${usedLat}&lon=${usedLon}&appid=${OPENWEATHER_API_KEY}`;
      const resAqi = await fetch(urlAqi);
      const jsonAqi = await resAqi.json();

      // Process data
      const current = {
        temp: jsonCurr.main?.temp,
        feels_like: jsonCurr.main?.feels_like,
        pressure: jsonCurr.main?.pressure,
        humidity: jsonCurr.main?.humidity,
        wind_speed: jsonCurr.wind?.speed,
        visibility: jsonCurr.visibility,
        clouds: jsonCurr.clouds?.all ?? 0,
        sunrise: jsonCurr.sys?.sunrise,
        sunset: jsonCurr.sys?.sunset,
        weather: jsonCurr.weather,
      };

      const hourly = jsonForecast.list?.slice(0, 12) || [];
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
      const daily = Object.values(byDay).slice(0, 7);
      const aqiVal = jsonAqi?.list?.[0]?.main?.aqi ?? null;

      return {
        id: finalCityName + usedLat,
        cityName: finalCityName,
        current,
        hourly,
        daily,
        aqi: aqiVal
      };
    } catch (err) {
      console.log('Error fetching data for', cityStr || lat, err);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 1. Get saved cities from AsyncStorage
        const stored = await AsyncStorage.getItem('@Navilux_SavedCities');
        let cities = stored ? JSON.parse(stored) : [];
        
        // 2. Fetch base city
        let baseData = null;
        if (useCurrent) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({});
            baseData = await getWeatherData(null, loc.coords.latitude, loc.coords.longitude);
          } else {
            setError('Location permission denied');
          }
        } else if (cityParam) {
          baseData = await getWeatherData(cityParam);
        } else if (passedWeather && passedWeather.coord) {
          baseData = await getWeatherData(null, passedWeather.coord.lat, passedWeather.coord.lon);
          if (baseData) baseData.cityName = passedWeather.name; 
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({});
            baseData = await getWeatherData(null, loc.coords.latitude, loc.coords.longitude);
          }
        }

        // 3. Fetch saved cities
        const promises = cities.map(c => getWeatherData(c));
        const results = await Promise.all(promises);
        
        if (isMounted) {
          const finalData = [baseData, ...results].filter(Boolean);
          setWeatherList(finalData);
          setSavedCities(cities);
          setLoading(false);
        }
      } catch (e) {
        if (isMounted) {
          setError('Could not load weather data.');
          setLoading(false);
        }
      }
    };
    init();
    return () => { isMounted = false; };
  }, [passedWeather, cityParam, useCurrent]);

  const handleAddCity = async () => {
    if (!newCityText.trim()) return;
    const data = await getWeatherData(newCityText.trim());
    if (data) {
       const updatedCities = [...savedCities, data.cityName];
       // deduplicate
       const uniqueCities = [...new Set(updatedCities)];
       await AsyncStorage.setItem('@Navilux_SavedCities', JSON.stringify(uniqueCities));
       setSavedCities(uniqueCities);
       
       if (!weatherList.find(w => w.cityName === data.cityName)) {
         setWeatherList([...weatherList, data]);
       }
       setNewCityText('');
    }
  };

  const handleRemoveCity = async (cityNameToRemove) => {
    const updatedCities = savedCities.filter(c => c !== cityNameToRemove);
    await AsyncStorage.setItem('@Navilux_SavedCities', JSON.stringify(updatedCities));
    setSavedCities(updatedCities);
    
    // keep base (index 0) and filter the rest
    if (weatherList.length > 0) {
      const base = weatherList[0];
      const rest = weatherList.slice(1).filter(w => w.cityName !== cityNameToRemove);
      setWeatherList([base, ...rest]);
    }
  };

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

  const getWeatherIcon = (code) => {
    switch (code) {
      case '01d': return 'weather-sunny';
      case '01n': return 'weather-night';
      case '02d': return 'weather-partly-cloudy';
      case '02n': return 'weather-night-partly-cloudy';
      case '03d':
      case '03n': 
      case '04d':
      case '04n': return 'weather-cloudy';
      case '09d':
      case '09n': return 'weather-pouring';
      case '10d': return 'weather-partly-rainy';
      case '10n': return 'weather-rainy';
      case '11d':
      case '11n': return 'weather-lightning';
      case '13d':
      case '13n': return 'weather-snowy';
      case '50d':
      case '50n': return 'weather-fog';
      default: return 'weather-cloudy';
    }
  };

  const aqiLabel = (aqiValue) => {
    if (!aqiValue) return 'N/A';
    if (aqiValue === 1) return 'Good';
    if (aqiValue === 2) return 'Fair';
    if (aqiValue === 3) return 'Moderate';
    if (aqiValue === 4) return 'Poor';
    if (aqiValue === 5) return 'Very Poor';
    return 'N/A';
  };

  const formatTime = (ts) => {
    if (!ts) return '--';
    const d = new Date(ts * 1000);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const bgGradient = isDarkMode 
    ? ['#12172B', '#1B2440'] 
    : ['#2A3656', '#41527A'];

  const bottomSheetColor = isDarkMode ? '#1E2846' : '#33436A';
  const pillColor = 'rgba(255, 255, 255, 0.08)';
  const borderColor = 'rgba(255, 255, 255, 0.15)';
  const textColor = '#ffffff';

  // Screen Dimensions & SVG Wave path
  const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
  const wavePath = `M0,30 C60,0 120,60 180,40 C240,20 300,50 360,20 C420,-10 480,40 540,20 L${screenWidth},20 L${screenWidth},100 L0,100 Z`;

  const activeDataObj = weatherList[activeIndex] || weatherList[0] || {};
  const { cityName: actCity, current: actCurr, hourly: actHourly, daily: actDaily, aqi: actAqi } = activeDataObj;

  const feelsLike = actCurr?.feels_like;

  // --- Graph Calculation ---
  const activeData = forecastType === 'DAY' ? (actHourly || []) : (actDaily || []);
  const getTempObj = (item) => forecastType === 'DAY' ? item.main.temp : item.max;
  const getIconObj = (item) => forecastType === 'DAY' ? item.weather[0].icon : item.icon;
  const getTimeLabelObj = (item) => forecastType === 'DAY' ? formatHour(item.dt) : formatDay(item.dt).substring(0, 3);

  const itemWidth = 80;
  const chartWidth = Math.max(screenWidth, activeData.length * itemWidth);
  const chartHeight = 100;
  const paddingVertical = 15;

  let pathStr = '';
  let areaStr = '';
  let getX = () => 0;
  let getY = () => 0;

  if (activeData.length > 0) {
    const minTempGraph = Math.min(...activeData.map(getTempObj));
    const maxTempGraph = Math.max(...activeData.map(getTempObj));
    const range = maxTempGraph - minTempGraph || 1;

    getX = (index) => index * itemWidth + itemWidth / 2;
    getY = (temp) =>
      chartHeight -
      paddingVertical -
      ((temp - minTempGraph) / range) * (chartHeight - paddingVertical * 2);

    pathStr = `M ${getX(0)} ${getY(getTempObj(activeData[0]))}`;
    for (let i = 0; i < activeData.length - 1; i++) {
      const currX = getX(i);
      const currY = getY(getTempObj(activeData[i]));
      const nextX = getX(i + 1);
      const nextY = getY(getTempObj(activeData[i + 1]));
      const midX = (currX + nextX) / 2;
      pathStr += ` C ${midX} ${currY}, ${midX} ${nextY}, ${nextX} ${nextY}`;
    }
    
    areaStr = `${pathStr} L ${getX(activeData.length - 1)} ${chartHeight} L ${getX(0)} ${chartHeight} Z`;
  }

  return (
    <LinearGradient colors={bgGradient} style={styles.safeArea}>
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent={true} />

      {/* FIXED TOP BAR */}
      <View style={[styles.topBar, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50 }]}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={28} color={textColor} />
         </TouchableOpacity>
         
         {/* Pagination Dots (Only if multiple cities) */}
         {weatherList.length > 1 && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               {weatherList.map((_, i) => (
                  <View key={i} style={{
                     width: 6, height: 6, borderRadius: 3, 
                     backgroundColor: textColor, 
                     marginHorizontal: 3,
                     opacity: activeIndex === i ? 1 : 0.3
                  }} />
               ))}
            </View>
         )}

         <TouchableOpacity onPress={() => setShowSettings(true)}>
            <Ionicons name="options-outline" size={24} color={textColor} />
         </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={textColor} />
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: textColor }]}>{error}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
            <Text style={{ color: '#fff' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && weatherList.length > 0 && (
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          
          {/* SWIPEABLE TOP INFO */}
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
               const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
               setActiveIndex(idx);
            }}
          >
            {weatherList.map((dataObj) => {
               const desc = dataObj.current?.weather?.[0]?.description;
               return (
                  <View style={{ width: screenWidth, alignItems: 'center' }} key={dataObj.id}>
                     <View style={styles.headerInfo}>
                        <Text style={[styles.cityName, { color: textColor }]}>{dataObj.cityName}</Text>
                        <Text style={[styles.bigTemp, { color: textColor }]}>{formatTemp(dataObj.current?.temp)}</Text>
                        
                        <Text style={[styles.conditionText, { color: textColor }]}>
                           {desc ? desc.charAt(0).toUpperCase() + desc.slice(1) : '—'}
                        </Text>
                        <Text style={[styles.hlText, { color: textColor, opacity: 0.8 }]}>
                           H: {formatTemp(dataObj.daily?.[0]?.max)}   L: {formatTemp(dataObj.daily?.[0]?.min)}
                        </Text>
                        <Text style={[styles.hlText, { color: textColor, opacity: 0.8, marginTop: 2 }]}>
                           Feels like {formatTemp(dataObj.current?.feels_like)}
                        </Text>
                     </View>

                     {dataObj.current?.weather?.[0]?.icon && (
                        <View style={styles.hugeIconContainer}>
                           <MaterialCommunityIcons 
                              name={getWeatherIcon(dataObj.current.weather[0].icon)} 
                              size={180} 
                              color={textColor} 
                              style={styles.hugeIconShadow} 
                           />
                        </View>
                     )}
                  </View>
               );
            })}
          </ScrollView>

          {/* BOTTOM SHEET FOR ACTIVE DATA */}
          <View style={{ marginTop: 80 }}>
            <View style={{ position: 'absolute', top: -40, left: 0, right: 0, height: 60, overflow: 'hidden' }}>
              <Svg height="100%" width="100%" viewBox={`0 0 ${screenWidth} 60`} preserveAspectRatio="none">
                <Path d={wavePath} fill={bottomSheetColor} />
              </Svg>
            </View>

            <View style={[styles.bottomSheet, { backgroundColor: bottomSheetColor }]}>
              
              <View style={styles.forecastHeader}>
                <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.5)" style={{ marginRight: 6 }} />
                <Text style={styles.forecastTitle}>Forecast</Text>
              </View>

              <View style={styles.horizontalListContainer}>
                {activeData.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                    <View style={{ width: chartWidth }}>
                      <View style={{ flexDirection: 'row', height: 30 }}>
                        {activeData.map((item, index) => (
                          <View key={`time-${index}`} style={{ width: itemWidth, alignItems: 'center' }}>
                            <Text style={styles.forecastTimeText}>{getTimeLabelObj(item)}</Text>
                          </View>
                        ))}
                      </View>

                      <View style={{ height: chartHeight }}>
                        <Svg width={chartWidth} height={chartHeight}>
                          <Defs>
                            <SvgLinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                              <Stop offset="0" stopColor="#ffffff" stopOpacity="0.2" />
                              <Stop offset="1" stopColor="#ffffff" stopOpacity="0.0" />
                            </SvgLinearGradient>
                          </Defs>
                          
                          <Path d={areaStr} fill="url(#areaGrad)" />
                          <Path d={pathStr} fill="none" stroke="#ffffff" strokeWidth="3" />
                          
                          {activeData.map((item, index) => (
                            <Circle
                              key={`dot-${index}`}
                              cx={getX(index)}
                              cy={getY(getTempObj(item))}
                              r="4"
                              fill={bottomSheetColor}
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                          ))}
                        </Svg>
                      </View>

                      <View style={{ flexDirection: 'row', height: 40, marginTop: 10 }}>
                        {activeData.map((item, index) => (
                          <View key={`bot-${index}`} style={styles.graphBottomRow}>
                            <MaterialCommunityIcons 
                              name={getWeatherIcon(getIconObj(item))} 
                              size={24} 
                              color={textColor} 
                            />
                            <Text style={styles.graphTempText}>{formatTemp(getTempObj(item))}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </ScrollView>
                )}
              </View>

              <View style={styles.toggleWrapper}>
                <TouchableOpacity 
                  style={styles.toggleContainer} 
                  activeOpacity={0.9} 
                  onPress={() => setForecastType(forecastType === 'DAY' ? 'WEEK' : 'DAY')}
                >
                  <View style={[styles.toggleIndicator, { 
                    left: forecastType === 'DAY' ? 4 : '50%',
                    right: forecastType === 'WEEK' ? 4 : 'auto',
                    width: '48%'
                  }]} />
                </TouchableOpacity>
                <Text style={styles.toggleText}>DAY / WEEK</Text>
              </View>

              <View style={styles.detailsContainer}>
                <Text style={styles.detailsHeader}>More Details</Text>
                <View style={styles.grid}>
                  <View style={[styles.gridCard, { backgroundColor: pillColor }]}>
                    <View style={styles.gridHeader}>
                      <Ionicons name="sunny-outline" size={16} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.gridTitle}>SUNRISE & SUNSET</Text>
                    </View>
                    <Text style={[styles.gridValue, { color: textColor, fontSize: 16 }]}>{formatTime(actCurr?.sunrise)}</Text>
                    <Text style={[styles.gridValue, { color: textColor, fontSize: 16, marginTop: 4 }]}>{formatTime(actCurr?.sunset)}</Text>
                  </View>

                  <View style={[styles.gridCard, { backgroundColor: pillColor }]}>
                    <View style={styles.gridHeader}>
                      <Ionicons name="leaf-outline" size={16} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.gridTitle}>AQI</Text>
                    </View>
                    <Text style={[styles.gridValue, { color: textColor }]}>{aqiLabel(actAqi)}</Text>
                  </View>

                  <View style={[styles.gridCard, { backgroundColor: pillColor }]}>
                    <View style={styles.gridHeader}>
                      <Ionicons name="water-outline" size={16} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.gridTitle}>HUMIDITY</Text>
                    </View>
                    <Text style={[styles.gridValue, { color: textColor }]}>{actCurr?.humidity}%</Text>
                  </View>

                  <View style={[styles.gridCard, { backgroundColor: pillColor }]}>
                    <View style={styles.gridHeader}>
                      <Ionicons name="speedometer-outline" size={16} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.gridTitle}>PRESSURE</Text>
                    </View>
                    <Text style={[styles.gridValue, { color: textColor }]}>{actCurr?.pressure} hPa</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#12172B' : '#ffffff' }]}>
              
              <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, { color: isDarkMode ? '#fff' : '#000' }]}>Saved Cities</Text>
                 <TouchableOpacity onPress={() => setShowSettings(false)}>
                    <Ionicons name="close" size={28} color={isDarkMode ? '#fff' : '#000'} />
                 </TouchableOpacity>
              </View>

              <View style={styles.addCityRow}>
                 <TextInput 
                    style={[styles.cityInput, { color: isDarkMode ? '#fff' : '#000', borderColor: isDarkMode ? '#333' : '#ddd' }]} 
                    placeholder="Search for a city..."
                    placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
                    value={newCityText}
                    onChangeText={setNewCityText}
                 />
                 <TouchableOpacity style={styles.addButton} onPress={handleAddCity}>
                    <Ionicons name="add" size={24} color="#fff" />
                 </TouchableOpacity>
              </View>

              <FlatList 
                 data={savedCities}
                 keyExtractor={(item) => item}
                 renderItem={({ item }) => (
                    <View style={styles.savedCityRow}>
                       <Text style={[styles.savedCityText, { color: isDarkMode ? '#fff' : '#000' }]}>{item}</Text>
                       <TouchableOpacity onPress={() => handleRemoveCity(item)}>
                          <Ionicons name="trash-outline" size={22} color="#ff4444" />
                       </TouchableOpacity>
                    </View>
                 )}
                 ListEmptyComponent={
                    <Text style={{ color: isDarkMode ? '#888' : '#888', marginTop: 20, textAlign: 'center' }}>
                       No saved cities yet.
                    </Text>
                 }
              />
           </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  // Container
  topContainer: {
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
    zIndex: 100,
  },
  headerInfo: {
    alignItems: 'center',
    zIndex: 10,
  },
  cityName: {
    fontSize: 24,
    fontWeight: '400',
    letterSpacing: 0.5,
    marginBottom: 15,
  },
  bigTemp: {
    fontSize: 60,
    fontWeight: '700',
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    marginBottom: 5,
  },
  conditionText: {
    fontSize: 18,
    fontWeight: '500',
    opacity: 0.9,
    marginTop: 5,
  },
  hlText: {
    fontSize: 14,
    marginTop: 5,
  },
  hugeIconContainer: {
    alignItems: 'center',
    marginTop: -10,
    marginBottom: -40,
    zIndex: 5,
  },
  hugeIconShadow: {
  },

  // Bottom Sheet
  bottomSheet: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 40,
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  forecastTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalListContainer: {
    marginBottom: 30,
  },
  forecastTimeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  graphBottomRow: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphIcon: {
    width: 32,
    height: 32,
  },
  graphTempText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Toggle Switch
  toggleWrapper: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  toggleContainer: {
    width: 70,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 15,
    justifyContent: 'center',
    marginBottom: 8,
  },
  toggleIndicator: {
    position: 'absolute',
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 11,
  },
  toggleText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Details Grid
  detailsContainer: {
    paddingHorizontal: 25,
    marginTop: 20,
  },
  detailsHeader: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  gridValue: {
    fontSize: 22,
    fontWeight: '600',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  addCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  cityInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedCityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  savedCityText: {
    fontSize: 18,
    fontWeight: '500',
  },
});
