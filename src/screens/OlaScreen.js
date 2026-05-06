import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { ThemeContext } from '../context/ThemeContext';

export default function OlaScreen({ navigation }) {
  const { isDarkMode, theme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Ola Cabs</Text>
        </View>
        <TouchableOpacity style={styles.browserBtn} onPress={() => Linking.openURL('https://book.olacabs.com/')}>
          <Ionicons name="open-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.webviewContainer}>
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}
        <WebView
          source={{ uri: 'https://book.olacabs.com/' }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 5, marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  browserBtn: { padding: 5 },
  webviewContainer: { flex: 1 },
  webview: { flex: 1 },
  loader: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -20 }, { translateY: -20 }], zIndex: 10 },
});
