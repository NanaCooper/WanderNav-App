// app/dashcam.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Platform, 
  AppState, 
  Dimensions, 
  Animated,
  BackHandler,
  StatusBar,
  PermissionsAndroid
} from 'react-native';
import Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { logCamera, logLocation, logDebug, logError } from '../utils/logger';
import { LinearGradient } from 'expo-linear-gradient';
import { addAlpha } from '../constants/themes';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Enhanced debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
}

interface TripData {
  id: string;
  startTime: Date;
  endTime?: Date;
  distance: number;
  maxSpeed: number;
  averageSpeed: number;
  videoUri?: string;
  metadataUri?: string;
  route: Array<{ 
    latitude: number; 
    longitude: number; 
    timestamp: Date;
    speed?: number;
    altitude?: number;
    accuracy?: number;
  }>;
  recordingDuration: number;
  fileSize?: number;
  resolution?: string;
  fps?: number;
}

interface RecordingMetadata {
  tripId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  distance: number;
  maxSpeed: number;
  averageSpeed: number;
  routePoints: number;
  deviceInfo: {
    platform: string;
    version: string;
    model: string;
  };
  videoInfo: {
    uri: string;
    size?: number;
    resolution?: string;
    fps?: number;
  };
}

export default function DashcamScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  
  // Permission states
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasAudioPermission, setHasAudioPermission] = useState<boolean | null>(null);
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState<boolean | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [hasStoragePermission, setHasStoragePermission] = useState<boolean | null>(null);
  
  // Camera and recording states
  const cameraRef = useRef<Camera | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [storageSpace, setStorageSpace] = useState<number>(0);
  
  // UI states
  const [showSettings, setShowSettings] = useState(false);
  const [showTripData, setShowTripData] = useState(false);
  const [recordingQuality, setRecordingQuality] = useState<'720p' | '1080p'>('720p');
  const [autoSave, setAutoSave] = useState(true);
  const [backgroundRecording, setBackgroundRecording] = useState(false);
  
  // Animation refs
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const recordButtonScale = useRef(new Animated.Value(1)).current;
  const settingsSlideAnimation = useRef(new Animated.Value(0)).current;
  
  // Timer and subscription refs
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const batteryCheckTimer = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  // Request all necessary permissions
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        logDebug('Requesting permissions...');
        
        // Camera permissions
        const cameraStatus = await Camera.requestCameraPermissionsAsync();
        setHasCameraPermission(cameraStatus.status === 'granted');
        logCamera('Camera permission status', cameraStatus.status);

        // Audio permissions
        const audioStatus = await Camera.requestMicrophonePermissionsAsync();
        setHasAudioPermission(audioStatus.status === 'granted');
        logCamera('Audio permission status', audioStatus.status);

        // Media library permissions
        const mediaLibraryStatus = await MediaLibrary.requestPermissionsAsync();
        setHasMediaLibraryPermission(mediaLibraryStatus.status === 'granted');
        logCamera('Media library permission status', mediaLibraryStatus.status);

        // Location permissions
        const locationStatus = await Location.requestForegroundPermissionsAsync();
        setHasLocationPermission(locationStatus.status === 'granted');
        logLocation('Location permission status', locationStatus.status);

        // Storage permissions (Android)
        if (Platform.OS === 'android') {
          try {
            const storageStatus = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
            );
            setHasStoragePermission(storageStatus === PermissionsAndroid.RESULTS.GRANTED);
            logCamera('Storage permission status', storageStatus);
          } catch (error) {
            logError('Storage permission error', error);
            setHasStoragePermission(true); // Assume granted for now
          }
        } else {
          setHasStoragePermission(true);
        }

        // Check if all permissions are granted
        const allPermissionsGranted = 
          cameraStatus.status === 'granted' &&
          audioStatus.status === 'granted' &&
          mediaLibraryStatus.status === 'granted' &&
          locationStatus.status === 'granted';

        if (!allPermissionsGranted) {
          Alert.alert(
            "Permissions Required",
            "Camera, microphone, media library, and location access are needed for the dashcam feature. Please enable them in your device settings.",
            [
              { 
                text: "Open Settings", 
                onPress: () => {
                  // In a real app, you'd open device settings
                  logDebug('Opening device settings...');
                }
              },
              { 
                text: "Cancel", 
                style: "cancel",
                onPress: () => {
                  try {
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.replace('/');
                    }
                  } catch (error) {
                    logError('Navigation error', error);
                    router.replace('/');
                  }
                }
              }
            ]
          );
        }
      } catch (error) {
        logError("Error requesting permissions", error);
        Alert.alert("Permission Error", "Could not request necessary permissions.");
      }
    };
    
    requestPermissions();
  }, [router]);

  // Handle app state changes for background recording
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      logDebug('App state changed', { from: appState.current, to: nextAppState });
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground
        logDebug('App returned to foreground');
        if (isRecording && isPaused) {
          setIsPaused(false);
        }
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App has gone to background
        logDebug('App went to background');
        if (isRecording && backgroundRecording) {
          setIsPaused(true);
          logCamera('Recording paused due to background');
        } else if (isRecording && !backgroundRecording) {
          stopRecording();
          logCamera('Recording stopped due to background');
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isRecording, isPaused, backgroundRecording]);

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isRecording) {
        Alert.alert(
          "Recording in Progress",
          "Do you want to stop recording and exit?",
          [
            { text: "Continue Recording", style: "cancel" },
            { text: "Stop & Exit", onPress: () => {
              stopRecording();
              router.back();
            }}
          ]
        );
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isRecording, router]);

  // Battery monitoring
  useEffect(() => {
    const checkBatteryLevel = async () => {
      try {
        // In a real app, you'd use a battery monitoring library
        // For now, we'll simulate battery level
        const simulatedBatteryLevel = Math.max(20, 100 - (recordingDuration / 60));
        setBatteryLevel(simulatedBatteryLevel);
        
        if (simulatedBatteryLevel < 20 && isRecording) {
          Alert.alert(
            "Low Battery",
            "Battery level is low. Consider stopping recording to save power.",
            [{ text: "OK" }]
          );
        }
      } catch (error) {
        logError('Battery check error', error);
      }
    };

    batteryCheckTimer.current = setInterval(checkBatteryLevel, 30000); // Check every 30 seconds

    return () => {
      if (batteryCheckTimer.current) {
        clearInterval(batteryCheckTimer.current);
      }
    };
  }, [recordingDuration, isRecording]);

  // Recording timer and animations
  useEffect(() => {
    if (isRecording && !isPaused) {
      // Start recording timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, { 
            toValue: 1.2, 
            duration: 1000, 
            useNativeDriver: true 
          }),
          Animated.timing(pulseAnimation, { 
            toValue: 1, 
            duration: 1000, 
            useNativeDriver: true 
          }),
        ])
      ).start();

      // Start location tracking
      startLocationTracking();
    } else {
      // Stop recording timer
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      // Stop pulse animation
      pulseAnimation.stopAnimation();
    }
  }, [isRecording, isPaused]);

  // Location tracking
  const startLocationTracking = useCallback(async () => {
    if (!hasLocationPermission) return;

    try {
      logLocation('Starting location tracking...');
      
      // Get current location first
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      
      setCurrentLocation(currentLocation);
      const speed = currentLocation.coords.speed || 0;
      setCurrentSpeed(speed * 3.6); // Convert m/s to km/h

      // Start watching position
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 5,
        },
        (location) => {
          try {
            setCurrentLocation(location);
            const speed = location.coords.speed || 0;
            setCurrentSpeed(speed * 3.6);

            setTripData(prev => {
              if (!prev) {
                return {
                  id: Date.now().toString(),
                  startTime: new Date(),
                  distance: 0,
                  maxSpeed: speed * 3.6,
                  averageSpeed: speed * 3.6,
                  recordingDuration: 0,
                  route: [{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    timestamp: new Date(),
                    speed: speed * 3.6,
                    altitude: location.coords.altitude,
                    accuracy: location.coords.accuracy
                  }]
                };
              }

              const newRoutePoint = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timestamp: new Date(),
                speed: speed * 3.6,
                altitude: location.coords.altitude,
                accuracy: location.coords.accuracy
              };

              // Calculate distance
              const lastPoint = prev.route[prev.route.length - 1];
              const distance = calculateDistance(
                lastPoint.latitude, lastPoint.longitude,
                location.coords.latitude, location.coords.longitude
              );

              return {
                ...prev,
                distance: prev.distance + distance,
                maxSpeed: Math.max(prev.maxSpeed, speed * 3.6),
                averageSpeed: (prev.averageSpeed + speed * 3.6) / 2,
                recordingDuration: recordingDuration,
                route: [...prev.route, newRoutePoint]
              };
            });
          } catch (error) {
            console.error('❌ Error processing location data:', error);
          }
        }
      );
    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
    }
  }, [hasLocationPermission, recordingDuration]);

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Start recording
  const startRecording = async () => {
    if (!cameraRef.current) {
      console.warn("❌ Camera ref not available");
      return;
    }

    if (!hasCameraPermission || !hasAudioPermission) {
      Alert.alert(
        "Permissions Missing",
        "Cannot record without camera and microphone permissions.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      logCamera('Starting recording...');
      setIsRecording(true);
      setVideoUri(null);
      setRecordingDuration(0);
      setTripData(null);
      
      const options = {
        quality: recordingQuality,
        maxDuration: 3600, // 1 hour max
        mute: false,
        videoStabilization: true,
      };

      const data = await cameraRef.current.recordAsync(options);
              logCamera('Recording completed', { uri: data.uri });
      
      setVideoUri(data.uri);
      
      // Update trip data with video URI
      setTripData(prev => prev ? { 
        ...prev, 
        endTime: new Date(), 
        videoUri: data.uri,
        recordingDuration: recordingDuration
      } : null);

      // Auto-save if enabled
      if (autoSave) {
        await saveVideoToGallery(data.uri);
      }

      showRecordingCompleteDialog(data.uri);

    } catch (error: any) {
      console.error('❌ Failed to record video:', error);
      Alert.alert("Recording Error", `Could not complete recording: ${error.message || 'Unknown error'}`);
      setIsRecording(false);
    }
  };

  // Stop recording
  const stopRecording = async () => {
    if (!cameraRef.current) return;
    
    try {
      logCamera('Stopping recording...');
      await cameraRef.current.stopRecording();
      setIsRecording(false);
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
    }
  };

  // Save video to gallery
  const saveVideoToGallery = async (uri: string) => {
    try {
      logCamera('Saving video to gallery...');
      await MediaLibrary.saveToLibraryAsync(uri);
      logCamera('Video saved to gallery');
      return true;
    } catch (error) {
      console.error('❌ Error saving to gallery:', error);
      return false;
    }
  };

  // Save metadata
  const saveMetadata = async (tripData: TripData): Promise<string> => {
    try {
      const metadata: RecordingMetadata = {
        tripId: tripData.id,
        startTime: tripData.startTime.toISOString(),
        endTime: tripData.endTime?.toISOString(),
        duration: tripData.recordingDuration,
        distance: tripData.distance,
        maxSpeed: tripData.maxSpeed,
        averageSpeed: tripData.averageSpeed,
        routePoints: tripData.route.length,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version.toString(),
          model: Platform.select({ ios: 'iPhone', android: 'Android' }) || 'Unknown',
        },
        videoInfo: {
          uri: tripData.videoUri || '',
          size: tripData.fileSize,
          resolution: tripData.resolution,
          fps: tripData.fps,
        },
      };

      const metadataUri = `${FileSystem.documentDirectory}${tripData.id}_metadata.json`;
      await FileSystem.writeAsStringAsync(metadataUri, JSON.stringify(metadata, null, 2));
      
      return metadataUri;
    } catch (error) {
      console.error('❌ Error saving metadata:', error);
      throw error;
    }
  };

  // Show recording complete dialog
  const showRecordingCompleteDialog = (videoUri: string) => {
    Alert.alert(
      "Recording Complete",
      "Video captured successfully! What would you like to do?",
      [
        {
          text: "Save to Gallery",
          onPress: async () => {
            const saved = await saveVideoToGallery(videoUri);
            if (saved) {
              Alert.alert("Saved!", "Video saved to your device gallery.");
            } else {
              Alert.alert("Save Error", "Could not save video to gallery.");
            }
          },
        },
        {
          text: "Share Video",
          onPress: async () => {
            try {
              await Sharing.shareAsync(videoUri);
            } catch (error) {
              console.error('❌ Error sharing video:', error);
              Alert.alert("Share Error", "Could not share video.");
            }
          },
        },
        {
          text: "View Trip Data",
          onPress: () => {
            setShowTripData(true);
          }
        },
        {
          text: "Report Hazard",
          onPress: () => {
            try {
              router.push('/hazardReportScreen');
            } catch (error) {
              logError('Navigation error', error);
              Alert.alert('Navigation', 'Could not navigate to hazard report screen');
            }
          }
        },
        { text: "Dismiss", style: "cancel" },
      ],
      { cancelable: false }
    );
  };

  // Handle record button press
  const handleRecordButtonPress = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  // Toggle camera type
  const toggleCameraType = () => {
    if (isRecording) return;
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };

  // Toggle flash
  const toggleFlash = () => {
    if (isRecording) return;
    if (cameraType === 'front' && flashMode !== 'off') {
      setFlashMode('off');
      return;
    }
    setFlashMode(current => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get flash icon name
  const getFlashIconName = (): keyof typeof MaterialCommunityIcons.glyphMap => {
    if (flashMode === 'on') return "flash";
    if (flashMode === 'auto') return "flash-auto";
    return "flash-off";
  };

  // Debounced record handler
  const debouncedHandleRecord = debounce(handleRecordButtonPress, 300);

  // Permission check
  if (hasCameraPermission === null || hasAudioPermission === null || 
      hasMediaLibraryPermission === null || hasLocationPermission === null) {
    return (
      <View style={[styles.centeredMessageContainer, { backgroundColor: theme.colors.BACKGROUND_PRIMARY }]}>
        <Text style={[styles.messageText, { color: theme.colors.TEXT_PRIMARY }]}>Requesting permissions...</Text>
      </View>
    );
  }

  // Permission denied
  if (!hasCameraPermission || !hasAudioPermission || !hasMediaLibraryPermission || !hasLocationPermission) {
    return (
      <View style={[styles.centeredMessageContainer, { backgroundColor: theme.colors.BACKGROUND_PRIMARY }]}>
        <MaterialCommunityIcons 
          name="camera-off-outline" 
          size={60} 
          color={theme.colors.TEXT_TERTIARY} 
          style={styles.messageIcon}
        />
        <Text style={[styles.messageTitle, { color: theme.colors.TEXT_PRIMARY }]}>Permissions Required</Text>
        <Text style={[styles.messageText, { color: theme.colors.TEXT_SECONDARY }]}>
          Camera, microphone, media library, and location access are required for the dashcam.
          Please enable them in your device settings.
        </Text>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.colors.ACCENT_COLOR }]} 
          onPress={() => {
            try {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
                    } catch (error) {
          logError('Navigation error', error);
          router.replace('/');
        }
          }}
        >
          <Text style={styles.actionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.BACKGROUND_BLACK }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Stack.Screen options={{ headerShown: false }} />
      
      <Camera
        ref={ref => { cameraRef.current = ref; }}
        style={styles.camera}
        type={cameraType}
        flashMode={flashMode}
        videoStabilizationMode="auto"
      >
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => {
              if (isRecording) {
                Alert.alert(
                  "Recording in Progress",
                  "Do you want to stop recording and exit?",
                  [
                    { text: "Continue Recording", style: "cancel" },
                    { text: "Stop & Exit", onPress: () => {
                      stopRecording();
                      router.back();
                    }}
                  ]
                );
              } else {
                router.back();
              }
            }}
            disabled={isRecording}
          >
            <Ionicons 
              name="arrow-back" 
              size={28} 
              color={isRecording ? theme.colors.TEXT_TERTIARY : theme.colors.WHITE} 
            />
          </TouchableOpacity>
          
          {isRecording && (
            <View style={styles.recordingIndicatorContainer}>
              <Animated.View 
                style={[
                  styles.recordingDot, 
                  { 
                    transform: [{ scale: pulseAnimation }],
                    backgroundColor: theme.colors.ERROR_COLOR 
                  }
                ]} 
              />
              <Text style={[styles.recordingIndicatorText, { color: theme.colors.TEXT_ON_DARK_BACKGROUND }]}>
                {isPaused ? 'PAUSED' : 'REC'} {formatDuration(recordingDuration)}
              </Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={toggleFlash} 
            disabled={isRecording || cameraType === 'front'}
          >
            <MaterialCommunityIcons
              name={getFlashIconName()}
              size={24}
              color={(isRecording || cameraType === 'front') ? theme.colors.TEXT_TERTIARY : theme.colors.WHITE} 
            />
          </TouchableOpacity>
        </View>

        {/* Speed Display */}
        {isRecording && (
          <View style={styles.speedDisplay}>
            <Text style={[styles.speedText, { color: theme.colors.TEXT_ON_DARK_BACKGROUND }]}>
              {currentSpeed.toFixed(1)}
            </Text>
            <Text style={[styles.speedUnit, { color: theme.colors.TEXT_ON_DARK_BACKGROUND }]}>km/h</Text>
          </View>
        )}

        {/* Battery Indicator */}
        {isRecording && (
          <View style={styles.batteryIndicator}>
            <Ionicons 
              name={batteryLevel > 20 ? "battery-full" : "battery-dead"} 
              size={16} 
              color={batteryLevel > 20 ? theme.colors.SUCCESS_COLOR : theme.colors.ERROR_COLOR} 
            />
            <Text style={[styles.batteryText, { color: theme.colors.TEXT_ON_DARK_BACKGROUND }]}>
              {batteryLevel}%
            </Text>
          </View>
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={toggleCameraType} 
            disabled={isRecording}
          >
            <Ionicons
              name="camera-reverse-outline"
              size={32}
              color={isRecording ? theme.colors.TEXT_TERTIARY : theme.colors.WHITE} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.recordButtonOuter}
            onPress={debouncedHandleRecord}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={isRecording ? ['#E74C3C', '#C0392B'] : ['#2ECC71', '#27AE60']}
              style={[styles.recordButtonInner, isRecording && styles.recordButtonInnerRecording]}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => setShowSettings(true)}
            disabled={isRecording}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={isRecording ? theme.colors.TEXT_TERTIARY : theme.colors.WHITE} 
            />
          </TouchableOpacity>
        </View>

        {/* Trip Data Button */}
        {tripData && !isRecording && (
          <TouchableOpacity 
            style={styles.tripDataButton} 
            onPress={() => setShowTripData(true)}
          >
            <LinearGradient
              colors={[theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)]}
              style={styles.tripDataGradient}
            >
              <Ionicons name="analytics" size={20} color="#fff" />
              <Text style={styles.tripDataText}>Trip Data</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </Camera>

      {/* Settings Modal */}
      {showSettings && (
        <View style={styles.settingsOverlay}>
          <View style={[styles.settingsContainer, { backgroundColor: theme.colors.BACKGROUND_SURFACE }]}>
            <Text style={[styles.settingsTitle, { color: theme.colors.TEXT_PRIMARY }]}>Dashcam Settings</Text>
            
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: theme.colors.TEXT_PRIMARY }]}>Recording Quality</Text>
              <TouchableOpacity 
                style={[styles.qualityButton, { backgroundColor: theme.colors.ACCENT_COLOR }]}
                onPress={() => setRecordingQuality(recordingQuality === '720p' ? '1080p' : '720p')}
              >
                <Text style={styles.qualityButtonText}>{recordingQuality}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: theme.colors.TEXT_PRIMARY }]}>Auto Save</Text>
              <TouchableOpacity 
                style={[styles.toggleButton, { backgroundColor: autoSave ? theme.colors.SUCCESS_COLOR : theme.colors.TEXT_TERTIARY }]}
                onPress={() => setAutoSave(!autoSave)}
              >
                <Text style={styles.toggleButtonText}>{autoSave ? 'ON' : 'OFF'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: theme.colors.TEXT_PRIMARY }]}>Background Recording</Text>
              <TouchableOpacity 
                style={[styles.toggleButton, { backgroundColor: backgroundRecording ? theme.colors.SUCCESS_COLOR : theme.colors.TEXT_TERTIARY }]}
                onPress={() => setBackgroundRecording(!backgroundRecording)}
              >
                <Text style={styles.toggleButtonText}>{backgroundRecording ? 'ON' : 'OFF'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: theme.colors.ACCENT_COLOR }]}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Trip Data Modal */}
      {showTripData && tripData && (
        <View style={styles.settingsOverlay}>
          <View style={[styles.settingsContainer, { backgroundColor: theme.colors.BACKGROUND_SURFACE }]}>
            <Text style={[styles.settingsTitle, { color: theme.colors.TEXT_PRIMARY }]}>Trip Summary</Text>
            
            <View style={styles.tripDataItem}>
              <Text style={[styles.tripDataLabel, { color: theme.colors.TEXT_PRIMARY }]}>Duration</Text>
              <Text style={[styles.tripDataValue, { color: theme.colors.TEXT_SECONDARY }]}>
                {formatDuration(tripData.recordingDuration)}
              </Text>
            </View>

            <View style={styles.tripDataItem}>
              <Text style={[styles.tripDataLabel, { color: theme.colors.TEXT_PRIMARY }]}>Distance</Text>
              <Text style={[styles.tripDataValue, { color: theme.colors.TEXT_SECONDARY }]}>
                {tripData.distance.toFixed(2)} km
              </Text>
            </View>

            <View style={styles.tripDataItem}>
              <Text style={[styles.tripDataLabel, { color: theme.colors.TEXT_PRIMARY }]}>Max Speed</Text>
              <Text style={[styles.tripDataValue, { color: theme.colors.TEXT_SECONDARY }]}>
                {tripData.maxSpeed.toFixed(1)} km/h
              </Text>
            </View>

            <View style={styles.tripDataItem}>
              <Text style={[styles.tripDataLabel, { color: theme.colors.TEXT_PRIMARY }]}>Avg Speed</Text>
              <Text style={[styles.tripDataValue, { color: theme.colors.TEXT_SECONDARY }]}>
                {tripData.averageSpeed.toFixed(1)} km/h
              </Text>
            </View>

            <View style={styles.tripDataItem}>
              <Text style={[styles.tripDataLabel, { color: theme.colors.TEXT_PRIMARY }]}>Route Points</Text>
              <Text style={[styles.tripDataValue, { color: theme.colors.TEXT_SECONDARY }]}>
                {tripData.route.length}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: theme.colors.ACCENT_COLOR }]}
              onPress={() => setShowTripData(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  messageIcon: {
    marginBottom: 25,
    opacity: 0.8,
  },
  messageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  messageText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  recordingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  recordingIndicatorText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  speedDisplay: {
    position: 'absolute',
    top: '50%',
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  speedText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  speedUnit: {
    fontSize: 12,
    opacity: 0.8,
  },
  batteryIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 90,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  batteryText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    paddingTop: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  controlButton: {
    padding: 10,
    borderRadius: 20,
  },
  recordButtonOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  recordButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  recordButtonInnerRecording: {
    width: 30,
    height: 30,
    borderRadius: 6,
  },
  tripDataButton: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tripDataGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tripDataText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  settingsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsContainer: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  qualityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  qualityButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tripDataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripDataLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  tripDataValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});