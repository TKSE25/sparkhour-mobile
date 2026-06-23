import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { getMessages, sendMessage, markRead, type MessageVM } from '../../lib/messages';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function MessageThread() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<MessageVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<MessageVM>>(null);

  const load = useCallback(async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    try {
      const msgs = await getMessages(id);
      setMessages(msgs);
      if (user) markRead(id, user.id).catch(() => {});
    } catch {
      /* ignore */
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id, user]);

  // Initial load + lightweight 4s polling for new messages while open.
  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 4000);
    return () => clearInterval(t);
  }, [load]);

  async function handleSend() {
    const body = text.trim();
    if (!body || !user || !id || sending) return;
    setSending(true);
    setText('');
    try {
      const msg = await sendMessage(id, user.id, body);
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch {
      setText(body); // restore on failure
    } finally {
      setSending(false);
    }
  }

  const renderItem = ({ item }: { item: MessageVM }) => {
    const mine = item.sender_id === user?.id;
    return (
      <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.msgText, mine && styles.msgTextMine]}>{item.content}</Text>
          <Text style={[styles.msgTime, mine && styles.msgTimeMine]}>
            {new Date(item.created_at).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: name || 'Conversation' }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <LoadingSpinner />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="chatbubbles-outline" size={48} color={Colors.gray200} />
                <Text style={styles.emptyText}>Say hello 👋</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message…"
            placeholderTextColor={Colors.gray400}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            <Ionicons name="send" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offWhite },
  list: { padding: 14, gap: 8, flexGrow: 1 },
  bubbleRow: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleMine: { backgroundColor: Colors.purple, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: Colors.white, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, color: Colors.navy },
  msgTextMine: { color: Colors.white },
  msgTime: { fontSize: 10, color: Colors.gray400, marginTop: 3, alignSelf: 'flex-end' },
  msgTimeMine: { color: 'rgba(255,255,255,0.7)' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 15, color: Colors.gray400, fontWeight: '600' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.gray100,
  },
  input: {
    flex: 1, maxHeight: 120, borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: Colors.navy, backgroundColor: Colors.offWhite,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.purple,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
