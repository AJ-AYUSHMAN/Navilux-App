import React, { useEffect, useState, useRef, useContext } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  FlatList,
  Dimensions,
  StatusBar,
  ScrollView,
  Platform,
  Keyboard,
  Linking,
  Animated,
  PanResponder
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { OLA_API_KEY as ENV_OLA_API_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';

const OLA_API_KEY = ENV_OLA_API_KEY; 
const { height, width } = Dimensions.get('window');

const BOTTOM_CATEGORIES = [
  { id: 'market', label: 'Local Market', icon: 'storefront' },
  { id: 'repair', label: 'Repair Shop', icon: 'build' },
  { id: 'hospital', label: 'Hospital', icon: 'local-hospital' },
  { id: 'bus', label: 'Bus Station', icon: 'directions-bus' },
  { id: 'train', label: 'Railway', icon: 'train' },
  { id: 'petrol', label: 'Petrol Pump', icon: 'local-gas-station' },
  { id: 'atm', label: 'ATM', icon: 'local-atm' },
  { id: 'pharmacy', label: 'Pharmacy', icon: 'local-pharmacy' }
];

export default function MapScreen({ route, navigation }) {
  const { isDarkMode, theme } = useContext(ThemeContext);

  const [mode, setMode] = useState(route.params?.alarmMode ? 'ALARM' : 'EXPLORE'); 
  const [searchText, setSearchText] = useState('');
  const [originText, setOriginText] = useState('Your Location');
  const [destText, setDestText] = useState('');
  const [originCoord, setOriginCoord] = useState(null);
  const [destCoord, setDestCoord] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [activeInput, setActiveInput] = useState(''); 
  const [routeCoords, setRouteCoords] = useState([]);

  const webViewRef = useRef(null);

  const getMapHtml = () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        body { padding: 0; margin: 0; background-color: ${isDarkMode ? '#202124' : '#F4F7FB'}; }
        #map { height: 100vh; width: 100vw; }
        ${isDarkMode ? `
        .leaflet-layer, .leaflet-control-zoom-in, .leaflet-control-zoom-out, .leaflet-control-attribution {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }` : ''}
        .leaflet-control-attribution { display: none; }
      </style>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([20.5937, 78.9629], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        var startMarker = null;
        var endMarker = null;
        var routeLine = null;

        var startIcon = L.divIcon({
          className: 'custom-div-icon',
          html: "<div style='background-color:#4285F4;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 5px rgba(0,0,0,0.5);'></div>",
          iconSize: [22, 22], iconAnchor: [11, 11]
        });

        var endIcon = L.divIcon({
          className: 'custom-div-icon',
          html: "<div style='color:#EA4335;font-size:36px;text-shadow:0 0 5px rgba(0,0,0,0.5);margin-top:-36px;margin-left:-12px;'>📍</div>",
          iconSize: [24, 36], iconAnchor: [12, 36]
        });

        document.addEventListener("message", function(event) {
           try {
               var data = JSON.parse(event.data);
               if(data.type === 'UPDATE_MAP') {
                  if(startMarker) map.removeLayer(startMarker);
                  if(endMarker) map.removeLayer(endMarker);
                  if(routeLine) map.removeLayer(routeLine);
                  
                  if(data.origin) {
                     startMarker = L.marker([data.origin.latitude, data.origin.longitude], {icon: startIcon}).addTo(map);
                  }
                  if(data.dest) {
                     endMarker = L.marker([data.dest.latitude, data.dest.longitude], {icon: endIcon}).addTo(map);
                  }
                  
                  if(data.routeCoords && data.routeCoords.length > 0) {
                     var latlngs = data.routeCoords.map(c => [c.latitude, c.longitude]);
                     routeLine = L.polyline(latlngs, {color: '#4285F4', weight: 5, opacity: 0.8}).addTo(map);
                     map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
                  } else if (data.origin && data.dest) {
                     var group = new L.featureGroup([startMarker, endMarker]);
                     map.fitBounds(group.getBounds(), { padding: [50, 50] });
                  } else if (data.dest) {
                     map.setView([data.dest.latitude, data.dest.longitude], 14);
                  } else if (data.origin) {
                     map.setView([data.origin.latitude, data.origin.longitude], 14);
                  }
               } else if (data.type === 'ZOOM_IN') {
                  map.zoomIn();
               } else if (data.type === 'ZOOM_OUT') {
                  map.zoomOut();
               } else if (data.type === 'CENTER') {
                  map.setView([data.lat, data.lon], 15);
               }
           } catch (e) {}
        });
        
        window.addEventListener("message", function(event) {
            document.dispatchEvent(new MessageEvent("message", { data: event.data }));
        });

        map.on('click', function(e) {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_CLICKED', lat: e.latlng.lat, lng: e.latlng.lng }));
            }
        });
        map.on('dragstart', function() {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_DRAGGED' }));
            }
        });
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
     if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
           type: 'UPDATE_MAP', origin: originCoord, dest: destCoord, routeCoords: routeCoords
        }));
     }
  }, [originCoord, destCoord, routeCoords]);

  const fetchRoute = async (origin, dest) => {
    if (!origin || !dest) return;
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${dest.longitude},${dest.latitude}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const json = await response.json();
      if (json.routes && json.routes.length > 0) {
        const coords = json.routes[0].geometry.coordinates.map(point => ({ latitude: point[1], longitude: point[0] }));
        setRouteCoords(coords);
      }
    } catch (e) { }
  };

  const bottomSheetAnim = useRef(new Animated.Value(0)).current;
  const isSheetDown = useRef(false);
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        let newY = isSheetDown.current ? 220 + gestureState.dy : gestureState.dy;
        if (newY < 0) newY = newY * 0.3; 
        bottomSheetAnim.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50 || gestureState.vy > 0.5) {
          isSheetDown.current = true;
          Animated.spring(bottomSheetAnim, { toValue: 220, useNativeDriver: true }).start();
        } else if (gestureState.dy < -50 || gestureState.vy < -0.5) {
          isSheetDown.current = false;
          Animated.spring(bottomSheetAnim, { toValue: 0, useNativeDriver: true }).start();
        } else {
          Animated.spring(bottomSheetAnim, { toValue: isSheetDown.current ? 220 : 0, useNativeDriver: true }).start();
        }
      }
    })
  ).current;

  const toggleSheet = () => {
      isSheetDown.current = !isSheetDown.current;
      Animated.spring(bottomSheetAnim, { toValue: isSheetDown.current ? 220 : 0, useNativeDriver: true }).start();
  };

  useEffect(() => {
    loadRecentSearches();
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setOriginCoord({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (route?.params?.city) {
        setSearchText(route.params.city);
        fetchOlaPlaces(route.params.city); 
        setActiveInput('search');
      }
    })();
  }, []);

  const loadRecentSearches = async () => {
     try {
        const stored = await AsyncStorage.getItem('@recent_searches');
        if (stored) setRecentSearches(JSON.parse(stored));
     } catch (e) {}
  };

  const saveRecentSearch = async (place) => {
      try {
          const filtered = recentSearches.filter(r => r.description !== place.description);
          const newRecents = [place, ...filtered].slice(0, 5);
          setRecentSearches(newRecents);
          await AsyncStorage.setItem('@recent_searches', JSON.stringify(newRecents));
      } catch (e) {}
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

  const onTextChange = (text, type) => {
      if (type === 'search') setSearchText(text);
      if (type === 'origin') setOriginText(text);
      if (type === 'dest') setDestText(text);
      setActiveInput(type);
      fetchOlaPlaces(text);
  };

  const onPlaceSelect = async (place) => {
      Keyboard.dismiss();
      const address = place.description;
      setSuggestions([]);
      setActiveInput('');
      saveRecentSearch(place);

      if (activeInput === 'search') setSearchText(address);
      if (activeInput === 'origin') setOriginText(address);
      if (activeInput === 'dest') setDestText(address);

      try {
          const geocode = await Location.geocodeAsync(address);
          if (geocode.length > 0) {
              const { latitude, longitude } = geocode[0];
              const coord = { latitude, longitude };
              if (activeInput === 'origin') {
                  setOriginCoord(coord);
                  if (mode === 'NAVIGATE' && destCoord) fetchRoute(coord, destCoord);
              }
              if (activeInput === 'dest') {
                  setDestCoord(coord);
                  if (mode === 'NAVIGATE' && originCoord) fetchRoute(originCoord, coord);
              }
              if (activeInput === 'search') {
                   setDestCoord(coord); 
                   if (mode !== 'ALARM') setMode('EXPLORE');
              }
          }
      } catch (e) {}
  };

  const startNavigationMode = () => {
      setMode('NAVIGATE');
      if (searchText && destCoord) setDestText(searchText);
      else setDestText('');
      setSuggestions([]);
      setActiveInput('');
      if (originCoord && destCoord) fetchRoute(originCoord, destCoord);
  };

  const exitNavigationMode = () => {
      setMode('EXPLORE');
      setSuggestions([]);
      setActiveInput('');
      setRouteCoords([]);
      Keyboard.dismiss();
  };

  const swapLocations = () => {
      const tempCoord = originCoord;
      setOriginCoord(destCoord);
      setDestCoord(tempCoord);
      const tempText = originText;
      setOriginText(destText);
      setDestText(tempText);
      if (destCoord && tempCoord) fetchRoute(destCoord, tempCoord);
  };

  const centerUser = async () => {
     let loc = await Location.getCurrentPositionAsync({});
     webViewRef.current?.postMessage(JSON.stringify({type: 'CENTER', lat: loc.coords.latitude, lon: loc.coords.longitude}));
  };
  const zoomIn = () => { webViewRef.current?.postMessage(JSON.stringify({type: 'ZOOM_IN'})); };
  const zoomOut = () => { webViewRef.current?.postMessage(JSON.stringify({type: 'ZOOM_OUT'})); };

  const onCategoryPress = (categoryLabel) => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(categoryLabel)}`);
  };

  const openInGoogleMaps = async () => {
    if (mode === 'NAVIGATE') {
      let url = 'https://www.google.com/maps/dir/?api=1';
      let currentLoc = null;

      if ((!originCoord && originText === 'Your Location') || (!destCoord && destText === 'Your Location')) {
         try { currentLoc = await Location.getCurrentPositionAsync({}); } catch(e) {}
      }

      const oLat = originCoord ? originCoord.latitude : (currentLoc ? currentLoc.coords.latitude : null);
      const oLng = originCoord ? originCoord.longitude : (currentLoc ? currentLoc.coords.longitude : null);

      const dLat = destCoord ? destCoord.latitude : (currentLoc ? currentLoc.coords.latitude : null);
      const dLng = destCoord ? destCoord.longitude : (currentLoc ? currentLoc.coords.longitude : null);

      if (oLat && oLng) url += `&origin=${oLat},${oLng}`;
      if (dLat && dLng) url += `&destination=${dLat},${dLng}`;

      Linking.openURL(url);
    } else if (destCoord) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destCoord.latitude},${destCoord.longitude}`);
    } else if (searchText) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchText)}`);
    }
  };

  const confirmAlarmLocation = async () => {
    if (!destCoord) return;
    try {
        const reverseGeocode = await Location.reverseGeocodeAsync({ latitude: destCoord.latitude, longitude: destCoord.longitude });
        let finalName = searchText || 'Map Location';
        let finalFullName = `${destCoord.latitude.toFixed(4)}, ${destCoord.longitude.toFixed(4)}`;
        
        if (reverseGeocode.length > 0) {
             const place = reverseGeocode[0];
             finalName = place.city || place.name || place.district || 'Selected Location';
             finalFullName = `${place.name ? place.name + ', ' : ''}${place.city || place.district || ''}, ${place.region || ''}`.replace(/^[,\s]+|[,\s]+$/g, '');
        }
        
        await AsyncStorage.setItem('@temp_alarm_location', JSON.stringify({
            lat: destCoord.latitude, 
            lng: destCoord.longitude, 
            name: finalName, 
            fullName: finalFullName 
        }));
        
        if (route.params?.alarmMode) {
            navigation.goBack();
        } else {
            navigation.navigate('DestinationAlert');
        }
    } catch(e) {
        await AsyncStorage.setItem('@temp_alarm_location', JSON.stringify({
            lat: destCoord.latitude, 
            lng: destCoord.longitude, 
            name: 'Map Location', 
            fullName: 'Custom Pinned Location' 
        }));
        
        if (route.params?.alarmMode) {
            navigation.goBack();
        } else {
            navigation.navigate('DestinationAlert');
        }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

      {/* --- 1. OPENSTREETMAP WEBVIEW --- */}
      <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: getMapHtml() }}
            style={styles.map}
            scrollEnabled={false}
            bounces={false}
            javaScriptEnabled={true}
            onLoad={() => {
                if(originCoord || destCoord) {
                    webViewRef.current?.postMessage(JSON.stringify({
                        type: 'UPDATE_MAP', origin: originCoord, dest: destCoord, routeCoords
                    }));
                }
            }}
            onMessage={(event) => {
                try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.type === 'MAP_CLICKED') {
                        Keyboard.dismiss();
                        setSuggestions([]);
                        setActiveInput('');
                        if (mode === 'ALARM') {
                           setDestCoord({ latitude: data.lat, longitude: data.lng });
                           setSearchText(`${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`);
                        }
                    } else if (data.type === 'MAP_DRAGGED') {
                        Keyboard.dismiss();
                        setSuggestions([]);
                        setActiveInput('');
                    }
                } catch(e) {}
            }}
          />
      </View>

      {/* --- 2. TOP UI LAYER --- */}
      {mode === 'EXPLORE' || mode === 'ALARM' ? (
        <View style={styles.topContainer}>
            <View style={[styles.searchBar, { backgroundColor: theme.card, borderWidth: isDarkMode ? 1 : 0, borderColor: theme.border }]}>
                <TouchableOpacity onPress={() => {
                   if (mode === 'ALARM' && !route.params?.alarmMode) {
                      setMode('EXPLORE');
                      setDestCoord(null);
                      setSearchText('');
                   } else {
                      navigation.goBack();
                   }
                }} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder={mode === 'ALARM' ? "Search alarm destination" : "Search destination"}
                    value={searchText}
                    onChangeText={(t) => onTextChange(t, 'search')}
                    onFocus={() => { 
                        setActiveInput('search'); 
                        if (searchText.length > 2) fetchOlaPlaces(searchText); 
                        else setSuggestions([]); 
                    }}
                    placeholderTextColor={theme.subText}
                />
            </View>

            {activeInput === '' && recentSearches.length > 0 && mode !== 'ALARM' && (
                <View style={styles.recentPillsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {recentSearches.map((item, index) => (
                            <TouchableOpacity key={index} style={[styles.recentPill, { backgroundColor: theme.card, borderWidth: isDarkMode ? 1 : 0, borderColor: theme.border }]} onPress={() => onPlaceSelect(item)}>
                                <Ionicons name="time-outline" size={14} color={isDarkMode ? "#8AB4F8" : theme.primary} style={{marginRight: 4}} />
                                <Text style={[styles.recentPillText, { color: theme.text }]}>{item.description.split(',')[0]}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {activeInput === 'search' && (suggestions.length > 0 || (searchText.length === 0 && recentSearches.length > 0)) && (
                <View style={[styles.suggestionsBox, { backgroundColor: theme.card, borderWidth: isDarkMode ? 1 : 0, borderColor: theme.border }]}>
                     <FlatList
                        data={searchText.length > 0 ? suggestions : recentSearches}
                        keyExtractor={(item, index) => item.place_id || index.toString()}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.suggestionItem, { borderBottomColor: theme.border }]} onPress={() => onPlaceSelect(item)}>
                                <Ionicons name={searchText.length > 0 ? "location-outline" : "time-outline"} size={20} color={theme.text} style={{marginRight:10}} />
                                <Text numberOfLines={1} style={[styles.suggestionText, { color: theme.text }]}>{item.description}</Text>
                            </TouchableOpacity>
                        )}
                     />
                </View>
            )}
        </View>
      ) : (
        <View style={[styles.navContainer, { backgroundColor: theme.card, shadowColor: isDarkMode ? '#FFF' : '#000' }]}>
            <View style={styles.navCard}>
                <View style={styles.navRow}>
                    <TouchableOpacity onPress={exitNavigationMode} style={{marginRight:15}}>
                         <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.navTitle, { color: theme.text }]}>Plan Your Route</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                        <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
                            <View style={[styles.dot, {backgroundColor:'#4285F4'}]} />
                            <TextInput 
                                style={[styles.navInput, { color: theme.text }]} value={originText}
                                onChangeText={(t) => onTextChange(t, 'origin')}
                                onFocus={() => { 
                                    setActiveInput('origin'); 
                                    if (originText.length > 2 && originText !== 'Your Location') fetchOlaPlaces(originText); 
                                    else setSuggestions([]); 
                                }}
                                placeholder="Start location" placeholderTextColor={theme.subText}
                            />
                        </View>
                        <View style={styles.connector} />
                        <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
                            <View style={[styles.dot, {backgroundColor:'#EA4335'}]} />
                            <TextInput 
                                style={[styles.navInput, { color: theme.text }]} value={destText} 
                                onChangeText={(t) => onTextChange(t, 'dest')}
                                onFocus={() => { 
                                    setActiveInput('dest'); 
                                    if (destText.length > 2) fetchOlaPlaces(destText); 
                                    else setSuggestions([]); 
                                }}
                                placeholder="Choose destination" placeholderTextColor={theme.subText} autoFocus={!destText}
                            />
                        </View>
                    </View>
                    <TouchableOpacity style={[styles.swapBtn, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]} onPress={swapLocations}>
                        <Ionicons name="swap-vertical" size={22} color={theme.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {(activeInput === 'origin' || activeInput === 'dest') && suggestions.length > 0 && (
                <View style={[styles.suggestionsBox, { marginTop: 10, backgroundColor: theme.card, borderWidth: isDarkMode ? 1 : 0, borderColor: theme.border }]}>
                     <FlatList
                        data={suggestions}
                        keyExtractor={(item) => item.place_id} keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.suggestionItem, { borderBottomColor: theme.border }]} onPress={() => onPlaceSelect(item)}>
                                <Ionicons name="navigate-circle-outline" size={22} color={theme.text} style={{marginRight:10}} />
                                <Text numberOfLines={1} style={[styles.suggestionText, { color: theme.text }]}>{item.description}</Text>
                            </TouchableOpacity>
                        )}
                     />
                </View>
            )}
        </View>
      )}

      {/* --- 3. BOTTOM SWIPE SHEET (Only in EXPLORE mode) --- */}
      {mode === 'EXPLORE' && !destCoord && (
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: bottomSheetAnim }], backgroundColor: theme.card, borderColor: theme.border, borderTopWidth: isDarkMode ? 1 : 0, borderLeftWidth: isDarkMode ? 1 : 0, borderRightWidth: isDarkMode ? 1 : 0 }]} {...panResponder.panHandlers}>
            <TouchableOpacity style={styles.dragHandleContainer} onPress={toggleSheet}>
               <View style={[styles.dragHandle, { backgroundColor: isDarkMode ? '#5F6368' : '#D1D5DB' }]} />
            </TouchableOpacity>
            
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Explore Nearby</Text>
            
            <View style={styles.gridContainer}>
                {BOTTOM_CATEGORIES.map((cat) => (
                    <TouchableOpacity key={cat.id} style={styles.gridItem} onPress={() => onCategoryPress(cat.label)}>
                        <View style={[styles.iconCircle, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
                           <MaterialIcons name={cat.icon} size={24} color={isDarkMode ? '#8AB4F8' : theme.primary} />
                        </View>
                        <Text style={[styles.gridLabel, { color: theme.subText }]} numberOfLines={1}>{cat.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Animated.View>
      )}

      {/* --- 4. BOTTOM CARDS & FABs --- */}
      {mode === 'ALARM' && (
          <View style={[styles.redirectCard, { backgroundColor: theme.card, borderWidth: isDarkMode ? 1 : 0, borderColor: theme.border, bottom: 35 }]}>
              <View style={styles.redirectInfo}>
                  <Ionicons name="alarm" size={24} color={theme.primary} />
                  <Text style={[styles.redirectTitle, { color: theme.text }]} numberOfLines={1}>
                     {destCoord ? (searchText || 'Location Selected') : 'Tap on map to drop pin'}
                  </Text>
              </View>
              {destCoord && (
                <TouchableOpacity style={[styles.googleMapsBtn, {backgroundColor: theme.text}]} onPress={confirmAlarmLocation}>
                    <Text style={[styles.googleMapsBtnText, {color: theme.background}]}>Confirm Location</Text>
                    <Ionicons name="checkmark-circle" size={20} color={theme.background} style={{marginLeft: 5}} />
                </TouchableOpacity>
              )}
          </View>
      )}

      {(mode === 'EXPLORE' ? destCoord : (destCoord || originCoord)) && activeInput === '' && mode !== 'ALARM' && (
          <View style={[styles.redirectCard, { backgroundColor: theme.card, borderWidth: isDarkMode ? 1 : 0, borderColor: theme.border, bottom: 35 }]}>
              <View style={styles.redirectInfo}>
                  <Ionicons name="location" size={24} color="#EA4335" />
                  <Text style={[styles.redirectTitle, { color: theme.text }]} numberOfLines={1}>{mode === 'NAVIGATE' ? 'Route Ready' : (searchText || destText || 'Selected Location')}</Text>
              </View>
              <TouchableOpacity style={styles.googleMapsBtn} onPress={openInGoogleMaps}>
                  <MaterialIcons name="directions" size={20} color="#FFF" style={{marginRight: 5}} />
                  <Text style={styles.googleMapsBtnText}>{mode === 'NAVIGATE' ? 'Start in Maps' : 'Open in Google Maps'}</Text>
              </TouchableOpacity>
          </View>
      )}

      <View style={[styles.fabContainer, mode === 'EXPLORE' && !destCoord ? { bottom: 275 } : { bottom: mode === 'ALARM' ? 140 : 130 }]}>
         {mode !== 'ALARM' && (
             <TouchableOpacity style={[styles.fabSmall, { backgroundColor: theme.card, borderWidth: isDarkMode ? 1 : 0, borderColor: theme.border, marginBottom: 8 }]} onPress={() => { setMode('ALARM'); setDestCoord(null); setSearchText(''); setDestText(''); }}>
                <Ionicons name="alarm-outline" size={24} color={theme.text} />
             </TouchableOpacity>
         )}

         <TouchableOpacity style={[styles.fabSmall, { backgroundColor: theme.card, borderWidth: isDarkMode ? 1 : 0, borderColor: theme.border, marginBottom: 8 }]} onPress={zoomIn}>
            <MaterialIcons name="add" size={24} color={theme.text} />
         </TouchableOpacity>
         <TouchableOpacity style={[styles.fabSmall, { backgroundColor: theme.card, borderWidth: isDarkMode ? 1 : 0, borderColor: theme.border, marginBottom: 15 }]} onPress={zoomOut}>
            <MaterialIcons name="remove" size={24} color={theme.text} />
         </TouchableOpacity>

         <TouchableOpacity style={[styles.fabSmall, { backgroundColor: theme.card, borderWidth: isDarkMode ? 1 : 0, borderColor: theme.border }]} onPress={centerUser}>
            <MaterialIcons name="my-location" size={24} color={theme.text} />
         </TouchableOpacity>

         {mode === 'EXPLORE' && (
             <TouchableOpacity style={[styles.fabLarge, { backgroundColor: isDarkMode ? '#8AB4F8' : theme.primary, marginTop: 15 }]} onPress={startNavigationMode}>
                <Ionicons name="navigate" size={26} color="#FFF" />
                <Text style={styles.fabLabel}>GO</Text>
             </TouchableOpacity>
         )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#202124' },
  mapContainer: { width: '100%', height: '100%', position: 'absolute' },
  map: { width: '100%', height: '100%', backgroundColor: 'transparent' },
  
  topContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 45, left: 0, right: 0, paddingHorizontal: 15 },
  searchBar: {
    flexDirection: 'row', backgroundColor: '#303134', borderRadius: 25, alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 12, elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6,
  },
  backBtn: { padding: 5 },
  searchInput: { flex: 1, fontSize: 16, color: '#E8EAED', marginLeft: 10 },
  
  recentPillsContainer: { marginTop: 12 },
  recentPill: {
    flexDirection: 'row', backgroundColor: '#303134', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, marginRight: 8, elevation: 4, alignItems: 'center', borderWidth: 1, borderColor: '#3C4043'
  },
  recentPillText: { fontSize: 13, color: '#E8EAED', fontWeight: '500' },

  navContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#303134', 
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingTop: Platform.OS === 'ios' ? 55 : 45, 
    paddingHorizontal: 20, paddingBottom: 25, elevation: 12, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10,
  },
  navRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  navTitle: { fontSize: 20, fontWeight: 'bold', color: '#E8EAED' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#202124', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, borderWidth: 1, borderColor: '#3C4043' },
  navInput: { flex: 1, fontSize: 16, color: '#E8EAED', marginLeft: 12 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  connector: { height: 15, borderLeftWidth: 2, borderLeftColor: '#5F6368', marginLeft: 21, marginVertical: 4 },
  swapBtn: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginLeft: 10, elevation: 4, shadowColor: '#000', shadowOpacity: 0.2 },

  suggestionsBox: {
      backgroundColor: '#303134', borderRadius: 12, marginTop: 8, maxHeight: 250,
      elevation: 6, shadowColor: '#000', shadowOpacity: 0.3, borderWidth: 1, borderColor: '#3C4043'
  },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#3C4043' },
  suggestionText: { fontSize: 15, color: '#E8EAED', flex: 1 },

  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#303134',
    borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingHorizontal: 20, paddingBottom: 35,
    elevation: 16, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 15, shadowOffset: { width: 0, height: -5 },
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#3C4043'
  },
  dragHandleContainer: { width: '100%', alignItems: 'center', paddingBottom: 15, paddingTop: 5 },
  dragHandle: { width: 40, height: 5, borderRadius: 2.5, backgroundColor: '#5F6368' },
  sheetTitle: { color: '#E8EAED', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '23%', alignItems: 'center', marginBottom: 15 },
  iconCircle: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#202124', justifyContent: 'center', alignItems: 'center', 
    marginBottom: 8, borderWidth: 1, borderColor: '#3C4043', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2
  },
  gridLabel: { color: '#9AA0A6', fontSize: 11, textAlign: 'center', fontWeight: '500' },

  redirectCard: {
      position: 'absolute', left: 20, right: 90, backgroundColor: '#303134', padding: 15, borderRadius: 16,
      elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, borderWidth: 1, borderColor: '#3C4043'
  },
  redirectInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  redirectTitle: { color: '#E8EAED', fontSize: 16, fontWeight: 'bold', marginLeft: 8, flex: 1 },
  googleMapsBtn: { flexDirection: 'row', backgroundColor: '#1A73E8', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  googleMapsBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  fabContainer: { position: 'absolute', right: 15, alignItems: 'center' },
  fabSmall: {
    width: 50, height: 50, backgroundColor: '#303134', borderRadius: 25, justifyContent: 'center', alignItems: 'center', 
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.3, borderWidth: 1, borderColor: '#3C4043'
  },
  fabLarge: {
    width: 60, height: 60, backgroundColor: '#8AB4F8', borderRadius: 20, justifyContent: 'center', alignItems: 'center', 
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.4
  },
  fabLabel: { color: '#202124', fontSize: 13, fontWeight: 'bold', marginTop: -2 }
});