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
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { THEME, addAlpha } from '../constants/theme';
import { authApiService } from '../src/services/api';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

const SignUpScreen = () => {
  const { theme } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await authApiService.register(email, password);
      Alert.alert('Success', 'Account created successfully! Please sign in.');
      router.push('/SignIn');
    } catch (error) {
      console.error('Signup error:', error);
      const message = error.response?.data || 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
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
                <Ionicons name="person-add" size={60} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join WanderNav today</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#fff" style={styles.inputIcon} />
                <TextInput
                  placeholder="Enter your full name"
                  placeholderTextColor={addAlpha('#fff', 0.7)}
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.input}
                />
              </View>
            </View>

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

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#fff" style={styles.inputIcon} />
                <TextInput
                  placeholder="Confirm your password"
                  placeholderTextColor={addAlpha('#fff', 0.7)}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  style={styles.input}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? 
                  [addAlpha('#fff', 0.3), addAlpha('#fff', 0.2)] : 
                  ['#fff', addAlpha('#fff', 0.9)]
                }
                style={styles.signUpGradient}
              >
                {loading ? (
                  <ActivityIndicator color={THEME.ACCENT_COLOR} />
                ) : (
                  <>
                    <Ionicons name="person-add-outline" size={20} color={THEME.ACCENT_COLOR} />
                    <Text style={styles.signUpText}>Create Account</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>
              Already have an account?{' '}
              <TouchableOpacity onPress={() => router.push('/SignIn')}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignUpScreen;

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
  signUpButton: {
    marginTop: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signUpGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 15,
  },
  signUpText: {
    color: THEME.ACCENT_COLOR,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  signInContainer: {
    alignItems: 'center',
  },
  signInText: {
    color: addAlpha('#fff', 0.9),
    fontSize: 16,
    textAlign: 'center',
  },
  signInLink: {
    color: '#fff',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
