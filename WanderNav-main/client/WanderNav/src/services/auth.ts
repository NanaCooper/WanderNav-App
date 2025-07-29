import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from './api';
import { logAuth, logError } from '../utils/logger';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
}

export interface AuthResponse {
  token: string;
  message?: string;
}

export const authService = {
  // Login user
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      logAuth('Attempting login', { username: credentials.username });
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/api/auth/login`, credentials);
      
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        logAuth('Login successful, token stored');
        return response.data;
      } else {
        throw new Error('No token received from server');
      }
    } catch (error) {
      logError('Login error', error);
      throw error;
    }
  },

  // Register user
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
      logAuth('Attempting registration', { username: userData.username });
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/api/auth/register`, userData);
      logAuth('Registration successful');
      return response.data;
    } catch (error) {
      logError('Registration error', error);
      throw error;
    }
  },

  // Get current token
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      logError('Error getting token', error);
      return null;
    }
  },

  // Remove token (logout)
  logout: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('authToken');
      logAuth('Logout successful, token removed');
    } catch (error) {
      logError('Error during logout', error);
    }
  },

  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      logError('Error checking authentication', error);
      return false;
    }
  },

  // Create a test user for development
  createTestUser: async (): Promise<void> => {
    try {
      logAuth('Creating test user');
      await authService.register({
        username: 'testuser',
        password: 'testpass123',
        email: 'test@example.com'
      });
      logAuth('Test user created successfully');
    } catch (error) {
      logAuth('Test user might already exist or error occurred', error);
    }
  },

  // Auto-login with test credentials
  autoLoginTestUser: async (): Promise<void> => {
    try {
      console.log('🔐 Auto-login with test user...');
      const response = await authService.login({
        username: 'testuser',
        password: 'testpass123'
      });
      console.log('🔐 Auto-login successful:', response);
    } catch (error) {
      console.log('🔐 Auto-login failed, creating test user...');
      try {
        await authService.createTestUser();
        await authService.login({
          username: 'testuser',
          password: 'testpass123'
        });
        console.log('🔐 Test user created and logged in successfully');
      } catch (createError) {
        console.log('🔐 Failed to create or login test user:', createError);
      }
    }
  },

  // Test authentication flow
  testAuthFlow: async (): Promise<{ [key: string]: boolean }> => {
    const results: { [key: string]: boolean } = {};
    
    try {
      console.log('🔐 Testing authentication flow...');
      
      // Test registration
      try {
        await authService.register({
          username: 'authtest',
          password: 'authtest123',
          email: 'authtest@example.com'
        });
        results['registration'] = true;
        console.log('🔐 Registration test passed');
      } catch (error) {
        results['registration'] = false;
        console.log('🔐 Registration test failed (user might exist):', error);
      }

      // Test login
      try {
        const loginResponse = await authService.login({
          username: 'authtest',
          password: 'authtest123'
        });
        results['login'] = !!loginResponse.token;
        console.log('🔐 Login test passed');
      } catch (error) {
        results['login'] = false;
        console.log('🔐 Login test failed:', error);
      }

      // Test token retrieval
      try {
        const token = await authService.getToken();
        results['token_retrieval'] = !!token;
        console.log('🔐 Token retrieval test passed');
      } catch (error) {
        results['token_retrieval'] = false;
        console.log('🔐 Token retrieval test failed:', error);
      }

      // Test authentication check
      try {
        const isAuth = await authService.isAuthenticated();
        results['auth_check'] = isAuth;
        console.log('🔐 Authentication check test passed');
      } catch (error) {
        results['auth_check'] = false;
        console.log('🔐 Authentication check test failed:', error);
      }

      console.log('🔐 Auth flow test results:', results);
      return results;
    } catch (error) {
      console.error('🔐 Auth flow test failed:', error);
      return results;
    }
  }
};

// Export testAuthFlow as a separate function for easier importing
export const testAuthFlow = authService.testAuthFlow; 