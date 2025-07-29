import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text, TouchableOpacity, Alert, ScrollView, Animated, Modal, TextInput, FlatList, Share } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../contexts/ThemeContext';
import { addAlpha } from '../constants/theme';
// import * as Speech from 'expo-speech'; // Temporarily disabled due to compatibility issues

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  let points = [];
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
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

// Calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Find the closest point on the route to user's location
function findClosestPointOnRoute(userLat: number, userLng: number, routeCoords: any[]): { index: number, distance: number } {
  let minDistance = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < routeCoords.length; i++) {
    const distance = calculateDistance(userLat, userLng, routeCoords[i].latitude, routeCoords[i].longitude);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }

  return { index: closestIndex, distance: minDistance };
}

// Calculate remaining distance and ETA
function calculateRemainingRoute(userLat: number, userLng: number, routeCoords: any[], totalDistance: number, totalDuration: number): {
  remainingDistance: number;
  remainingDuration: number;
  progressPercentage: number;
} {
  const { index: currentIndex } = findClosestPointOnRoute(userLat, userLng, routeCoords);
  
  // Calculate remaining distance
  let remainingDistance = 0;
  for (let i = currentIndex; i < routeCoords.length - 1; i++) {
    remainingDistance += calculateDistance(
      routeCoords[i].latitude, routeCoords[i].longitude,
      routeCoords[i + 1].latitude, routeCoords[i + 1].longitude
    );
  }

  // Calculate progress percentage
  const progressPercentage = Math.max(0, Math.min(100, ((totalDistance - remainingDistance) / totalDistance) * 100));

  // Estimate remaining duration based on progress
  const remainingDuration = totalDuration * (remainingDistance / totalDistance);

  return {
    remainingDistance,
    remainingDuration,
    progressPercentage
  };
}

const MapScreen = () => {
  const { theme } = useTheme();
  const mapRef = useRef<MapView>(null);
  const params = useLocalSearchParams();
  console.log('MapScreen params:', params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [activeTransportMode, setActiveTransportMode] = useState('car');
  const [isNavigationActive, setIsNavigationActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showDetailedDirections, setShowDetailedDirections] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  
  // Real-time navigation states
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [remainingDistance, setRemainingDistance] = useState<number>(0);
  const [remainingDuration, setRemainingDuration] = useState<number>(0);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [currentInstruction, setCurrentInstruction] = useState<string>('');
  const [nextTurnDistance, setNextTurnDistance] = useState<number>(0);
  const [locationSubscription, setLocationSubscription] = useState<any>(null);
  const [followUser, setFollowUser] = useState(false);
  const [userHeading, setUserHeading] = useState<number | null>(null);

  // Add stop functionality states
  const [addStopModalVisible, setAddStopModalVisible] = useState(false);
  const [stopSearchQuery, setStopSearchQuery] = useState('');
  const [stopSearchResults, setStopSearchResults] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [waypoints, setWaypoints] = useState([]); // Array of {lat, lng}

  // Parse params
  const startLat = Number(params.startLat);
  const startLng = Number(params.startLng);
  const destLat = Number(params.destLat);
  const destLng = Number(params.destLng);
  const startName = params.startName as string || 'Start';
  const destName = params.destName as string || 'Destination';
  let routeCoords: { latitude: number; longitude: number }[] = [];
  let distance = null, duration = null, steps: any[] = [];
  if (params.routeGeometry) {
    try {
      const geometry = JSON.parse(params.routeGeometry as string);
      if (Array.isArray(geometry)) {
        routeCoords = geometry.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng }));
      }
    } catch {
      try { routeCoords = decodePolyline(params.routeGeometry as string); } catch { routeCoords = []; }
    }
  }
  if (params.routeSummary) {
    try {
      const summary = JSON.parse(params.routeSummary as string);
      distance = summary.distance;
      duration = summary.duration;
    } catch {}
  }
  if (params.routeSteps) {
    try { steps = JSON.parse(params.routeSteps as string); } catch {}
  }
  console.log('Parsed routeSummary:', distance, duration);
  console.log('Parsed routeSteps:', steps);
  console.log('Coords length:', routeCoords.length);

  // Start location tracking when navigation is active
  useEffect(() => {
    if (isNavigationActive) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [isNavigationActive]);

  // Update navigation details when user location changes
  useEffect(() => {
    if (userLocation && isNavigationActive && routeCoords.length > 0 && distance && duration) {
      updateNavigationDetails();
    }
  }, [userLocation, isNavigationActive]);

  // Speak instruction when currentStep changes (temporarily disabled)
  useEffect(() => {
    // if (isNavigationActive && detailedSteps[currentStep]?.instruction) {
    //   Speech.speak(detailedSteps[currentStep].instruction, { rate: 1.0 });
    // }
  }, [currentStep, isNavigationActive]);

  // Repeat instruction handler (temporarily disabled)
  const handleRepeatInstruction = () => {
    // if (detailedSteps[currentStep]?.instruction) {
    //   Speech.speak(detailedSteps[currentStep].instruction, { rate: 1.0 });
    // }
  };

  // Helper to get maneuver icon based on instruction text
  const getManeuverIcon = (instruction) => {
    if (!instruction) return 'arrow-forward';
    const text = instruction.toLowerCase();
    if (text.includes('left')) return 'arrow-back';
    if (text.includes('right')) return 'arrow-forward';
    if (text.includes('straight')) return 'arrow-up';
    if (text.includes('head')) return 'arrow-up';
    if (text.includes('arrive')) return 'flag';
    return 'navigate';
  };

  const startLocationTracking = async () => {
    try {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for navigation.');
        return;
      }

      // Get initial location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setUserHeading(location.coords.heading ?? 0);
      // Zoom in and center map on user location
      if (mapRef.current) {
        mapRef.current.animateCamera({
          center: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          pitch: 0,
          heading: location.coords.heading ?? 0,
          zoom: 17,
          altitude: 0,
        }, { duration: 1000 });
      }
      setFollowUser(true);

      // Start location updates
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          setUserHeading(location.coords.heading ?? 0);
          // If followUser is true, animate map to user location
          if (followUser && mapRef.current) {
            mapRef.current.animateCamera({
              center: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              },
              pitch: 0,
              heading: location.coords.heading ?? 0,
              zoom: 17,
              altitude: 0,
            }, { duration: 500 });
          }
        }
      );

      setLocationSubscription(subscription);
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Location Error', 'Could not start location tracking.');
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
  };

  const updateNavigationDetails = () => {
    if (!userLocation || !routeCoords.length || !distance || !duration) return;

    // Calculate remaining route details
    const routeDetails = calculateRemainingRoute(
      userLocation.latitude,
      userLocation.longitude,
      routeCoords,
      distance,
      duration
    );

    setRemainingDistance(routeDetails.remainingDistance);
    setRemainingDuration(routeDetails.remainingDuration);
    setProgressPercentage(routeDetails.progressPercentage);

    // Update current step based on user's real position along the route steps
    if (detailedSteps.length > 0 && steps && steps.length > 0) {
      let minStepDist = Infinity;
      let closestStepIdx = 0;
      for (let i = 0; i < steps.length; i++) {
        // Each step may have a start location (Google: step.start_location)
        const step = steps[i];
        // Try to get the step's start location from the route geometry
        // Google step.start_location is {lat, lng}
        let stepLat = null, stepLng = null;
        if (step.maneuver && Array.isArray(step.maneuver.location)) {
          stepLng = step.maneuver.location[0];
          stepLat = step.maneuver.location[1];
        } else if (routeCoords[i]) {
          stepLat = routeCoords[i].latitude;
          stepLng = routeCoords[i].longitude;
        }
        if (stepLat !== null && stepLng !== null) {
          const d = calculateDistance(userLocation.latitude, userLocation.longitude, stepLat, stepLng);
          if (d < minStepDist) {
            minStepDist = d;
            closestStepIdx = i;
          }
        }
      }
      setCurrentStep(closestStepIdx);
      setCurrentInstruction(detailedSteps[closestStepIdx]?.instruction || '');
      // Calculate distance to next turn
      const nextStep = detailedSteps[closestStepIdx + 1];
      if (nextStep) {
        setNextTurnDistance(nextStep.distance);
      } else {
        setNextTurnDistance(0);
      }
    } else {
      // fallback to progress percentage if steps are missing
      const totalSteps = detailedSteps.length;
      const currentStepIndex = Math.floor((routeDetails.progressPercentage / 100) * totalSteps);
      setCurrentStep(Math.min(currentStepIndex, totalSteps - 1));
      if (detailedSteps[currentStepIndex]) {
        setCurrentInstruction(detailedSteps[currentStepIndex].instruction);
        const nextStep = detailedSteps[currentStepIndex + 1];
        if (nextStep) {
          setNextTurnDistance(nextStep.distance);
        } else {
          setNextTurnDistance(0);
        }
      }
    }

    // Check if user is off route (more than 100 meters from route)
    const { distance: distanceFromRoute } = findClosestPointOnRoute(
      userLocation.latitude,
      userLocation.longitude,
      routeCoords
    );

    if (distanceFromRoute > 100) {
      // User is off route - could trigger rerouting here
      console.log('User is off route by', distanceFromRoute, 'meters');
    }
  };

  useEffect(() => {
    if (mapRef.current && routeCoords.length > 1) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(routeCoords, {
          edgePadding: { top: 80, right: 80, bottom: 200, left: 80 },
          animated: true,
        });
        setLoading(false);
      }, 500);
    } else {
      setLoading(false);
      if (!params.routeGeometry || routeCoords.length < 2) {
        setError('No route found or invalid route data.');
      }
    }
  }, [routeCoords.length]);

  // Format helpers
  const formatDistance = (m: number) => m >= 1000 ? `${(m/1000).toFixed(1)} km` : `${Math.round(m)} m`;
  const formatDuration = (s: number) => s >= 60 ? `${Math.round(s/60)} min` : `${s} sec`;

  // Button handlers
  const handleStartNavigation = () => {
    setIsNavigationActive(true);
    
    // Start turn-by-turn navigation (like Google Maps)
    if (mapRef.current) {
      // Fit map to show the entire route
      mapRef.current.fitToCoordinates(routeCoords, {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
    
    // Show navigation started feedback
    Alert.alert(
      'Navigation Started', 
      'Turn-by-turn navigation is now active!\n\nVoice guidance will begin shortly.',
      [
        { 
          text: 'OK', 
          onPress: () => {
            console.log('Navigation confirmed');
            // In a real app, this would start voice guidance and turn-by-turn navigation
            // For now, we'll just update the UI to show navigation mode
          }
        }
      ]
    );
  };

  const handleAddStops = () => {
    setAddStopModalVisible(true);
  };

  const handleShareRoute = async () => {
    let message = `Route to ${destName}\n`;
    if (duration && distance) message += `ETA: ${formatDuration(duration)}, Distance: ${formatDistance(distance)}\n`;
    if (detailedSteps && detailedSteps.length > 0) {
      message += '\nDirections:';
      detailedSteps.forEach((step, idx) => {
        message += `\n${idx+1}. ${step.instruction} (${formatDistance(step.distance)}, ${formatDuration(step.duration)})`;
      });
    }
    try {
      await Share.share({ message });
    } catch (e) {
      Alert.alert('Error', 'Could not share route.');
    }
  };

  const handleFilterRoutes = () => {
    Alert.alert(
      'Filter Routes',
      'Choose route preferences:\n• Fastest route\n• Shortest distance\n• Avoid tolls\n• Avoid highways',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Apply', onPress: () => console.log('Route filters applied') }
      ]
    );
  };

  const handleCloseCard = () => {
    Alert.alert(
      'Close Route',
      'Are you sure you want to close this route?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Close', style: 'destructive', onPress: () => console.log('Route closed') }
      ]
    );
  };

  const handleTransportModeChange = (mode: string) => {
    setActiveTransportMode(mode);
    // In a real app, this would recalculate the route for the new transport mode
    console.log('Transport mode changed to:', mode);
  };

  // Generate detailed turn-by-turn directions
  const generateDetailedDirections = () => {
    if (!steps || steps.length === 0) {
      return [
        { instruction: 'Continue straight for 2.5 km', distance: 2500, duration: 180 },
        { instruction: 'Turn right onto Main Street', distance: 800, duration: 120 },
        { instruction: 'Continue straight for 1.2 km', distance: 1200, duration: 90 },
        { instruction: 'Turn left onto Destination Road', distance: 400, duration: 60 },
        { instruction: 'Arrive at destination', distance: 0, duration: 0 }
      ];
    }
    return steps;
  };

  const detailedSteps = generateDetailedDirections();

  // If user pans the map, stop following
  const handleRegionChange = () => {
    if (followUser) setFollowUser(false);
  };

  // Search for stop using OpenStreetMap
  const handleStopSearch = async (query) => {
    setStopSearchQuery(query);
    if (query.length < 2) {
      setStopSearchResults([]);
      return;
    }
    try {
      const results = await searchPlacesOpenStreetMap(query);
      setStopSearchResults(results.map(item => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      })));
    } catch (e) {
      setStopSearchResults([]);
    }
  };

  // Add stop and update route
  const handleSelectStop = async (stop) => {
    setSelectedStop(stop);
    setAddStopModalVisible(false);
    // Add stop as waypoint
    const newWaypoints = [...waypoints, { lat: stop.lat, lng: stop.lng }];
    setWaypoints(newWaypoints);
    // Call Google Directions API with waypoints
    const start = { lat: startLat, lng: startLng };
    const end = { lat: destLat, lng: destLng };
    
    // Build waypoints string for Google Directions API
    const waypointsStr = newWaypoints.map(wp => `${wp.lat},${wp.lng}`).join('|');
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&waypoints=${waypointsStr}&key=AIzaSyAYomIa3M4RB4IWf9j4vOXPGCczFu7ALus`;
    
    try {
      const response = await fetch(url);
      const result = await response.json();
      if (result.status === 'OK') {
        // Update routeCoords, distance, duration, steps, etc.
        // (You may need to refactor state to allow updating these)
        // For now, reload the screen or set new state as needed
        Alert.alert('Stop added! (Demo)', 'Route update logic goes here.');
      } else {
        Alert.alert('Error', 'Could not update route with stop.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not update route with stop.');
    }
  };

  // Generate styles with theme
  const getStyles = () => StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: theme.colors.BACKGROUND_PRIMARY 
    },
    map: { 
      ...StyleSheet.absoluteFillObject 
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: addAlpha(theme.colors.BACKGROUND_PRIMARY, 0.7),
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 20,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: theme.colors.ACCENT_COLOR,
      fontWeight: '500',
    },
    errorOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: addAlpha(theme.colors.BACKGROUND_PRIMARY, 0.9),
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 20,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.ERROR_COLOR,
      fontWeight: '700',
      textAlign: 'center',
    },
    bottomSheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '50%',
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOpacity: 0.25,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: -8 },
      elevation: 12,
      zIndex: 100,
      borderWidth: 0.5,
      borderColor: addAlpha(theme.colors.BORDER_COLOR_LIGHT, 0.06),
    },
    dragHandle: {
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.BORDER_COLOR_LIGHT,
    },
    dragIndicator: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.TEXT_TERTIARY,
      borderRadius: 2,
    },
    scrollContent: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 8,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.TEXT_PRIMARY,
      letterSpacing: -0.5,
    },
    cardControls: {
      flexDirection: 'row',
      gap: 12,
    },
    controlBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    transportTabs: {
      flexDirection: 'row',
      marginBottom: 20,
      gap: 12,
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
      borderRadius: 12,
      padding: 4,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    tabActive: {
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    tabText: {
      fontSize: 13,
      color: theme.colors.TEXT_SECONDARY,
      marginTop: 6,
      fontWeight: '600',
    },
    tabTextActive: {
      color: theme.colors.ACCENT_COLOR,
      fontWeight: '700',
    },
    routeSummary: {
      marginBottom: 24,
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
      borderRadius: 16,
    },
    routeSummaryText: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    routeDetails: {
      fontSize: 15,
      color: theme.colors.TEXT_SECONDARY,
      marginBottom: 12,
      lineHeight: 20,
    },
    fuelSavings: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: addAlpha('#2ECC71', 0.1),
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    fuelSavingsText: {
      fontSize: 13,
      color: '#2ECC71',
      fontWeight: '600',
    },
    actionButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16,
      marginBottom: 8,
      width: '100%',
      paddingHorizontal: 8,
    },
    startBtn: {
      width: '36%',
      backgroundColor: theme.colors.ACCENT_COLOR,
      borderRadius: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
      marginRight: 8,
      minWidth: 80,
    },
    startBtnActive: {
      backgroundColor: '#2ECC71',
      shadowColor: '#2ECC71',
    },
    startBtnText: {
      color: theme.colors.WHITE,
      fontWeight: '700',
      fontSize: 15,
      letterSpacing: 0.5,
    },
    secondaryBtnGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '62%',
      gap: 6,
    },
    secondaryBtn: {
      width: '48%',
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 8,
      minWidth: 80,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.BORDER_COLOR_LIGHT,
      marginLeft: 0,
    },
    secondaryBtnText: {
      color: theme.colors.TEXT_SECONDARY,
      fontWeight: '600',
      fontSize: 13,
    },
    stepsList: { 
      marginTop: 10, 
      backgroundColor: theme.colors.BACKGROUND_SECONDARY, 
      borderRadius: 8, 
      padding: 8 
    },
    stepItem: { 
      flexDirection: 'row', 
      alignItems: 'flex-start', 
      marginBottom: 8 
    },
    stepNum: { 
      fontWeight: 'bold', 
      color: theme.colors.ACCENT_COLOR, 
      marginRight: 8 
    },
    stepInstruction: { 
      fontSize: 15, 
      color: theme.colors.TEXT_PRIMARY 
    },
    stepMeta: { 
      fontSize: 13, 
      color: theme.colors.TEXT_TERTIARY 
    },
    navigationOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
      zIndex: 200,
    },
    navigationTopBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 20,
      backgroundColor: 'rgba(0,0,0,0.95)',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.15)',
      zIndex: 20,
    },
    navigationBackBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    navigationTopTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.5,
    },
    navigationMenuBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    etaCard: {
      position: 'absolute',
      top: 100,
      left: 20,
      right: 20,
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderRadius: 24,
      padding: 24,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 12,
      borderWidth: 1,
      borderColor: addAlpha(theme.colors.BORDER_COLOR_LIGHT, 0.03),
    },
    etaHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    etaTitle: {
      fontSize: 14,
      color: theme.colors.TEXT_SECONDARY,
      fontWeight: '500',
    },
    etaCloseBtn: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
      justifyContent: 'center',
      alignItems: 'center',
    },
    etaTime: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 6,
    },
    etaDistance: {
      fontSize: 16,
      color: theme.colors.TEXT_SECONDARY,
      fontWeight: '500',
    },
    navigationBottomBar: {
      position: 'absolute',
      bottom: 40,
      left: 20,
      right: 20,
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderRadius: 24,
      paddingVertical: 24,
      paddingHorizontal: 28,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 12,
      borderWidth: 1,
      borderColor: addAlpha(theme.colors.BORDER_COLOR_LIGHT, 0.03),
    },
    navigationActionBtn: {
      alignItems: 'center',
      gap: 4,
    },
    navigationActionText: {
      fontSize: 12,
      color: theme.colors.ACCENT_COLOR,
      fontWeight: '500',
    },
    navigationControlsContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'transparent',
    },
    currentInstruction: {
      marginHorizontal: 20,
      marginBottom: 16,
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderRadius: 24,
      padding: 28,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 12,
      borderWidth: 1,
      borderColor: addAlpha(theme.colors.BORDER_COLOR_LIGHT, 0.03),
    },
    instructionCard: {
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderRadius: 24,
      padding: 28,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 12,
      borderWidth: 1,
      borderColor: addAlpha(theme.colors.BORDER_COLOR_LIGHT, 0.03),
    },
    instructionCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    instructionIconWrapper: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: addAlpha(theme.colors.ACCENT_COLOR, 0.1),
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    instructionMainText: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.colors.TEXT_PRIMARY,
      flex: 1,
      lineHeight: 32,
    },
    repeatBtn: {
      padding: 8,
    },
    instructionMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    instructionMeta: {
      fontSize: 14,
      color: theme.colors.TEXT_SECONDARY,
      fontWeight: '500',
    },
    thenRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.BORDER_COLOR_LIGHT,
    },
    thenLabel: {
      fontSize: 14,
      color: theme.colors.TEXT_SECONDARY,
      fontWeight: '500',
      marginRight: 8,
    },
    thenText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.TEXT_PRIMARY,
      flex: 1,
    },
    instructionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    instructionNumber: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.ACCENT_COLOR,
      color: theme.colors.WHITE,
      fontSize: 18,
      fontWeight: '800',
      textAlign: 'center',
      lineHeight: 36,
      marginRight: 14,
    },
    instructionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.TEXT_SECONDARY,
    },
    instructionText: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 18,
      lineHeight: 28,
    },
    instructionDetails: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    instructionDetail: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    detailText: {
      fontSize: 14,
      color: theme.colors.TEXT_SECONDARY,
      fontWeight: '500',
    },
    instructionProgress: {
      alignItems: 'center',
    },
    progressBar: {
      width: '100%',
      height: 4,
      backgroundColor: theme.colors.BORDER_COLOR_LIGHT,
      borderRadius: 2,
      marginBottom: 8,
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.ACCENT_COLOR,
      borderRadius: 2,
    },
    progressText: {
      fontSize: 12,
      color: theme.colors.TEXT_TERTIARY,
      fontWeight: '500',
    },
    detailedDirectionsBtn: {
      marginHorizontal: 20,
      marginBottom: 16,
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderRadius: 20,
      paddingVertical: 16,
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    detailedDirectionsText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.ACCENT_COLOR,
    },
    detailedDirectionsList: {
      marginHorizontal: 20,
      marginBottom: 20,
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderRadius: 20,
      padding: 20,
      maxHeight: 300,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOpacity: 0.25,
      shadowRadius: 15,
      elevation: 10,
    },
    directionsScrollView: {
      maxHeight: 240,
    },
    directionsListTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 16,
      textAlign: 'center',
    },
    directionItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.BORDER_COLOR_LIGHT,
    },
    currentDirectionItem: {
      backgroundColor: addAlpha(theme.colors.ACCENT_COLOR, 0.05),
      borderRadius: 12,
      padding: 12,
      marginHorizontal: -12,
    },
    directionNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: addAlpha(theme.colors.ACCENT_COLOR, 0.1),
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    directionNumberText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.ACCENT_COLOR,
    },
    directionContent: {
      flex: 1,
    },
    directionInstruction: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 4,
      lineHeight: 22,
    },
    directionDetails: {
      flexDirection: 'row',
      gap: 12,
    },
    directionDistance: {
      fontSize: 13,
      color: theme.colors.TEXT_SECONDARY,
      fontWeight: '500',
    },
    directionDuration: {
      fontSize: 13,
      color: theme.colors.TEXT_SECONDARY,
      fontWeight: '500',
    },
    currentIndicator: {
      marginLeft: 8,
    },
    bottomSheetExpanded: {
      height: '80%',
    },
    stickyActionButtons: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      paddingBottom: 16,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.BORDER_COLOR_LIGHT,
      zIndex: 10,
    },
  });

  const styles = getStyles();

  // Custom map style for dark mode
  const getMapStyle = () => {
    if (theme.isDark) {
      return [
        {
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#242f3e"
            }
          ]
        },
        {
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#746855"
            }
          ]
        },
        {
          "elementType": "labels.text.stroke",
          "stylers": [
            {
              "color": "#242f3e"
            }
          ]
        },
        {
          "featureType": "administrative.locality",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#d59563"
            }
          ]
        },
        {
          "featureType": "poi",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#d59563"
            }
          ]
        },
        {
          "featureType": "poi.park",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#263c3f"
            }
          ]
        },
        {
          "featureType": "poi.park",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#6b9a76"
            }
          ]
        },
        {
          "featureType": "road",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#38414e"
            }
          ]
        },
        {
          "featureType": "road",
          "elementType": "geometry.stroke",
          "stylers": [
            {
              "color": "#212a37"
            }
          ]
        },
        {
          "featureType": "road",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#9ca5b3"
            }
          ]
        },
        {
          "featureType": "road.highway",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#746855"
            }
          ]
        },
        {
          "featureType": "road.highway",
          "elementType": "geometry.stroke",
          "stylers": [
            {
              "color": "#1f2835"
            }
          ]
        },
        {
          "featureType": "road.highway",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#f3d19c"
            }
          ]
        },
        {
          "featureType": "transit",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#2f3948"
            }
          ]
        },
        {
          "featureType": "transit.station",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#d59563"
            }
          ]
        },
        {
          "featureType": "water",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#17263c"
            }
          ]
        },
        {
          "featureType": "water",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#515c6d"
            }
          ]
        },
        {
          "featureType": "water",
          "elementType": "labels.text.stroke",
          "stylers": [
            {
              "color": "#17263c"
            }
          ]
        }
      ];
    }
    return []; // Default style for light mode
  };

  // Force map re-render when theme changes
  useEffect(() => {
    if (mapRef.current) {
      // Small delay to ensure the map style is applied
      setTimeout(() => {
        mapRef.current?.setMapStyle?.(getMapStyle());
      }, 100);
    }
  }, [theme.isDark]);

  return (
    <View style={styles.container}>
      {/* Scrollable Bottom Sheet - Half Screen (Hidden during navigation) */}
      {!isNavigationActive && (
        <Animated.View style={[styles.bottomSheet, isSummaryExpanded ? styles.bottomSheetExpanded : null]}> 
          {/* Drag Handle */}
          <TouchableOpacity style={styles.dragHandle} onPress={() => setIsSummaryExpanded(!isSummaryExpanded)}>
            <View style={styles.dragIndicator} />
          </TouchableOpacity>

          {/* Scrollable Content */}
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Card Header with Controls */}
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.colors.TEXT_PRIMARY }]}>
                {activeTransportMode === 'car' ? 'Drive' : 
                 activeTransportMode === 'bicycle' ? 'Bike' :
                 activeTransportMode === 'train' ? 'Transit' : 'Walk'}
              </Text>
              <View style={styles.cardControls}>
                <TouchableOpacity style={styles.controlBtn} onPress={handleFilterRoutes}>
                  <Ionicons name="filter" size={16} color={theme.colors.TEXT_SECONDARY} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlBtn} onPress={handleCloseCard}>
                  <Ionicons name="close" size={16} color={theme.colors.TEXT_SECONDARY} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Transport Mode Tabs */}
            <View style={styles.transportTabs}>
              <TouchableOpacity 
                style={[styles.tabItem, activeTransportMode === 'car' && { backgroundColor: addAlpha(theme.colors.ACCENT_COLOR, 0.1) }]}
                onPress={() => handleTransportModeChange('car')}
              >
                <Ionicons name="car" size={20} color={activeTransportMode === 'car' ? theme.colors.ACCENT_COLOR : theme.colors.TEXT_SECONDARY} />
                <Text style={[styles.tabText, { color: activeTransportMode === 'car' ? theme.colors.ACCENT_COLOR : theme.colors.TEXT_SECONDARY }]}>
                  {duration ? formatDuration(duration) : 'N/A'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabItem, activeTransportMode === 'bicycle' && { backgroundColor: addAlpha(theme.colors.ACCENT_COLOR, 0.1) }]}
                onPress={() => handleTransportModeChange('bicycle')}
              >
                <Ionicons name="bicycle" size={20} color={activeTransportMode === 'bicycle' ? theme.colors.ACCENT_COLOR : theme.colors.TEXT_SECONDARY} />
                <Text style={[styles.tabText, { color: activeTransportMode === 'bicycle' ? theme.colors.ACCENT_COLOR : theme.colors.TEXT_SECONDARY }]}>
                   23 min
                 </Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 style={[styles.tabItem, activeTransportMode === 'train' && { backgroundColor: addAlpha(theme.colors.ACCENT_COLOR, 0.1) }]}
                 onPress={() => handleTransportModeChange('train')}
               >
                 <Ionicons name="train" size={20} color={activeTransportMode === 'train' ? theme.colors.ACCENT_COLOR : theme.colors.TEXT_SECONDARY} />
                 <Text style={[styles.tabText, { color: activeTransportMode === 'train' ? theme.colors.ACCENT_COLOR : theme.colors.TEXT_SECONDARY }]}>
                   --
                 </Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 style={[styles.tabItem, activeTransportMode === 'walk' && { backgroundColor: addAlpha(theme.colors.ACCENT_COLOR, 0.1) }]}
                 onPress={() => handleTransportModeChange('walk')}
               >
                 <Ionicons name="walk" size={20} color={activeTransportMode === 'walk' ? theme.colors.ACCENT_COLOR : theme.colors.TEXT_SECONDARY} />
                 <Text style={[styles.tabText, { color: activeTransportMode === 'walk' ? theme.colors.ACCENT_COLOR : theme.colors.TEXT_SECONDARY }]}>
                   2 hr
                 </Text>
               </TouchableOpacity>
             </View>

            {/* Route Summary */}
            <View style={styles.routeSummary}>
              <Text style={styles.routeSummaryText}>
                {duration ? formatDuration(duration) : 'N/A'} ({distance ? formatDistance(distance) : 'N/A'})
              </Text>
              <Text style={styles.routeDetails}>Best route, despite the usual traffic</Text>
              <View style={styles.fuelSavings}>
                <Ionicons name="leaf" size={16} color="#2ECC71" />
                <Text style={styles.fuelSavingsText}>Saves 9% gas</Text>
              </View>
            </View>

            {/* Directions List (if expanded) */}
            {isSummaryExpanded && (
              <View style={{marginBottom: 24}}>
                <Text style={{fontWeight: '700', fontSize: 16, marginBottom: 8}}>Turn-by-Turn Directions</Text>
                <ScrollView style={{maxHeight: 180}}>
                  {detailedSteps.map((step, index) => (
                    <View key={index} style={[styles.directionItem, currentStep === index && styles.currentDirectionItem]}>
                      <View style={styles.directionNumber}>
                        <Text style={styles.directionNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.directionContent}>
                        <Text style={styles.directionInstruction}>{step.instruction}</Text>
                        <View style={styles.directionDetails}>
                          <Text style={styles.directionDistance}>{formatDistance(step.distance)}</Text>
                          <Text style={styles.directionDuration}>{formatDuration(step.duration)}</Text>
                        </View>
                      </View>
                      {currentStep === index && (
                        <View style={styles.currentIndicator}>
                          <Ionicons name="navigate" size={16} color={theme.colors.ACCENT_COLOR} />
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Extra padding for scroll */}
            <View style={{ height: 80 }} />
          </ScrollView>

          {/* Sticky Action Buttons */}
          <View style={styles.stickyActionButtons}>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.startBtn, isNavigationActive && styles.startBtnActive]} 
                onPress={handleStartNavigation}
              >
                <Ionicons name={isNavigationActive ? "navigate-circle" : "navigate"} size={22} color="#fff" style={{marginRight: 8}} />
                <Text style={styles.startBtnText}>
                  {isNavigationActive ? 'Navigating' : 'Start'}
                </Text>
              </TouchableOpacity>
              <View style={styles.secondaryBtnGroup}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleAddStops}>
                  <Ionicons name="add" size={18} color={theme.colors.ACCENT_COLOR} style={{marginRight: 4}} />
                  <Text style={styles.secondaryBtnText}>Add stop</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleShareRoute}>
                  <Ionicons name="share" size={18} color={theme.colors.ACCENT_COLOR} style={{marginRight: 4}} />
                  <Text style={styles.secondaryBtnText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      )}
      <Stack.Screen options={{ title: 'Navigation', headerShown: !isNavigationActive }} />
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: startLat,
          longitude: startLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05 * (SCREEN_WIDTH / SCREEN_HEIGHT),
        }}
        showsUserLocation
        onPanDrag={handleRegionChange}
        onRegionChangeComplete={handleRegionChange}
        rotationEnabled={true}
        customMapStyle={getMapStyle()}
        key={`map-${theme.isDark ? 'dark' : 'light'}`}
        mapType="standard"
        userInterfaceStyle={theme.isDark ? 'dark' : 'light'}
      >
        <Marker coordinate={{ latitude: startLat, longitude: startLng }} title="Start">
          <Ionicons name="flag-outline" size={28} color={theme.colors.ACCENT_COLOR} />
        </Marker>
        <Marker coordinate={{ latitude: destLat, longitude: destLng }} title="Destination">
          <Ionicons name="flag" size={28} color={theme.colors.ERROR_COLOR} />
        </Marker>
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={theme.colors.MAP_ROUTE_COLOR}
            strokeWidth={theme.colors.MAP_ROUTE_WIDTH}
          />
        )}
      </MapView>


      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.ACCENT_COLOR} />
          <Text style={styles.loadingText}>Loading route...</Text>
        </View>
      )}
      {error && !loading && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Navigation Mode Overlay */}
      {isNavigationActive && (
        <View style={styles.navigationOverlay}>
          {/* Top Navigation Bar */}
          <View style={styles.navigationTopBar}>
            <TouchableOpacity 
              style={styles.navigationBackBtn}
              onPress={() => setIsNavigationActive(false)}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.navigationTopTitle}>Navigation</Text>
            <TouchableOpacity style={styles.navigationMenuBtn}>
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ETA Card */}
          <View style={styles.etaCard}>
            <View style={styles.etaHeader}>
              <Text style={styles.etaTitle}>Arrival</Text>
              <TouchableOpacity style={styles.etaCloseBtn} onPress={() => setIsNavigationActive(false)}>
                <Ionicons name="close" size={20} color={theme.colors.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>
            <Text style={styles.etaTime}>{remainingDuration ? formatDuration(remainingDuration) : (duration ? formatDuration(duration) : 'N/A')}</Text>
            <Text style={styles.etaDistance}>{remainingDistance ? formatDistance(remainingDistance) : (distance ? formatDistance(distance) : 'N/A')}</Text>
          </View>

          {/* Bottom Navigation Bar */}
          <View style={styles.navigationBottomBar}>
            <TouchableOpacity style={styles.navigationActionBtn}>
              <Ionicons name="add" size={20} color={theme.colors.ACCENT_COLOR} />
              <Text style={styles.navigationActionText}>Add stop</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navigationActionBtn}>
              <Ionicons name="share" size={20} color={theme.colors.ACCENT_COLOR} />
              <Text style={styles.navigationActionText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navigationActionBtn}>
              <Ionicons name="volume-high" size={20} color={theme.colors.ACCENT_COLOR} />
              <Text style={styles.navigationActionText}>Voice</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Controls Container */}
          <View style={styles.navigationControlsContainer}>
            {/* Current Instruction Card */}
            {detailedSteps.length > 0 && currentStep < detailedSteps.length && (
              <View style={styles.instructionCard}>
                <View style={styles.instructionCardTop}>
                  <View style={styles.instructionIconWrapper}>
                    {/* Maneuver icon */}
                    <Ionicons
                      name={getManeuverIcon(detailedSteps[currentStep]?.instruction)}
                      size={36}
                      color={theme.colors.ACCENT_COLOR}
                    />
                  </View>
                  <Text style={styles.instructionMainText}>
                    {currentInstruction || detailedSteps[currentStep]?.instruction || 'Continue straight'}
                  </Text>
                  <TouchableOpacity style={styles.repeatBtn} onPress={handleRepeatInstruction}>
                    <Ionicons name="volume-high" size={28} color={theme.colors.ACCENT_COLOR} />
                  </TouchableOpacity>
                </View>
                <View style={styles.instructionMetaRow}>
                  <Text style={styles.instructionMeta}>{detailedSteps[currentStep]?.duration ? formatDuration(detailedSteps[currentStep].duration) : '2 min'}</Text>
                  <Text style={styles.instructionMeta}>{nextTurnDistance ? formatDistance(nextTurnDistance) : (detailedSteps[currentStep]?.distance ? formatDistance(detailedSteps[currentStep].distance) : '500 m')}</Text>
                </View>
                {/* Then... next step preview */}
                {detailedSteps[currentStep + 1] && (
                  <View style={styles.thenRow}>
                    <Text style={styles.thenLabel}>Then</Text>
                    <Ionicons
                      name={getManeuverIcon(detailedSteps[currentStep + 1]?.instruction)}
                      size={24}
                      color={theme.colors.ACCENT_COLOR}
                    />
                    <Text style={styles.thenText}>{detailedSteps[currentStep + 1]?.instruction}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Arrived Message */}
            {isNavigationActive && remainingDistance < 30 && (
              <View style={{alignItems: 'center', marginVertical: 16}}>
                <Text style={{fontSize: 22, fontWeight: 'bold', color: theme.colors.ACCENT_COLOR}}>You have arrived at your destination!</Text>
              </View>
            )}

            {/* Off-route warning */}
            {isNavigationActive && userLocation && routeCoords.length > 0 && (() => {
              const { distance: distanceFromRoute } = findClosestPointOnRoute(userLocation.latitude, userLocation.longitude, routeCoords);
              if (distanceFromRoute > 100) {
                return (
                  <View style={{alignItems: 'center', marginVertical: 8}}>
                    <Text style={{color: theme.colors.ERROR_COLOR, fontWeight: 'bold'}}>You are off route! Recalculating...</Text>
                  </View>
                );
              }
              return null;
            })()}

            {/* Detailed Directions Button */}
            <TouchableOpacity 
              style={styles.detailedDirectionsBtn}
              onPress={() => setShowDetailedDirections(!showDetailedDirections)}
            >
              <Ionicons name={showDetailedDirections ? "chevron-down" : "list"} size={20} color={theme.colors.ACCENT_COLOR} />
              <Text style={styles.detailedDirectionsText}>
                {showDetailedDirections ? 'Hide' : 'Show'} All Directions
              </Text>
            </TouchableOpacity>

            {/* Detailed Directions List */}
            {showDetailedDirections && (
              <View style={styles.detailedDirectionsList}>
                <Text style={styles.directionsListTitle}>Turn-by-Turn Directions</Text>
                <ScrollView style={styles.directionsScrollView} showsVerticalScrollIndicator={false}>
                  {detailedSteps.map((step, index) => (
                    <View key={index} style={[styles.directionItem, currentStep === index && styles.currentDirectionItem]}>
                      <View style={styles.directionNumber}>
                        <Text style={styles.directionNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.directionContent}>
                        <Text style={styles.directionInstruction}>{step.instruction}</Text>
                        <View style={styles.directionDetails}>
                          <Text style={styles.directionDistance}>
                            {formatDistance(step.distance)}
                          </Text>
                          <Text style={styles.directionDuration}>
                            {formatDuration(step.duration)}
                          </Text>
                        </View>
                      </View>
                      {currentStep === index && (
                        <View style={styles.currentIndicator}>
                          <Ionicons name="navigate" size={16} color={theme.colors.ACCENT_COLOR} />
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Re-center button */}
      {isNavigationActive && !followUser && userLocation && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 120,
            right: 24,
            backgroundColor: theme.colors.BACKGROUND_SURFACE,
            borderRadius: 24,
            padding: 12,
            shadowColor: theme.colors.SHADOW_COLOR,
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 4,
            zIndex: 200,
          }}
          onPress={() => {
            setFollowUser(true);
            if (mapRef.current && userLocation) {
              mapRef.current.animateCamera({
                center: {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                },
                pitch: 0,
                heading: userHeading ?? 0,
                zoom: 17,
                altitude: 0,
              }, { duration: 500 });
            }
          }}
        >
          <Ionicons name="locate" size={24} color={theme.colors.ACCENT_COLOR} />
        </TouchableOpacity>
      )}

      <Modal visible={addStopModalVisible} animationType="slide" transparent>
        <View style={{flex:1, backgroundColor: addAlpha(theme.colors.BACKGROUND_PRIMARY, 0.3), justifyContent:'center', alignItems:'center'}}>
          <View style={{backgroundColor: theme.colors.BACKGROUND_SURFACE, borderRadius:16, padding:24, width:'90%'}}>
            <Text style={{fontWeight:'bold', fontSize:18, marginBottom:12, color: theme.colors.TEXT_PRIMARY}}>Add a Stop</Text>
            <TextInput
              placeholder="Search for a place..."
              value={stopSearchQuery}
              onChangeText={handleStopSearch}
              style={{borderWidth:1, borderColor: theme.colors.BORDER_COLOR_LIGHT, borderRadius:8, padding:10, marginBottom:12, color: theme.colors.TEXT_PRIMARY}}
            />
            <FlatList
              data={stopSearchResults}
              keyExtractor={item => item.name+item.lat+item.lng}
              renderItem={({item}) => (
                <TouchableOpacity onPress={() => handleSelectStop(item)} style={{padding:10}}>
                  <Text style={{color: theme.colors.TEXT_PRIMARY}}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={()=>setAddStopModalVisible(false)} style={{marginTop:10, alignSelf:'flex-end'}}>
              <Text style={{color: theme.colors.ACCENT_COLOR, fontWeight:'bold'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MapScreen; 