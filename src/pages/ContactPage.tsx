import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Shield, Mail, MapPin, Clock, Send, Twitter, Linkedin, Github, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function ContactPage() {
  useEffect(() => { document.title = 'Contact — ChainGuard AI'; }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Message sent! Our team will get back to you shortly.');
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

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
            <Link to="/about" className="text-sm text-zinc-400 hover:text-white transition-colors">About</Link>
            <Link to="/blog" className="text-sm text-zinc-400 hover:text-white transition-colors">Blog</Link>
            <Link to="/simulator" className="text-sm px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <FadeIn>
              <h1 className="text-4xl sm:text-5xl font-black text-white font-display mb-4">Get in touch</h1>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Whether you have a question about features, trials, pricing, need a demo, or anything else, our team is ready to answer all your questions.
              </p>
            </FadeIn>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
            {/* Left: Form */}
            <FadeIn delay={0.1}>
              <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-8 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium text-zinc-300">First Name</label>
                      <input id="firstName" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors" placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium text-zinc-300">Last Name</label>
                      <input id="lastName" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors" placeholder="Doe" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-zinc-300">Work Email</label>
                    <input id="email" type="email" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors" placeholder="john@company.com" />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-medium text-zinc-300">Company</label>
                    <input id="company" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors" placeholder="Acme Inc." />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium text-zinc-300">How can we help?</label>
                    <select id="subject" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors appearance-none">
                      <option>I want to evaluate ChainGuard AI</option>
                      <option>I need help with my account</option>
                      <option>Partnership inquiry</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-zinc-300">Message</label>
                    <textarea id="message" required rows={4} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors resize-none" placeholder="Tell us more about your needs..."></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} /> Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </FadeIn>

            {/* Right: Contact Info */}
            <FadeIn delay={0.2} className="space-y-10 lg:pt-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-6">Contact Information</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                      <Mail size={18} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium mb-1">Email</div>
                      <a href="mailto:security@chainguard.ai" className="text-zinc-400 hover:text-emerald-400 transition-colors text-sm">security@chainguard.ai</a>
                      <p className="text-zinc-500 text-xs mt-1">For general inquiries and support</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                      <Clock size={18} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium mb-1">Response Time</div>
                      <div className="text-zinc-400 text-sm">Within 24 hours</div>
                      <p className="text-zinc-500 text-xs mt-1">During regular business hours (Mon-Fri)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-6">Our Offices</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium mb-1">San Francisco (HQ)</div>
                      <div className="text-zinc-400 text-sm">100 Market St, Suite 400<br />San Francisco, CA 94105</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium mb-1">London</div>
                      <div className="text-zinc-400 text-sm">Old Street Transit Hub<br />London, UK EC1V 9NR</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-4">Follow Us</h3>
                <div className="flex items-center gap-3">
                  <a href="#" className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors">
                    <Twitter size={18} />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors">
                    <Linkedin size={18} />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors">
                    <Github size={18} />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors">
                    <MessageSquare size={18} />
                  </a>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </div>
  );
}
