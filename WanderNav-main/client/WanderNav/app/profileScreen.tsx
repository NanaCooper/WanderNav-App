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
import { THEME } from '../constants/theme';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const COVER_IMAGE = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';
const AVATAR_PLACEHOLDER = 'https://placeimg.com/150/150/people/3';

const ProfileScreen = () => {
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
      style={{ flex: 1, backgroundColor: THEME.BACKGROUND_LIGHT }}
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
            <FontAwesome name="share-alt" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Avatar and Basic Info */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleProfilePictureChange} style={styles.avatarPressable}>
            {avatarLoading ? (
              <View style={[styles.profileImage, { justifyContent: 'center', alignItems: 'center' }] }>
                <ActivityIndicator size="large" color="#3498DB" />
              </View>
            ) : (
              <Image
                source={{ uri: avatarUri || AVATAR_PLACEHOLDER }}
                style={styles.profileImage}
              />
            )}
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera-outline" size={20} color={THEME.BACKGROUND_WHITE} />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.username}>@{username}</Text>
          <Text style={styles.joinDate}>{joinDate}</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="alert-outline" size={22} color="#E67E22" />
            <Text style={styles.statValue}>{hazardsReported}</Text>
            <Text style={styles.statLabel}>Hazards Reported</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="bookmark-outline" size={22} color="#3498DB" />
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
            placeholderTextColor={THEME.TEXT_SECONDARY}
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
            placeholderTextColor={THEME.TEXT_SECONDARY}
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
            placeholderTextColor={THEME.TEXT_SECONDARY}
          />
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us a bit about yourself"
            multiline
            numberOfLines={4}
            placeholderTextColor={THEME.TEXT_SECONDARY}
            textAlignVertical="top"
          />
          <TouchableOpacity style={styles.changePasswordBtn} onPress={handleChangePassword}>
            <MaterialCommunityIcons name="lock-reset" size={20} color="#3498DB" />
            <Text style={styles.changePasswordText}>Change Password</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Save Button */}
      <TouchableOpacity style={styles.fab} onPress={handleSaveChanges}>
        <Ionicons name="checkmark" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Change Password Modal (placeholder) */}
      <Modal visible={changePasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Text style={{ color: THEME.TEXT_SECONDARY, marginBottom: 18, textAlign: 'center' }}>
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
              <Ionicons name="camera" size={20} color="#3498DB" style={{ marginRight: 10 }} />
              <Text style={styles.actionSheetBtnText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionSheetBtn} onPress={pickFromLibrary}>
              <Ionicons name="image" size={20} color="#3498DB" style={{ marginRight: 10 }} />
              <Text style={styles.actionSheetBtnText}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionSheetBtn, { justifyContent: 'center' }]} onPress={() => setAvatarActionSheetVisible(false)}>
              <Text style={[styles.actionSheetBtnText, { color: '#E74C3C', fontWeight: '700' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
    backgroundColor: '#3498DB',
    borderRadius: 20,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
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
    borderColor: '#fff',
    backgroundColor: '#eee',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: '#3498DB',
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
    marginTop: 10,
  },
  username: {
    fontSize: 15,
    color: '#7F8C8D',
    marginTop: 2,
  },
  joinDate: {
    fontSize: 13,
    color: '#B0B7C3',
    marginTop: 2,
    marginBottom: 8,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 18,
    elevation: 2,
    shadowColor: '#000',
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
    color: '#3498DB',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 32,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498DB',
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    color: '#7F8C8D',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F8F9FB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    color: '#2C3E50',
    borderWidth: 1,
    borderColor: '#E0E4EA',
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
    backgroundColor: '#EAF3FB',
  },
  changePasswordText: {
    color: '#3498DB',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#3498DB',
    borderRadius: 32,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  headerSaveText: {
    color: THEME.ACCENT_COLOR,
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
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3498DB',
    marginBottom: 18,
    textAlign: 'center',
  },
  modalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EAF3FB',
    marginTop: 10,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3498DB',
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionSheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 24,
    width: '100%',
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 10,
  },
  actionSheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3498DB',
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
    backgroundColor: '#F4F6F8',
  },
  actionSheetBtnText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
  },
});

export default ProfileScreen;