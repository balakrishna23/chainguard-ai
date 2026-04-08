import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { streamChat } from '../lib/ai';
import type { ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hi! I'm ChainGuard AI. Ask me anything about supply chain security, vulnerabilities, or how to defend your systems.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { id: uuidv4(), role: 'user', content: input, timestamp: new Date() };
    const assistantId = uuidv4();
    setMessages(prev => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true }]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', content: m.content }));
      let full = '';
      for await (const chunk of streamChat(history, input)) {
        full += chunk;
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: full } : m));
      }
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: 'Sorry, I encountered an error. Please try again.', isStreaming: false } : m));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Bubble button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center text-white"
        aria-label="Open AI chat"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle size={22} />
            </motion.div>
          )}
        </AnimatePresence>
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 text-xs flex items-center justify-center text-zinc-900 font-bold">
          <Sparkles size={9} />
        </span>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[500px] flex flex-col rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 shadow-2xl shadow-black/50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-zinc-800/60 bg-zinc-950/50">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Ask ChainGuard AI</div>
                <div className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Supply Chain Expert
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-500/20 text-emerald-100 rounded-tr-sm border border-emerald-500/20'
                      : 'bg-zinc-800/80 text-zinc-200 rounded-tl-sm border border-zinc-700/40'
                  }`}>
                    {msg.content || (msg.isStreaming && <Loader2 size={14} className="animate-spin" />)}
                    {msg.isStreaming && msg.content && <span className="inline-block w-1 h-3 bg-emerald-400 ml-0.5 animate-pulse" />}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-zinc-800/60">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask about supply chain security..."
                  className="flex-1 bg-zinc-800/60 border border-zinc-700/40 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-40 flex items-center justify-center flex-shrink-0"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
