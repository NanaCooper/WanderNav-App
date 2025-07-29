import { ColorSchemeName } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Primary Colors
  PRIMARY_BRAND_COLOR: string;
  ACCENT_COLOR: string;
  SUCCESS_COLOR: string;
  WARNING_COLOR: string;
  ERROR_COLOR: string;
  
  // Background Colors
  BACKGROUND_PRIMARY: string;
  BACKGROUND_SECONDARY: string;
  BACKGROUND_SURFACE: string;
  BACKGROUND_ELEVATED: string;
  BACKGROUND_BLACK: string;
  
  // Text Colors
  TEXT_PRIMARY: string;
  TEXT_SECONDARY: string;
  TEXT_TERTIARY: string;
  TEXT_ON_DARK_BACKGROUND: string;
  TEXT_ON_LIGHT_BACKGROUND: string;
  
  // Border Colors
  BORDER_COLOR: string;
  BORDER_COLOR_LIGHT: string;
  BORDER_COLOR_DARK: string;
  
  // Shadow Colors
  SHADOW_COLOR: string;
  SHADOW_COLOR_LIGHT: string;
  SHADOW_COLOR_DARK: string;
  
  // Status Colors
  ONLINE_COLOR: string;
  OFFLINE_COLOR: string;
  BUSY_COLOR: string;
  
  // Gradient Colors
  GRADIENT_PRIMARY_START: string;
  GRADIENT_PRIMARY_END: string;
  GRADIENT_ACCENT_START: string;
  GRADIENT_ACCENT_END: string;
  GRADIENT_SUCCESS_START: string;
  GRADIENT_SUCCESS_END: string;
  GRADIENT_WARNING_START: string;
  GRADIENT_WARNING_END: string;
  GRADIENT_ERROR_START: string;
  GRADIENT_ERROR_END: string;
  
  // Overlay Colors
  OVERLAY_LIGHT: string;
  OVERLAY_DARK: string;
  OVERLAY_MODAL: string;
  
  // Special Colors
  TRANSPARENT: string;
  WHITE: string;
  BLACK: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeTypography {
  h1: {
    fontSize: number;
    fontWeight: string;
    lineHeight: number;
  };
  h2: {
    fontSize: number;
    fontWeight: string;
    lineHeight: number;
  };
  h3: {
    fontSize: number;
    fontWeight: string;
    lineHeight: number;
  };
  body: {
    fontSize: number;
    fontWeight: string;
    lineHeight: number;
  };
  caption: {
    fontSize: number;
    fontWeight: string;
    lineHeight: number;
  };
  button: {
    fontSize: number;
    fontWeight: string;
    lineHeight: number;
  };
}

export interface ThemeBorderRadius {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  round: number;
}

export interface ThemeShadows {
  sm: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  md: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  lg: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
  isDark: boolean;
}

// Light Theme
export const lightTheme: Theme = {
  colors: {
    // Primary Colors
    PRIMARY_BRAND_COLOR: '#2563EB',
    ACCENT_COLOR: '#10B981',
    SUCCESS_COLOR: '#059669',
    WARNING_COLOR: '#F59E0B',
    ERROR_COLOR: '#DC2626',
    
    // Background Colors
    BACKGROUND_PRIMARY: '#FFFFFF',
    BACKGROUND_SECONDARY: '#F8FAFC',
    BACKGROUND_SURFACE: '#FFFFFF',
    BACKGROUND_ELEVATED: '#FFFFFF',
    BACKGROUND_BLACK: '#000000',
    
    // Text Colors
    TEXT_PRIMARY: '#1F2937',
    TEXT_SECONDARY: '#6B7280',
    TEXT_TERTIARY: '#9CA3AF',
    TEXT_ON_DARK_BACKGROUND: '#FFFFFF',
    TEXT_ON_LIGHT_BACKGROUND: '#1F2937',
    
    // Border Colors
    BORDER_COLOR: '#E5E7EB',
    BORDER_COLOR_LIGHT: '#F3F4F6',
    BORDER_COLOR_DARK: '#D1D5DB',
    
    // Shadow Colors
    SHADOW_COLOR: '#000000',
    SHADOW_COLOR_LIGHT: '#000000',
    SHADOW_COLOR_DARK: '#000000',
    
    // Status Colors
    ONLINE_COLOR: '#10B981',
    OFFLINE_COLOR: '#6B7280',
    BUSY_COLOR: '#F59E0B',
    
    // Gradient Colors
    GRADIENT_PRIMARY_START: '#2563EB',
    GRADIENT_PRIMARY_END: '#1D4ED8',
    GRADIENT_ACCENT_START: '#10B981',
    GRADIENT_ACCENT_END: '#059669',
    GRADIENT_SUCCESS_START: '#059669',
    GRADIENT_SUCCESS_END: '#047857',
    GRADIENT_WARNING_START: '#F59E0B',
    GRADIENT_WARNING_END: '#D97706',
    GRADIENT_ERROR_START: '#DC2626',
    GRADIENT_ERROR_END: '#B91C1C',
    
    // Overlay Colors
    OVERLAY_LIGHT: 'rgba(255, 255, 255, 0.8)',
    OVERLAY_DARK: 'rgba(0, 0, 0, 0.4)',
    OVERLAY_MODAL: 'rgba(0, 0, 0, 0.5)',
    
    // Special Colors
    TRANSPARENT: 'transparent',
    WHITE: '#FFFFFF',
    BLACK: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal',
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: 'normal',
      lineHeight: 20,
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
    },
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    round: 50,
  },
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
  },
  isDark: false,
};

// Dark Theme
export const darkTheme: Theme = {
  colors: {
    // Primary Colors
    PRIMARY_BRAND_COLOR: '#3B82F6',
    ACCENT_COLOR: '#10B981',
    SUCCESS_COLOR: '#059669',
    WARNING_COLOR: '#F59E0B',
    ERROR_COLOR: '#EF4444',
    
    // Background Colors
    BACKGROUND_PRIMARY: '#0F172A',
    BACKGROUND_SECONDARY: '#1E293B',
    BACKGROUND_SURFACE: '#334155',
    BACKGROUND_ELEVATED: '#475569',
    BACKGROUND_BLACK: '#000000',
    
    // Text Colors
    TEXT_PRIMARY: '#F8FAFC',
    TEXT_SECONDARY: '#CBD5E1',
    TEXT_TERTIARY: '#94A3B8',
    TEXT_ON_DARK_BACKGROUND: '#FFFFFF',
    TEXT_ON_LIGHT_BACKGROUND: '#1F2937',
    
    // Border Colors
    BORDER_COLOR: '#334155',
    BORDER_COLOR_LIGHT: '#475569',
    BORDER_COLOR_DARK: '#1E293B',
    
    // Shadow Colors
    SHADOW_COLOR: '#000000',
    SHADOW_COLOR_LIGHT: '#000000',
    SHADOW_COLOR_DARK: '#000000',
    
    // Status Colors
    ONLINE_COLOR: '#10B981',
    OFFLINE_COLOR: '#64748B',
    BUSY_COLOR: '#F59E0B',
    
    // Gradient Colors
    GRADIENT_PRIMARY_START: '#3B82F6',
    GRADIENT_PRIMARY_END: '#2563EB',
    GRADIENT_ACCENT_START: '#10B981',
    GRADIENT_ACCENT_END: '#059669',
    GRADIENT_SUCCESS_START: '#059669',
    GRADIENT_SUCCESS_END: '#047857',
    GRADIENT_WARNING_START: '#F59E0B',
    GRADIENT_WARNING_END: '#D97706',
    GRADIENT_ERROR_START: '#EF4444',
    GRADIENT_ERROR_END: '#DC2626',
    
    // Overlay Colors
    OVERLAY_LIGHT: 'rgba(255, 255, 255, 0.1)',
    OVERLAY_DARK: 'rgba(0, 0, 0, 0.7)',
    OVERLAY_MODAL: 'rgba(0, 0, 0, 0.8)',
    
    // Special Colors
    TRANSPARENT: 'transparent',
    WHITE: '#FFFFFF',
    BLACK: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal',
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: 'normal',
      lineHeight: 20,
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
    },
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    round: 50,
  },
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  isDark: true,
};

// Theme mapping
export const themes = {
  light: lightTheme,
  dark: darkTheme,
};

// Helper function to get theme based on color scheme
export const getTheme = (colorScheme: ColorSchemeName): Theme => {
  if (colorScheme === 'dark') {
    return darkTheme;
  }
  return lightTheme;
};

// Helper function to add alpha to colors
export const addAlpha = (color: string, alpha: number): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Export the current theme for backward compatibility
export const THEME = lightTheme; 