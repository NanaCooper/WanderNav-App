import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar,
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { addAlpha } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientIds: string[];
  timestamp: string;
  isRead?: boolean;
}

interface User {
  id: string;
  username: string;
  avatar: string;
  isOnline?: boolean;
  lastSeen?: string;
}

const DirectChatScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { userId, username, avatar } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showCallOptions, setShowCallOptions] = useState(false);
  const [showVideoOptions, setShowVideoOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const currentUserId = 'currentUserId'; // TODO: Replace with real auth user id

  // Generate styles with theme
  const getStyles = () => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.BACKGROUND_PRIMARY,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.BORDER_COLOR_LIGHT,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 6,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: addAlpha(theme.colors.BACKGROUND_SECONDARY, 0.8),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    userInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginRight: 14,
      borderWidth: 2,
      borderColor: addAlpha(theme.colors.ACCENT_COLOR, 0.3),
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    userDetails: {
      flex: 1,
    },
    username: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 3,
      letterSpacing: 0.2,
    },
    userStatus: {
      fontSize: 13,
      color: theme.colors.TEXT_SECONDARY,
      fontWeight: '500',
      letterSpacing: 0.1,
    },
    onlineIndicator: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#10B981',
      marginLeft: 8,
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    headerActionButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: addAlpha(theme.colors.BACKGROUND_SECONDARY, 0.8),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    messagesContainer: {
      flex: 1,
      paddingHorizontal: 18,
    },
    messageBubble: {
      maxWidth: '72%',
      marginVertical: 8,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderRadius: 18,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 3,
    },
    messageLeft: {
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      alignSelf: 'flex-start',
      borderBottomLeftRadius: 4,
      borderWidth: 0.5,
      borderColor: addAlpha(theme.colors.BORDER_COLOR_LIGHT, 0.3),
    },
    messageRight: {
      backgroundColor: theme.colors.ACCENT_COLOR,
      alignSelf: 'flex-end',
      borderBottomRightRadius: 4,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.TEXT_PRIMARY,
      fontWeight: '400',
      letterSpacing: 0.1,
    },
    messageTextRight: {
      color: theme.colors.WHITE,
      fontWeight: '500',
    },
    messageTime: {
      fontSize: 11,
      marginTop: 6,
      alignSelf: 'flex-end',
      fontWeight: '500',
      letterSpacing: 0.2,
    },
    messageTimeLeft: {
      color: theme.colors.TEXT_TERTIARY,
    },
    messageTimeRight: {
      color: addAlpha(theme.colors.WHITE, 0.8),
    },
    readIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    readIcon: {
      marginLeft: 6,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 16,
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderTopWidth: 1,
      borderTopColor: addAlpha(theme.colors.BORDER_COLOR_LIGHT, 0.5),
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    inputWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
      borderRadius: 26,
      paddingHorizontal: 18,
      paddingVertical: 10,
      marginRight: 14,
      borderWidth: 1,
      borderColor: addAlpha(theme.colors.BORDER_COLOR_LIGHT, 0.3),
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: theme.colors.TEXT_PRIMARY,
      paddingVertical: 8,
      fontWeight: '400',
      letterSpacing: 0.1,
    },
    inputActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    inputActionButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: addAlpha(theme.colors.ACCENT_COLOR, 0.08),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: addAlpha(theme.colors.ACCENT_COLOR, 0.1),
    },
    sendButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: theme.colors.ACCENT_COLOR,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 5,
    },
    typingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    typingText: {
      fontSize: 13,
      color: theme.colors.TEXT_SECONDARY,
      fontStyle: 'italic',
      fontWeight: '500',
      letterSpacing: 0.1,
    },
    typingDots: {
      flexDirection: 'row',
      marginLeft: 6,
    },
    typingDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: theme.colors.TEXT_SECONDARY,
      marginHorizontal: 1.5,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: addAlpha(theme.colors.BACKGROUND_PRIMARY, 0.85),
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderRadius: 24,
      padding: 28,
      margin: 24,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 12,
      borderWidth: 0.5,
      borderColor: addAlpha(theme.colors.BORDER_COLOR_LIGHT, 0.2),
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.TEXT_PRIMARY,
      marginLeft: 14,
      letterSpacing: 0.3,
    },
    modalCloseButton: {
      marginLeft: 'auto',
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: addAlpha(theme.colors.BACKGROUND_SECONDARY, 0.8),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    userProfileContent: {
      alignItems: 'center',
    },
    profileAvatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      marginBottom: 20,
      borderWidth: 3,
      borderColor: addAlpha(theme.colors.ACCENT_COLOR, 0.3),
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    profileUsername: {
      fontSize: 26,
      fontWeight: '700',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 10,
      letterSpacing: 0.3,
    },
    profileStatus: {
      fontSize: 16,
      color: theme.colors.TEXT_SECONDARY,
      marginBottom: 20,
      fontWeight: '500',
      letterSpacing: 0.1,
    },
    profileActions: {
      flexDirection: 'row',
      gap: 14,
    },
    profileActionButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: addAlpha(theme.colors.BORDER_COLOR_LIGHT, 0.5),
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    profileActionButtonPrimary: {
      backgroundColor: theme.colors.ACCENT_COLOR,
      borderColor: theme.colors.ACCENT_COLOR,
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    profileActionText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.TEXT_SECONDARY,
      letterSpacing: 0.2,
    },
    profileActionTextPrimary: {
      color: theme.colors.WHITE,
      fontWeight: '700',
    },
    mediaPickerContent: {
      alignItems: 'center',
    },
    mediaOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 18,
      paddingHorizontal: 22,
      borderRadius: 14,
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
      marginBottom: 14,
      width: '100%',
      borderWidth: 0.5,
      borderColor: addAlpha(theme.colors.BORDER_COLOR_LIGHT, 0.2),
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    mediaOptionIcon: {
      marginRight: 14,
    },
    mediaOptionText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.TEXT_PRIMARY,
      letterSpacing: 0.1,
    },
    // Call/Video options
    callOptionsContent: {
      alignItems: 'center',
    },
    callOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 18,
      paddingHorizontal: 22,
      borderRadius: 14,
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
      marginBottom: 14,
      width: '100%',
      borderWidth: 0.5,
      borderColor: addAlpha(theme.colors.BORDER_COLOR_LIGHT, 0.2),
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    callOptionIcon: {
      marginRight: 14,
    },
    callOptionText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.TEXT_PRIMARY,
      letterSpacing: 0.1,
    },
    // Loading overlay
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: addAlpha(theme.colors.BACKGROUND_PRIMARY, 0.8),
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    loadingContent: {
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    loadingText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.TEXT_PRIMARY,
      marginTop: 16,
      letterSpacing: 0.2,
    },
  });

  const styles = getStyles();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      const mockMessages: Message[] = [
        {
          id: '1',
          content: 'Hey! How are you doing?',
          senderId: userId as string,
          recipientIds: [currentUserId],
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          isRead: true,
        },
        {
          id: '2',
          content: 'I\'m doing great! Just working on this amazing app. How about you?',
          senderId: currentUserId,
          recipientIds: [userId as string],
          timestamp: new Date(Date.now() - 3000000).toISOString(),
          isRead: true,
        },
        {
          id: '3',
          content: 'That sounds awesome! I\'d love to see it when it\'s ready.',
          senderId: userId as string,
          recipientIds: [currentUserId],
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          isRead: true,
        },
        {
          id: '4',
          content: 'Definitely! I\'ll share it with you once it\'s polished.',
          senderId: currentUserId,
          recipientIds: [userId as string],
          timestamp: new Date(Date.now() - 900000).toISOString(),
          isRead: false,
        },
      ];
      setMessages(mockMessages);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      senderId: currentUserId,
      recipientIds: [userId as string],
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setInput('');
    setMessages(prev => [...prev, newMessage]);
    
    // Simulate typing indicator
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
    
    // Auto-scroll to bottom
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === currentUserId;
    
    return (
      <View style={[
        styles.messageBubble,
        isMyMessage ? styles.messageRight : styles.messageLeft
      ]}>
        <Text style={[
          styles.messageText,
          isMyMessage && styles.messageTextRight
        ]}>
          {item.content}
        </Text>
        <View style={styles.readIndicator}>
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.messageTimeRight : styles.messageTimeLeft
          ]}>
            {new Date(item.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
          {isMyMessage && (
            <Ionicons 
              name={item.isRead ? "checkmark-done" : "checkmark"} 
              size={12} 
              color={addAlpha(theme.colors.WHITE, 0.8)} 
              style={styles.readIcon}
            />
          )}
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={styles.typingIndicator}>
        <Text style={styles.typingText}>{username} is typing</Text>
        <View style={styles.typingDots}>
          <Animated.View style={styles.typingDot} />
          <Animated.View style={styles.typingDot} />
          <Animated.View style={styles.typingDot} />
        </View>
      </View>
    );
  };

  // Full-stack functionality handlers
  const handleUserProfilePress = () => {
    setShowUserProfile(true);
  };

  const handleMediaPickerPress = () => {
    setShowMediaPicker(true);
  };

  const handleVoiceMessage = () => {
    setIsRecording(!isRecording);
    Alert.alert('Voice Message', isRecording ? 'Recording stopped' : 'Recording started');
  };

  const handleLocationShare = () => {
    Alert.alert('Share Location', 'Location sharing feature coming soon!');
  };

  const handleCallPress = () => {
    setShowCallOptions(true);
  };

  const handleVideoPress = () => {
    setShowVideoOptions(true);
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Block', 
          style: 'destructive',
          onPress: () => {
            setShowUserProfile(false);
            router.back();
          }
        },
      ]
    );
  };

  const handleReportUser = () => {
    Alert.alert('Report User', 'Report submitted successfully');
    setShowUserProfile(false);
  };

  const handleStartCall = (type: 'audio' | 'video') => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowCallOptions(false);
      setShowVideoOptions(false);
      Alert.alert(`${type === 'audio' ? 'Audio' : 'Video'} Call`, 'Call initiated successfully!');
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={Platform.OS === 'ios' ? "dark-content" : "light-content"} 
        backgroundColor={theme.colors.BACKGROUND_SURFACE} 
      />
      
      <LinearGradient
        colors={[theme.colors.BACKGROUND_PRIMARY, theme.colors.BACKGROUND_SECONDARY]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.TEXT_PRIMARY} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.userInfo} 
          onPress={handleUserProfilePress}
        >
          <Image 
            source={{ uri: avatar as string }} 
            style={styles.avatar} 
          />
          <View style={styles.userDetails}>
            <Text style={styles.username}>{username}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.userStatus}>Online</Text>
              <View style={styles.onlineIndicator} />
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={handleCallPress}
          >
            <Ionicons name="call" size={18} color={theme.colors.ACCENT_COLOR} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={handleVideoPress}
          >
            <Ionicons name="videocam" size={18} color={theme.colors.ACCENT_COLOR} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={renderTypingIndicator}
        showsVerticalScrollIndicator={false}
      />

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <View style={styles.inputActions}>
            <TouchableOpacity 
              style={styles.inputActionButton}
              onPress={handleMediaPickerPress}
            >
              <Ionicons name="add" size={18} color={theme.colors.ACCENT_COLOR} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.inputActionButton}
              onPress={handleVoiceMessage}
            >
              <Ionicons name="mic" size={18} color={isRecording ? '#FF4444' : theme.colors.ACCENT_COLOR} />
            </TouchableOpacity>
          </View>
          
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.TEXT_TERTIARY}
            multiline
            maxLength={500}
          />
        </View>
        
        <TouchableOpacity 
          style={[
            styles.sendButton,
            !input.trim() && { opacity: 0.5 }
          ]} 
          onPress={sendMessage}
          disabled={!input.trim()}
        >
          <Ionicons name="send" size={18} color={theme.colors.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={theme.colors.ACCENT_COLOR} />
            <Text style={styles.loadingText}>Connecting...</Text>
          </View>
        </View>
      )}

      {/* User Profile Modal */}
      <Modal visible={showUserProfile} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Profile</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowUserProfile(false)}
              >
                <Ionicons name="close" size={18} color={theme.colors.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.userProfileContent}>
              <Image source={{ uri: avatar as string }} style={styles.profileAvatar} />
              <Text style={styles.profileUsername}>{username}</Text>
              <Text style={styles.profileStatus}>Online • Last seen 2 minutes ago</Text>
              
              <View style={styles.profileActions}>
                <TouchableOpacity style={styles.profileActionButton} onPress={handleBlockUser}>
                  <Text style={styles.profileActionText}>Block</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.profileActionButton, styles.profileActionButtonPrimary]} onPress={handleReportUser}>
                  <Text style={styles.profileActionTextPrimary}>Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Media Picker Modal */}
      <Modal visible={showMediaPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowMediaPicker(false)}
              >
                <Ionicons name="close" size={18} color={theme.colors.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.mediaPickerContent}>
              <TouchableOpacity style={styles.mediaOption}>
                <Ionicons name="camera" size={20} color={theme.colors.ACCENT_COLOR} style={styles.mediaOptionIcon} />
                <Text style={styles.mediaOptionText}>Camera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.mediaOption}>
                <Ionicons name="images" size={20} color={theme.colors.ACCENT_COLOR} style={styles.mediaOptionIcon} />
                <Text style={styles.mediaOptionText}>Photo Library</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.mediaOption} onPress={handleLocationShare}>
                <Ionicons name="location" size={20} color={theme.colors.ACCENT_COLOR} style={styles.mediaOptionIcon} />
                <Text style={styles.mediaOptionText}>Location</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.mediaOption}>
                <Ionicons name="document" size={20} color={theme.colors.ACCENT_COLOR} style={styles.mediaOptionIcon} />
                <Text style={styles.mediaOptionText}>Document</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Call Options Modal */}
      <Modal visible={showCallOptions} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Start Call</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowCallOptions(false)}
              >
                <Ionicons name="close" size={18} color={theme.colors.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.callOptionsContent}>
              <TouchableOpacity style={styles.callOption} onPress={() => handleStartCall('audio')}>
                <Ionicons name="call" size={20} color={theme.colors.ACCENT_COLOR} style={styles.callOptionIcon} />
                <Text style={styles.callOptionText}>Audio Call</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.callOption} onPress={() => handleStartCall('video')}>
                <Ionicons name="videocam" size={20} color={theme.colors.ACCENT_COLOR} style={styles.callOptionIcon} />
                <Text style={styles.callOptionText}>Video Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Video Options Modal */}
      <Modal visible={showVideoOptions} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Video Call</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowVideoOptions(false)}
              >
                <Ionicons name="close" size={18} color={theme.colors.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.callOptionsContent}>
              <TouchableOpacity style={styles.callOption} onPress={() => handleStartCall('video')}>
                <Ionicons name="videocam" size={20} color={theme.colors.ACCENT_COLOR} style={styles.callOptionIcon} />
                <Text style={styles.callOptionText}>Start Video Call</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.callOption}>
                <Ionicons name="settings" size={20} color={theme.colors.ACCENT_COLOR} style={styles.callOptionIcon} />
                <Text style={styles.callOptionText}>Call Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DirectChatScreen; 