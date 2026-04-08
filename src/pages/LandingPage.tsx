import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Shield, Play, Zap, History, LayoutDashboard, ArrowRight,
  AlertTriangle, Lock, Search, GitBranch, Cpu, Globe
} from 'lucide-react';

import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

const FEATURES = [
  { icon: Play, title: 'Attack Simulator', desc: 'Replay Log4Shell, SolarWinds, XZ Utils and more on live dependency graphs.', color: 'from-red-500 to-orange-500', href: '/simulator' },
  { icon: Zap, title: 'AI Defender', desc: 'Upload your SBOM and get instant Groq-powered vulnerability triage.', color: 'from-purple-500 to-pink-500', href: '/defender' },
  { icon: LayoutDashboard, title: 'Risk Dashboard', desc: 'Track security posture over time with trend charts and live risk scores.', color: 'from-blue-500 to-cyan-500', href: '/dashboard' },
  { icon: History, title: 'Simulation History', desc: 'Replay past attacks, compare results, and export PDF reports.', color: 'from-teal-500 to-emerald-500', href: '/history' },
];

const STATS = [
  { value: '18,000+', label: 'Orgs hit by SolarWinds' },
  { value: '3B+', label: 'Devices exposed to Log4Shell' },
  { value: '2 yrs', label: 'XZ Utils compromise duration' },
  { value: '$46B', label: 'Supply chain attack cost 2023' },
];

import { THREATS } from '../lib/data';
import ThreatModal from '../components/ThreatModal';

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// Animated grid background
function GridBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[300px] bg-cyan-500/8 rounded-full blur-[100px]" />
    </div>
  );
}

// Pulsing node in hero
function HeroGraph() {
  const nodes = [
    { x: 50, y: 50, label: 'App Server', status: 'compromised' },
    { x: 20, y: 30, label: 'log4j', status: 'compromised' },
    { x: 75, y: 30, label: 'Auth API', status: 'vulnerable' },
    { x: 85, y: 60, label: 'Database', status: 'safe' },
    { x: 30, y: 70, label: 'CI/CD', status: 'safe' },
    { x: 60, y: 80, label: 'Vault', status: 'safe' },
  ];
  const colors: Record<string, string> = {
    compromised: '#ef4444',
    vulnerable: '#f97316',
    safe: '#334155',
  };
  const edges = [
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [2, 3],
  ];
  return (
    <div className="relative w-full h-64 sm:h-80">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x} y1={nodes[a].y}
            x2={nodes[b].x} y2={nodes[b].y}
            stroke={nodes[a].status === 'compromised' || nodes[b].status === 'compromised' ? '#ef444430' : '#33415520'}
            strokeWidth="0.5"
          />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r="5" fill={colors[n.status]} opacity="0.15" />
            <motion.circle
              cx={n.x} cy={n.y} r="3.5"
              fill={colors[n.status]}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.12, type: 'spring' }}
            />
            {n.status === 'compromised' && (
              <motion.circle
                cx={n.x} cy={n.y}
                fill="none" stroke="#ef4444" strokeWidth="1"
                initial={{ r: 3.5 }}
                animate={{ r: [3.5, 7, 3.5], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              />
            )}
            <text x={n.x} y={n.y + 7} textAnchor="middle" fontSize="2.5" fill="#94a3b8">{n.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function LandingPage() {
  const [selectedThreat, setSelectedThreat] = useState<any>(null);
  const { user } = useAuthStore();

  useEffect(() => { document.title = 'ChainGuard AI – Supply Chain Defender'; }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden">
      {/* Navbar Minimal */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">ChainGuard AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollToSection('features')} className="text-sm text-zinc-400 hover:text-white transition-colors">Features</button>
            <Link to="/pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">Pricing</Link>
            <Link to="/about" className="text-sm text-zinc-400 hover:text-white transition-colors">About</Link>
            <Link to="/blog" className="text-sm text-zinc-400 hover:text-white transition-colors">Blog</Link>
            <Link to="/contact" className="text-sm text-zinc-400 hover:text-white transition-colors">Contact</Link>
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 hover:opacity-90 transition-opacity">
                <span className="text-xs font-bold text-white">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-sm text-zinc-500 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/auth?mode=login"
                className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white overflow-hidden group transition-all duration-300 border border-emerald-500/40 hover:border-emerald-400/80 hover:shadow-lg hover:shadow-emerald-500/20"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-sm" />
                <Shield size={14} className="relative z-10 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
                <span className="relative z-10 text-zinc-300 group-hover:text-white transition-colors duration-300">Log in</span>
                <ArrowRight size={13} className="relative z-10 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all duration-300" />
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 pt-16">
        <GridBg />
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight font-display leading-none"
          >
            <span className="text-white">Supply Chain</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent bg-[size:200%] animate-[shimmer_3s_ease_infinite]">
              Attack Simulator
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Visualize real supply chain attacks on your dependency graph. Detect vulnerabilities before attackers do.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              to="/simulator"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
            >
              <Play size={18} /> Launch Simulator
            </Link>
            <Link
              to="/defender"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-white font-semibold hover:bg-zinc-700/80 transition-colors"
            >
              <Zap size={18} /> Analyze SBOM
            </Link>
          </motion.div>

          {/* Hero graph */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 max-w-xl mx-auto rounded-2xl bg-zinc-900/60 border border-zinc-800/60 backdrop-blur-sm p-4 shadow-2xl"
          >
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-xs text-zinc-500 font-mono">log4shell-simulation.cg</span>
            </div>
            <HeroGraph />
            <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Compromised</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> Vulnerable</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-zinc-600" /> Safe</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-zinc-800/60 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((s, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="text-center">
                  <div className="text-3xl font-black text-white font-mono">{s.value}</div>
                  <div className="text-sm text-zinc-500 mt-1">{s.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-display mb-3">Everything you need to stay secure</h2>
              <p className="text-zinc-400 max-w-xl mx-auto">From attack simulation to real-time AI defense, ChainGuard has your supply chain covered.</p>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <FadeIn key={i} delay={i * 0.1}>
                  <Link to={f.href} className="group block">
                    <div className="h-full bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6 hover:border-zinc-600/60 transition-all duration-200 hover:bg-zinc-800/40">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                        <Icon size={20} className="text-white" />
                      </div>
                      <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
                      <div className="flex items-center gap-1 mt-4 text-emerald-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        Explore <ArrowRight size={14} />
                      </div>
                    </div>
                  </Link>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Threat types */}
      <section className="py-16 px-4 bg-zinc-900/30 border-y border-zinc-800/40">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="text-center text-2xl font-bold text-white font-display mb-10">Attack vectors we simulate</h2>
          </FadeIn>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {THREATS.map((t, i) => {
              const Icon = t.icon;
              return (
                <FadeIn key={i} delay={i * 0.06}>
                  <button 
                    onClick={() => setSelectedThreat(t)}
                    className="w-full flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/40 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <Icon size={22} className="text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                    <span className="text-xs text-zinc-500">{t.label}</span>
                  </button>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Threat Modal */}
      <ThreatModal
        threat={selectedThreat}
        onClose={() => setSelectedThreat(null)}
      />

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl blur-xl" />
              <div className="relative bg-zinc-900/80 border border-zinc-700/60 rounded-2xl p-10 space-y-6">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <Shield size={24} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white font-display">Ready to simulate an attack?</h2>
                <p className="text-zinc-400">Choose a pre-built scenario or configure your own dependency graph.</p>
                <Link
                  to="/simulator"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
                >
                  <Play size={18} /> Start Simulator
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
