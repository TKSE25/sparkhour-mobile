// ============================================================
// SparkHour mobile — messaging service.
// Mirrors the web's conversations + messages(conversation_id) model exactly
// (RLS lets the two participants read/write their conversation). Same shared DB.
// ============================================================

import { supabase } from './supabase';

export interface ConversationVM {
  id: string;
  space_id: string | null;
  guest_id: string;
  host_id: string;
  updated_at: string;
  space?: { title?: string; cover_image?: string } | null;
  guest?: { full_name?: string; avatar_url?: string } | null;
  host?: { full_name?: string; avatar_url?: string } | null;
  last_message?: { content?: string; created_at?: string } | null;
  unread_count: number;
}

export interface MessageVM {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export async function getConversations(userId: string): Promise<ConversationVM[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select(
      `*, space:spaces(title, cover_image), guest:profiles!guest_id(full_name, avatar_url), host:profiles!host_id(full_name, avatar_url)`
    )
    .or(`guest_id.eq.${userId},host_id.eq.${userId}`)
    .order('updated_at', { ascending: false });
  if (error) throw error;

  return Promise.all(
    (data || []).map(async (conv: Record<string, unknown>) => {
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, created_at')
        .eq('conversation_id', conv.id as string)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id as string)
        .eq('read', false)
        .neq('sender_id', userId);
      return { ...conv, last_message: lastMsg, unread_count: count || 0 } as unknown as ConversationVM;
    })
  );
}

export async function getMessages(conversationId: string): Promise<MessageVM[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as MessageVM[]) || [];
}

export async function sendMessage(conversationId: string, senderId: string, content: string): Promise<MessageVM> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select()
    .single();
  if (error) throw error;
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);
  return data as MessageVM;
}

export async function markRead(conversationId: string, userId: string): Promise<void> {
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('read', false);
}
