import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { VisualizerProfile, ThemeType, VisualizerSettings } from '../types';

interface UseSupabaseProfilesReturn {
    profiles: VisualizerProfile[];
    loading: boolean;
    error: string | null;
    saveProfile: (profile: VisualizerProfile) => Promise<void>;
    deleteProfile: (id: string) => Promise<void>;
    updateProfileOrder: (profiles: VisualizerProfile[]) => Promise<void>;
    setDefaultProfile: (id: string) => Promise<void>;
    refreshProfiles: () => Promise<void>;
    migrateLocalProfiles: (localProfiles: VisualizerProfile[]) => Promise<void>;
}

export function useSupabaseProfiles(): UseSupabaseProfilesReturn {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<VisualizerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch profiles from Supabase
    const fetchProfiles = useCallback(async () => {
        if (!supabase || !user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('visualizer_profiles')
                .select('*')
                .eq('user_id', user.id)
                .order('sort_order', { ascending: true });

            if (error) throw error;

            // Transform from DB format to app format
            const transformed: VisualizerProfile[] = (data || []).map((row: any) => ({
                id: row.id,
                name: row.name,
                type: row.type as ThemeType,
                settings: row.settings as VisualizerSettings,
            }));

            setProfiles(transformed);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching profiles:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    // Save or update a profile
    const saveProfile = async (profile: VisualizerProfile) => {
        if (!supabase || !user) return;

        try {
            const { error } = await supabase
                .from('visualizer_profiles')
                .upsert({
                    id: profile.id,
                    user_id: user.id,
                    name: profile.name,
                    type: profile.type,
                    settings: profile.settings,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            // Update local state
            setProfiles(prev => {
                const exists = prev.find(p => p.id === profile.id);
                if (exists) {
                    return prev.map(p => p.id === profile.id ? profile : p);
                }
                return [...prev, profile];
            });
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    // Delete a profile
    const deleteProfile = async (id: string) => {
        if (!supabase || !user) return;

        try {
            const { error } = await supabase
                .from('visualizer_profiles')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            setProfiles(prev => prev.filter(p => p.id !== id));
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    // Update profile order
    const updateProfileOrder = async (orderedProfiles: VisualizerProfile[]) => {
        if (!supabase || !user) return;

        try {
            const updates = orderedProfiles.map((profile, index) => ({
                id: profile.id,
                user_id: user.id,
                name: profile.name,
                type: profile.type,
                settings: profile.settings,
                sort_order: index,
            }));

            const { error } = await supabase
                .from('visualizer_profiles')
                .upsert(updates);

            if (error) throw error;

            setProfiles(orderedProfiles);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    // Set a profile as default
    const setDefaultProfile = async (id: string) => {
        if (!supabase || !user) return;

        try {
            // First, unset all defaults
            await supabase
                .from('visualizer_profiles')
                .update({ is_default: false })
                .eq('user_id', user.id);

            // Set the new default
            const { error } = await supabase
                .from('visualizer_profiles')
                .update({ is_default: true })
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    // Migrate local profiles to Supabase
    const migrateLocalProfiles = async (localProfiles: VisualizerProfile[]) => {
        if (!supabase || !user || localProfiles.length === 0) return;

        try {
            const inserts = localProfiles.map((profile, index) => ({
                id: profile.id,
                user_id: user.id,
                name: profile.name,
                type: profile.type,
                settings: profile.settings,
                sort_order: index,
            }));

            const { error } = await supabase
                .from('visualizer_profiles')
                .upsert(inserts, { onConflict: 'id' });

            if (error) throw error;

            await fetchProfiles();
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    return {
        profiles,
        loading,
        error,
        saveProfile,
        deleteProfile,
        updateProfileOrder,
        setDefaultProfile,
        refreshProfiles: fetchProfiles,
        migrateLocalProfiles,
    };
}
