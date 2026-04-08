import { useEffect, useRef, useState } from 'react';
import { Shield, Camera, Loader2, User, Lock, Trash2 } from 'lucide-react';
import { useProfileStore } from '../store/profileStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, loading, fetchProfile, updateProfile, uploadAvatar, uploadBanner, changePassword } = useProfileStore();
  const user = useAuthStore((s) => s.user);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [simCount, setSimCount] = useState<number>(0);
  const [teamName, setTeamName] = useState<string>('No team');
  const [avgRisk, setAvgRisk] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setBio(profile.bio ?? '');
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    // Fetch sim count and avg risk
    supabase
      .from('simulations')
      .select('risk_score', { count: 'exact' })
      .eq('user_id', user.id)
      .then(({ data, count }) => {
        setSimCount(count ?? 0);
        if (data && data.length > 0) {
          const avg = data.reduce((sum, s) => sum + (s.risk_score ?? 0), 0) / data.length;
          setAvgRisk(Math.round(avg));
        }
      });
    // Fetch team name
    supabase
      .from('team_members')
      .select('teams(name)')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.teams) setTeamName((data.teams as any).name);
      });
  }, [user]);

  async function handleSave() {
    setSaving(true);
    await updateProfile({ full_name: fullName, bio });
    toast.success('Profile updated');
    setSaving(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAvatar(file);
    toast.success('Avatar updated');
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadBanner(file);
    toast.success('Banner updated');
  }

  async function handleChangePassword() {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setChangingPassword(true);
    await changePassword(newPassword);
    toast.success('Password updated');
    setNewPassword('');
    setConfirmPassword('');
    setChangingPassword(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Banner */}
      <div
        className="relative w-full h-52 cursor-pointer overflow-hidden group"
        onClick={() => bannerInputRef.current?.click()}
      >
        {profile?.banner_url ? (
          <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-zinc-900/90 to-zinc-950" />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)`,
                backgroundSize: '32px 32px',
              }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-emerald-500/10 rounded-full blur-[80px]" />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/60 border border-zinc-600/60 text-white text-sm">
            <Camera size={16} />
            Change Banner
          </div>
        </div>
        {/* Active badge */}
        <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active
        </div>
        {/* Branding */}
        <div className="absolute bottom-4 left-6 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm">ChainGuard AI</span>
        </div>
      </div>

      {/* Avatar overlapping banner */}
      <div className="max-w-3xl mx-auto px-6">
        <div className="relative -mt-12 mb-4 flex items-end justify-between">
          <div
            className="relative cursor-pointer group"
            onClick={() => avatarInputRef.current?.click()}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-24 h-24 rounded-full border-4 border-zinc-950 object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-zinc-950 bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
                {profile?.email?.charAt(0).toUpperCase() ?? '?'}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
              <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Name and email */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{profile?.full_name || 'Unnamed User'}</h1>
          <p className="text-zinc-400 text-sm">{profile?.email}</p>
          {profile?.bio && <p className="text-zinc-500 text-sm mt-1">{profile.bio}</p>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Simulations Run', value: simCount },
            { label: 'Avg Risk Score', value: avgRisk },
            { label: 'Member Since', value: memberSince },
            { label: 'Team', value: teamName },
          ].map((stat, i) => (
            <div key={i} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-zinc-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Edit Profile */}
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-emerald-400" />
            <h2 className="text-white font-semibold">Edit Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none"
                placeholder="Tell your team about yourself..."
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={16} className="text-cyan-400" />
            <h2 className="text-white font-semibold">Change Password</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                placeholder="••••••••"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {changingPassword && <Loader2 size={14} className="animate-spin" />}
              Update Password
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-zinc-900/60 border border-red-500/20 rounded-xl p-6 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 size={16} className="text-red-400" />
            <h2 className="text-white font-semibold">Danger Zone</h2>
          </div>
          <p className="text-zinc-500 text-sm mb-4">Once you sign out, you will need to log in again to access your account.</p>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 text-sm font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
    </div>
  );
}
