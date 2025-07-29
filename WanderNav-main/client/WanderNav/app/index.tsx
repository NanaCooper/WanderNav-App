import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';

const SplashScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Show logo for 2 seconds, then fade out and navigate
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800, // Fade out over 800ms
        useNativeDriver: true,
      }).start(() => {
        // Navigate to WelcomeScreen after fade completes
        router.replace('/WelcomeScreen');
      });
    }, 2000); // Wait 2 seconds before starting fade

    return () => clearTimeout(timer);
  }, [fadeAnim, router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.BACKGROUND_PRIMARY }]}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        <Image source={require('../assets/WanderNavlogo.png')} style={styles.logo} />
      </Animated.View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
});
