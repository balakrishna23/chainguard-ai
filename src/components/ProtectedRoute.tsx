import { useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const loading = useAuthStore((s) => s.loading);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/auth', { replace: true, state: { from: location.pathname } });
    }
  }, [loading, user, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" aria-label="Redirecting" />
      </div>
    );
  }

  return <>{children}</>;
}
