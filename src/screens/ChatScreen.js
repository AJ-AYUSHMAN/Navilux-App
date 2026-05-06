import React, { useEffect, useRef, useState, useContext } from 'react';
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
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GEMINI_API_KEY as ENV_GEMINI_KEY } from '@env';
import { ThemeContext } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const GEMINI_KEY = ENV_GEMINI_KEY; 

const MODEL_PRIORITY = [
  'gemini-3-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
];

export default function ChatScreen({ route, navigation }) {
  const { city } = route?.params || {};
  const { theme, isDarkMode } = useContext(ThemeContext);
  const [preferences, setPreferences] = useState([]);
  
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hello! I'm your Navilux AI Assistant. I can check local data, give travel insights based on your preferences, or navigate you anywhere in the app!",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().travelPreferences) {
            setPreferences(docSnap.data().travelPreferences);
          }
        }
      } catch (err) {
        console.log("Error fetching user prefs for chat", err);
      }
    };
    fetchContext();
  }, []);

  const generateSystemPrompt = () => {
    
    const safePrefs = preferences.filter(p => p !== 'Vigin Food' && !p.toLowerCase().includes('vigin'));
    return `
You are Navilux Assistant, an elite AI travel and lifestyle companion inside the "Navilux" app.
Current City Context: ${city || 'Not specified (ask if needed)'}
User Travel Preferences: ${safePrefs.length > 0 ? safePrefs.join(', ') : 'None specified'}

### App Capabilities & Navigation
You can seamlessly control the app using special JSON actions. 
If the user asks to open a screen, change the city, or logout, you MUST include an action block EXACTLY like this on a new line:
$$ACTION:{"action":"<ACTION_TYPE>","target":"<TARGET>","params":{}}$$

Action Types:
1. "NAVIGATE"
   - Use this to open app screens.
   - Available targets: Home, Weather, Map, Explore, ExploreDetails, News, NewsDetails, Profile, Settings, About, FAQ, PersonalInfo, Security, TravelPreferences, AqiDetails, Oxygen, Crime, Network, Train, Ola, CityAnalysis, CitySearchResults
   - Do NOT navigate to Splash, Login, Signup, AuthStart, ForgotPassword, or Chat.
   - Example: $$ACTION:{"action":"NAVIGATE","target":"TravelPreferences","params":{}}$$
   - Example: $$ACTION:{"action":"NAVIGATE","target":"CityAnalysis","params":{"city":"Paris"}}$$

2. "SEARCH_CITY"
   - Use this when the user wants to search for a new city or explicitly change their current location.
   - Target is the city name.
   - Example: $$ACTION:{"action":"SEARCH_CITY","target":"Mumbai","params":{}}$$

3. "LOGOUT"
   - Use this ONLY if the user explicitly asks to sign out or log out.
   - Example: $$ACTION:{"action":"LOGOUT","target":"","params":{}}$$

### Conversation Style
- You act as a brilliant, friendly, and concise travel expert.
- Proactively use the user's travel preferences to give tailored advice.
- If they ask for insights or suggestions for the current city, use your internal knowledge to give 2-3 brilliant ideas that match their preferences.
- NEVER use markdown asterisks (*), bold formatting (**text**), or markdown bullet points. Use plain text formatting or numbered lists.
- NEVER mention APIs, JSON, or technical implementation details to the user. Just say "Sure, opening that for you", "Logging you out", or "Changing your city now".
`;
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg = { id: Date.now().toString(), role: 'user', text, ts: Date.now() };
    setMessages(prev => [userMsg, ...prev]);
    setInput('');
    setIsTyping(true);

    try {
      const responseText = await fetchGeminiResponse(text, [userMsg, ...messages]);
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
        text: "I'm having trouble connecting to the Navilux AI servers.",
        ts: Date.now()
      }, ...prev]);
    } finally {
      setIsTyping(false);
    }
  };

  const executeAppAction = (actionObj) => {
    const { action, target, params } = actionObj;
    
    if (action === 'NAVIGATE') {
      const validScreens = [
        'Home', 'Weather', 'Map', 'Explore', 'ExploreDetails', 'News', 'NewsDetails', 'Profile', 
        'Settings', 'About', 'FAQ', 'PersonalInfo', 'Security', 'TravelPreferences', 'AqiDetails', 
        'Oxygen', 'Crime', 'Network', 'Train', 'Ola', 'CityAnalysis', 'CitySearchResults'
      ];
      if (validScreens.includes(target)) {
        setTimeout(() => {
          try { navigation.navigate(target, params || {}); } catch(e){}
        }, 800);
      }
    } else if (action === 'SEARCH_CITY') {
      setTimeout(() => {
        try { navigation.navigate('Home', { city: target }); } catch(e){}
      }, 800);
    } else if (action === 'LOGOUT') {
      setTimeout(() => {
        auth.signOut()
          .then(() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }))
          .catch(e => console.log(e));
      }, 800);
    }
  };

  const parseResponseForAction = (rawText) => {
    const actionRegex = /\$\$ACTION:(.*?)\$\$/s;
    const match = rawText.match(actionRegex);

    let cleanText = rawText;
    let action = null;

    if (match && match[1]) {
      try {
        action = JSON.parse(match[1]);
        cleanText = rawText.replace(actionRegex, '').trim();
      } catch (e) {}
    }

    // Clean out all markdown asterisks as requested
    cleanText = cleanText.replace(/\*/g, '').trim();

    return { cleanText, action };
  };

  const fetchGeminiResponse = async (userText, allMessages) => {
    if (!GEMINI_KEY) throw new Error("No API Key");

    const formattedHistory = [];
    const pastMessages = allMessages.slice().reverse().filter(m => m.role !== 'system');

    pastMessages.forEach((m, index) => {
      let contentText = m.text;
      if (index === 0 && m.role === 'assistant') {
        contentText = generateSystemPrompt() + '\n\n' + contentText;
      }
      formattedHistory.push({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: contentText }]
      });
    });

    const payload = { contents: formattedHistory };

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
          <View style={[styles.botIcon, { backgroundColor: theme.primary || '#4A90E2' }]}>
            <Ionicons name="sparkles" size={16} color="white" />
          </View>
        )}

        {isUser ? (
          <LinearGradient
            colors={[theme.primary || '#4A90E2', '#2563EB']}
            style={[styles.bubble, styles.bubbleUser]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.text, styles.textUser]}>{item.text}</Text>
          </LinearGradient>
        ) : (
          <View style={[
            styles.bubble,
            isSystem ? styles.bubbleSystem : [styles.bubbleBot, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]
          ]}>
            <Text style={[
              styles.text,
              isSystem ? styles.textSystem : { color: theme.text }
            ]}>
              {item.text}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-down" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Navilux Assistant</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* CHAT */}
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          inverted
          contentContainerStyle={{ paddingVertical: 16 }}
        />

        {isTyping && (
          <View style={styles.typingContainer}>
            <ActivityIndicator size="small" color={theme.primary || "#4A90E2"} />
            <Text style={[styles.typingText, { color: theme.subText }]}>Navilux is thinking...</Text>
          </View>
        )}

        {/* INPUT */}
        <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <View style={[styles.inputContainer, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={input}
              onChangeText={setInput}
              placeholder="Ask Navilux..."
              placeholderTextColor={theme.subText}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />

            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || isTyping) ? styles.sendBtnDisabled : { backgroundColor: theme.primary || '#4A90E2' }]}
              onPress={handleSend}
              disabled={!input.trim() || isTyping}
            >
              <Ionicons name="arrow-up" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  row: { flexDirection: 'row', marginHorizontal: 16, marginVertical: 8 },
  rowUser: { justifyContent: 'flex-end' },
  rowBot: { justifyContent: 'flex-start' },
  rowSystem: { justifyContent: 'center' },

  botIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 4 },
  
  bubble: { maxWidth: '80%', padding: 14, borderRadius: 20 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleBot: { borderBottomLeftRadius: 4 },
  bubbleSystem: { backgroundColor: 'transparent', padding: 4 },

  text: { fontSize: 15, lineHeight: 22 },
  textUser: { color: '#fff' },
  textSystem: { color: '#888', fontStyle: 'italic', fontSize: 13 },

  inputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    padding: 10,
    borderRadius: 20,
    marginLeft: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#9ca3af' },

  typingContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  typingText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '500',
  },
});