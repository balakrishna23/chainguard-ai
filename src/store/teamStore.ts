import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  created_at?: string;
}

export interface TeamMember {
  id: string;
  team_id?: string;
  user_id: string;
  role: 'owner' | 'member';
  email?: string;
  user_name?: string;
  joined_at?: string;
}

interface TeamState {
  currentTeam: Team | null;
  members: TeamMember[];
  loading: boolean;
  error: string | null;

  createTeam: (name: string) => Promise<void>;
  fetchMyTeam: () => Promise<void>;
  inviteMember: (email: string) => Promise<void>;
  fetchMembers: () => Promise<void>;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  currentTeam: null,
  members: [],
  loading: false,
  error: null,

  createTeam: async (name: string) => {
    set({ loading: true, error: null });
    try {
      const user = useAuthStore.getState().user;
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Prevent duplicate teams — check if user already owns a team
      const { data: existing } = await supabase
        .from('teams')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (existing) {
        await get().fetchMyTeam();
        return;
      }

      // Insert team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name,
          owner_id: user.id,
        })
        .select()
        .single();

      if (teamError) {
        throw new Error(teamError.message);
      }

      // Auto-insert creator as owner in team_members
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) {
        throw new Error(memberError.message);
      }

      set({ currentTeam: teamData });
      console.log('[TeamStore] Team created:', teamData.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create team';
      set({ error: message });
      console.error('[TeamStore] createTeam error:', err);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  fetchMyTeam: async () => {
    set({ loading: true, error: null });
    try {
      const user = useAuthStore.getState().user;
      if (!user) {
        throw new Error('No authenticated user');
      }

      try {
        const { data, error } = await supabase
          .from('team_members')
          .select(`
            team_id,
            teams (
              id,
              name,
              owner_id
            )
          `)
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (error) {
          throw error;
        }

        if (data?.teams) {
          set({ currentTeam: data.teams as any });
        } else {
          set({ currentTeam: null });
        }
      } catch (queryErr) {
        // Silently set to null if no team found
        set({ currentTeam: null });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch team';
      console.error('[TeamStore] fetchMyTeam error:', err);
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  inviteMember: async (email: string) => {
    set({ loading: true, error: null });
    try {
      const user = useAuthStore.getState().user;
      const currentTeam = get().currentTeam;
      if (!currentTeam) {
        throw new Error('No current team selected');
      }
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Look up user by email in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (!profileData) {
        throw new Error('No account found with that email. They need to sign up first.');
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', get().currentTeam?.id)
        .eq('user_id', profileData.id)
        .maybeSingle();

      if (existingMember) {
        set({ error: 'This user is already a member of your team.' });
        return;
      }

      // Insert into team_members
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: currentTeam.id,
          user_id: profileData.id,
          role: 'member',
        });

      if (memberError) {
        throw new Error(memberError.message);
      }

      // Send invite email via edge function
      await supabase.functions.invoke('invite-email', {
        body: {
          email,
          teamName: currentTeam.name,
          inviterEmail: user.email,
        },
      });

      // Refresh members list
      await get().fetchMembers();
      console.log('[TeamStore] Member invited:', email);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to invite member';
      set({ error: message });
      console.error('[TeamStore] inviteMember error:', err);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  fetchMembers: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get team_id directly from DB — don't rely on currentTeam state
      const { data: membership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership?.team_id) {
        set({ members: [], loading: false });
        return;
      }

      const { data: memberRows, error } = await supabase
        .from('team_members')
        .select('id, user_id, role, joined_at')
        .eq('team_id', membership.team_id);

      if (error) throw new Error(error.message);

      const userIds = (memberRows ?? []).map(m => m.user_id);
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .in('id', userIds);

      console.log('[TeamStore] team_id used:', membership.team_id);
      console.log('[TeamStore] memberRows:', JSON.stringify(memberRows));
      console.log('[TeamStore] userIds:', userIds);
      console.log('[TeamStore] profileRows:', JSON.stringify(profileRows));

      const enriched = (memberRows ?? []).map(m => ({
        ...m,
        profiles: profileRows?.find(p => p.id === m.user_id) ?? null
      }));

      console.log('[TeamStore] Fetched members:', enriched.length);
      console.log('[TeamStore] Emails:', enriched.map(m => (m.profiles as any)?.email));
      set({ members: enriched });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch members';
      set({ error: message });
      console.error('[TeamStore] fetchMembers error:', err);
    } finally {
      set({ loading: false });
    }
  },
}));
