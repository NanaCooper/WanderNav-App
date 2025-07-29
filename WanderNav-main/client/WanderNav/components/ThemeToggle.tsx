import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  style?: any;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ style }) => {
  const { theme, themeMode, toggleTheme, setThemeMode } = useTheme();

  const handleToggle = () => {
    toggleTheme();
  };

  const handleSetMode = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.toggleButton, { backgroundColor: theme.colors.BACKGROUND_SURFACE }]}
        onPress={handleToggle}
      >
        <Ionicons
          name={theme.isDark ? 'sunny' : 'moon'}
          size={20}
          color={theme.colors.TEXT_PRIMARY}
        />
      </TouchableOpacity>
      
      <View style={styles.modeButtons}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            { backgroundColor: themeMode === 'light' ? theme.colors.ACCENT_COLOR : theme.colors.BACKGROUND_SECONDARY }
          ]}
          onPress={() => handleSetMode('light')}
        >
          <Text style={[
            styles.modeText,
            { color: themeMode === 'light' ? theme.colors.WHITE : theme.colors.TEXT_SECONDARY }
          ]}>
            Light
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.modeButton,
            { backgroundColor: themeMode === 'dark' ? theme.colors.ACCENT_COLOR : theme.colors.BACKGROUND_SECONDARY }
          ]}
          onPress={() => handleSetMode('dark')}
        >
          <Text style={[
            styles.modeText,
            { color: themeMode === 'dark' ? theme.colors.WHITE : theme.colors.TEXT_SECONDARY }
          ]}>
            Dark
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.modeButton,
            { backgroundColor: themeMode === 'system' ? theme.colors.ACCENT_COLOR : theme.colors.BACKGROUND_SECONDARY }
          ]}
          onPress={() => handleSetMode('system')}
        >
          <Text style={[
            styles.modeText,
            { color: themeMode === 'system' ? theme.colors.WHITE : theme.colors.TEXT_SECONDARY }
          ]}>
            Auto
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  modeText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 