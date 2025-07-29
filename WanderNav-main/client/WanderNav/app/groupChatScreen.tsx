import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';

const currentUserId = 'currentUserId'; // TODO: Replace with real auth user id

const GroupChatScreen = () => {
  const router = useRouter();
  const { groupId, groupName } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`/api/messages?groupId=${groupId}`);
      setMessages(res.data);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMsg = {
      senderId: currentUserId,
      recipientIds: [],
      groupId,
      content: input,
      timestamp: new Date().toISOString(),
    };
    setInput('');
    try {
      await axios.post('/api/messages', newMsg);
      fetchMessages();
    } catch (e) {}
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.msgBubble, item.senderId === currentUserId ? styles.msgRight : styles.msgLeft]}>
      <Text style={styles.msgText}>{item.content}</Text>
      <Text style={styles.msgTime}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f9f9f9' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>{'< Back'}</Text></TouchableOpacity>
        <Text style={styles.groupName}>{groupName}</Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  backBtn: { color: '#3498DB', fontWeight: 'bold', marginRight: 8 },
  groupName: { fontSize: 18, fontWeight: 'bold' },
  msgBubble: { maxWidth: '75%', marginVertical: 4, padding: 10, borderRadius: 12 },
  msgLeft: { backgroundColor: '#e0e0e0', alignSelf: 'flex-start' },
  msgRight: { backgroundColor: '#3498DB', alignSelf: 'flex-end' },
  msgText: { color: '#222', fontSize: 16 },
  msgTime: { color: '#888', fontSize: 12, alignSelf: 'flex-end', marginTop: 2 },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee', position: 'absolute', bottom: 0, left: 0, right: 0 },
  input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 16, marginRight: 8 },
  sendBtn: { backgroundColor: '#3498DB', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
});

export default GroupChatScreen; 