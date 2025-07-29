# WanderNav Frontend Documentation

## 📱 Overview

WanderNav is a React Native navigation app built with Expo that provides real-time navigation, hazard reporting, group messaging, and location-based services. The frontend is built with TypeScript and follows modern React Native best practices.

## 🏗️ Architecture

### Tech Stack
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **State Management**: React Context + Hooks
- **Styling**: StyleSheet + LinearGradient
- **HTTP Client**: Axios with interceptors
- **Storage**: AsyncStorage
- **Maps**: react-native-maps
- **Icons**: @expo/vector-icons

### Project Structure
```
WanderNav/
├── app/                    # Screen components
│   ├── (tabs)/           # Tab navigation screens
│   ├── _layout.tsx       # Root layout
│   ├── home.tsx          # Main map screen
│   ├── searchScreen.tsx  # Search functionality
│   ├── menuScreen.tsx    # Menu/settings
│   ├── profileScreen.tsx # User profile
│   ├── dashcam.tsx       # Dashcam recording
│   ├── hazardReportScreen.tsx # Hazard reporting
│   ├── savedDestinationsScreen.tsx # Saved places
│   ├── mapScreen.tsx     # Route navigation
│   ├── SignIn.tsx        # Authentication
│   ├── SignUp.tsx        # Registration
│   └── index.tsx         # Splash screen
├── src/
│   └── services/         # API services
│       ├── api.ts        # Main API client
│       └── auth.ts       # Authentication service
├── contexts/             # React Context providers
│   ├── ThemeContext.tsx  # Theme management
│   └── SavedDestinationsContext.tsx # Saved destinations
├── constants/
│   ├── theme.ts          # Theme constants
│   └── themes.ts         # Theme definitions
├── components/           # Reusable components
└── assets/              # Images, fonts, etc.
```

## 🎨 Theme System

### Theme Architecture
The app implements a comprehensive theming system with light and dark mode support:

```typescript
// Theme interface
interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
}

// Usage in components
const { theme } = useTheme();
<View style={[styles.container, { backgroundColor: theme.colors.BACKGROUND_PRIMARY }]}>
```

### Theme Properties
- **Colors**: Primary, secondary, accent, error, background colors
- **Spacing**: Consistent spacing values
- **Typography**: Font sizes and weights
- **Border Radius**: Rounded corners
- **Shadows**: Elevation and depth

### Theme Modes
- **Light Mode**: Default light theme
- **Dark Mode**: Dark theme for low-light environments
- **Auto Mode**: Follows system preference

## 🔐 Authentication System

### Authentication Flow
1. **Registration**: User creates account
2. **Login**: User authenticates with credentials
3. **Token Management**: JWT tokens stored in AsyncStorage
4. **Auto-login**: Automatic authentication on app start
5. **Logout**: Token removal and navigation to login

### Authentication Service
```typescript
// Key methods
authService.login(credentials)
authService.register(userData)
authService.getToken()
authService.logout()
authService.isAuthenticated()
```

## 🗺️ Map & Navigation

### Map Features
- **Google Maps Integration**: Real-time map display
- **Location Services**: GPS tracking and geolocation
- **Route Planning**: Google Directions API integration
- **Real-time Updates**: Live location tracking
- **Zoom Controls**: Map zoom in/out functionality

### Navigation Features
- **Route Display**: Visual route on map
- **Turn-by-turn**: Step-by-step navigation
- **ETA Calculation**: Real-time arrival estimates
- **Alternative Routes**: Multiple route options
- **Traffic Integration**: Live traffic data

## 🔍 Search System

### Search Types
- **Places Search**: Find locations and points of interest
- **User Search**: Find other users for group creation
- **Hazard Search**: Find reported road hazards

### Search Features
- **Live Search**: Real-time search as you type
- **Debounced Input**: Optimized search performance
- **Fallback Data**: Graceful degradation when API fails
- **Filter Options**: Advanced search filtering

## 👥 Social Features

### Group Messaging
- **Group Creation**: Create travel groups
- **User Search**: Find users to add to groups
- **Real-time Chat**: Live messaging functionality
- **Group Management**: Add/remove group members

### User Profiles
- **Profile Management**: Edit user information
- **Avatar Upload**: Profile picture management
- **Activity Tracking**: User statistics and history

## ⚠️ Hazard Reporting

### Hazard Types
- **Road Construction**: Construction zone alerts
- **Traffic Accidents**: Accident reports
- **Weather Hazards**: Weather-related issues
- **Road Conditions**: Poor road conditions

### Reporting Features
- **Photo Upload**: Hazard photo capture
- **Location Tracking**: Automatic location detection
- **Category Selection**: Hazard type classification
- **Description**: Detailed hazard descriptions

## 📱 Screen Documentation

### Home Screen (`home.tsx`)
**Purpose**: Main navigation hub with map and controls

**Key Features**:
- Interactive map with user location
- Search bar for destinations
- Voice search functionality
- Hazard reporting button
- Zoom controls
- Bottom navigation

**State Management**:
```typescript
const [mapRegion, setMapRegion] = useState<Region>();
const [isFetchingInitialLocation, setIsFetchingInitialLocation] = useState(true);
const [searchText, setSearchText] = useState('');
const [activeBottomTab, setActiveBottomTab] = useState('home');
```

### Search Screen (`searchScreen.tsx`)
**Purpose**: Comprehensive search functionality

**Key Features**:
- Multi-tab search (places, users, hazards)
- Live search with debouncing
- User search with group creation
- Filter options
- Search result display

**API Integration**:
```typescript
// User search
const users = await userApiService.searchUsers(query);

// Group creation
const group = await groupApiService.createGroup(groupData);

// General search
const results = await searchApiService.performSearch(params);
```

### Menu Screen (`menuScreen.tsx`)
**Purpose**: App navigation and settings

**Key Features**:
- User profile display
- Navigation to different screens
- App settings access
- Logout functionality

### Profile Screen (`profileScreen.tsx`)
**Purpose**: User profile management

**Key Features**:
- Profile information editing
- Avatar upload
- Statistics display
- Settings access

### Dashcam Screen (`dashcam.tsx`)
**Purpose**: Video recording during navigation

**Key Features**:
- Camera integration
- Video recording
- Location tracking
- Trip data collection

### Hazard Report Screen (`hazardReportScreen.tsx`)
**Purpose**: Report road hazards

**Key Features**:
- Hazard category selection
- Photo capture
- Location detection
- Description input
- Report submission

## 🔧 API Integration

### API Client Configuration
```typescript
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});
```

### Authentication Interceptors
```typescript
// Request interceptor - adds auth token
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

### API Services

#### Authentication Service
```typescript
export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse>
  register: async (userData: RegisterRequest): Promise<AuthResponse>
  getToken: async (): Promise<string | null>
  logout: async (): Promise<void>
  isAuthenticated: async (): Promise<boolean>
}
```

#### Search Service
```typescript
export const searchApiService = {
  performSearch: async (params: SearchApiRequest): Promise<SearchApiResponseItem[]>
}
```

#### User Service
```typescript
export const userApiService = {
  searchUsers: async (query: string): Promise<UserSearchResponse[]>
  getAllUsers: async (): Promise<UserSearchResponse[]>
}
```

#### Group Service
```typescript
export const groupApiService = {
  createGroup: async (groupData: GroupCreationRequest): Promise<GroupCreationResponse>
  getUserGroups: async (userId: string): Promise<GroupCreationResponse[]>
}
```

## 🎯 State Management

### Context Providers

#### Theme Context
```typescript
const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [customTheme, setCustomTheme] = useState<Theme | null>(null);
  
  return (
    <ThemeContext.Provider value={{
      theme,
      themeMode,
      toggleTheme,
      setThemeMode,
      setCustomTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

#### Saved Destinations Context
```typescript
const SavedDestinationsProvider = ({ children }) => {
  const [savedDestinations, setSavedDestinations] = useState<SavedDestination[]>([]);
  
  return (
    <SavedDestinationsContext.Provider value={{
      savedDestinations,
      addDestination,
      removeDestination,
      updateDestination
    }}>
      {children}
    </SavedDestinationsContext.Provider>
  );
};
```

## 🎨 UI Components

### Reusable Components

#### AnimatedPressable
```typescript
const AnimatedPressable = ({ onPress, style, children, scaleTo = 0.97 }) => {
  // Provides animated press feedback
};
```

#### FadeInView
```typescript
const FadeInView = ({ children, duration = 300, delay = 0, style }) => {
  // Provides fade-in animation
};
```

#### LinearGradient
```typescript
// Used throughout the app for modern gradient backgrounds
<LinearGradient
  colors={[theme.colors.PRIMARY_BRAND_COLOR, theme.colors.ACCENT_COLOR]}
  style={styles.gradient}
>
```

## 🔧 Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Environment Configuration
```typescript
// API Configuration
export const API_BASE_URL = 'http://10.33.249.250:8080';

// Google Maps API Key
const GOOGLE_DIRECTIONS_API_KEY = 'YOUR_API_KEY';
```

## 🧪 Testing

### API Testing
The app includes comprehensive API testing:

```typescript
// Test backend connection
const isConnected = await testBackendConnection();

// Test all API endpoints
const apiResults = await testAllApiEndpoints();

// Test authentication flow
const authResults = await testAuthFlow();
```

### Component Testing
Each screen includes proper error handling and fallback data for testing purposes.

## 🚀 Deployment

### Build Configuration
```json
{
  "expo": {
    "name": "WanderNav",
    "slug": "wandernav",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    }
  }
}
```

### Build Commands
```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios

# Build for web
expo build:web
```

## 📊 Performance Optimization

### Key Optimizations
- **Debounced Search**: Prevents excessive API calls
- **Image Optimization**: Optimized image loading
- **Lazy Loading**: Components loaded on demand
- **Memory Management**: Proper cleanup in useEffect
- **Caching**: API response caching where appropriate

### Performance Monitoring
- Console logging for API calls
- Error tracking and reporting
- Performance metrics collection

## 🔒 Security

### Security Features
- **JWT Authentication**: Secure token-based auth
- **Token Storage**: Secure AsyncStorage usage
- **API Security**: HTTPS communication
- **Input Validation**: Client-side validation
- **Error Handling**: Secure error messages

### Best Practices
- No sensitive data in logs
- Proper token management
- Secure API communication
- Input sanitization

## 📝 Code Style

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### ESLint Configuration
```javascript
module.exports = {
  extends: ['@expo/eslint-config'],
  rules: {
    'prefer-const': 'error',
    'no-unused-vars': 'error'
  }
};
```

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Implement changes
3. Add tests
4. Update documentation
5. Submit pull request

### Code Standards
- Use TypeScript for all new code
- Follow existing naming conventions
- Add proper error handling
- Include JSDoc comments
- Test all new features

## 📚 Additional Resources

### Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

### Useful Tools
- [Expo DevTools](https://docs.expo.dev/workflow/debugging/)
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Flipper](https://fbflipper.com/)

---

**WanderNav Frontend** - A modern, feature-rich navigation app built with React Native and Expo.
