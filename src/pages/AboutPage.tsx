import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Shield, Target, Lightbulb, Users, Heart, ArrowRight,
  Globe, Lock, Layers
} from 'lucide-react';

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

const TIMELINE = [
  {
    year: '2021',
    title: 'The Wake-Up Call',
    desc: 'SolarWinds and Log4Shell shocked the industry. Our founders, security engineers at Fortune 500 companies, realized existing tools couldn\'t simulate these attacks in real-time.',
  },
  {
    year: '2022',
    title: 'Building in Stealth',
    desc: 'A small team of 4 engineers spent 18 months building the first version of ChainGuard\'s dependency graph engine and attack replay system.',
  },
  {
    year: '2023',
    title: 'AI Integration',
    desc: 'Integrated with Groq for fast vulnerability triage, giving security teams instant context on every CVE.',
  },
  {
    year: '2024',
    title: 'Enterprise Launch',
    desc: 'Launched publicly with 50 enterprise design partners. Reached $1M ARR in 6 months. Expanded to London and Singapore.',
  },
  {
    year: '2025',
    title: 'Scale & Expansion',
    desc: 'Now protecting 500+ organizations across 30 countries. Processing millions of dependency graph simulations monthly.',
  },
];

const VALUES = [
  {
    icon: Lock,
    title: 'Security First',
    desc: 'We\'d rather delay a feature than ship something that compromises our customers\' trust. Security is never a checkbox.',
    color: 'from-red-500 to-orange-500',
  },
  {
    icon: Layers,
    title: 'Transparency',
    desc: 'Open about how our AI makes decisions, what data we use, and how we respond to incidents. No black boxes.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    desc: 'The threat landscape evolves daily. We invest 30% of engineering time into research to stay ahead of attackers.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Heart,
    title: 'Community',
    desc: 'We contribute back to open-source security tools, publish research, and share threat intelligence with the community.',
    color: 'from-emerald-500 to-teal-500',
  },
];

const TEAM = [
  { name: 'Sarah Chen', role: 'Co-founder & CEO', bg: 'from-emerald-500 to-cyan-500', initials: 'SC', bio: 'Former CISO at a Fortune 100. 15 years in offensive security.' },
  { name: 'Marcus Webb', role: 'Co-founder & CTO', bg: 'from-purple-500 to-pink-500', initials: 'MW', bio: 'Ex-Google Security. Led OSS vulnerability research at CISA.' },
  { name: 'Priya Nair', role: 'VP Engineering', bg: 'from-blue-500 to-indigo-500', initials: 'PN', bio: 'Built security platforms at Palo Alto Networks and Snyk.' },
  { name: 'James Okafor', role: 'Head of AI Research', bg: 'from-orange-500 to-red-500', initials: 'JO', bio: 'PhD in adversarial ML. Published researcher in supply chain security.' },
  { name: 'Lena Kovač', role: 'VP Sales & Partnerships', bg: 'from-teal-500 to-emerald-500', initials: 'LK', bio: 'Built enterprise sales at Wiz and Orca Security from 0 to $50M ARR.' },
  { name: 'Ravi Subramaniam', role: 'Head of Product', bg: 'from-zinc-500 to-zinc-400', initials: 'RS', bio: 'Former PM at GitHub Security. Passionate about developer-first security.' },
];

const STATS = [
  { value: '500+', label: 'Organizations protected' },
  { value: '30+', label: 'Countries' },
  { value: '2M+', label: 'Simulations run' },
  { value: '99.9%', label: 'Uptime SLA' },
];

export default function AboutPage() {
  useEffect(() => { document.title = 'About — ChainGuard AI'; }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">ChainGuard AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">Pricing</Link>
            <Link to="/blog" className="text-sm text-zinc-400 hover:text-white transition-colors">Blog</Link>
            <Link to="/contact" className="text-sm text-zinc-400 hover:text-white transition-colors">Contact</Link>
            <Link to="/simulator" className="text-sm px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-28 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/8 rounded-full blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
            }}
          />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-6"
          >
            <Globe size={12} />
            Our Story
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl font-black tracking-tight font-display mb-6"
          >
            Defending the
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Software Supply Chain
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-zinc-400 text-xl max-w-2xl mx-auto leading-relaxed"
          >
            We're a team of security engineers, researchers, and builders on a mission to make supply chain attacks visible — before they cause damage.
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-zinc-800/60 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="text-center">
                  <div className="text-4xl font-black text-white font-mono">{s.value}</div>
                  <div className="text-sm text-zinc-500 mt-1">{s.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Target size={18} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white font-display">Our Mission</h2>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-8">
              <p className="text-zinc-300 text-lg leading-relaxed mb-4">
                Software supply chain attacks are the fastest-growing threat category in cybersecurity. Yet most organizations have no way to simulate, model, or test their exposure to these attacks until it's too late.
              </p>
              <p className="text-zinc-400 leading-relaxed">
                ChainGuard AI bridges that gap. We combine real-world attack replay, AI-powered triage, and continuous monitoring into a single platform that gives security teams the clarity and confidence they need to protect their software supply chain.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4 bg-zinc-900/20 border-y border-zinc-800/40">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl font-bold text-white font-display text-center mb-14">Our Story</h2>
          </FadeIn>
          <div className="relative">
            <div className="absolute left-8 sm:left-1/2 top-0 bottom-0 w-px bg-zinc-800/80" />
            <div className="space-y-12">
              {TIMELINE.map((item, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className={`relative flex flex-col sm:flex-row gap-6 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                    {/* Content */}
                    <div className="sm:w-[calc(50%-2rem)] ml-16 sm:ml-0">
                      <div className={`bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6 hover:border-zinc-600/60 transition-all ${i % 2 === 0 ? 'sm:mr-8' : 'sm:ml-8'}`}>
                        <div className="text-emerald-400 font-mono text-sm font-bold mb-2">{item.year}</div>
                        <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                    {/* Dot */}
                    <div className="absolute left-8 sm:left-1/2 -translate-x-1/2 top-6 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-950 shadow-lg shadow-emerald-500/30" />
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl font-bold text-white font-display text-center mb-3">Our Values</h2>
            <p className="text-zinc-400 text-center mb-12">The principles that guide every decision we make.</p>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6 hover:border-zinc-600/60 transition-all h-full">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${v.color} flex items-center justify-center mb-4`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">{v.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{v.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 bg-zinc-900/20 border-y border-zinc-800/40">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-3 justify-center mb-3">
              <Users size={24} className="text-emerald-400" />
              <h2 className="text-3xl font-bold text-white font-display">Meet the Team</h2>
            </div>
            <p className="text-zinc-400 text-center mb-12">World-class security experts and engineers united by one goal.</p>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TEAM.map((member, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6 hover:border-zinc-600/60 transition-all">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${member.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-sm">{member.initials}</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">{member.name}</div>
                      <div className="text-emerald-400 text-xs mt-0.5">{member.role}</div>
                    </div>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{member.bio}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl blur-xl" />
              <div className="relative bg-zinc-900/80 border border-zinc-700/60 rounded-2xl p-10 space-y-5">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                  <Shield size={24} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white font-display">Join us in securing the software supply chain</h2>
                <p className="text-zinc-400">Start protecting your dependencies today — or reach out to learn how we can help your team.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/simulator"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity"
                  >
                    Try Free <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-white font-semibold hover:bg-zinc-700/80 transition-colors"
                  >
                    Contact Sales
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
