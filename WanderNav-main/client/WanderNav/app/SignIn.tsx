import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { THEME, addAlpha } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

const SignInScreen = () => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://10.33.249.250:8080/api/auth/login', {
        username: email,
        password: password,
      });

      const token = response.data.token;

      if (response.status === 200 && token) {
        await AsyncStorage.setItem('authToken', token);
        Alert.alert('Success', 'Logged in successfully!');
        router.replace('/home');
      } else {
        Alert.alert('Login Failed', 'Unexpected response from server.');
      }
    } catch (error: unknown) {
      console.error('Login error:', error);

      const message =
        error && typeof error === 'object' && 'message' in error
          ? (error as { message: string }).message
          : 'Unable to login. Please check your credentials or server.';

      Alert.alert('Login Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Overlay */}
      <LinearGradient
        colors={[addAlpha(theme.colors.ACCENT_COLOR, 0.9), addAlpha(theme.colors.PRIMARY_BRAND_COLOR, 0.8)]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative Elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      <View style={styles.decorativeCircle3} />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[addAlpha('#fff', 0.1), addAlpha('#fff', 0.05)]}
                style={styles.logoGradient}
              >
                <Ionicons name="navigate" size={60} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#fff" style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter your email"
                  placeholderTextColor={addAlpha('#fff', 0.7)}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#fff" style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor={addAlpha('#fff', 0.7)}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? 
                  [addAlpha('#fff', 0.3), addAlpha('#fff', 0.2)] : 
                  ['#fff', addAlpha('#fff', 0.9)]
                }
                style={styles.signInGradient}
              >
                {loading ? (
                  <ActivityIndicator color={THEME.ACCENT_COLOR} />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color={THEME.ACCENT_COLOR} />
                    <Text style={styles.signInText}>Sign In</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>
              Don't have an account?{' '}
              <TouchableOpacity onPress={() => router.push('/SignUp')}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignInScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: height * 0.1,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: addAlpha('#fff', 0.1),
  },
  decorativeCircle2: {
    position: 'absolute',
    top: height * 0.3,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: addAlpha('#fff', 0.08),
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: height * 0.2,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: addAlpha('#fff', 0.06),
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: addAlpha('#fff', 0.9),
    textAlign: 'center',
  },
  form: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: addAlpha('#fff', 0.15),
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: addAlpha('#fff', 0.2),
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    height: '100%',
  },
  eyeButton: {
    padding: 5,
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: addAlpha('#fff', 0.8),
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  signInButton: {
    marginTop: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signInGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 15,
  },
  signInText: {
    color: THEME.ACCENT_COLOR,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  signUpContainer: {
    alignItems: 'center',
  },
  signUpText: {
    color: addAlpha('#fff', 0.9),
    fontSize: 16,
    textAlign: 'center',
  },
  signUpLink: {
    color: '#fff',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
