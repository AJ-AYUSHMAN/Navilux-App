// src/screens/CityAnalysisScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../context/ThemeContext';
import {
  WEATHER_API_KEY,
  DATA_API,
  GEOAPIFY_API_KEY,
  GNEWS_API_KEY,
  GEMINI_API_KEY_FOR_REPORT as GEMINI_API_KEY,
  PEXELS_API_KEY,
} from '@env';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { logScreenView, logAnalyticsEvent } from '../utils/analytics';

const { width } = Dimensions.get('window');

const MODEL_PRIORITY = [
  'gemini-3-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
];
const SCRIPT_URL = `https://script.google.com/macros/s/${DATA_API}/exec`;

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
  } catch (error) { console.log("Pexels API Error:", error); }
  return null;
};

export default function CityAnalysisScreen({ route, navigation }) {
  const { city } = route?.params || {};
  const { isDarkMode, theme } = useContext(ThemeContext);

  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [aqiData, setAqiData] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [crimeData, setCrimeData] = useState(null);
  const [explorePlaces, setExplorePlaces] = useState([]);
  const [news, setNews] = useState([]);
  const [aiReport, setAiReport] = useState(null);

  useEffect(() => {
    logScreenView('CityAnalysisScreen', 'CityAnalysisScreen');
    fetchAllData();
  }, [city]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      let userPrefs = [];
      if (user) {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists() && docSnap.data().travelPreferences) {
          userPrefs = docSnap.data().travelPreferences;
        }
      }
      setPreferences(userPrefs);

      const targetCity = city || 'Phagwara';

      // Log city analysis event
      logAnalyticsEvent('analyze_city', { city_name: targetCity });

      // 1. Weather
      const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${targetCity}&appid=${WEATHER_API_KEY}&units=metric`);
      const weatherJson = await weatherRes.json();
      setWeatherData(weatherJson);

      let lat = weatherJson?.coord?.lat;
      let lon = weatherJson?.coord?.lon;

      // 2. AQI
      let aqiVal = null;
      let o3Val = null;
      if (lat && lon) {
        try {
          const aqiRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`);
          const aqiJson = await aqiRes.json();
          aqiVal = aqiJson?.list?.[0]?.main?.aqi;
          o3Val = aqiJson?.list?.[0]?.components?.o3;
          setAqiData({ aqi: aqiVal, oxygen: o3Val });
        } catch (e) {
          console.log('AQI error');
        }
      }

      // 3. Network & Crime
      let netMatch = null, crimeMatch = null;
      try {
        const scriptRes = await fetch(SCRIPT_URL);
        const scriptJson = await scriptRes.json();
        const searchName = targetCity.trim().toLowerCase();
        const match = scriptJson.find(item => item.City && item.City.trim().toLowerCase() === searchName);
        if (match) {
          netMatch = match;
          crimeMatch = match;
        }
      } catch (e) { console.log('Script API Error', e); }
      setNetworkData(netMatch);
      setCrimeData(crimeMatch);

      // 4. Explore
      try {
        if (lat && lon) {
          const expRes = await fetch(`https://api.geoapify.com/v2/places?categories=tourism,leisure,natural&filter=circle:${lon},${lat},20000&limit=5&apiKey=${GEOAPIFY_API_KEY}`);
          const expJson = await expRes.json();
          if (expJson.features) {
            const formattedPromises = expJson.features.map(async (item, index) => {
              const title = item.properties.name || item.properties.address_line1 || 'Unknown Place';
              const pexelsImage = await fetchPexelsImage(title, targetCity);
              return {
                id: index.toString(),
                title: title,
                distance: item.properties.distance ? (item.properties.distance / 1000).toFixed(1) + ' km' : null,
                image: pexelsImage || `https://picsum.photos/400/300?random=${index + 10}`,
                rating: (Math.random() * (5 - 4) + 4).toFixed(1),
              };
            });
            const formatted = await Promise.all(formattedPromises);
            setExplorePlaces(formatted);
          }
        }
      } catch (e) { console.log('Explore API Error', e); }

      // 5. News
      try {
        const newsRes = await fetch(`https://gnews.io/api/v4/search?q=${targetCity}&lang=en&max=2&apikey=${GNEWS_API_KEY}`);
        const newsJson = await newsRes.json();
        if (newsJson.articles) setNews(newsJson.articles);
      } catch (e) { console.log('News API Error', e); }

      // Forecast for next 3-6 hours
      let forecastText = 'Unknown';
      try {
        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${targetCity}&appid=${WEATHER_API_KEY}&units=metric`);
        const forecastJson = await forecastRes.json();
        const nextForecasts = forecastJson?.list?.slice(0, 2);
        if (nextForecasts && nextForecasts.length > 0) {
           forecastText = nextForecasts.map(f => `${Math.round(f.main.temp)}°C with ${f.weather[0].main}`).join(' -> ');
        }
      } catch (e) { console.log('Forecast API Error'); }

      // 6. Gemini AI Report
      await generateAiReport(targetCity, userPrefs, weatherJson, forecastText, aqiVal, crimeMatch, netMatch);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateAiReport = async (cityName, prefs, wData, forecast, aqi, cData, nData) => {
    try {
      const prompt = `You are Navilux's AI Travel Analyst. Based on the data below, provide a smart city safety/travel report. Return ONLY a valid, minified JSON object matching this structure exactly, with no markdown tags or extra text:
{"score":Number,"badge":"String","confidence":Number,"summary":"String","healthAdvice":"String","safetyAdvice":"String","networkAdvice":"String","weatherAdvice":"String","bestTime":"String","warnings":["String"]}

CRITICAL INSTRUCTIONS:
- 'confidence' must be a decimal between 0.0 and 1.0 (e.g., 0.95).
- If the User Preferences include a network (e.g. Airtel, Jio, Vi) and it matches the city's Network Coverage, explicitly highlight this in networkAdvice.
- If health preferences match the condition (e.g., Asthma with Poor AQI), add specific warnings.
- 'weatherAdvice' MUST analyze the current weather AND the forecast. Explicitly mention if the temperature is hot, cold, or perfect for travel. Also strictly warn if a storm, rain, or drastic change is predicted in the next few hours based on the forecast.

City: ${cityName}
User Preferences: ${prefs.join(', ') || 'None'}
Current Weather: ${wData?.weather?.[0]?.main || 'Unknown'}, ${wData?.main?.temp || 'Unknown'}°C
Forecast (Next 3-6 hrs): ${forecast}
AQI: ${aqi || 'Unknown'} (1=Good, 5=Poor)
Crime Risk Level: ${cData?.['Risk Level'] || 'Unknown'}
Network Coverage: ${nData?.['Network Covrage'] || 'Unknown'}
`;

      for (const model of MODEL_PRIORITY) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });
          const data = await res.json();
          if (res.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const rawText = data.candidates[0].content.parts[0].text;
            const jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(jsonStr);
            setAiReport(parsed);
            return; // Success, exit loop
          }
        } catch (modelErr) {
          console.log(`Model ${model} failed, trying next...`);
        }
      }
      
      throw new Error("All Gemini models failed.");
    } catch (e) {
      console.log('Gemini Error:', e);
      setAiReport({
        score: 75,
        badge: 'Moderate',
        confidence: 0.8,
        summary: 'Could not generate full AI report at this time.',
        healthAdvice: 'Check local AQI updates.',
        safetyAdvice: 'Stay aware of your surroundings.',
        networkAdvice: 'Standard coverage applies.',
        weatherAdvice: 'Check local weather forecasts.',
        bestTime: 'Daytime',
        warnings: []
      });
    }
  };

  const getAqiStatus = (aqi) => {
    if (!aqi) return { label: 'Unknown', color: theme.subText };
    if (aqi === 1) return { label: 'Good', color: '#4CAF50' };
    if (aqi === 2) return { label: 'Fair', color: '#8BC34A' };
    if (aqi === 3) return { label: 'Moderate', color: '#FFEB3B' };
    if (aqi === 4) return { label: 'Poor', color: '#FF9800' };
    return { label: 'Very Poor', color: '#F44336' };
  };

  const aqiStatus = getAqiStatus(aqiData?.aqi);

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={[styles.loaderText, { color: theme.text }]}>Generating Navilux City Analysis...</Text>
        <Text style={[styles.loaderSubtext, { color: theme.subText }]}>Analyzing Weather, Safety, Health & Network Data</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.text }]}>City Analysis</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* City Header */}
        <View style={styles.cityHeader}>
          <Text style={[styles.cityName, { color: theme.text }]}>{city || 'Delhi'}</Text>
          <View style={styles.cityBadge}>
            <Ionicons name="sparkles" size={14} color="#fff" />
            <Text style={styles.cityBadgeText}>AI Insights</Text>
          </View>
        </View>

        {/* AI Travel Score Card */}
        {aiReport && (
          <LinearGradient
            colors={isDarkMode ? ['#3b0764', '#1e1b4b'] : ['#8B5CF6', '#6366f1']}
            style={styles.scoreCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.scoreHeader}>
              <Text style={styles.scoreTitle}>AI Travel Score</Text>
              <Text style={styles.confidenceText}>{aiReport.confidence*100}% Confidence</Text>
            </View>
            <View style={styles.scoreCircleContainer}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreValue}>{aiReport.score}</Text>
                <Text style={styles.scoreMax}>/100</Text>
              </View>
              <View style={styles.scoreDetails}>
                <Text style={styles.badgeText}>{aiReport.badge}</Text>
                <Text style={styles.summaryText}>{aiReport.summary}</Text>
              </View>
            </View>
          </LinearGradient>
        )}

        {/* Network & Crime Row */}
        <View style={styles.rowCards}>
          <View style={[styles.halfCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
            <Ionicons name="cellular" size={24} color="#10B981" />
            <Text style={[styles.halfCardTitle, { color: theme.text }]}>Network</Text>
            <Text style={[styles.halfCardValue, { color: theme.text }]} numberOfLines={1}>
              {networkData?.['Network Covrage'] || 'Unknown'}
            </Text>
            <Text style={[styles.halfCardAdvice, { color: theme.subText }]}>{aiReport?.networkAdvice || 'Standard coverage.'}</Text>
          </View>

          <View style={[styles.halfCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
            <Ionicons name="shield-checkmark" size={24} color="#EF4444" />
            <Text style={[styles.halfCardTitle, { color: theme.text }]}>Safety</Text>
            <Text style={[styles.halfCardValue, { color: theme.text }]} numberOfLines={1}>
              {crimeData?.['Risk Level'] || 'Unknown'} Risk
            </Text>
            <Text style={[styles.halfCardAdvice, { color: theme.subText }]}>{aiReport?.safetyAdvice || 'Stay aware.'}</Text>
          </View>
        </View>

        {/* Weather Forecast Card */}
        <View style={[styles.fullCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="partly-sunny" size={22} color="#F59E0B" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Weather & Forecast</Text>
          </View>
          <View style={styles.aqiRow}>
             <Text style={[styles.aqiValueText, { color: theme.text, fontSize: 15 }]}>
               Currently: {weatherData?.weather?.[0]?.main || '--'}, {weatherData?.main?.temp ? Math.round(weatherData.main.temp) : '--'}°C
             </Text>
          </View>
          <Text style={[styles.adviceText, { color: theme.subText }]}>{aiReport?.weatherAdvice || 'Analyzing weather patterns...'}</Text>
        </View>

        {/* Health & AQI Card */}
        <View style={[styles.fullCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="fitness" size={22} color="#3B82F6" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Health & Air Quality</Text>
          </View>
          <View style={styles.aqiRow}>
            <View style={[styles.aqiBadge, { backgroundColor: aqiStatus.color + '20' }]}>
              <Text style={[styles.aqiValueText, { color: aqiStatus.color }]}>AQI {aqiData?.aqi || '--'}</Text>
            </View>
            <Text style={[styles.aqiStatusText, { color: aqiStatus.color }]}>{aqiStatus.label}</Text>
          </View>
          <Text style={[styles.adviceText, { color: theme.subText }]}>{aiReport?.healthAdvice || 'Air quality data unavailable.'}</Text>
        </View>

        {/* AI Suggestions Card */}
        <LinearGradient
          colors={isDarkMode ? ['#0f172a', '#1e293b'] : ['#f0fdfa', '#ccfbf1']}
          style={[styles.fullCard, { borderWidth: isDarkMode ? 1 : 0, borderColor: theme.border }]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="bulb" size={22} color="#0D9488" />
            <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFF' : '#0F766E' }]}>AI Insights</Text>
          </View>
          <Text style={[styles.insightLabel, { color: isDarkMode ? '#cbd5e1' : '#0F766E' }]}>Best Time to Visit:</Text>
          <Text style={[styles.insightText, { color: isDarkMode ? '#f8fafc' : '#115e59' }]}>{aiReport?.bestTime || 'Anytime'}</Text>
          
          {aiReport?.warnings?.length > 0 && (
            <View style={styles.warningsContainer}>
              <Text style={[styles.insightLabel, { color: '#EF4444', marginTop: 8 }]}>Warnings:</Text>
              {aiReport.warnings.map((w, idx) => (
                <Text key={idx} style={[styles.warningText, { color: isDarkMode ? '#fca5a5' : '#b91c1c' }]}>• {w}</Text>
              ))}
            </View>
          )}
        </LinearGradient>

        {/* Explore Nearby */}
        {explorePlaces.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Safe Places to Explore</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {explorePlaces.map((place) => (
                <TouchableOpacity key={place.id} style={[styles.exploreCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
                  <Image source={{ uri: place.image }} style={styles.exploreImage} />
                  <View style={styles.exploreContent}>
                    <Text style={[styles.exploreTitle, { color: theme.text }]} numberOfLines={1}>{place.title}</Text>
                    <Text style={[styles.exploreSub, { color: theme.subText }]}>
                      {place.distance ? `📍 ${place.distance} • ` : ''}⭐ {place.rating}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Latest News */}
        {news.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>News</Text>
            {news.map((item, idx) => (
              <TouchableOpacity key={idx} style={[styles.newsCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]} onPress={() => Linking.openURL(item.url)}>
                <Image source={{ uri: item.image || 'https://via.placeholder.com/150' }} style={styles.newsImage} />
                <View style={styles.newsContent}>
                  <Text style={[styles.newsTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
                  <Text style={[styles.newsSource, { color: theme.primary }]}>{item.source.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 40 : 30 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 },
  topTitle: { fontSize: 18, fontWeight: '700' },
  backButton: { padding: 4 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  loaderSubtext: { fontSize: 13, marginTop: 6 },
  
  cityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  cityName: { fontSize: 28, fontWeight: '800' },
  cityBadge: { flexDirection: 'row', backgroundColor: '#8B5CF6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignItems: 'center' },
  cityBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 4 },

  scoreCard: { borderRadius: 24, padding: 20, marginBottom: 16, elevation: 5, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  scoreTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  confidenceText: { color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, fontSize: 11, fontWeight: '700', overflow: 'hidden' },
  scoreCircleContainer: { flexDirection: 'row', alignItems: 'center' },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  scoreValue: { color: '#fff', fontSize: 32, fontWeight: '800' },
  scoreMax: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: -4 },
  scoreDetails: { flex: 1, marginLeft: 16 },
  badgeText: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  summaryText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 18 },

  rowCards: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  halfCard: { flex: 0.48, borderRadius: 20, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  halfCardTitle: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  halfCardValue: { fontSize: 16, fontWeight: '800', marginVertical: 4, textTransform: 'capitalize' },
  halfCardAdvice: { fontSize: 11, lineHeight: 14 },

  fullCard: { borderRadius: 20, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginLeft: 8 },
  aqiRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  aqiBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  aqiValueText: { fontWeight: '700', fontSize: 14 },
  aqiStatusText: { fontWeight: '700', fontSize: 14 },
  adviceText: { fontSize: 13, lineHeight: 18 },

  insightLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  insightText: { fontSize: 15, fontWeight: '600', marginBottom: 8, marginTop: 2 },
  warningsContainer: { marginTop: 4, backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 12 },
  warningText: { fontSize: 13, fontWeight: '500', marginBottom: 2 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  horizontalScroll: { paddingRight: 16 },
  exploreCard: { width: width * 0.6, borderRadius: 16, marginRight: 16, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  exploreImage: { width: '100%', height: 120 },
  exploreContent: { padding: 12 },
  exploreTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  exploreSub: { fontSize: 12 },

  newsCard: { flexDirection: 'row', borderRadius: 16, overflow: 'hidden', marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  newsImage: { width: 100, height: 100 },
  newsContent: { flex: 1, padding: 12, justifyContent: 'center' },
  newsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8, lineHeight: 20 },
  newsSource: { fontSize: 12, fontWeight: '700' },
});
