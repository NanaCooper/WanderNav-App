import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';

const WelcomeScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.BACKGROUND_PRIMARY }]}>
      {/* Top Illustration */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../assets/illustration.png')}
          style={styles.image}
        />
      </View>

      {/* Bottom Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.TEXT_PRIMARY }]}>Welcome to WanderNav</Text>
        <Text style={[styles.description, { color: theme.colors.TEXT_SECONDARY }]}>
          Your journey starts here. WanderNav offers real-time traffic updates, offline maps,
          and route planning to get you where you need to go.
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.colors.BACKGROUND_SURFACE },
            pressed && { backgroundColor: theme.colors.PRIMARY_BRAND_COLOR },
          ]}
          onPress={() => router.push('/RegisterScreen')}
        >
          <Text style={[styles.buttonText, { color: theme.colors.PRIMARY_BRAND_COLOR }]}>Get Started</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

