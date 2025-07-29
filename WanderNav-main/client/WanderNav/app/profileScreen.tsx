import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Image,
  ScrollView,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Dimensions,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';

const COVER_IMAGE = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';
const AVATAR_PLACEHOLDER = 'https://placeimg.com/150/150/people/3';

const ProfileScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [elementsVisible, setElementsVisible] = useState(false);
  const [name, setName] = useState('Jane Doe');
  const [username, setUsername] = useState('janedoe');
  const [email, setEmail] = useState('jane.doe@example.com');
  const [bio, setBio] = useState('Loves coding with React Native & Expo! Exploring new places and technologies.');
  const [avatarUri, setAvatarUri] = useState(AVATAR_PLACEHOLDER);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [joinDate] = useState('Joined Jan 2024');
  const [hazardsReported] = useState(12); // Placeholder
  const [destinationsSaved] = useState(5); // Placeholder
  const [editAvatarModal, setEditAvatarModal] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [avatarActionSheetVisible, setAvatarActionSheetVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setElementsVisible(true);
      return () => setElementsVisible(false);
    }, [])
  );

  // Generate styles with theme
  const getStyles = () => StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.BACKGROUND_PRIMARY,
    },
    scrollContainer: {
      paddingBottom: 40,
    },
    coverContainer: {
      width: '100%',
      height: 140,
      marginBottom: -60,
      position: 'relative',
    },
    coverImage: {
      width: '100%',
      height: '100%',
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
    },
    shareBtn: {
      position: 'absolute',
      top: 18,
      right: 18,
      backgroundColor: theme.colors.ACCENT_COLOR,
      borderRadius: 20,
      padding: 8,
      elevation: 4,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    avatarSection: {
      alignItems: 'center',
      marginTop: -60,
      marginBottom: 18,
    },
    avatarPressable: {
      position: 'relative',
    },
    profileImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 4,
      borderColor: theme.colors.BACKGROUND_SURFACE,
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
    },
    cameraIconContainer: {
      position: 'absolute',
      bottom: 6,
      right: 6,
      backgroundColor: theme.colors.ACCENT_COLOR,
      padding: 8,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: theme.colors.BACKGROUND_SURFACE,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 3,
    },
    name: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.TEXT_PRIMARY,
      marginTop: 10,
    },
    username: {
      fontSize: 15,
      color: theme.colors.TEXT_SECONDARY,
      marginTop: 2,
    },
    joinDate: {
      fontSize: 13,
      color: theme.colors.TEXT_TERTIARY,
      marginTop: 2,
      marginBottom: 8,
    },
    statsCard: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderRadius: 16,
      marginHorizontal: 20,
      marginBottom: 24,
      paddingVertical: 18,
      elevation: 2,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.ACCENT_COLOR,
      marginTop: 4,
    },
    statLabel: {
      fontSize: 13,
      color: theme.colors.TEXT_SECONDARY,
      marginTop: 2,
    },
    card: {
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderRadius: 16,
      marginHorizontal: 20,
      marginBottom: 32,
      padding: 20,
      elevation: 2,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.ACCENT_COLOR,
      marginBottom: 12,
    },
    label: {
      fontSize: 15,
      color: theme.colors.TEXT_SECONDARY,
      marginBottom: 6,
      fontWeight: '500',
    },
    input: {
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === 'ios' ? 14 : 10,
      fontSize: 16,
      color: theme.colors.TEXT_PRIMARY,
      borderWidth: 1,
      borderColor: theme.colors.BORDER_COLOR_LIGHT,
      marginBottom: 14,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    changePasswordBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
    },
    changePasswordText: {
      color: theme.colors.ACCENT_COLOR,
      fontWeight: '600',
      marginLeft: 6,
      fontSize: 14,
    },
    fab: {
      position: 'absolute',
      right: 24,
      bottom: 32,
      backgroundColor: theme.colors.ACCENT_COLOR,
      borderRadius: 32,
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 6,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
    },
    headerSaveText: {
      color: theme.colors.ACCENT_COLOR,
      fontSize: 17,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.25)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderRadius: 18,
      padding: 24,
      width: '85%',
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 6,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.ACCENT_COLOR,
      marginBottom: 18,
      textAlign: 'center',
    },
    modalBtn: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
      marginTop: 10,
      alignItems: 'center',
    },
    modalBtnText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.ACCENT_COLOR,
    },
    actionSheetOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.25)',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    actionSheetContainer: {
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      padding: 24,
      width: '100%',
      alignItems: 'stretch',
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 10,
    },
    actionSheetTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.ACCENT_COLOR,
      marginBottom: 18,
      textAlign: 'center',
    },
    actionSheetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 10,
      borderRadius: 10,
      marginBottom: 6,
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
    },
    actionSheetBtnText: {
      fontSize: 16,
      color: theme.colors.TEXT_PRIMARY,
      fontWeight: '600',
    },
  });

  const styles = getStyles();

  const handleSaveChanges = () => {
    Alert.alert('Profile Updated', 'Your changes have been saved.');
  };

  const handleProfilePictureChange = () => {
    setAvatarActionSheetVisible(true);
  };

  const pickFromCamera = async () => {
    setAvatarActionSheetVisible(false);
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPerm.status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed.');
      return;
    }
    setAvatarLoading(true);
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    setAvatarLoading(false);
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const pickFromLibrary = async () => {
    setAvatarActionSheetVisible(false);
    const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (libPerm.status !== 'granted') {
      Alert.alert('Permission Required', 'Media library permission is needed.');
      return;
    }
    setAvatarLoading(true);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    setAvatarLoading(false);
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleChangePassword = () => {
    setChangePasswordModal(true);
  };

  const handleShareProfile = () => {
    Alert.alert('Share Profile', 'Share profile feature coming soon!');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.BACKGROUND_PRIMARY }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? (Dimensions.get('window').height > 800 ? 90 : 70) : 0}
    >
      <Stack.Screen
        options={{
          title: 'Profile',
          headerRight: () => (
            <Pressable onPress={handleSaveChanges} style={{ marginRight: 15 }}>
              <Text style={styles.headerSaveText}>Save</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          <Image source={{ uri: COVER_IMAGE }} style={styles.coverImage} />
          <TouchableOpacity style={styles.shareBtn} onPress={handleShareProfile}>
            <FontAwesome name="share-alt" size={20} color={theme.colors.WHITE} />
          </TouchableOpacity>
        </View>

        {/* Avatar and Basic Info */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleProfilePictureChange} style={styles.avatarPressable}>
            {avatarLoading ? (
              <View style={[styles.profileImage, { justifyContent: 'center', alignItems: 'center' }] }>
                <ActivityIndicator size="large" color={theme.colors.ACCENT_COLOR} />
              </View>
            ) : (
                <Image
                source={{ uri: avatarUri || AVATAR_PLACEHOLDER }}
                  style={styles.profileImage}
                />
            )}
                <View style={styles.cameraIconContainer}>
                  <Ionicons name="camera-outline" size={20} color={theme.colors.WHITE} />
                </View>
          </TouchableOpacity>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.username}>@{username}</Text>
          <Text style={styles.joinDate}>{joinDate}</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="alert-outline" size={22} color={theme.colors.ERROR_COLOR} />
            <Text style={styles.statValue}>{hazardsReported}</Text>
            <Text style={styles.statLabel}>Hazards Reported</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="bookmark-outline" size={22} color={theme.colors.ACCENT_COLOR} />
            <Text style={styles.statValue}>{destinationsSaved}</Text>
            <Text style={styles.statLabel}>Destinations Saved</Text>
          </View>
        </View>

        {/* Profile Form */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profile Info</Text>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.TEXT_SECONDARY}
                autoCorrect={false}
              />
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={theme.colors.TEXT_SECONDARY}
          />
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={theme.colors.TEXT_SECONDARY}
              />
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us a bit about yourself"
                multiline
            numberOfLines={4}
                placeholderTextColor={theme.colors.TEXT_SECONDARY}
            textAlignVertical="top"
          />
          <TouchableOpacity style={styles.changePasswordBtn} onPress={handleChangePassword}>
            <MaterialCommunityIcons name="lock-reset" size={20} color={theme.colors.ACCENT_COLOR} />
            <Text style={styles.changePasswordText}>Change Password</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Save Button */}
      <TouchableOpacity style={styles.fab} onPress={handleSaveChanges}>
        <Ionicons name="checkmark" size={28} color={theme.colors.WHITE} />
      </TouchableOpacity>

      {/* Change Password Modal (placeholder) */}
      <Modal visible={changePasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Text style={{ color: theme.colors.TEXT_SECONDARY, marginBottom: 18, textAlign: 'center' }}>
              Password change feature coming soon!
            </Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setChangePasswordModal(false)}>
              <Text style={styles.modalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Action Sheet for Avatar Change */}
      <Modal
        visible={avatarActionSheetVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setAvatarActionSheetVisible(false)}
      >
        <View style={styles.actionSheetOverlay}>
          <View style={styles.actionSheetContainer}>
            <Text style={styles.actionSheetTitle}>Change Profile Picture</Text>
            <TouchableOpacity style={styles.actionSheetBtn} onPress={pickFromCamera}>
              <Ionicons name="camera" size={20} color={theme.colors.ACCENT_COLOR} style={{ marginRight: 10 }} />
              <Text style={styles.actionSheetBtnText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionSheetBtn} onPress={pickFromLibrary}>
              <Ionicons name="image" size={20} color={theme.colors.ACCENT_COLOR} style={{ marginRight: 10 }} />
              <Text style={styles.actionSheetBtnText}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionSheetBtn, { justifyContent: 'center' }]} onPress={() => setAvatarActionSheetVisible(false)}>
              <Text style={[styles.actionSheetBtnText, { color: theme.colors.ERROR_COLOR, fontWeight: '700' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default ProfileScreen;