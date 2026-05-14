import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';
import { startLocationAlarmTask, stopLocationAlarmTask, stopAlarmAudio } from '../services/locationAlertTask';
import { OLA_API_KEY as ENV_OLA_API_KEY } from '@env';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const OLA_API_KEY = ENV_OLA_API_KEY;

// Generate 50 increments from 100m to 5000m to make the scroll wheel massive.
// This allows the haptics to fire rapidly ("tick tick tick") exactly like a Samsung Clock!
const RADIUS_OPTIONS = Array.from({ length: 50 }, (_, i) => {
  const meters = (i + 1) * 100;
  return {
    label: meters >= 1000 ? (meters % 1000 === 0 ? `${meters / 1000}km` : `${(meters / 1000).toFixed(1)}km`) : `${meters}m`,
    value: meters
  };
});

export default function DestinationAlertScreen({ navigation, route }) {
  const { isDarkMode, hapticsEnabled } = useContext(ThemeContext);
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedDest, setSelectedDest] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState(1000);
  const [alarms, setAlarms] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  const screenFocused = useIsFocused();
  const ringingAlarm = alarms.find(a => a.isRinging === true);

  const ITEM_HEIGHT = 56;
  const scrollY = useRef(new Animated.Value(2 * ITEM_HEIGHT)).current; // Default index 2 (1km)
  const lastHapticIndex = useRef(2);
  const wheelRef = useRef(null);
  const mainScrollRef = useRef(null);

  // Floating animation for background blobs
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;

  // Handle incoming alarm location from MapScreen via AsyncStorage
  const checkTempAlarmLocation = async () => {
      try {
          const tempLoc = await AsyncStorage.getItem('@temp_alarm_location');
          if (tempLoc) {
              const { lat, lng, name, fullName } = JSON.parse(tempLoc);
              setSelectedDest({
                  name: name || 'Map Location',
                  fullName: fullName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                  latitude: lat,
                  longitude: lng
              });
              setSearchText(fullName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
              await AsyncStorage.removeItem('@temp_alarm_location');
          }
      } catch (e) {}
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, { toValue: 1, duration: 10000, useNativeDriver: true }),
        Animated.timing(floatAnim1, { toValue: 0, duration: 10000, useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, { toValue: 1, duration: 12000, useNativeDriver: true }),
        Animated.timing(floatAnim2, { toValue: 0, duration: 12000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAlarms();
      checkTempAlarmLocation();
    }, [])
  );

  useEffect(() => {
    loadAlarms();
    getCurrentLocation();
    const interval = setInterval(getCurrentLocation, 10000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let checkInterval;
    if (screenFocused) {
        checkInterval = setInterval(loadAlarms, 2000);
    }
    return () => clearInterval(checkInterval);
  }, [screenFocused]);

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      const index = Math.min(Math.max(Math.round(value / ITEM_HEIGHT), 0), RADIUS_OPTIONS.length - 1);
      if (index !== lastHapticIndex.current) {
        if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid); // Crisp tick like Samsung Clock
        lastHapticIndex.current = index;
      }
    });
    return () => scrollY.removeListener(listener);
  }, []);

  const getCurrentLocation = async () => {
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return;
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCurrentLocation(loc.coords);
    } catch (e) {}
  };

  const loadAlarms = async () => {
    try {
      const alarmsStr = await AsyncStorage.getItem('@dest_alarms');
      if (alarmsStr) {
        setAlarms(JSON.parse(alarmsStr));
      }
    } catch (e) {}
  };

  const saveAlarms = async (newAlarms) => {
    try {
      await AsyncStorage.setItem('@dest_alarms', JSON.stringify(newAlarms));
      setAlarms(newAlarms);
      
      const hasActive = newAlarms.some(a => a.isActive);
      if (hasActive) {
        let { status } = await Location.requestBackgroundPermissionsAsync();
        if (status === 'granted') {
          startLocationAlarmTask();
        } else {
          startLocationAlarmTask();
        }
      } else {
        stopLocationAlarmTask();
      }
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

  const onSearchChange = (text) => {
    setSearchText(text);
    fetchOlaPlaces(text);
  };

  const onSelectSuggestion = async (place) => {
    Keyboard.dismiss();
    setSearchText(place.description);
    setSuggestions([]);
    setIsFocused(false);

    try {
      const geocode = await Location.geocodeAsync(place.description);
      if (geocode.length > 0) {
        const { latitude, longitude } = geocode[0];
        setSelectedDest({
          name: place.description.split(',')[0],
          fullName: place.description,
          latitude,
          longitude
        });
      }
    } catch (e) {}
  };

  const handleCreateAlarm = () => {
    if (!selectedDest) return;
    
    if (selectedDest.id) {
        const newAlarms = alarms.map(a => {
            if (a.id === selectedDest.id) {
                return { ...a, radius: selectedRadius, isActive: true, isCompleted: false };
            }
            return a;
        });
        saveAlarms(newAlarms);
    } else {
        const newAlarm = {
          id: Date.now().toString(),
          name: selectedDest.name,
          fullName: selectedDest.fullName,
          latitude: selectedDest.latitude,
          longitude: selectedDest.longitude,
          radius: selectedRadius,
          isActive: true,
          isCompleted: false,
          createdAt: new Date().toISOString()
        };
        saveAlarms([newAlarm, ...alarms]);
    }
    setSelectedDest(null);
    setSearchText('');
  };

  const handleEditAlarm = (alarm) => {
    setSelectedDest({
      id: alarm.id,
      name: alarm.name,
      fullName: alarm.fullName,
      latitude: alarm.latitude,
      longitude: alarm.longitude
    });
    setSelectedRadius(alarm.radius);
    setSearchText(alarm.fullName);
    
    setTimeout(() => {
        const index = RADIUS_OPTIONS.findIndex(opt => opt.value === alarm.radius);
        if (index !== -1 && wheelRef.current) {
            wheelRef.current.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
        }
        mainScrollRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  const toggleAlarm = (id) => {
    const newAlarms = alarms.map(a => {
      if (a.id === id) return { ...a, isActive: !a.isActive, isCompleted: false };
      return a;
    });
    saveAlarms(newAlarms);
  };

  const deleteAlarm = (id) => {
    const newAlarms = alarms.filter(a => a.id !== id);
    saveAlarms(newAlarms);
  };

  const handleStopAlarm = async () => {
    await stopAlarmAudio();
    const newAlarms = alarms.map(a => {
      if (a.isRinging) return { ...a, isRinging: false, isCompleted: true, isActive: false };
      return a;
    });
    saveAlarms(newAlarms);
  };

  const handleScrollEnd = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.min(Math.max(Math.round(y / ITEM_HEIGHT), 0), RADIUS_OPTIONS.length - 1);
    if (RADIUS_OPTIONS[index]) {
      setSelectedRadius(RADIUS_OPTIONS[index].value);
    }
  };

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    if(!lat1 || !lon1 || !lat2 || !lon2) return null;
    var R = 6371;
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; 
    return d;
  };
  const deg2rad = (deg) => deg * (Math.PI / 180);

  const themeColors = isDarkMode 
    ? { bg: '#0A0A0A', text: '#FFFFFF', subText: '#A1A1AA', card: 'rgba(255,255,255,0.06)', solidCard: '#171717', border: 'rgba(255,255,255,0.1)', primary: '#60A5FA' }
    : { bg: '#F8FAFC', text: '#0F172A', subText: '#64748B', card: '#FFFFFF', solidCard: '#FFFFFF', border: 'rgba(0,0,0,0.05)', primary: '#3B82F6' };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]} onStartShouldSetResponder={() => { setIsFocused(false); Keyboard.dismiss(); return false; }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Dynamic Background Blobs */}
      <Animated.View style={[styles.bgBlob, { backgroundColor: '#8B5CF6', top: -100, left: -100, transform: [{ translateY: floatAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }) }] }]} />
      <Animated.View style={[styles.bgBlob, { backgroundColor: '#3B82F6', top: 200, right: -150, width: 400, height: 400, transform: [{ translateX: floatAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, -50] }) }] }]} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Ionicons name="chevron-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        {/* <TouchableOpacity style={[styles.iconButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Ionicons name="options-outline" size={22} color={themeColors.text} />
        </TouchableOpacity> */}
      </View>

      <ScrollView ref={mainScrollRef} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        <View style={styles.titleContainer}>
          <Text style={[styles.mainTitle, { color: themeColors.text }]}>Smart Alerts</Text>
          <Text style={[styles.subTitle, { color: themeColors.subText }]}>Wake up exactly when you arrive.</Text>
        </View>

        {/* Search Bar & Map Trigger */}
        <View style={[styles.searchContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Ionicons name="location" size={22} color={themeColors.primary} style={{marginLeft: 16}} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Where to?"
            placeholderTextColor={themeColors.subText}
            value={searchText}
            onChangeText={onSearchChange}
            onFocus={() => setIsFocused(true)}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => {setSearchText(''); setSuggestions([]); setSelectedDest(null);}} style={{padding: 10}}>
              <Ionicons name="close-circle" size={20} color={themeColors.subText} />
            </TouchableOpacity>
          )}
          <View style={{ width: 1, height: 30, backgroundColor: themeColors.border, marginHorizontal: 5 }} />
          {/* Navigate to Maps with alarmMode = true */}
          <TouchableOpacity onPress={() => { navigation.navigate('Map', { alarmMode: true }); }} style={styles.mapBtn}>
             <Ionicons name="map-outline" size={22} color={themeColors.text} />
          </TouchableOpacity>
        </View>

        {isFocused && suggestions.length > 0 && (
          <View style={[styles.suggestionsBox, { backgroundColor: themeColors.solidCard, borderColor: themeColors.border }]}>
            {suggestions.map((item) => (
              <TouchableOpacity key={item.place_id} style={[styles.suggestionItem, { borderBottomColor: themeColors.border }]} onPress={() => onSelectSuggestion(item)}>
                <View style={[styles.suggestionIcon, { backgroundColor: themeColors.bg }]}>
                  <Ionicons name="navigate-outline" size={16} color={themeColors.primary} />
                </View>
                <View style={{flex: 1}}>
                  <Text numberOfLines={1} style={[styles.suggestionText, { color: themeColors.text }]}>{item.description.split(',')[0]}</Text>
                  <Text numberOfLines={1} style={{fontSize: 12, color: themeColors.subText, marginTop: 2}}>{item.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Setup Card */}
        {selectedDest && (
          <View style={[styles.setupCard, { backgroundColor: isDarkMode ? 'rgba(23,23,23,0.8)' : 'rgba(255,255,255,0.8)', borderColor: themeColors.border }]}>
             <View style={styles.selectedRow}>
               <View style={[styles.pulseDot, { backgroundColor: themeColors.primary, shadowColor: themeColors.primary }]} />
               <View style={{flex: 1, marginLeft: 16}}>
                  <Text style={[styles.selectedTitle, { color: themeColors.text }]} numberOfLines={1}>{selectedDest.name}</Text>
                  <Text style={[styles.selectedSub, { color: themeColors.subText }]} numberOfLines={1}>{selectedDest.fullName}</Text>
               </View>
             </View>

             <Text style={[styles.radiusLabel, { color: themeColors.subText }]}>TRIGGER RADIUS</Text>
             
             {/* Apple-style Wheel Picker */}
             <View style={[styles.wheelContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <View style={[styles.wheelSelection, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]} pointerEvents="none" />
                <Animated.ScrollView
                  ref={wheelRef}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  contentOffset={{ x: 0, y: 2 * ITEM_HEIGHT }}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                  )}
                  onMomentumScrollEnd={handleScrollEnd}
                  onScrollEndDrag={handleScrollEnd}
                  scrollEventThrottle={16}
                  contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                >
                  {RADIUS_OPTIONS.map((opt, i) => {
                    const inputRange = [ (i - 1) * ITEM_HEIGHT, i * ITEM_HEIGHT, (i + 1) * ITEM_HEIGHT ];
                    const scale = scrollY.interpolate({ inputRange, outputRange: [0.75, 1.1, 0.75], extrapolate: 'clamp' });
                    const opacity = scrollY.interpolate({ inputRange, outputRange: [0.2, 1, 0.2], extrapolate: 'clamp' });
                    return (
                      <Animated.View key={i} style={[styles.wheelItem, { height: ITEM_HEIGHT, transform: [{ scale }], opacity }]}>
                        <Text style={[styles.wheelText, { color: themeColors.text }]}>{opt.label}</Text>
                      </Animated.View>
                    );
                  })}
                </Animated.ScrollView>
             </View>

             <TouchableOpacity style={[styles.createBtn, { backgroundColor: themeColors.text }]} onPress={handleCreateAlarm} activeOpacity={0.8}>
               <Text style={[styles.createBtnText, { color: themeColors.bg }]}>{selectedDest.id ? 'Save Changes' : 'Start Tracking'}</Text>
               <Ionicons name={selectedDest.id ? 'save' : 'arrow-forward'} size={20} color={themeColors.bg} style={{marginLeft: 8}} />
             </TouchableOpacity>
          </View>
        )}

        {/* Active Alarms */}
        {alarms.filter(a => a.isActive || !a.isCompleted).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.statusDot, {backgroundColor: '#10B981', shadowColor: '#10B981'}]} />
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Monitoring</Text>
            </View>
            
            {alarms.filter(a => a.isActive || !a.isCompleted).map(item => {
              let dist = null;
              if (currentLocation) {
                dist = getDistanceFromLatLonInKm(currentLocation.latitude, currentLocation.longitude, item.latitude, item.longitude);
              }
              return (
                <TouchableOpacity activeOpacity={0.7} onPress={() => handleEditAlarm(item)} key={item.id} style={[styles.alarmCard, { backgroundColor: isDarkMode ? 'rgba(23,23,23,0.6)' : 'rgba(255,255,255,0.7)', borderColor: item.isActive ? themeColors.primary : themeColors.border, borderWidth: 1.5 }]}>
                  <View style={styles.alarmHeader}>
                    <View style={{flex: 1}}>
                      <Text style={[styles.alarmName, { color: themeColors.text }]} numberOfLines={1}>{item.name}</Text>
                      <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                        <Ionicons name="radio-button-on" size={12} color={themeColors.primary} />
                        <Text style={[styles.alarmSub, { color: themeColors.subText, marginLeft: 4 }]} numberOfLines={1}>{item.radius >= 1000 ? `${item.radius/1000}km` : `${item.radius}m`} perimeter</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => toggleAlarm(item.id)} style={[styles.modernToggle, { backgroundColor: item.isActive ? themeColors.text : themeColors.card }]}>
                      <View style={[styles.toggleKnob, { backgroundColor: item.isActive ? themeColors.bg : themeColors.subText, transform: [{translateX: item.isActive ? 16 : 0}] }]} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={[styles.alarmFooter, { borderTopColor: themeColors.border }]}>
                    <View style={styles.distBadge}>
                      <Ionicons name="navigate" size={14} color={item.isActive ? themeColors.primary : themeColors.subText} style={{marginRight: 6}} />
                      <Text style={[styles.distText, { color: item.isActive ? themeColors.primary : themeColors.subText }]}>{dist !== null ? `${dist.toFixed(1)} km away` : 'Locating...'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteAlarm(item.id)} style={styles.iconBtn}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* History */}
        {alarms.filter(a => !a.isActive && a.isCompleted).length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.subText, fontSize: 16 }]}>Past Destinations</Text>
            {alarms.filter(a => !a.isActive && a.isCompleted).map(item => (
              <View key={item.id} style={[styles.historyCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <View style={[styles.historyIconBg, { backgroundColor: themeColors.bg }]}>
                  <Ionicons name="checkmark-done" size={18} color="#10B981" />
                </View>
                <View style={{flex: 1, marginLeft: 12}}>
                  <Text style={[styles.historyName, { color: themeColors.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.historySub, { color: themeColors.subText }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteAlarm(item.id)} style={{padding: 5}}>
                  <Ionicons name="close" size={20} color={themeColors.subText} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FULL SCREEN ALARM RINGING MODAL */}
      <Modal visible={!!ringingAlarm} animationType="slide" transparent={false} onRequestClose={handleStopAlarm}>
        {ringingAlarm && (
            <View style={{ flex: 1, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                <Animated.View style={{ transform: [{ scale: scrollY.interpolate({ inputRange: [0, ITEM_HEIGHT * RADIUS_OPTIONS.length], outputRange: [1, 1.2], extrapolate: 'clamp' }) }] }}>
                    <Ionicons name="alarm" size={120} color="#FFFFFF" style={{ marginBottom: 30 }} />
                </Animated.View>
                <Text style={{ fontSize: 40, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginBottom: 12, letterSpacing: 2 }}>WAKE UP!</Text>
                <Text style={{ fontSize: 22, color: '#FFFFFF', textAlign: 'center', marginBottom: 50, fontWeight: '600', opacity: 0.9 }}>
                   You have reached{"\n"}{ringingAlarm.name}!
                </Text>
                
                <TouchableOpacity onPress={handleStopAlarm} activeOpacity={0.8} style={{ backgroundColor: '#FFFFFF', width: '100%', height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15 }}>
                    <Text style={{ color: '#EF4444', fontSize: 22, fontWeight: '800', letterSpacing: 1 }}>STOP ALARM</Text>
                </TouchableOpacity>
            </View>
        )}
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  bgBlob: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    opacity: 0.15, filter: 'blur(80px)', // web only fallback
  },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 45, paddingHorizontal: 24, zIndex: 10
  },
  iconButton: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: {width: 0, height: 4}
  },
  scrollContent: { padding: 24, paddingBottom: 100 },
  
  titleContainer: { marginTop: 10, marginBottom: 30 },
  mainTitle: { fontSize: 44, fontWeight: '800', letterSpacing: -1, lineHeight: 48 },
  subTitle: { fontSize: 16, marginTop: 8, fontWeight: '500' },
  
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 24, height: 60,
    borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: {width: 0, height: 8},
    zIndex: 10
  },
  searchInput: { flex: 1, height: '100%', paddingHorizontal: 16, fontSize: 16, fontWeight: '500' },
  mapBtn: { padding: 10, paddingHorizontal: 15, justifyContent: 'center', alignItems: 'center' },
  
  suggestionsBox: {
    marginTop: 12, borderRadius: 24, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20,
    zIndex: 20, overflow: 'hidden', paddingVertical: 8
  },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  suggestionIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  suggestionText: { fontSize: 15, fontWeight: '600' },

  setupCard: {
    marginTop: 30, borderRadius: 32, padding: 24, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 30, shadowOffset: {width: 0, height: 15}
  },
  selectedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  pulseDot: { 
    width: 14, height: 14, borderRadius: 7, 
    shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: {width: 0, height: 0}, elevation: 5
  },
  selectedTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  selectedSub: { fontSize: 13, marginTop: 4, fontWeight: '500' },
  
  radiusLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 16, alignSelf: 'center' },
  
  wheelContainer: {
    height: 168, borderRadius: 24, position: 'relative', overflow: 'hidden', marginBottom: 30,
    justifyContent: 'center', borderWidth: 1
  },
  wheelSelection: {
    position: 'absolute', top: 56, left: 16, right: 16, height: 56, borderRadius: 16,
  },
  wheelItem: { justifyContent: 'center', alignItems: 'center', width: '100%' },
  wheelText: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },

  createBtn: {
    height: 56, borderRadius: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: {width: 0, height: 5}
  },
  createBtnText: { fontSize: 16, fontWeight: '700' },

  section: { marginTop: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10, shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: {width:0, height:0} },
  sectionTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  
  alarmCard: {
    borderRadius: 24, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, shadowOffset: {width: 0, height: 8}
  },
  alarmHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  alarmName: { fontSize: 18, fontWeight: '700', letterSpacing: -0.5 },
  alarmSub: { fontSize: 13, fontWeight: '600' },
  
  modernToggle: {
    width: 44, height: 28, borderRadius: 14, padding: 2, justifyContent: 'center'
  },
  toggleKnob: {
    width: 24, height: 24, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width:0, height:2}
  },
  
  alarmFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
  distBadge: { flexDirection: 'row', alignItems: 'center' },
  distText: { fontSize: 14, fontWeight: '700' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center' },

  historyCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1
  },
  historyIconBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  historyName: { fontSize: 16, fontWeight: '600' },
  historySub: { fontSize: 12, marginTop: 2, fontWeight: '500' }
});
