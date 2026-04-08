import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, LayoutDashboard, Play, Zap, History, Users, User, ChevronLeft,
  ChevronRight, Menu, X, ExternalLink, LogOut, MessageCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

const NAV_ITEMS = [
  { path: '/', icon: Shield, label: 'Home', shortcut: null },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', shortcut: '⌘D' },
  { path: '/simulator', icon: Play, label: 'Simulator', shortcut: '⌘K' },
  { path: '/defender', icon: Zap, label: 'Defender', shortcut: '⌘J' },
  { path: '/history', icon: History, label: 'History', shortcut: '⌘H' },
  { path: '/team', icon: Users, label: 'Team', shortcut: null },
  { path: '/chat', icon: MessageCircle, label: 'Messages', shortcut: null },
  { path: '/profile', icon: User, label: 'Profile', shortcut: null },
  { path: '/docs', icon: ExternalLink, label: 'Documentation', shortcut: null },
];

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const signOut = useAuthStore((s) => s.signOut);
  const globalUnread = useChatStore((s) => s.globalUnread);
  const resetGlobalUnread = useChatStore((s) => s.resetGlobalUnread);

  useEffect(() => {
    if (location.pathname === '/chat') {
      resetGlobalUnread();
    }
  }, [location.pathname, resetGlobalUnread]);

  const sidebarContent = (
    <div className={cn(
      'flex flex-col h-full bg-zinc-950/90 backdrop-blur-xl border-r border-zinc-800/60 transition-all duration-300',
      collapsed ? 'w-16' : 'w-56'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/60">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-sm text-white whitespace-nowrap overflow-hidden font-display"
              >
                ChainGuard AI
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-zinc-400 hover:text-white transition-colors hidden lg:block ml-auto"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="text-zinc-400 hover:text-white transition-colors lg:hidden ml-auto"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map(({ path, icon: Icon, label, shortcut }) => {
          const active = location.pathname === path;
          const navItem = (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative',
                active
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between flex-1 min-w-0"
                  >
                    <span className="text-sm font-medium">{label}</span>
                    {shortcut && (
                      <span className="text-xs text-zinc-600 hidden xl:block">{shortcut}</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              {active && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-emerald-400 rounded-full"
                />
              )}
            </Link>
          );

          if (path === '/chat') {
            return (
              <div key={path} className="relative">
                {navItem}
                {globalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center z-10">
                    {globalUnread > 99 ? '99+' : globalUnread}
                  </span>
                )}
              </div>
            );
          }

          return navItem;
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800/60 space-y-2">
        <button
          type="button"
          onClick={() => signOut()}
          title="Sign out"
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors',
            collapsed && 'justify-center px-0'
          )}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-zinc-600 space-y-1"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Groq AI Connected</span>
              </div>
              <a
                href="https://groq.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <ExternalLink size={10} />
                <span>Powered by Groq</span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen sticky top-0 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-full z-50 lg:hidden w-56"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
      aria-label="Open navigation menu"
    >
      <Menu size={20} />
    </button>
  );
}
