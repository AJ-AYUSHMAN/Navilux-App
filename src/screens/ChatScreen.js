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
      text: "Hello! I'm your Navilux AI Assistant. I can check local data, give travel insights based on your preferences, or navigate you anywhere in the app! As an AI assistant I can make mistakes.",
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

    // Clean out all markdown asterisks
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

    if (item.id === 'welcome') {
      return (
        <View style={styles.welcomeContainer}>
          <LinearGradient
            colors={isDarkMode ? ['#1e293b', '#0f172a'] : ['#e0f2fe', '#bae6fd']}
            style={[styles.welcomeCard, { borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.welcomeIconWrapper}>
              <Ionicons name="sparkles" size={28} color="#0284c7" />
            </View>
            <Text style={[styles.welcomeTitle, { color: isDarkMode ? '#fff' : '#0369a1' }]}>Navilux Assistant</Text>
            <Text style={[styles.welcomeText, { color: isDarkMode ? '#94a3b8' : '#0c4a6e' }]}>
              {item.text}
            </Text>
          </LinearGradient>
        </View>
      );
    }

    return (
      <View style={[
        styles.row,
        isUser ? styles.rowUser : styles.rowBot,
        isSystem && styles.rowSystem
      ]}>
        {!isUser && !isSystem && (
          <View style={[styles.botIcon, { backgroundColor: '#0284c7' }]}>
            <Ionicons name="hardware-chip-outline" size={16} color="white" />
          </View>
        )}

        {isUser ? (
          <LinearGradient
            colors={['#0284c7', '#0369a1']}
            style={[styles.bubble, styles.bubbleUser]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.text, styles.textUser]}>{item.text}</Text>
          </LinearGradient>
        ) : (
          <View style={[
            styles.bubble,
            isSystem ? styles.bubbleSystem : [
              styles.bubbleBot, 
              { backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: theme.border, borderWidth: 1 }
            ]
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
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={26} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Navilux Assistant</Text>
          <View style={styles.onlineBadge} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* CHAT */}
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          inverted
          contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 4 }}
          showsVerticalScrollIndicator={false}
        />

        {/* TYPING INDICATOR */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={[styles.typingBubble, { backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: theme.border }]}>
              <ActivityIndicator size="small" color="#0284c7" />
              <Text style={[styles.typingText, { color: theme.subText }]}>Navilux is thinking...</Text>
            </View>
          </View>
        )}

        {/* INPUT */}
        <View style={[styles.inputWrapper, { backgroundColor: theme.background }]}>
          <View style={[
            styles.inputContainer, 
            { 
              backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', 
              borderColor: isDarkMode ? '#334155' : '#e2e8f0',
            }
          ]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={input}
              onChangeText={setInput}
              placeholder="Ask anything..."
              placeholderTextColor={theme.subText}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendBtn, 
                (!input.trim() || isTyping) ? styles.sendBtnDisabled : { backgroundColor: '#0284c7' }
              ]}
              onPress={handleSend}
              disabled={!input.trim() || isTyping}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-up" size={18} color="#fff" />
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(150,150,150,0.1)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  onlineBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginLeft: 6,
    marginTop: 2,
  },

  welcomeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  welcomeCard: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#0284c7',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  welcomeIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },

  row: { flexDirection: 'row', marginHorizontal: 16, marginVertical: 6 },
  rowUser: { justifyContent: 'flex-end' },
  rowBot: { justifyContent: 'flex-start' },
  rowSystem: { justifyContent: 'center' },

  botIcon: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 10, 
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  
  bubble: { 
    maxWidth: '82%', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 22,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  bubbleUser: { 
    borderBottomRightRadius: 6,
  },
  bubbleBot: { 
    borderBottomLeftRadius: 6,
  },
  bubbleSystem: { 
    backgroundColor: 'transparent', 
    padding: 4,
    shadowOpacity: 0,
  },

  text: { fontSize: 16, lineHeight: 24 },
  textUser: { color: '#fff' },
  textSystem: { color: '#888', fontStyle: 'italic', fontSize: 13 },

  typingContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    alignItems: 'center',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  typingText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
  },

  inputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    minHeight: 40,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sendBtnDisabled: { 
    backgroundColor: '#cbd5e1',
    elevation: 0,
    shadowOpacity: 0,
  },
});