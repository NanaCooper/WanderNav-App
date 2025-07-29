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
  ScrollView,
  StatusBar,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { addAlpha } from '../constants/theme';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { API_BASE_URL, searchApiService, searchPlacesOpenStreetMap, getRouteGoogleDirections, userApiService, groupApiService, UserSearchResponse, GroupCreationRequest } from '../src/services/api';
import { authService } from '../src/services/auth';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';

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
  const { theme } = useTheme();
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
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  
  // Filter states
  const [filterDistance, setFilterDistance] = useState<number>(10);
  const [filterRating, setFilterRating] = useState<number>(0);
  const [filterOpenNow, setFilterOpenNow] = useState<boolean>(false);
  const [filterPriceRange, setFilterPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [userFilterOnline, setUserFilterOnline] = useState<boolean>(false);
  const [userFilterVerified, setUserFilterVerified] = useState<boolean>(false);
  const [hazardFilterSeverity, setHazardFilterSeverity] = useState<string>('all');
  const [hazardFilterDate, setHazardFilterDate] = useState<string>('all');

  const startInputRef = useRef<TextInput>(null);
  const destinationInputRef = useRef<TextInput>(null);
  const generalInputRef = useRef<TextInput>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  type ActiveSearchInputType = 'start' | 'destination' | 'general';

  // Generate styles with theme
  const getStyles = () => StyleSheet.create({
    header: {
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingBottom: 20,
      backgroundColor: theme.colors.BACKGROUND_PRIMARY,
    },
    headerGradient: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderRadius: 0,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerIcon: {
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 2,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.colors.TEXT_SECONDARY,
      lineHeight: 18,
    },
    filterButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    filterButtonGradient: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: addAlpha(theme.colors.ACCENT_COLOR, 0.2),
    },
    searchSection: {
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    searchContainer: {
      gap: 12,
    },
    searchInputContainer: {
      borderRadius: 12,
      height: 52,
      borderWidth: 1,
      borderColor: theme.colors.BORDER_COLOR_LIGHT,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    searchInputGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      height: '100%',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.BORDER_COLOR_LIGHT,
    },
    activeSearchInput: {
      borderColor: theme.colors.ACCENT_COLOR,
      borderWidth: 2,
    },
    generalSearchInput: {
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.TEXT_PRIMARY,
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
      borderRadius: 12,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    tabButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    activeTabButton: {
      borderColor: theme.colors.ACCENT_COLOR,
    },
    tabText: {
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.TEXT_SECONDARY,
    },
    activeTabText: {
      color: theme.colors.ACCENT_COLOR,
      fontWeight: '600',
    },
    directionsButtonContainer: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderTopWidth: 1,
      borderTopColor: theme.colors.BORDER_COLOR_LIGHT,
    },
    directionsButton: {
      borderRadius: 12,
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    directionsButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
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
    loadingGradient: {
      padding: 30,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: addAlpha(theme.colors.ACCENT_COLOR, 0.2),
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.TEXT_PRIMARY,
      fontWeight: '600',
    },
    loadingSubtext: {
      marginTop: 4,
      fontSize: 14,
      color: theme.colors.TEXT_SECONDARY,
      textAlign: 'center',
    },
    resultsContainer: {
      flex: 1,
    },
    resultsContainerUsers: {
      marginBottom: 20,
    },
    usersTabContainer: {
      flex: 1,
      paddingBottom: 20,
    },
    userSearchResultsContainer: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 20,
      backgroundColor: theme.colors.BACKGROUND_PRIMARY,
      borderTopWidth: 1,
      borderTopColor: theme.colors.BORDER_COLOR_LIGHT,
    },
    userSearchResultsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    userSearchResultsList: {
      paddingBottom: 10,
    },
    userNoResultsContainer: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 30,
      backgroundColor: theme.colors.BACKGROUND_PRIMARY,
      borderTopWidth: 1,
      borderTopColor: theme.colors.BORDER_COLOR_LIGHT,
    },
    userNoResultsContent: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    userNoResultsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.TEXT_PRIMARY,
      marginTop: 16,
      marginBottom: 8,
    },
    userNoResultsText: {
      fontSize: 14,
      color: theme.colors.TEXT_SECONDARY,
      textAlign: 'center',
      lineHeight: 20,
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
      borderRadius: 12,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
      borderWidth: 1,
      borderColor: theme.colors.BORDER_COLOR_LIGHT,
    },
    resultItemGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
    },
    resultItemIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    userAvatarContainer: {
      position: 'relative',
      marginRight: 16,
    },
    resultItemAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.BORDER_COLOR,
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#4CAF50',
      borderWidth: 2,
      borderColor: theme.colors.BACKGROUND_SURFACE,
    },
    resultItemTextContainer: {
      flex: 1,
    },
    resultItemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 4,
    },
    resultItemSubtitle: {
      fontSize: 14,
      color: theme.colors.TEXT_SECONDARY,
      lineHeight: 18,
    },
    userActionsContainer: {
      flexDirection: 'row',
      marginTop: 8,
      gap: 8,
    },
    userActionButton: {
      borderRadius: 8,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    userActionGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    userActionText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
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
      color: theme.colors.TEXT_PRIMARY,
      marginTop: 20,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.TEXT_SECONDARY,
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
      color: theme.colors.TEXT_PRIMARY,
      marginTop: 20,
      marginBottom: 12,
      textAlign: 'center',
    },
    initialText: {
      fontSize: 16,
      color: theme.colors.TEXT_SECONDARY,
      textAlign: 'center',
      lineHeight: 22,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 24,
      paddingBottom: 40,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    modalTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    modalTitleIcon: {
      marginRight: 12,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.TEXT_PRIMARY,
    },
    modalCloseButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: addAlpha(theme.colors.TEXT_SECONDARY, 0.1),
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalSubtitle: {
      fontSize: 16,
      color: theme.colors.TEXT_SECONDARY,
      textAlign: 'center',
      marginBottom: 24,
    },
    modalButton: {
      backgroundColor: theme.colors.ACCENT_COLOR,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    modalButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    groupSection: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      marginBottom: 0,
    },
    groupListContainer: {
      gap: 8,
    },
    groupSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    groupSectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.TEXT_PRIMARY,
    },
    createGroupButton: {
      borderRadius: 8,
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    createGroupGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    createGroupText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    emptyGroupsContainer: {
      alignItems: 'center',
      paddingVertical: 20,
      paddingBottom: 30,
    },
    emptyGroupsGradient: {
      alignItems: 'center',
      padding: 30,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: addAlpha(theme.colors.ACCENT_COLOR, 0.2),
    },
    emptyGroupsText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.TEXT_PRIMARY,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyGroupsSubtext: {
      fontSize: 14,
      color: theme.colors.TEXT_SECONDARY,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    createFirstGroupButton: {
      borderRadius: 12,
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    createFirstGroupGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
    },
    createFirstGroupText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    groupItem: {
      borderRadius: 12,
      marginBottom: 8,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
      borderWidth: 1,
      borderColor: theme.colors.BORDER_COLOR_LIGHT,
      overflow: 'hidden',
    },
    groupItemGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
    },
    groupItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingVertical: 4,
    },
    groupIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: addAlpha(theme.colors.ACCENT_COLOR, 0.1),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    groupItemText: {
      flex: 1,
      marginRight: 8,
    },
    groupItemName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 2,
    },
    groupItemMembers: {
      fontSize: 14,
      color: theme.colors.TEXT_SECONDARY,
    },
    floatingActionButton: {
      position: 'absolute',
      bottom: 32,
      right: 32,
      borderRadius: 28,
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    floatingActionButtonGradient: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    groupModalContent: {
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxHeight: '90%',
      marginHorizontal: 0,
    },
    groupNameInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 52,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.BORDER_COLOR_LIGHT,
    },
    inputIcon: {
      marginRight: 12,
    },
    groupNameInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.TEXT_PRIMARY,
      height: '100%',
    },
    selectUsersTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 12,
    },
    groupItemActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginLeft: 'auto',
    },
    groupActionButton: {
      borderRadius: 8,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    groupActionGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    groupActionText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    createGroupModalButton: {
      borderRadius: 12,
      marginBottom: 8,
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    createGroupModalGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
    },
    createGroupModalText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
      marginLeft: 8,
    },
    // Filter Modal Styles
    modalScrollView: {
      maxHeight: 400,
    },
    filterSection: {
      marginBottom: 24,
    },
    filterSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 12,
    },
    sortOptionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    sortOption: {
      borderRadius: 8,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    sortOptionActive: {
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOpacity: 0.3,
      elevation: 4,
    },
    sortOptionGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    sortOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.TEXT_SECONDARY,
      marginLeft: 6,
    },
    sortOptionTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    sliderContainer: {
      marginBottom: 8,
    },
    sliderValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.TEXT_PRIMARY,
      textAlign: 'center',
      marginBottom: 12,
    },
    sliderTrack: {
      height: 4,
      backgroundColor: theme.colors.BORDER_COLOR_LIGHT,
      borderRadius: 2,
      position: 'relative',
      marginBottom: 8,
    },
    sliderFill: {
      height: '100%',
      backgroundColor: theme.colors.ACCENT_COLOR,
      borderRadius: 2,
    },
    sliderThumb: {
      position: 'absolute',
      top: -6,
      width: 16,
      height: 16,
      backgroundColor: theme.colors.ACCENT_COLOR,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#fff',
    },
    sliderLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    sliderLabel: {
      fontSize: 12,
      color: theme.colors.TEXT_TERTIARY,
    },
    ratingContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    ratingOption: {
      padding: 4,
    },
    priceOptionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    priceOption: {
      borderRadius: 8,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    priceOptionActive: {
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOpacity: 0.3,
      elevation: 4,
    },
    priceOptionGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    priceOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.TEXT_SECONDARY,
      marginLeft: 6,
    },
    priceOptionTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    toggleLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    toggleLabel: {
      fontSize: 16,
      color: theme.colors.TEXT_PRIMARY,
      marginLeft: 12,
    },
    toggleButton: {
      width: 48,
      height: 24,
      backgroundColor: theme.colors.BORDER_COLOR_LIGHT,
      borderRadius: 12,
      padding: 2,
    },
    toggleButtonActive: {
      backgroundColor: theme.colors.ACCENT_COLOR,
    },
    toggleThumb: {
      width: 20,
      height: 20,
      backgroundColor: '#fff',
      borderRadius: 10,
    },
    toggleThumbActive: {
      transform: [{ translateX: 24 }],
    },
    severityOptionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    severityOption: {
      borderRadius: 8,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    severityOptionActive: {
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOpacity: 0.3,
      elevation: 4,
    },
    severityOptionGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    severityOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.TEXT_SECONDARY,
      marginLeft: 6,
    },
    severityOptionTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    dateOptionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    dateOption: {
      borderRadius: 8,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    dateOptionActive: {
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOpacity: 0.3,
      elevation: 4,
    },
    dateOptionGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    dateOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.TEXT_SECONDARY,
      marginLeft: 6,
    },
    dateOptionTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.BORDER_COLOR_LIGHT,
    },
    resetButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.BORDER_COLOR_LIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resetButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.TEXT_SECONDARY,
    },
    applyButton: {
      flex: 2,
      borderRadius: 8,
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    applyButtonGradient: {
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
  });

  const styles = getStyles();

  const performSearch = useCallback(async (query: string, searchContext: ActiveSearchInputType) => {
    if (isSearching) return;
    
    const trimmedQuery = query.trim();
    if (!trimmedQuery || (searchContext === 'start' && query === CURRENT_LOCATION_TEXT && selectedStartPoint)) {
      setSearchResults([]);
      setShowNoResults(false);
      setIsLoading(false);
      return;
    }

    // Minimum query length for meaningful search
    if (trimmedQuery.length < 2) {
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
      } else if (activeTab === 'users') {
        try {
          console.log('👥 Searching users with query:', query.trim());
          const users = await userApiService.searchUsers(query.trim());
          console.log('👥 Received users from backend:', users);
          
          if (users.length === 0) {
            // If backend returns empty array (likely due to 403), use fallback data
            console.log('👥 Backend returned empty users, using fallback data');
            const fallbackUsers = [
              { type: 'user', id: 'demo1', name: 'John Doe', username: 'john_doe', email: 'john@example.com', avatar: 'https://i.pravatar.cc/80?u=demo1' },
              { type: 'user', id: 'demo2', name: 'Jane Smith', username: 'jane_smith', email: 'jane@example.com', avatar: 'https://i.pravatar.cc/80?u=demo2' },
              { type: 'user', id: 'demo3', name: 'Mike Johnson', username: 'mike_j', email: 'mike@example.com', avatar: 'https://i.pravatar.cc/80?u=demo3' },
              { type: 'user', id: 'demo4', name: 'Sarah Wilson', username: 'sarah_w', email: 'sarah@example.com', avatar: 'https://i.pravatar.cc/80?u=demo4' },
              { type: 'user', id: 'demo5', name: 'David Brown', username: 'david_b', email: 'david@example.com', avatar: 'https://i.pravatar.cc/80?u=demo5' }
            ].filter(user => 
              user.name.toLowerCase().includes(query.toLowerCase()) ||
              user.username.toLowerCase().includes(query.toLowerCase())
            );
            
            console.log('👥 Using fallback user data:', fallbackUsers);
            setSearchResults(fallbackUsers);
            setShowNoResults(fallbackUsers.length === 0);
          } else {
            const convertedResults = users.map((user: UserSearchResponse) => ({
              type: 'user',
              id: user.id,
              name: user.username,
              username: user.username,
              email: user.email,
              avatar: `https://i.pravatar.cc/80?u=${user.id}`
            }));
            
            console.log('👥 Converted user results:', convertedResults);
            setSearchResults(convertedResults);
            setShowNoResults(convertedResults.length === 0 && query.trim().length > 0);
          }
        } catch (error) {
          // Only log non-403 errors to reduce noise
          if (!(error instanceof Error && error.message.includes('Access denied'))) {
            console.error('👥 User search failed:', error);
          }
          
          // Provide fallback data for demo purposes
          const fallbackUsers = [
            { type: 'user', id: 'demo1', name: 'John Doe', username: 'john_doe', email: 'john@example.com', avatar: 'https://i.pravatar.cc/80?u=demo1' },
            { type: 'user', id: 'demo2', name: 'Jane Smith', username: 'jane_smith', email: 'jane@example.com', avatar: 'https://i.pravatar.cc/80?u=demo2' },
            { type: 'user', id: 'demo3', name: 'Mike Johnson', username: 'mike_j', email: 'mike@example.com', avatar: 'https://i.pravatar.cc/80?u=demo3' },
            { type: 'user', id: 'demo4', name: 'Sarah Wilson', username: 'sarah_w', email: 'sarah@example.com', avatar: 'https://i.pravatar.cc/80?u=demo4' },
            { type: 'user', id: 'demo5', name: 'David Brown', username: 'david_b', email: 'david@example.com', avatar: 'https://i.pravatar.cc/80?u=demo5' }
          ].filter(user => 
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.username.toLowerCase().includes(query.toLowerCase())
          );
          
          if (fallbackUsers.length > 0) {
            console.log('👥 Using fallback user data:', fallbackUsers);
            setSearchResults(fallbackUsers);
            setShowNoResults(false);
          } else {
            Alert.alert(
              "Search Error", 
              "Unable to load users. Please check your connection and try again.",
              [{ text: "OK" }]
            );
            setSearchResults([]);
            setShowNoResults(true);
          }
        }
        setIsLoading(false);
        return;
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
    
    const currentQuery = activeSearchInput === 'start' ? startLocationQuery : activeSearchInput === 'destination' ? destinationQuery : generalSearchQuery;
    
    // Only search if query has meaningful content
    if (currentQuery.trim().length >= 2) {
      debounceTimeout.current = setTimeout(() => {
        performSearch(currentQuery, activeSearchInput);
      }, 200); // Reduced debounce time for faster response
    } else if (currentQuery.trim().length === 0) {
      // Clear results immediately when query is empty
      setSearchResults([]);
      setShowNoResults(false);
      setIsLoading(false);
    }
    
    return () => { 
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current); 
    };
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
        console.log('👥 User selected:', item);
        setSelectedUser(item as UserResult);
        setShowUserProfileModal(true);
        return;
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
      console.log('🔍 Calling Google Directions API...');
      const routeResult = await getRouteGoogleDirections(
        { lat: selectedStartPoint.latitude, lng: selectedStartPoint.longitude },
        { lat: selectedDestinationPoint.latitude, lng: selectedDestinationPoint.longitude }
      );
      
      console.log('🔍 Route result received:', routeResult);
      console.log('🔍 Route result structure:', JSON.stringify(routeResult, null, 2));
      
      let routeGeometry = '';
      let routeSummary = '';
      let routeSteps = '';
      if (
        routeResult &&
        routeResult.features &&
        routeResult.features[0] &&
        routeResult.features[0].geometry &&
        routeResult.features[0].properties &&
        routeResult.features[0].properties.segments &&
        routeResult.features[0].properties.segments[0]
      ) {
        console.log('🔍 Found segments in route result');
        routeGeometry = JSON.stringify(routeResult.features[0].geometry.coordinates);
        const segment = routeResult.features[0].properties.segments[0];
        routeSummary = JSON.stringify({
          distance: segment.distance,
          duration: segment.duration,
        });
        routeSteps = JSON.stringify(segment.steps || []);
        console.log('🔍 Extracted routeSummary:', routeSummary);
        console.log('🔍 Extracted routeSteps:', routeSteps);
      } else {
        console.log('🔍 No segments found in route result');
        console.log('🔍 routeResult.features[0]:', routeResult?.features?.[0]);
        console.log('🔍 routeResult.features[0].properties:', routeResult?.features?.[0]?.properties);
      }
      if (!routeGeometry) {
        Alert.alert('Routing Error', 'No route found to this destination.');
        return;
      }
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
          routeSummary,
          routeSteps,
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
  let iconColor = theme.colors.ACCENT_COLOR;
  let iconBgColor = addAlpha(theme.colors.ACCENT_COLOR, 0.1);

  switch (item.type) {
    case 'user':
      iconName = "account-circle-outline";
      iconColor = theme.colors.PRIMARY_BRAND_COLOR;
      iconBgColor = addAlpha(theme.colors.PRIMARY_BRAND_COLOR, 0.1);
      break;
    case 'hazard':
      iconName = (item.icon as any) || 'alert-circle-outline';
      iconColor = theme.colors.ERROR_COLOR;
      iconBgColor = addAlpha(theme.colors.ERROR_COLOR, 0.1);
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
          <LinearGradient
            colors={[theme.colors.BACKGROUND_SURFACE, addAlpha(theme.colors.ACCENT_COLOR, 0.02)]}
            style={styles.resultItemGradient}
          >
            {item.type === 'user' && item.avatar ? (
              <View style={styles.userAvatarContainer}>
                <Image source={{ uri: item.avatar }} style={styles.resultItemAvatar} />
                <View style={styles.onlineIndicator} />
              </View>
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
              {item.type === 'user' && (
                <View style={styles.userActionsContainer}>
                  <TouchableOpacity 
                    style={styles.userActionButton}
                    onPress={() => {
                      console.log('👥 Message user:', item);
                      setSelectedUser(item as UserResult);
                      setShowUserProfileModal(true);
                    }}
                  >
                    <LinearGradient
                      colors={[theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)]}
                      style={styles.userActionGradient}
                    >
                      <Ionicons name="chatbubble-outline" size={14} color="#fff" />
                      <Text style={styles.userActionText}>Message</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.userActionButton}
                    onPress={() => {
                      console.log('👥 Add user to group:', item);
                      if (!selectedGroupUsers.some(u => u.id === item.id)) {
                        setSelectedGroupUsers([...selectedGroupUsers, item as UserResult]);
                        Alert.alert(
                          "User Added", 
                          `${item.name} has been added to your group selection.`,
                          [{ text: "OK" }]
                        );
                      } else {
                        Alert.alert(
                          "Already Selected", 
                          `${item.name} is already in your group selection.`,
                          [{ text: "OK" }]
                        );
                      }
                    }}
                  >
                    <LinearGradient
                      colors={[theme.colors.PRIMARY_BRAND_COLOR, addAlpha(theme.colors.PRIMARY_BRAND_COLOR, 0.8)]}
                      style={styles.userActionGradient}
                    >
                      <Ionicons name="add-circle-outline" size={14} color="#fff" />
                      <Text style={styles.userActionText}>Add</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.TEXT_TERTIARY} />
          </LinearGradient>
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

  const currentUserId = 'currentUserId'; // TODO: Replace with real auth user id
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<UserResult[]>([]);
  const [groupName, setGroupName] = useState('');
  const [userGroups, setUserGroups] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'users') fetchUserGroups();
  }, [activeTab]);

  // Auto-login for testing purposes
  useEffect(() => {
    const setupAuth = async () => {
      try {
        const isAuth = await authService.isAuthenticated();
        if (!isAuth) {
          console.log('🔐 No auth token found, attempting auto-login...');
          await authService.createTestUser();
          await authService.autoLoginTestUser();
        } else {
          console.log('🔐 User already authenticated');
        }
      } catch (error) {
        console.log('🔐 Auth setup error:', error);
      }
    };
    
    setupAuth();
  }, []);

  const fetchUserGroups = async () => {
    try {
      console.log('👥 Fetching user groups for userId:', currentUserId);
      const groups = await groupApiService.getUserGroups(currentUserId);
      console.log('👥 Received user groups:', groups);
      setUserGroups(groups);
    } catch (error) {
      console.error('👥 Failed to fetch user groups:', error);
      // Don't show alert for 403 errors as they're handled gracefully
      if (error instanceof Error && !error.message.includes('Access denied')) {
        Alert.alert(
          "Group Error", 
          "Unable to load your groups. Please check your connection and try again.",
          [{ text: "OK" }]
        );
      }
      setUserGroups([]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedGroupUsers.length < 1) {
      Alert.alert(
        "Group Creation Error", 
        "Please enter a group name and select at least one user.",
        [{ text: "OK" }]
      );
      return;
    }
    
    const memberIds = [currentUserId, ...selectedGroupUsers.map(u => u.id)];
    const groupData: GroupCreationRequest = {
      name: groupName.trim(),
      memberIds: memberIds
    };
    
    try {
      console.log('👥 Creating group with data:', groupData);
      const createdGroup = await groupApiService.createGroup(groupData);
      console.log('👥 Group created successfully:', createdGroup);
      
      setShowGroupModal(false);
      setGroupName('');
      setSelectedGroupUsers([]);
      fetchUserGroups();
      
      Alert.alert(
        "Group Created", 
        `Group "${createdGroup.name}" has been created successfully!`,
        [{ 
          text: "OK", 
          onPress: () => {
            router.push({ 
              pathname: '/groupChatScreen', 
              params: { 
                groupId: createdGroup.id, 
                groupName: createdGroup.name 
              } 
            });
          }
        }]
      );
    } catch (error) {
      console.error('👥 Failed to create group:', error);
      let errorMessage = "Unable to create group. Please check your connection and try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('Access denied')) {
          errorMessage = "Access denied. Please check your authentication and try again.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Request timed out. Please try again.";
        }
      }
      
      Alert.alert(
        "Group Creation Error", 
        errorMessage,
        [{ text: "OK" }]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.BACKGROUND_PRIMARY }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? (Dimensions.get('window').height > 800 ? 90 : 70) : 0}
    >
      <StatusBar 
        barStyle={Platform.OS === 'ios' ? "light-content" : "light-content"} 
        backgroundColor={theme.colors.BACKGROUND_PRIMARY} 
      />
      <LinearGradient
        colors={[theme.colors.BACKGROUND_PRIMARY, theme.colors.BACKGROUND_SECONDARY]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Professional Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[theme.colors.BACKGROUND_PRIMARY, addAlpha(theme.colors.ACCENT_COLOR, 0.05)]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <MaterialCommunityIcons name="magnify" size={28} color={theme.colors.ACCENT_COLOR} style={styles.headerIcon} />
              <View>
                <Text style={[styles.headerTitle, { color: theme.colors.TEXT_PRIMARY }]}>Smart Search</Text>
                <Text style={[styles.headerSubtitle, { color: theme.colors.TEXT_SECONDARY }]}>Find places, users, and hazards instantly</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
              <LinearGradient
                colors={[theme.colors.BACKGROUND_SURFACE, addAlpha(theme.colors.ACCENT_COLOR, 0.1)]}
                style={styles.filterButtonGradient}
              >
                <Ionicons name="options-outline" size={20} color={theme.colors.ACCENT_COLOR} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Search Inputs */}
        {activeTab === 'places' && (
        <View style={styles.searchSection}>
          <FadeInView delay={50} style={styles.searchContainer}>
            <View style={[styles.searchInputContainer, activeSearchInput === 'start' && styles.activeSearchInput]}>
              <LinearGradient
                colors={selectedStartPoint ? [addAlpha(theme.colors.ACCENT_COLOR, 0.1), addAlpha(theme.colors.ACCENT_COLOR, 0.05)] : [theme.colors.BACKGROUND_SURFACE, theme.colors.BACKGROUND_SURFACE]}
                style={styles.searchInputGradient}
              >
                <MaterialCommunityIcons
                  name="ray-start-arrow"
                  size={20}
                  color={selectedStartPoint ? theme.colors.ACCENT_COLOR : theme.colors.TEXT_TERTIARY}
                  style={styles.searchIcon}
                />
                <TextInput
                  ref={startInputRef}
                  style={[styles.searchInput, { color: theme.colors.TEXT_PRIMARY }]}
                  placeholder="Start location"
                  placeholderTextColor={theme.colors.TEXT_TERTIARY}
                  value={startLocationQuery}
                  onChangeText={setStartLocationQuery}
                  onFocus={() => setActiveSearchInput('start')}
                  onBlur={() => setActiveSearchInput('destination')}
                />
                {startLocationQuery && startLocationQuery !== CURRENT_LOCATION_TEXT && (
                  <TouchableOpacity onPress={() => handleClearInput('start')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={18} color={theme.colors.TEXT_TERTIARY} />
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </View>

            <View style={[styles.searchInputContainer, activeSearchInput === 'destination' && styles.activeSearchInput]}>
              <LinearGradient
                colors={selectedDestinationPoint ? [addAlpha(theme.colors.ACCENT_COLOR, 0.1), addAlpha(theme.colors.ACCENT_COLOR, 0.05)] : [theme.colors.BACKGROUND_SURFACE, theme.colors.BACKGROUND_SURFACE]}
                style={styles.searchInputGradient}
              >
                <MaterialCommunityIcons
                  name="map-marker"
                  size={20}
                  color={selectedDestinationPoint ? theme.colors.ACCENT_COLOR : theme.colors.TEXT_TERTIARY}
                  style={styles.searchIcon}
                />
                <TextInput
                  ref={destinationInputRef}
                  style={[styles.searchInput, { color: theme.colors.TEXT_PRIMARY }]}
                  placeholder="Where to?"
                  placeholderTextColor={theme.colors.TEXT_TERTIARY}
                  value={destinationQuery}
                  onChangeText={setDestinationQuery}
                  onFocus={() => setActiveSearchInput('destination')}
                />
                {destinationQuery && (
                  <TouchableOpacity onPress={() => handleClearInput('destination')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={18} color={theme.colors.TEXT_TERTIARY} />
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </View>
          </FadeInView>
        </View>
        )}

      {/* General Search Input */}
        {activeTab !== 'places' && (
        <View style={styles.searchSection}>
          <FadeInView delay={50} style={styles.searchContainer}>
            <View style={[styles.searchInputContainer, styles.generalSearchInput]}>
                          <LinearGradient
              colors={[theme.colors.BACKGROUND_SURFACE, addAlpha(theme.colors.ACCENT_COLOR, 0.05)]}
              style={styles.searchInputGradient}
            >
              <Ionicons name="search-outline" size={20} color={theme.colors.TEXT_TERTIARY} style={styles.searchIcon} />
              <TextInput
                ref={generalInputRef}
                style={styles.searchInput}
                placeholder={`Search ${activeTab}...`}
                placeholderTextColor={theme.colors.TEXT_TERTIARY}
                value={generalSearchQuery}
                onChangeText={setGeneralSearchQuery}
                onFocus={() => setActiveSearchInput('general')}
              />
              {generalSearchQuery && (
                <TouchableOpacity onPress={() => handleClearInput('general')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.TEXT_TERTIARY} />
                </TouchableOpacity>
              )}
            </LinearGradient>
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
            <LinearGradient
              colors={activeTab === tab.id ? 
                [addAlpha(theme.colors.ACCENT_COLOR, 0.15), addAlpha(theme.colors.ACCENT_COLOR, 0.05)] : 
                [theme.colors.BACKGROUND_SECONDARY, theme.colors.BACKGROUND_SECONDARY]
              }
              style={styles.tabButtonGradient}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.id ? theme.colors.ACCENT_COLOR : theme.colors.TEXT_SECONDARY}
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                {tab.label}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>


      
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
            <LinearGradient
              colors={[theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)]}
              style={styles.directionsButtonGradient}
            >
              <MaterialCommunityIcons name="directions" size={24} color="#fff" />
              <Text style={styles.directionsButtonText}>Get Directions</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Indicator */}
      {isLoading && searchResults.length === 0 && (
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={[addAlpha(theme.colors.ACCENT_COLOR, 0.1), addAlpha(theme.colors.ACCENT_COLOR, 0.05)]}
            style={styles.loadingGradient}
          >
            <ActivityIndicator size="large" color={theme.colors.ACCENT_COLOR} />
            <Text style={styles.loadingText}>Searching...</Text>
            <Text style={styles.loadingSubtext}>Finding the best results for you</Text>
          </LinearGradient>
        </View>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && activeTab !== 'users' && (
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

      {/* User Search Results - Separate from Groups */}
      {searchResults.length > 0 && activeTab === 'users' && (
        <View style={styles.userSearchResultsContainer}>
          <Text style={styles.userSearchResultsTitle}>Search Results</Text>
          <FlatList
            data={searchResults}
            renderItem={renderResultItem}
            keyExtractor={(item) => item.type + '-' + item.id}
            contentContainerStyle={styles.userSearchResultsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* No Results */}
      {!isLoading && searchResults.length === 0 && hasSearchedOnce && activeTab !== 'users' && (
        <FadeInView style={styles.emptyContainer}>
          <MaterialCommunityIcons name="magnify-scan" size={60} color={theme.colors.TEXT_TERTIARY} />
          <Text style={styles.emptyTitle}>No Results</Text>
          <Text style={styles.emptyText}>
            Couldn't find anything for "{displayedQueryForNoResults}". Try a different search?
          </Text>
        </FadeInView>
      )}

      {/* No Results for Users Tab */}
      {!isLoading && searchResults.length === 0 && hasSearchedOnce && activeTab === 'users' && (
        <View style={styles.userNoResultsContainer}>
          <FadeInView style={styles.userNoResultsContent}>
            <MaterialCommunityIcons name="magnify-scan" size={50} color={theme.colors.TEXT_TERTIARY} />
            <Text style={styles.userNoResultsTitle}>No Users Found</Text>
            <Text style={styles.userNoResultsText}>
              Couldn't find any users for "{displayedQueryForNoResults}". Try a different search?
            </Text>
          </FadeInView>
        </View>
      )}

      {/* Initial State */}
      {!isLoading && searchResults.length === 0 && !hasSearchedOnce && activeTab !== 'users' && (
        <FadeInView style={styles.initialContainer}>
          {activeTab === 'places' ? (
            <>
              <MaterialCommunityIcons name="routes" size={60} color={theme.colors.TEXT_TERTIARY} />
              <Text style={styles.initialTitle}>Plan Your Journey</Text>
              <Text style={styles.initialText}>
                Search for a starting point and your destination to get directions.
              </Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons 
                name="alert-decagram-outline" 
                size={60} 
                color={theme.colors.TEXT_TERTIARY} 
              />
              <Text style={styles.initialTitle}>Report Hazards</Text>
              <Text style={styles.initialText}>
                Search for reported hazards.
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
                    <Ionicons name="close" size={24} color={theme.colors.TEXT_SECONDARY} />
                  </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Sort Options */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Sort By</Text>
                <View style={styles.sortOptionsContainer}>
                  {[
                    { id: 'relevance', label: 'Relevance', icon: 'star' },
                    { id: 'distance', label: 'Distance', icon: 'location' },
                    { id: 'rating', label: 'Rating', icon: 'star-outline' },
                    { id: 'name', label: 'Name', icon: 'text' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.sortOption, sortBy === option.id && styles.sortOptionActive]}
                      onPress={() => setSortBy(option.id)}
                    >
                                              <LinearGradient
                          colors={sortBy === option.id ? 
                            [theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)] : 
                            [theme.colors.BACKGROUND_SURFACE, theme.colors.BACKGROUND_SURFACE]
                          }
                          style={styles.sortOptionGradient}
                        >
                          <Ionicons 
                            name={option.icon as any} 
                            size={16} 
                            color={sortBy === option.id ? '#fff' : theme.colors.TEXT_SECONDARY} 
                          />
                        <Text style={[styles.sortOptionText, sortBy === option.id && styles.sortOptionTextActive]}>
                          {option.label}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Tab-specific filters */}
              {activeTab === 'places' && (
                <>
                  {/* Distance Filter */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Distance</Text>
                    <View style={styles.sliderContainer}>
                      <Text style={styles.sliderValue}>{filterDistance} km</Text>
                      <View style={styles.sliderTrack}>
                        <View style={[styles.sliderFill, { width: `${(filterDistance / 50) * 100}%` }]} />
                        <TouchableOpacity
                          style={[styles.sliderThumb, { left: `${(filterDistance / 50) * 100}%` }]}
                          onPress={() => setFilterDistance(Math.min(50, filterDistance + 5))}
                        />
                      </View>
                      <View style={styles.sliderLabels}>
                        <Text style={styles.sliderLabel}>1km</Text>
                        <Text style={styles.sliderLabel}>50km</Text>
                      </View>
                    </View>
                  </View>

                  {/* Rating Filter */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
                    <View style={styles.ratingContainer}>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <TouchableOpacity
                          key={rating}
                          style={styles.ratingOption}
                          onPress={() => setFilterRating(filterRating === rating ? 0 : rating)}
                        >
                                                      <Ionicons 
                              name={rating <= filterRating ? 'star' : 'star-outline'} 
                              size={24} 
                              color={rating <= filterRating ? '#FFD700' : theme.colors.TEXT_TERTIARY} 
                            />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Price Range */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Price Range</Text>
                    <View style={styles.priceOptionsContainer}>
                      {[
                        { id: 'all', label: 'All', icon: 'cash-outline' },
                        { id: 'low', label: '$', icon: 'cash-outline' },
                        { id: 'medium', label: '$$', icon: 'cash-outline' },
                        { id: 'high', label: '$$$', icon: 'cash-outline' },
                      ].map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={[styles.priceOption, filterPriceRange === option.id && styles.priceOptionActive]}
                          onPress={() => setFilterPriceRange(option.id)}
                        >
                                                  <LinearGradient
                          colors={filterPriceRange === option.id ? 
                            [theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)] : 
                            [theme.colors.BACKGROUND_SURFACE, theme.colors.BACKGROUND_SURFACE]
                          }
                          style={styles.priceOptionGradient}
                        >
                          <Ionicons 
                            name={option.icon as any} 
                            size={16} 
                            color={filterPriceRange === option.id ? '#fff' : theme.colors.TEXT_SECONDARY} 
                          />
                            <Text style={[styles.priceOptionText, filterPriceRange === option.id && styles.priceOptionTextActive]}>
                              {option.label}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Open Now Toggle */}
                  <View style={styles.filterSection}>
                    <View style={styles.toggleContainer}>
                      <View style={styles.toggleLabelContainer}>
                        <Ionicons name="time-outline" size={20} color={theme.colors.TEXT_SECONDARY} />
                        <Text style={styles.toggleLabel}>Open Now</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.toggleButton, filterOpenNow && styles.toggleButtonActive]}
                        onPress={() => setFilterOpenNow(!filterOpenNow)}
                      >
                        <View style={[styles.toggleThumb, filterOpenNow && styles.toggleThumbActive]} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              {activeTab === 'users' && (
                <>
                  {/* User Status Filters */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>User Status</Text>
                    <View style={styles.toggleContainer}>
                      <View style={styles.toggleLabelContainer}>
                        <Ionicons name="wifi-outline" size={20} color={theme.colors.TEXT_SECONDARY} />
                        <Text style={styles.toggleLabel}>Online Only</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.toggleButton, userFilterOnline && styles.toggleButtonActive]}
                        onPress={() => setUserFilterOnline(!userFilterOnline)}
                      >
                        <View style={[styles.toggleThumb, userFilterOnline && styles.toggleThumbActive]} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.toggleContainer}>
                      <View style={styles.toggleLabelContainer}>
                        <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.TEXT_SECONDARY} />
                        <Text style={styles.toggleLabel}>Verified Only</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.toggleButton, userFilterVerified && styles.toggleButtonActive]}
                        onPress={() => setUserFilterVerified(!userFilterVerified)}
                      >
                        <View style={[styles.toggleThumb, userFilterVerified && styles.toggleThumbActive]} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              {activeTab === 'hazards' && (
                <>
                  {/* Hazard Severity Filter */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Severity</Text>
                    <View style={styles.severityOptionsContainer}>
                      {[
                        { id: 'all', label: 'All', icon: 'alert-outline' },
                        { id: 'low', label: 'Low', icon: 'warning-outline' },
                        { id: 'medium', label: 'Medium', icon: 'alert-circle-outline' },
                        { id: 'high', label: 'High', icon: 'alert' },
                      ].map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={[styles.severityOption, hazardFilterSeverity === option.id && styles.severityOptionActive]}
                          onPress={() => setHazardFilterSeverity(option.id)}
                        >
                                                  <LinearGradient
                          colors={hazardFilterSeverity === option.id ? 
                            [theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)] : 
                            [theme.colors.BACKGROUND_SURFACE, theme.colors.BACKGROUND_SURFACE]
                          }
                          style={styles.severityOptionGradient}
                        >
                          <Ionicons 
                            name={option.icon as any} 
                            size={16} 
                            color={hazardFilterSeverity === option.id ? '#fff' : theme.colors.TEXT_SECONDARY} 
                          />
                            <Text style={[styles.severityOptionText, hazardFilterSeverity === option.id && styles.severityOptionTextActive]}>
                              {option.label}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Hazard Date Filter */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Date Range</Text>
                    <View style={styles.dateOptionsContainer}>
                      {[
                        { id: 'all', label: 'All Time', icon: 'calendar-outline' },
                        { id: 'today', label: 'Today', icon: 'today-outline' },
                        { id: 'week', label: 'This Week', icon: 'calendar-outline' },
                        { id: 'month', label: 'This Month', icon: 'calendar-outline' },
                      ].map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={[styles.dateOption, hazardFilterDate === option.id && styles.dateOptionActive]}
                          onPress={() => setHazardFilterDate(option.id)}
                        >
                                                  <LinearGradient
                          colors={hazardFilterDate === option.id ? 
                            [theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)] : 
                            [theme.colors.BACKGROUND_SURFACE, theme.colors.BACKGROUND_SURFACE]
                          }
                          style={styles.dateOptionGradient}
                        >
                          <Ionicons 
                            name={option.icon as any} 
                            size={16} 
                            color={hazardFilterDate === option.id ? '#fff' : theme.colors.TEXT_SECONDARY} 
                          />
                            <Text style={[styles.dateOptionText, hazardFilterDate === option.id && styles.dateOptionTextActive]}>
                              {option.label}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={() => {
                  setFilterDistance(10);
                  setFilterRating(0);
                  setFilterOpenNow(false);
                  setFilterPriceRange('all');
                  setSortBy('relevance');
                  setUserFilterOnline(false);
                  setUserFilterVerified(false);
                  setHazardFilterSeverity('all');
                  setHazardFilterDate('all');
                }}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={() => setShowFilterModal(false)}
              >
                <LinearGradient
                  colors={[theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)]}
                  style={styles.applyButtonGradient}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* User Profile Modal */}
      <Modal visible={showUserProfileModal} animationType="slide" transparent onRequestClose={() => setShowUserProfileModal(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', width: 300 }}>
            {selectedUser && (
              <>
                <Image source={{ uri: selectedUser.avatar }} style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 12 }} />
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>{selectedUser.name}</Text>
                <Text style={{ fontSize: 16, color: '#888', marginBottom: 16 }}>@{selectedUser.username}</Text>
                <TouchableOpacity style={{ backgroundColor: '#3498DB', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24, marginBottom: 8 }}
                  onPress={() => {
                    setShowUserProfileModal(false);
                    router.push({ pathname: '/directChatScreen', params: { userId: selectedUser.id, username: selectedUser.username, avatar: selectedUser.avatar } });
                  }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowUserProfileModal(false)}>
                  <Text style={{ color: '#888', marginTop: 8 }}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {activeTab === 'users' && (
        <View style={styles.usersTabContainer}>
          {/* Group List */}
          <View style={styles.groupSection}>
            <View style={styles.groupSectionHeader}>
              <Text style={styles.groupSectionTitle}>Your Groups</Text>
              <TouchableOpacity 
                style={styles.createGroupButton}
                onPress={() => setShowGroupModal(true)}
              >
                <LinearGradient
                  colors={[theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)]}
                  style={styles.createGroupGradient}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.createGroupText}>New Group</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            {userGroups.length === 0 ? (
              <View style={styles.emptyGroupsContainer}>
                <LinearGradient
                  colors={[addAlpha(theme.colors.ACCENT_COLOR, 0.1), addAlpha(theme.colors.ACCENT_COLOR, 0.05)]}
                  style={styles.emptyGroupsGradient}
                >
                  <MaterialCommunityIcons name="account-group-outline" size={50} color={theme.colors.ACCENT_COLOR} />
                  <Text style={styles.emptyGroupsText}>No groups yet</Text>
                  <Text style={styles.emptyGroupsSubtext}>Create a group to start chatting with multiple users</Text>
                  <TouchableOpacity 
                    style={styles.createFirstGroupButton}
                    onPress={() => setShowGroupModal(true)}
                  >
                    <LinearGradient
                      colors={[theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)]}
                      style={styles.createFirstGroupGradient}
                    >
                      <Ionicons name="plus" size={18} color="#fff" />
                      <Text style={styles.createFirstGroupText}>Create Your First Group</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            ) : (
              <View style={styles.groupListContainer}>
                {userGroups.map(group => (
                  <TouchableOpacity 
                    key={group.id} 
                    style={styles.groupItem}
                    onPress={() => router.push({ 
                      pathname: '/groupChatScreen', 
                      params: { 
                        groupId: group.id, 
                        groupName: group.name 
                      } 
                    })}
                  >
                    <LinearGradient
                      colors={[theme.colors.BACKGROUND_SURFACE, addAlpha(theme.colors.ACCENT_COLOR, 0.02)]}
                      style={styles.groupItemGradient}
                    >
                      <View style={styles.groupItemContent}>
                        <View style={styles.groupIconContainer}>
                          <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.ACCENT_COLOR} />
                        </View>
                        <View style={styles.groupItemText}>
                          <Text style={styles.groupItemName}>{group.name}</Text>
                          <Text style={styles.groupItemMembers}>{group.memberIds.length} members</Text>
                        </View>
                        <View style={styles.groupItemActions}>
                          <TouchableOpacity 
                            style={styles.groupActionButton}
                            onPress={() => router.push({ 
                              pathname: '/groupChatScreen', 
                              params: { 
                                groupId: group.id, 
                                groupName: group.name 
                              } 
                            })}
                          >
                            <LinearGradient
                              colors={[theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)]}
                              style={styles.groupActionGradient}
                            >
                              <Ionicons name="chatbubble-outline" size={14} color="#fff" />
                              <Text style={styles.groupActionText}>Chat</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                          <Ionicons name="chevron-forward" size={20} color={theme.colors.TEXT_TERTIARY} />
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Group Creation Modal */}
      <Modal visible={showGroupModal} animationType="slide" transparent onRequestClose={() => setShowGroupModal(false)}>
            <View style={styles.modalOverlay}>
              <LinearGradient
                colors={[theme.colors.BACKGROUND_SURFACE, addAlpha(theme.colors.ACCENT_COLOR, 0.02)]}
                style={styles.groupModalContent}
              >
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.ACCENT_COLOR} style={styles.modalTitleIcon} />
                    <Text style={styles.modalTitle}>Create New Group</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={() => setShowGroupModal(false)}
                  >
                    <Ionicons name="close" size={24} color={theme.colors.TEXT_SECONDARY} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.groupNameInputContainer}>
                  <MaterialCommunityIcons name="account-group" size={20} color={theme.colors.TEXT_TERTIARY} style={styles.inputIcon} />
                  <TextInput 
                    value={groupName} 
                    onChangeText={setGroupName} 
                    placeholder="Enter group name" 
                    placeholderTextColor={theme.colors.TEXT_TERTIARY}
                    style={styles.groupNameInput}
                  />
                </View>
                
                <Text style={styles.selectUsersTitle}>Select Users:</Text>
                <FlatList
                  data={searchResults.filter(u => u.type === 'user' && u.id !== currentUserId)}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => {
                    const userItem = item as UserResult;
                    const isSelected = selectedGroupUsers.some(u => u.id === item.id);
                    
                    return (
                      <TouchableOpacity
                        style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          padding: 12, 
                          backgroundColor: isSelected ? addAlpha(theme.colors.ACCENT_COLOR, 0.1) : theme.colors.BACKGROUND_SURFACE, 
                          borderRadius: 8, 
                          marginBottom: 4,
                          borderWidth: 1,
                          borderColor: isSelected ? theme.colors.ACCENT_COLOR : theme.colors.BORDER_COLOR_LIGHT
                        }}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedGroupUsers(selectedGroupUsers.filter(u => u.id !== item.id));
                          } else {
                            setSelectedGroupUsers([...selectedGroupUsers, userItem]);
                          }
                        }}
                      >
                        <Image 
                          source={{ uri: userItem.avatar }} 
                          style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12 }} 
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.TEXT_PRIMARY }}>
                            {userItem.name}
                          </Text>
                          <Text style={{ fontSize: 12, color: theme.colors.TEXT_SECONDARY }}>
                            {userItem.email}
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={{ 
                            width: 24, 
                            height: 24, 
                            borderRadius: 12, 
                            backgroundColor: theme.colors.ACCENT_COLOR, 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  style={{ maxHeight: 200, marginBottom: 12 }}
                />
                <TouchableOpacity 
                  style={styles.createGroupModalButton}
                  onPress={handleCreateGroup}
                >
                                  <LinearGradient
                  colors={[theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)]}
                  style={styles.createGroupModalGradient}
                >
                  <MaterialCommunityIcons name="account-group" size={20} color="#fff" />
                  <Text style={styles.createGroupModalText}>Create Group</Text>
                </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowGroupModal(false)}>
                  <Text style={{ color: '#888', marginTop: 8 }}>Cancel</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </Modal>
    </KeyboardAvoidingView>
  );
};

    export default SearchScreen;