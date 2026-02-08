import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { VisualizerProfile, ThemeType, VisualizerSettings } from '../types';

// Default settings for new profiles
const DEFAULT_SETTINGS: VisualizerSettings = {
    radius: 100,
    radiusSensitivity: 1,
    displacementSensitivity: 1,
    sizeSensitivity: 1,
    density: 0.5,
    thickness: 2,
    breathingAmount: 5,
    breathingFrequency: 2,
    particleFade: 0,
    noiseScale: 1
};

// Default starter profiles for new users
const getStarterProfiles = (): Omit<VisualizerProfile, 'id'>[] => [
    {
        name: 'Core Pulse',
        type: 'SIMPLE_CIRCLE',
        settings: {
            radius: 20,
            radiusSensitivity: 1.2,
            displacementSensitivity: 0.5,
            sizeSensitivity: 1,
            density: 0,
            thickness: 2,
            breathingAmount: 8,
            breathingFrequency: 1.5,
            particleFade: 0,
            noiseScale: 1
        }
    },
    {
        name: 'Particle Flow',
        type: 'PARTICLE_CIRCLE',
        settings: {
            radius: 95,
            radiusSensitivity: 3.3,
            displacementSensitivity: 2.4,
            sizeSensitivity: 0,
            density: 0.1,
            thickness: 2,
            breathingAmount: 5,
            breathingFrequency: 2.1,
            particleFade: 0,
            noiseScale: 1
        }
    },
    {
        name: 'Circular Radius',
        type: 'CIRCLE_RADIUS',
        settings: {
            radius: 29,
            radiusSensitivity: 0.6,
            displacementSensitivity: 0.5,
            sizeSensitivity: 1,
            density: 0,
            thickness: 1,
            breathingAmount: 0,
            breathingFrequency: 1,
            particleFade: 0,
            noiseScale: 1
        }
    },
    {
        name: 'Orbital Sphere',
        type: 'SPHERICAL_PARTICLE',
        settings: {
            radius: 20,
            radiusSensitivity: 0.8,
            displacementSensitivity: 1.2,
            sizeSensitivity: 1,
            density: 0.6,
            thickness: 1,
            rotationSpeed: 0.2,
            breathingAmount: 5,
            breathingFrequency: 1,
            particleFade: 0,
            noiseScale: 1
        }
    },
    {
        name: 'New Style',
        type: 'SIMPLE_CIRCLE',
        settings: {
            radius: 300,
            radiusSensitivity: 1,
            displacementSensitivity: 1,
            sizeSensitivity: 1,
            density: 0.5,
            thickness: 2,
            breathingAmount: 5,
            breathingFrequency: 2,
            particleFade: 0,
            noiseScale: 1
        }
    }
];

interface UseProfilesReturn {
    profiles: VisualizerProfile[];
    activeProfileId: string;
    activeProfile: VisualizerProfile | null;
    isLoading: boolean;
    isSaving: boolean;

    // Actions
    setActiveProfileId: (id: string) => void;
    updateSetting: (key: keyof VisualizerSettings, value: any) => void;
    renameProfile: (id: string, name: string) => void;
    hasUnsavedChanges: (profileId: string) => boolean;
    reorderProfiles: (fromIndex: number, toIndex: number) => void;

    // Async actions
    addProfile: (type: ThemeType) => Promise<void>;
    duplicateProfile: (id: string) => Promise<void>;
    deleteProfile: (id: string) => Promise<void>;
    saveProfile: (profile: VisualizerProfile) => Promise<{ success: boolean; error?: string }>;
    saveCopy: (profile: VisualizerProfile) => Promise<{ success: boolean; error?: string }>;
    ignoreChanges: (profileId: string) => void;
    importProfile: (profile: VisualizerProfile) => void;
    savedProfileFilenames: Record<string, string>;
}

export function useProfiles(showNotification: (type: 'success' | 'error', message: string) => void): UseProfilesReturn {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<VisualizerProfile[]>([]);
    const [activeProfileId, setActiveProfileId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [originalProfiles, setOriginalProfiles] = useState<Record<string, VisualizerProfile>>({});

    const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || null;

    // Load profiles from Supabase
    useEffect(() => {
        const loadProfiles = async () => {
            if (!supabase || !user) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('visualizer_profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('sort_order', { ascending: true });

                if (error) throw error;

                if (data && data.length > 0) {
                    const loaded: VisualizerProfile[] = data.map((row: any) => ({
                        id: row.id,
                        name: row.name,
                        type: row.type as ThemeType,
                        settings: row.settings as VisualizerSettings,
                    }));
                    setProfiles(loaded);
                    setActiveProfileId(loaded[0].id);

                    // Track originals for unsaved changes detection
                    const originals: Record<string, VisualizerProfile> = {};
                    loaded.forEach(p => {
                        originals[p.id] = JSON.parse(JSON.stringify(p));
                    });
                    setOriginalProfiles(originals);
                } else {
                    // Create starter profiles for new users
                    const starters = getStarterProfiles();
                    const created: VisualizerProfile[] = [];

                    for (let i = 0; i < starters.length; i++) {
                        const starter = starters[i];
                        const { data: inserted, error: insertError } = await supabase
                            .from('visualizer_profiles')
                            .insert({
                                user_id: user.id,
                                name: starter.name,
                                type: starter.type,
                                settings: starter.settings,
                                sort_order: i,
                            })
                            .select()
                            .single();

                        if (!insertError && inserted) {
                            created.push({
                                id: inserted.id,
                                name: inserted.name,
                                type: inserted.type as ThemeType,
                                settings: inserted.settings as VisualizerSettings,
                            });
                        }
                    }

                    if (created.length > 0) {
                        setProfiles(created);
                        setActiveProfileId(created[0].id);
                        const originals: Record<string, VisualizerProfile> = {};
                        created.forEach(p => {
                            originals[p.id] = JSON.parse(JSON.stringify(p));
                        });
                        setOriginalProfiles(originals);
                    }
                }
            } catch (err) {
                console.error('Failed to load profiles:', err);
                showNotification('error', 'Failed to load profiles from server');
            }
            setIsLoading(false);
        };

        loadProfiles();
    }, [user, showNotification]);

    // Check for unsaved changes
    const hasUnsavedChanges = useCallback((profileId: string): boolean => {
        const current = profiles.find(p => p.id === profileId);
        const original = originalProfiles[profileId];
        if (!current || !original) return false;
        return JSON.stringify(current) !== JSON.stringify(original);
    }, [profiles, originalProfiles]);

    // Update a setting (locally, then auto-save)
    const updateSetting = useCallback((key: keyof VisualizerSettings, value: any) => {
        setProfiles(prev => prev.map(p =>
            p.id === activeProfileId ? { ...p, settings: { ...p.settings, [key]: value } } : p
        ));
    }, [activeProfileId]);

    // Rename profile
    const renameProfile = useCallback((id: string, name: string) => {
        setProfiles(prev => prev.map(p => p.id === id ? { ...p, name } : p));
    }, []);

    // Reorder profiles with persistence
    const reorderProfiles = useCallback(async (fromIndex: number, toIndex: number) => {
        if (!supabase || !user) return;

        const newProfiles = [...profiles];
        const [removed] = newProfiles.splice(fromIndex, 1);
        newProfiles.splice(toIndex, 0, removed);
        setProfiles(newProfiles);

        // Update sort_order in Supabase
        try {
            const updates = newProfiles.map((profile, index) => ({
                id: profile.id,
                user_id: user.id,
                name: profile.name,
                type: profile.type,
                settings: profile.settings,
                sort_order: index,
            }));

            await supabase.from('visualizer_profiles').upsert(updates);
        } catch (err) {
            console.error('Failed to save order:', err);
        }
    }, [profiles, user]);

    // Add new profile
    const addProfile = useCallback(async (type: ThemeType) => {
        if (!supabase || !user) return;

        const newProfile = {
            name: `New ${type.replace(/_/g, ' ')}`,
            type,
            settings: { ...DEFAULT_SETTINGS, rotationSpeed: type === 'SPHERICAL_PARTICLE' ? 1 : undefined },
        };

        try {
            const { data, error } = await supabase
                .from('visualizer_profiles')
                .insert({
                    user_id: user.id,
                    name: newProfile.name,
                    type: newProfile.type,
                    settings: newProfile.settings,
                    sort_order: profiles.length,
                })
                .select()
                .single();

            if (error) throw error;

            const created: VisualizerProfile = {
                id: data.id,
                name: data.name,
                type: data.type as ThemeType,
                settings: data.settings as VisualizerSettings,
            };

            setProfiles(prev => [...prev, created]);
            setActiveProfileId(created.id);
            setOriginalProfiles(prev => ({ ...prev, [created.id]: JSON.parse(JSON.stringify(created)) }));
            showNotification('success', 'Created new profile');
        } catch (err) {
            console.error('Failed to create profile:', err);
            showNotification('error', 'Failed to create profile');
        }
    }, [user, profiles.length, showNotification]);

    // Duplicate profile
    const duplicateProfile = useCallback(async (id: string) => {
        if (!supabase || !user) return;

        const profile = profiles.find(p => p.id === id);
        if (!profile) return;

        try {
            const { data, error } = await supabase
                .from('visualizer_profiles')
                .insert({
                    user_id: user.id,
                    name: `${profile.name} (Copy)`,
                    type: profile.type,
                    settings: profile.settings,
                    sort_order: profiles.length,
                })
                .select()
                .single();

            if (error) throw error;

            const duplicated: VisualizerProfile = {
                id: data.id,
                name: data.name,
                type: data.type as ThemeType,
                settings: data.settings as VisualizerSettings,
            };

            setProfiles(prev => [...prev, duplicated]);
            setActiveProfileId(duplicated.id);
            setOriginalProfiles(prev => ({ ...prev, [duplicated.id]: JSON.parse(JSON.stringify(duplicated)) }));
            showNotification('success', 'Duplicated profile');
        } catch (err) {
            console.error('Failed to duplicate profile:', err);
            showNotification('error', 'Failed to duplicate profile');
        }
    }, [profiles, user, showNotification]);

    // Delete profile
    const deleteProfile = useCallback(async (id: string) => {
        if (!supabase || !user) return;
        if (profiles.length === 1) return;

        try {
            const { error } = await supabase
                .from('visualizer_profiles')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            const newProfiles = profiles.filter(p => p.id !== id);
            setProfiles(newProfiles);
            if (activeProfileId === id) {
                setActiveProfileId(newProfiles[0].id);
            }
            setOriginalProfiles(prev => {
                const { [id]: _, ...rest } = prev;
                return rest;
            });
            showNotification('success', 'Profile deleted');
        } catch (err) {
            console.error('Failed to delete profile:', err);
            showNotification('error', 'Failed to delete profile');
        }
    }, [profiles, activeProfileId, user, showNotification]);

    // Save profile
    const saveProfile = useCallback(async (profile: VisualizerProfile) => {
        if (!supabase || !user) return { success: false, error: 'Not connected' };

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('visualizer_profiles')
                .update({
                    name: profile.name,
                    type: profile.type,
                    settings: profile.settings,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', profile.id)
                .eq('user_id', user.id);

            if (error) throw error;

            setOriginalProfiles(prev => ({ ...prev, [profile.id]: JSON.parse(JSON.stringify(profile)) }));
            showNotification('success', 'Saved!');
            setIsSaving(false);
            return { success: true };
        } catch (err: any) {
            console.error('Failed to save profile:', err);
            showNotification('error', 'Failed to save');
            setIsSaving(false);
            return { success: false, error: err.message };
        }
    }, [user, showNotification]);

    // Save as copy
    const saveCopy = useCallback(async (profile: VisualizerProfile) => {
        if (!supabase || !user) return { success: false, error: 'Not connected' };

        setIsSaving(true);
        try {
            const { data, error } = await supabase
                .from('visualizer_profiles')
                .insert({
                    user_id: user.id,
                    name: `${profile.name} (Copy)`,
                    type: profile.type,
                    settings: profile.settings,
                    sort_order: profiles.length,
                })
                .select()
                .single();

            if (error) throw error;

            const newProfile: VisualizerProfile = {
                id: data.id,
                name: data.name,
                type: data.type as ThemeType,
                settings: data.settings as VisualizerSettings,
            };

            setProfiles(prev => [...prev, newProfile]);
            setActiveProfileId(newProfile.id);
            setOriginalProfiles(prev => ({ ...prev, [newProfile.id]: JSON.parse(JSON.stringify(newProfile)) }));
            showNotification('success', `Saved as ${newProfile.name}`);
            setIsSaving(false);
            return { success: true };
        } catch (err: any) {
            console.error('Failed to save copy:', err);
            showNotification('error', 'Failed to save copy');
            setIsSaving(false);
            return { success: false, error: err.message };
        }
    }, [user, profiles.length, showNotification]);

    // Ignore changes (revert)
    const ignoreChanges = useCallback((profileId: string) => {
        const original = originalProfiles[profileId];
        if (original) {
            setProfiles(prev => prev.map(p => p.id === profileId ? { ...original } : p));
            showNotification('success', 'Changes discarded');
        }
    }, [originalProfiles, showNotification]);

    // Import profile
    const importProfile = useCallback(async (profile: VisualizerProfile) => {
        if (!supabase || !user) return;

        try {
            const { data, error } = await supabase
                .from('visualizer_profiles')
                .insert({
                    user_id: user.id,
                    name: `Imported ${profile.name}`,
                    type: profile.type,
                    settings: profile.settings,
                    sort_order: profiles.length,
                })
                .select()
                .single();

            if (error) throw error;

            const imported: VisualizerProfile = {
                id: data.id,
                name: data.name,
                type: data.type as ThemeType,
                settings: data.settings as VisualizerSettings,
            };

            setProfiles(prev => [...prev, imported]);
            setActiveProfileId(imported.id);
            setOriginalProfiles(prev => ({ ...prev, [imported.id]: JSON.parse(JSON.stringify(imported)) }));
            showNotification('success', 'Profile imported');
        } catch (err) {
            console.error('Failed to import profile:', err);
            showNotification('error', 'Failed to import profile');
        }
    }, [user, profiles.length, showNotification]);

    return {
        profiles,
        activeProfileId,
        activeProfile,
        isLoading,
        isSaving,
        savedProfileFilenames: {}, // Not used with Supabase, kept for compatibility
        setActiveProfileId,
        updateSetting,
        renameProfile,
        hasUnsavedChanges,
        reorderProfiles,
        addProfile,
        duplicateProfile,
        deleteProfile,
        saveProfile,
        saveCopy,
        ignoreChanges,
        importProfile,
    };
}
