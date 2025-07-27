// src/services/apiService.ts
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = 'http://10.194.56.250:8080'; // Updated for Expo Go device access

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

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

// --- Free Routing: OSRM (Open Source Routing Machine) ---
export async function getRouteOpenRouteService(start: { lat: number, lng: number }, end: { lat: number, lng: number }) {
  console.log('🔍 OSRM Directions API called with:', { start, end });
  
  // OSRM is completely free and open source - no API key needed
  const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
  
  try {
    const response = await fetch(url);
    const result = await response.json();
    
    console.log('🔍 OSRM Directions API result:', result);
    
    if (result.code !== 'Ok') {
      throw new Error(`OSRM Directions API error: ${result.code}`);
    }
    
    // OSRM returns GeoJSON format, so we just need to convert to our expected format
    return {
      features: [{
        geometry: {
          coordinates: result.routes[0].geometry.coordinates
        }
      }]
    };
  } catch (error) {
    console.error('🔍 OSRM Directions API failed:', error);
    throw new Error('Failed to get directions. Please try again.');
  }
}

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