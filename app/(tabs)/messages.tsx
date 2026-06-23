import React, { useCallback, useState } from 'react';
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
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { getConversations, type ConversationVM } from '../../lib/messages';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function MessagesScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationVM[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      setConversations(await getConversations(user.id));
    } catch {
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { fetchConversations(); }, [fetchConversations]));

  function other(c: ConversationVM) {
    return user && c.guest_id === user.id ? c.host : c.guest;
  }

  const renderConversation = ({ item }: { item: ConversationVM }) => {
    const o = other(item);
    const name = o?.full_name ?? 'User';
    const studio = item.space?.title;
    const last = item.last_message?.content ?? 'Start the conversation';
    const t = item.last_message?.created_at || item.updated_at;
    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/messages/[id]', params: { id: item.id, name } } as never)}
      >
        <View style={styles.avatar}>
          {o?.avatar_url ? (
            <Image source={{ uri: o.avatar_url }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.rowContent}>
          <View style={styles.rowHeader}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            {t ? (
              <Text style={styles.time}>
                {new Date(t).toLocaleDateString('en-AE', { month: 'short', day: 'numeric' })}
              </Text>
            ) : null}
          </View>
          {studio ? <Text style={styles.studio} numberOfLines={1}>{studio}</Text> : null}
          <Text style={styles.preview} numberOfLines={1}>{last}</Text>
        </View>
        {item.unread_count > 0 && (
          <View style={styles.unread}><Text style={styles.unreadText}>{item.unread_count}</Text></View>
        )}
      </TouchableOpacity>
    );
  };

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
          <Text style={styles.emptySubtitle}>Book a studio or message a host to start chatting</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
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
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.navy, flex: 1 },
  time: { fontSize: 11, color: Colors.gray400, marginLeft: 8 },
  studio: { fontSize: 12, color: Colors.purple, fontWeight: '600', marginBottom: 1 },
  preview: { fontSize: 13, color: Colors.gray600 },
  unread: {
    minWidth: 22, height: 22, borderRadius: 11, backgroundColor: Colors.purple,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, marginLeft: 8,
  },
  unreadText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.navy },
  emptySubtitle: { fontSize: 14, color: Colors.gray400, textAlign: 'center' },
});
