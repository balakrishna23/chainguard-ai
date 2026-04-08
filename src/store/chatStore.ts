import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Message {
  id: string;
  team_id: string | null;
  sender_id: string;
  receiver_id: string | null;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  is_direct: boolean;
  created_at: string;
  profiles?: { full_name: string | null; email: string; avatar_url: string | null } | null;
}

interface ChatStore {
  messages: Message[];
  dmMessages: Message[];
  loading: boolean;
  activeTab: 'team' | 'direct';
  activeDmUserId: string | null;
  globalUnread: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  setActiveTab: (tab: 'team' | 'direct') => void;
  setActiveDmUser: (userId: string | null) => void;
  incrementGlobalUnread: () => void;
  resetGlobalUnread: () => void;
  fetchTeamMessages: (teamId: string) => Promise<void>;
  fetchDmMessages: (otherUserId: string) => Promise<void>;
  sendTeamMessage: (teamId: string, content: string, file?: File) => Promise<void>;
  sendDmMessage: (receiverId: string, content: string, file?: File) => Promise<void>;
  subscribeToTeam: (teamId: string) => () => void;
  subscribeToDm: (otherUserId: string) => () => void;
}

async function uploadFile(file: File): Promise<{ url: string; name: string; type: string } | null> {
  const path = `${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from('chat-files').upload(path, file, { upsert: true });
  if (error) { console.error('[Chat] File upload error:', error); return null; }
  const { data: { publicUrl } } = supabase.storage.from('chat-files').getPublicUrl(path);
  return { url: publicUrl, name: file.name, type: file.type };
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  dmMessages: [],
  loading: false,
  activeTab: 'team',
  activeDmUserId: null,
  globalUnread: 0,
  isOpen: false,

  setOpen: (open) => set({ isOpen: open }),
  setActiveTab: (tab) => set((state) => ({
    activeTab: tab,
    activeDmUserId: tab === 'team' ? null : state.activeDmUserId,
  })),
  setActiveDmUser: (userId) => set((state) => ({
    activeDmUserId: userId,
    activeTab: userId ? 'direct' : state.activeTab,
    dmMessages: userId && userId !== state.activeDmUserId ? [] : state.dmMessages,
  })),
  incrementGlobalUnread: () => set((state) => ({ globalUnread: state.globalUnread + 1 })),
  resetGlobalUnread: () => set({ globalUnread: 0 }),

  fetchTeamMessages: async (teamId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_direct', false)
      .order('created_at', { ascending: true })
      .limit(50);
    if (error) console.error('[Chat] fetchTeamMessages:', error);
    else {
      const senderIds = [...new Set((data ?? []).map((m) => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', senderIds);

      const enriched = (data ?? []).map((msg) => ({
        ...msg,
        profiles: profiles?.find((p) => p.id === msg.sender_id) ?? null,
      }));

      set({ messages: enriched });
    }
    set({ loading: false });
  },

  fetchDmMessages: async (otherUserId) => {
    set({ loading: true });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ loading: false });
      return;
    }
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('is_direct', true)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .limit(50);
    if (error) console.error('[Chat] fetchDmMessages:', error);
    else {
      const senderIds = [...new Set((data ?? []).map((m) => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', senderIds);

      const enriched = (data ?? []).map((msg) => ({
        ...msg,
        profiles: profiles?.find((p) => p.id === msg.sender_id) ?? null,
      }));

      set({ dmMessages: enriched });
    }
    set({ loading: false });
  },

  sendTeamMessage: async (teamId, content, file) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let fileData = null;
    if (file) fileData = await uploadFile(file);
    const { error } = await supabase.from('messages').insert({
      team_id: teamId,
      sender_id: user.id,
      content: content || null,
      file_url: fileData?.url ?? null,
      file_name: fileData?.name ?? null,
      file_type: fileData?.type ?? null,
      is_direct: false,
    });
    if (error) console.error('[Chat] sendTeamMessage:', error);
  },

  sendDmMessage: async (receiverId, content, file) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const teamId = null;
    // Get shared team_id
    const { data: tm } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .maybeSingle();
    let fileData = null;
    if (file) fileData = await uploadFile(file);
    const { error } = await supabase.from('messages').insert({
      team_id: tm?.team_id ?? null,
      sender_id: user.id,
      receiver_id: receiverId,
      content: content || null,
      file_url: fileData?.url ?? null,
      file_name: fileData?.name ?? null,
      file_type: fileData?.type ?? null,
      is_direct: true,
    });
    if (error) console.error('[Chat] sendDmMessage:', error);
  },

  subscribeToTeam: (teamId) => {
    const channel = supabase
      .channel(`team-messages-${teamId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `team_id=eq.${teamId}`,
      }, async (payload) => {
        const newMsg = payload.new as any;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .eq('id', newMsg.sender_id)
          .single();
        const enriched = { ...newMsg, profiles: profile ?? null };
        set((state) => ({
          messages: [...state.messages, enriched]
        }));
      })
      .subscribe((status) => {
        console.log('[Chat] Team subscription status:', status);
      });
    return () => supabase.removeChannel(channel);
  },

  subscribeToDm: (otherUserId) => {
    const channel = supabase
      .channel(`dm-messages-${otherUserId}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `is_direct=eq.true`,
      }, async (payload) => {
        const newMsg = payload.new as any;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const belongsToThisDm =
          (newMsg.sender_id === user.id && newMsg.receiver_id === otherUserId) ||
          (newMsg.sender_id === otherUserId && newMsg.receiver_id === user.id);
        if (!belongsToThisDm) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .eq('id', newMsg.sender_id)
          .single();
        const enriched = { ...newMsg, profiles: profile ?? null };
        set((state) => ({
          dmMessages: [...state.dmMessages, enriched]
        }));
      })
      .subscribe((status) => {
        console.log('[Chat] DM subscription status:', status);
      });
    return () => supabase.removeChannel(channel);
  },
}));
