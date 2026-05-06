# 🌟 Navilux

Navilux is a next-generation, AI-powered travel and safety companion app built with React Native. Navilux goes beyond simple map navigation by providing users with deep, personalized insights into any city they travel to. By seamlessly combining real-time weather, air quality, crime statistics, local news, and network coverage data, Navilux uses advanced Generative AI to score cities and provide highly personalized travel recommendations based on a user's specific health and travel preferences.

---

## ✨ Key Features

- **🌍 City Analysis Dashboard**: Get a comprehensive overview of any city, including live weather, AQI, crime risk, network coverage, and local news.
- **💬 Navilux AI Assistant**: A built-in, context-aware chatbot that gives live travel advice and can physically navigate you around the app using intelligent Deep Linking.
- **🧠 AI Travel Analyst**: Generates a dynamic "Travel Score" (0-100) and highly personalized safety/health advice using Google's Gemini AI.
- **📰 AI News Summarization**: Bypasses traditional news API text limits by feeding truncated headlines and descriptions into Gemini to instantly generate detailed, 4-paragraph professional news reports directly inside the app.
- **🏞️ Smart Explore**: Discover beautiful tourism, leisure, and natural spots nearby, beautifully presented with high-quality contextual images.
- **⚙️ Personalized User Preferences**: Save medical conditions, allergies, and travel styles. The AI adapts its advice if, for example, an asthmatic user looks at a city with poor air quality.
- **🌗 Dynamic Theming**: A beautifully crafted UI with seamless Dark Mode and Light Mode support across all screens.
- **🔐 Secure Authentication**: Full integration with Firebase Auth and Firestore for secure, persistent user accounts.
- **📈 Analytics**: Native Firebase Analytics tracking to measure engagement without compromising performance.

---

## 🛠️ Technology Stack

- **Frontend**: React Native, Expo, React Navigation
- **Backend/Services**: Firebase (Auth, Firestore, Analytics, Storage)
- **Styling**: Context API (`ThemeContext`) for Global Dark Mode, Vanilla StyleSheet

---

## 🔌 APIs & Integrations

Navilux relies on a robust architecture of external APIs to aggregate real-time data:

1. **Google Gemini API**: Powers the AI Travel Analyst and the AI News Summarizer. It ingests environmental data to output strictly formatted JSON reports, and acts as a professional news anchor to elaborate truncated news headlines into comprehensive 4-paragraph reports.
2. **OpenWeatherMap API**: Provides real-time temperature, condition updates, multi-hour forecasts, and live Air Quality Index (AQI/Ozone) data.
3. **Geoapify API**: Handles geocoding (converting city names to coordinates) and fetches categories of nearby places (tourism, leisure, natural).
4. **Pexels API**: Replaces generic placeholder images by searching for stunning, high-definition stock photos based on the exact name of the place or city landmark.
5. **GNews API**: Fetches the latest, most relevant local news articles for the target city to keep travelers informed.
6. **Google Apps Script (Custom API)**: A custom-built endpoint that serves localized dataset records containing Network Provider Coverage and specific Crime Risk Levels.
7. **DiceBear API**: Generates unique, fun, and personalized default avatar emojis based on user email addresses.
8. **Ola Maps API**: Powers the highly accurate location autocomplete suggestions directly in the Maps interface.
9. **OSRM (Open Source Routing Machine)**: A free, high-performance routing API used to calculate driving directions and plot polyline routes on the map without relying on expensive Google Maps SDKs.

---

## 🧠 How the AI Report Works

The core of Navilux is the **City Analysis** engine. Here is the exact data flow of how a personalized report is generated:

1. **Data Aggregation**: The app concurrently fetches the user's saved preferences from Firestore, the live weather/AQI from OpenWeather, and the Crime/Network data from the custom dataset.
2. **Prompt Construction Algorithm (`generateAiReport`)**: A highly specific Zero-Shot Constraint Prompt is built. The algorithm explicitly feeds the AI 5 core dynamic parameters:
   - **User Preferences**: (e.g., Medical conditions, network provider)
   - **Live Weather & Forecast**: Current temperature and next 3-6 hour forecast.
   - **AQI Level**: A scale from 1 (Good) to 5 (Hazardous).
   - **Crime Risk Level**: Sourced from the localized dataset.
   - **Network Coverage**: Available telecom providers in that specific region.
3. **Model Priority Execution**: The function executes a robust fallback loop against the Google Generative AI REST API. It attempts to query the primary model `gemini-3-flash`. If rate limits or timeouts occur, it cascades down the `MODEL_PRIORITY` array (`gemini-3.1-flash-lite`, `gemini-2.5-flash-lite`, and `gemini-2.5-flash`) to ensure 100% uptime.
4. **Contextual JSON Generation**: The prompt strictly enforces a JSON-only response algorithm. The AI acts as an inference engine: it cross-references the environment with the user. For example, if the prompt includes "Asthma" and an "AQI of 4", the AI mathematically infers a lower Travel Score and generates a specific localized health warning.
5. **UI Rendering**: The JSON is parsed and beautifully rendered onto the screen as a colored badge, a 0-100 confidence score, and bulleted advice blocks.

---

## 💬 The Navilux Assistant (Smart Chat)

Navilux includes a highly advanced chatbot (`ChatScreen.js`) that acts as a personal concierge. It doesn't just chat; it actively controls the app.

1. **Context-Aware**: When you open the chat, the Assistant instantly knows your current city and secretly loads your medical/travel preferences from Firestore so it can tailor its advice natively.
2. **Action-Trigger System (Deep Linking)**: The Assistant has the power to physically navigate you through the app.
   - If you type: *"Take me to my settings"* or *"Show me Paris"*, the AI generates a hidden JSON command payload (e.g., `$$ACTION:{"action":"NAVIGATE","target":"Settings"}$$`).
   - The app's regex engine intercepts this payload, strips it from the UI so you only see a natural conversational reply, and automatically triggers React Navigation to open the requested screen or change your global city context.
3. **App Controls**: The AI can navigate to almost any screen (Home, Map, Weather, Train, Ola, Profile), change your city, and even log you out of your account if requested.

---

## 🗺️ Interactive Mapping Engine

Navilux avoids expensive native Google Maps SDKs by implementing a custom, highly interactive mapping solution via `react-native-webview`. 

1. **Leaflet & OpenStreetMap**: The app renders an HTML-based Leaflet map utilizing OpenStreetMap tiles, resulting in a lightweight, responsive, and completely free map interface.
2. **Bi-Directional Communication**: React Native and the WebView communicate seamlessly using `postMessage`. 
   - **RN to Map**: The app passes coordinates and routing polylines (fetched from OSRM) into the WebView to render custom start/end markers and dynamic route paths.
   - **Map to RN**: If a user clicks or drags the map, the Leaflet engine fires a `MAP_CLICKED` signal back to React Native. The app catches this signal, dismisses the keyboard, and cleanly hides search suggestions to maximize the map viewing area.
3. **Smart Autocomplete (Ola Maps)**: The Map screen features intelligent autocomplete fields for origin and destination. It implements smart re-fetching logic: if a user clicks back into an input field with existing text, it automatically re-triggers the Ola Maps API to instantly restore their suggestions without requiring them to re-type anything.

---

## 👤 User Preferences System

Navilux is built around the user. Inside the **Profile > Travel Preferences** screen, users can set:
- **Medical Conditions** (e.g., Asthma, Heart Condition)
- **Allergies** (e.g., Pollen, Dust)
- **Network Providers** (e.g., Jio, Airtel)

These preferences are securely stored in a Firebase Firestore document (`users/{uid}`). Whenever a user analyzes a city, this array of preferences is dynamically injected into the AI generation cycle, ensuring that a user with a specific network provider gets advice regarding that provider's coverage in the destination city.

---

## 🚀 Running the App Locally

1. Clone the repository.
2. Run `npm install` to install all dependencies.
3. Create a `.env` file in the root directory and securely add your API keys (Gemini, OpenWeather, Geoapify, Pexels, GNews, Firebase, etc.).
4. Start the Expo server using `npx expo start -c`.
5. Press `a` to run on Android emulator, or scan the QR code using Expo Go.
*(Note: Firebase Native Analytics requires a custom dev client or a production APK built via EAS).*
