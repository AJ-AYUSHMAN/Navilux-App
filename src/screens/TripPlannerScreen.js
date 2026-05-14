import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Animated,
  Keyboard,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../context/ThemeContext';
import { auth, db } from '../config/firebaseConfig';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import { GEMINI_API_KEY } from '@env';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { OLA_API_KEY as ENV_OLA_API_KEY } from '@env';

const OLA_API_KEY = ENV_OLA_API_KEY;

const MODEL_PRIORITY = [
  'gemini-3-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash'
];

const GROUNDING_MODEL_PRIORITY = [
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash'
];

const DAY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const ITEM_HEIGHT = 56;
const DAYS_OPTIONS = Array.from({ length: 14 }, (_, i) => ({
  label: `${i + 1} Days`,
  value: i + 1
}));

export default function TripPlannerScreen({ navigation }) {
  const { isDarkMode, theme, hapticsEnabled } = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);
  const [tripData, setTripData] = useState(null);
  const [savedTrips, setSavedTrips] = useState([]);
  
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('3');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isViewingSaved, setIsViewingSaved] = useState(false);
  
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info', onConfirm: null, onCancel: null, confirmText: 'OK', cancelText: 'Cancel' });

  const showCustomAlert = (title, message, type, onConfirm = null, onCancel = null, confirmText = 'OK', cancelText = 'Cancel') => {
    setAlertConfig({ title, message, type, onConfirm, onCancel, confirmText, cancelText });
    setAlertVisible(true);
  };
  
  const mapRef = useRef(null);
  
  const scrollY = useRef(new Animated.Value(2 * ITEM_HEIGHT)).current;
  const lastHapticIndex = useRef(2);

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      const index = Math.min(Math.max(Math.round(value / ITEM_HEIGHT), 0), DAYS_OPTIONS.length - 1);
      if (index !== lastHapticIndex.current) {
        if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        lastHapticIndex.current = index;
      }
    });
    return () => scrollY.removeListener(listener);
  }, [hapticsEnabled]);

  const handleDaysScrollEnd = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.min(Math.max(Math.round(y / ITEM_HEIGHT), 0), DAYS_OPTIONS.length - 1);
    if (DAYS_OPTIONS[index]) {
      setDays(DAYS_OPTIONS[index].value.toString());
    }
  };

  useEffect(() => {
    loadSavedTrip();
    loadSavedTripsList();
  }, []);

  const loadSavedTripsList = async () => {
    if (!auth.currentUser) return;
    try {
      const qSnap = await getDocs(collection(db, 'users', auth.currentUser.uid, 'saved_trips'));
      const trips = [];
      qSnap.forEach(d => {
         trips.push({ id: d.id, ...d.data() });
      });
      setSavedTrips(trips);
    } catch(e) {}
  };

  const loadSavedTrip = async () => {
    if (!auth.currentUser) return;
    try {
      setLoading(true);
      const tripDoc = await getDoc(doc(db, 'users', auth.currentUser.uid, 'trips', 'current'));
      if (tripDoc.exists()) {
        const data = tripDoc.data();
        if (data && data.destination) {
          setTripData(data);
        }
      }
    } catch (e) {
      console.log('Error loading trip', e);
    } finally {
      setLoading(false);
    }
  };

  const saveTrip = async (data) => {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'trips', 'current'), data);
    } catch (e) {
      console.log('Error saving trip', e);
    }
  };

  const fetchOlaPlaces = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]); return;
    }
    try {
      const res = await fetch(`https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(query)}&api_key=${OLA_API_KEY}`);
      const data = await res.json();
      if (data.predictions) setSuggestions(data.predictions);
      else setSuggestions([]);
    } catch (e) {}
  };

  const onSearchChange = (text) => {
    setDestination(text);
    fetchOlaPlaces(text);
  };

  const onSelectSuggestion = (place) => {
    Keyboard.dismiss();
    setDestination(place.description.split(',')[0]);
    setSuggestions([]);
    setIsFocused(false);
  };

  const generateTrip = async () => {
    setSuggestions([]);
    setIsFocused(false);
    Keyboard.dismiss();

    if (!destination.trim() || !days.trim()) {
      showCustomAlert('Missing Info', 'Please enter a destination and number of days.', 'info');
      return;
    }
    
    let targetDest = destination;
    if (destination.toLowerCase() === 'current location') {
      try {
        setLoading(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          const geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          targetDest = geo[0]?.city || geo[0]?.region || 'Unknown Location';
          setDestination(targetDest);
        }
      } catch (e) {
         console.log(e);
      }
    }

    try {
      setLoading(true);
      const prompt = `You are an expert travel planner. Create a ${days} day itinerary for ${targetDest}.
Use your Google Maps tool to suggest famous places and attractions that actually exist.
Return ONLY a valid JSON object strictly matching this format (no markdown, no backticks, just raw JSON):
{
  "destination": "${targetDest}",
  "daysCount": ${days},
  "overview": "A brief 2 sentence summary of the trip.",
  "days": [
    {
      "day": 1,
      "locations": [
        {
          "id": "unique-id-day1-loc1",
          "name": "Location Name",
          "description": "Brief description",
          "lat": 0.0,
          "lng": 0.0,
          "visited": false
        }
      ]
    }
  ]
}
Ensure all 'lat' and 'lng' are accurate numeric coordinates for the specific places.`;

      for (const model of GROUNDING_MODEL_PRIORITY) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              tools: [{ googleMaps: {} }]
            })
          });

          const result = await response.json();
          if (response.ok && result?.candidates?.[0]?.content?.parts?.[0]?.text) {
            let textResponse = result.candidates[0].content.parts[0].text;
            textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(textResponse);
            setTripData(parsedData);
            await saveTrip(parsedData);
            return; // Success, exit loop
          }
        } catch (modelErr) {
          console.log(`Model ${model} failed, trying next...`);
        }
      }
      
      throw new Error("All models failed.");
      
    } catch (e) {
      console.log(e);
      showCustomAlert('Error', 'Could not generate the trip at this time. Please try again.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const toggleVisit = (dayIndex, locIndex) => {
    const newData = { ...tripData };
    const currentState = newData.days[dayIndex].locations[locIndex].visited;
    newData.days[dayIndex].locations[locIndex].visited = !currentState;
    setTripData(newData);
    saveTrip(newData);

    if (!currentState && !isViewingSaved) {
      let allVisited = true;
      for (const d of newData.days) {
        for (const loc of d.locations) {
          if (!loc.visited) {
            allVisited = false;
            break;
          }
        }
        if (!allVisited) break;
      }

      if (allVisited) {
        setTimeout(() => {
          showCustomAlert(
            'Trip Completed!', 
            'You have visited every location! Would you like to save this trip to your history?', 
            'success', 
            () => finishTrip(), 
            () => {}, 
            'Save Trip', 
            'Not Yet'
          );
        }, 600);
      }
    }
  };

  const clearTrip = () => {
    showCustomAlert('Discard Trip', 'Are you sure you want to discard this trip and plan a new one?', 'danger', async () => {
      setTripData(null);
      if (auth.currentUser) {
         await setDoc(doc(db, 'users', auth.currentUser.uid, 'trips', 'current'), {});
      }
    }, () => {}, 'Discard', 'Cancel');
  };

  const finishTrip = async () => {
    if (!tripData) return;
    try {
        setLoading(true);
        await addDoc(collection(db, 'users', auth.currentUser.uid, 'saved_trips'), tripData);
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'trips', 'current'), {});
        setTripData(null);
        await loadSavedTripsList();
        showCustomAlert('Trip Saved', 'Your itinerary has been successfully saved to your history!', 'success');
    } catch(e) {
        showCustomAlert('Error', 'Failed to save trip.', 'danger');
    } finally {
        setLoading(false);
    }
  };

  const deleteSavedTrip = async (tripId) => {
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'saved_trips', tripId));
      await loadSavedTripsList();
    } catch(e) {}
  };

  const clearAllSavedTrips = () => {
    showCustomAlert('Clear History', 'Are you sure you want to delete all saved trips?', 'danger', async () => {
       for (let t of savedTrips) {
          await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'saved_trips', t.id));
       }
       setSavedTrips([]);
    }, () => {}, 'Clear All', 'Cancel');
  };

  const viewSavedTrip = (trip) => {
     setTripData(trip);
     setIsViewingSaved(true);
  };

  const closeViewedTrip = () => {
     setTripData(null);
     setIsViewingSaved(false);
  };

  // ----------------------------------------------------
  // SETUP UI
  // ----------------------------------------------------
  if (!tripData) {
    return (
      <LinearGradient 
        colors={isDarkMode ? ['#0F172A', '#1E293B'] : ['#E0E7FF', '#DBEAFE']}
        style={styles.container}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTransparent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.setupScroll} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: 40, marginTop: 10, paddingHorizontal: 20 }}>
            <Ionicons name="planet" size={64} color="#3B82F6" style={{ marginBottom: 12 }} />
            <Text style={[styles.setupTitle, { color: theme.text }]}>Design Your Perfect Trip</Text>
            <Text style={[styles.setupSub, { color: theme.subText }]}>Navilux AI builds highly optimized itineraries instantly.</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: theme.text }]}>Where are you going?</Text>
            <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="location" size={22} color="#10B981" style={{marginLeft: 16}} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="City, Country, or 'Current'"
                placeholderTextColor={theme.subText}
                value={destination}
                onChangeText={onSearchChange}
                onFocus={() => setIsFocused(true)}
              />
              {destination.length > 0 && (
                <TouchableOpacity onPress={() => {setDestination(''); setSuggestions([]);}} style={{padding: 10}}>
                  <Ionicons name="close-circle" size={20} color={theme.subText} />
                </TouchableOpacity>
              )}
            </View>

            {isFocused && suggestions.length > 0 && (
              <View style={[styles.suggestionsBox, { backgroundColor: isDarkMode ? '#171717' : '#FFFFFF', borderColor: theme.border }]}>
                {suggestions.map((item) => (
                  <TouchableOpacity key={item.place_id} style={[styles.suggestionItem, { borderBottomColor: theme.border }]} onPress={() => onSelectSuggestion(item)}>
                    <Ionicons name="navigate-outline" size={16} color="#3B82F6" style={{marginRight: 12}} />
                    <View style={{flex: 1}}>
                      <Text numberOfLines={1} style={[styles.suggestionText, { color: theme.text }]}>{item.description.split(',')[0]}</Text>
                      <Text numberOfLines={1} style={{fontSize: 12, color: theme.subText, marginTop: 2}}>{item.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {destination.trim().length > 0 && !loading && (
              <>
                <Text style={[styles.radiusLabel, { color: theme.subText, marginTop: 16, marginBottom: 16 }]}>TRIP DURATION</Text>
                
                <View style={[styles.wheelContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                   <View style={[styles.wheelSelection, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]} pointerEvents="none" />
                   <Animated.ScrollView
                     nestedScrollEnabled={true}
                     showsVerticalScrollIndicator={false}
                     snapToInterval={ITEM_HEIGHT}
                     decelerationRate="fast"
                     contentOffset={{ x: 0, y: 2 * ITEM_HEIGHT }}
                     onScroll={Animated.event(
                       [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                       { useNativeDriver: false }
                     )}
                     onMomentumScrollEnd={handleDaysScrollEnd}
                     onScrollEndDrag={handleDaysScrollEnd}
                     scrollEventThrottle={16}
                     contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                   >
                     {DAYS_OPTIONS.map((opt, i) => {
                       const inputRange = [ (i - 1) * ITEM_HEIGHT, i * ITEM_HEIGHT, (i + 1) * ITEM_HEIGHT ];
                       const scale = scrollY.interpolate({ inputRange, outputRange: [0.75, 1.1, 0.75], extrapolate: 'clamp' });
                       const opacity = scrollY.interpolate({ inputRange, outputRange: [0.2, 1, 0.2], extrapolate: 'clamp' });
                       return (
                         <Animated.View key={i} style={[styles.wheelItem, { height: ITEM_HEIGHT, transform: [{ scale }], opacity }]}>
                           <Text style={[styles.wheelText, { color: theme.text }]}>{opt.label}</Text>
                         </Animated.View>
                       );
                     })}
                   </Animated.ScrollView>
                </View>
              </>
            )}

            {destination.trim().length > 0 && (
              <TouchableOpacity 
                style={[styles.actionBtn, { opacity: loading ? 0.7 : 1, marginTop: loading ? 30 : 8 }]} 
                onPress={generateTrip} 
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Ionicons name="sparkles" size={20} color="#fff" />
                      <Text style={styles.actionBtnText}>Generate</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {savedTrips.length > 0 && (
              <View style={styles.savedTripsSection}>
                <View style={styles.savedTripsHeader}>
                   <Text style={[styles.savedTripsTitle, { color: theme.text }]}>Your Saved Trips</Text>
                   <TouchableOpacity onPress={clearAllSavedTrips}>
                      <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 13 }}>Clear All</Text>
                   </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingBottom: 10 }}>
                   {savedTrips.map((t, tIndex) => (
                      <TouchableOpacity key={t.id || `saved-${tIndex}`} style={[styles.savedTripCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]} onPress={() => viewSavedTrip(t)}>
                         <Ionicons name="map" size={26} color="#3B82F6" style={{ marginBottom: 12 }} />
                         <Text style={[styles.savedTripDest, { color: theme.text }]} numberOfLines={1}>{t.destination}</Text>
                         <Text style={[styles.savedTripDays, { color: theme.subText }]}>{t.daysCount} Days</Text>
                         <TouchableOpacity style={styles.deleteTripBtn} onPress={() => deleteSavedTrip(t.id)}>
                            <Ionicons name="trash" size={18} color="#EF4444" />
                         </TouchableOpacity>
                      </TouchableOpacity>
                   ))}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>

        <Modal visible={alertVisible} transparent={true} animationType="fade" onRequestClose={() => setAlertVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
              <View style={styles.modalIconWrap}>
                {alertConfig.type === 'success' && <Ionicons name="checkmark-circle" size={60} color="#10B981" />}
                {alertConfig.type === 'danger' && <Ionicons name="warning" size={60} color="#EF4444" />}
                {alertConfig.type === 'info' && <Ionicons name="information-circle" size={60} color="#3B82F6" />}
              </View>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{alertConfig.title}</Text>
              {alertConfig.message ? <Text style={[styles.modalMsg, { color: theme.subText }]}>{alertConfig.message}</Text> : null}
              
              <View style={styles.modalBtnRow}>
                {alertConfig.onCancel && (
                   <TouchableOpacity onPress={() => { setAlertVisible(false); alertConfig.onCancel(); }} style={[styles.modalBtnCancel, { backgroundColor: theme.background, borderColor: theme.border }]}>
                     <Text style={[styles.modalBtnText, { color: theme.text }]}>{alertConfig.cancelText}</Text>
                   </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => { setAlertVisible(false); if(alertConfig.onConfirm) alertConfig.onConfirm(); }} style={[styles.modalBtnConfirm, { backgroundColor: alertConfig.type === 'danger' ? '#EF4444' : '#3B82F6' }, !alertConfig.onCancel && { flex: 0, paddingHorizontal: 40 }]}>
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>{alertConfig.confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    );
  }

  // ----------------------------------------------------
  // ACTIVE TRIP UI
  // ----------------------------------------------------
  const allLocations = tripData.days.flatMap(d => d.locations);

  const getMapHtml = (trip, isDark) => {
    if (!trip || !trip.days || trip.days.length === 0) return '';
    const allLocs = trip.days.flatMap(d => d.locations);
    if (allLocs.length === 0) return '';

    const centerLat = allLocs[0].lat;
    const centerLng = allLocs[0].lng;

    let markersJs = '';
    let linesJs = '';

    trip.days.forEach((dayItem, dIndex) => {
      const color = DAY_COLORS[dIndex % DAY_COLORS.length];
      const latlngs = [];
      dayItem.locations.forEach((loc, lIndex) => {
        latlngs.push([loc.lat, loc.lng]);
        const markerColor = loc.visited ? '#9CA3AF' : color;
        markersJs += `
          var icon_${dIndex}_${lIndex} = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:${markerColor};width:26px;height:26px;border-radius:50%;border:2px solid white;box-shadow:0 0 5px rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;color:white;font-size:13px;font-family:sans-serif;font-weight:bold;'>${dayItem.day}</div>",
            iconSize: [30, 30], iconAnchor: [15, 15]
          });
          var marker_${dIndex}_${lIndex} = L.marker([${loc.lat}, ${loc.lng}], {icon: icon_${dIndex}_${lIndex}}).addTo(map);
          marker_${dIndex}_${lIndex}.bindPopup("<b>Day ${dayItem.day}: ${loc.name.replace(/"/g, '\\"')}</b>");
        `;
      });

      if (latlngs.length > 1) {
        linesJs += `
          L.polyline(${JSON.stringify(latlngs)}, {color: '${color}', weight: 4, opacity: 0.8, dashArray: '5, 10'}).addTo(map);
        `;
      }
    });

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        body { padding: 0; margin: 0; background-color: ${isDark ? '#202124' : '#F4F7FB'}; }
        #map { height: 100vh; width: 100vw; }
        ${isDark ? `
        .leaflet-layer, .leaflet-control-zoom-in, .leaflet-control-zoom-out, .leaflet-control-attribution {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }` : ''}
        .leaflet-control-attribution { display: none; }
        .leaflet-popup-content-wrapper { border-radius: 8px; }
      </style>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
        
        ${markersJs}
        ${linesJs}
        
        var allLatLngs = ${JSON.stringify(allLocs.map(l => [l.lat, l.lng]))};
        if (allLatLngs.length > 1) {
            var poly = L.polyline(allLatLngs);
            map.fitBounds(poly.getBounds(), { padding: [40, 40] });
        }
      </script>
    </body>
    </html>
    `;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => isViewingSaved ? closeViewedTrip() : navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{tripData.destination}</Text>
        <View style={{ flexDirection: 'row' }}>
          {!isViewingSaved ? (
            <>
              <TouchableOpacity onPress={finishTrip} style={styles.addBtn}>
                <Ionicons name="flag" size={24} color="#10B981" style={{ marginRight: 12 }} />
              </TouchableOpacity>
              <TouchableOpacity onPress={clearTrip} style={styles.addBtn}>
                <Ionicons name="close-circle" size={28} color="#EF4444" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={closeViewedTrip} style={styles.addBtn}>
              <Ionicons name="close-circle" size={28} color={theme.subText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {allLocations.length > 0 && (
          <View style={styles.mapContainer}>
            <WebView
              ref={mapRef}
              source={{ html: getMapHtml(tripData, isDarkMode) }}
              style={StyleSheet.absoluteFillObject}
              nestedScrollEnabled={true}
              javaScriptEnabled={true}
            />
            <View style={styles.mapOverlay}>
              <View style={styles.mapBadge}>
                <Ionicons name="map" size={16} color="#fff" />
                <Text style={styles.mapBadgeText}>Interactive Map</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.contentWrap}>
          <View style={[styles.overviewBox, { backgroundColor: isDarkMode ? '#1E293B' : '#E0E7FF' }]}>
            <Ionicons name="information-circle" size={24} color="#3B82F6" style={{ marginRight: 12, marginTop: 2 }} />
            <Text style={[styles.overviewText, { color: isDarkMode ? '#CBD5E1' : '#1E3A8A' }]}>{tripData.overview}</Text>
          </View>

          {tripData.days.map((dayItem, dIndex) => {
            const dayColor = DAY_COLORS[dIndex % DAY_COLORS.length];
            return (
              <View key={'d-'+dIndex} style={styles.dayGroup}>
                <View style={styles.dayHeader}>
                  <View style={[styles.dayBadge, { backgroundColor: dayColor }]}>
                    <Text style={styles.dayBadgeText}>Day {dayItem.day}</Text>
                  </View>
                  <View style={[styles.dayLine, { backgroundColor: dayColor, opacity: 0.3 }]} />
                </View>
                
                {dayItem.locations.map((loc, lIndex) => (
                  <TouchableOpacity 
                    key={`loc-${dIndex}-${lIndex}`} 
                    style={[styles.locationCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}
                    activeOpacity={0.8}
                    onPress={() => toggleVisit(dIndex, lIndex)}
                  >
                    <View style={styles.checkboxArea}>
                      <View style={[styles.checkbox, loc.visited ? { backgroundColor: dayColor, borderColor: dayColor } : { borderColor: theme.subText }]}>
                        {loc.visited && <Ionicons name="checkmark" size={16} color="#fff" />}
                      </View>
                    </View>
                    <View style={styles.locationInfo}>
                      <Text style={[styles.locName, { color: theme.text, textDecorationLine: loc.visited ? 'line-through' : 'none', opacity: loc.visited ? 0.5 : 1 }]}>
                        {loc.name}
                      </Text>
                      <Text style={[styles.locDesc, { color: theme.subText, opacity: loc.visited ? 0.5 : 1 }]}>{loc.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={alertVisible} transparent={true} animationType="fade" onRequestClose={() => setAlertVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
            <View style={styles.modalIconWrap}>
              {alertConfig.type === 'success' && <Ionicons name="checkmark-circle" size={60} color="#10B981" />}
              {alertConfig.type === 'danger' && <Ionicons name="warning" size={60} color="#EF4444" />}
              {alertConfig.type === 'info' && <Ionicons name="information-circle" size={60} color="#3B82F6" />}
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{alertConfig.title}</Text>
            {alertConfig.message ? <Text style={[styles.modalMsg, { color: theme.subText }]}>{alertConfig.message}</Text> : null}
            
            <View style={styles.modalBtnRow}>
              {alertConfig.onCancel && (
                 <TouchableOpacity onPress={() => { setAlertVisible(false); alertConfig.onCancel(); }} style={[styles.modalBtnCancel, { backgroundColor: theme.background, borderColor: theme.border }]}>
                   <Text style={[styles.modalBtnText, { color: theme.text }]}>{alertConfig.cancelText}</Text>
                 </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => { setAlertVisible(false); if(alertConfig.onConfirm) alertConfig.onConfirm(); }} style={[styles.modalBtnConfirm, { backgroundColor: alertConfig.type === 'danger' ? '#EF4444' : '#3B82F6' }, !alertConfig.onCancel && { flex: 0, paddingHorizontal: 40 }]}>
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>{alertConfig.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTransparent: { paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 10 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 14,
    borderBottomWidth: 1, zIndex: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  backBtn: { padding: 4, marginLeft: -4 },
  addBtn: { padding: 4, marginRight: -4 },

  setupScroll: { paddingBottom: 40 },
  heroSection: { paddingHorizontal: 16, marginBottom: 24 },
  heroGradient: { borderRadius: 24, padding: 32, alignItems: 'center', elevation: 4, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  setupTitle: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  setupSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },

  formSection: { paddingHorizontal: 24 },
  label: { fontSize: 15, fontWeight: '700', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 24, height: 60,
    borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: {width: 0, height: 8},
  },
  searchInput: { flex: 1, height: '100%', paddingHorizontal: 16, fontSize: 16, fontWeight: '500' },
  
  radiusLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, alignSelf: 'center' },
  
  wheelContainer: {
    height: 168, borderRadius: 24, position: 'relative', overflow: 'hidden', marginBottom: 30,
    justifyContent: 'center', borderWidth: 1
  },
  wheelSelection: {
    position: 'absolute', top: 56, left: 16, right: 16, height: 56, borderRadius: 16,
  },
  wheelItem: { justifyContent: 'center', alignItems: 'center', width: '100%' },
  wheelText: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },

  actionBtn: { borderRadius: 24, overflow: 'hidden', marginTop: 8, elevation: 4, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, alignSelf: 'center', width: '70%' },
  actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 8, letterSpacing: 0.5 },

  suggestionsBox: { marginTop: 8, borderRadius: 24, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, zIndex: 20, overflow: 'hidden', paddingVertical: 8 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  suggestionText: { fontSize: 15, fontWeight: '600' },

  savedTripsSection: { marginTop: 40, paddingBottom: 20 },
  savedTripsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  savedTripsTitle: { fontSize: 18, fontWeight: 'bold' },
  savedTripCard: { width: 150, padding: 18, borderRadius: 16, marginRight: 16, position: 'relative', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  savedTripDest: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  savedTripDays: { fontSize: 13, fontWeight: '500' },
  deleteTripBtn: { position: 'absolute', top: 14, right: 14, padding: 4 },

  mapContainer: { height: 280, width: '100%', position: 'relative' },
  mapOverlay: { position: 'absolute', bottom: 16, right: 16 },
  mapBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  mapBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 6 },

  contentWrap: { padding: 16, paddingBottom: 40 },
  overviewBox: { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 24 },
  overviewText: { flex: 1, fontSize: 15, lineHeight: 22, fontWeight: '500' },

  dayGroup: { marginBottom: 32 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dayBadge: { backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  dayBadgeText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  dayLine: { flex: 1, height: 1, marginLeft: 16 },

  locationCard: {
    flexDirection: 'row', padding: 16, borderRadius: 20, marginBottom: 12,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10,
  },
  checkboxArea: { marginRight: 16, justifyContent: 'center' },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  locationInfo: { flex: 1, justifyContent: 'center' },
  locName: { fontSize: 17, fontWeight: '800', marginBottom: 6 },
  locDesc: { fontSize: 14, lineHeight: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { width: '100%', borderRadius: 24, padding: 24, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
  modalIconWrap: { marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 },
  modalMsg: { fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 12 },
  modalBtnCancel: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
  modalBtnConfirm: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  modalBtnText: { fontSize: 16, fontWeight: '700' },
});
