import { useState, useEffect, useCallback } from 'react';
import { VisualizerProfile, ThemeType, VisualizerSettings } from '../types';
import {
    saveProfile as saveProfileToServer,
    loadAllProfiles,
    deleteProfile as deleteProfileFromDisk,
    getDefaultTemplate,
    saveProfileOrder,
    loadProfileOrder
} from '../lib/fileServer';

// Minimal fallback settings for new profiles when no default template exists
const FALLBACK_SETTINGS: VisualizerSettings = {
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

interface UseProfilesReturn {
    profiles: VisualizerProfile[];
    activeProfileId: string;
    activeProfile: VisualizerProfile | null;
    isLoading: boolean;
    isSaving: boolean;
    savedProfileFilenames: Record<string, string>;

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
}

export function useProfiles(showNotification: (type: 'success' | 'error', message: string) => void): UseProfilesReturn {
    const [profiles, setProfiles] = useState<VisualizerProfile[]>([]);
    const [activeProfileId, setActiveProfileId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [savedProfileFilenames, setSavedProfileFilenames] = useState<Record<string, string>>({});
    const [originalProfiles, setOriginalProfiles] = useState<Record<string, VisualizerProfile>>({});

    const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || null;

    // Load profiles on mount
    useEffect(() => {
        const loadProfiles = async () => {
            setIsLoading(true);
            try {
                const loaded = await loadAllProfiles();
                // Filter out default templates
                const userProfiles = loaded.filter(p => !(p as any)._isDefault);
                if (userProfiles.length > 0) {
                    const profilesWithIds = userProfiles.map((p, i) => ({
                        ...p,
                        id: p.id || `loaded_${i}_${Date.now()}`
                    }));

                    // Apply saved order
                    const savedOrder = await loadProfileOrder();
                    let orderedProfiles = profilesWithIds;
                    if (savedOrder.length > 0) {
                        const orderMap = new Map(savedOrder.map((id, idx) => [id, idx]));
                        orderedProfiles = [...profilesWithIds].sort((a, b) => {
                            const aIdx = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
                            const bIdx = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
                            return aIdx - bIdx;
                        });
                    }

                    setProfiles(orderedProfiles);
                    setActiveProfileId(orderedProfiles[0].id);

                    // Track filenames and originals
                    const filenames: Record<string, string> = {};
                    const originals: Record<string, VisualizerProfile> = {};
                    profilesWithIds.forEach(p => {
                        if ((p as any)._filename) {
                            filenames[p.id] = (p as any)._filename;
                        }
                        originals[p.id] = JSON.parse(JSON.stringify(p));
                    });
                    setSavedProfileFilenames(filenames);
                    setOriginalProfiles(originals);
                }
            } catch (err) {
                console.error('Failed to load profiles:', err);
            }
            setIsLoading(false);
        };
        loadProfiles();
    }, []);

    // Check for unsaved changes
    const hasUnsavedChanges = useCallback((profileId: string): boolean => {
        const current = profiles.find(p => p.id === profileId);
        const original = originalProfiles[profileId];
        if (!current || !original) return false;
        return JSON.stringify(current) !== JSON.stringify(original);
    }, [profiles, originalProfiles]);

    // Update a setting
    const updateSetting = useCallback((key: keyof VisualizerSettings, value: any) => {
        setProfiles(prev => prev.map(p =>
            p.id === activeProfileId ? { ...p, settings: { ...p.settings, [key]: value } } : p
        ));
    }, [activeProfileId]);

    // Rename profile
    const renameProfile = useCallback((id: string, name: string) => {
        setProfiles(prev => prev.map(p => p.id === id ? { ...p, name } : p));
    }, []);

    // Reorder profiles (drag and drop) with persistence
    const reorderProfiles = useCallback((fromIndex: number, toIndex: number) => {
        setProfiles(prev => {
            const newProfiles = [...prev];
            const [removed] = newProfiles.splice(fromIndex, 1);
            newProfiles.splice(toIndex, 0, removed);

            // Save order to disk
            saveProfileOrder(newProfiles.map(p => p.id));

            return newProfiles;
        });
    }, []);

    // Add new profile
    const addProfile = useCallback(async (type: ThemeType) => {
        const defaultTemplate = await getDefaultTemplate(type);
        const newProfile: VisualizerProfile = {
            id: Date.now().toString(),
            name: defaultTemplate?.name || `New ${type.replace(/_/g, ' ')}`,
            type,
            settings: defaultTemplate?.settings || {
                ...FALLBACK_SETTINGS,
                rotationSpeed: type === 'SPHERICAL_PARTICLE' ? 1 : undefined
            }
        };
        setProfiles(prev => [...prev, newProfile]);
        setActiveProfileId(newProfile.id);

        const result = await saveProfileToServer(newProfile);
        if (result.success && result.filename) {
            setSavedProfileFilenames(prev => ({ ...prev, [newProfile.id]: result.filename! }));
            setOriginalProfiles(prev => ({ ...prev, [newProfile.id]: JSON.parse(JSON.stringify(newProfile)) }));
            showNotification('success', 'Created new profile');
        }
    }, [showNotification]);

    // Duplicate profile
    const duplicateProfile = useCallback(async (id: string) => {
        const profile = profiles.find(p => p.id === id);
        if (!profile) return;

        const newProfile = {
            ...profile,
            id: Date.now().toString(),
            name: `${profile.name} (Copy)`
        };
        setProfiles(prev => [...prev, newProfile]);
        setActiveProfileId(newProfile.id);

        const result = await saveProfileToServer(newProfile);
        if (result.success && result.filename) {
            setSavedProfileFilenames(prev => ({ ...prev, [newProfile.id]: result.filename! }));
            setOriginalProfiles(prev => ({ ...prev, [newProfile.id]: JSON.parse(JSON.stringify(newProfile)) }));
            showNotification('success', 'Duplicated profile');
        }
    }, [profiles, showNotification]);

    // Delete profile
    const deleteProfile = useCallback(async (id: string) => {
        if (profiles.length === 1) return;

        const filename = savedProfileFilenames[id];
        if (filename) {
            await deleteProfileFromDisk(filename);
        }

        const newProfiles = profiles.filter(p => p.id !== id);
        setProfiles(newProfiles);
        if (activeProfileId === id) {
            setActiveProfileId(newProfiles[0].id);
        }

        setSavedProfileFilenames(prev => {
            const { [id]: _, ...rest } = prev;
            return rest;
        });
        setOriginalProfiles(prev => {
            const { [id]: _, ...rest } = prev;
            return rest;
        });
    }, [profiles, activeProfileId, savedProfileFilenames]);

    // Save profile
    const saveProfile = useCallback(async (profile: VisualizerProfile) => {
        setIsSaving(true);
        try {
            const oldFilename = savedProfileFilenames[profile.id];
            const original = originalProfiles[profile.id];
            if (oldFilename && original && original.name !== profile.name) {
                await deleteProfileFromDisk(oldFilename);
            }

            const result = await saveProfileToServer(profile);
            if (result.success && result.filename) {
                setSavedProfileFilenames(prev => ({ ...prev, [profile.id]: result.filename! }));
                setOriginalProfiles(prev => ({ ...prev, [profile.id]: JSON.parse(JSON.stringify(profile)) }));
                showNotification('success', 'Saved!');
                setIsSaving(false);
                return { success: true };
            } else {
                showNotification('error', result.error || 'Save failed');
                setIsSaving(false);
                return { success: false, error: result.error };
            }
        } catch (err) {
            showNotification('error', 'Save failed');
            setIsSaving(false);
            return { success: false, error: 'Save failed' };
        }
    }, [savedProfileFilenames, originalProfiles, showNotification]);

    // Save as copy
    const saveCopy = useCallback(async (profile: VisualizerProfile) => {
        const copyName = `${profile.name} (Copy)`;
        const newProfile: VisualizerProfile = {
            ...profile,
            id: Date.now().toString(),
            name: copyName
        };
        setIsSaving(true);
        try {
            const result = await saveProfileToServer(newProfile);
            if (result.success && result.filename) {
                setProfiles(prev => [...prev, newProfile]);
                setSavedProfileFilenames(prev => ({ ...prev, [newProfile.id]: result.filename! }));
                setOriginalProfiles(prev => ({ ...prev, [newProfile.id]: JSON.parse(JSON.stringify(newProfile)) }));
                setActiveProfileId(newProfile.id);
                showNotification('success', `Saved as ${copyName}`);
                setIsSaving(false);
                return { success: true };
            } else {
                showNotification('error', result.error || 'Save failed');
                setIsSaving(false);
                return { success: false, error: result.error };
            }
        } catch (err) {
            showNotification('error', 'Save failed');
            setIsSaving(false);
            return { success: false, error: 'Save failed' };
        }
    }, [showNotification]);

    // Ignore changes (revert)
    const ignoreChanges = useCallback((profileId: string) => {
        const original = originalProfiles[profileId];
        if (original) {
            setProfiles(prev => prev.map(p => p.id === profileId ? { ...original } : p));
            showNotification('success', 'Changes discarded');
        }
    }, [originalProfiles, showNotification]);

    // Import profile
    const importProfile = useCallback((profile: VisualizerProfile) => {
        const newProfile = {
            ...profile,
            id: Date.now().toString(),
            name: `Imported ${profile.name}`
        };
        setProfiles(prev => [...prev, newProfile]);
        setActiveProfileId(newProfile.id);
    }, []);

    return {
        profiles,
        activeProfileId,
        activeProfile,
        isLoading,
        isSaving,
        savedProfileFilenames,
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
        importProfile
    };
}
