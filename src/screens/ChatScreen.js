import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  UIManager,
  Alert,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GEMINI_API_KEY as ENV_GEMINI_KEY } from '@env';

// --- CONFIGURATION ---
const GEMINI_KEY = ENV_GEMINI_KEY || ""; 

const APP_SCREENS = {
  Home: 'Home',
  Weather: 'Weather',
  Map: 'Map',
  Explore: 'Explore',
  ExploreDetails: 'ExploreDetails',
  News: 'News',
  NewsDetails: 'NewsDetails',
  Profile: 'Profile',
  Settings: 'Settings',
  AqiDetails: 'AqiDetails',
  Oxygen: 'Oxygen',
  Crime: 'Crime',
  Network: 'Network',
  CitySearchResults: 'CitySearchResults'
};

const MODEL_PRIORITY = [
  'gemini-3-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
];

const SYSTEM_PROMPT = `
You are Navilux Assistant, an AI assistant embedded inside a mobile app called “Navilux”.
Navilux is a smart travel, city, and lifestyle companion app.
Your role is to help users by chatting naturally AND by controlling app navigation and features.

### App Capabilities
- Weather information (current location or a specific city)
- Air Quality Index (AQI)
- City exploration (places, attractions)
- Navigation between screens
- Profile and settings navigation

### Navigation Rules (CRITICAL)
When the user asks to OPEN or GO TO a screen, return a JSON object exactly like this on a new line:
$$ACTION:{"action":"NAVIGATE","target":"ScreenName","params":{}}$$

Available ScreenNames: ${Object.keys(APP_SCREENS).join(', ')}.

### Examples
User: "Open my profile"
Response: Sure! Opening your profile. $$ACTION:{"action":"NAVIGATE","target":"Profile","params":{}}$$

User: "Show weather in Delhi"
Response: Here is the weather for Delhi. $$ACTION:{"action":"NAVIGATE","target":"Weather","params":{"city":"Delhi"}}$$

User: "What's the weather?"
Response: Showing weather for your current location. $$ACTION:{"action":"NAVIGATE","target":"Weather","params":{"useCurrent":true}}$$

### Response Style
- Be concise, friendly, and helpful.
- Do NOT mention APIs or technical implementation.
- You are Navilux Assistant, not Gemini.
`;

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hello! I'm Navilux Assistant. I can check weather, AQI, news, or help you navigate.",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg = { id: Date.now().toString(), role: 'user', text, ts: Date.now() };
    setMessages(prev => [userMsg, ...prev]);
    setInput('');
    setIsTyping(true);

    try {
      const responseText = await fetchGeminiResponse(text);
      const { cleanText, action } = parseResponseForAction(responseText);

      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: cleanText,
        ts: Date.now(),
      };

      setMessages(prev => [botMsg, ...prev]);

      if (action) executeAppAction(action);

    } catch (error) {
      setMessages(prev => [{
        id: Date.now().toString(),
        role: 'system',
        text: "I'm having trouble connecting.",
        ts: Date.now()
      }, ...prev]);
    } finally {
      setIsTyping(false);
    }
  };

  const executeAppAction = (action) => {
    if (action.action === 'NAVIGATE') {
      const screenName = APP_SCREENS[action.target];
      if (screenName) {
        setTimeout(() => {
          try {
            navigation.navigate(screenName, action.params || {});
          } catch (e) {
            Alert.alert("Navigation Error", `Screen not found: ${screenName}`);
          }
        }, 800);
      } else {
          console.warn(`AI returned unknown screen: ${action.target}`);
      }
    }
  };

  const parseResponseForAction = (rawText) => {
    const actionRegex = /\$\$ACTION:(.*?)\$\$/s;
    const match = rawText.match(actionRegex);

    if (match && match[1]) {
      try {
        const action = JSON.parse(match[1]);
        const cleanText = rawText.replace(actionRegex, '').trim();
        return { cleanText, action };
      } catch (e) {}
    }

    return { cleanText: rawText, action: null };
  };

  const fetchGeminiResponse = async (userText) => {
    if (!GEMINI_KEY) throw new Error("No API Key");

    const payload = {
      contents: [{ parts: [{ text: SYSTEM_PROMPT + `\nUser: ${userText}` }] }]
    };

    for (const model of MODEL_PRIORITY) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }
        );

        const data = await res.json();

        if (res.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }

      } catch (err) {}
    }

    throw new Error("All models failed.");
  };

  const renderItem = ({ item }) => {
    const isUser = item.role === 'user';
    const isSystem = item.role === 'system';

    return (
      <View style={[
        styles.row,
        isUser ? styles.rowUser : styles.rowBot,
        isSystem && styles.rowSystem
      ]}>
        {!isUser && !isSystem && (
          <View style={styles.botIcon}>
            <Ionicons name="sparkles" size={16} color="white" />
          </View>
        )}

        <View style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleBot,
          isSystem && styles.bubbleSystem
        ]}>
          <Text style={[
            styles.text,
            isUser ? styles.textUser : styles.textBot,
            isSystem && styles.textSystem
          ]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-down" size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Navilux Assistant</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* CHAT */}
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          inverted
        />

        {isTyping && (
          <View style={styles.typingContainer}>
            <ActivityIndicator size="small" color="#888" />
            <Text style={styles.typingText}>Navilux is thinking...</Text>
          </View>
        )}

        {/* INPUT */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Navilux..."
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />

          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <Ionicons name="arrow-up" size={20} color="white" />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16
  },

  headerTitle: { fontSize: 16, fontWeight: '700' },

  row: { flexDirection: 'row', margin: 10 },
  rowUser: { justifyContent: 'flex-end' },
  rowBot: { justifyContent: 'flex-start' },
  rowSystem: { justifyContent: 'center' },

  botIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#4A90E2', alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 4 },
  
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 18 },
  bubbleUser: { backgroundColor: '#222', borderBottomRightRadius: 4 },
  bubbleBot: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5E5', borderBottomLeftRadius: 4 },
  bubbleSystem: { backgroundColor: 'transparent', padding: 4 },

  textUser: { color: '#fff' },
  textBot: { color: '#000' },
  textSystem: { color: '#888' },

  inputContainer: {
    flexDirection: 'row',
    padding: 10
  },

  input: {
    flex: 1,
    backgroundColor: '#eee',
    borderRadius: 20,
    paddingHorizontal: 15
  },

  sendBtn: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 20,
    marginLeft: 10
  },

  sendBtnDisabled: { backgroundColor: '#ccc' },

  typingContainer: {
    flexDirection: 'row',
    padding: 10
  },

  typingText: {
    marginLeft: 5,
    color: '#888'
  },

  botIcon: {
    width: 28,
    height: 28,
    backgroundColor: '#4A90E2',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  }
});