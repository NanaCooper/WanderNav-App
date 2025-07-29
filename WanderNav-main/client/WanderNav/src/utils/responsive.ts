// src/utils/responsive.ts
import { Dimensions, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device type detection
export const isTablet = () => {
  return SCREEN_WIDTH >= 768;
};

export const isSmallDevice = () => {
  return SCREEN_WIDTH < 375;
};

export const isLargeDevice = () => {
  return SCREEN_WIDTH >= 414;
};

// Screen dimensions
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

// Status bar height
export const statusBarHeight = StatusBar.currentHeight || (Platform.OS === 'ios' ? 44 : 24);

// Responsive sizing
export const wp = (percentage: number) => {
  return (SCREEN_WIDTH * percentage) / 100;
};

export const hp = (percentage: number) => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

// Responsive font sizes
export const fontSize = {
  xs: isSmallDevice() ? 10 : 12,
  sm: isSmallDevice() ? 12 : 14,
  md: isSmallDevice() ? 14 : 16,
  lg: isSmallDevice() ? 16 : 18,
  xl: isSmallDevice() ? 18 : 20,
  xxl: isSmallDevice() ? 20 : 24,
  xxxl: isSmallDevice() ? 24 : 32,
};

// Responsive spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Responsive icon sizes
export const iconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Responsive button sizes
export const buttonSize = {
  sm: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  md: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  lg: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
};

// Responsive card sizes
export const cardSize = {
  sm: {
    padding: spacing.sm,
    borderRadius: 8,
    margin: spacing.xs,
  },
  md: {
    padding: spacing.md,
    borderRadius: 12,
    margin: spacing.sm,
  },
  lg: {
    padding: spacing.lg,
    borderRadius: 16,
    margin: spacing.md,
  },
};

// Safe area helpers
export const getSafeAreaInsets = () => {
  return {
    top: statusBarHeight,
    bottom: Platform.OS === 'ios' ? 34 : 0,
  };
};

// Responsive layout helpers
export const responsiveLayout = {
  // Container padding
  containerPadding: isTablet() ? spacing.lg : spacing.md,
  
  // Header height
  headerHeight: statusBarHeight + (isTablet() ? 60 : 44),
  
  // Bottom tab height
  bottomTabHeight: Platform.OS === 'ios' ? 83 : 60,
  
  // Modal padding
  modalPadding: isTablet() ? spacing.xl : spacing.lg,
  
  // List item height
  listItemHeight: isTablet() ? 80 : 60,
  
  // Input height
  inputHeight: isTablet() ? 52 : 44,
  
  // Button height
  buttonHeight: isTablet() ? 52 : 44,
};

// Responsive text styles
export const responsiveText = {
  h1: {
    fontSize: fontSize.xxxl,
    lineHeight: fontSize.xxxl * 1.3,
  },
  h2: {
    fontSize: fontSize.xxl,
    lineHeight: fontSize.xxl * 1.3,
  },
  h3: {
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * 1.3,
  },
  body: {
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.5,
  },
  caption: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.4,
  },
  button: {
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.2,
  },
};

// Responsive shadow
export const responsiveShadow = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
};

// Responsive border radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 50,
};

// Utility function to get responsive value
export const getResponsiveValue = <T>(
  mobile: T,
  tablet: T,
  large?: T
): T => {
  if (isTablet()) {
    return large || tablet;
  }
  return mobile;
};

// Utility function for responsive margins/padding
export const getResponsiveSpacing = (
  mobile: number,
  tablet: number,
  large?: number
): number => {
  return getResponsiveValue(mobile, tablet, large);
}; 