import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Set Light Mode as the default by setting initial state to false
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Load user's saved theme preference when app starts
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@theme_mode');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        }
      } catch (error) {
        console.log('Failed to load theme preference', error);
      }
    };
    loadThemePreference();
  }, []);

  const toggleDarkMode = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      // Save preference so it stays the same on next app open
      await AsyncStorage.setItem('@theme_mode', newMode ? 'dark' : 'light');
    } catch (error) {
      console.log('Failed to save theme preference', error);
    }
  };

  const theme = isDarkMode
    ? {
        mode: 'dark',
        background: '#121212',
        card: '#1E1E1E',
        text: '#FFFFFF',
        subText: '#AAAAAA',
        primary: '#7EC7FF',
        border: '#333333',
        danger: '#FF5C5C',
      }
    : {
        mode: 'light',
        background: '#F4F6F8',
        card: '#FFFFFF',
        text: '#2C3E50',
        subText: '#7F8C8D',
        primary: '#7EC7FF',
        border: '#EAEAEA',
        danger: '#FF5C5C',
      };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
