import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const useThemeAwareScreenOptions = () => {
  const { theme } = useTheme();
  
  return {
    headerStyle: { 
      backgroundColor: theme.colors.BACKGROUND_SURFACE, 
      elevation: 0, 
      shadowOpacity: 0, 
      borderBottomWidth: 1, 
      borderBottomColor: theme.colors.BORDER_COLOR 
    },
    headerTintColor: theme.colors.PRIMARY_BRAND_COLOR,
    headerTitleStyle: { 
      fontWeight: '600', 
      fontSize: 18, 
      color: theme.colors.TEXT_PRIMARY 
    },
    headerBackTitleVisible: false,
    contentStyle: {
      backgroundColor: theme.colors.BACKGROUND_PRIMARY,
    },
  };
};

// Fallback screen options for when theme is not available
export const getDefaultScreenOptions = () => ({
  headerStyle: { 
    backgroundColor: '#FFFFFF', 
    elevation: 0, 
    shadowOpacity: 0, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB' 
  },
  headerTintColor: '#2563EB',
  headerTitleStyle: { 
    fontWeight: '600', 
    fontSize: 18, 
    color: '#1F2937' 
  },
  headerBackTitleVisible: false,
  contentStyle: {
    backgroundColor: '#FFFFFF',
  },
}); 