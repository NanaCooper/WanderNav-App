import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TextInput,
  Animated,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Image,
  Pressable,
  Alert,
  Modal,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { addAlpha } from '../constants/themes';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { getRouteGoogleDirections, destinationApiService, SavedDestination as ApiSavedDestination, CreateDestinationRequest } from '../src/services/api';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedPressable = ({ onPress, style, children, pressableStyle, scaleTo = 0.97, feedbackType = 'scale', androidRippleColor, }: { onPress?: () => void; style?: any; children: React.ReactNode; pressableStyle?: any; scaleTo?: number; feedbackType?: 'scale' | 'opacity'; androidRippleColor?: string; }) => {
  const animatedValue = React.useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = React.useState(false);

  const handlePressIn = () => {
    if (!isPressed) {
      setIsPressed(true);
      Animated.spring(animatedValue, { toValue: scaleTo, useNativeDriver: true, friction: 7 }).start();
    }
  };
  
  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(animatedValue, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
  };
  
  const handlePress = () => {
    if (onPress && !isPressed) {
      onPress();
    }
  };
  
  const animatedStyle = feedbackType === 'opacity' ? { opacity: animatedValue } : { transform: [{ scale: animatedValue }] };

  return (
    <Pressable
      onPressIn={handlePressIn} 
      onPressOut={handlePressOut} 
      onPress={handlePress} 
      style={pressableStyle}
      android_ripple={{ color: androidRippleColor }}
      disabled={isPressed}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

interface FadeInViewProps { children: React.ReactNode; duration?: number; delay?: number; style?: any; translateYValue?: number; }
const FadeInView: React.FC<FadeInViewProps> = ({ children, duration = 300, delay = 0, style, translateYValue = 15 }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(translateYValue)).current;
  useEffect(() => { Animated.parallel([ Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true }), Animated.spring(translateY, { toValue: 0, friction: 7, tension: 60, delay, useNativeDriver: true }) ]).start(); }, [opacity, translateY, duration, delay]);
  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
};

interface SavedDestination {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  lastVisited?: string;
  isFavorite: boolean;
}

interface QuickAccessItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  action: () => void;
}

const SavedDestinationsScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [savedDestinations, setSavedDestinations] = useState<SavedDestination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Generate styles with theme
  const getStyles = () => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.BACKGROUND_PRIMARY,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingHorizontal: 24,
      paddingBottom: 24,
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.BORDER_COLOR_LIGHT,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 16,
      color: theme.colors.TEXT_SECONDARY,
      fontWeight: '500',
    },
    addButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    addButtonGradient: {
      width: '100%',
      height: '100%',
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchFilterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
      gap: 12,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.colors.BORDER_COLOR_LIGHT,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.TEXT_PRIMARY,
      fontWeight: '500',
    },
    clearSearchButton: {
      marginLeft: 8,
    },
    filterButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.BORDER_COLOR_LIGHT,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    filterContainer: {
      paddingHorizontal: 24,
      paddingBottom: 16,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
      borderWidth: 1,
      borderColor: theme.colors.BORDER_COLOR_LIGHT,
      marginRight: 8,
    },
    activeFilterChip: {
      backgroundColor: theme.colors.ACCENT_COLOR,
      borderColor: theme.colors.ACCENT_COLOR,
    },
    filterChipText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.TEXT_SECONDARY,
    },
    activeFilterChipText: {
      color: '#fff',
      fontWeight: '600',
    },
    quickAccessSection: {
      paddingHorizontal: 24,
      paddingVertical: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 20,
    },
    quickAccessList: {
      paddingRight: 24,
    },
    quickAccessItem: {
      alignItems: 'center',
      marginRight: 24,
      minWidth: 80,
    },
    quickAccessIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    quickAccessText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.TEXT_PRIMARY,
      textAlign: 'center',
    },
    destinationsSection: {
      flex: 1,
      paddingHorizontal: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    destinationCount: {
      fontSize: 14,
      color: theme.colors.TEXT_SECONDARY,
      fontWeight: '500',
    },
    destinationsList: {
      paddingBottom: 24,
    },
    destinationItem: {
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.colors.BORDER_COLOR_LIGHT,
    },
    destinationContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    destinationIconContainer: {
      marginRight: 16,
    },
    destinationIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    destinationTextContainer: {
      flex: 1,
    },
    destinationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    destinationName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.TEXT_PRIMARY,
      flex: 1,
    },
    destinationAddress: {
      fontSize: 15,
      color: theme.colors.TEXT_SECONDARY,
      marginBottom: 12,
      lineHeight: 20,
    },
    destinationMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    categoryBadge: {
      backgroundColor: addAlpha(theme.colors.ACCENT_COLOR, 0.1),
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    categoryText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.ACCENT_COLOR,
    },
    lastVisitedText: {
      fontSize: 12,
      color: theme.colors.TEXT_TERTIARY,
      fontWeight: '500',
    },
    destinationActions: {
      flexDirection: 'row',
      marginTop: 16,
      gap: 12,
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.TEXT_PRIMARY,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateSubtitle: {
      fontSize: 14,
      color: theme.colors.TEXT_SECONDARY,
      textAlign: 'center',
      paddingHorizontal: 40,
      marginBottom: 24,
    },
    emptyStateButton: {
      backgroundColor: theme.colors.ACCENT_COLOR,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    emptyStateButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 24,
      paddingBottom: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 12,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 32,
    },
    modalHeaderContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    modalIconContainer: {
      marginRight: 16,
    },
    modalIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    modalTitleContainer: {
      flex: 1,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 4,
    },
    modalSubtitle: {
      fontSize: 14,
      color: theme.colors.TEXT_SECONDARY,
      fontWeight: '500',
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    formContent: {
      marginBottom: 24,
    },
    inputContainer: {
      marginBottom: 28,
    },
    inputLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    inputIcon: {
      marginRight: 8,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.TEXT_PRIMARY,
    },
    textInput: {
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 16,
      fontSize: 16,
      color: theme.colors.TEXT_PRIMARY,
      borderWidth: 1,
      borderColor: theme.colors.BORDER_COLOR_LIGHT,
      fontWeight: '500',
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    multilineInput: {
      height: 90,
      textAlignVertical: 'top',
    },
    categoryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    categoryOption: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
      borderWidth: 1,
      borderColor: theme.colors.BORDER_COLOR_LIGHT,
    },
    selectedCategory: {
      backgroundColor: theme.colors.ACCENT_COLOR,
      borderColor: theme.colors.ACCENT_COLOR,
    },
    categoryOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.TEXT_SECONDARY,
    },
    selectedCategoryText: {
      color: '#fff',
      fontWeight: '600',
    },
    modalActions: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 24,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.BORDER_COLOR_LIGHT,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.TEXT_SECONDARY,
    },
    saveButton: {
      flex: 1,
      borderRadius: 12,
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    saveButtonGradient: {
      paddingVertical: 16,
      alignItems: 'center',
      borderRadius: 12,
    },
    saveButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonIcon: {
      marginRight: 8,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
    },
  });

  const styles = getStyles();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newDestinationName, setNewDestinationName] = useState('');
  const [newDestinationAddress, setNewDestinationAddress] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Other');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const quickAccessItems: QuickAccessItem[] = [
    {
      id: 'home',
      name: 'Home',
      icon: 'home',
      color: '#3498DB',
      action: () => handleQuickAccess('Home'),
    },
    {
      id: 'work',
      name: 'Work',
      icon: 'briefcase',
      color: '#E74C3C',
      action: () => handleQuickAccess('Work'),
    },
    {
      id: 'favorites',
      name: 'Favorites',
      icon: 'heart',
      color: '#E67E22',
      action: () => handleQuickAccess('Favorites'),
    },
    {
      id: 'recent',
      name: 'Recent',
      icon: 'clock',
      color: '#9B59B6',
      action: () => handleQuickAccess('Recent'),
    },
  ];

  // Load destinations from API
  const loadDestinations = async () => {
    try {
      setIsLoading(true);
      const destinations = await destinationApiService.getDestinations();
      setSavedDestinations(destinations);
    } catch (error) {
      console.error('Error loading destinations:', error);
      Alert.alert('Error', 'Failed to load destinations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh destinations
  const refreshDestinations = async () => {
    try {
      setIsRefreshing(true);
      await loadDestinations();
    } catch (error) {
      console.error('Error refreshing destinations:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load destinations on component mount
  useEffect(() => {
    loadDestinations();
  }, []);

  const handleQuickAccess = async (type: string) => {
    try {
      let destinations: SavedDestination[] = [];
      
      switch (type) {
        case 'Home':
          destinations = savedDestinations.filter(dest => dest.category === 'Home');
          break;
        case 'Work':
          destinations = savedDestinations.filter(dest => dest.category === 'Work');
          break;
        case 'Favorites':
          destinations = savedDestinations.filter(dest => dest.isFavorite);
          break;
        case 'Recent':
          // Sort by lastVisited date, most recent first
          destinations = [...savedDestinations]
            .filter(dest => dest.lastVisited)
            .sort((a, b) => new Date(b.lastVisited!).getTime() - new Date(a.lastVisited!).getTime())
            .slice(0, 5);
          break;
        default:
          destinations = savedDestinations;
      }

      if (destinations.length === 0) {
        Alert.alert(
          'No Destinations', 
          `No ${type.toLowerCase()} destinations found. Add some destinations first!`
        );
        return;
      }

      // Show destination selection
      const destinationNames = destinations.map(dest => dest.name);
      const buttons = destinations.map((dest, index) => ({
        text: dest.name,
        onPress: async () => await handleDestinationPress(dest)
      }));
      buttons.push({ text: 'Cancel', onPress: async () => {} });
      
      Alert.alert(
        'Select Destination',
        `Choose a ${type.toLowerCase()} destination:`,
        buttons
      );
    } catch (error) {
      console.error('Error in quick access:', error);
      Alert.alert('Error', 'Failed to access destinations. Please try again.');
    }
  };

  const handleDestinationPress = async (destination: SavedDestination) => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Needed", "Location permission is required to get directions.");
        return;
      }

      const userLocation = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced 
      });

      const startPoint = {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        name: 'Your Location',
        address: `Lat: ${userLocation.coords.latitude.toFixed(4)}, Lng: ${userLocation.coords.longitude.toFixed(4)}`
      };

      const destPoint = {
        latitude: destination.latitude,
        longitude: destination.longitude,
        name: destination.name,
        address: destination.address
      };

      const routeResult = await getRouteGoogleDirections(
        { lat: startPoint.latitude, lng: startPoint.longitude },
        { lat: destPoint.latitude, lng: destPoint.longitude }
      );

      let routeGeometry = '';
      if (routeResult && routeResult.features && routeResult.features[0] && routeResult.features[0].geometry) {
        routeGeometry = JSON.stringify(routeResult.features[0].geometry.coordinates);
      }

      if (!routeGeometry) {
        Alert.alert('Routing Error', 'No route found to this destination.');
        return;
      }

      router.push({
        pathname: '/mapScreen',
        params: {
          startLat: startPoint.latitude,
          startLng: startPoint.longitude,
          startName: startPoint.name,
          destLat: destPoint.latitude,
          destLng: destPoint.longitude,
          destName: destPoint.name,
          routeGeometry,
        }
      });

    } catch (error) {
      console.error('Error getting directions:', error);
      Alert.alert('Error', 'Could not get directions to this destination.');
    }
  };

  const handleAddDestination = async () => {
    if (!newDestinationName.trim() || !newDestinationAddress.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      // For demo purposes, use mock coordinates
      // In a real app, you would geocode the address
      const destinationData: CreateDestinationRequest = {
        name: newDestinationName.trim(),
        address: newDestinationAddress.trim(),
        latitude: 6.6885, // Mock coordinates
        longitude: -1.6244, // Mock coordinates
        category: selectedCategory,
      };

      const newDestination = await destinationApiService.createDestination(destinationData);
      
      setSavedDestinations([newDestination, ...savedDestinations]);
      setNewDestinationName('');
      setNewDestinationAddress('');
      setSelectedCategory('Other');
      setShowAddModal(false);
      
      Alert.alert('Success', 'Destination added successfully!');
    } catch (error) {
      console.error('Error adding destination:', error);
      Alert.alert('Error', 'Failed to add destination. Please try again.');
    }
  };

  const handleToggleFavorite = async (destinationId: string) => {
    try {
      const updatedDestination = await destinationApiService.toggleFavorite(destinationId);
      
      setSavedDestinations(prev => 
        prev.map(dest => 
          dest.id === destinationId 
            ? { ...dest, isFavorite: updatedDestination.isFavorite }
            : dest
        )
      );
      
      const destination = savedDestinations.find(dest => dest.id === destinationId);
      const action = updatedDestination.isFavorite ? 'added to' : 'removed from';
      Alert.alert('Success', `${destination?.name} ${action} favorites!`);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status. Please try again.');
    }
  };

  const handleDeleteDestination = (destinationId: string) => {
    const destination = savedDestinations.find(dest => dest.id === destinationId);
    
    Alert.alert(
      'Delete Destination',
      `Are you sure you want to delete "${destination?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await destinationApiService.deleteDestination(destinationId);
              setSavedDestinations(prev => prev.filter(dest => dest.id !== destinationId));
              Alert.alert('Success', 'Destination deleted successfully!');
            } catch (error) {
              console.error('Error deleting destination:', error);
              Alert.alert('Error', 'Failed to delete destination. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleFilterChange = async (filter: string) => {
    try {
      setActiveFilter(filter);
      setShowFilters(false);
      
      if (filter === 'favorites') {
        const favoriteDestinations = await destinationApiService.getFavoriteDestinations();
        setSavedDestinations(favoriteDestinations);
      } else if (filter !== 'all') {
        const categoryDestinations = await destinationApiService.getDestinationsByCategory(filter);
        setSavedDestinations(categoryDestinations);
      } else {
        // Reload all destinations
        await loadDestinations();
      }
    } catch (error) {
      console.error('Error filtering destinations:', error);
      Alert.alert('Error', 'Failed to filter destinations. Please try again.');
    }
  };

  const getFilteredDestinations = () => {
    let filtered = savedDestinations.filter(dest =>
      dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeFilter === 'favorites') {
      filtered = filtered.filter(dest => dest.isFavorite);
    } else if (activeFilter !== 'all') {
      filtered = filtered.filter(dest => dest.category === activeFilter);
    }

    return filtered;
  };

  const filteredDestinations = getFilteredDestinations();

  const renderQuickAccessItem = ({ item }: { item: QuickAccessItem }) => (
    <FadeInView delay={item.id === 'home' ? 100 : item.id === 'work' ? 150 : item.id === 'favorites' ? 200 : 250}>
      <AnimatedPressable style={styles.quickAccessItem} onPress={item.action}>
        <LinearGradient
          colors={[item.color, addAlpha(item.color, 0.8)]}
          style={styles.quickAccessIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name={item.icon as any} size={24} color="#fff" />
        </LinearGradient>
        <Text style={styles.quickAccessText}>{item.name}</Text>
      </AnimatedPressable>
    </FadeInView>
  );

  const renderDestinationItem = ({ item, index }: { item: SavedDestination; index: number }) => (
    <FadeInView delay={100 + (index * 50)}>
      <AnimatedPressable style={styles.destinationItem} onPress={() => handleDestinationPress(item)}>
        <View style={styles.destinationContent}>
          <View style={styles.destinationIconContainer}>
            <LinearGradient
              colors={[theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)]}
              style={styles.destinationIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="map-marker" size={20} color="#fff" />
            </LinearGradient>
          </View>
          <View style={styles.destinationTextContainer}>
            <View style={styles.destinationHeader}>
              <Text style={styles.destinationName}>{item.name}</Text>
              {item.isFavorite && (
                <Ionicons name="heart" size={16} color="#E74C3C" />
              )}
            </View>
            <Text style={styles.destinationAddress} numberOfLines={1}>
              {item.address}
            </Text>
            <View style={styles.destinationMeta}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
              {item.lastVisited && (
                <Text style={styles.lastVisitedText}>
                  Last visited: {new Date(item.lastVisited).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        </View>
        <View style={styles.destinationActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleToggleFavorite(item.id)}
          >
            <Ionicons 
              name={item.isFavorite ? "heart" : "heart-outline"} 
              size={18} 
              color={item.isFavorite ? "#E74C3C" : theme.colors.TEXT_SECONDARY} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleDeleteDestination(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color={theme.colors.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>
      </AnimatedPressable>
    </FadeInView>
  );

  const categories = ['Home', 'Work', 'Shopping', 'Education', 'Entertainment', 'Other'];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.BACKGROUND_PRIMARY }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.BACKGROUND_PRIMARY} />
      
      <LinearGradient
        colors={[theme.colors.BACKGROUND_PRIMARY, theme.colors.BACKGROUND_SECONDARY]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Destinations</Text>
          <Text style={styles.headerSubtitle}>Manage your saved places</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <LinearGradient
            colors={[theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)]}
            style={styles.addButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={theme.colors.TEXT_SECONDARY} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destinations..."
            placeholderTextColor={theme.colors.TEXT_TERTIARY}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
              <Ionicons name="close-circle" size={20} color={theme.colors.TEXT_SECONDARY} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={20} color={theme.colors.ACCENT_COLOR} />
        </TouchableOpacity>
      </View>

      {/* Filter Options */}
      {showFilters && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'all' && styles.activeFilterChip]}
              onPress={() => handleFilterChange('all')}
            >
              <Text style={[styles.filterChipText, activeFilter === 'all' && styles.activeFilterChipText]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'favorites' && styles.activeFilterChip]}
              onPress={() => handleFilterChange('favorites')}
            >
              <Text style={[styles.filterChipText, activeFilter === 'favorites' && styles.activeFilterChipText]}>
                Favorites
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.filterChip, activeFilter === category && styles.activeFilterChip]}
                onPress={() => handleFilterChange(category)}
              >
                <Text style={[styles.filterChipText, activeFilter === category && styles.activeFilterChipText]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Quick Access Section */}
      <View style={styles.quickAccessSection}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <FlatList
          data={quickAccessItems}
          renderItem={renderQuickAccessItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickAccessList}
        />
      </View>

      {/* Saved Destinations Section */}
      <View style={styles.destinationsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Destinations</Text>
          <Text style={styles.destinationCount}>{filteredDestinations.length} destinations</Text>
        </View>
        <FlatList
          data={filteredDestinations}
          renderItem={renderDestinationItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.destinationsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="map-marker-off" size={64} color={theme.colors.TEXT_TERTIARY} />
              <Text style={styles.emptyStateTitle}>No destinations found</Text>
              <Text style={styles.emptyStateSubtitle}>
                {searchQuery || activeFilter !== 'all' ? 'Try adjusting your search or filters' : 'Add your first destination to get started'}
              </Text>
              <TouchableOpacity style={styles.emptyStateButton} onPress={() => setShowAddModal(true)}>
                <Text style={styles.emptyStateButtonText}>Add Destination</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      {/* Add Destination Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header with Icon */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalIconContainer}>
                  <LinearGradient
                    colors={[theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)]}
                    style={styles.modalIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialCommunityIcons name="map-marker-plus" size={24} color="#fff" />
                  </LinearGradient>
                </View>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>Add New Destination</Text>
                  <Text style={styles.modalSubtitle}>Save your favorite places for quick access</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={theme.colors.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>

            {/* Form Content */}
            <View style={styles.formContent}>
              <View style={styles.inputContainer}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="location" size={16} color={theme.colors.ACCENT_COLOR} style={styles.inputIcon} />
                  <Text style={styles.inputLabel}>Destination Name</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Home, Work, Coffee Shop"
                  value={newDestinationName}
                  onChangeText={setNewDestinationName}
                  placeholderTextColor={theme.colors.TEXT_TERTIARY}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="navigate" size={16} color={theme.colors.ACCENT_COLOR} style={styles.inputIcon} />
                  <Text style={styles.inputLabel}>Full Address</Text>
                </View>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  placeholder="Enter the complete address"
                  value={newDestinationAddress}
                  onChangeText={setNewDestinationAddress}
                  placeholderTextColor={theme.colors.TEXT_TERTIARY}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="grid" size={16} color={theme.colors.ACCENT_COLOR} style={styles.inputIcon} />
                  <Text style={styles.inputLabel}>Category</Text>
                </View>
                <View style={styles.categoryContainer}>
                  {categories.map((category, index) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        selectedCategory === category && styles.selectedCategory
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        selectedCategory === category && styles.selectedCategoryText
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleAddDestination}
              >
                <LinearGradient
                  colors={[theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)]}
                  style={styles.saveButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.saveButtonContent}>
                    <Ionicons name="checkmark" size={18} color="#fff" style={styles.saveButtonIcon} />
                    <Text style={styles.saveButtonText}>Save Destination</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SavedDestinationsScreen;