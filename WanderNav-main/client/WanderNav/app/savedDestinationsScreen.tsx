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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME, addAlpha } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { getRouteOpenRouteService } from '../src/services/api';

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
  const router = useRouter();
  const [savedDestinations, setSavedDestinations] = useState<SavedDestination[]>([
    {
      id: '1',
      name: 'Home',
      address: '123 Main Street, Kumasi',
      latitude: 6.6885,
      longitude: -1.6244,
      category: 'Home',
      lastVisited: '2024-01-15',
      isFavorite: true,
    },
    {
      id: '2',
      name: 'Work',
      address: '456 Business District, Kumasi',
      latitude: 6.6890,
      longitude: -1.6250,
      category: 'Work',
      lastVisited: '2024-01-14',
      isFavorite: true,
    },
    {
      id: '3',
      name: 'Santasi Market',
      address: 'Santasi, Kumasi, Ghana',
      latitude: 6.6875,
      longitude: -1.6235,
      category: 'Shopping',
      lastVisited: '2024-01-10',
      isFavorite: false,
    },
    {
      id: '4',
      name: 'University Campus',
      address: 'KNUST Campus, Kumasi',
      latitude: 6.6900,
      longitude: -1.6200,
      category: 'Education',
      lastVisited: '2024-01-12',
      isFavorite: false,
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newDestinationName, setNewDestinationName] = useState('');
  const [newDestinationAddress, setNewDestinationAddress] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Other');

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

  const handleQuickAccess = (type: string) => {
    Alert.alert('Quick Access', `Navigating to ${type} destinations`);
  };

  const handleDestinationPress = async (destination: SavedDestination) => {
    try {
      // Get user's current location
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

      // Fetch route
      const routeResult = await getRouteOpenRouteService(
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

  const handleAddDestination = () => {
    if (!newDestinationName.trim() || !newDestinationAddress.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const newDestination: SavedDestination = {
      id: Date.now().toString(),
      name: newDestinationName.trim(),
      address: newDestinationAddress.trim(),
      latitude: 6.6885, // Default coordinates - in real app, you'd geocode the address
      longitude: -1.6244,
      category: selectedCategory,
      isFavorite: false,
    };

    setSavedDestinations([newDestination, ...savedDestinations]);
    setNewDestinationName('');
    setNewDestinationAddress('');
    setSelectedCategory('Other');
    setShowAddModal(false);
  };

  const handleToggleFavorite = (destinationId: string) => {
    setSavedDestinations(prev => 
      prev.map(dest => 
        dest.id === destinationId 
          ? { ...dest, isFavorite: !dest.isFavorite }
          : dest
      )
    );
  };

  const handleDeleteDestination = (destinationId: string) => {
    Alert.alert(
      'Delete Destination',
      'Are you sure you want to delete this destination?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setSavedDestinations(prev => prev.filter(dest => dest.id !== destinationId));
          }
        },
      ]
    );
  };

  const renderQuickAccessItem = ({ item }: { item: QuickAccessItem }) => (
    <FadeInView delay={item.id === 'home' ? 100 : item.id === 'work' ? 150 : item.id === 'favorites' ? 200 : 250}>
      <AnimatedPressable style={styles.quickAccessItem} onPress={item.action}>
        <View style={[styles.quickAccessIcon, { backgroundColor: addAlpha(item.color, 0.1) }]}>
          <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
        </View>
        <Text style={styles.quickAccessText}>{item.name}</Text>
      </AnimatedPressable>
    </FadeInView>
  );

  const renderDestinationItem = ({ item, index }: { item: SavedDestination; index: number }) => (
    <FadeInView delay={100 + (index * 50)}>
      <AnimatedPressable style={styles.destinationItem} onPress={() => handleDestinationPress(item)}>
        <View style={styles.destinationContent}>
          <View style={styles.destinationIconContainer}>
            <MaterialCommunityIcons 
              name="map-marker" 
              size={24} 
              color={THEME.ACCENT_COLOR} 
            />
          </View>
          <View style={styles.destinationTextContainer}>
            <Text style={styles.destinationName}>{item.name}</Text>
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
              size={20} 
              color={item.isFavorite ? "#E74C3C" : THEME.TEXT_SECONDARY} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleDeleteDestination(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color={THEME.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>
      </AnimatedPressable>
    </FadeInView>
  );

  const categories = ['Home', 'Work', 'Shopping', 'Education', 'Entertainment', 'Other'];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[THEME.BACKGROUND_PRIMARY, '#f8fafc']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Saved Destinations</Text>
          <Text style={styles.headerSubtitle}>Your favorite places and quick access</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

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
          <Text style={styles.destinationCount}>{savedDestinations.length} destinations</Text>
        </View>
        <FlatList
          data={savedDestinations}
          renderItem={renderDestinationItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.destinationsList}
        />
      </View>

      {/* Add Destination Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Destination</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={THEME.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Destination Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter destination name"
                value={newDestinationName}
                onChangeText={setNewDestinationName}
                placeholderTextColor={THEME.TEXT_TERTIARY}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter full address"
                value={newDestinationAddress}
                onChangeText={setNewDestinationAddress}
                placeholderTextColor={THEME.TEXT_TERTIARY}
                multiline
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryContainer}>
                {categories.map((category) => (
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
                <Text style={styles.saveButtonText}>Save Destination</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.BACKGROUND_PRIMARY,
  },
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.ACCENT_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.ACCENT_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  quickAccessSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.TEXT_PRIMARY,
    marginBottom: 16,
  },
  quickAccessList: {
    paddingRight: 20,
  },
  quickAccessItem: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 80,
  },
  quickAccessIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickAccessText: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.TEXT_SECONDARY,
    textAlign: 'center',
  },
  destinationsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  destinationCount: {
    fontSize: 14,
    color: THEME.TEXT_SECONDARY,
  },
  destinationsList: {
    paddingBottom: 20,
  },
  destinationItem: {
    backgroundColor: THEME.BACKGROUND_SURFACE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: THEME.SHADOW_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: THEME.BORDER_COLOR_LIGHT,
  },
  destinationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  destinationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: addAlpha(THEME.ACCENT_COLOR, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  destinationTextContainer: {
    flex: 1,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.TEXT_PRIMARY,
    marginBottom: 4,
  },
  destinationAddress: {
    fontSize: 14,
    color: THEME.TEXT_SECONDARY,
    marginBottom: 8,
  },
  destinationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: addAlpha(THEME.ACCENT_COLOR, 0.1),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.ACCENT_COLOR,
  },
  lastVisitedText: {
    fontSize: 12,
    color: THEME.TEXT_TERTIARY,
  },
  destinationActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.BACKGROUND_SECONDARY,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.TEXT_PRIMARY,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME.TEXT_PRIMARY,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: THEME.BACKGROUND_SECONDARY,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: THEME.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: THEME.BORDER_COLOR_LIGHT,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: THEME.BACKGROUND_SECONDARY,
    borderWidth: 1,
    borderColor: THEME.BORDER_COLOR_LIGHT,
  },
  selectedCategory: {
    backgroundColor: THEME.ACCENT_COLOR,
    borderColor: THEME.ACCENT_COLOR,
  },
  categoryOptionText: {
    fontSize: 14,
    color: THEME.TEXT_SECONDARY,
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: THEME.BACKGROUND_SECONDARY,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.BORDER_COLOR_LIGHT,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME.TEXT_SECONDARY,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: THEME.ACCENT_COLOR,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default SavedDestinationsScreen;