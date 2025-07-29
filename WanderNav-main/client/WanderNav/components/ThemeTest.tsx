import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

export const ThemeTest: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.BACKGROUND_PRIMARY }]}>
      <Text style={[styles.title, { color: theme.colors.TEXT_PRIMARY }]}>
        Theme Test Component
      </Text>
      
      <Text style={[styles.subtitle, { color: theme.colors.TEXT_SECONDARY }]}>
        Current Theme: {isDark ? 'Dark' : 'Light'}
      </Text>
      
      <View style={[styles.card, { backgroundColor: theme.colors.BACKGROUND_SURFACE }]}>
        <Text style={[styles.cardText, { color: theme.colors.TEXT_PRIMARY }]}>
          This is a test card with theme colors
        </Text>
        <Text style={[styles.cardSubtext, { color: theme.colors.TEXT_SECONDARY }]}>
          Background: {theme.colors.BACKGROUND_SURFACE}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: theme.colors.ACCENT_COLOR }]}
        onPress={toggleTheme}
      >
        <Text style={[styles.buttonText, { color: theme.colors.WHITE }]}>
          Toggle Theme
        </Text>
      </TouchableOpacity>
      
      <ThemeToggle style={styles.themeToggle} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  cardSubtext: {
    fontSize: 14,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeToggle: {
    marginTop: 20,
  },
}); 