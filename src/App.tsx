import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

import Sidebar, { MobileMenuButton } from './components/Sidebar';
import FloatingChat from './components/FloatingChat';
import OnboardingModal from './components/OnboardingModal';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import SimulatorPage from './pages/SimulatorPage';
import DefenderPage from './pages/DefenderPage';
import HistoryPage from './pages/HistoryPage';
import DashboardPage from './pages/DashboardPage';
import TeamPage from './pages/TeamPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import DocsPage from './pages/DocsPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import AuthPage from './pages/AuthPage';

import { supabase } from './lib/supabase';
import { useAuthStore } from './store/authStore';
import { useChatStore } from './store/chatStore';

function GlobalChatListener() {
  const user = useAuthStore((s) => s.user);
  const incrementGlobalUnread = useChatStore((s) => s.incrementGlobalUnread);

  useEffect(() => {
    if (!user) return;

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const channel = supabase
      .channel('global-chat-listener')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, async (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id === user.id) return;
        incrementGlobalUnread();
        if (document.hidden && Notification.permission === 'granted') {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', msg.sender_id)
            .single();
          const name = profile?.full_name || profile?.email || 'Teammate';
          new Notification(`New message from ${name}`, {
            body: msg.content || 'Sent a file',
            icon: '/favicon.ico',
          });
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, incrementGlobalUnread]);

  return null;
}

function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = location.pathname === '/auth';
  const isMarketingPage =
    ['/', '/pricing', '/about', '/contact', '/docs', '/blog'].includes(location.pathname) ||
    location.pathname.startsWith('/blog/');

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'k':
            e.preventDefault();
            navigate('/simulator');
            break;
          case 'j':
            e.preventDefault();
            navigate('/defender');
            break;
          case 'h':
            e.preventDefault();
            navigate('/history');
            break;
          case 'd':
            e.preventDefault();
            navigate('/dashboard');
            break;
        }
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    );
  }

  if (isMarketingPage) {
    return (
      <div className="relative">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
        </Routes>
        <FloatingChat />
        <OnboardingModal />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-zinc-950 overflow-hidden">
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60 lg:hidden bg-zinc-950/80 backdrop-blur-sm flex-shrink-0">
            <MobileMenuButton onClick={() => setMobileOpen(true)} />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <span className="text-xs text-white font-bold">C</span>
              </div>
              <span className="font-semibold text-white text-sm">ChainGuard AI</span>
            </div>
            <div className="ml-auto text-xs text-zinc-500 capitalize">
              {location.pathname.replace('/', '') || 'home'}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/simulator" element={<SimulatorPage />} />
                <Route path="/defender" element={<DefenderPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Routes>
            </AnimatePresence>
          </div>
        </div>

        <OnboardingModal />
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  useEffect(() => {
    const { fetchUser, setUser } = useAuthStore.getState();

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <GlobalChatListener />
      <AppShell />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#f4f4f5',
            border: '1px solid #3f3f46',
            borderRadius: '12px',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#18181b' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#18181b' } },
        }}
      />
    </BrowserRouter>
  );
}
