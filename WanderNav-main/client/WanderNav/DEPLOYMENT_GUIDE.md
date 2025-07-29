# WanderNav Frontend Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation
```bash
# Navigate to the frontend directory
cd WanderNav-main/client/WanderNav

# Install dependencies
npm install

# Start development server
npm start
```

## 📱 Development Setup

### Environment Configuration

#### 1. API Configuration
Update the API base URL in `src/services/api.ts`:
```typescript
export const API_BASE_URL = 'http://your-backend-url:8080';
```

#### 2. Google Maps API Key
Add your Google Maps API key in `src/services/api.ts`:
```typescript
const GOOGLE_DIRECTIONS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
```

#### 3. Environment Variables
Create a `.env` file in the root directory:
```env
API_BASE_URL=http://your-backend-url:8080
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
EXPO_PUBLIC_API_URL=http://your-backend-url:8080
```

### Development Commands

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web

# Build for production
npm run build

# Eject from Expo
npm run eject
```

## 🏗️ Project Structure

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
├── assets/              # Images, fonts, etc.
├── package.json         # Dependencies
├── app.json            # Expo configuration
├── tsconfig.json       # TypeScript configuration
└── README.md           # Documentation
```

## 🔧 Configuration Files

### app.json (Expo Configuration)
```json
{
  "expo": {
    "name": "WanderNav",
    "slug": "wandernav",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.wandernav.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.wandernav.app",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "RECORD_AUDIO",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-location",
      "expo-camera",
      "expo-media-library"
    ]
  }
}
```

### package.json (Dependencies)
```json
{
  "name": "wandernav",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build": "expo build",
    "test": "jest"
  },
  "dependencies": {
    "expo": "~50.0.0",
    "expo-router": "~3.4.0",
    "expo-location": "~16.5.0",
    "expo-camera": "~14.0.0",
    "expo-media-library": "~15.9.0",
    "expo-application": "~5.8.0",
    "expo-device": "~5.9.0",
    "expo-sharing": "~11.10.0",
    "expo-linking": "~6.2.0",
    "expo-image-picker": "~14.7.0",
    "expo-av": "~13.10.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "react-native-maps": "1.10.0",
    "react-native-gesture-handler": "~2.14.0",
    "react-native-reanimated": "~3.6.0",
    "react-native-safe-area-context": "4.8.2",
    "react-native-screens": "~3.29.0",
    "@react-native-async-storage/async-storage": "1.21.0",
    "axios": "^1.6.0",
    "expo-linear-gradient": "~12.7.0",
    "@expo/vector-icons": "^14.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.45",
    "typescript": "^5.1.3"
  }
}
```

### tsconfig.json (TypeScript Configuration)
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false
  }
}
```

## 🧪 Testing

### API Testing
The app includes comprehensive API testing that runs automatically on startup:

```typescript
// Test backend connection
const isConnected = await testBackendConnection();

// Test all API endpoints
const apiResults = await testAllApiEndpoints();

// Test authentication flow
const authResults = await testAuthFlow();
```

### Manual Testing Checklist

#### Authentication
- [ ] User registration
- [ ] User login
- [ ] Token management
- [ ] Logout functionality
- [ ] Auto-login

#### Navigation
- [ ] Map display
- [ ] Location tracking
- [ ] Route planning
- [ ] Turn-by-turn navigation
- [ ] Search functionality

#### Social Features
- [ ] User search
- [ ] Group creation
- [ ] Group management
- [ ] Messaging

#### Hazard Reporting
- [ ] Hazard creation
- [ ] Photo upload
- [ ] Location detection
- [ ] Category selection

#### Settings
- [ ] Theme switching
- [ ] Profile editing
- [ ] App preferences
- [ ] Account management

## 🚀 Production Deployment

### Android Build

#### 1. Generate Keystore
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

#### 2. Configure app.json
```json
{
  "expo": {
    "android": {
      "package": "com.wandernav.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "RECORD_AUDIO",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

#### 3. Build APK
```bash
# Build for Android
expo build:android

# Or build locally
expo build:android --local
```

### iOS Build

#### 1. Configure app.json
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.wandernav.app",
      "buildNumber": "1.0.0",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera for hazard reporting and dashcam functionality.",
        "NSLocationWhenInUseUsageDescription": "This app uses location for navigation and hazard reporting.",
        "NSMicrophoneUsageDescription": "This app uses the microphone for voice search."
      }
    }
  }
}
```

#### 2. Build IPA
```bash
# Build for iOS
expo build:ios

# Or build locally
expo build:ios --local
```

### Web Build

#### 1. Configure app.json
```json
{
  "expo": {
    "web": {
      "favicon": "./assets/favicon.png",
      "bundler": "metro"
    }
  }
}
```

#### 2. Build for Web
```bash
# Build for web
expo build:web

# Or build locally
expo build:web --local
```

## 🔒 Security Configuration

### API Security
- All API calls use HTTPS
- JWT tokens for authentication
- Token storage in AsyncStorage
- Automatic token refresh
- Secure error handling

### App Permissions
```json
{
  "expo": {
    "android": {
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "RECORD_AUDIO",
        "WRITE_EXTERNAL_STORAGE",
        "INTERNET"
      ]
    },
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "Camera access for hazard reporting",
        "NSLocationWhenInUseUsageDescription": "Location access for navigation",
        "NSMicrophoneUsageDescription": "Microphone access for voice search"
      }
    }
  }
}
```

## 📊 Performance Optimization

### Build Optimizations
```bash
# Enable Hermes engine
expo start --no-dev --minify

# Enable bundle analyzer
expo build:android --local --analyze
```

### Code Splitting
```typescript
// Lazy load components
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Use Suspense for loading states
<Suspense fallback={<LoadingSpinner />}>
  <LazyComponent />
</Suspense>
```

### Image Optimization
- Use WebP format for images
- Implement progressive loading
- Cache images appropriately
- Optimize image sizes

## 🐛 Debugging

### Development Tools
```bash
# Start with debugging
expo start --dev-client

# Enable remote debugging
expo start --dev-client --remote-debugging
```

### Logging
```typescript
// Enable detailed logging
console.log('🔍 Debug info:', data);
console.error('❌ Error:', error);
console.warn('⚠️ Warning:', warning);
```

### Error Tracking
```typescript
// Global error handler
const handleError = (error: Error) => {
  console.error('Global error:', error);
  // Send to error tracking service
};
```

## 📱 Platform-Specific Configuration

### Android Specific
```json
{
  "expo": {
    "android": {
      "package": "com.wandernav.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "RECORD_AUDIO",
        "WRITE_EXTERNAL_STORAGE"
      ],
      "allowBackup": true,
      "allowClearAppData": true
    }
  }
}
```

### iOS Specific
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.wandernav.app",
      "buildNumber": "1.0.0",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "Camera access for hazard reporting",
        "NSLocationWhenInUseUsageDescription": "Location access for navigation",
        "NSMicrophoneUsageDescription": "Microphone access for voice search",
        "UIBackgroundModes": ["location", "audio"]
      }
    }
  }
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm test
```

## 📚 Additional Resources

### Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

### Tools
- [Expo DevTools](https://docs.expo.dev/workflow/debugging/)
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Flipper](https://fbflipper.com/)

### Community
- [Expo Discord](https://chat.expo.dev/)
- [React Native Community](https://github.com/react-native-community)

---

**WanderNav Deployment Guide** - Complete setup and deployment instructions for the WanderNav frontend application. 