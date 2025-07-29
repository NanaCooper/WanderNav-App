import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Switch,
  Linking,
  Platform,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const USERNAME = 'John Doe'; // Replace with real user data if available
const EMAIL = 'john.doe@email.com'; // Replace with real user data if available
const APP_VERSION = '1.0.0';

const SettingsScreen = () => {
  const router = useRouter();
  const { theme, themeMode, isDark, toggleTheme, setThemeMode } = useTheme();
  const [isMetric, setIsMetric] = useState(true);
  const [language, setLanguage] = useState('English');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [editName, setEditName] = useState(USERNAME);
  const [editEmail, setEditEmail] = useState(EMAIL);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      Alert.alert('Success', 'You have been logged out.');
      router.replace('/SignIn');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Logout error:', error.message);
        Alert.alert('Error', error.message);
      } else {
        console.error('Unknown error during logout:', error);
        Alert.alert('Error', 'Something went wrong.');
      }
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleThemeModeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
  };

  const handleUnitsToggle = () => {
    setIsMetric((prev) => !prev);
    // Integrate with your units context/provider if available
  };

  const handleLanguageChange = () => {
    // Placeholder: Show language picker or modal
    Alert.alert('Language', 'Language picker coming soon!');
  };

  const handleNotificationToggle = () => {
    setNotificationsEnabled((prev) => !prev);
    // Integrate with your notification settings if available
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link.');
    });
  };

  const handleFeedback = () => {
    const email = 'support@wandernav.com';
    const subject = 'WanderNav App Feedback';
    const mailUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    Linking.openURL(mailUrl).catch(() => {
      Alert.alert('Error', 'Unable to open email client.');
    });
  };

  const handleRateApp = () => {
    // Replace with your app's store URL
    openLink('https://play.google.com/store/apps/details?id=com.yourusername.wandernav');
  };

  const handleInviteFriends = () => {
    // Placeholder: Share app link
    Alert.alert('Invite Friends', 'Share feature coming soon!');
  };

  const handleSocialLink = (platform: string) => {
    // Replace with your real social links
    const urls: any = {
      twitter: 'https://twitter.com/wandernav',
      facebook: 'https://facebook.com/wandernav',
      instagram: 'https://instagram.com/wandernav',
    };
    openLink(urls[platform]);
  };

  // Profile editing modal logic
  const handleSaveProfile = () => {
    // Placeholder: Save profile changes
    setEditProfileModal(false);
    Alert.alert('Profile Updated', 'Your profile has been updated.');
  };

  // Change password modal logic
  const handleChangePassword = () => {
    // Placeholder: Change password logic
    setChangePasswordModal(false);
    Alert.alert('Password Changed', 'Your password has been changed.');
  };

  // Delete account modal logic
  const handleDeleteAccount = () => {
    // Placeholder: Delete account logic
    setDeleteAccountModal(false);
    Alert.alert('Account Deleted', 'Your account has been deleted.');
    // Optionally log out or redirect
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.BACKGROUND_PRIMARY }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Ionicons name="person-circle" size={72} color={theme.colors.PRIMARY_BRAND_COLOR} />
          </View>
          <Text style={[styles.username, { color: theme.colors.TEXT_PRIMARY }]}>{editName}</Text>
          <Text style={[styles.email, { color: theme.colors.TEXT_SECONDARY }]}>{editEmail}</Text>
          <TouchableOpacity style={[styles.editProfileBtn, { backgroundColor: theme.colors.BACKGROUND_SECONDARY }]} onPress={() => setEditProfileModal(true)}>
            <Ionicons name="create-outline" size={18} color={theme.colors.PRIMARY_BRAND_COLOR} />
            <Text style={[styles.editProfileText, { color: theme.colors.PRIMARY_BRAND_COLOR }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.BACKGROUND_SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.PRIMARY_BRAND_COLOR }]}>Account</Text>
          <TouchableOpacity style={styles.row} onPress={() => setChangePasswordModal(true)}>
            <MaterialCommunityIcons name="lock-reset" size={24} color={theme.colors.TEXT_PRIMARY} style={styles.icon} />
            <Text style={[styles.rowLabel, { color: theme.colors.TEXT_PRIMARY }]}>Change Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => setDeleteAccountModal(true)}>
            <MaterialCommunityIcons name="account-remove-outline" size={24} color={theme.colors.ERROR_COLOR} style={styles.icon} />
            <Text style={[styles.rowLabel, { color: theme.colors.ERROR_COLOR }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Theme Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.BACKGROUND_SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.PRIMARY_BRAND_COLOR }]}>Theme</Text>
          <View style={styles.row}>
            <MaterialCommunityIcons name="theme-light-dark" size={24} color={theme.colors.TEXT_PRIMARY} style={styles.icon} />
            <Text style={[styles.rowLabel, { color: theme.colors.TEXT_PRIMARY }]}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={handleThemeToggle}
              thumbColor={isDark ? theme.colors.ACCENT_COLOR : theme.colors.WHITE}
              trackColor={{ false: theme.colors.BORDER_COLOR, true: theme.colors.ACCENT_COLOR }}
              style={styles.switch}
            />
          </View>
          <View style={styles.row}>
            <MaterialCommunityIcons name="palette-outline" size={24} color={theme.colors.TEXT_PRIMARY} style={styles.icon} />
            <Text style={[styles.rowLabel, { color: theme.colors.TEXT_PRIMARY }]}>Theme Mode</Text>
            <Text style={[styles.valueText, { color: theme.colors.TEXT_SECONDARY }]}>
              {themeMode === 'system' ? 'Auto' : themeMode === 'dark' ? 'Dark' : 'Light'}
            </Text>
          </View>
          <View style={styles.themeModeButtons}>
            <TouchableOpacity 
              style={[
                styles.themeModeButton, 
                { backgroundColor: themeMode === 'light' ? theme.colors.ACCENT_COLOR : theme.colors.BACKGROUND_SECONDARY }
              ]} 
              onPress={() => handleThemeModeChange('light')}
            >
              <Text style={[
                styles.themeModeButtonText, 
                { color: themeMode === 'light' ? theme.colors.WHITE : theme.colors.TEXT_SECONDARY }
              ]}>
                Light
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.themeModeButton, 
                { backgroundColor: themeMode === 'dark' ? theme.colors.ACCENT_COLOR : theme.colors.BACKGROUND_SECONDARY }
              ]} 
              onPress={() => handleThemeModeChange('dark')}
            >
              <Text style={[
                styles.themeModeButtonText, 
                { color: themeMode === 'dark' ? theme.colors.WHITE : theme.colors.TEXT_SECONDARY }
              ]}>
                Dark
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.themeModeButton, 
                { backgroundColor: themeMode === 'system' ? theme.colors.ACCENT_COLOR : theme.colors.BACKGROUND_SECONDARY }
              ]} 
              onPress={() => handleThemeModeChange('system')}
            >
              <Text style={[
                styles.themeModeButtonText, 
                { color: themeMode === 'system' ? theme.colors.WHITE : theme.colors.TEXT_SECONDARY }
              ]}>
                Auto
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.BACKGROUND_SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.PRIMARY_BRAND_COLOR }]}>Preferences</Text>
          <TouchableOpacity style={styles.row} onPress={handleLanguageChange}>
            <MaterialCommunityIcons name="translate" size={24} color={theme.colors.TEXT_PRIMARY} style={styles.icon} />
            <Text style={[styles.rowLabel, { color: theme.colors.TEXT_PRIMARY }]}>Language</Text>
            <Text style={[styles.valueText, { color: theme.colors.TEXT_SECONDARY }]}>{language}</Text>
          </TouchableOpacity>
          <View style={styles.row}>
            <MaterialCommunityIcons name="ruler-square" size={24} color={theme.colors.TEXT_PRIMARY} style={styles.icon} />
            <Text style={[styles.rowLabel, { color: theme.colors.TEXT_PRIMARY }]}>Units</Text>
            <Text style={[styles.valueText, { color: theme.colors.TEXT_SECONDARY }]}>{isMetric ? 'Metric (km, °C)' : 'Imperial (mi, °F)'}</Text>
            <Switch
              value={isMetric}
              onValueChange={handleUnitsToggle}
              thumbColor={isMetric ? theme.colors.ACCENT_COLOR : theme.colors.WHITE}
              trackColor={{ false: theme.colors.BORDER_COLOR, true: theme.colors.ACCENT_COLOR }}
              style={styles.switch}
            />
          </View>
          <View style={styles.row}>
            <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.TEXT_PRIMARY} style={styles.icon} />
            <Text style={[styles.rowLabel, { color: theme.colors.TEXT_PRIMARY }]}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              thumbColor={notificationsEnabled ? theme.colors.ACCENT_COLOR : theme.colors.WHITE}
              trackColor={{ false: theme.colors.BORDER_COLOR, true: theme.colors.ACCENT_COLOR }}
              style={styles.switch}
            />
          </View>
        </View>

        {/* App Info Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.BACKGROUND_SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.PRIMARY_BRAND_COLOR }]}>App</Text>
          <View style={styles.row}>
            <MaterialCommunityIcons name="information-outline" size={24} color={theme.colors.TEXT_PRIMARY} style={styles.icon} />
            <Text style={[styles.rowLabel, { color: theme.colors.TEXT_PRIMARY }]}>Version</Text>
            <Text style={[styles.valueText, { color: theme.colors.TEXT_SECONDARY }]}>{APP_VERSION}</Text>
          </View>
          <TouchableOpacity style={styles.row} onPress={() => Alert.alert('About', 'WanderNav helps you navigate, report hazards, and connect with your travel community.') }>
            <MaterialCommunityIcons name="account-group-outline" size={24} color={theme.colors.TEXT_PRIMARY} style={styles.icon} />
            <Text style={[styles.rowLabel, { color: theme.colors.TEXT_PRIMARY }]}>About WanderNav</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={handleRateApp}>
            <FontAwesome name="star" size={22} color="#F1C40F" style={styles.icon} />
            <Text style={[styles.rowLabel, { color: theme.colors.TEXT_PRIMARY }]}>Rate Us</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={handleInviteFriends}>
            <MaterialCommunityIcons name="account-plus-outline" size={24} color={theme.colors.TEXT_PRIMARY} style={styles.icon} />
            <Text style={[styles.rowLabel, { color: theme.colors.TEXT_PRIMARY }]}>Invite Friends</Text>
          </TouchableOpacity>
          <View style={[styles.row, { justifyContent: 'flex-start' }] }>
            <TouchableOpacity onPress={() => handleSocialLink('twitter')} style={styles.socialIconBtn}>
              <FontAwesome name="twitter" size={22} color="#1DA1F2" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSocialLink('facebook')} style={styles.socialIconBtn}>
              <FontAwesome name="facebook" size={22} color="#1877F3" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSocialLink('instagram')} style={styles.socialIconBtn}>
              <FontAwesome name="instagram" size={22} color="#C13584" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.BACKGROUND_SURFACE }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.PRIMARY_BRAND_COLOR }]}>Support</Text>
          <TouchableOpacity style={styles.row} onPress={handleFeedback}>
            <Ionicons name="mail-outline" size={24} color={theme.colors.TEXT_PRIMARY} style={styles.icon} />
            <Text style={[styles.rowLabel, { color: theme.colors.TEXT_PRIMARY }]}>Send Feedback</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => openLink('https://wandernav.com/faq')}>
            <MaterialCommunityIcons name="help-circle-outline" size={24} color={theme.colors.TEXT_PRIMARY} style={styles.icon} />
            <Text style={[styles.rowLabel, { color: theme.colors.TEXT_PRIMARY }]}>FAQ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => openLink('https://wandernav.com/support')}>
            <MaterialCommunityIcons name="headset" size={24} color={theme.colors.TEXT_PRIMARY} style={styles.icon} />
            <Text style={[styles.rowLabel, { color: theme.colors.TEXT_PRIMARY }]}>Contact Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => Alert.alert('Report a Bug', 'Bug report feature coming soon!')}>
            <MaterialCommunityIcons name="bug-outline" size={24} color="#E67E22" style={styles.icon} />
            <Text style={[styles.rowLabel, { color: theme.colors.TEXT_PRIMARY }]}>Report a Bug</Text>
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.BACKGROUND_SURFACE }]}>
          <TouchableOpacity style={styles.row} onPress={() => openLink('https://wandernav.com/privacy')}>
            <MaterialCommunityIcons name="shield-lock-outline" size={24} color={theme.colors.TEXT_PRIMARY} style={styles.icon} />
            <Text style={[styles.rowLabel, { color: theme.colors.TEXT_PRIMARY }]}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => openLink('https://wandernav.com/terms')}>
            <MaterialCommunityIcons name="file-document-outline" size={24} color={theme.colors.TEXT_PRIMARY} style={styles.icon} />
            <Text style={[styles.rowLabel, { color: theme.colors.TEXT_PRIMARY }]}>Terms of Service</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={[styles.section, { backgroundColor: theme.colors.BACKGROUND_SURFACE }]}>
          <TouchableOpacity style={[styles.row, styles.logoutRow]} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={24} color={theme.colors.ERROR_COLOR} style={styles.icon} />
            <Text style={[styles.rowLabel, { color: theme.colors.ERROR_COLOR }]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editProfileModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.BACKGROUND_SURFACE }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.PRIMARY_BRAND_COLOR }]}>Edit Profile</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.BACKGROUND_SECONDARY,
                color: theme.colors.TEXT_PRIMARY,
                borderColor: theme.colors.BORDER_COLOR
              }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Name"
              placeholderTextColor={theme.colors.TEXT_SECONDARY}
            />
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.BACKGROUND_SECONDARY,
                color: theme.colors.TEXT_PRIMARY,
                borderColor: theme.colors.BORDER_COLOR
              }]}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Email"
              placeholderTextColor={theme.colors.TEXT_SECONDARY}
              keyboardType="email-address"
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.colors.BACKGROUND_SECONDARY }]} onPress={() => setEditProfileModal(false)}>
                <Text style={[styles.modalBtnText, { color: theme.colors.TEXT_PRIMARY }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: theme.colors.ACCENT_COLOR }]} onPress={handleSaveProfile}>
                <Text style={[styles.modalBtnText, { color: theme.colors.WHITE }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={changePasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.BACKGROUND_SURFACE }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.PRIMARY_BRAND_COLOR }]}>Change Password</Text>
            <TextInput 
              style={[styles.input, { 
                backgroundColor: theme.colors.BACKGROUND_SECONDARY,
                color: theme.colors.TEXT_PRIMARY,
                borderColor: theme.colors.BORDER_COLOR
              }]}
              placeholder="Current Password" 
              placeholderTextColor={theme.colors.TEXT_SECONDARY}
              secureTextEntry 
            />
            <TextInput 
              style={[styles.input, { 
                backgroundColor: theme.colors.BACKGROUND_SECONDARY,
                color: theme.colors.TEXT_PRIMARY,
                borderColor: theme.colors.BORDER_COLOR
              }]}
              placeholder="New Password" 
              placeholderTextColor={theme.colors.TEXT_SECONDARY}
              secureTextEntry 
            />
            <TextInput 
              style={[styles.input, { 
                backgroundColor: theme.colors.BACKGROUND_SECONDARY,
                color: theme.colors.TEXT_PRIMARY,
                borderColor: theme.colors.BORDER_COLOR
              }]}
              placeholder="Confirm New Password" 
              placeholderTextColor={theme.colors.TEXT_SECONDARY}
              secureTextEntry 
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.colors.BACKGROUND_SECONDARY }]} onPress={() => setChangePasswordModal(false)}>
                <Text style={[styles.modalBtnText, { color: theme.colors.TEXT_PRIMARY }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: theme.colors.ACCENT_COLOR }]} onPress={handleChangePassword}>
                <Text style={[styles.modalBtnText, { color: theme.colors.WHITE }]}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={deleteAccountModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.BACKGROUND_SURFACE }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.PRIMARY_BRAND_COLOR }]}>Delete Account</Text>
            <Text style={[styles.modalBtnText, { color: theme.colors.ERROR_COLOR, marginBottom: 16, textAlign: 'center' }]}>
              Are you sure you want to delete your account? This action cannot be undone.
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.colors.BACKGROUND_SECONDARY }]} onPress={() => setDeleteAccountModal(false)}>
                <Text style={[styles.modalBtnText, { color: theme.colors.TEXT_PRIMARY }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: theme.colors.ERROR_COLOR }]} onPress={handleDeleteAccount}>
                <Text style={[styles.modalBtnText, { color: theme.colors.WHITE }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrapper: {
    marginBottom: 10,
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 2,
  },
  email: {
    fontSize: 15,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#EAF3FB',
  },
  editProfileText: {
    color: '#3498DB',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498DB',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLabel: {
    fontSize: 16,
    color: '#2C3E50',
    flex: 1,
    marginLeft: 12,
  },
  valueText: {
    fontSize: 15,
    color: '#7F8C8D',
    marginRight: 8,
  },
  icon: {
    marginRight: 8,
  },
  switch: {
    marginLeft: 'auto',
  },
  logoutRow: {
    marginTop: 8,
  },
  socialIconBtn: {
    marginRight: 16,
    marginTop: 2,
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
  input: {
    backgroundColor: '#F4F6F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    color: '#2C3E50',
    borderWidth: 1,
    borderColor: '#E0E4EA',
    marginBottom: 14,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EAF3FB',
    marginLeft: 10,
  },
  modalBtnPrimary: {
    backgroundColor: '#3498DB',
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3498DB',
  },
  themeModeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 12,
  },
  themeModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  themeModeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
