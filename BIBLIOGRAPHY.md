# Bibliography & References: Navilux 

This document outlines the frameworks, libraries, APIs, and design inspirations utilized in the development of the Navilux application for the final year project report.

## 1. Core Frameworks & Libraries
*   **React Native:** The core JavaScript framework used for building the native cross-platform mobile application.
    *   *Source:* [https://reactnative.dev/](https://reactnative.dev/)
*   **Expo:** Utilized as the primary toolchain and development framework to streamline React Native development, testing, and native module management.
    *   *Source:* [https://expo.dev/](https://expo.dev/)
*   **React Navigation:** Implemented for handling routing, stack navigation, and seamless transitions between different screens (Home, Profile, Weather, Maps).
    *   *Source:* [https://reactnavigation.org/](https://reactnavigation.org/)

## 2. Backend & Authentication
*   **Firebase (Google):** Utilized for secure user authentication, user state management, and backend data services.
    *   *Source:* [https://firebase.google.com/docs](https://firebase.google.com/docs)
*   **Expo Auth Session:** Used in conjunction with Firebase for handling secure, modern login flows.
    *   *Source:* [https://docs.expo.dev/versions/latest/sdk/auth-session/](https://docs.expo.dev/versions/latest/sdk/auth-session/)

## 3. APIs & Integrations
*   **Google Gemini AI API (`@google/genai`):** Integrated to provide intelligent, AI-driven travel suggestions and smart assistance within the application.
    *   *Source:* [https://ai.google.dev/](https://ai.google.dev/)
*   **React Native Maps & Expo Location:** Used for rendering interactive map interfaces, requesting user geolocation permissions, and tracking live whereabouts.
    *   *Source:* [https://github.com/react-native-maps/react-native-maps](https://github.com/react-native-maps/react-native-maps)
*   **Mapbox Polyline:** Utilized for decoding and drawing precise route paths on the map interface.
    *   *Source:* [https://github.com/mapbox/polyline](https://github.com/mapbox/polyline)
*   **Ola Cabs (via WebView):** Integrated using `react-native-webview` to allow users to access ride-hailing services directly within the Navilux ecosystem.
    *   *Source (WebView):* [https://github.com/react-native-webview/react-native-webview](https://github.com/react-native-webview/react-native-webview)
    *   *Source (Ola):* [https://www.olacabs.com/](https://www.olacabs.com/)

## 4. UI/UX Design & Styling
*   **Design Inspiration - Samsung Weather UI:** Served as the core inspiration for the home screen layout, specifically the use of dynamic, swipeable metric cards to display dense information cleanly and professionally.
*   **Global Dark Mode:** Custom-built theming using React's `ThemeContext` to provide a premium, eye-friendly dark mode consistent across all screens.
*   **React Native Reanimated:** Used for achieving smooth, native-driven micro-animations and gesture-based interactions (like the swipeable metric cards).
    *   *Source:* [https://docs.swmansion.com/react-native-reanimated/](https://docs.swmansion.com/react-native-reanimated/)
*   **Expo Linear Gradient:** Used to create premium visual backgrounds and card styles, avoiding flat, generic UI designs.
    *   *Source:* [https://docs.expo.dev/versions/latest/sdk/linear-gradient/](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)
*   **Pravatar (`pravatar.cc`):** Utilized for dynamically generating professional default user avatars for accounts without custom profile pictures.
    *   *Source:* [https://pravatar.cc/](https://pravatar.cc/)

## 5. Development Tools & References
*   **Node.js & npm:** Used for package management and local server environment.
    *   *Source:* [https://nodejs.org/](https://nodejs.org/)
*   **Stack Overflow:** Consulted for troubleshooting debugging errors and resolving React Native specific runtime issues during development.
*   **GitHub / Open Source Repositories:** Consulted for resolving specific dependency conflicts (e.g., matching Expo SDK versions with React Navigation).
*   **MDN Web Docs:** For general JavaScript (ES6+) syntax references and standard best practices.
    *   *Source:* [https://developer.mozilla.org/](https://developer.mozilla.org/)
