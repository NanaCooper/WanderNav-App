import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeMode, lightTheme, darkTheme, getTheme } from '../constants/themes';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setCustomTheme: (customTheme: Partial<Theme>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@wander_nav_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [customTheme, setCustomThemeState] = useState<Partial<Theme> | null>(null);

  // Get the current theme based on mode and system appearance
  const getCurrentTheme = (): Theme => {
    if (customTheme) {
      return { ...lightTheme, ...customTheme };
    }

    if (themeMode === 'system') {
      return getTheme(systemColorScheme);
    }

    return themeMode === 'dark' ? darkTheme : lightTheme;
  };

  const [theme, setTheme] = useState<Theme>(getCurrentTheme());

  // Load saved theme mode from storage
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedThemeMode && ['light', 'dark', 'system'].includes(savedThemeMode)) {
          setThemeModeState(savedThemeMode as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme mode:', error);
      }
    };

    loadThemeMode();
  }, []);

  // Update theme when themeMode or system appearance changes
  useEffect(() => {
    const newTheme = getCurrentTheme();
    setTheme(newTheme);
  }, [themeMode, systemColorScheme, customTheme]);

  // Save theme mode to storage
  const saveThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  // Toggle between light and dark themes
  const toggleTheme = () => {
    const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeModeState(newMode);
    saveThemeMode(newMode);
  };

  // Set specific theme mode
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    saveThemeMode(mode);
  };

  // Set custom theme
  const setCustomTheme = (customThemeData: Partial<Theme>) => {
    setCustomThemeState(customThemeData);
  };

  // Listen for system appearance changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode === 'system') {
        const newTheme = getTheme(colorScheme);
        setTheme(newTheme);
      }
    });

    return () => subscription?.remove();
  }, [themeMode]);

  const contextValue: ThemeContextType = {
    theme,
    themeMode,
    isDark: theme.isDark,
    toggleTheme,
    setThemeMode,
    setCustomTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook to get just the theme object
export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};

// Hook to get theme spacing
export const useThemeSpacing = () => {
  const { theme } = useTheme();
  return theme.spacing;
};

// Hook to get theme typography
export const useThemeTypography = () => {
  const { theme } = useTheme();
  return theme.typography;
};

// Hook to get theme border radius
export const useThemeBorderRadius = () => {
  const { theme } = useTheme();
  return theme.borderRadius;
};

// Hook to get theme shadows
export const useThemeShadows = () => {
  const { theme } = useTheme();
  return theme.shadows;
};

// Helper function to add alpha to colors (updated to use current theme)
export const useAddAlpha = () => {
  const { theme } = useTheme();
  
  return (color: string, alpha: number): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
};