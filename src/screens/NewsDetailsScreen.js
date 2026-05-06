// src/screens/NewsDetailsScreen.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { GEMINI_API_KEY_FOR_REPORT as GEMINI_API_KEY } from '@env';

const { width, height } = Dimensions.get('window');

export default function NewsDetailsScreen({ route, navigation }) {
  const { article } = route.params || {};
  const { isDarkMode, theme } = useContext(ThemeContext);
  
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  if (!article) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, textAlign: 'center', marginTop: 100 }}>No article found</Text>
      </View>
    );
  }

  const openArticle = async () => {
    if (article.url) {
      await WebBrowser.openBrowserAsync(article.url, {
        toolbarColor: theme.card,
        controlsColor: theme.primary,
        presentationStyle: 'pageSheet',
      });
    }
  };

  const generateAiSummary = async () => {
    setLoadingAi(true);
    try {
      const prompt = `You are a professional news anchor and analyst. Given the following news metadata, write a highly engaging, informative, and detailed 4-paragraph news report to give the user a complete understanding of the event. Make it sound professional and intelligent. Do not use markdown asterisks.
      
Title: ${article.title}
Description: ${article.description || article.content}
Source: ${article.source?.name}
Date: ${new Date(article.publishedAt).toDateString()}`;
      
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      if (res.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        let text = data.candidates[0].content.parts[0].text;
        text = text.replace(/\*/g, ''); // Clean markdown
        setAiSummary(text);
      } else {
        setAiSummary("Could not generate AI summary at this time.");
      }
    } catch (err) {
      setAiSummary("Error generating AI Summary.");
    } finally {
      setLoadingAi(false);
    }
  };

  // Replace the ugly "[+123 chars]" tag from GNews API with a user-friendly prompt
  const cleanContent = article.content 
    ? article.content.replace(/\[\+\d+ chars\]/g, '... [Read more in external website]').trim() 
    : '';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Header Image with Gradient */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: article.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800&auto=format&fit=crop' }}
            style={styles.image}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)', theme.background]}
            style={styles.gradient}
          />
          
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        <View style={[styles.contentWrapper, { backgroundColor: theme.background }]}>
          
          {/* Source Tag */}
          <View style={styles.sourceTag}>
            <Text style={styles.sourceText}>{article.source?.name || 'News'}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.text }]}>{article.title}</Text>

          {/* Date & Time */}
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={16} color={theme.subText} />
            <Text style={[styles.meta, { color: theme.subText }]}>
              {new Date(article.publishedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </Text>
          </View>

          {/* AI Summary Section */}
          <View style={[styles.aiCard, { backgroundColor: isDarkMode ? '#1e293b' : '#f0fdfa', borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={20} color="#0D9488" />
              <Text style={[styles.aiTitle, { color: isDarkMode ? '#fff' : '#0F766E' }]}>Navilux AI Summary</Text>
            </View>
            
            {loadingAi ? (
              <View style={styles.aiLoader}>
                <ActivityIndicator size="small" color="#0D9488" />
                <Text style={{ marginLeft: 8, color: theme.subText }}>Analyzing article...</Text>
              </View>
            ) : aiSummary ? (
              <Text style={[styles.aiSummaryText, { color: isDarkMode ? '#e2e8f0' : '#115e59' }]}>{aiSummary}</Text>
            ) : (
              <TouchableOpacity style={styles.aiBtn} onPress={generateAiSummary}>
                <Text style={styles.aiBtnText}>Generate Detailed Summary</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Original Content */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Overview</Text>
          <Text style={[styles.description, { color: theme.text }]}>
            {article.description}
          </Text>
          
          {cleanContent !== article.description && (
            <Text style={[styles.fullText, { color: theme.subText }]}>
              {cleanContent}
            </Text>
          )}

          {/* Read Full Article Button */}
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={openArticle} activeOpacity={0.8}>
            <Ionicons name="globe-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Read Full Article</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageContainer: {
    width: width,
    height: height * 0.35,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  sourceTag: {
    backgroundColor: '#EF4444',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  sourceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  meta: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  aiCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  aiLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  aiSummaryText: {
    fontSize: 15,
    lineHeight: 24,
  },
  aiBtn: {
    backgroundColor: '#0D9488',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  aiBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  fullText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    marginTop: 10,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});