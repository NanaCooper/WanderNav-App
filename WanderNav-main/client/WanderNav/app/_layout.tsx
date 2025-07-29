import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SavedDestinationsProvider } from '../contexts/SavedDestinationsContext';
import { ThemeProvider } from '../contexts/ThemeContext';

// --- Mock Auth Hook (Keep this or your actual auth logic) ---
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Set to true for testing
  // In a real app, this would be updated by SignIn/SignUp screens
  // For testing, you might want a way to toggle this, e.g.:
  // useEffect(() => {
  //  setTimeout(() => setIsAuthenticated(true), 5000); // Auto-login after 5s for testing
  // }, []);
  return { isAuthenticated, setIsAuthenticated };
};
// ---

export default function RootLayout() {
  const { isAuthenticated, setIsAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const currentRouteName = segments[segments.length - 1] || (segments[0] === '(tabs)' ? '(tabs)' : segments[0] || 'index');
    const preAuthScreens = ['index', 'WelcomeScreen', 'SignIn', 'SignUp'];
    const isOnPreAuthScreen = preAuthScreens.includes(currentRouteName);

    console.log(`RootLayout Effect: Auth=${isAuthenticated}, CurrentRoute=${currentRouteName}, Segments=${segments.join('/')}, IsOnPreAuthScreen=${isOnPreAuthScreen}`);

    // Temporarily disable all redirects for testing
    // if (isAuthenticated && isOnPreAuthScreen) {
    //   console.log('RootLayout: Authenticated, on pre-auth screen. Redirecting to main app.');
    //   router.replace('/(tabs)/homeScreen');
    // } else if (!isAuthenticated && currentRouteName !== 'index' && !isOnPreAuthScreen && currentRouteName !== '(tabs)') {
    //   // If not authenticated and NOT on a pre-auth screen (and not already on index or trying to access tabs directly)
    //   // This condition might need refinement based on your exact desired flow for unauthenticated users
    //   // For instance, if they try to deep link to a protected route.
    //   // console.log('RootLayout: Not authenticated, not on pre-auth. Redirecting to index.');
    //   // router.replace('/index'); // Or '/WelcomeScreen'
    // } else if (!isAuthenticated && currentRouteName === '(tabs)') {
    //    console.log('RootLayout: Not authenticated, but router is at (tabs). Redirecting to index.');
    //    router.replace('/index');
    // }
  }, [isAuthenticated, segments, router]);

  return (
    <ThemeProvider>
      <SavedDestinationsProvider>
        <Stack
          screenOptions={{
            headerStyle: { 
              backgroundColor: '#FFFFFF', 
              elevation: 0, 
              shadowOpacity: 0, 
              borderBottomWidth: 1, 
              borderBottomColor: '#E5E7EB' 
            },
            headerTintColor: '#2563EB',
            headerTitleStyle: { 
              fontWeight: '600', 
              fontSize: 18, 
              color: '#1F2937' 
            },
            headerBackTitleVisible: false,
            contentStyle: {
              backgroundColor: '#FFFFFF',
            },
          }}
        >
          {isAuthenticated ? (
            // Authenticated Stack
            <>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="mapScreen" options={{ title: 'Route' }} />
              <Stack.Screen name="savedDestinationsScreen" options={{ title: 'Saved Destinations' }} />
              <Stack.Screen name="searchScreen" options={{ title: 'Search' }} />
              <Stack.Screen name="profileScreen" options={{ title: 'Profile' }} />
              <Stack.Screen name="settingsScreen" options={{ title: 'Settings' }} />
              <Stack.Screen name="menuScreen" options={{ title: 'Menu' }} />
              <Stack.Screen name="dashcam" options={{ title: 'Dashcam' }} />
              <Stack.Screen name="directChatScreen" options={{ title: 'Direct Chat' }} />
              <Stack.Screen name="groupChatScreen" options={{ title: 'Group Chat' }} />
              <Stack.Screen name="groupMessagingScreen" options={{ title: 'Group Messaging' }} />
              <Stack.Screen name="hazardReportScreen" options={{ title: 'Hazard Report' }} />
            </>
          ) : (
            // Unauthenticated Stack
            <>
              <Stack.Screen
                name="index" // Your InitialSplashScreen (app/index.tsx)
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="WelcomeScreen" // app/WelcomeScreen.tsx
                options={{ title: "Get Started" }}
              />
              <Stack.Screen
                name="SignIn" // app/SignIn.tsx
                options={{ title: 'Sign In' }}
              />
              <Stack.Screen
                name="SignUp" // app/SignUp.tsx
                options={{ title: 'Create Account' }}
              />
            </>
          )}
        </Stack>
      </SavedDestinationsProvider>
    </ThemeProvider>
  );
}