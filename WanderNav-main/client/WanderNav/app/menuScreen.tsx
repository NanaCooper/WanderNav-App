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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { useFocusEffect } from 'expo-router';

const AVATAR_PLACEHOLDER = 'https://placeimg.com/150/150/people/3';
const USERNAME = 'Jane Doe';
const EMAIL = 'jane.doe@example.com';
const APP_VERSION = '1.0.0';

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
  const router = useRouter();
  const [elementsVisible, setElementsVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setElementsVisible(true);
      return () => setElementsVisible(false);
    }, [])
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'You have been logged out.');
    // Add real logout logic here
    router.replace('/SignIn');
  };

  const handleRateApp = () => {
    Alert.alert('Rate App', 'Rate app feature coming soon!');
  };

  const handleInviteFriends = () => {
    Alert.alert('Invite Friends', 'Invite friends feature coming soon!');
  };

  const handleHelp = () => {
    Alert.alert('Help & Support', 'Help & Support feature coming soon!');
  };

  const handleAbout = () => {
    Alert.alert('About', 'WanderNav helps you navigate, report hazards, and connect with your travel community.');
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Menu' }} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Card */}
        <FadeInView delay={50} slideFrom="top">
          <View style={styles.profileCard}>
            <TouchableOpacity onPress={() => router.push('/profileScreen')} style={styles.profileAvatarWrapper}>
              <Image source={{ uri: AVATAR_PLACEHOLDER }} style={styles.profileAvatar} />
              <View style={styles.profileAvatarEdit}><Ionicons name="create-outline" size={16} color="#fff" /></View>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.profileName}>{USERNAME}</Text>
              <Text style={styles.profileEmail}>{EMAIL}</Text>
              <TouchableOpacity style={styles.profileEditBtn} onPress={() => router.push('/profileScreen')}>
                <Text style={styles.profileEditBtnText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </FadeInView>

        {/* Navigation Section */}
        <View style={styles.menuSectionCard}>
          <MenuButton
            title="Settings"
            iconName="settings-outline"
            iconSet="Ionicons"
            onPress={() => router.push('/settingsScreen')}
            delay={100}
          />
          <MenuButton
            title="Group Messaging"
            iconName="chatbubbles-outline"
            iconSet="Ionicons"
            onPress={() => router.push('/groupMessagingScreen')}
            delay={200}
          />
        </View>

        {/* Support Section */}
        <View style={styles.menuSectionCard}>
          <MenuButton
            title="Help & Support"
            iconName="help-circle-outline"
            iconSet="Ionicons"
            onPress={handleHelp}
            delay={300}
          />
          <MenuButton
            title="About"
            iconName="information-circle-outline"
            iconSet="Ionicons"
            onPress={handleAbout}
            delay={400}
          />
        </View>

        {/* App Info Section */}
        <View style={styles.menuSectionCard}>
          <MenuButton
            title="Rate App"
            iconName="star"
            iconSet="FontAwesome"
            onPress={handleRateApp}
            delay={500}
          />
          <MenuButton
            title="Invite Friends"
            iconName="account-plus-outline"
            iconSet="MaterialCommunityIcons"
            onPress={handleInviteFriends}
            delay={600}
          />
        </View>

        {/* App Version */}
        <View style={styles.versionCard}>
          <Text style={styles.versionText}>App Version {APP_VERSION}</Text>
        </View>

        {/* Logout Button */}
        <FadeInView delay={700} style={{ marginTop: 30 }}>
          <AnimatedPressable
            onPress={handleLogout}
            style={styles.logoutButton}
            pressableStyle={{ marginHorizontal: 20 }}
          >
            <MaterialCommunityIcons name="logout" size={22} color={THEME.ERROR_COLOR} style={styles.menuButtonIcon} />
            <Text style={[styles.menuButtonText, { color: THEME.ERROR_COLOR }]}>Logout</Text>
          </AnimatedPressable>
        </FadeInView>
      </ScrollView>
    </View>
  );
};

const MenuButton = ({ title, iconName, iconSet = 'MaterialCommunityIcons', onPress, delay = 0 }: any) => {
  let IconComponent: any = MaterialCommunityIcons;
  if (iconSet === 'Ionicons') IconComponent = Ionicons;
  if (iconSet === 'MaterialIcons') IconComponent = MaterialIcons;
  if (iconSet === 'FontAwesome') IconComponent = FontAwesome;
  return (
    <FadeInView delay={delay} slideFrom="left">
      <AnimatedPressable
        onPress={onPress}
        style={styles.menuButton}
        pressableStyle={{ width: '100%' }}
      >
        <IconComponent name={iconName} size={24} color={THEME.PRIMARY_BRAND_COLOR} style={styles.menuButtonIcon} />
        <Text style={styles.menuButtonText}>{title}</Text>
        <Ionicons name="chevron-forward-outline" size={22} color={THEME.TEXT_SECONDARY} />
      </AnimatedPressable>
    </FadeInView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME.BACKGROUND_LIGHT,
  },
  scrollContainer: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 18,
    marginBottom: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: THEME.SHADOW_COLOR,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 5,
  },
  profileAvatarWrapper: {
    marginBottom: 10,
    position: 'relative',
  },
  profileAvatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: '#3498DB',
    backgroundColor: '#eee',
  },
  profileAvatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3498DB',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 6,
  },
  profileEditBtn: {
    backgroundColor: '#EAF3FB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 4,
  },
  profileEditBtnText: {
    color: '#3498DB',
    fontWeight: '600',
    fontSize: 13,
  },
  menuSectionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 18,
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: THEME.SHADOW_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 7,
    elevation: 3,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.BORDER_COLOR,
  },
  menuButtonIcon: {
    marginRight: 20,
  },
  menuButtonText: {
    flex: 1,
    fontSize: 17,
    color: THEME.TEXT_PRIMARY,
    fontWeight: '500',
  },
  versionCard: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  versionText: {
    color: '#B0B7C3',
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: THEME.SHADOW_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 3,
  },
});

export default MenuScreen;