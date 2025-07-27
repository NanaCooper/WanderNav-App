import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Pressable,
  Alert,
  Keyboard,
  Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME, addAlpha } from '../constants/theme';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { searchApiService, searchPlacesOpenStreetMap, getRouteOpenRouteService } from '../src/services/api';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedPressable = ({ onPress, style, children, pressableStyle, scaleTo = 0.97, feedbackType = 'scale', androidRippleColor = addAlpha(THEME.TEXT_PRIMARY, 0.05), }: { onPress?: () => void; style?: any; children: React.ReactNode; pressableStyle?: any; scaleTo?: number; feedbackType?: 'scale' | 'opacity'; androidRippleColor?: string; }) => {
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

const SEARCH_TABS = [
  { id: 'places', label: 'Places', icon: 'map-search-outline' },
  { id: 'users', label: 'Users', icon: 'account-search-outline' },
  { id: 'hazards', label: 'Hazards', icon: 'alert-circle-outline' },
] as const;

type SearchTabId = typeof SEARCH_TABS[number]['id'];

interface PlaceResult { type: 'place'; id: string; name: string; address: string; lat?: number; lng?: number; }
interface UserResult { type: 'user'; id: string; name: string; username: string; avatar?: string;}
interface HazardResult { type: 'hazard'; id: string; category: string; description: string; date: string; icon?: string }
type SearchResultItem = PlaceResult | UserResult | HazardResult;

interface LocationPoint { latitude: number; longitude: number; name: string; address?: string; }
const CURRENT_LOCATION_TEXT = "Your Current Location";

const SearchScreen = () => {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<SearchTabId>('places');
  const [startLocationQuery, setStartLocationQuery] = useState(CURRENT_LOCATION_TEXT);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [generalSearchQuery, setGeneralSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const [hasSearchedOnce, setHasSearchedOnce] = useState(false);
  const [selectedStartPoint, setSelectedStartPoint] = useState<LocationPoint | null>(null);
  const [selectedDestinationPoint, setSelectedDestinationPoint] = useState<LocationPoint | null>(null);
  const [activeSearchInput, setActiveSearchInput] = useState<'start' | 'destination' | 'general'>('destination');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const startInputRef = useRef<TextInput>(null);
  const destinationInputRef = useRef<TextInput>(null);
  const generalInputRef = useRef<TextInput>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  type ActiveSearchInputType = 'start' | 'destination' | 'general';

  const performSearch = useCallback(async (query: string, searchContext: ActiveSearchInputType) => {
    if (isSearching) return;
    
    if (!query.trim() || (searchContext === 'start' && query === CURRENT_LOCATION_TEXT && selectedStartPoint)) {
      setSearchResults([]);
      setShowNoResults(false);
      setIsLoading(false);
      return;
    }

    setIsSearching(true);
    setIsLoading(true);
    setShowNoResults(false);
    if (!hasSearchedOnce) setHasSearchedOnce(true);

    try {
      console.log(`🔍 Searching: "${query}" (context: ${searchContext}, tab: ${activeTab})`);
      
      if (activeTab === 'places') {
        console.log('🔍 Searching OpenStreetMap for:', query.trim());
        
        try {
          const osmResults = await searchPlacesOpenStreetMap(query.trim());
          console.log('🔍 OpenStreetMap results:', osmResults);
          
          const convertedResults = osmResults.map((item: any) => ({
            type: 'place',
            id: item.place_id,
            name: item.display_name.split(',')[0],
            address: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }));
          
          console.log('🔍 Converted results:', convertedResults);
          setSearchResults(convertedResults);
          setShowNoResults(convertedResults.length === 0 && query.trim().length > 0);
        } catch (error) {
          console.error('🔍 OpenStreetMap search failed:', error);
          const fallbackResults = [
            { type: 'place', id: 'test1', name: 'Santasi Market', address: 'Santasi, Kumasi, Ghana', lat: 6.6885, lng: -1.6244 },
            { type: 'place', id: 'test2', name: 'Santasi Roundabout', address: 'Santasi, Kumasi, Ghana', lat: 6.6890, lng: -1.6250 },
            { type: 'place', id: 'test3', name: 'Santasi Bus Stop', address: 'Santasi, Kumasi, Ghana', lat: 6.6875, lng: -1.6235 }
          ];
          setSearchResults(fallbackResults);
          setShowNoResults(false);
        }
        
        setIsLoading(false);
      } else {
        const searchParams = {
          query: query.trim(),
          type: activeTab as 'users' | 'hazards',
        };
        
        try {
          const results = await searchApiService.performSearch(searchParams);
          const convertedResults: SearchResultItem[] = results.map((item: any, index: number) => {
            if (activeTab === 'users') {
              return {
                type: 'user',
                id: item.id,
                name: item.name,
                username: item.username || item.name.toLowerCase().replace(/\s+/g, '_'),
                avatar: `https://i.pravatar.cc/80?u=${item.id}`
              };
            } else {
              return {
                type: 'hazard',
                id: item.id,
                category: item.hazardType || 'Report',
                description: item.description || `Hazard near ${item.name}`,
                date: new Date().toISOString().split('T')[0],
                icon: 'alert-outline'
              };
            }
          });
          setSearchResults(convertedResults);
          setShowNoResults(convertedResults.length === 0 && query.trim().length > 0);
        } catch (error) {
          console.error('🔍 Backend search failed:', error);
          let fallbackResults: SearchResultItem[] = [];
          if (activeTab === 'users') {
            fallbackResults = [{ type: 'user', id: 'u-' + query, name: `${query} User`, username: `${query.toLowerCase()}_tag`, avatar: `https://i.pravatar.cc/80?u=${query}` }];
          } else if (activeTab === 'hazards') {
            fallbackResults = [{ type: 'hazard', id: 'h-' + query, category: 'Report', description: `Hazard near ${query}`, date: '2024-01-15', icon: 'alert-outline' }];
          }
          setSearchResults(fallbackResults);
          setShowNoResults(fallbackResults.length === 0 && query.trim().length > 0);
        }
        
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error('Search API error:', error);
      let fallbackResults: SearchResultItem[] = [];
      
      if (activeTab === 'places') {
        if (query.toLowerCase().includes('park')) {
          fallbackResults = [
            { type: 'place', id: 'p1', name: `${query} Central Park`, address: '123 Main St', lat: 34.0522, lng: -118.2437 },
            { type: 'place', id: 'p2', name: `Community ${query}side`, address: '456 Oak Ave', lat: 34.0550, lng: -118.2500 }
          ];
        } else if (query.toLowerCase().includes('coffee')) {
          fallbackResults = [{ type: 'place', id: 'p3', name: `The ${query} Spot`, address: '789 Pine Ln', lat: 34.0500, lng: -118.2400 }];
        } else if (query.length > 1) {
          fallbackResults = [{ type: 'place', id: 'p-generic-' + query, name: `Place for ${query}`, address: 'Some Address', lat: 34.0511, lng: -118.2411 }];
        }
      } else if (activeTab === 'users') {
        fallbackResults = query.length > 1 ? [{ type: 'user', id: 'u-' + query, name: `${query} User`, username: `${query.toLowerCase()}_tag`, avatar: `https://i.pravatar.cc/80?u=${query}` }] : [];
      } else if (activeTab === 'hazards') {
        fallbackResults = query.length > 1 ? [{ type: 'hazard', id: 'h-' + query, category: 'Report', description: `Hazard near ${query}`, date: '2024-01-15', icon: 'alert-outline' }] : [];
      }
      
      setSearchResults(fallbackResults);
      setShowNoResults(fallbackResults.length === 0 && query.trim().length > 0);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [activeTab, selectedStartPoint, hasSearchedOnce, isSearching]);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      const currentQuery = activeSearchInput === 'start' ? startLocationQuery : activeSearchInput === 'destination' ? destinationQuery : generalSearchQuery;
      if (currentQuery.trim().length > 0) {
        performSearch(currentQuery, activeSearchInput);
      }
    }, 300);
    return () => { if (debounceTimeout.current) clearTimeout(debounceTimeout.current); };
  }, [activeTab, startLocationQuery, destinationQuery, generalSearchQuery, activeSearchInput, selectedStartPoint, performSearch]);

  const handleTabChange = (tabId: SearchTabId) => {
    setActiveTab(tabId);
    setSearchResults([]);
    setShowNoResults(false);
    setHasSearchedOnce(false);
    setIsLoading(false);
    
    if (tabId === 'places') {
      setActiveSearchInput('destination');
      destinationInputRef.current?.focus();
    } else {
      setActiveSearchInput('general');
      generalInputRef.current?.focus();
    }
  };

  const handleClearInput = (inputType: ActiveSearchInputType) => {
    switch (inputType) {
      case 'start':
        setStartLocationQuery('');
        setSelectedStartPoint(null);
        break;
      case 'destination':
        setDestinationQuery('');
        setSelectedDestinationPoint(null);
        break;
      case 'general':
        setGeneralSearchQuery('');
        break;
    }
    setSearchResults([]);
    setShowNoResults(false);
    setHasSearchedOnce(false);
  };

  const onSearchResultPress = async (item: SearchResultItem) => {
    console.log('🔍 onSearchResultPress called with item:', item);
    console.log('🔍 Current activeTab:', activeTab);
    console.log('🔍 isLoading:', isLoading);
    
    if (isLoading) {
      console.log('�� Blocked by loading state');
      return;
    }
    
    Keyboard.dismiss();
    
    if (item.type === 'place' && activeTab === 'places') {
      console.log('🔍 Processing place item:', item);
      const placeItem = item as PlaceResult;
      
      if (!placeItem.lat || !placeItem.lng) {
        console.log('🔍 Missing coordinates for place:', placeItem);
        Alert.alert("Location Data Missing", "This place doesn't have coordinates.");
        return;
      }
      
      // Set the destination point when a place is selected
      const destPoint = {
        latitude: placeItem.lat,
        longitude: placeItem.lng,
        name: placeItem.name,
        address: placeItem.address
      };
      
      setSelectedDestinationPoint(destPoint);
      setDestinationQuery(placeItem.name);
      
      // Always set current location as start point when destination is selected
      try {
        console.log('🔍 Getting current location for start point...');
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const userLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          console.log('🔍 Current location obtained:', userLocation.coords);
          
          const startPoint = {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
            name: 'Your Location',
            address: `Lat: ${userLocation.coords.latitude.toFixed(4)}, Lng: ${userLocation.coords.longitude.toFixed(4)}`
          };
          setSelectedStartPoint(startPoint);
          setStartLocationQuery('Your Current Location');
          console.log('🔍 Start point set:', startPoint);
        } else {
          console.log('🔍 Location permission denied');
          Alert.alert("Permission Needed", "Location permission is required to get directions.");
          return;
        }
      } catch (error) {
        console.error('🔍 Error getting current location:', error);
        Alert.alert("Location Error", "Could not get your current location. Please try again.");
        return;
      }
      
      // Show success message
      Alert.alert(
        'Destination Selected',
        `${placeItem.name} has been set as your destination. Tap "Get Directions" to start navigation.`,
        [{ text: 'OK' }]
      );
      return;
    } else if (item.type === 'user') {
      console.log('�� Navigating to user profile:', item.id);
      router.push(`/userProfile/${item.id}`);
    } else if (item.type === 'hazard') {
      console.log('🔍 Navigating to hazard details:', item.id);
      router.push(`/hazardDetails/${item.id}`);
    } else {
      console.log('🔍 Unhandled item type:', item.type);
    }
  };

  const handleGetDirections = async () => {
    console.log('🔍 Get Directions button pressed');
    console.log('🔍 Selected start point:', selectedStartPoint);
    console.log('🔍 Selected destination point:', selectedDestinationPoint);
    
    if (isLoading) {
      console.log('🔍 Already loading, ignoring press');
      return;
    }
    
    if (!selectedStartPoint) {
      console.log('🔍 No start point selected');
      Alert.alert("Start Location Needed", "Please select a starting point.", [{ 
        text: "OK", 
        onPress: () => { 
          setActiveSearchInput('start'); 
          startInputRef.current?.focus(); 
        }
      }]);
      return;
    }
    if (!selectedDestinationPoint) {
      console.log('🔍 No destination point selected');
      Alert.alert("Destination Needed", "Please select a destination point.", [{ 
        text: "OK", 
        onPress: () => {
          setActiveSearchInput('destination'); 
          destinationInputRef.current?.focus(); 
        }
      }]);
      return;
    }
    
    console.log("🔍 Routing from:", selectedStartPoint.name, "to:", selectedDestinationPoint.name);
    console.log("🔍 Start coordinates:", selectedStartPoint.latitude, selectedStartPoint.longitude);
    console.log("🔍 Destination coordinates:", selectedDestinationPoint.latitude, selectedDestinationPoint.longitude);
    
    setIsLoading(true);
    
    try {
      console.log('🔍 Calling OpenRouteService...');
      const routeResult = await getRouteOpenRouteService(
        { lat: selectedStartPoint.latitude, lng: selectedStartPoint.longitude },
        { lat: selectedDestinationPoint.latitude, lng: selectedDestinationPoint.longitude }
      );
      
      console.log('🔍 Route result received:', routeResult);
      
      let routeGeometry = '';
      if (routeResult && routeResult.features && routeResult.features[0] && routeResult.features[0].geometry) {
        routeGeometry = JSON.stringify(routeResult.features[0].geometry.coordinates);
        console.log('🔍 Route geometry extracted:', routeGeometry.substring(0, 100) + '...');
      }
      
      setIsLoading(false);
      
      if (!routeGeometry) {
        console.log('🔍 No route geometry found');
        Alert.alert('Routing Error', 'No route found between the selected points.');
        return;
      }
      
      console.log('🔍 Navigating to mapScreen with params:', {
        startLat: selectedStartPoint.latitude,
        startLng: selectedStartPoint.longitude,
        startName: selectedStartPoint.name,
        destLat: selectedDestinationPoint.latitude,
        destLng: selectedDestinationPoint.longitude, 
        destName: selectedDestinationPoint.name,
        routeGeometry: routeGeometry.substring(0, 50) + '...',
      });
      
      router.push({
        pathname: '/mapScreen',
        params: {
          startLat: selectedStartPoint.latitude,
          startLng: selectedStartPoint.longitude,
          startName: selectedStartPoint.name,
          destLat: selectedDestinationPoint.latitude,
          destLng: selectedDestinationPoint.longitude, 
          destName: selectedDestinationPoint.name,
          routeGeometry,
        }
      });
      
      console.log('🔍 Navigation to mapScreen triggered');
      
    } catch (error) {
      console.error('🔍 Error in handleGetDirections:', error);
      setIsLoading(false);
      Alert.alert('Routing Error', 'Could not get directions. Please try again.');
    }
  };

  const renderResultItem = ({ item }: { item: SearchResultItem }) => {
    const commonPressableStyle = styles.resultItemPressable;
    const commonItemStyle = styles.resultItem;
    let onPressAction = () => {
      console.log('🔍 Result item pressed:', item);
      onSearchResultPress(item);
    };
    let iconName: any = "map-marker-outline";
    let iconColor = THEME.ACCENT_COLOR;
    let iconBgColor = addAlpha(THEME.ACCENT_COLOR, 0.1);

    switch (item.type) {
      case 'user':
        iconName = "account-circle-outline";
        iconColor = THEME.PRIMARY_BRAND_COLOR;
        iconBgColor = addAlpha(THEME.PRIMARY_BRAND_COLOR, 0.1);
        break;
      case 'hazard':
        iconName = (item.icon as any) || 'alert-circle-outline';
        iconColor = THEME.ERROR_COLOR;
        iconBgColor = addAlpha(THEME.ERROR_COLOR, 0.1);
        break;
      case 'place':
        break;
    }

    return (
      <FadeInView delay={50} duration={200}>
        <TouchableOpacity 
          style={[commonItemStyle, commonPressableStyle]} 
          onPress={onPressAction}
          activeOpacity={0.7}
        >
          {item.type === 'user' && item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.resultItemAvatar} />
          ) : (
            <View style={[styles.resultItemIconContainer, { backgroundColor: iconBgColor }]}>
              <MaterialCommunityIcons name={iconName} size={26} color={iconColor} />
            </View>
          )}
          <View style={styles.resultItemTextContainer}>
            <Text style={styles.resultItemTitle} numberOfLines={1}>
              {item.type === 'hazard' ? `${item.category} - ${item.date}` : item.name}
            </Text>
            <Text style={styles.resultItemSubtitle} numberOfLines={item.type === 'hazard' ? 2 : 1}>
              {item.type === 'place' ? item.address : item.type === 'user' ? `@${item.username}` : item.type === 'hazard' ? item.description : ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={THEME.TEXT_TERTIARY} />
        </TouchableOpacity>
      </FadeInView>
    );
  };

  let displayedQueryForNoResults = '';
  if (activeTab === 'places') {
    displayedQueryForNoResults = activeSearchInput === 'start' ? startLocationQuery : destinationQuery;
  } else {
    displayedQueryForNoResults = generalSearchQuery;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: THEME.BACKGROUND_PRIMARY }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? (Dimensions.get('window').height > 800 ? 90 : 70) : 0}
    >
      <LinearGradient
        colors={[THEME.BACKGROUND_PRIMARY, '#f8fafc']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Search</Text>
          <Text style={styles.headerSubtitle}>Find places, users, and hazards</Text>
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
          <Ionicons name="options-outline" size={20} color={THEME.TEXT_SECONDARY} />
        </TouchableOpacity>
      </View>

      {/* Search Inputs */}
      {activeTab === 'places' && (
        <View style={styles.searchSection}>
          <FadeInView delay={50} style={styles.searchContainer}>
            <View style={[styles.searchInputContainer, activeSearchInput === 'start' && styles.activeSearchInput]}>
              <MaterialCommunityIcons
                name="ray-start-arrow"
                size={20}
                color={selectedStartPoint ? THEME.ACCENT_COLOR : THEME.TEXT_TERTIARY}
                style={styles.searchIcon}
              />
              <TextInput
                ref={startInputRef}
                style={styles.searchInput}
                placeholder="Start location"
                placeholderTextColor={THEME.TEXT_TERTIARY}
                value={startLocationQuery}
                onChangeText={setStartLocationQuery}
                onFocus={() => setActiveSearchInput('start')}
                onBlur={() => setActiveSearchInput('destination')}
              />
              {startLocationQuery && startLocationQuery !== CURRENT_LOCATION_TEXT && (
                <TouchableOpacity onPress={() => handleClearInput('start')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={18} color={THEME.TEXT_TERTIARY} />
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.searchInputContainer, activeSearchInput === 'destination' && styles.activeSearchInput]}>
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color={selectedDestinationPoint ? THEME.ACCENT_COLOR : THEME.TEXT_TERTIARY}
                style={styles.searchIcon}
              />
              <TextInput
                ref={destinationInputRef}
                style={styles.searchInput}
                placeholder="Where to?"
                placeholderTextColor={THEME.TEXT_TERTIARY}
                value={destinationQuery}
                onChangeText={setDestinationQuery}
                onFocus={() => setActiveSearchInput('destination')}
              />
              {destinationQuery && (
                <TouchableOpacity onPress={() => handleClearInput('destination')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={18} color={THEME.TEXT_TERTIARY} />
                </TouchableOpacity>
              )}
            </View>
          </FadeInView>
        </View>
      )}

      {/* General Search Input */}
      {activeTab !== 'places' && (
        <View style={styles.searchSection}>
          <FadeInView delay={50} style={styles.searchContainer}>
            <View style={[styles.searchInputContainer, styles.generalSearchInput]}>
              <Ionicons name="search-outline" size={20} color={THEME.TEXT_TERTIARY} style={styles.searchIcon} />
              <TextInput
                ref={generalInputRef}
                style={styles.searchInput}
                placeholder={`Search ${activeTab}...`}
                placeholderTextColor={THEME.TEXT_TERTIARY}
                value={generalSearchQuery}
                onChangeText={setGeneralSearchQuery}
                onFocus={() => setActiveSearchInput('general')}
              />
              {generalSearchQuery && (
                <TouchableOpacity onPress={() => handleClearInput('general')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={18} color={THEME.TEXT_TERTIARY} />
                </TouchableOpacity>
              )}
            </View>
          </FadeInView>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {SEARCH_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, activeTab === tab.id && styles.activeTabButton]}
            onPress={() => handleTabChange(tab.id)}
          >
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.id ? THEME.ACCENT_COLOR : THEME.TEXT_SECONDARY}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Debug Info */}
      {__DEV__ && (
        <View style={{ padding: 10, backgroundColor: '#f0f0f0', margin: 10 }}>
          <Text>Debug: activeTab={activeTab}, selectedDest={!!selectedDestinationPoint}, destName={selectedDestinationPoint?.name}</Text>
        </View>
      )}

      {/* Get Directions Button */}
      {activeTab === 'places' && selectedDestinationPoint && (
        <View style={styles.directionsButtonContainer}>
          <TouchableOpacity 
            style={styles.directionsButton} 
            onPress={() => {
              console.log('🔍 Get Directions button pressed!');
              handleGetDirections();
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="directions" size={24} color="#fff" />
            <Text style={styles.directionsButtonText}>Get Directions</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Indicator */}
      {isLoading && searchResults.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.ACCENT_COLOR} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={searchResults}
            renderItem={renderResultItem}
            keyExtractor={(item) => item.type + '-' + item.id}
            contentContainerStyle={styles.resultsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* No Results */}
      {!isLoading && searchResults.length === 0 && hasSearchedOnce && (
        <FadeInView style={styles.emptyContainer}>
          <MaterialCommunityIcons name="magnify-scan" size={60} color={THEME.TEXT_TERTIARY} />
          <Text style={styles.emptyTitle}>No Results</Text>
          <Text style={styles.emptyText}>
            Couldn't find anything for "{displayedQueryForNoResults}". Try a different search?
          </Text>
        </FadeInView>
      )}

      {/* Initial State */}
      {!isLoading && searchResults.length === 0 && !hasSearchedOnce && (
        <FadeInView style={styles.initialContainer}>
          {activeTab === 'places' ? (
            <>
              <MaterialCommunityIcons name="routes" size={60} color={THEME.TEXT_TERTIARY} />
              <Text style={styles.initialTitle}>Plan Your Journey</Text>
              <Text style={styles.initialText}>
                Search for a starting point and your destination to get directions.
              </Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons 
                name={activeTab === 'users' ? "account-group-outline" : "alert-decagram-outline"} 
                size={60} 
                color={THEME.TEXT_TERTIARY} 
              />
              <Text style={styles.initialTitle}>
                {activeTab === 'users' ? 'Find Users' : 'Report Hazards'}
              </Text>
              <Text style={styles.initialText}>
                {activeTab === 'users' ? 'Search for users by name or username.' : 'Search for reported hazards.'}
              </Text>
            </>
          )}
        </FadeInView>
      )}

      {/* Filter Modal */}
      <Modal visible={showFilterModal} animationType="slide" transparent onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter & Sort</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={THEME.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Filter and sort options coming soon!
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowFilterModal(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: THEME.BACKGROUND_SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER_COLOR_LIGHT,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.TEXT_PRIMARY,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: THEME.TEXT_SECONDARY,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.BACKGROUND_SECONDARY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.BORDER_COLOR_LIGHT,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchContainer: {
    gap: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.BACKGROUND_SURFACE,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: THEME.BORDER_COLOR_LIGHT,
  },
  activeSearchInput: {
    borderColor: THEME.ACCENT_COLOR,
    borderWidth: 2,
  },
  generalSearchInput: {
    backgroundColor: THEME.BACKGROUND_SURFACE,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: THEME.TEXT_PRIMARY,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 15,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: THEME.BACKGROUND_SECONDARY,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTabButton: {
    backgroundColor: addAlpha(THEME.ACCENT_COLOR, 0.1),
    borderColor: THEME.ACCENT_COLOR,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: THEME.TEXT_SECONDARY,
  },
  activeTabText: {
    color: THEME.ACCENT_COLOR,
    fontWeight: '600',
  },
  directionsButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: THEME.BACKGROUND_SURFACE,
    borderTopWidth: 1,
    borderTopColor: THEME.BORDER_COLOR_LIGHT,
  },
  directionsButton: {
    backgroundColor: THEME.ACCENT_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: THEME.ACCENT_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  directionsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: THEME.TEXT_SECONDARY,
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsList: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  resultItemPressable: {
    marginBottom: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.BACKGROUND_SURFACE,
    padding: 16,
    borderRadius: 12,
    shadowColor: THEME.SHADOW_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: THEME.BORDER_COLOR_LIGHT,
  },
  resultItemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  resultItemAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    backgroundColor: THEME.BORDER_COLOR,
  },
  resultItemTextContainer: {
    flex: 1,
  },
  resultItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.TEXT_PRIMARY,
    marginBottom: 4,
  },
  resultItemSubtitle: {
    fontSize: 14,
    color: THEME.TEXT_SECONDARY,
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.TEXT_PRIMARY,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: THEME.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
  initialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  initialTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.TEXT_PRIMARY,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  initialText: {
    fontSize: 16,
    color: THEME.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.BACKGROUND_SURFACE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.TEXT_PRIMARY,
  },
  modalSubtitle: {
    fontSize: 16,
    color: THEME.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: THEME.ACCENT_COLOR,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SearchScreen;