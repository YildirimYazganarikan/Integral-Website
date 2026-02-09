import { useState, useEffect, useCallback, useRef } from 'react';
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
const getStarterProfiles = (): VisualizerProfile[] => [
    {
        id: 'starter-1',
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
        },
        is_default: false
    },
    {
        id: 'starter-2',
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
        },
        is_default: false
    },
    {
        id: 'starter-3',
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
        },
        is_default: false
    },
    {
        id: 'starter-4',
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
        },
        is_default: false
    },
    {
        id: 'starter-5',
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
        },
        is_default: true
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

const STORAGE_KEY = 'integral_labs_visualizer_profiles';

export function useProfiles(showNotification: (type: 'success' | 'error', message: string) => void): UseProfilesReturn {
    const [profiles, setProfiles] = useState<VisualizerProfile[]>([]);
    const [activeProfileId, setActiveProfileId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [originalProfiles, setOriginalProfiles] = useState<Record<string, VisualizerProfile>>({});

    // Prevent double-execution in React strict mode
    const initializingRef = useRef(false);

    const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || null;

    // Helper to save to local storage
    const saveToLocalStorage = useCallback((newProfiles: VisualizerProfile[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfiles));
        } catch (e) {
            console.error('Failed to save profiles to local storage', e);
        }
    }, []);

    // Load profiles from LocalStorage
    useEffect(() => {
        const loadProfiles = () => {
            // Prevent double-execution in React strict mode
            if (initializingRef.current) {
                return;
            }
            initializingRef.current = true;

            setIsLoading(true);
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                let loadedProfiles: VisualizerProfile[] = [];

                if (stored) {
                    try {
                        loadedProfiles = JSON.parse(stored);
                    } catch (e) {
                        console.error('Failed to parse profiles', e);
                    }
                }

                if (loadedProfiles.length === 0) {
                    loadedProfiles = getStarterProfiles();
                    saveToLocalStorage(loadedProfiles);
                }

                setProfiles(loadedProfiles);

                // Set active profile (prefer default)
                const defaultProfile = loadedProfiles.find(p => p.is_default);
                setActiveProfileId(defaultProfile ? defaultProfile.id : loadedProfiles[0].id);

                // Track originals for unsaved changes detection
                const originals: Record<string, VisualizerProfile> = {};
                loadedProfiles.forEach(p => {
                    originals[p.id] = JSON.parse(JSON.stringify(p));
                });
                setOriginalProfiles(originals);

            } catch (err) {
                console.error('Failed to load profiles:', err);
                showNotification('error', 'Failed to load profiles');
            }
            setIsLoading(false);
        };

        loadProfiles();

        return () => {
            initializingRef.current = false;
        };
    }, [saveToLocalStorage, showNotification]);

    // Check for unsaved changes
    const hasUnsavedChanges = useCallback((profileId: string): boolean => {
        const current = profiles.find(p => p.id === profileId);
        const original = originalProfiles[profileId];
        if (!current || !original) return false;
        return JSON.stringify(current) !== JSON.stringify(original);
    }, [profiles, originalProfiles]);

    // Update a setting (locally, no auto-save to disk yet)
    const updateSetting = useCallback((key: keyof VisualizerSettings, value: any) => {
        setProfiles(prev => prev.map(p =>
            p.id === activeProfileId ? { ...p, settings: { ...p.settings, [key]: value } } : p
        ));
    }, [activeProfileId]);

    // Rename profile
    const renameProfile = useCallback((id: string, name: string) => {
        setProfiles(prev => {
            const next = prev.map(p => p.id === id ? { ...p, name } : p);
            saveToLocalStorage(next);
            return next;
        });
    }, [saveToLocalStorage]);

    // Reorder profiles with persistence
    const reorderProfiles = useCallback((fromIndex: number, toIndex: number) => {
        const newProfiles = [...profiles];
        const [removed] = newProfiles.splice(fromIndex, 1);
        newProfiles.splice(toIndex, 0, removed);

        // Update sort_order (simulated by array index)
        setProfiles(newProfiles);
        saveToLocalStorage(newProfiles);
    }, [profiles, saveToLocalStorage]);

    // Add new profile
    const addProfile = useCallback(async (type: ThemeType) => {
        const newId = `profile-${Date.now()}`;
        const newProfile: VisualizerProfile = {
            id: newId,
            name: `New ${type.replace(/_/g, ' ')}`,
            type,
            settings: { ...DEFAULT_SETTINGS, rotationSpeed: type === 'SPHERICAL_PARTICLE' ? 1 : undefined },
            is_default: false
        };

        setProfiles(prev => {
            const next = [...prev, newProfile];
            saveToLocalStorage(next);
            return next;
        });

        setActiveProfileId(newId);
        setOriginalProfiles(prev => ({ ...prev, [newId]: JSON.parse(JSON.stringify(newProfile)) }));
        showNotification('success', 'Created new profile');
    }, [saveToLocalStorage, showNotification]);

    // Duplicate profile
    const duplicateProfile = useCallback(async (id: string) => {
        const profile = profiles.find(p => p.id === id);
        if (!profile) return;

        const newId = `profile-${Date.now()}`;
        const duplicated: VisualizerProfile = {
            ...JSON.parse(JSON.stringify(profile)),
            id: newId,
            name: `${profile.name} (Copy)`,
            is_default: false
        };

        setProfiles(prev => {
            const next = [...prev, duplicated];
            saveToLocalStorage(next);
            return next;
        });

        setActiveProfileId(newId);
        setOriginalProfiles(prev => ({ ...prev, [newId]: JSON.parse(JSON.stringify(duplicated)) }));
        showNotification('success', 'Duplicated profile');
    }, [profiles, saveToLocalStorage, showNotification]);

    // Delete profile
    const deleteProfile = useCallback(async (id: string) => {
        if (profiles.length <= 1) return;

        setProfiles(prev => {
            const next = prev.filter(p => p.id !== id);
            saveToLocalStorage(next);

            if (activeProfileId === id) {
                setActiveProfileId(next[0].id);
            }
            return next;
        });

        setOriginalProfiles(prev => {
            const { [id]: _, ...rest } = prev;
            return rest;
        });
        showNotification('success', 'Profile deleted');
    }, [profiles, activeProfileId, saveToLocalStorage, showNotification]);

    // Save profile (commits changes to storage)
    const saveProfile = useCallback(async (profile: VisualizerProfile) => {
        setIsSaving(true);
        try {
            // Update the profile in the list and save entire list
            setProfiles(prev => {
                const next = prev.map(p => p.id === profile.id ? profile : p);
                saveToLocalStorage(next);
                return next;
            });

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
    }, [saveToLocalStorage, showNotification]);

    // Save as copy
    const saveCopy = useCallback(async (profile: VisualizerProfile) => {
        setIsSaving(true);
        try {
            const newId = `profile-${Date.now()}`;
            const newProfile: VisualizerProfile = {
                ...JSON.parse(JSON.stringify(profile)),
                id: newId,
                name: `${profile.name} (Copy)`,
                is_default: false
            };

            setProfiles(prev => {
                const next = [...prev, newProfile];
                saveToLocalStorage(next);
                return next;
            });

            setActiveProfileId(newId);
            setOriginalProfiles(prev => ({ ...prev, [newId]: JSON.parse(JSON.stringify(newProfile)) }));
            showNotification('success', `Saved as ${newProfile.name}`);
            setIsSaving(false);
            return { success: true };
        } catch (err: any) {
            console.error('Failed to save copy:', err);
            showNotification('error', 'Failed to save copy');
            setIsSaving(false);
            return { success: false, error: err.message };
        }
    }, [saveToLocalStorage, showNotification]);

    // Set as default
    const setAsDefault = useCallback(async (profile: VisualizerProfile) => {
        try {
            setProfiles(prev => {
                const next = prev.map(p => ({
                    ...p,
                    is_default: p.id === profile.id
                }));
                saveToLocalStorage(next);
                return next;
            });

            showNotification('success', 'Set as default');
            return { success: true };
        } catch (err: any) {
            console.error('Failed to set default:', err);
            return { success: false, error: err.message };
        }
    }, [saveToLocalStorage, showNotification]);

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
        try {
            const newId = `profile-${Date.now()}`;
            const imported: VisualizerProfile = {
                ...profile,
                id: newId,
                name: `Imported ${profile.name}`,
                is_default: false
            };

            setProfiles(prev => {
                const next = [...prev, imported];
                saveToLocalStorage(next);
                return next;
            });

            setActiveProfileId(newId);
            setOriginalProfiles(prev => ({ ...prev, [newId]: JSON.parse(JSON.stringify(imported)) }));
            showNotification('success', 'Profile imported');
        } catch (err) {
            console.error('Failed to import profile:', err);
            showNotification('error', 'Failed to import profile');
        }
    }, [saveToLocalStorage, showNotification]);

    return {
        profiles,
        activeProfileId,
        activeProfile,
        isLoading,
        isSaving,
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
