import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Play, Zap, History, LayoutDashboard, X, ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = [
  {
    icon: Shield,
    title: 'Welcome to ChainGuard AI',
    description: 'Your AI-powered supply chain security platform. Simulate real-world attacks, analyze vulnerabilities, and defend your software ecosystem.',
    color: 'from-emerald-500 to-cyan-500',
  },
  {
    icon: Play,
    title: 'Attack Simulator',
    description: 'Visualize supply chain attacks like Log4Shell, SolarWinds, and XZ Utils on interactive dependency graphs. Watch attacks propagate in real-time.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Zap,
    title: 'AI Defender',
    description: 'Upload your SBOM or paste dependencies for instant Groq-powered analysis. Get prioritized vulnerability fixes and mitigation strategies.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: History,
    title: 'Simulation History',
    description: 'Review past simulations, compare risk scores over time, and export detailed PDF reports for your security team.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: LayoutDashboard,
    title: 'Risk Dashboard',
    description: 'Track your overall security posture with trend charts, quick stats, and top vulnerable components at a glance.',
    color: 'from-teal-500 to-emerald-500',
  },
];

export default function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem('chainguard_onboarded');
    if (!seen) {
      setTimeout(() => setOpen(true), 800);
    }
  }, []);

  function close() {
    localStorage.setItem('chainguard_onboarded', '1');
    setOpen(false);
  }

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && close()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-zinc-900 border border-zinc-700/60 rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
          >
            {/* Close */}
            <div className="flex justify-end p-4 pb-0">
              <button onClick={close} className="text-zinc-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="px-8 pb-6 pt-2 text-center">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${current.color} flex items-center justify-center shadow-lg`}>
                  <Icon size={28} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-white font-display">{current.title}</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">{current.description}</p>
              </motion.div>

              {/* Dots */}
              <div className="flex justify-center gap-1.5 mt-6">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      i === step ? 'bg-emerald-400 w-5' : 'bg-zinc-700 hover:bg-zinc-500'
                    }`}
                  />
                ))}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 mt-6">
                {step > 0 && (
                  <button
                    onClick={() => setStep(s => s - 1)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:border-zinc-500 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                )}
                {step < STEPS.length - 1 ? (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold flex items-center justify-center gap-2 text-sm hover:opacity-90 transition-opacity"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={close}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    Get Started 🚀
                  </button>
                )}
              </div>

              <button onClick={close} className="mt-3 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                Skip tour
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
