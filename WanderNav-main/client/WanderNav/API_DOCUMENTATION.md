# WanderNav Frontend API Documentation

## 🔗 API Overview

The WanderNav frontend communicates with a Spring Boot backend through RESTful APIs. All API calls are handled through a centralized API client with automatic authentication and error handling.

## 📡 API Client Configuration

### Base Configuration
```typescript
export const API_BASE_URL = 'http://10.33.249.250:8080';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});
```

### Authentication Interceptors
```typescript
// Request interceptor - automatically adds auth token
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handles auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      await AsyncStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);
```

## 🔐 Authentication APIs

### Login
**Endpoint**: `POST /api/auth/login`
**Description**: Authenticate user and receive JWT token

**Request**:
```typescript
interface LoginRequest {
  username: string;
  password: string;
}
```

**Response**:
```typescript
interface AuthResponse {
  token: string;
  message?: string;
}
```

**Usage**:
```typescript
const response = await authService.login({
  username: 'user@example.com',
  password: 'password123'
});
```

### Register
**Endpoint**: `POST /api/auth/register`
**Description**: Create new user account

**Request**:
```typescript
interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
}
```

**Response**:
```typescript
interface AuthResponse {
  token: string;
  message?: string;
}
```

### Get Current User
**Endpoint**: `GET /api/auth/me`
**Description**: Get authenticated user information
**Authentication**: Required

**Response**:
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  // password is excluded from response
}
```

## 🔍 Search APIs

### General Search
**Endpoint**: `POST /api/search`
**Description**: Search for places, users, or hazards
**Authentication**: Optional

**Request**:
```typescript
interface SearchApiRequest {
  query: string;
  type: 'places' | 'users' | 'hazards';
  latitude?: number;
  longitude?: number;
}
```

**Response**:
```typescript
interface SearchApiResponseItem {
  id: string;
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  username?: string;
  hazardType?: string;
}
```

**Usage**:
```typescript
const results = await searchApiService.performSearch({
  query: 'coffee shop',
  type: 'places',
  latitude: 40.7128,
  longitude: -74.0060
});
```

## 👥 User APIs

### Search Users
**Endpoint**: `GET /api/users/search?query={query}`
**Description**: Search users by username or email
**Authentication**: Required

**Request Parameters**:
- `query`: Search string (case-insensitive, partial match)

**Response**:
```typescript
interface UserSearchResponse {
  id: string;
  username: string;
  email: string;
}
```

**Usage**:
```typescript
const users = await userApiService.searchUsers('john');
```

### Get All Users
**Endpoint**: `GET /api/users`
**Description**: Get all users in the system
**Authentication**: Required

**Response**:
```typescript
interface UserSearchResponse[]
```

**Usage**:
```typescript
const allUsers = await userApiService.getAllUsers();
```

### Get User by ID
**Endpoint**: `GET /api/users/{id}`
**Description**: Get specific user by ID
**Authentication**: Required

**Response**:
```typescript
interface User {
  id: string;
  username: string;
  email: string;
}
```

### Update User
**Endpoint**: `PUT /api/users/{id}`
**Description**: Update user information
**Authentication**: Required

**Request**:
```typescript
interface User {
  username: string;
  email: string;
}
```

### Delete User
**Endpoint**: `DELETE /api/users/{id}`
**Description**: Delete user account
**Authentication**: Required

## 👥 Group APIs

### Create Group
**Endpoint**: `POST /api/groups`
**Description**: Create a new group
**Authentication**: Required

**Request**:
```typescript
interface GroupCreationRequest {
  name: string;
  memberIds: string[];
}
```

**Response**:
```typescript
interface GroupCreationResponse {
  id: string;
  name: string;
  memberIds: string[];
  createdAt: string;
}
```

**Usage**:
```typescript
const group = await groupApiService.createGroup({
  name: 'Travel Group',
  memberIds: ['user1', 'user2', 'user3']
});
```

### Get User Groups
**Endpoint**: `GET /api/groups?userId={userId}`
**Description**: Get groups for a specific user
**Authentication**: Required

**Request Parameters**:
- `userId`: User ID to get groups for

**Response**:
```typescript
interface GroupCreationResponse[]
```

**Usage**:
```typescript
const userGroups = await groupApiService.getUserGroups('user123');
```

## 🌤️ Weather APIs

### Get Weather
**Endpoint**: `GET /api/weather`
**Description**: Get weather information for a location
**Authentication**: Optional

**Request Parameters**:
- `latitude`: Location latitude
- `longitude`: Location longitude

**Response**:
```typescript
interface WeatherApiResponse {
  temp: number;
  description: string;
  icon: string;
  locationName?: string;
  humidity?: number;
  windSpeed?: number;
}
```

**Usage**:
```typescript
const weather = await apiClient.get('/api/weather', {
  params: {
    latitude: 40.7128,
    longitude: -74.0060
  }
});
```

## 📍 Location APIs

### Get All Locations
**Endpoint**: `GET /api/locations`
**Description**: Get all locations in the system
**Authentication**: Optional

**Response**:
```typescript
interface Location[]
```

### Get Location by ID
**Endpoint**: `GET /api/locations/{id}`
**Description**: Get specific location by ID
**Authentication**: Optional

### Create Location
**Endpoint**: `POST /api/locations`
**Description**: Create a new location
**Authentication**: Required

### Update Location
**Endpoint**: `PUT /api/locations/{id}`
**Description**: Update location information
**Authentication**: Required

### Delete Location
**Endpoint**: `DELETE /api/locations/{id}`
**Description**: Delete a location
**Authentication**: Required

## ⚠️ Hazard APIs

### Create Hazard Report
**Endpoint**: `POST /api/hazards`
**Description**: Report a new hazard
**Authentication**: Required

**Request**:
```typescript
interface HazardReport {
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  photoUrl?: string;
}
```

## 💬 Message APIs

### Send Message
**Endpoint**: `POST /api/messages`
**Description**: Send a message
**Authentication**: Required

### Get Messages
**Endpoint**: `GET /api/messages`
**Description**: Get messages for a user
**Authentication**: Required

## 🛣️ Route APIs

### Get All Routes
**Endpoint**: `GET /api/routes`
**Description**: Get all routes
**Authentication**: Required

### Get Route by ID
**Endpoint**: `GET /api/routes/{id}`
**Description**: Get specific route by ID
**Authentication**: Required

### Create Route
**Endpoint**: `POST /api/routes`
**Description**: Create a new route
**Authentication**: Required

### Update Route
**Endpoint**: `PUT /api/routes/{id}`
**Description**: Update route information
**Authentication**: Required

### Delete Route
**Endpoint**: `DELETE /api/routes/{id}`
**Description**: Delete a route
**Authentication**: Required

### Get User Routes
**Endpoint**: `GET /api/routes/user/me`
**Description**: Get routes for current user
**Authentication**: Required

## 🔧 API Services

### Authentication Service
```typescript
export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse>
  register: async (userData: RegisterRequest): Promise<AuthResponse>
  getToken: async (): Promise<string | null>
  logout: async (): Promise<void>
  isAuthenticated: async (): Promise<boolean>
  createTestUser: async (): Promise<void>
  autoLoginTestUser: async (): Promise<void>
  testAuthFlow: async (): Promise<{ [key: string]: boolean }>
}
```

### Search Service
```typescript
export const searchApiService = {
  performSearch: async (params: SearchApiRequest): Promise<SearchApiResponseItem[]>
}
```

### User Service
```typescript
export const userApiService = {
  searchUsers: async (query: string): Promise<UserSearchResponse[]>
  getAllUsers: async (): Promise<UserSearchResponse[]>
}
```

### Group Service
```typescript
export const groupApiService = {
  createGroup: async (groupData: GroupCreationRequest): Promise<GroupCreationResponse>
  getUserGroups: async (userId: string): Promise<GroupCreationResponse[]>
}
```

## 🧪 API Testing

### Connection Testing
```typescript
// Test backend connection
export const testBackendConnection = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/api/auth/me');
    return true;
  } catch (error) {
    return false;
  }
};
```

### Comprehensive API Testing
```typescript
// Test all API endpoints
export const testAllApiEndpoints = async (): Promise<{ [key: string]: boolean }> => {
  const results: { [key: string]: boolean } = {};
  
  // Test auth endpoints
  try {
    const authResponse = await apiClient.get('/api/auth/me');
    results['auth_me'] = authResponse.status === 200;
  } catch (error) {
    results['auth_me'] = false;
  }

  // Test search endpoints
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
  try {
    const usersResponse = await apiClient.get('/api/users');
    results['users'] = usersResponse.status === 200;
  } catch (error) {
    results['users'] = false;
  }

  // Test group endpoints
  try {
    const groupsResponse = await apiClient.get('/api/groups?userId=test');
    results['groups'] = groupsResponse.status === 200;
  } catch (error) {
    results['groups'] = false;
  }

  // Test weather endpoints
  try {
    const weatherResponse = await apiClient.get('/api/weather?latitude=40.7128&longitude=-74.0060');
    results['weather'] = weatherResponse.status === 200;
  } catch (error) {
    results['weather'] = false;
  }

  return results;
};
```

## 🚨 Error Handling

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error

### Error Response Format
```typescript
interface ErrorResponse {
  message: string;
  status: number;
  timestamp: string;
}
```

### Error Handling in Components
```typescript
try {
  const response = await apiClient.get('/api/users');
  // Handle success
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      // Handle unauthorized
    } else if (error.response?.status === 403) {
      // Handle forbidden
    } else {
      // Handle other errors
    }
  }
}
```

## 🔒 Security

### Authentication
- All protected endpoints require JWT token
- Token automatically included in requests
- Token removed on 401/403 responses
- Secure token storage in AsyncStorage

### CORS Configuration
- Backend configured to allow all origins
- All HTTP methods allowed
- All headers allowed
- Credentials enabled

### Input Validation
- Client-side validation for all forms
- Server-side validation on all endpoints
- Sanitized inputs to prevent injection

## 📊 Performance

### Optimization Strategies
- **Debounced Search**: Prevents excessive API calls
- **Request Caching**: Cached responses where appropriate
- **Connection Pooling**: Reused HTTP connections
- **Timeout Configuration**: 10-second request timeout
- **Error Retry**: Automatic retry for failed requests

### Monitoring
- Console logging for all API calls
- Performance metrics collection
- Error tracking and reporting
- Connection status monitoring

## 🔧 Development

### Environment Variables
```typescript
// API Configuration
export const API_BASE_URL = process.env.API_BASE_URL || 'http://10.33.249.250:8080';

// Google Maps API Key
const GOOGLE_DIRECTIONS_API_KEY = process.env.GOOGLE_DIRECTIONS_API_KEY || 'YOUR_API_KEY';
```

### Local Development
```bash
# Start development server
npm start

# Test API connection
npm run test:api

# Build for production
npm run build
```

---

**WanderNav API Documentation** - Comprehensive guide to all frontend API integrations and services. 