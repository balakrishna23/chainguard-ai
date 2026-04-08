import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MessageCircle,
  Paperclip,
  Send,
  Shield,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Message, useChatStore } from '../store/chatStore';
import { useTeamStore } from '../store/teamStore';
import { useAuthStore } from '../store/authStore';

type RailView = 'messages' | 'people';
type ConversationType = 'team' | 'dm';

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);
  const team = useTeamStore((s) => s.currentTeam);
  const members = useTeamStore((s) => s.members);
  const fetchMyTeam = useTeamStore((s) => s.fetchMyTeam);
  const fetchMembers = useTeamStore((s) => s.fetchMembers);

  const setActiveTab = useChatStore((s) => s.setActiveTab);
  const messages = useChatStore((s) => s.messages);
  const dmMessages = useChatStore((s) => s.dmMessages);
  const loading = useChatStore((s) => s.loading);
  const fetchTeamMessages = useChatStore((s) => s.fetchTeamMessages);
  const fetchDmMessages = useChatStore((s) => s.fetchDmMessages);
  const sendTeamMessage = useChatStore((s) => s.sendTeamMessage);
  const sendDmMessage = useChatStore((s) => s.sendDmMessage);
  const subscribeToTeam = useChatStore((s) => s.subscribeToTeam);
  const subscribeToDm = useChatStore((s) => s.subscribeToDm);

  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [railView, setRailView] = useState<RailView>('messages');
  const [selectedConversation, setSelectedConversation] = useState<ConversationType>('team');
  const [activeDmUserId, setActiveDmUserId] = useState<string | null>(null);
  const [startedDms, setStartedDms] = useState<string[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [dmThreads, setDmThreads] = useState<Record<string, Message[]>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dmUnsubRef = useRef<(() => void) | null>(null);
  const teamUnreadUnsubRef = useRef<(() => void) | null>(null);
  const dmUnreadUnsubsRef = useRef<Record<string, () => void>>({});
  const selectedConversationRef = useRef<ConversationType>('team');
  const activeDmUserIdRef = useRef<string | null>(null);
  const membersRef = useRef(members);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getInitials = (name: string | null | undefined) => {
    return (name || 'U')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderAvatar = (
    profile: { full_name?: string | null; email?: string | null; avatar_url?: string | null } | null | undefined,
    sizeClassName: string,
    roundedClassName: string,
    textClassName: string,
    withOnlineIndicator = false
  ) => (
    <div className={`relative ${sizeClassName} ${roundedClassName} flex-shrink-0 overflow-hidden`}>
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={profile.full_name || profile.email || 'User'}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
          <span className={`${textClassName} font-bold text-white`}>
            {getInitials(profile?.full_name || profile?.email)}
          </span>
        </div>
      )}
      {withOnlineIndicator && (
        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-zinc-900" />
      )}
    </div>
  );

  const getConversationKey = (type: ConversationType, dmUserId?: string | null) =>
    type === 'team' ? 'team' : (dmUserId ?? '');

  const resetUnread = (key: string) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [key]: 0,
    }));
  };

  const incrementUnread = (key: string) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [key]: (prev[key] ?? 0) + 1,
    }));
  };

  const appendDmThreadMessage = (userId: string, message: Message) => {
    setDmThreads((prev) => {
      const existing = prev[userId] ?? [];
      if (existing.some((entry) => entry.id === message.id)) {
        return prev;
      }

      return {
        ...prev,
        [userId]: [...existing, message].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      };
    });
  };

  const findMemberByUserId = (userId: string) =>
    members.find((member) => member.user_id === userId);

  const getMemberProfile = (userId: string) => (findMemberByUserId(userId) as any)?.profiles as
    | { full_name?: string | null; email?: string | null; avatar_url?: string | null }
    | null;

  const getSenderLabel = async (senderId: string) => {
    const memberProfile = (membersRef.current.find((member) => member.user_id === senderId) as any)
      ?.profiles;
    if (memberProfile?.full_name || memberProfile?.email) {
      return memberProfile.full_name || memberProfile.email;
    }

    const { data } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', senderId)
      .maybeSingle();

    return data?.full_name || data?.email || 'Teammate';
  };

  const notifyIfHidden = async (senderId: string, content: string | null) => {
    if (
      typeof document === 'undefined' ||
      typeof Notification === 'undefined' ||
      !document.hidden ||
      Notification.permission !== 'granted'
    ) {
      return;
    }

    const senderName = await getSenderLabel(senderId);
    new Notification(`New message from ${senderName}`, {
      body: content || 'Sent a file',
      icon: '/favicon.ico',
    });
  };

  const openTeamConversation = () => {
    dmUnsubRef.current?.();
    dmUnsubRef.current = null;
    setRailView('messages');
    setSelectedConversation('team');
    setActiveDmUserId(null);
    setActiveTab('team');
    resetUnread('team');
    setMessageText('');
    setSelectedFile(null);
  };

  const openDmConversation = async (userId: string) => {
    setStartedDms((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    setRailView('messages');
    setSelectedConversation('dm');
    setActiveDmUserId(userId);
    setActiveTab('direct');
    resetUnread(userId);
    setMessageText('');
    setSelectedFile(null);
    dmUnsubRef.current?.();
    await fetchDmMessages(userId);
    dmUnsubRef.current = subscribeToDm(userId);
  };

  const showTeamChat = selectedConversation === 'team';
  const showDmChat = selectedConversation === 'dm' && activeDmUserId !== null;
  const showEmpty = !showTeamChat && !showDmChat;

  const selectedMember = activeDmUserId
    ? members.find((member) => member.user_id === activeDmUserId)
    : null;
  const selectedMemberProfile = (selectedMember as any)?.profiles as
    | { full_name?: string | null; email?: string | null; avatar_url?: string | null }
    | null;

  const activeMessages = showTeamChat ? messages : showDmChat ? dmMessages : [];
  const teamLastMessage = messages[messages.length - 1] ?? null;
  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
    activeDmUserIdRef.current = activeDmUserId;
    membersRef.current = members;
  }, [selectedConversation, activeDmUserId, members]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, dmMessages]);

  useEffect(() => {
    if (activeDmUserId) {
      setDmThreads((prev) => ({
        ...prev,
        [activeDmUserId]: dmMessages,
      }));
    }
  }, [activeDmUserId, dmMessages]);

  useEffect(() => {
    const init = async () => {
      await fetchMyTeam();
      await fetchMembers();
    };
    void init();
  }, []);

  useEffect(() => {
    if (showTeamChat && team?.id) {
      fetchTeamMessages(team.id);
      const unsubscribe = subscribeToTeam(team.id);
      return () => unsubscribe();
    }
  }, [showTeamChat, team?.id, fetchTeamMessages, subscribeToTeam]);

  useEffect(() => {
    if (showTeamChat) {
      resetUnread('team');
    }
  }, [showTeamChat]);

  useEffect(() => {
    if (showDmChat && activeDmUserId) {
      resetUnread(activeDmUserId);
    }
  }, [showDmChat, activeDmUserId]);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    return () => {
      dmUnsubRef.current?.();
      teamUnreadUnsubRef.current?.();
      Object.values(dmUnreadUnsubsRef.current).forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  useEffect(() => {
    if (!team?.id || !user?.id) {
      teamUnreadUnsubRef.current?.();
      teamUnreadUnsubRef.current = null;
      return;
    }

    teamUnreadUnsubRef.current?.();

    const channel = supabase
      .channel(`chatpage-team-unread-${team.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `team_id=eq.${team.id}`,
        },
        async (payload) => {
          console.log('[Unread] New message received:', payload.new);
          console.log('[Unread] is_direct:', (payload.new as any).is_direct);
          console.log('[Unread] sender_id:', (payload.new as any).sender_id);
          console.log('[Unread] current user:', user?.id);
          console.log('[Unread] selectedConversation:', selectedConversationRef.current);
          const message = payload.new as Message;
          if (message.is_direct || message.sender_id === user.id) {
            return;
          }

          const isViewingTeam = selectedConversationRef.current === 'team';
          if (!isViewingTeam) {
            incrementUnread('team');
            await notifyIfHidden(message.sender_id, message.content);
          }
        }
      )
      .subscribe();

    teamUnreadUnsubRef.current = () => {
      supabase.removeChannel(channel);
    };

    return () => {
      teamUnreadUnsubRef.current?.();
      teamUnreadUnsubRef.current = null;
    };
  }, [team?.id, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const activeSubscriptions = dmUnreadUnsubsRef.current;

    startedDms.forEach((dmUserId) => {
      if (activeSubscriptions[dmUserId]) {
        return;
      }

      const channel = supabase
        .channel(`chatpage-dm-unread-${user.id}-${dmUserId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `is_direct=eq.true`,
          },
          async (payload) => {
            const message = payload.new as Message;
            const belongsToDm =
              (message.sender_id === user.id && message.receiver_id === dmUserId) ||
              (message.sender_id === dmUserId && message.receiver_id === user.id);

            if (!belongsToDm) {
              return;
            }

            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email, avatar_url')
              .eq('id', message.sender_id)
              .maybeSingle();

            const enrichedMessage = {
              ...message,
              profiles: profile ?? null,
            } as Message;

            appendDmThreadMessage(dmUserId, enrichedMessage);

            if (message.sender_id === user.id) {
              return;
            }

            const isViewingDm =
              selectedConversationRef.current === 'dm' && activeDmUserIdRef.current === dmUserId;

            if (!isViewingDm) {
              incrementUnread(dmUserId);
              await notifyIfHidden(message.sender_id, message.content);
            }
          }
        )
        .subscribe();

      activeSubscriptions[dmUserId] = () => {
        supabase.removeChannel(channel);
      };
    });

    Object.keys(activeSubscriptions).forEach((dmUserId) => {
      if (!startedDms.includes(dmUserId)) {
        activeSubscriptions[dmUserId]();
        delete activeSubscriptions[dmUserId];
      }
    });
  }, [startedDms, user?.id]);

  async function handleSendMessage() {
    if (!messageText.trim() && !selectedFile) return;

    if (showTeamChat && team?.id) {
      await sendTeamMessage(team.id, messageText, selectedFile || undefined);
      setMessageText('');
      setSelectedFile(null);
    } else if (showDmChat && activeDmUserId) {
      await sendDmMessage(activeDmUserId, messageText, selectedFile || undefined);
      setMessageText('');
      setSelectedFile(null);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }

  const renderMessageList = (messageList: Message[], accent: 'emerald' | 'cyan') => {
    if (loading && messageList.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div
            className={`w-8 h-8 border-2 ${
              accent === 'emerald' ? 'border-emerald-500' : 'border-cyan-500'
            } border-t-transparent rounded-full animate-spin`}
          />
        </div>
      );
    }

    if (messageList.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-zinc-500">No messages yet. Start the conversation!</p>
        </div>
      );
    }

    return (
      <>
        {messageList.map((msg) => (
          <div key={msg.id} className="flex gap-3">
            {renderAvatar(msg.profiles, 'w-8 h-8', 'rounded-full', 'text-xs')}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <p
                  className={`text-sm font-semibold ${
                    accent === 'emerald' ? 'text-emerald-300' : 'text-cyan-300'
                  }`}
                >
                  {msg.profiles?.full_name || msg.profiles?.email}
                </p>
                <span className="text-xs text-zinc-500">{formatTime(msg.created_at)}</span>
              </div>
              {msg.content && (
                <p className="text-sm text-zinc-300 mt-1 break-words">{msg.content}</p>
              )}
              {msg.file_url && (
                <a
                  href={msg.file_url}
                  download
                  className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-full text-xs transition-colors ${
                    accent === 'emerald'
                      ? 'text-emerald-400 hover:text-emerald-300'
                      : 'text-cyan-400 hover:text-cyan-300'
                  }`}
                >
                  <Paperclip size={14} />
                  {msg.file_name}
                </a>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </>
    );
  };

  return (
    <div className="flex h-full bg-zinc-950">
      <div className="w-16 flex-shrink-0 bg-zinc-900 border-r border-zinc-800/60 flex flex-col items-center py-4 gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <Shield size={18} className="text-white" />
        </div>

        <button
          onClick={() => setRailView('messages')}
          className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
            railView === 'messages'
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'text-zinc-500 hover:text-white hover:bg-zinc-800/70'
          }`}
        >
          <MessageCircle size={20} />
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-semibold text-white flex items-center justify-center">
              {totalUnreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setRailView('people')}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
            railView === 'people'
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'text-zinc-500 hover:text-white hover:bg-zinc-800/70'
          }`}
        >
          <Users size={20} />
        </button>

        <div className="mt-auto">
          <Link
            to="/profile"
            className="w-11 h-11 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 flex items-center justify-center transition-colors"
          >
            <UserIcon size={18} />
          </Link>
        </div>
      </div>

      <div className="w-64 flex-shrink-0 bg-zinc-900/70 border-r border-zinc-800/60 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={railView}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.16 }}
            className="h-full flex flex-col"
          >
            {railView === 'messages' ? (
              <>
                <div className="px-4 py-4 border-b border-zinc-800/60">
                  <h2 className="text-sm font-semibold text-white">Messages</h2>
                </div>

                <div className="p-3 space-y-2 overflow-y-auto">
                  <button
                    onClick={openTeamConversation}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                      showTeamChat
                        ? 'bg-emerald-500/15 border-emerald-500/40'
                        : 'bg-zinc-900/40 border-zinc-800/70 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/90 to-cyan-500/90 flex items-center justify-center">
                        <Shield size={16} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-white"># general</p>
                          {teamLastMessage && (
                            <span className="text-[11px] text-zinc-500">
                              {formatTime(teamLastMessage.created_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 truncate">
                          {teamLastMessage?.content || teamLastMessage?.file_name || 'Team chat'}
                        </p>
                      </div>
                      {(unreadCounts.team ?? 0) > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-[10px] font-semibold text-white flex items-center justify-center">
                          {unreadCounts.team}
                        </span>
                      )}
                    </div>
                  </button>

                  {startedDms.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-4 text-center mt-3">
                      <p className="text-sm text-zinc-400">Click 👥 to find teammates</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {startedDms.map((dmUserId) => {
                        const memberProfile = getMemberProfile(dmUserId);
                        const thread = dmThreads[dmUserId] ?? [];
                        const lastMessage = thread[thread.length - 1] ?? null;
                        const isActive = showDmChat && activeDmUserId === dmUserId;

                        return (
                          <button
                            key={dmUserId}
                            onClick={() => {
                              void openDmConversation(dmUserId);
                            }}
                            className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                              isActive
                                ? 'bg-cyan-500/15 border-cyan-500/40'
                                : 'bg-zinc-900/40 border-zinc-800/70 hover:bg-zinc-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {renderAvatar(memberProfile, 'w-10 h-10', 'rounded-2xl', 'text-xs')}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-medium text-white truncate">
                                    {memberProfile?.full_name || memberProfile?.email || 'Teammate'}
                                  </p>
                                  {lastMessage && (
                                    <span className="text-[11px] text-zinc-500">
                                      {formatTime(lastMessage.created_at)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-zinc-500 truncate">
                                  {lastMessage?.content || lastMessage?.file_name || 'Direct message'}
                                </p>
                              </div>
                              {(unreadCounts[dmUserId] ?? 0) > 0 && (
                                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-[10px] font-semibold text-white flex items-center justify-center">
                                  {unreadCounts[dmUserId]}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="px-4 py-4 border-b border-zinc-800/60">
                  <h2 className="text-sm font-semibold text-white">Team Members</h2>
                </div>

                <div className="p-3 space-y-2 overflow-y-auto">
                  {members.filter((member) => member.user_id !== user?.id).length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-4 text-center">
                      <p className="text-sm text-zinc-400">No teammates yet</p>
                    </div>
                  ) : (
                    members
                      .filter((member) => member.user_id !== user?.id)
                      .map((member) => {
                        const profile = (member as any).profiles as
                          | { full_name?: string | null; email?: string | null }
                          | null;

                        return (
                          <button
                            key={member.id}
                            onClick={() => {
                              void openDmConversation(member.user_id);
                            }}
                            className="w-full rounded-2xl border border-zinc-800/70 bg-zinc-900/40 hover:bg-zinc-800/60 px-3 py-3 text-left transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {renderAvatar(profile, 'w-10 h-10', 'rounded-2xl', 'text-xs', true)}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {profile?.full_name || profile?.email || 'Teammate'}
                                </p>
                                <p className="text-xs text-zinc-500 truncate">
                                  {profile?.email || 'No email available'}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })
                  )}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {showEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <MessageCircle size={48} className="text-zinc-700 mb-4" />
            <p className="text-sm text-zinc-500">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {showTeamChat && (
              <>
                <div className="border-b border-zinc-800/60 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      # general
                    </h2>
                    {team && <p className="text-xs text-zinc-500 mt-1">{team.name}</p>}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {renderMessageList(activeMessages, 'emerald')}
                </div>
              </>
            )}

            {showDmChat && (
              <>
                <div className="border-b border-zinc-800/60 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {selectedMemberProfile?.full_name || selectedMemberProfile?.email}
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">{selectedMemberProfile?.email}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {renderMessageList(activeMessages, 'cyan')}
                </div>
              </>
            )}

            <div className="border-t border-zinc-800/60 p-4 space-y-2">
              {selectedFile && (
                <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-zinc-300 truncate">{selectedFile.name}</p>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    <span className="text-lg">x</span>
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-zinc-400 hover:text-white transition-colors hover:bg-zinc-800/50 rounded-lg"
                >
                  <Paperclip size={18} />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() && !selectedFile}
                  className="p-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white transition-all rounded-lg"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
