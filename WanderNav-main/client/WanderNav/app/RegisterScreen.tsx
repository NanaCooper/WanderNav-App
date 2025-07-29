import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';

const RegisterScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <ImageBackground
      source={require('../assets/bg-map.png')}
      style={styles.background}
    >
      {/* Title at the top */}
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: theme.colors.TEXT_ON_DARK_BACKGROUND }]}>WanderNav</Text>
      </View>

      <View style={styles.overlay}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.colors.BACKGROUND_SURFACE },
            pressed && { backgroundColor: theme.colors.PRIMARY_BRAND_COLOR },
          ]}
          onPress={() => router.push('/SignIn')}
        >
          <Text style={[styles.buttonText, { color: theme.colors.PRIMARY_BRAND_COLOR }]}>Sign In</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.colors.BACKGROUND_SURFACE },
            pressed && { backgroundColor: theme.colors.PRIMARY_BRAND_COLOR },
          ]}
          onPress={() => router.push('/SignUp')}
        >
          <Text style={[styles.buttonText, { color: theme.colors.PRIMARY_BRAND_COLOR }]}>Sign Up</Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  titleContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 60, // adjust as needed
    marginBottom: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,

  },
  button: {
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    borderRadius: 100,
    marginBottom: 18,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});