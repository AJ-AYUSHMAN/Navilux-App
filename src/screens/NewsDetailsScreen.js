// src/screens/NewsDetailsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { useContext } from 'react';

export default function NewsDetailsScreen({ route, navigation }) {
  const { article } = route.params || {};
  const { isDarkMode, theme } = useContext(ThemeContext);

  if (!article) {
    return (
      <View style={styles.container}>
        <Text>No article found</Text>
      </View>
    );
  }

  const openArticle = () => {
    if (article.url) {
      Linking.openURL(article.url);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.topTitle, { color: theme.text }]}>News</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Image */}
        <Image
          source={{
            uri:
              article.image ||
              'https://via.placeholder.com/400x200.png?text=No+Image',
          }}
          style={styles.image}
        />

        {/* Content */}
        <View style={styles.content}>
          
          {/* Title */}
          <Text style={[styles.title, { color: theme.text }]}>{article.title}</Text>

          {/* Source + Date */}
          <Text style={[styles.meta, { color: theme.subText }]}>
            {article.source?.name} •{' '}
            {new Date(article.publishedAt).toDateString()}
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: theme.text }]}>
            {article.description || 'No description available.'}
          </Text>

          {/* Content */}
          <Text style={[styles.fullText, { color: theme.subText }]}>
            {article.content || 'Full content not available.'}
          </Text>

          {/* Button */}
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={openArticle}>
            <Text style={styles.buttonText}>Read Full Article</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    marginBottom: 10,
  },

  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },

  image: {
    width: '100%',
    height: 220,
  },

  content: {
    padding: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },

  meta: {
    fontSize: 12,
    color: '#777',
    marginBottom: 12,
  },

  description: {
    fontSize: 15,
    color: '#444',
    marginBottom: 10,
    lineHeight: 22,
  },

  fullText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },

  button: {
    marginTop: 20,
    backgroundColor: '#7EC7FF',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',

    // shadow
    elevation: 3,
    shadowColor: '#7EC7FF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});