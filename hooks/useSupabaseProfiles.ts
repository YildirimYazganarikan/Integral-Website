import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured, getDeviceId, DbProfile } from '../lib/supabase';
import { VisualizerProfile, ThemeType } from '../types';

interface UseSupabaseProfilesReturn {
    isConfigured: boolean;
    isLoading: boolean;
    error: string | null;
    saveProfile: (profile: VisualizerProfile) => Promise<string | null>;
    saveProfileAs: (profile: VisualizerProfile, newName: string) => Promise<string | null>;
    loadProfiles: () => Promise<VisualizerProfile[]>;
    deleteProfile: (id: string) => Promise<boolean>;
    setDefaultTemplate: (profileType: ThemeType, profileId: string) => Promise<boolean>;
    getDefaultTemplate: (profileType: ThemeType) => Promise<string | null>;
    reloadProfile: (id: string) => Promise<VisualizerProfile | null>;
}

export const useSupabaseProfiles = (): UseSupabaseProfilesReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isConfigured = isSupabaseConfigured();

    const deviceId = getDeviceId();

    // Convert DB profile to app profile
    const toAppProfile = (dbProfile: DbProfile): VisualizerProfile => ({
        id: dbProfile.id,
        name: dbProfile.name,
        type: dbProfile.type as ThemeType,
        settings: dbProfile.settings as VisualizerProfile['settings'],
    });

    // Save or update a profile
    const saveProfile = useCallback(async (profile: VisualizerProfile): Promise<string | null> => {
        if (!isConfigured) {
            setError('Supabase not configured');
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: upsertError } = await supabase
                .from('profiles')
                .upsert({
                    id: profile.id,
                    device_id: deviceId,
                    name: profile.name,
                    type: profile.type,
                    settings: profile.settings,
                    updated_at: new Date().toISOString(),
                })
                .select('id')
                .single();

            if (upsertError) throw upsertError;
            return data?.id || null;
        } catch (err: any) {
            setError(err.message || 'Failed to save profile');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [deviceId, isConfigured]);

    // Save as new profile with different name
    const saveProfileAs = useCallback(async (profile: VisualizerProfile, newName: string): Promise<string | null> => {
        if (!isConfigured) {
            setError('Supabase not configured');
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const newId = crypto.randomUUID();
            const { data, error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: newId,
                    device_id: deviceId,
                    name: newName,
                    type: profile.type,
                    settings: profile.settings,
                })
                .select('id')
                .single();

            if (insertError) throw insertError;
            return data?.id || newId;
        } catch (err: any) {
            setError(err.message || 'Failed to save profile');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [deviceId, isConfigured]);

    // Load all profiles for this device
    const loadProfiles = useCallback(async (): Promise<VisualizerProfile[]> => {
        if (!isConfigured) {
            return [];
        }

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: loadError } = await supabase
                .from('profiles')
                .select('*')
                .eq('device_id', deviceId)
                .order('created_at', { ascending: true });

            if (loadError) throw loadError;
            return (data || []).map(toAppProfile);
        } catch (err: any) {
            setError(err.message || 'Failed to load profiles');
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [deviceId, isConfigured]);

    // Delete a profile
    const deleteProfile = useCallback(async (id: string): Promise<boolean> => {
        if (!isConfigured) {
            setError('Supabase not configured');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { error: deleteError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id)
                .eq('device_id', deviceId);

            if (deleteError) throw deleteError;
            return true;
        } catch (err: any) {
            setError(err.message || 'Failed to delete profile');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [deviceId, isConfigured]);

    // Set default template for a profile type
    const setDefaultTemplate = useCallback(async (profileType: ThemeType, profileId: string): Promise<boolean> => {
        if (!isConfigured) {
            setError('Supabase not configured');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { error: upsertError } = await supabase
                .from('default_templates')
                .upsert({
                    device_id: deviceId,
                    profile_type: profileType,
                    profile_id: profileId,
                }, {
                    onConflict: 'device_id,profile_type',
                });

            if (upsertError) throw upsertError;
            return true;
        } catch (err: any) {
            setError(err.message || 'Failed to set default template');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [deviceId, isConfigured]);

    // Get default template for a profile type
    const getDefaultTemplate = useCallback(async (profileType: ThemeType): Promise<string | null> => {
        if (!isConfigured) {
            return null;
        }

        try {
            const { data, error: fetchError } = await supabase
                .from('default_templates')
                .select('profile_id')
                .eq('device_id', deviceId)
                .eq('profile_type', profileType)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError; // PGRST116 = no rows
            return data?.profile_id || null;
        } catch (err: any) {
            return null;
        }
    }, [deviceId, isConfigured]);

    // Reload a single profile from the database
    const reloadProfile = useCallback(async (id: string): Promise<VisualizerProfile | null> => {
        if (!isConfigured) {
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .eq('device_id', deviceId)
                .single();

            if (fetchError) throw fetchError;
            return data ? toAppProfile(data) : null;
        } catch (err: any) {
            setError(err.message || 'Failed to reload profile');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [deviceId, isConfigured]);

    return {
        isConfigured,
        isLoading,
        error,
        saveProfile,
        saveProfileAs,
        loadProfiles,
        deleteProfile,
        setDefaultTemplate,
        getDefaultTemplate,
        reloadProfile,
    };
};
