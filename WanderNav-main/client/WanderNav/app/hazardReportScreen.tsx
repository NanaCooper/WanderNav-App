import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Dimensions,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  StyleProp,
  ViewStyle,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { addAlpha } from '../constants/themes';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

// --- Import ImagePicker ---
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- Reusable Animated Pressable ---
const PRESSED_SCALE_VALUE = 0.97;

interface AnimatedPressableProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  pressableStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  friction?: number;
  tension?: number;
}

const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  onPress,
  style,
  pressableStyle,
  children,
  friction = 7,
  tension = 60,
}) => {
  const { theme } = useTheme();
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: PRESSED_SCALE_VALUE,
      friction: friction,
      tension: tension,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: friction,
      tension: tension,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPressIn={onPress ? handlePressIn : undefined}
      onPressOut={onPress ? handlePressOut : undefined}
      onPress={onPress}
      style={pressableStyle}
      android_ripple={{ color: addAlpha(theme.colors.PRIMARY_BRAND_COLOR, 0.1), borderless: false }}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// --- Reusable FadeInView ---
interface FadeInViewProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  delay?: number;
  yOffset?: number;
  duration?: number;
}

const FadeInView: React.FC<FadeInViewProps> = ({
  style,
  children,
  delay = 0,
  yOffset = 15,
  duration = 350,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(yOffset)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 7,
        tension: 50,
        delay: delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay, duration]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

const HAZARD_CATEGORIES = [
  { id: 'pothole', label: 'Pothole', icon: 'road-variant' as const, color: '#FF6B35' },
  { id: 'debris', label: 'Debris', icon: 'delete-sweep-outline' as const, color: '#4ECDC4' },
  { id: 'accident', label: 'Accident', icon: 'car-crash' as const, color: '#FF4757' },
  { id: 'construction', label: 'Construction', icon: 'sign-caution' as const, color: '#FFA502' },
  { id: 'flood', label: 'Flooding', icon: 'water-alert-outline' as const, color: '#3742FA' },
  { id: 'other', label: 'Other', icon: 'alert-circle-outline' as const, color: '#2ED573' },
] as const;

type HazardCategoryId = typeof HAZARD_CATEGORIES[number]['id'];
const ICON_SIZE_CATEGORY = 28;
const ICON_SIZE_BUTTON = 22;

const HazardReportScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [elementsVisible, setElementsVisible] = useState(false);

  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HazardCategoryId | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [locationName, setLocationName] = useState<string>('');

  // Generate responsive styles with theme
  const getStyles = () => StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.BACKGROUND_PRIMARY,
    },
    scrollContainer: {
      paddingVertical: 20,
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: addAlpha(theme.colors.BACKGROUND_PRIMARY, 0.9),
      zIndex: 1000,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      padding: 30,
      borderRadius: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: addAlpha(theme.colors.ACCENT_COLOR, 0.2),
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.TEXT_PRIMARY,
    },
    loadingSubtext: {
      marginTop: 8,
      fontSize: 14,
      color: theme.colors.TEXT_SECONDARY,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: addAlpha(theme.colors.BACKGROUND_PRIMARY, 0.5),
      justifyContent: 'center',
      alignItems: 'center',
    },
    successModal: {
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
      width: '85%',
      maxWidth: 400,
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
      borderWidth: 0.5,
      borderColor: addAlpha(theme.colors.BORDER_COLOR_LIGHT, 0.2),
    },
    successIconContainer: {
      marginBottom: 20,
    },
    successIconGradient: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 8,
    },
    successSubtitle: {
      fontSize: 16,
      color: theme.colors.TEXT_SECONDARY,
      marginBottom: 16,
      textAlign: 'center',
    },
    successDescription: {
      fontSize: 14,
      color: theme.colors.TEXT_TERTIARY,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    successButton: {
      borderRadius: 16,
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    successButtonGradient: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 16,
      alignItems: 'center',
    },
    successButtonText: {
      color: theme.colors.WHITE,
      fontSize: 16,
      fontWeight: 'bold',
    },
    headerSection: {
      marginBottom: 30,
    },
    headerGradient: {
      padding: 24,
      borderRadius: 20,
      alignItems: 'center',
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 6,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.WHITE,
      marginTop: 12,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: addAlpha(theme.colors.WHITE, 0.9),
      textAlign: 'center',
    },
    formSection: {
      marginBottom: 30,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.TEXT_PRIMARY,
      marginLeft: 8,
    },
    locationContainer: {
      borderRadius: 16,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    locationGradient: {
      padding: 24,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.BORDER_COLOR_LIGHT,
    },
    locationText: {
      marginTop: 12,
      fontSize: 16,
      color: theme.colors.TEXT_PRIMARY,
      textAlign: 'center',
      fontWeight: '500',
    },
    locationSubtext: {
      marginTop: 6,
      fontSize: 12,
      color: theme.colors.TEXT_TERTIARY,
      textAlign: 'center',
    },
    categoryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    categoryButton: {
      width: '48%',
      borderRadius: 16,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    categoryButtonGradient: {
      padding: 20,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.BORDER_COLOR_LIGHT,
      minHeight: 100,
      justifyContent: 'center',
    },
    categoryButtonText: {
      marginTop: 8,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.TEXT_PRIMARY,
      textAlign: 'center',
    },
    categoryButtonTextSelected: {
      color: theme.colors.WHITE,
    },
    inputContainer: {
      borderRadius: 16,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    inputGradient: {
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.BORDER_COLOR_LIGHT,
    },
    textArea: {
      fontSize: 16,
      color: theme.colors.TEXT_PRIMARY,
      minHeight: 120,
      textAlignVertical: 'top',
    },
    addPhotoButton: {
      borderRadius: 16,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    addPhotoGradient: {
      padding: 32,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: addAlpha(theme.colors.ACCENT_COLOR, 0.3),
      borderStyle: 'dashed',
    },
    addPhotoText: {
      marginTop: 12,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.ACCENT_COLOR,
    },
    addPhotoSubtext: {
      marginTop: 4,
      fontSize: 12,
      color: theme.colors.TEXT_TERTIARY,
      textAlign: 'center',
    },
    imagePreviewWrapper: {
      position: 'relative',
      alignItems: 'center',
    },
    imagePreview: {
      width: '100%',
      height: 200,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: theme.colors.BORDER_COLOR_LIGHT,
    },
    removeImageButton: {
      position: 'absolute',
      top: -8,
      right: 8,
      zIndex: 1,
    },
    removeImageGradient: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.ERROR_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    changePhotoButton: {
      position: 'absolute',
      bottom: 12,
      zIndex: 1,
    },
    changePhotoGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    changePhotoButtonText: {
      color: theme.colors.WHITE,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    submitButtonContainer: {
      marginTop: 20,
      marginBottom: 40,
    },
    submitButton: {
      borderRadius: 20,
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    submitButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18,
      paddingHorizontal: 32,
      borderRadius: 20,
    },
    submitButtonText: {
      color: theme.colors.WHITE,
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 8,
    },
  });

  const styles = getStyles();

  const fetchLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        Alert.alert('Permission Denied', 'Location permission is required to report hazards accurately.');
        return;
      }
      
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      
      // Get address from coordinates
      try {
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        
        if (addressResponse.length > 0) {
          const address = addressResponse[0];
          const addressString = [
            address.street,
            address.city,
            address.region,
            address.country
          ].filter(Boolean).join(', ');
          setLocationName(addressString);
        }
      } catch (error) {
        console.log('Could not get address:', error);
        setLocationName('Location captured');
      }
      
      setLoading(false);
      Alert.alert('Location Set', 'Your current location has been captured for this hazard report.');
    } catch (e) {
      setLoading(false);
      Alert.alert('Location Error', 'Could not fetch your location. Please try again.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      setElementsVisible(true);
      return () => {
        setElementsVisible(false);
      }
    }, [])
  );

  const handleCategorySelect = (categoryId: HazardCategoryId) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
  };

  const handleAddPhoto = () => {
    Alert.alert(
      "Add Photo",
      "Choose an option for your hazard report photo:",
      [
        {
          text: "📷 Take Photo",
          onPress: async () => {
            const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
            if (cameraPermission.status !== ImagePicker.PermissionStatus.GRANTED) {
              Alert.alert("Permission Required", "Camera permission is needed to take photos.");
              return;
            }
            launchCameraForHazard();
          },
        },
        {
          text: "🖼️ Choose from Library",
          onPress: async () => {
            const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (mediaLibraryPermission.status !== ImagePicker.PermissionStatus.GRANTED) {
              Alert.alert("Permission Required", "Media library permission is needed to select photos.");
              return;
            }
            launchImageLibraryForHazard();
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const launchCameraForHazard = async () => {
    try {
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error launching camera for hazard:", error);
      Alert.alert("Camera Error", "Could not open camera. Please check permissions in settings.");
    }
  };

  const launchImageLibraryForHazard = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error launching image library for hazard:", error);
      Alert.alert("Gallery Error", "Could not open image library. Please check permissions in settings.");
    }
  };

  const removePhoto = () => {
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove this photo?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => setPhotoUri(null),
        },
      ]
    );
  };

  const handleSubmitReport = () => {
    if (!selectedCategory) {
      Alert.alert('Missing Information', 'Please select a hazard category to continue.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing Information', 'Please provide a detailed description of the hazard.');
      return;
    }
    if (!location) {
      Alert.alert('Missing Information', 'Please capture your location to submit this report.');
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setShowSuccessModal(true);
      
      // Reset form
      setDescription('');
      setSelectedCategory(null);
      setPhotoUri(null);
      setLocation(null);
      setLocationName('');
    }, 2000);
  };

  const handleBackPress = () => {
    if (description || selectedCategory || photoUri || location) {
      Alert.alert(
        "Discard Report",
        "You have unsaved changes. Are you sure you want to leave?",
        [
          {
            text: "Stay",
            style: "cancel",
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.BACKGROUND_PRIMARY }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? (Dimensions.get('window').height > 800 ? 90 : 70) : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.BACKGROUND_PRIMARY} />
      <Stack.Screen
        options={{
          title: 'Report Hazard',
          headerStyle: { backgroundColor: theme.colors.BACKGROUND_SURFACE },
          headerTitleStyle: { color: theme.colors.TEXT_PRIMARY, fontWeight: '600' },
          headerTintColor: theme.colors.PRIMARY_BRAND_COLOR,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBackPress} style={{ marginLeft: 8 }}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.PRIMARY_BRAND_COLOR} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Loading Spinner Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <LinearGradient
            colors={[addAlpha(theme.colors.ACCENT_COLOR, 0.1), addAlpha(theme.colors.ACCENT_COLOR, 0.05)]}
            style={styles.loadingContainer}
          >
            <ActivityIndicator size="large" color={theme.colors.ACCENT_COLOR} />
            <Text style={styles.loadingText}>Processing...</Text>
            <Text style={styles.loadingSubtext}>Please wait while we submit your report</Text>
          </LinearGradient>
        </View>
      )}

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={[theme.colors.BACKGROUND_SURFACE, addAlpha(theme.colors.ACCENT_COLOR, 0.02)]}
            style={styles.successModal}
          >
            <View style={styles.successIconContainer}>
              <LinearGradient
                colors={[theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)]}
                style={styles.successIconGradient}
              >
                <Ionicons name="checkmark" size={40} color={theme.colors.WHITE} />
              </LinearGradient>
            </View>
            <Text style={styles.successTitle}>Report Submitted!</Text>
            <Text style={styles.successSubtitle}>Thank you for helping keep our roads safe!</Text>
            <Text style={styles.successDescription}>
              Your hazard report has been successfully submitted and will be reviewed by our team.
            </Text>
            <TouchableOpacity 
              style={styles.successButton}
              onPress={() => {
                setShowSuccessModal(false);
                router.back();
              }}
            >
              <LinearGradient
                colors={[theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)]}
                style={styles.successButtonGradient}
              >
                <Text style={styles.successButtonText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {elementsVisible && (
          <>
            {/* Header Section */}
            <FadeInView delay={100} yOffset={20} style={styles.headerSection}>
              <LinearGradient
                colors={[theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)]}
                style={styles.headerGradient}
              >
                <MaterialCommunityIcons name="alert-decagram" size={40} color={theme.colors.WHITE} />
                <Text style={styles.headerTitle}>Report a Hazard</Text>
                <Text style={styles.headerSubtitle}>Help keep our roads safe by reporting hazards</Text>
              </LinearGradient>
            </FadeInView>

            {/* Location Section */}
            <FadeInView delay={200} yOffset={15} style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="map-marker" size={24} color={theme.colors.ACCENT_COLOR} />
                <Text style={styles.sectionTitle}>Location</Text>
              </View>
              <TouchableOpacity style={styles.locationContainer} onPress={fetchLocation}>
                <LinearGradient
                  colors={location ? 
                    [addAlpha(theme.colors.SUCCESS_COLOR, 0.1), addAlpha(theme.colors.SUCCESS_COLOR, 0.05)] : 
                    [theme.colors.BACKGROUND_SURFACE, addAlpha(theme.colors.ACCENT_COLOR, 0.02)]
                  }
                  style={styles.locationGradient}
                >
                  <MaterialCommunityIcons 
                    name={location ? "map-marker-check" : "map-marker-plus"} 
                    size={50} 
                    color={location ? theme.colors.SUCCESS_COLOR : theme.colors.ACCENT_COLOR} 
                  />
                  <Text style={styles.locationText}>
                    {location
                      ? locationName || `Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                      : 'Tap to capture current location'}
                  </Text>
                  {location && (
                    <Text style={styles.locationSubtext}>Tap to re-capture location</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </FadeInView>

            {/* Category Section */}
            <FadeInView delay={300} yOffset={15} style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="tag-multiple" size={24} color={theme.colors.ACCENT_COLOR} />
                <Text style={styles.sectionTitle}>Hazard Category</Text>
              </View>
              <View style={styles.categoryContainer}>
                {HAZARD_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryButton}
                    onPress={() => handleCategorySelect(category.id)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={selectedCategory === category.id ? 
                        [category.color, addAlpha(category.color, 0.8)] : 
                        [theme.colors.BACKGROUND_SURFACE, theme.colors.BACKGROUND_SURFACE]
                      }
                      style={styles.categoryButtonGradient}
                    >
                      <MaterialCommunityIcons
                        name={category.icon}
                        size={ICON_SIZE_CATEGORY}
                        color={selectedCategory === category.id ? theme.colors.WHITE : category.color}
                      />
                      <Text style={[
                        styles.categoryButtonText,
                        selectedCategory === category.id && styles.categoryButtonTextSelected
                      ]}>
                        {category.label}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </FadeInView>

            {/* Description Section */}
            <FadeInView delay={400} yOffset={15} style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="text-box-outline" size={24} color={theme.colors.ACCENT_COLOR} />
                <Text style={styles.sectionTitle}>Description</Text>
              </View>
              <View style={styles.inputContainer}>
                <LinearGradient
                  colors={[theme.colors.BACKGROUND_SURFACE, addAlpha(theme.colors.ACCENT_COLOR, 0.02)]}
                  style={styles.inputGradient}
                >
                  <TextInput
                    style={styles.textArea}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Provide detailed information about the hazard..."
                    placeholderTextColor={theme.colors.TEXT_TERTIARY}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </LinearGradient>
              </View>
            </FadeInView>

            {/* Photo Section */}
            <FadeInView delay={500} yOffset={15} style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="camera" size={24} color={theme.colors.ACCENT_COLOR} />
                <Text style={styles.sectionTitle}>Photo (Optional)</Text>
              </View>
              {!photoUri ? (
                <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto} activeOpacity={0.8}>
                  <LinearGradient
                    colors={[theme.colors.BACKGROUND_SURFACE, addAlpha(theme.colors.ACCENT_COLOR, 0.05)]}
                    style={styles.addPhotoGradient}
                  >
                    <MaterialCommunityIcons name="camera-plus" size={40} color={theme.colors.ACCENT_COLOR} />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                    <Text style={styles.addPhotoSubtext}>Tap to take or select a photo</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: photoUri }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={removePhoto}
                  >
                    <LinearGradient
                      colors={[theme.colors.ERROR_COLOR, addAlpha(theme.colors.ERROR_COLOR, 0.8)]}
                      style={styles.removeImageGradient}
                    >
                      <Ionicons name="close" size={20} color={theme.colors.WHITE} />
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.changePhotoButton}
                    onPress={handleAddPhoto}
                  >
                    <LinearGradient
                      colors={[theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)]}
                      style={styles.changePhotoGradient}
                    >
                      <MaterialCommunityIcons name="image-edit" size={18} color={theme.colors.WHITE} />
                      <Text style={styles.changePhotoButtonText}>Change</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </FadeInView>

            {/* Submit Button */}
            <View style={styles.submitButtonContainer}>
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmitReport}
                activeOpacity={0.8}
                disabled={!selectedCategory || !description.trim() || !location}
              >
                <LinearGradient
                  colors={(!selectedCategory || !description.trim() || !location) ? 
                    [theme.colors.TEXT_TERTIARY, theme.colors.TEXT_TERTIARY] : 
                    [theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)]
                  }
                  style={styles.submitButtonGradient}
                >
                  <MaterialCommunityIcons name="send" size={24} color={theme.colors.WHITE} />
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default HazardReportScreen;