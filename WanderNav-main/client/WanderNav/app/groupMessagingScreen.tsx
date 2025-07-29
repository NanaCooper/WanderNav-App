import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Animated,
  Image,
  Dimensions,
  StatusBar,
  Alert,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { addAlpha } from '../constants/themes';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- Animated Pressable Component ---
const AnimatedPressable = ({ 
  onPress, 
  style, 
  children, 
  pressableStyle,
  disabled = false,
  hitSlop = { top: 8, bottom: 8, left: 8, right: 8 }
}: {
  onPress?: () => void;
  style?: any;
  children: React.ReactNode;
  pressableStyle?: any;
  disabled?: boolean;
  hitSlop?: any;
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    if (!disabled) {
      Animated.spring(scaleValue, { 
        toValue: 0.95, 
        friction: 7, 
        useNativeDriver: true 
      }).start();
    }
  };
  
  const handlePressOut = () => {
    if (!disabled) {
      Animated.spring(scaleValue, { 
        toValue: 1, 
        friction: 4, 
        useNativeDriver: true 
      }).start();
    }
  };
  
  return (
    <Pressable 
      onPressIn={handlePressIn} 
      onPressOut={handlePressOut} 
      onPress={onPress}
      style={pressableStyle}
      disabled={disabled}
      hitSlop={hitSlop}
      android_ripple={{ 
        color: 'rgba(0,0,0,0.1)', 
        borderless: false 
      }}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// --- Message Interface ---
interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
  avatar?: string;
  senderName?: string;
  isRead?: boolean;
}

// --- Group Member Interface ---
interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  isTyping?: boolean;
  role?: 'admin' | 'member';
}

const GroupMessagingScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  
  // State management
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      text: 'Hey there! How is everyone doing?', 
      sender: 'other', 
      timestamp: '10:30 AM', 
      avatar: 'https://placeimg.com/50/50/people/1', 
      senderName: 'Sarah' 
    },
    { 
      id: '2', 
      text: 'Doing great! Just working on this cool app. ✨', 
      sender: 'me', 
      timestamp: '10:31 AM' 
    },
    { 
      id: '3', 
      text: 'Nice! The new UI looks amazing. Keep it up!', 
      sender: 'other', 
      timestamp: '10:32 AM', 
      avatar: 'https://placeimg.com/50/50/people/2', 
      senderName: 'Mike' 
    },
    { 
      id: '4', 
      text: 'Thanks! Trying to give it that premium feel. ��', 
      sender: 'me', 
      timestamp: '10:33 AM' 
    },
    { 
      id: '5', 
      text: 'Can\'t wait to see the final result!', 
      sender: 'other', 
      timestamp: '10:34 AM', 
      avatar: 'https://placeimg.com/50/50/people/3', 
      senderName: 'Emma' 
    },
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showMembersList, setShowMembersList] = useState(false);
  const [showCallOptions, setShowCallOptions] = useState(false);
  const [showVideoOptions, setShowVideoOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const messageAnimValues = useRef<{[id: string]: Animated.Value}>({});

  // Generate responsive styles with theme
  const getStyles = () => StyleSheet.create({
    // Container styles
    container: {
      flex: 1,
      backgroundColor: theme.colors.BACKGROUND_PRIMARY,
    },
    
    // Header styles
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingTop: Platform.OS === 'ios' ? 60 : 16,
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.BORDER_COLOR_LIGHT,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 6,
      minHeight: 80,
    },
    
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
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
    
    groupInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
    },
    
    groupAvatar: {
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
    
    groupDetails: {
      flex: 1,
      justifyContent: 'center',
      minHeight: 44,
    },
    
    groupName: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 4,
      letterSpacing: 0.2,
      lineHeight: 22,
    },
    
    groupStatus: {
      fontSize: 13,
      color: theme.colors.TEXT_SECONDARY,
      fontWeight: '500',
      letterSpacing: 0.1,
      lineHeight: 16,
    },
    
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    
    headerActionButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: addAlpha(theme.colors.BACKGROUND_SECONDARY, 0.8),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    
    // Messages container
    messagesContainer: {
      flex: 1,
      paddingHorizontal: 16,
    },
    
    // Message bubble styles
    messageBubble: {
      maxWidth: '75%',
      marginVertical: 6,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 20,
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 3,
    },
    
    messageLeft: {
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      alignSelf: 'flex-start',
      borderBottomLeftRadius: 6,
      borderWidth: 0.5,
      borderColor: addAlpha(theme.colors.BORDER_COLOR_LIGHT, 0.3),
    },
    
    messageRight: {
      backgroundColor: theme.colors.ACCENT_COLOR,
      alignSelf: 'flex-end',
      borderBottomRightRadius: 6,
    },
    
    messageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    
    senderAvatar: {
      width: 18,
      height: 18,
      borderRadius: 9,
      marginRight: 8,
      borderWidth: 1,
      borderColor: addAlpha(theme.colors.BORDER_COLOR_LIGHT, 0.2),
    },
    
    senderName: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.TEXT_SECONDARY,
      letterSpacing: 0.1,
      lineHeight: 16,
    },
    
    messageText: {
      fontSize: 16,
      lineHeight: 24,
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
      lineHeight: 14,
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
    
    // Input container styles
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.BACKGROUND_SURFACE,
      borderTopWidth: 1,
      borderTopColor: addAlpha(theme.colors.BORDER_COLOR_LIGHT, 0.5),
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
      minHeight: 80,
    },
    
    inputWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.BACKGROUND_SECONDARY,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 12,
      borderWidth: 1,
      borderColor: isInputFocused 
        ? theme.colors.ACCENT_COLOR 
        : addAlpha(theme.colors.BORDER_COLOR_LIGHT, 0.3),
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      minHeight: 48,
    },
    
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.TEXT_PRIMARY,
      paddingVertical: 8,
      fontWeight: '400',
      letterSpacing: 0.1,
      lineHeight: 20,
      textAlignVertical: 'center',
      minHeight: 32,
    },
    
    inputActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    
    inputActionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: addAlpha(theme.colors.ACCENT_COLOR, 0.08),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: addAlpha(theme.colors.ACCENT_COLOR, 0.1),
    },
    
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: inputText.trim() 
        ? theme.colors.ACCENT_COLOR 
        : addAlpha(theme.colors.ACCENT_COLOR, 0.3),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: inputText.trim() ? 0.25 : 0.1,
      shadowRadius: 6,
      elevation: inputText.trim() ? 5 : 2,
    },
    
    // Typing indicator
    typingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    
    typingText: {
      fontSize: 13,
      color: theme.colors.TEXT_SECONDARY,
      fontStyle: 'italic',
      fontWeight: '500',
      letterSpacing: 0.1,
      lineHeight: 16,
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
      maxWidth: SCREEN_WIDTH - 48,
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
      lineHeight: 28,
    },
    
    modalCloseButton: {
      marginLeft: 'auto',
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: addAlpha(theme.colors.BACKGROUND_SECONDARY, 0.8),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.SHADOW_COLOR,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    
    // Group info content
    groupInfoContent: {
      alignItems: 'center',
    },
    
    groupInfoAvatar: {
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
    
    groupInfoName: {
      fontSize: 26,
      fontWeight: '700',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 10,
      letterSpacing: 0.3,
      lineHeight: 32,
      textAlign: 'center',
    },
    
    groupInfoStatus: {
      fontSize: 16,
      color: theme.colors.TEXT_SECONDARY,
      marginBottom: 20,
      fontWeight: '500',
      letterSpacing: 0.1,
      lineHeight: 20,
      textAlign: 'center',
    },
    
    groupActions: {
      flexDirection: 'row',
      gap: 14,
      width: '100%',
    },
    
    groupActionButton: {
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
      minHeight: 48,
    },
    
    groupActionButtonPrimary: {
      backgroundColor: theme.colors.ACCENT_COLOR,
      borderColor: theme.colors.ACCENT_COLOR,
      shadowColor: theme.colors.ACCENT_COLOR,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    
    groupActionText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.TEXT_SECONDARY,
      letterSpacing: 0.2,
      lineHeight: 20,
    },
    
    groupActionTextPrimary: {
      color: theme.colors.WHITE,
      fontWeight: '700',
    },
    
    // Members list
    membersList: {
      maxHeight: 320,
    },
    
    memberItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderBottomWidth: 1,
      borderBottomColor: addAlpha(theme.colors.BORDER_COLOR_LIGHT, 0.3),
      minHeight: 60,
    },
    
    memberAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginRight: 14,
      borderWidth: 1,
      borderColor: addAlpha(theme.colors.BORDER_COLOR_LIGHT, 0.2),
    },
    
    memberInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    
    memberName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.TEXT_PRIMARY,
      marginBottom: 3,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
    
    memberStatus: {
      fontSize: 13,
      color: theme.colors.TEXT_SECONDARY,
      fontWeight: '500',
      letterSpacing: 0.1,
      lineHeight: 16,
    },
    
    onlineIndicator: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#10B981',
      marginLeft: 10,
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    
    // Media picker content
    mediaPickerContent: {
      alignItems: 'center',
      width: '100%',
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
      minHeight: 56,
    },
    
    mediaOptionIcon: {
      marginRight: 14,
    },
    
    mediaOptionText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.TEXT_PRIMARY,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
    
    // Call options content
    callOptionsContent: {
      alignItems: 'center',
      width: '100%',
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
      minHeight: 56,
    },
    
    callOptionIcon: {
      marginRight: 14,
    },
    
    callOptionText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.TEXT_PRIMARY,
      letterSpacing: 0.1,
      lineHeight: 20,
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
      lineHeight: 20,
    },
  });

  const styles = getStyles();

  // Initialize animation values for existing messages
  useEffect(() => {
    messages.forEach(msg => {
      if (!messageAnimValues.current[msg.id]) {
        messageAnimValues.current[msg.id] = new Animated.Value(1);
      }
    });
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Handle send message with animation
  const handleSend = useCallback(() => {
    if (inputText.trim().length === 0) return;
    
    const newMessageId = String(Date.now());
    const newMessage: Message = {
      id: newMessageId,
      text: inputText.trim(),
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };

    // Initialize animation value for the new message
    messageAnimValues.current[newMessageId] = new Animated.Value(0);

    setMessages(prevMessages => [...prevMessages, newMessage]);

    // Animate the new message in
    Animated.timing(messageAnimValues.current[newMessageId], {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setInputText('');
    
    // Simulate typing indicator
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
  }, [inputText]);

  // Render message with proper animation
  const renderMessage = useCallback((message: Message) => {
    const isMyMessage = message.sender === 'me';
    const animValue = messageAnimValues.current[message.id] || new Animated.Value(1);

    return (
      <Animated.View
        style={[
          styles.messageBubble,
          isMyMessage ? styles.messageRight : styles.messageLeft,
          {
            opacity: animValue,
            transform: [{ 
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }]
          }
        ]}
      >
        {!isMyMessage && message.senderName && (
          <View style={styles.messageHeader}>
            {message.avatar && (
              <Image 
                source={{ uri: message.avatar }} 
                style={styles.senderAvatar} 
              />
            )}
            <Text style={styles.senderName}>{message.senderName}</Text>
          </View>
        )}
        
        <Text style={[
          styles.messageText,
          isMyMessage && styles.messageTextRight
        ]}>
          {message.text}
        </Text>
        
        <View style={styles.readIndicator}>
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.messageTimeRight : styles.messageTimeLeft
          ]}>
            {message.timestamp}
          </Text>
          {isMyMessage && (
            <Ionicons 
              name={message.isRead ? "checkmark-done" : "checkmark"} 
              size={12} 
              color={addAlpha(theme.colors.WHITE, 0.8)} 
              style={styles.readIcon}
            />
          )}
        </View>
      </Animated.View>
    );
  }, [theme.colors]);

  // Render typing indicator
  const renderTypingIndicator = useCallback(() => {
    if (!isTyping) return null;
    
    return (
      <View style={styles.typingIndicator}>
        <Text style={styles.typingText}>Someone is typing</Text>
        <View style={styles.typingDots}>
          <Animated.View style={styles.typingDot} />
          <Animated.View style={styles.typingDot} />
          <Animated.View style={styles.typingDot} />
        </View>
      </View>
    );
  }, [isTyping, styles]);

  // Event handlers
  const handleGroupInfoPress = useCallback(() => {
    setShowGroupInfo(true);
  }, []);

  const handleMembersListPress = useCallback(() => {
    setShowMembersList(true);
  }, []);

  const handleMediaPickerPress = useCallback(() => {
    setShowMediaPicker(true);
  }, []);

  const handleVoiceMessage = useCallback(() => {
    setIsRecording(!isRecording);
    Alert.alert('Voice Message', isRecording ? 'Recording stopped' : 'Recording started');
  }, [isRecording]);

  const handleLocationShare = useCallback(() => {
    Alert.alert('Share Location', 'Location sharing feature coming soon!');
  }, []);

  const handleCallPress = useCallback(() => {
    setShowCallOptions(true);
  }, []);

  const handleVideoPress = useCallback(() => {
    setShowVideoOptions(true);
  }, []);

  const handleLeaveGroup = useCallback(() => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: () => {
            setShowGroupInfo(false);
            router.back();
          }
        },
      ]
    );
  }, [router]);

  const handleReportGroup = useCallback(() => {
    Alert.alert('Report Group', 'Report submitted successfully');
    setShowGroupInfo(false);
  }, []);

  const handleStartCall = useCallback((type: 'audio' | 'video') => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowCallOptions(false);
      setShowVideoOptions(false);
      Alert.alert(`${type === 'audio' ? 'Audio' : 'Video'} Call`, 'Call initiated successfully!');
    }, 2000);
  }, []);

  // Mock data
  const mockMembers: GroupMember[] = [
    { id: '1', name: 'Sarah Johnson', avatar: 'https://placeimg.com/50/50/people/1', isOnline: true, role: 'admin' },
    { id: '2', name: 'Mike Chen', avatar: 'https://placeimg.com/50/50/people/2', isOnline: true, isTyping: true },
    { id: '3', name: 'Emma Davis', avatar: 'https://placeimg.com/50/50/people/3', isOnline: false },
    { id: '4', name: 'Alex Thompson', avatar: 'https://placeimg.com/50/50/people/4', isOnline: true },
    { id: '5', name: 'You', avatar: 'https://placeimg.com/50/50/people/5', isOnline: true },
  ];

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
        <AnimatedPressable 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.TEXT_PRIMARY} />
        </AnimatedPressable>
        
        <AnimatedPressable 
          style={styles.groupInfo} 
          onPress={handleGroupInfoPress}
        >
          <Image 
            source={{ uri: 'https://placeimg.com/80/80/people/group' }} 
            style={styles.groupAvatar} 
          />
          <View style={styles.groupDetails}>
            <Text style={styles.groupName} numberOfLines={1}>
              WanderNav Team
            </Text>
            <Text style={styles.groupStatus} numberOfLines={1}>
              5 members • 2 online
            </Text>
          </View>
        </AnimatedPressable>
        
        <View style={styles.headerActions}>
          <AnimatedPressable 
            style={styles.headerActionButton}
            onPress={handleMembersListPress}
          >
            <Ionicons name="people" size={18} color={theme.colors.ACCENT_COLOR} />
          </AnimatedPressable>
          <AnimatedPressable 
            style={styles.headerActionButton}
            onPress={handleCallPress}
          >
            <Ionicons name="call" size={18} color={theme.colors.ACCENT_COLOR} />
          </AnimatedPressable>
          <AnimatedPressable 
            style={styles.headerActionButton}
            onPress={handleVideoPress}
          >
            <Ionicons name="videocam" size={18} color={theme.colors.ACCENT_COLOR} />
          </AnimatedPressable>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(renderMessage)}
          {renderTypingIndicator()}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputActions}>
              <AnimatedPressable 
                style={styles.inputActionButton}
                onPress={handleMediaPickerPress}
              >
                <Ionicons name="add" size={18} color={theme.colors.ACCENT_COLOR} />
              </AnimatedPressable>
              <AnimatedPressable 
                style={styles.inputActionButton}
                onPress={handleVoiceMessage}
              >
                <Ionicons 
                  name="mic" 
                  size={18} 
                  color={isRecording ? '#FF4444' : theme.colors.ACCENT_COLOR} 
                />
              </AnimatedPressable>
            </View>
            
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.TEXT_TERTIARY}
              multiline
              maxLength={500}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
          </View>
          
          <AnimatedPressable 
            style={styles.sendButton} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons 
              name="send" 
              size={18} 
              color={theme.colors.WHITE} 
            />
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={theme.colors.ACCENT_COLOR} />
            <Text style={styles.loadingText}>Connecting...</Text>
          </View>
        </View>
      )}

      {/* Group Info Modal */}
      <Modal visible={showGroupInfo} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Group Info</Text>
              <AnimatedPressable 
                style={styles.modalCloseButton}
                onPress={() => setShowGroupInfo(false)}
              >
                <Ionicons name="close" size={18} color={theme.colors.TEXT_SECONDARY} />
              </AnimatedPressable>
            </View>
            
            <View style={styles.groupInfoContent}>
              <Image 
                source={{ uri: 'https://placeimg.com/80/80/people/group' }} 
                style={styles.groupInfoAvatar} 
              />
              <Text style={styles.groupInfoName}>WanderNav Team</Text>
              <Text style={styles.groupInfoStatus}>5 members • Created 2 weeks ago</Text>
              
              <View style={styles.groupActions}>
                <AnimatedPressable 
                  style={styles.groupActionButton} 
                  onPress={handleLeaveGroup}
                >
                  <Text style={styles.groupActionText}>Leave Group</Text>
                </AnimatedPressable>
                <AnimatedPressable 
                  style={[styles.groupActionButton, styles.groupActionButtonPrimary]} 
                  onPress={handleReportGroup}
                >
                  <Text style={styles.groupActionTextPrimary}>Report</Text>
                </AnimatedPressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Members List Modal */}
      <Modal visible={showMembersList} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Group Members</Text>
              <AnimatedPressable 
                style={styles.modalCloseButton}
                onPress={() => setShowMembersList(false)}
              >
                <Ionicons name="close" size={18} color={theme.colors.TEXT_SECONDARY} />
              </AnimatedPressable>
            </View>
            
            <ScrollView 
              style={styles.membersList} 
              showsVerticalScrollIndicator={false}
            >
              {mockMembers.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.name} {member.role === 'admin' && '(Admin)'}
                    </Text>
                    <Text style={styles.memberStatus}>
                      {member.isOnline ? 'Online' : 'Offline'}
                      {member.isTyping && ' • typing...'}
                    </Text>
                  </View>
                  {member.isOnline && <View style={styles.onlineIndicator} />}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Media Picker Modal */}
      <Modal visible={showMediaPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share</Text>
              <AnimatedPressable 
                style={styles.modalCloseButton}
                onPress={() => setShowMediaPicker(false)}
              >
                <Ionicons name="close" size={18} color={theme.colors.TEXT_SECONDARY} />
              </AnimatedPressable>
            </View>
            
            <View style={styles.mediaPickerContent}>
              <AnimatedPressable style={styles.mediaOption}>
                <Ionicons name="camera" size={20} color={theme.colors.ACCENT_COLOR} style={styles.mediaOptionIcon} />
                <Text style={styles.mediaOptionText}>Camera</Text>
              </AnimatedPressable>
              
              <AnimatedPressable style={styles.mediaOption}>
                <Ionicons name="images" size={20} color={theme.colors.ACCENT_COLOR} style={styles.mediaOptionIcon} />
                <Text style={styles.mediaOptionText}>Photo Library</Text>
              </AnimatedPressable>
              
              <AnimatedPressable style={styles.mediaOption} onPress={handleLocationShare}>
                <Ionicons name="location" size={20} color={theme.colors.ACCENT_COLOR} style={styles.mediaOptionIcon} />
                <Text style={styles.mediaOptionText}>Location</Text>
              </AnimatedPressable>
              
              <AnimatedPressable style={styles.mediaOption}>
                <Ionicons name="document" size={20} color={theme.colors.ACCENT_COLOR} style={styles.mediaOptionIcon} />
                <Text style={styles.mediaOptionText}>Document</Text>
              </AnimatedPressable>
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
              <AnimatedPressable 
                style={styles.modalCloseButton}
                onPress={() => setShowCallOptions(false)}
              >
                <Ionicons name="close" size={18} color={theme.colors.TEXT_SECONDARY} />
              </AnimatedPressable>
            </View>
            
            <View style={styles.callOptionsContent}>
              <AnimatedPressable 
                style={styles.callOption} 
                onPress={() => handleStartCall('audio')}
              >
                <Ionicons name="call" size={20} color={theme.colors.ACCENT_COLOR} style={styles.callOptionIcon} />
                <Text style={styles.callOptionText}>Audio Call</Text>
              </AnimatedPressable>
              
              <AnimatedPressable 
                style={styles.callOption} 
                onPress={() => handleStartCall('video')}
              >
                <Ionicons name="videocam" size={20} color={theme.colors.ACCENT_COLOR} style={styles.callOptionIcon} />
                <Text style={styles.callOptionText}>Video Call</Text>
              </AnimatedPressable>
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
              <AnimatedPressable 
                style={styles.modalCloseButton}
                onPress={() => setShowVideoOptions(false)}
              >
                <Ionicons name="close" size={18} color={theme.colors.TEXT_SECONDARY} />
              </AnimatedPressable>
            </View>
            
            <View style={styles.callOptionsContent}>
              <AnimatedPressable 
                style={styles.callOption} 
                onPress={() => handleStartCall('video')}
              >
                <Ionicons name="videocam" size={20} color={theme.colors.ACCENT_COLOR} style={styles.callOptionIcon} />
                <Text style={styles.callOptionText}>Start Video Call</Text>
              </AnimatedPressable>
              
              <AnimatedPressable style={styles.callOption}>
                <Ionicons name="settings" size={20} color={theme.colors.ACCENT_COLOR} style={styles.callOptionIcon} />
                <Text style={styles.callOptionText}>Call Settings</Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default GroupMessagingScreen;