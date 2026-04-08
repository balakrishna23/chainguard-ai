import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck } from 'lucide-react';
import type { THREATS } from '../lib/data';

type Threat = typeof THREATS[0];

interface ThreatModalProps {
  threat: Threat | null;
  onClose: () => void;
}

export default function ThreatModal({ threat, onClose }: ThreatModalProps) {
  return (
    <AnimatePresence>
      {threat && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-zinc-900 border border-zinc-700/60 rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-zinc-800/60 bg-zinc-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center shadow-inner">
                  <threat.icon size={24} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white font-display leading-tight">{threat.label}</h2>
                  <div className="text-red-400/80 text-xs font-mono uppercase tracking-wider mt-1">Attack Vector</div>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="text-zinc-500 hover:text-white bg-zinc-800/50 hover:bg-zinc-700/50 rounded-full p-1.5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-2 font-display">How it works</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {threat.description}
                </p>
              </div>
              
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-semibold text-emerald-100 font-display">Mitigation Strategy</h3>
                </div>
                <p className="text-emerald-400/80 text-sm leading-relaxed">
                  {threat.mitigation}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-0 flex justify-end">
               <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white font-medium text-sm transition-colors"
                >
                  Close
                </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
