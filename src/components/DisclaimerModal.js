import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function DisclaimerModal({ visible, onClose, serviceName, isDarkMode }) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1A1F3D' : '#FFFFFF' }]}>
          {/* Gradient accent strip */}
          <LinearGradient
            colors={['#FF9800', '#F57C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentStrip}
          />

          {/* Icon */}
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={32} color="#FF9800" />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#1A1A2E' }]}>
            Third-Party Service
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: isDarkMode ? 'rgba(255,255,255,0.6)' : '#666' }]}>
            We recommend using the official{' '}
            <Text style={styles.highlight}>{serviceName}</Text>{' '}
            platform for the best experience. Navilux is{' '}
            <Text style={styles.bold}>not affiliated</Text>{' '}
            with {serviceName}.
          </Text>

          {/* Hint */}
          <View style={[styles.hintRow, { backgroundColor: isDarkMode ? 'rgba(255,152,0,0.1)' : 'rgba(255,152,0,0.08)' }]}>
            <Ionicons name="open-outline" size={16} color="#FF9800" />
            <Text style={[styles.hintText, { color: isDarkMode ? 'rgba(255,255,255,0.5)' : '#888' }]}>
              Tap the{' '}
              <Ionicons name="open-outline" size={13} color="#FF9800" />{' '}
              button in the top-right to visit the official website
            </Text>
          </View>

          {/* OK Button */}
          <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={styles.btnOuter}>
            <LinearGradient
              colors={['#FF9800', '#F57C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>Got it</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  accentStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,152,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  highlight: {
    color: '#FF9800',
    fontWeight: '700',
  },
  bold: {
    fontWeight: '700',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 24,
    gap: 10,
  },
  hintText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  btnOuter: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  btn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
