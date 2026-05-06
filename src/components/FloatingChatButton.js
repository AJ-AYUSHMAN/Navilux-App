// src/components/FloatingChatButton.js
import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export default function FloatingChatButton({ city }) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.fabContainer}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('Chat', { city })}
    >
      <LinearGradient
        colors={['#0284c7', '#0369a1']}
        style={styles.fabGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="sparkles" size={24} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 25,
    right: 18,
    borderRadius: 30,
    elevation: 8,
    zIndex: 9999,
    shadowColor: '#0284c7',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
