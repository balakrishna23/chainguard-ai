import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Loader2 } from 'lucide-react';
import { supabase, signInWithGoogle } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const authLoading = useAuthStore((s) => s.loading);
  const user = useAuthStore((s) => s.user);

  const params = new URLSearchParams(window.location.search);
  const initialMode = params.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [pending, setPending] = useState<'in' | 'up' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(from, { replace: true });
    }
  }, [authLoading, user, navigate, from]);

  function clearError() {
    setError(null);
  }

  async function handleSignIn() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter email and password');
      return;
    }
    setPending('in');
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) {
        setError(err.message);
        console.error('[Auth] signIn:', err);
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      console.error('[Auth]', err);
    } finally {
      setPending(null);
    }
  }

  async function handleSignUp() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter email and password');
      return;
    }
    setPending('up');
    try {
      const { error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (err) {
        setError(err.message);
        console.error('[Auth] signUp:', err);
        return;
      }
      setMode('login');
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      setError(message);
      console.error('[Auth]', err);
    } finally {
      setPending(null);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setPending('google');
    try {
      await signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign in failed';
      setError(message);
      console.error('[Auth] Google:', err);
      setPending(null);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <Link
        to="/"
        className="flex items-center gap-2 mb-8 text-zinc-400 hover:text-white transition-colors text-sm"
      >
        <Shield size={18} className="text-emerald-400" />
        <span>ChainGuard AI</span>
      </Link>

      <div className={cn(
        'w-full max-w-sm rounded-2xl border bg-zinc-900/40 p-6 shadow-xl',
        mode === 'login' ? 'border-emerald-500/20' : 'border-cyan-500/20'
      )}>
        <h1 className="text-lg font-semibold text-white text-center mb-1">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-xs text-zinc-500 text-center mb-4">
          {mode === 'login' ? 'Sign in to your account' : 'Start securing your supply chain'}
        </p>

        <button
          type="button"
          disabled={pending !== null}
          onClick={handleGoogleSignIn}
          className={cn(
            'w-full mb-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2',
            'bg-white hover:bg-zinc-100 text-zinc-900 transition-colors',
            pending !== null && 'opacity-70 cursor-not-allowed'
          )}
        >
          {pending === 'google' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continue with Google
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-700"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-zinc-900/40 text-zinc-500">or</span>
          </div>
        </div>

        <div className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-fullname" className="block text-xs text-zinc-500 mb-1.5">
                Full name
              </label>
              <input
                id="auth-fullname"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearError();
                }}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                placeholder="John Doe"
              />
            </div>
          )}
          <div>
            <label htmlFor="auth-email" className="block text-xs text-zinc-500 mb-1.5">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError();
              }}
              className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="block text-xs text-zinc-500 mb-1.5">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
              className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              disabled={pending !== null}
              onClick={handleSignIn}
              className={cn(
                'w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2',
                'bg-emerald-600 hover:bg-emerald-500 text-white transition-colors',
                pending !== null && 'opacity-70 cursor-not-allowed'
              )}
            >
              {pending === 'in' ? <Loader2 size={16} className="animate-spin" /> : null}
              Sign In
            </button>
            <button
              type="button"
              disabled={pending !== null}
              onClick={handleSignUp}
              className={cn(
                'w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2',
                'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-colors',
                pending !== null && 'opacity-70 cursor-not-allowed'
              )}
            >
              {pending === 'up' ? <Loader2 size={16} className="animate-spin" /> : null}
              Sign Up
            </button>
          </div>
          {mode === 'login' ? (
            <p className="text-xs text-zinc-500 text-center mt-4">
              Don't have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-emerald-400 hover:text-emerald-300 underline"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p className="text-xs text-zinc-500 text-center mt-4">
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
