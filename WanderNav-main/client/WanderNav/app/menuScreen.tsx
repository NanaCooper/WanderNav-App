import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Dimensions,
  Animated,
  TouchableOpacity,
  Alert,
  Image,
  Share,
  Linking,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { THEME, addAlpha } from '../constants/theme';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
const AVATAR_PLACEHOLDER = 'https://placeimg.com/150/150/people/3';
const USERNAME = 'Jane Doe';
const EMAIL = 'jane.doe@example.com';
const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

const PRESSED_SCALE_VALUE = 0.97;
const AnimatedPressable = ({ onPress, style, children, pressableStyle }: any) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(scaleValue, { toValue: PRESSED_SCALE_VALUE, friction: 5, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleValue, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();
  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} style={pressableStyle} android_ripple={{ color: 'rgba(0,0,0,0.05)'}}>
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>{children}</Animated.View>
    </Pressable>
  );
};

const FadeInView = ({ children, duration = 300, delay = 0, style, slideFrom = 'bottom' }: any) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const transformValue = useRef(new Animated.Value(slideFrom === 'bottom' ? 15 : slideFrom === 'left' ? -15 : 0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true }).start();
    Animated.timing(transformValue, {
      toValue: 0,
      duration: duration * 1.2,
      delay,
      useNativeDriver: true,
    }).start();
  }, [opacity, transformValue, duration, delay]);
  const animatedStyle = {
    opacity,
    transform: [slideFrom === 'bottom' || slideFrom === 'top' ? { translateY: transformValue } : { translateX: transformValue }]
  };
  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
};

const MenuScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [elementsVisible, setElementsVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setElementsVisible(true);
      return () => setElementsVisible(false);
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            // Clear user data, tokens, etc.
            console.log('User logged out');
            router.replace('/SignIn');
          }
        },
      ]
    );
  };

  const handleRateApp = async () => {
    try {
      const url = Platform.OS === 'ios' 
        ? 'https://apps.apple.com/app/wandernav/id123456789'
        : 'https://play.google.com/store/apps/details?id=com.wandernav.app';
      
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Rate App', 'App store link not available. Please search for WanderNav in your app store.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open app store. Please search for WanderNav manually.');
    }
  };

  const handleInviteFriends = async () => {
    try {
      const message = `Hey! I'm using WanderNav - an amazing navigation app that helps you find the best routes, report hazards, and connect with other travelers. Download it here: https://wandernav.app`;
      
      await Share.share({
        message,
        title: 'Check out WanderNav!',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share app. Please try again.');
    }
  };

  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      'Need help? Contact our support team:\n\nEmail: support@wandernav.app\nPhone: +1-800-WANDER\n\nOr visit our help center at help.wandernav.app',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Contact Support', 
          onPress: () => {
            Linking.openURL('mailto:support@wandernav.app?subject=WanderNav Support Request');
          }
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About WanderNav',
      `WanderNav v${APP_VERSION} (${BUILD_NUMBER})\n\nWanderNav helps you navigate, report hazards, and connect with your travel community.\n\n© 2024 WanderNav Team\nAll rights reserved.`,
      [
        { text: 'Privacy Policy', onPress: () => Linking.openURL('https://wandernav.app/privacy') },
        { text: 'Terms of Service', onPress: () => Linking.openURL('https://wandernav.app/terms') },
        { text: 'OK', style: 'default' },
      ]
    );
  };

  const handleSettings = () => {
    router.push('/settingsScreen');
  };

  const handleGroupMessaging = () => {
    router.push('/groupMessagingScreen');
  };

  const handleSavedDestinations = () => {
    router.push('/savedDestinationsScreen');
  };

  const handleHazardReports = () => {
    router.push('/hazardReportScreen');
  };

  const handleDirectChat = () => {
    router.push('/directChatScreen');
  };

  const handleDashcam = () => {
    router.push('/dashcam');
  };

  const handleSearch = () => {
    router.push('/searchScreen');
  };

  return (
    <View style={styles.screen}>
            <Stack.Screen options={{
        title: 'Menu',
        headerStyle: {
          backgroundColor: theme.colors.BACKGROUND_SURFACE,
        },
        headerTintColor: theme.colors.TEXT_PRIMARY,
        headerShadowVisible: false,
      }} />
      
      <LinearGradient
        colors={[theme.colors.BACKGROUND_PRIMARY, theme.colors.BACKGROUND_SECONDARY]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <FadeInView delay={50} slideFrom="top">
          <View style={[styles.profileCard, { backgroundColor: theme.colors.BACKGROUND_SURFACE }]}>
            <TouchableOpacity onPress={() => router.push('/profileScreen')} style={styles.profileAvatarWrapper}>
              <Image source={{ uri: AVATAR_PLACEHOLDER }} style={styles.profileAvatar} />
              <View style={[styles.profileAvatarEdit, { backgroundColor: theme.colors.ACCENT_COLOR }]}>
                <Ionicons name="create-outline" size={16} color={theme.colors.WHITE} />
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.colors.TEXT_PRIMARY }]}>{USERNAME}</Text>
              <Text style={[styles.profileEmail, { color: theme.colors.TEXT_SECONDARY }]}>{EMAIL}</Text>
              <TouchableOpacity style={styles.profileEditBtn} onPress={() => router.push('/profileScreen')}>
                <LinearGradient
                  colors={[theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)]}
                  style={styles.profileEditBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={[styles.profileEditBtnText, { color: theme.colors.WHITE }]}>View Profile</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </FadeInView>

        {/* Navigation Section */}
        <View style={[styles.menuSectionCard, { backgroundColor: theme.colors.BACKGROUND_SURFACE }]}>
          <MenuButton
            title="Search & Navigation"
            subtitle="Find places and get directions"
            iconName="search"
            iconSet="Ionicons"
            onPress={handleSearch}
            delay={100}
          />
          <MenuButton
            title="Saved Destinations"
            subtitle="Your favorite places"
            iconName="bookmark"
            iconSet="Ionicons"
            onPress={handleSavedDestinations}
            delay={150}
          />
          <MenuButton
            title="Group Messaging"
            subtitle="Chat with travel groups"
            iconName="chatbubbles-outline"
            iconSet="Ionicons"
            onPress={handleGroupMessaging}
            delay={200}
          />
          <MenuButton
            title="Direct Chat"
            subtitle="Private conversations"
            iconName="chatbubble-ellipses"
            iconSet="Ionicons"
            onPress={handleDirectChat}
            delay={250}
          />
        </View>

        {/* Features Section */}
        <View style={[styles.menuSectionCard, { backgroundColor: theme.colors.BACKGROUND_SURFACE }]}>
          <MenuButton
            title="Hazard Reports"
            subtitle="Report and view road hazards"
            iconName="warning"
            iconSet="Ionicons"
            onPress={handleHazardReports}
            delay={300}
          />
          <MenuButton
            title="Dashcam Mode"
            subtitle="Record your journey"
            iconName="videocam"
            iconSet="Ionicons"
            onPress={handleDashcam}
            delay={350}
          />
          <MenuButton
            title="Settings"
            subtitle="App preferences and account"
            iconName="settings-outline"
            iconSet="Ionicons"
            onPress={handleSettings}
            delay={400}
          />
        </View>

        {/* Support Section */}
        <View style={styles.menuSectionCard}>
          <MenuButton
            title="Help & Support"
            subtitle="Get help and contact support"
            iconName="help-circle-outline"
            iconSet="Ionicons"
            onPress={handleHelp}
            delay={450}
          />
          <MenuButton
            title="About"
            subtitle="App information and legal"
            iconName="information-circle-outline"
            iconSet="Ionicons"
            onPress={handleAbout}
            delay={500}
          />
        </View>

        {/* App Actions Section */}
        <View style={styles.menuSectionCard}>
          <MenuButton
            title="Rate App"
            subtitle="Rate us on the app store"
            iconName="star"
            iconSet="FontAwesome"
            onPress={handleRateApp}
            delay={550}
          />
          <MenuButton
            title="Invite Friends"
            subtitle="Share WanderNav with friends"
            iconName="account-plus-outline"
            iconSet="MaterialCommunityIcons"
            onPress={handleInviteFriends}
            delay={600}
          />
        </View>

        {/* App Version */}
        <View style={styles.versionCard}>
          <Text style={styles.versionText}>WanderNav v{APP_VERSION} ({BUILD_NUMBER})</Text>
          <Text style={styles.deviceInfo}>WanderNav App • {Platform.OS}</Text>
        </View>

        {/* Logout Button */}
        <FadeInView delay={650} style={{ marginTop: 30 }}>
          <AnimatedPressable
            onPress={handleLogout}
            style={styles.logoutButton}
            pressableStyle={{ marginHorizontal: 20 }}
          >
            <LinearGradient
              colors={['#E74C3C', '#C0392B']}
              style={styles.logoutButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="logout" size={22} color="#fff" style={styles.menuButtonIcon} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </LinearGradient>
          </AnimatedPressable>
        </FadeInView>
      </ScrollView>
    </View>
  );
};

const MenuButton = ({ title, subtitle, iconName, iconSet = 'MaterialCommunityIcons', onPress, delay = 0 }: any) => {
  const { theme } = useTheme();
  let IconComponent: any = MaterialCommunityIcons;
  if (iconSet === 'Ionicons') IconComponent = Ionicons;
  if (iconSet === 'MaterialIcons') IconComponent = MaterialIcons;
  if (iconSet === 'FontAwesome') IconComponent = FontAwesome;
  
  return (
    <FadeInView delay={delay} slideFrom="left">
      <AnimatedPressable
        onPress={onPress}
        style={[styles.menuButton, { backgroundColor: theme.colors.BACKGROUND_PRIMARY }]}
        pressableStyle={{ width: '100%' }}
      >
        <View style={styles.menuButtonIconContainer}>
          <LinearGradient
            colors={[theme.colors.ACCENT_COLOR, addAlpha(theme.colors.ACCENT_COLOR, 0.8)]}
            style={styles.menuButtonIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <IconComponent name={iconName} size={20} color={theme.colors.WHITE} />
          </LinearGradient>
        </View>
        <View style={styles.menuButtonContent}>
          <Text style={[styles.menuButtonText, { color: theme.colors.TEXT_PRIMARY }]}>{title}</Text>
          {subtitle && <Text style={[styles.menuButtonSubtext, { color: theme.colors.TEXT_SECONDARY }]}>{subtitle}</Text>}
        </View>
        <Ionicons name="chevron-forward-outline" size={20} color={theme.colors.TEXT_SECONDARY} />
      </AnimatedPressable>
    </FadeInView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContainer: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: THEME.BACKGROUND_SURFACE,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: THEME.SHADOW_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: THEME.BORDER_COLOR_LIGHT,
  },
  profileAvatarWrapper: {
    marginBottom: 16,
    position: 'relative',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: THEME.ACCENT_COLOR,
    backgroundColor: '#eee',
  },
  profileAvatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: THEME.ACCENT_COLOR,
    borderRadius: 14,
    padding: 6,
    borderWidth: 2,
    borderColor: THEME.BACKGROUND_SURFACE,
    shadowColor: THEME.SHADOW_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.TEXT_PRIMARY,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: THEME.TEXT_SECONDARY,
    marginBottom: 12,
    fontWeight: '500',
  },
  profileEditBtn: {
    borderRadius: 16,
    shadowColor: THEME.ACCENT_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profileEditBtnGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
  },
  profileEditBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  menuSectionCard: {
    backgroundColor: THEME.BACKGROUND_SURFACE,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: THEME.SHADOW_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: THEME.BORDER_COLOR_LIGHT,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.BORDER_COLOR_LIGHT,
  },
  menuButtonIconContainer: {
    marginRight: 16,
  },
  menuButtonIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.ACCENT_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButtonIcon: {
    marginRight: 16,
  },
  menuButtonContent: {
    flex: 1,
  },
  menuButtonText: {
    fontSize: 16,
    color: THEME.TEXT_PRIMARY,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuButtonSubtext: {
    fontSize: 13,
    color: THEME.TEXT_SECONDARY,
    fontWeight: '400',
  },
  versionCard: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  versionText: {
    color: THEME.TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  deviceInfo: {
    color: THEME.TEXT_TERTIARY,
    fontSize: 12,
    fontWeight: '400',
  },
  logoutButton: {
    borderRadius: 16,
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default MenuScreen;