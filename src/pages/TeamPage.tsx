import { useState, useEffect } from 'react';
import { Plus, Users, Mail, Loader2, AlertCircle, Crown } from 'lucide-react';
import { useTeamStore } from '../store/teamStore';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';

export default function TeamPage() {
  const user = useAuthStore((s) => s.user);
  const currentTeam = useTeamStore((s) => s.currentTeam);
  const members = useTeamStore((s) => s.members);
  const loading = useTeamStore((s) => s.loading);
  const error = useTeamStore((s) => s.error);

  const createTeam = useTeamStore((s) => s.createTeam);
  const fetchMyTeam = useTeamStore((s) => s.fetchMyTeam);
  const inviteMember = useTeamStore((s) => s.inviteMember);
  const fetchMembers = useTeamStore((s) => s.fetchMembers);

  const [teamName, setTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [invitingMember, setInvitingMember] = useState(false);

  useEffect(() => {
    fetchMyTeam();
  }, []);

  useEffect(() => {
    if (currentTeam) {
      fetchMembers();
    }
  }, [currentTeam]);

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return;

    setCreatingTeam(true);
    try {
      await createTeam(teamName.trim());
      setTeamName('');
      await fetchMyTeam();
    } catch (err) {
      console.error('Failed to create team:', err);
    } finally {
      setCreatingTeam(false);
    }
  }

  async function handleInviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInvitingMember(true);
    try {
      await inviteMember(inviteEmail.trim());
      setInviteEmail('');
      await fetchMembers();
    } catch (err) {
      console.error('Failed to invite member:', err);
    } finally {
      setInvitingMember(false);
    }
  }

  function getRoleBadgeColors(role: string) {
    switch (role) {
      case 'owner':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'admin':
        return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
      default:
        return 'bg-zinc-800/60 text-zinc-300 border border-zinc-700/60';
    }
  }

  if (loading && !currentTeam) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // No team state - show create form
  if (!currentTeam) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              Teams
            </h1>
            <p className="text-zinc-400">Create or join a team to collaborate with others.</p>
          </div>

          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-8 shadow-xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center mb-4">
                <Users size={32} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">No Team Yet</h2>
              <p className="text-zinc-400">Create a team to start collaborating on attack simulations.</p>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label htmlFor="team-name" className="block text-sm text-zinc-400 mb-2 font-medium">
                  Team Name
                </label>
                <input
                  id="team-name"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., Security Team"
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={creatingTeam || !teamName.trim()}
                className={cn(
                  'w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2',
                  'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-90 text-white transition-opacity',
                  (creatingTeam || !teamName.trim()) && 'opacity-70 cursor-not-allowed'
                )}
              >
                {creatingTeam ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Create Team
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Team exists - show team and members
  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Team Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            {currentTeam.name}
          </h1>
          <p className="text-zinc-400">Team ID: {currentTeam.id}</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Members Section */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Users size={20} className="text-emerald-400" />
            Team Members ({members.length})
          </h2>

          {members.length === 0 ? (
            <p className="text-zinc-400 text-sm">No members yet. Invite someone to get started.</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const displayName = (member as any).profiles?.full_name || (member as any).profiles?.email || 'Unknown';
                const avatar = ((member as any).profiles?.email?.[0] || 'U').toUpperCase();
                const isOwner = member.role === 'owner';
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/40 hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-white font-bold">{avatar}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-white truncate">{displayName}</p>
                          {isOwner && <Crown size={14} className="text-emerald-400 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-zinc-500">
                          {member.joined_at && new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={cn('text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ml-2', getRoleBadgeColors(member.role))}>
                      {member.role}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Invite Member Section */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Mail size={20} className="text-cyan-400" />
            Invite Member
          </h2>

          <form onSubmit={handleInviteMember} className="space-y-4">
            <div>
              <label htmlFor="invite-email" className="block text-sm text-zinc-400 mb-2 font-medium">
                Email Address
              </label>
              <div className="flex gap-2">
                <input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="flex-1 rounded-lg bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                />
                <button
                  type="submit"
                  disabled={invitingMember || !inviteEmail.trim()}
                  className={cn(
                    'px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2',
                    'bg-cyan-600 hover:bg-cyan-500 text-white transition-colors',
                    (invitingMember || !inviteEmail.trim()) && 'opacity-70 cursor-not-allowed'
                  )}
                >
                  {invitingMember ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  <span className="hidden sm:inline">Invite</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-500">They will be added as a regular member. Owners can manage roles.</p>
          </form>
        </div>
      </div>
    </div>
  );
}
