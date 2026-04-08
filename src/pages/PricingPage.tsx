import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Check, X, Zap, Shield, Building2, ArrowRight, Sparkles, Star
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

const PLANS = [
  {
    name: 'Starter',
    icon: Shield,
    monthlyPrice: 0,
    yearlyPrice: 0,
    color: 'from-zinc-500 to-zinc-400',
    accent: 'zinc',
    description: 'Perfect for individuals and small teams exploring supply chain security.',
    cta: 'Start Free',
    ctaHref: '/simulator',
    popular: false,
    features: [
      { text: '5 simulations / month', included: true },
      { text: 'Basic attack scenarios (3)', included: true },
      { text: 'Limited SBOM scans (2/month)', included: true },
      { text: 'Community support', included: true },
      { text: 'Attack history (7 days)', included: true },
      { text: 'AI Defender access', included: false },
      { text: 'Full attack library', included: false },
      { text: 'Export reports (PDF)', included: false },
      { text: 'Email alerts', included: false },
      { text: 'API access', included: false },
      { text: 'SIEM integrations', included: false },
      { text: 'Dedicated support', included: false },
    ],
  },
  {
    name: 'Pro',
    icon: Zap,
    monthlyPrice: 49,
    yearlyPrice: 39,
    color: 'from-emerald-500 to-cyan-500',
    accent: 'emerald',
    description: 'For security teams that need comprehensive simulation and AI-powered defense.',
    cta: 'Upgrade to Pro',
    ctaHref: '/contact',
    popular: true,
    features: [
      { text: 'Unlimited simulations', included: true },
      { text: 'Full attack library (SolarWinds, Log4Shell, XZ Utils…)', included: true },
      { text: 'Unlimited SBOM scans', included: true },
      { text: 'Priority email support', included: true },
      { text: 'Attack history (1 year)', included: true },
      { text: 'AI Defender access', included: true },
      { text: 'Advanced SBOM scanning', included: true },
      { text: 'Export reports (PDF)', included: true },
      { text: 'Email alerts & webhooks', included: true },
      { text: 'API access', included: false },
      { text: 'SIEM integrations', included: false },
      { text: 'Dedicated support', included: false },
    ],
  },
  {
    name: 'Enterprise',
    icon: Building2,
    monthlyPrice: null,
    yearlyPrice: null,
    color: 'from-purple-500 to-pink-500',
    accent: 'purple',
    description: 'Custom solutions for large organizations with mission-critical security needs.',
    cta: 'Contact Sales',
    ctaHref: '/contact',
    popular: false,
    features: [
      { text: 'Unlimited everything', included: true },
      { text: 'Real-time threat intelligence', included: true },
      { text: 'Custom attack modeling', included: true },
      { text: '24/7 dedicated support + SLA', included: true },
      { text: 'Unlimited attack history', included: true },
      { text: 'AI Defender (priority inference)', included: true },
      { text: 'Custom SBOM integrations', included: true },
      { text: 'Export reports (PDF, JSON, CSV)', included: true },
      { text: 'Advanced alerting & runbooks', included: true },
      { text: 'Full API access', included: true },
      { text: 'SIEM integrations (Splunk, Datadog)', included: true },
      { text: 'Dedicated CSE & onboarding', included: true },
    ],
  },
];

const COMPARISON_ROWS = [
  { feature: 'Monthly simulations', starter: '5', pro: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Attack scenarios', starter: '3', pro: 'All (30+)', enterprise: 'All + Custom' },
  { feature: 'SBOM scans', starter: '2 / month', pro: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'AI Defender', starter: false, pro: true, enterprise: true },
  { feature: 'Attack history', starter: '7 days', pro: '1 year', enterprise: 'Unlimited' },
  { feature: 'PDF & CSV export', starter: false, pro: true, enterprise: true },
  { feature: 'Email alerts', starter: false, pro: true, enterprise: true },
  { feature: 'Webhooks / integrations', starter: false, pro: 'Basic', enterprise: 'Advanced' },
  { feature: 'API access', starter: false, pro: false, enterprise: true },
  { feature: 'SIEM integrations', starter: false, pro: false, enterprise: true },
  { feature: 'Custom attack modeling', starter: false, pro: false, enterprise: true },
  { feature: 'Dedicated support & SLA', starter: false, pro: false, enterprise: true },
];

function CellValue({ val }: { val: boolean | string }) {
  if (val === true) return <Check size={16} className="text-emerald-400 mx-auto" />;
  if (val === false) return <X size={16} className="text-zinc-700 mx-auto" />;
  return <span className="text-zinc-300 text-sm">{val}</span>;
}

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  useEffect(() => { document.title = 'Pricing — ChainGuard AI'; }, []);

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
            <Link to="/" className="text-sm text-zinc-400 hover:text-white transition-colors">Home</Link>
            <Link to="/about" className="text-sm text-zinc-400 hover:text-white transition-colors">About</Link>
            <Link to="/contact" className="text-sm text-zinc-400 hover:text-white transition-colors">Contact</Link>
            <Link to="/simulator" className="text-sm px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/8 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-6"
          >
            <Sparkles size={12} />
            Simple, transparent pricing
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl font-black tracking-tight font-display mb-4"
          >
            Secure your supply chain
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              at any scale
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-zinc-400 text-lg max-w-xl mx-auto mb-10"
          >
            Start free. Scale as you grow. No hidden fees, no lock-in.
          </motion.p>

          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-3 bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-1"
          >
            <button
              onClick={() => setYearly(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!yearly ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${yearly ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
            >
              Yearly
              <span className="text-xs bg-amber-400/20 text-amber-400 border border-amber-400/30 px-1.5 py-0.5 rounded-full">Save 20%</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
            return (
              <FadeIn key={plan.name} delay={i * 0.1}>
                <div className={`relative flex flex-col h-full rounded-2xl border transition-all duration-200 ${
                  plan.popular
                    ? 'bg-zinc-900/80 border-emerald-500/40 shadow-2xl shadow-emerald-500/10'
                    : 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-600/60'
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-semibold shadow-lg">
                        <Star size={10} className="fill-current" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className="p-7 flex flex-col flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                        <Icon size={18} className="text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                    </div>
                    <p className="text-zinc-400 text-sm mb-6">{plan.description}</p>

                    {/* Price */}
                    <div className="mb-8">
                      {price === null ? (
                        <div>
                          <div className="text-4xl font-black text-white">Custom</div>
                          <div className="text-zinc-500 text-sm mt-1">Tailored to your needs</div>
                        </div>
                      ) : price === 0 ? (
                        <div>
                          <div className="text-4xl font-black text-white">Free</div>
                          <div className="text-zinc-500 text-sm mt-1">No credit card required</div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-end gap-1">
                            <span className="text-zinc-400 text-xl mb-1">$</span>
                            <span className="text-5xl font-black text-white">{price}</span>
                            <span className="text-zinc-500 text-sm mb-1.5">/mo</span>
                          </div>
                          {yearly && <div className="text-xs text-emerald-400 mt-1">Billed annually — save ${(49 - 39) * 12}/yr</div>}
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <Link
                      to={plan.ctaHref}
                      className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all mb-8 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90 shadow-lg shadow-emerald-500/20'
                          : 'bg-zinc-800/80 border border-zinc-700/60 text-white hover:bg-zinc-700/80'
                      }`}
                    >
                      {plan.cta} <ArrowRight size={15} />
                    </Link>

                    {/* Features */}
                    <div className="space-y-3 flex-1">
                      {plan.features.map((f, fi) => (
                        <div key={fi} className="flex items-start gap-3">
                          {f.included
                            ? <Check size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                            : <X size={15} className="text-zinc-700 flex-shrink-0 mt-0.5" />}
                          <span className={`text-sm ${f.included ? 'text-zinc-300' : 'text-zinc-600'}`}>
                            {f.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-4 pb-24">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl font-bold text-white text-center mb-2 font-display">Full feature comparison</h2>
            <p className="text-zinc-400 text-center mb-10">Everything you need to make the right decision.</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="overflow-x-auto rounded-2xl border border-zinc-800/60 bg-zinc-900/40">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800/60">
                    <th className="text-left p-4 text-zinc-400 font-medium w-1/2">Feature</th>
                    {PLANS.map(p => (
                      <th key={p.name} className="text-center p-4 text-white font-semibold">
                        <div className="flex flex-col items-center gap-1">
                          <span>{p.name}</span>
                          {p.popular && <span className="text-xs text-emerald-400 font-normal">Popular</span>}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr key={i} className={`border-b border-zinc-800/40 transition-colors hover:bg-zinc-800/20 ${i % 2 === 0 ? '' : 'bg-zinc-900/20'}`}>
                      <td className="p-4 text-zinc-400">{row.feature}</td>
                      <td className="p-4 text-center"><CellValue val={row.starter} /></td>
                      <td className="p-4 text-center bg-emerald-500/5"><CellValue val={row.pro} /></td>
                      <td className="p-4 text-center"><CellValue val={row.enterprise} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ / CTA */}
      <section className="px-4 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl blur-xl" />
              <div className="relative bg-zinc-900/80 border border-zinc-700/60 rounded-2xl p-10 space-y-5">
                <h2 className="text-2xl font-bold text-white font-display">Still have questions?</h2>
                <p className="text-zinc-400">Our team is ready to help you find the right plan for your organization.</p>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Talk to Sales <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
