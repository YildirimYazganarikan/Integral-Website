import { useState, useEffect, useCallback, useRef } from 'react';
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
        name: 'Simple Circle',
        type: 'SIMPLE_CIRCLE',
        settings: {
            radius: 141,
            radiusSensitivity: 0.7,
            displacementSensitivity: 0.6,
            sizeSensitivity: 1,
            density: 0.5,
            thickness: 2,
            breathingAmount: 14,
            breathingFrequency: 1.1,
            particleFade: 0,
            noiseScale: 1,
            speakingIntensity: 0.35,
            speakingRate: 8
        }
    },
    {
        name: 'Particle Circle',
        type: 'PARTICLE_CIRCLE',
        settings: {
            radius: 58,
            radiusSensitivity: 2.3,
            displacementSensitivity: 0,
            sizeSensitivity: 1,
            density: 0.1,
            thickness: 2,
            breathingAmount: 13,
            breathingFrequency: 1.9,
            particleFade: 0.05,
            noiseScale: 1.2,
            speakingRate: 5,
            speakingIntensity: 0.6,
            speakingSizeBoost: 1.5,
            listeningRate: 7,
            listeningIntensity: 1.3
        }
    },
    {
        name: 'Straight Line',
        type: 'STRAIGHT_LINE',
        settings: {
            radius: 100,
            radiusSensitivity: 1,
            displacementSensitivity: 0.5,
            sizeSensitivity: 1,
            density: 0.65,
            thickness: 8,
            breathingAmount: 5,
            breathingFrequency: 2,
            particleFade: 0,
            noiseScale: 1,
            listeningRate: 7,
            listeningIntensity: 0.9,
            speakingRate: 10
        }
    },
    {
        name: 'Circle Radius',
        type: 'CIRCLE_RADIUS',
        settings: {
            radius: 27,
            radiusSensitivity: 0.5,
            displacementSensitivity: 1.9,
            sizeSensitivity: 1,
            density: 0.5,
            thickness: 1,
            breathingAmount: 14,
            breathingFrequency: 1.9,
            particleFade: 0,
            noiseScale: 1,
            speakingIntensity: 0.1,
            speakingRate: 4
        }
    },
    {
        name: 'Spherical Particle',
        type: 'SPHERICAL_PARTICLE',
        settings: {
            radius: 170,
            radiusSensitivity: 0.7,
            displacementSensitivity: 0.7,
            sizeSensitivity: 0.4,
            density: 0.61,
            thickness: 2,
            breathingAmount: 15,
            breathingFrequency: 0.6,
            particleFade: 0.5,
            noiseScale: 2,
            rotationSpeed: 0.1,
            baseSize: 2.2,
            opacity: 0.45,
            squidSpeed: 2.4,
            squidAmplitude: 2.2,
            squidOpacityVar: 0.45,
            listeningTriggerSens: 0.001,
            listeningIntensity: 0.3,
            speakingRate: 4.5,
            speakingIntensity: 0.3,
            enableOuterSphere: 1,
            outerSphereRadius: 280,
            searchingSpeed: 0.3,
            searchingJitter: 11,
            outerSphereDensity: 0.5,
            outerSphereSpeed: 1.5
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
    setAsDefault: (profile: VisualizerProfile) => Promise<{ success: boolean; error?: string }>;
}

export function useProfiles(showNotification: (type: 'success' | 'error', message: string) => void): UseProfilesReturn {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<VisualizerProfile[]>([]);
    const [activeProfileId, setActiveProfileId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [originalProfiles, setOriginalProfiles] = useState<Record<string, VisualizerProfile>>({});

    // Prevent double-execution in React strict mode
    const initializingRef = useRef(false);

    const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || null;

    // Load profiles from Supabase
    useEffect(() => {
        const loadProfiles = async () => {
            if (!supabase || !user) {
                setIsLoading(false);
                return;
            }

            // Prevent double-execution in React strict mode
            if (initializingRef.current) {
                return;
            }
            initializingRef.current = true;

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
                        is_default: row.is_default
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
                        try {
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

                            if (insertError) {
                                console.warn(`Failed to create profile "${starter.name}":`, insertError.message);
                                continue;
                            }

                            if (inserted) {
                                created.push({
                                    id: inserted.id,
                                    name: inserted.name,
                                    type: inserted.type as ThemeType,
                                    settings: inserted.settings as VisualizerSettings,
                                    is_default: inserted.is_default
                                });
                            }
                        } catch (err: any) {
                            console.warn(`Error creating profile "${starter.name}":`, err.message);
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

        // Reset ref when user changes (for cleanup/re-mount)
        return () => {
            initializingRef.current = false;
        };
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
                is_default: data.is_default
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
                is_default: false // Copy is never default initially
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
                is_default: false
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

    // Set as default
    const setAsDefault = useCallback(async (profile: VisualizerProfile) => {
        if (!supabase || !user) return { success: false, error: 'Not connected' };

        try {
            // First, unset default for all other profiles
            await supabase
                .from('visualizer_profiles')
                .update({ is_default: false })
                .eq('user_id', user.id);

            // Then set default for this profile
            const { error } = await supabase
                .from('visualizer_profiles')
                .update({ is_default: true })
                .eq('id', profile.id)
                .eq('user_id', user.id);

            if (error) throw error;

            setProfiles(prev => prev.map(p => ({
                ...p,
                is_default: p.id === profile.id
            })));

            showNotification('success', 'Set as default');
            return { success: true };
        } catch (err: any) {
            console.error('Failed to set default:', err);
            return { success: false, error: err.message };
        }
    }, [user, showNotification]);

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
                is_default: false
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
        setAsDefault,
    };
}
