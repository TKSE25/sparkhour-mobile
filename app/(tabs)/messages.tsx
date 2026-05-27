import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/LoadingSpinner';

interface ConversationRow {
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export default function MessagesScreen() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchConversations() {
    if (!user) return;
    setIsLoading(true);

    // Get the most recent message per conversation partner
    const { data } = await supabase
      .from('messages')
      .select(`
        id, sender_id, receiver_id, content, is_read, created_at,
        sender:profiles!messages_sender_id_fkey(full_name, avatar_url),
        receiver:profiles!messages_receiver_id_fkey(full_name, avatar_url)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!data) { setIsLoading(false); return; }

    // Group by conversation partner
    const seen = new Set<string>();
    const convs: ConversationRow[] = [];

    for (const msg of data as any[]) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (seen.has(otherId)) continue;
      seen.add(otherId);

      const otherProfile = msg.sender_id === user.id ? msg.receiver : msg.sender;
      convs.push({
        other_user_id: otherId,
        other_user_name: otherProfile?.full_name ?? 'User',
        other_user_avatar: otherProfile?.avatar_url ?? null,
        last_message: msg.content,
        last_message_time: msg.created_at,
        unread_count: 0,
      });
    }

    setConversations(convs);
    setIsLoading(false);
  }

  useEffect(() => { fetchConversations(); }, [user]);

  const renderConversation = ({ item }: { item: ConversationRow }) => (
    <TouchableOpacity style={styles.row} activeOpacity={0.7}>
      <View style={styles.avatar}>
        {item.other_user_avatar ? (
          <Image
            source={{ uri: item.other_user_avatar }}
            style={styles.avatarImg}
            contentFit="cover"
          />
        ) : (
          <Text style={styles.avatarInitial}>
            {item.other_user_name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowHeader}>
          <Text style={styles.name}>{item.other_user_name}</Text>
          <Text style={styles.time}>
            {new Date(item.last_message_time).toLocaleTimeString('en-AE', {
              hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {item.last_message}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : conversations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubble-ellipses-outline" size={64} color={Colors.gray200} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySubtitle}>
            Book a studio to start chatting with hosts
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.other_user_id}
          renderItem={renderConversation}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchConversations} tintColor={Colors.purple} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.navy },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.purpleLight, alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  avatarInitial: { fontSize: 20, fontWeight: '700', color: Colors.purple },
  rowContent: { flex: 1 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.navy },
  time: { fontSize: 11, color: Colors.gray400 },
  preview: { fontSize: 13, color: Colors.gray600 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.navy },
  emptySubtitle: { fontSize: 14, color: Colors.gray400, textAlign: 'center' },
});
