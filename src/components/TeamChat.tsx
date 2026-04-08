import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Paperclip, ChevronLeft } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useTeamStore } from '../store/teamStore';
import { useAuthStore } from '../store/authStore';

export default function TeamChat() {
  const isOpen = useChatStore((s) => s.isOpen);
  const setOpen = useChatStore((s) => s.setOpen);
  const activeTab = useChatStore((s) => s.activeTab);
  const setActiveTab = useChatStore((s) => s.setActiveTab);
  const messages = useChatStore((s) => s.messages);
  const dmMessages = useChatStore((s) => s.dmMessages);
  const loading = useChatStore((s) => s.loading);
  const activeDmUserId = useChatStore((s) => s.activeDmUserId);
  const setActiveDmUser = useChatStore((s) => s.setActiveDmUser);
  const fetchTeamMessages = useChatStore((s) => s.fetchTeamMessages);
  const fetchDmMessages = useChatStore((s) => s.fetchDmMessages);
  const sendTeamMessage = useChatStore((s) => s.sendTeamMessage);
  const sendDmMessage = useChatStore((s) => s.sendDmMessage);
  const subscribeToTeam = useChatStore((s) => s.subscribeToTeam);
  const subscribeToDm = useChatStore((s) => s.subscribeToDm);

  const team = useTeamStore((s) => s.currentTeam);
  const members = useTeamStore((s) => s.members);

  const user = useAuthStore((s) => s.user);

  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, dmMessages]);

  // Initialize team chat
  useEffect(() => {
    if (isOpen && activeTab === 'team' && team?.id) {
      fetchTeamMessages(team.id);
      const unsubscribe = subscribeToTeam(team.id);
      return () => unsubscribe();
    }
  }, [isOpen, activeTab, team?.id, fetchTeamMessages, subscribeToTeam]);

  // Initialize DM
  useEffect(() => {
    if (isOpen && activeTab === 'direct' && activeDmUserId) {
      fetchDmMessages(activeDmUserId);
      const unsubscribe = subscribeToDm(activeDmUserId);
      return () => unsubscribe();
    }
  }, [isOpen, activeTab, activeDmUserId, fetchDmMessages, subscribeToDm]);

  async function handleSendMessage() {
    if (!messageText.trim() && !selectedFile) return;

    if (activeTab === 'team' && team?.id) {
      await sendTeamMessage(team.id, messageText, selectedFile || undefined);
      setMessageText('');
      setSelectedFile(null);
    } else if (activeTab === 'direct' && activeDmUserId) {
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

  const getInitials = (name: string | null | undefined) => {
    return (name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const currentMessages = activeTab === 'team' ? messages : dmMessages;

  // Collapsed button
  if (!isOpen) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
      >
        <MessageCircle size={24} />
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center text-white animate-pulse">
            {messages.length}
          </span>
        )}
      </button>
    );
  }

  // Expanded panel
  return (
    <div className="fixed bottom-6 right-20 w-80 h-[480px] bg-zinc-900 border border-zinc-800/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-800/50 border-b border-zinc-700/50 px-4 py-3 flex items-center justify-between">
        {activeTab === 'team' ? (
          <>
            <h2 className="text-sm font-semibold text-white">Team Chat</h2>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-zinc-700/50 rounded-lg transition-colors"
            >
              <X size={18} className="text-zinc-400" />
            </button>
          </>
        ) : (
          <>
            {activeDmUserId ? (
              <>
                <button
                  onClick={() => setActiveDmUser(null)}
                  className="p-1 hover:bg-zinc-700/50 rounded-lg transition-colors"
                >
                  <ChevronLeft size={18} className="text-zinc-400" />
                </button>
                <h2 className="text-sm font-semibold text-white flex-1 ml-2">Direct Message</h2>
              </>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-white">Direct Messages</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 hover:bg-zinc-700/50 rounded-lg transition-colors"
                >
                  <X size={18} className="text-zinc-400" />
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Tabs */}
      {!activeDmUserId && (
        <div className="flex gap-2 px-4 py-3 border-b border-zinc-700/50">
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'team'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-zinc-800/30 border border-zinc-700/30 text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Team
          </button>
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'direct'
                ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                : 'bg-zinc-800/30 border border-zinc-700/30 text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Direct
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Team Tab */}
        {activeTab === 'team' && !activeDmUserId && (
          <div className="h-full flex flex-col">
            {!team ? (
              <div className="flex-1 flex items-center justify-center p-4 text-center">
                <p className="text-xs text-zinc-500">
                  Join or create a team first
                </p>
              </div>
            ) : loading && messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-4 text-center">
                <p className="text-xs text-zinc-500">
                  No messages yet. Start the conversation!
                </p>
              </div>
            ) : (
              <div className="space-y-3 p-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">
                        {getInitials(msg.profiles?.full_name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="text-xs font-medium text-white truncate">
                          {msg.profiles?.full_name || msg.profiles?.email}
                        </p>
                        <span className="text-xs text-zinc-500 flex-shrink-0">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                      {msg.content && (
                        <p className="text-xs text-zinc-300 mt-0.5 break-words">
                          {msg.content}
                        </p>
                      )}
                      {msg.file_url && (
                        <a
                          href={msg.file_url}
                          download
                          className="text-xs text-emerald-400 hover:text-emerald-300 underline mt-1 inline-block"
                        >
                          📎 {msg.file_name}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        )}

        {/* Direct Tab - Member List */}
        {activeTab === 'direct' && !activeDmUserId && (
          <div className="h-full flex flex-col">
            {!team ? (
              <div className="flex-1 flex items-center justify-center p-4 text-center">
                <p className="text-xs text-zinc-500">
                  Join or create a team first
                </p>
              </div>
            ) : !members || members.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-4 text-center">
                <p className="text-xs text-zinc-500">
                  No team members
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-2 overflow-y-auto">
                {members
                  .filter((m) => m.id !== user?.id)
                  .map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setActiveDmUser(member.id)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">
                          {getInitials(member.user_name)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {member.user_name || member.email}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          {member.email}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Direct Tab - DM Conversation */}
        {activeTab === 'direct' && activeDmUserId && (
          <div className="h-full flex flex-col">
            {loading && dmMessages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : dmMessages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-4 text-center">
                <p className="text-xs text-zinc-500">
                  No messages yet. Start the conversation!
                </p>
              </div>
            ) : (
              <div className="space-y-3 p-3">
                {dmMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">
                        {getInitials(msg.profiles?.full_name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="text-xs font-medium text-white truncate">
                          {msg.profiles?.full_name || msg.profiles?.email}
                        </p>
                        <span className="text-xs text-zinc-500 flex-shrink-0">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                      {msg.content && (
                        <p className="text-xs text-zinc-300 mt-0.5 break-words">
                          {msg.content}
                        </p>
                      )}
                      {msg.file_url && (
                        <a
                          href={msg.file_url}
                          download
                          className="text-xs text-cyan-400 hover:text-cyan-300 underline mt-1 inline-block"
                        >
                          📎 {msg.file_name}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-zinc-700/50 p-3 space-y-2">
        {selectedFile && (
          <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-2">
            <p className="text-xs text-zinc-300 truncate">
              {selectedFile.name}
            </p>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X size={14} />
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
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-zinc-400 hover:text-white transition-colors hover:bg-zinc-800/50 rounded-lg"
          >
            <Paperclip size={16} />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() && !selectedFile}
            className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white transition-colors rounded-lg"
          >
            <Send size={16} />
          </button>
        </div>
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
