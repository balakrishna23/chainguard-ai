import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Terminal, Shield, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

export type LogType = 'compromise' | 'spread' | 'blocked' | 'mitigation' | 'system';

export interface LogEntry {
  id: string;
  time: string;
  type: LogType;
  message: string;
}

export interface TerminalLogRef {
  addLog: (type: LogType, message: string) => void;
  clearLogs: () => void;
}

export const TerminalLog = forwardRef<TerminalLogRef>((props, ref) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    addLog: (type: LogType, message: string) => {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      setLogs(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        time,
        type,
        message
      }]);
    },
    clearLogs: () => {
      setLogs([]);
    }
  }));

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getTypeStyle = (type: LogType) => {
    switch (type) {
      case 'compromise': return 'text-red-400 bg-red-400/10 border-red-500/20';
      case 'spread': return 'text-orange-400 bg-orange-400/10 border-orange-500/20';
      case 'blocked': return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
      case 'mitigation': return 'text-blue-400 bg-blue-400/10 border-blue-500/20';
      case 'system': return 'text-zinc-400 bg-zinc-800/50 border-zinc-700/50';
    }
  };

  const getTypeIcon = (type: LogType) => {
    switch (type) {
      case 'compromise': return <AlertTriangle size={12} className="shrink-0" />;
      case 'spread': return <Zap size={12} className="shrink-0" />;
      case 'blocked': return <Shield size={12} className="shrink-0" />;
      case 'mitigation': return <CheckCircle size={12} className="shrink-0" />;
      case 'system': return <Terminal size={12} className="shrink-0" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/40 rounded-lg border border-zinc-800 absolute inset-0 font-mono text-[11px] leading-tight overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-900/50 text-zinc-500">
        <Terminal size={12} />
        <span className="uppercase tracking-widest text-[9px] font-bold">Incident Timeline</span>
        <div className="ml-auto flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/80"></div>
          <div className="w-2 h-2 rounded-full bg-orange-500/80"></div>
          <div className="w-2 h-2 rounded-full bg-emerald-500/80"></div>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto space-y-1.5 scroll-smooth">
        {logs.length === 0 ? (
          <div className="text-zinc-600 italic">Waiting for incoming events...</div>
        ) : (
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex gap-3 px-2 py-1.5 rounded border border-transparent ${getTypeStyle(log.type)} transition-colors`}
              >
                <div className="opacity-60 shrink-0">[{log.time}]</div>
                <div className="flex items-start gap-1.5 flex-1 min-w-0">
                  <div className="mt-0.5">{getTypeIcon(log.type)}</div>
                  <div className="break-words">{log.message}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {/* Blinking Cursor */}
        <div className="flex gap-2 px-2 py-1 items-center h-5">
           <div className="opacity-40 text-emerald-500">➜</div>
           <motion.div 
             animate={{ opacity: [1, 0] }}
             transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
             className="w-2 h-3 bg-zinc-400"
           />
        </div>
      </div>
    </div>
  );
});
