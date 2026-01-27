import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  FlatList,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  Platform,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { OLA_API_KEY as ENV_OLA_API_KEY } from '@env';

// --- CONFIGURATION ---
const OLA_API_KEY = ENV_OLA_API_KEY; // Your Ola API Key
const { height, width } = Dimensions.get('window');

// --- CATEGORY PILLS ---
const CATEGORIES = [
  { id: 'restaurants', label: 'Restaurants', icon: 'restaurant' },
  { id: 'gas', label: 'Gas', icon: 'local-gas-station' },
  { id: 'hotels', label: 'Hotels', icon: 'hotel' },
  { id: 'coffee', label: 'Coffee', icon: 'local-cafe' },
  { id: 'groceries', label: 'Groceries', icon: 'shopping-cart' },
];

export default function MapScreen({ route, navigation }) {
  // --- STATE ---
  const [mode, setMode] = useState('EXPLORE'); // 'EXPLORE' or 'NAVIGATE'
  const [region, setRegion] = useState(null);
  
  // Search State
  const [searchText, setSearchText] = useState('');
  const [originText, setOriginText] = useState('Your Location');
  const [destText, setDestText] = useState('');
  
  // Coordinates
  const [originCoord, setOriginCoord] = useState(null);
  const [destCoord, setDestCoord] = useState(null);

  // Suggestions (Ola API)
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeInput, setActiveInput] = useState('search'); // 'search', 'origin', 'dest'

  const mapRef = useRef(null);
  const bottomSheetAnim = useRef(new Animated.Value(height)).current;

  // --- INITIAL LOAD ---
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      const initialRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
      
      setRegion(initialRegion);
      setOriginCoord({ latitude, longitude });

      if (route?.params?.city) {
        setSearchText(route.params.city);
        fetchOlaPlaces(route.params.city); // Auto-search if city passed
        setActiveInput('search');
      }
    })();
  }, []);

  // --- OLA MAPS API (Autocomplete) ---
  const fetchOlaPlaces = async (query) => {
    if (!query || query.length < 3) {
        setSuggestions([]);
        return;
    }
    
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(query)}&api_key=${OLA_API_KEY}`);
      const data = await res.json();
      
      if (data.predictions) {
        setSuggestions(data.predictions);
      } else {
        setSuggestions([]);
      }
    } catch (e) {
      console.warn("Ola API Error", e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // --- HANDLERS ---
  const onTextChange = (text, type) => {
      if (type === 'search') setSearchText(text);
      if (type === 'origin') setOriginText(text);
      if (type === 'dest') setDestText(text);

      setActiveInput(type);
      fetchOlaPlaces(text);
  };

  const onPlaceSelect = async (place) => {
      Keyboard.dismiss();
      const address = place.description; // or place.structured_formatting.main_text
      setSuggestions([]);

      // 1. Update Text Inputs
      if (activeInput === 'search') setSearchText(address);
      if (activeInput === 'origin') setOriginText(address);
      if (activeInput === 'dest') setDestText(address);

      // 2. Geocode to get Coords (Using Expo for simplicity as Ola Autocomplete returns place_id)
      try {
          const geocode = await Location.geocodeAsync(address);
          if (geocode.length > 0) {
              const { latitude, longitude } = geocode[0];
              const coord = { latitude, longitude };

              // Update Map & Markers
              mapRef.current?.animateToRegion({
                  ...coord,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
              }, 1000);

              if (activeInput === 'origin') setOriginCoord(coord);
              if (activeInput === 'dest') setDestCoord(coord);
              if (activeInput === 'search') {
                   setRegion({ ...coord, latitudeDelta: 0.01, longitudeDelta: 0.01 });
                   // Show bottom sheet logic could go here
              }
          }
      } catch (e) {
          console.warn("Geocoding error", e);
      }
  };

  const startNavigationMode = () => {
      setMode('NAVIGATE');
      setDestText('');
      setSuggestions([]);
  };

  const exitNavigationMode = () => {
      setMode('EXPLORE');
      setSuggestions([]);
      Keyboard.dismiss();
  };

  const centerUser = async () => {
     let loc = await Location.getCurrentPositionAsync({});
     mapRef.current?.animateToRegion({
         latitude: loc.coords.latitude,
         longitude: loc.coords.longitude,
         latitudeDelta: 0.01,
         longitudeDelta: 0.01,
     }, 1000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* --- 1. THE MAP --- */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE} 
        initialRegion={region}
        showsUserLocation={true}
        showsCompass={false}
        showsMyLocationButton={false} 
        toolbarEnabled={false} 
        onPress={() => { Keyboard.dismiss(); setSuggestions([]); }}
      >
        {/* Origin Marker */}
        {originCoord && (
           <Marker coordinate={originCoord} title="Start">
              <View style={[styles.customMarker, {backgroundColor:'#4285F4'}]}>
                  <View style={styles.markerDot} />
              </View>
           </Marker>
        )}

        {/* Destination Marker */}
        {destCoord && (
           <Marker coordinate={destCoord} title="Destination">
              <Ionicons name="location" size={40} color="#EA4335" />
           </Marker>
        )}

        {/* Route Line */}
        {originCoord && destCoord && (
             <Polyline 
                coordinates={[originCoord, destCoord]}
                strokeColor="#4285F4"
                strokeWidth={4}
             />
        )}
      </MapView>


      {/* --- 2. TOP UI LAYER (Search vs Navigate) --- */}
      
      {mode === 'EXPLORE' ? (
        // === EXPLORE MODE (Single Search Bar) ===
        <View style={styles.topContainer}>
            <View style={styles.searchBar}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#5F6368" />
                </TouchableOpacity>
                
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search here"
                    value={searchText}
                    onChangeText={(t) => onTextChange(t, 'search')}
                    onFocus={() => setActiveInput('search')}
                    placeholderTextColor="#5F6368"
                />
                
                <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
                    <View style={styles.profileCircle}>
                        <Text style={styles.profileInitials}>J</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Suggestions List (Explore Mode) */}
            {activeInput === 'search' && suggestions.length > 0 && (
                <View style={styles.suggestionsBox}>
                     <FlatList
                        data={suggestions}
                        keyExtractor={(item) => item.place_id}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.suggestionItem} onPress={() => onPlaceSelect(item)}>
                                <Ionicons name="location-outline" size={20} color="#555" style={{marginRight:10}} />
                                <Text numberOfLines={1} style={styles.suggestionText}>{item.description}</Text>
                            </TouchableOpacity>
                        )}
                     />
                </View>
            )}

            {/* Category Pills */}
            {suggestions.length === 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity key={cat.id} style={styles.pill}>
                            <MaterialIcons name={cat.icon} size={16} color="#5F6368" style={{marginRight: 6}} />
                            <Text style={styles.pillText}>{cat.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
      ) : (
        // === NAVIGATION MODE (Start & End Inputs) ===
        <View style={styles.navContainer}>
            <View style={styles.navCard}>
                <View style={styles.navRow}>
                    <TouchableOpacity onPress={exitNavigationMode} style={{marginRight:10}}>
                         <Ionicons name="arrow-back" size={24} color="#555" />
                    </TouchableOpacity>
                    <Text style={styles.navTitle}>Set Route</Text>
                </View>

                {/* Origin Input */}
                <View style={styles.inputWrapper}>
                    <View style={[styles.dot, {backgroundColor:'#4285F4'}]} />
                    <TextInput 
                        style={styles.navInput} 
                        value={originText}
                        onChangeText={(t) => onTextChange(t, 'origin')}
                        onFocus={() => setActiveInput('origin')}
                        placeholder="Start location"
                    />
                </View>
                
                {/* Connector Line */}
                <View style={{height:15, borderLeftWidth:2, borderLeftColor:'#DDD', marginLeft:24, marginVertical:2}} />

                {/* Destination Input */}
                <View style={styles.inputWrapper}>
                    <View style={[styles.dot, {backgroundColor:'#EA4335'}]} />
                    <TextInput 
                        style={styles.navInput} 
                        value={destText} 
                        onChangeText={(t) => onTextChange(t, 'dest')}
                        onFocus={() => setActiveInput('dest')}
                        placeholder="Choose destination"
                        autoFocus
                    />
                </View>
            </View>

            {/* Suggestions List (Navigation Mode) */}
            {(activeInput === 'origin' || activeInput === 'dest') && suggestions.length > 0 && (
                <View style={[styles.suggestionsBox, {marginTop: 5}]}>
                     <FlatList
                        data={suggestions}
                        keyExtractor={(item) => item.place_id}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.suggestionItem} onPress={() => onPlaceSelect(item)}>
                                <Ionicons name="navigate-circle-outline" size={22} color="#555" style={{marginRight:10}} />
                                <Text numberOfLines={1} style={styles.suggestionText}>{item.description}</Text>
                            </TouchableOpacity>
                        )}
                     />
                </View>
            )}
        </View>
      )}


      {/* --- 3. FLOATING ACTION BUTTONS --- */}
      <View style={styles.fabContainer}>
         <TouchableOpacity style={styles.fabSmall} onPress={centerUser}>
            <MaterialIcons name="my-location" size={24} color="#1A73E8" />
         </TouchableOpacity>

         {mode === 'EXPLORE' && (
             <TouchableOpacity style={styles.fabLarge} onPress={startNavigationMode}>
                <Ionicons name="navigate" size={26} color="#FFF" />
                <Text style={styles.fabLabel}>GO</Text>
             </TouchableOpacity>
         )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { width: '100%', height: '100%' },
  
  // -- Top Container (Explore) --
  topContainer: {
    position: 'absolute', top: Platform.OS === 'ios' ? 50 : 40,
    left: 0, right: 0, paddingHorizontal: 15,
  },
  searchBar: {
    flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 30, alignItems: 'center',
    paddingHorizontal: 15, paddingVertical: 10,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#000', marginLeft: 10 },
  profileCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#8AB4F8', alignItems: 'center', justifyContent: 'center' },
  profileInitials: { color: '#FFF', fontWeight: 'bold' },

  // -- Pills --
  pill: {
    flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, marginRight: 10, elevation: 3, alignItems: 'center'
  },
  pillText: { fontSize: 14, color: '#3C4043', fontWeight: '500' },

  // -- Nav Container (Directions) --
  navContainer: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: '#FFF', borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingHorizontal: 15, paddingBottom: 20,
    elevation: 10, shadowColor: '#000', shadowOpacity: 0.2
  },
  navCard: { },
  navRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  navTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F3F4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  navInput: { flex: 1, fontSize: 16, color: '#333', marginLeft: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },

  // -- Suggestions Box --
  suggestionsBox: {
      backgroundColor: '#FFF', borderRadius: 10, marginTop: 5, maxHeight: 250,
      elevation: 5, shadowColor: '#000', shadowOpacity: 0.1
  },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  suggestionText: { fontSize: 14, color: '#333', flex: 1 },

  // -- FABs --
  fabContainer: { position: 'absolute', right: 15, bottom: 40, alignItems: 'center' },
  fabSmall: {
    width: 45, height: 45, backgroundColor: '#FFF', borderRadius: 25,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.15
  },
  fabLarge: {
    width: 56, height: 56, backgroundColor: '#1A73E8', borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', elevation: 6,
    shadowColor: '#000', shadowOpacity: 0.3, marginTop: 5
  },
  fabLabel: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginTop: -2 },

  // -- Custom Marker --
  customMarker: { width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: '#FFF', justifyContent:'center', alignItems:'center' },
  markerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF' }
});