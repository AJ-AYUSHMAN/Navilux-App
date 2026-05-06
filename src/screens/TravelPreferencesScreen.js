// src/screens/TravelPreferencesScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform, Modal } from 'react-native';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { ThemeContext } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const PREFERENCE_CATEGORIES = [
  {
    title: 'Destinations & Scenery',
    icon: 'earth',
    tags: [
      { id: 'Mountains', icon: 'image-outline' },
      { id: 'Beaches', icon: 'water-outline' },
      { id: 'Cities', icon: 'business-outline' },
      { id: 'Historical Sites', icon: 'library-outline' },
      { id: 'Natural Wonders', icon: 'leaf-outline' },
    ]
  },
  {
    title: 'Health & Needs',
    icon: 'medical',
    tags: [
      { id: 'Health', icon: 'fitness-outline' },
      { id: 'Asthama', icon: 'medkit-outline' },
      { id: 'Breathing issues', icon: 'pulse-outline' },
      { id: 'Senior citizen mode', icon: 'body-outline' },
    ]
  },
  {
    title: 'Food & Dining',
    icon: 'restaurant',
    tags: [
      { id: 'Food', icon: 'restaurant-outline' },
      { id: 'Local Food', icon: 'pizza-outline' },
      { id: 'Vegan Food', icon: 'leaf-outline' },
      { id: 'Healthy Food', icon: 'nutrition-outline' },
      { id: 'Non-Veg', icon: 'fast-food-outline' },
      { id: 'Veg', icon: 'cafe-outline' },
    ]
  },
  {
    title: 'Network Preference',
    icon: 'cellular',
    tags: [
      { id: 'Mobile Network', icon: 'phone-portrait-outline' },
      { id: 'Jio', icon: 'radio-outline' },
      { id: 'Airtel', icon: 'radio-outline' },
      { id: 'Vi', icon: 'radio-outline' },
    ]
  },
  {
    title: 'Travel Style',
    icon: 'airplane',
    tags: [
      { id: 'Budget Travel', icon: 'wallet-outline' },
      { id: 'Luxury Travel', icon: 'diamond-outline' },
      { id: 'Family Travel', icon: 'people-outline' },
      { id: 'Solo Travel', icon: 'person-outline' },
      { id: 'Romantic Travel', icon: 'heart-outline' },
      { id: 'Eco-Tourism', icon: 'leaf-outline' },
    ]
  },
  {
    title: 'Experiences',
    icon: 'camera',
    tags: [
      { id: 'Culture', icon: 'color-palette-outline' },
      { id: 'Adventure Travel', icon: 'bicycle-outline' },
      { id: 'Wildlife & Nature', icon: 'paw-outline' },
      { id: 'Spiritual Travel', icon: 'moon-outline' },
      { id: 'Wellness Travel', icon: 'rose-outline' },
      { id: 'Festival Travel', icon: 'musical-notes-outline' },
      { id: 'Photography Travel', icon: 'camera-outline' },
      { id: 'Theme Parks', icon: 'ticket-outline' },
      { id: 'Sports & Recreation', icon: 'football-outline' },
    ]
  }
];

export default function TravelPreferencesScreen({ navigation }) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().travelPreferences) {
          setSelected(docSnap.data().travelPreferences);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const toggle = (tagId) => {
    // If they previously had 'Vigin Food', let's map it to 'Vegan Food' gracefully in UI selection
    const normalizedTagId = tagId === 'Vigin Food' ? 'Vegan Food' : tagId;

    setSelected((prev) =>
      prev.includes(normalizedTagId) ? prev.filter((t) => t !== normalizedTagId) : [...prev, normalizedTagId]
    );
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save preferences.');
      return;
    }

    if (selected.length === 0) {
      Alert.alert('No Preferences', 'Please select at least one travel preference.');
      return;
    }

    try {
      setSaving(true);
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, {
        travelPreferences: selected,
        updatedAt: new Date().toISOString(),
        email: user.email,
        displayName: user.displayName || null,
      }, { merge: true });

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary || "#4A90E2"} />
        <Text style={[styles.loadingText, { color: theme.subText }]}>Curating your preferences...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
           <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Travel Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.introContainer}>
          <Text style={[styles.introText, { color: theme.subText }]}>
            Personalize your Navilux AI. Select what you love to get smarter, tailored city analysis and local news.
          </Text>
        </View>

        {PREFERENCE_CATEGORIES.map((category, idx) => (
          <View key={idx} style={[styles.categoryContainer, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
            <View style={styles.categoryHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe' }]}>
                <Ionicons name={category.icon} size={18} color={theme.primary || "#3b82f6"} />
              </View>
              <Text style={[styles.categoryTitle, { color: theme.text }]}>{category.title}</Text>
            </View>

            <View style={styles.tagsWrapper}>
              {category.tags.map((tag) => {
                const isSelected = selected.includes(tag.id) || (tag.id === 'Vegan Food' && selected.includes('Vigin Food'));
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.tag,
                      { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 },
                      isSelected && { backgroundColor: theme.primary || '#3b82f6', borderColor: theme.primary || '#3b82f6' },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => toggle(tag.id)}
                    disabled={saving}
                  >
                    <Ionicons 
                      name={tag.icon} 
                      size={16} 
                      color={isSelected ? '#fff' : (isDarkMode ? '#cbd5e1' : '#475569')} 
                      style={styles.tagIcon} 
                    />
                    <Text
                      style={[
                        styles.tagText,
                        { color: isDarkMode ? '#cbd5e1' : '#475569' },
                        isSelected && { color: '#fff', fontWeight: '700' },
                      ]}
                    >
                      {tag.id}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Floating Save Bar */}
      <View style={[styles.floatingFooter, { backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)' }]}>
        <View style={styles.footerInfo}>
          <Text style={[styles.countText, { color: theme.text }]}>{selected.length}</Text>
          <Text style={[styles.countSubtext, { color: theme.subText }]}>selected</Text>
        </View>
        <TouchableOpacity
          style={styles.btnShadow}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={saving ? ['#9ca3af', '#6b7280'] : ['#4A90E2', '#2563EB']}
            style={styles.btnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.btnText}>Save Preferences</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalIconWrapper, { backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe' }]}>
              <Ionicons name="checkmark-circle" size={48} color={theme.primary || "#3b82f6"} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Awesome!</Text>
            <Text style={[styles.modalMessage, { color: theme.subText }]}>
              Your travel preferences have been securely saved. We'll use this to personalize your Navilux experience.
            </Text>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: theme.primary || '#3b82f6' }]}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.modalBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 40 : 20 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 10,
  },
  backBtn: { marginRight: 8, marginLeft: -4 },
  title: { fontSize: 24, fontWeight: '800' },
  introContainer: { paddingHorizontal: 20, marginBottom: 20, marginTop: 10 },
  introText: { fontSize: 14, lineHeight: 22 },
  loadingText: { marginTop: 12, fontSize: 15, fontWeight: '500' },
  
  categoryContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconWrapper: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  categoryTitle: { fontSize: 16, fontWeight: '700' },

  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tagIcon: { marginRight: 6 },
  tagText: { fontSize: 13, fontWeight: '600' },

  floatingFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerInfo: { alignItems: 'center', justifyContent: 'center', paddingRight: 16 },
  countText: { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  countSubtext: { fontSize: 12, fontWeight: '500' },
  
  btnShadow: { flex: 1, elevation: 4, shadowColor: '#4A90E2', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  btnGradient: {
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
  },
  modalIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
