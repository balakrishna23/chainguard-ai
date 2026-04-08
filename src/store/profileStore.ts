import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  banner_url: string | null;
  created_at?: string;
}

interface ProfileStore {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, 'full_name' | 'bio'>>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  uploadBanner: (file: File) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  fetchProfile: async () => {
    set({ loading: true, error: null });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ loading: false }); return; }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) set({ error: error.message });
    else set({ profile: data });
    set({ loading: false });
  },

  updateProfile: async (updates) => {
    set({ error: null });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (error) { set({ error: error.message }); return; }
    await get().fetchProfile();
  },

  uploadAvatar: async (file: File) => {
    set({ error: null });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error('[Profile] Upload error:', uploadError);
      set({ error: uploadError.message });
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);

    console.log('[Profile] Public URL:', publicUrl);

    // Save URL to profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('[Profile] Update error:', updateError);
      set({ error: updateError.message });
      return;
    }

    // Update local state immediately
    set({ profile: { ...get().profile!, avatar_url: publicUrl } });
    console.log('[Profile] Avatar updated successfully');
  },
uploadBanner: async (file: File) => {
  set({ error: null });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const ext = file.name.split('.').pop();
  const path = `${user.id}/banner.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (uploadError) {
    console.error('[Profile] Banner upload error:', uploadError);
    set({ error: uploadError.message });
    return;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);

  console.log('[Profile] Banner public URL:', publicUrl);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ banner_url: publicUrl })
    .eq('id', user.id);

  if (updateError) {
    console.error('[Profile] Banner update error:', updateError);
    set({ error: updateError.message });
    return;
  }

  set({ profile: { ...get().profile!, banner_url: publicUrl } });
  console.log('[Profile] Banner updated successfully');
},

  
  changePassword: async (newPassword: string) => {
    set({ error: null });
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) set({ error: error.message });
  },
}));
