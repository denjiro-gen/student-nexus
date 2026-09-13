import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme(); // 'light' or 'dark'
  const [themeMode, setThemeMode] = useState('system'); // 'system', 'light', 'dark'
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('appThemeMode');
        if (savedTheme) {
          setThemeMode(savedTheme);
        }
      } catch (e) {
        console.error('Failed to load theme mode', e);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    if (themeMode === 'system') {
      setIsDark(systemColorScheme === 'dark');
    } else {
      setIsDark(themeMode === 'dark');
    }
  }, [themeMode, systemColorScheme]);

  const changeThemeMode = async (mode) => {
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem('appThemeMode', mode);
    } catch (e) {
      console.error('Failed to save theme mode', e);
    }
  };

  const theme = {
    isDark,
    mode: themeMode,
    colors: {
      brand: '#03632B',
      brandDark: '#024d21',
      brandLight: isDark ? 'rgba(3,99,43,0.3)' : '#E8F5EE',
      background: isDark ? '#121212' : '#F4F7F5',
      surface: isDark ? '#1E1E1E' : '#FFFFFF',
      text: isDark ? '#F9FAFB' : '#1A1A1A',
      textMuted: isDark ? '#9CA3AF' : '#6B7280',
      border: isDark ? '#374151' : '#E5E7EB',
      error: '#EF4444',
      errorLight: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
      success: '#10B981',
      successLight: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5',
      warning: '#F59E0B',
      warningLight: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
    },
    changeThemeMode,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
