// src/services/apiService.ts
import axios, { AxiosInstance } from 'axios';
import { logApi, logError, logAuth } from '../utils/logger';

// Environment-based API configuration
const getApiBaseUrl = () => {
  // In development, use localhost or your local IP
  if (__DEV__) {
    return 'http://localhost:8080'; // Change this to your local IP if needed
  }
  // In production, use your actual server URL
  return 'https://your-production-server.com'; // Update this for production
};

export const API_BASE_URL = getApiBaseUrl();

// Google Directions API Configuration
const GOOGLE_DIRECTIONS_API_KEY = 'AIzaSyAYomIa3M4RB4IWf9j4vOXPGCczFu7ALus';
const GOOGLE_DIRECTIONS_BASE_URL = 'https://maps.googleapis.com/maps/api/directions/json';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // Increased timeout for better reliability
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Import AsyncStorage dynamically to avoid issues
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('authToken');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔐 Adding auth token to request');
      } else {
        console.log('🔐 No auth token found');
      }
    } catch (error) {
      console.log('🔐 Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    console.error('🔐 Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    logApi(
      response.config.method || 'GET',
      response.config.url || '',
      response.status,
      response.data
    );
    return response;
  },
  async (error) => {
    logError('API Error', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem('authToken');
        logAuth('Auth token removed due to 401/403 error');
        
        // You can add navigation to login screen here if needed
        // import { router } from 'expo-router';
        // router.replace('/SignIn');
      } catch (storageError) {
        logError('Error removing auth token', storageError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Connection test function
export const testBackendConnection = async (): Promise<boolean> => {
  try {
    console.log('🔗 Testing backend connection...');
    const response = await apiClient.get('/api/auth/me');
    console.log('🔗 Backend connection successful:', response.status);
    return true;
  } catch (error) {
    console.error('🔗 Backend connection failed:', error);
    return false;
  }
};



// Comprehensive API test function
export const testAllApiEndpoints = async (): Promise<{ [key: string]: boolean }> => {
  const results: { [key: string]: boolean } = {};
  
  try {
    // Test auth endpoints
    console.log('🔗 Testing auth endpoints...');
    try {
      const authResponse = await apiClient.get('/api/auth/me');
      results['auth_me'] = authResponse.status === 200;
    } catch (error) {
      results['auth_me'] = false;
    }

    // Test search endpoints
    console.log('🔗 Testing search endpoints...');
    try {
      const searchResponse = await apiClient.post('/api/search', {
        query: 'test',
        type: 'places'
      });
      results['search'] = searchResponse.status === 200;
    } catch (error) {
      results['search'] = false;
    }

    // Test user endpoints
    console.log('🔗 Testing user endpoints...');
    try {
      const usersResponse = await apiClient.get('/api/users');
      results['users'] = usersResponse.status === 200;
    } catch (error) {
      results['users'] = false;
    }

    // Test group endpoints
    console.log('🔗 Testing group endpoints...');
    try {
      const groupsResponse = await apiClient.get('/api/groups?userId=test');
      results['groups'] = groupsResponse.status === 200;
    } catch (error) {
      results['groups'] = false;
    }

    // Test weather endpoints
    console.log('🔗 Testing weather endpoints...');
    try {
      const weatherResponse = await apiClient.get('/api/weather?latitude=40.7128&longitude=-74.0060');
      results['weather'] = weatherResponse.status === 200;
    } catch (error) {
      results['weather'] = false;
    }

    console.log('🔗 API test results:', results);
    return results;
  } catch (error) {
    console.error('🔗 API test failed:', error);
    return results;
  }
};

// --- Define types for better code intelligence ---

// For Search
export interface SearchApiRequest {
  query: string;
  type: 'places' | 'users' | 'hazards';
  latitude?: number;
  longitude?: number;
}

export interface SearchApiResponseItem {
  id: string;
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  username?: string;
  hazardType?: string;
}

// For User Search
export interface UserSearchResponse {
  id: string;
  username: string;
  email: string;
}

export interface GroupCreationRequest {
  name: string;
  memberIds: string[];
}

export interface GroupCreationResponse {
  id: string;
  name: string;
  memberIds: string[];
  createdAt: string;
}

// For Weather
export interface WeatherApiParams {
  latitude: number;
  longitude: number;
}

export interface WeatherApiResponse {
  temp: number;
  description: string;
  icon: string;
  locationName?: string;
  humidity?: number;
  windSpeed?: number;
}

// Destination API Interfaces
export interface SavedDestination {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  lastVisited?: string;
  isFavorite: boolean;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDestinationRequest {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
}

export interface UpdateDestinationRequest {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  isFavorite?: boolean;
}

// --- API Functions ---

export const searchApiService = {
  performSearch: async (params: SearchApiRequest): Promise<SearchApiResponseItem[]> => {
    try {
      console.log('🔍 Sending search request to backend:', params);
      const response = await apiClient.post<SearchApiResponseItem[]>('/api/search', params);
      console.log('🔍 Received search response from backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('🔍 API Error - performSearch:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('🔍 Backend search error response:', error.response.data);
      }
      throw error;
    }
  },
};

export const userApiService = {
  searchUsers: async (query: string): Promise<UserSearchResponse[]> => {
    try {
      console.log('👥 Searching users with query:', query);
      const response = await apiClient.get<UserSearchResponse[]>(`/api/users/search?query=${encodeURIComponent(query)}`);
      console.log('👥 Received user search response:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 403) {
          console.log('👥 Access denied for user search, using fallback data');
          return [];
        }
        console.error('👥 Backend user search error response:', error.response.data);
      } else {
        console.error('👥 API Error - searchUsers:', error);
      }
      throw error;
    }
  },

  getAllUsers: async (): Promise<UserSearchResponse[]> => {
    try {
      console.log('👥 Fetching all users');
      const response = await apiClient.get<UserSearchResponse[]>('/api/users');
      console.log('👥 Received all users response:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 403) {
          console.log('👥 Access denied for all users, using fallback data');
          return [];
        }
        console.error('👥 Backend get all users error response:', error.response.data);
      } else {
        console.error('👥 API Error - getAllUsers:', error);
      }
      throw error;
    }
  },
};

export const groupApiService = {
  createGroup: async (groupData: GroupCreationRequest): Promise<GroupCreationResponse> => {
    try {
      console.log('👥 Creating group:', groupData);
      const response = await apiClient.post<GroupCreationResponse>('/api/groups', groupData);
      console.log('👥 Group created successfully:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 403) {
          throw new Error('Access denied. Please check your authentication.');
        }
        console.error('👥 Backend group creation error response:', error.response.data);
      } else {
        console.error('👥 API Error - createGroup:', error);
      }
      throw error;
    }
  },

  getUserGroups: async (userId: string): Promise<GroupCreationResponse[]> => {
    try {
      console.log('👥 Fetching user groups for userId:', userId);
      const response = await apiClient.get<GroupCreationResponse[]>(`/api/groups?userId=${userId}`);
      console.log('👥 Received user groups response:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 403) {
          // Return empty array for 403 instead of throwing error
          console.log('👥 Access denied for groups, using fallback data');
          return [];
        }
        console.error('👥 Backend get user groups error response:', error.response.data);
      } else {
        console.error('👥 API Error - getUserGroups:', error);
      }
      throw error;
    }
  },
};

export const weatherApiService = {
  getWeather: async (params: WeatherApiParams): Promise<WeatherApiResponse> => {
    try {
      console.log('Sending weather request to backend:', params);
      const response = await apiClient.get<WeatherApiResponse>('/api/weather', { params });
      console.log('Received weather response from backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('API Error - getWeather:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Backend weather error response:', error.response.data);
      }
      throw error;
    }
  },
};

// Auth API functions
export const authApiService = {
  register: async (username: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/register', {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  login: async (username: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/login', {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
};

// --- Free Place Search: OpenStreetMap Nominatim ---
export async function searchPlacesOpenStreetMap(query: string) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'WanderNavApp/1.0 (your@email.com)' }
  });
  if (!response.ok) throw new Error('Failed to fetch places');
  return await response.json();
}

// --- Google Directions API Implementation ---
export async function getRouteGoogleDirections(start: { lat: number, lng: number }, end: { lat: number, lng: number }) {
  console.log('🔍 Google Directions API called with:', { start, end });
  
  const url = `${GOOGLE_DIRECTIONS_BASE_URL}?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&key=${GOOGLE_DIRECTIONS_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const result = await response.json();
    
    console.log('🔍 Google Directions API result:', result);
    
    if (result.status !== 'OK') {
      throw new Error(`Google Directions API error: ${result.status} - ${result.error_message || 'Unknown error'}`);
    }
    
    if (!result.routes || result.routes.length === 0) {
      throw new Error('No routes found');
    }
    
    const route = result.routes[0];
    const leg = route.legs[0];
    
    // Decode the polyline to get coordinates
    const coordinates = decodePolyline(route.overview_polyline.points);
    
    // Convert coordinates to the format expected by the app
    const routeCoordinates = coordinates.map(coord => [coord.lng, coord.lat]);
    
    // Convert Google steps to our format
    const steps = leg.steps.map((step: any) => ({
      instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
      distance: step.distance.value,
      duration: step.duration.value,
    }));
    
    // Convert Google response to our expected format with properties.segments
    return {
      features: [{
        geometry: {
          coordinates: routeCoordinates
        },
        properties: {
          segments: [{
            distance: leg.distance.value,
            duration: leg.duration.value,
            steps: steps
          }]
        }
      }]
    };
  } catch (error) {
    console.error('🔍 Google Directions API failed:', error);
    throw new Error('Failed to get directions. Please try again.');
  }
}

// Keep the old function for backward compatibility but mark it as deprecated
export async function getRouteOpenRouteService(start: { lat: number, lng: number }, end: { lat: number, lng: number }) {
  console.warn('🔍 Using deprecated OpenRouteService. Consider using getRouteGoogleDirections for better accuracy.');
  return getRouteGoogleDirections(start, end);
}

// Destination API Service
export const destinationApiService = {
  // Get all destinations for the current user
  getDestinations: async (): Promise<SavedDestination[]> => {
    try {
      const response = await apiClient.get('/api/destinations');
      return response.data;
    } catch (error) {
      console.error('Destination API error:', error);
      // Return mock data for demo purposes
      return [
        {
          id: '1',
          name: 'Home',
          address: '123 Main Street, Kumasi',
          latitude: 6.6885,
          longitude: -1.6244,
          category: 'Home',
          lastVisited: '2024-01-15',
          isFavorite: true,
        },
        {
          id: '2',
          name: 'Work',
          address: '456 Business District, Kumasi',
          latitude: 6.6890,
          longitude: -1.6250,
          category: 'Work',
          lastVisited: '2024-01-14',
          isFavorite: true,
        },
        {
          id: '3',
          name: 'Santasi Market',
          address: 'Santasi, Kumasi, Ghana',
          latitude: 6.6875,
          longitude: -1.6235,
          category: 'Shopping',
          lastVisited: '2024-01-10',
          isFavorite: false,
        },
        {
          id: '4',
          name: 'University Campus',
          address: 'KNUST Campus, Kumasi',
          latitude: 6.6900,
          longitude: -1.6200,
          category: 'Education',
          lastVisited: '2024-01-12',
          isFavorite: false,
        },
      ];
    }
  },

  // Create a new destination
  createDestination: async (destination: CreateDestinationRequest): Promise<SavedDestination> => {
    try {
      const response = await apiClient.post('/api/destinations', destination);
      return response.data;
    } catch (error) {
      console.error('Create destination API error:', error);
      // Return mock created destination
      return {
        id: Date.now().toString(),
        name: destination.name,
        address: destination.address,
        latitude: destination.latitude,
        longitude: destination.longitude,
        category: destination.category,
        isFavorite: false,
        createdAt: new Date().toISOString(),
      };
    }
  },

  // Update a destination
  updateDestination: async (id: string, updates: UpdateDestinationRequest): Promise<SavedDestination> => {
    try {
      const response = await apiClient.put(`/api/destinations/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Update destination API error:', error);
      // Return mock updated destination
      return {
        id,
        name: updates.name || 'Updated Destination',
        address: updates.address || 'Updated Address',
        latitude: updates.latitude || 6.6885,
        longitude: updates.longitude || -1.6244,
        category: updates.category || 'Other',
        isFavorite: updates.isFavorite || false,
        updatedAt: new Date().toISOString(),
      };
    }
  },

  // Delete a destination
  deleteDestination: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/destinations/${id}`);
    } catch (error) {
      console.error('Delete destination API error:', error);
      // Mock successful deletion
      console.log(`Mock deleted destination with id: ${id}`);
    }
  },

  // Toggle favorite status
  toggleFavorite: async (id: string): Promise<SavedDestination> => {
    try {
      const response = await apiClient.patch(`/api/destinations/${id}/favorite`);
      return response.data;
    } catch (error) {
      console.error('Toggle favorite API error:', error);
      // Return mock updated destination
      return {
        id,
        name: 'Updated Destination',
        address: 'Updated Address',
        latitude: 6.6885,
        longitude: -1.6244,
        category: 'Other',
        isFavorite: true,
        updatedAt: new Date().toISOString(),
      };
    }
  },

  // Get destinations by category
  getDestinationsByCategory: async (category: string): Promise<SavedDestination[]> => {
    try {
      const response = await apiClient.get(`/api/destinations/category/${category}`);
      return response.data;
    } catch (error) {
      console.error('Get destinations by category API error:', error);
      // Return mock filtered destinations
      return [
        {
          id: '1',
          name: 'Sample Destination',
          address: 'Sample Address',
          latitude: 6.6885,
          longitude: -1.6244,
          category,
          isFavorite: false,
        },
      ];
    }
  },

  // Get favorite destinations
  getFavoriteDestinations: async (): Promise<SavedDestination[]> => {
    try {
      const response = await apiClient.get('/api/destinations/favorites');
      return response.data;
    } catch (error) {
      console.error('Get favorite destinations API error:', error);
      // Return mock favorite destinations
      return [
        {
          id: '1',
          name: 'Home',
          address: '123 Main Street, Kumasi',
          latitude: 6.6885,
          longitude: -1.6244,
          category: 'Home',
          isFavorite: true,
        },
        {
          id: '2',
          name: 'Work',
          address: '456 Business District, Kumasi',
          latitude: 6.6890,
          longitude: -1.6250,
          category: 'Work',
          isFavorite: true,
        },
      ];
    }
  },
};

// Decode Google polyline
function decodePolyline(encoded: string): { lat: number, lng: number }[] {
  const points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;
  
  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}