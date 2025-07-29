# WanderNav Frontend Component Documentation

## 🧩 Component Overview

This document provides detailed documentation for all components in the WanderNav frontend application. Each component is designed with reusability, performance, and maintainability in mind.

## 📱 Screen Components

### Home Screen (`app/home.tsx`)

**Purpose**: Main navigation hub with interactive map and controls

**Key Features**:
- Interactive Google Maps integration
- Real-time location tracking
- Search functionality
- Hazard reporting
- Voice search capabilities
- Bottom navigation

**Props**: None (Main screen component)

**State Management**:
```typescript
const [mapRegion, setMapRegion] = useState<Region>();
const [isFetchingInitialLocation, setIsFetchingInitialLocation] = useState(true);
const [searchText, setSearchText] = useState('');
const [activeBottomTab, setActiveBottomTab] = useState('home');
const [hazards, setHazards] = useState<Hazard[]>([]);
const [isLoading, setIsLoading] = useState(false);
```

**Key Methods**:
```typescript
// Location handling
const fetchCurrentLocation = async (): Promise<void>
const handleMapRegionChange = (region: Region): void

// Search functionality
const handleSearch = (text: string): void
const handleVoiceSearch = async (): Promise<void>

// Navigation
const handleBottomNavPress = (screenName: string): void
const handleHazardReport = (): void
```

**UI Elements**:
- Map component with user location
- Search bar with voice input
- Hazard cards display
- Floating action buttons
- Bottom navigation tabs

### Search Screen (`app/searchScreen.tsx`)

**Purpose**: Comprehensive search functionality with multiple tabs

**Key Features**:
- Multi-tab search (places, users, hazards)
- Live search with debouncing
- User search with group creation
- Filter options
- Search result display

**State Management**:
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [activeTab, setActiveTab] = useState<SearchTabId>('places');
const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [showNoResults, setShowNoResults] = useState(false);
const [selectedUsers, setSelectedUsers] = useState<UserResult[]>([]);
const [showGroupModal, setShowGroupModal] = useState(false);
const [groupName, setGroupName] = useState('');
```

**Key Methods**:
```typescript
// Search functionality
const performSearch = async (query: string): Promise<void>
const handleUserSearch = async (query: string): Promise<void>
const handleTabChange = (tabId: SearchTabId): void

// Group management
const handleCreateGroup = async (): Promise<void>
const handleAddUserToGroup = (user: UserResult): void
const handleRemoveUserFromGroup = (userId: string): void
```

**UI Elements**:
- Search input with clear button
- Tab navigation
- Search results list
- User selection interface
- Group creation modal
- Filter options

### Menu Screen (`app/menuScreen.tsx`)

**Purpose**: App navigation and settings hub

**Key Features**:
- User profile display
- Navigation to different screens
- App settings access
- Logout functionality
- App information

**State Management**:
```typescript
const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
const [appVersion, setAppVersion] = useState<string>('');
const [deviceInfo, setDeviceInfo] = useState<string>('');
```

**Key Methods**:
```typescript
// Navigation
const handleMenuPress = (screenName: string): void
const handleLogout = (): void
const handleShareApp = (): void
const handleRateApp = (): void
```

**UI Elements**:
- User profile card
- Menu items with icons
- App information section
- Logout button

### Profile Screen (`app/profileScreen.tsx`)

**Purpose**: User profile management and editing

**Key Features**:
- Profile information editing
- Avatar upload
- Statistics display
- Settings access
- Profile sharing

**State Management**:
```typescript
const [profile, setProfile] = useState<UserProfile | null>(null);
const [isEditing, setIsEditing] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
```

**Key Methods**:
```typescript
// Profile management
const handleEditProfile = (): void
const handleSaveProfile = async (): Promise<void>
const handleAvatarUpload = async (): Promise<void>
const handleShareProfile = (): void
```

**UI Elements**:
- Profile header with avatar
- Editable profile fields
- Statistics cards
- Action buttons

### Dashcam Screen (`app/dashcam.tsx`)

**Purpose**: Video recording during navigation

**Key Features**:
- Camera integration
- Video recording
- Location tracking
- Trip data collection
- Recording controls

**State Management**:
```typescript
const [isRecording, setIsRecording] = useState(false);
const [cameraRef, setCameraRef] = useState<Camera | null>(null);
const [flashMode, setFlashMode] = useState<FlashMode>(FlashMode.off);
const [hasPermission, setHasPermission] = useState<boolean | null>(null);
```

**Key Methods**:
```typescript
// Camera functionality
const handleStartRecording = async (): Promise<void>
const handleStopRecording = async (): Promise<void>
const handleToggleFlash = (): void
const handleCameraPermission = async (): Promise<void>
```

**UI Elements**:
- Camera view
- Recording controls
- Flash toggle
- Recording indicator

### Hazard Report Screen (`app/hazardReportScreen.tsx`)

**Purpose**: Report road hazards with detailed information

**Key Features**:
- Hazard category selection
- Photo capture
- Location detection
- Description input
- Report submission

**State Management**:
```typescript
const [hazardData, setHazardData] = useState<HazardReport>({
  category: '',
  description: '',
  location: null,
  photos: []
});
const [isLoading, setIsLoading] = useState(false);
const [showSuccessModal, setShowSuccessModal] = useState(false);
```

**Key Methods**:
```typescript
// Hazard reporting
const handleSubmitReport = async (): Promise<void>
const handleAddPhoto = async (): Promise<void>
const handleRemovePhoto = (index: number): void
const handleCategorySelect = (category: string): void
const fetchLocation = async (): Promise<void>
```

**UI Elements**:
- Category selection buttons
- Photo capture interface
- Location display
- Description input
- Submit button

### Saved Destinations Screen (`app/savedDestinationsScreen.tsx`)

**Purpose**: Manage saved destinations and routes

**Key Features**:
- Saved destinations list
- Add new destinations
- Route management
- Destination details
- Search functionality

**State Management**:
```typescript
const [savedDestinations, setSavedDestinations] = useState<SavedDestination[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [showAddModal, setShowAddModal] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
```

**Key Methods**:
```typescript
// Destination management
const handleAddDestination = async (destination: SavedDestination): Promise<void>
const handleRemoveDestination = (id: string): void
const handleSearchDestinations = (query: string): void
const handleGetDirections = (destination: SavedDestination): void
```

**UI Elements**:
- Destinations list
- Add destination modal
- Search bar
- Destination cards

### Map Screen (`app/mapScreen.tsx`)

**Purpose**: Route navigation and display

**Key Features**:
- Route display on map
- Turn-by-turn navigation
- ETA calculation
- Alternative routes
- Traffic integration

**State Management**:
```typescript
const [route, setRoute] = useState<Route | null>(null);
const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
const [isNavigating, setIsNavigating] = useState(false);
const [eta, setEta] = useState<string>('');
```

**Key Methods**:
```typescript
// Navigation
const handleStartNavigation = (): void
const handleStopNavigation = (): void
const handleRouteCalculation = async (): Promise<void>
const handleAlternativeRoute = (): void
```

**UI Elements**:
- Map with route overlay
- Navigation controls
- ETA display
- Route information

### SignIn Screen (`app/SignIn.tsx`)

**Purpose**: User authentication

**Key Features**:
- Login form
- Password visibility toggle
- Remember me functionality
- Forgot password link
- Registration link

**State Management**:
```typescript
const [credentials, setCredentials] = useState({
  username: '',
  password: ''
});
const [showPassword, setShowPassword] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string>('');
```

**Key Methods**:
```typescript
// Authentication
const handleLogin = async (): Promise<void>
const handleInputChange = (field: string, value: string): void
const handleTogglePassword = (): void
const handleForgotPassword = (): void
```

**UI Elements**:
- Login form
- Password input with toggle
- Login button
- Error messages
- Navigation links

### SignUp Screen (`app/SignUp.tsx`)

**Purpose**: User registration

**Key Features**:
- Registration form
- Password confirmation
- Email validation
- Terms acceptance
- Profile creation

**State Management**:
```typescript
const [userData, setUserData] = useState({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
});
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string>('');
```

**Key Methods**:
```typescript
// Registration
const handleRegister = async (): Promise<void>
const handleInputChange = (field: string, value: string): void
const validateForm = (): boolean
const handleTogglePassword = (): void
```

**UI Elements**:
- Registration form
- Password inputs with toggles
- Validation messages
- Register button
- Navigation links

### Settings Screen (`app/settingsScreen.tsx`)

**Purpose**: App settings and preferences

**Key Features**:
- Theme selection
- Notification settings
- Privacy settings
- Account management
- App preferences

**State Management**:
```typescript
const [settings, setSettings] = useState<AppSettings>({
  theme: 'system',
  notifications: true,
  locationServices: true,
  dataUsage: 'standard'
});
const [showThemeModal, setShowThemeModal] = useState(false);
```

**Key Methods**:
```typescript
// Settings management
const handleSettingChange = (key: string, value: any): void
const handleThemeToggle = (): void
const handleLogout = (): void
const handleDeleteAccount = (): void
```

**UI Elements**:
- Settings sections
- Toggle switches
- Theme selection
- Account actions

## 🎨 Reusable Components

### AnimatedPressable

**Purpose**: Provides animated press feedback for buttons

**Props**:
```typescript
interface AnimatedPressableProps {
  onPress?: () => void;
  style?: any;
  children: React.ReactNode;
  pressableStyle?: any;
  scaleTo?: number;
  feedbackType?: 'scale' | 'opacity';
  androidRippleColor?: string;
}
```

**Features**:
- Scale animation on press
- Opacity animation option
- Android ripple effect
- Customizable animation parameters

**Usage**:
```typescript
<AnimatedPressable
  onPress={handlePress}
  style={styles.button}
  scaleTo={0.95}
>
  <Text>Press Me</Text>
</AnimatedPressable>
```

### FadeInView

**Purpose**: Provides fade-in animation for content

**Props**:
```typescript
interface FadeInViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: any;
  translateYValue?: number;
}
```

**Features**:
- Configurable animation duration
- Delay option
- Translation animation
- Smooth fade-in effect

**Usage**:
```typescript
<FadeInView duration={500} delay={200}>
  <Text>Fade in content</Text>
</FadeInView>
```

### LinearGradient

**Purpose**: Modern gradient backgrounds throughout the app

**Usage**:
```typescript
<LinearGradient
  colors={[theme.colors.PRIMARY_BRAND_COLOR, theme.colors.ACCENT_COLOR]}
  style={styles.gradient}
>
  <Text>Gradient content</Text>
</LinearGradient>
```

## 🎯 Context Providers

### ThemeContext

**Purpose**: Manages application theming

**Context Value**:
```typescript
interface ThemeContextType {
  theme: Theme;
  themeMode: 'light' | 'dark' | 'system';
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  setCustomTheme: (theme: Theme) => void;
}
```

**Features**:
- Light/dark mode support
- System theme detection
- Custom theme support
- Persistent theme storage

**Usage**:
```typescript
const { theme, toggleTheme } = useTheme();
```

### SavedDestinationsContext

**Purpose**: Manages saved destinations state

**Context Value**:
```typescript
interface SavedDestinationsContextType {
  savedDestinations: SavedDestination[];
  addDestination: (destination: SavedDestination) => void;
  removeDestination: (id: string) => void;
  updateDestination: (id: string, destination: SavedDestination) => void;
}
```

**Features**:
- CRUD operations for destinations
- Persistent storage
- State synchronization
- Error handling

**Usage**:
```typescript
const { savedDestinations, addDestination } = useSavedDestinations();
```

## 🔧 Utility Components

### LoadingIndicator

**Purpose**: Displays loading states

**Props**:
```typescript
interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
}
```

**Usage**:
```typescript
<LoadingIndicator size="large" text="Loading..." />
```

### ErrorBoundary

**Purpose**: Catches and handles component errors

**Features**:
- Error boundary implementation
- Fallback UI
- Error reporting
- Graceful degradation

**Usage**:
```typescript
<ErrorBoundary fallback={<ErrorScreen />}>
  <Component />
</ErrorBoundary>
```

## 📊 Performance Considerations

### Optimization Strategies

1. **Memoization**: Use React.memo for expensive components
2. **Lazy Loading**: Load components on demand
3. **Image Optimization**: Optimize images for mobile
4. **State Management**: Efficient state updates
5. **Event Handling**: Debounced event handlers

### Best Practices

1. **Component Structure**: Keep components focused and small
2. **Props Interface**: Define clear prop interfaces
3. **Error Handling**: Comprehensive error boundaries
4. **Accessibility**: Include accessibility features
5. **Testing**: Unit tests for critical components

## 🧪 Testing

### Component Testing

Each component includes:
- Error handling
- Loading states
- Fallback data
- Input validation
- User feedback

### Testing Utilities

```typescript
// Test component rendering
const renderComponent = (props: ComponentProps) => {
  return render(<Component {...props} />);
};

// Test user interactions
const fireEvent = async (element: any, event: string) => {
  await act(async () => {
    fireEvent.press(element);
  });
};
```

## 📝 Code Standards

### Component Structure

```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

// 2. Types/Interfaces
interface ComponentProps {
  // Props definition
}

// 3. Component
const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 4. State
  const [state, setState] = useState();

  // 5. Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // 6. Handlers
  const handlePress = () => {
    // Handler logic
  };

  // 7. Render
  return (
    <View>
      <Text>Component content</Text>
    </View>
  );
};

// 8. Export
export default Component;
```

### Naming Conventions

- **Components**: PascalCase (e.g., `HomeScreen`)
- **Files**: camelCase (e.g., `homeScreen.tsx`)
- **Functions**: camelCase (e.g., `handlePress`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Types**: PascalCase (e.g., `UserProfile`)

---

**WanderNav Component Documentation** - Comprehensive guide to all frontend components and their usage. 