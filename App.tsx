import React, { useState, useEffect, useRef } from 'react';
import { useLiveAgent } from './hooks/useLiveAgent';
import { saveProfile, saveProfileAsNew, setAsDefaultTemplate, loadProfile, openSavedFolder, getDefaultTemplate, loadAllProfiles, deleteProfile as deleteProfileFromDisk, generateProfileHtml } from './lib/fileServer';
import { NoraVisualizer } from './components/NoraVisualizer';
import { AgentMode, VisualizerProfile, ThemeType } from './types';
import { Mic, MicOff, Settings, Plus, Trash2, Edit2, X, Sun, Moon, Circle, Activity, Aperture, Disc, Globe, Download, Upload, Save, Copy, Key, Check, AlertCircle, FolderOpen, RotateCcw, Loader2 } from 'lucide-react';

const DEFAULT_API_KEY = 'AIzaSyCz3XxWf-iWU0VzuawBiBZTiTQ40QGW7pA';

// Minimal fallback settings for new profiles when no default template exists
const FALLBACK_SETTINGS = {
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

const App: React.FC = () => {
    // API Key State with localStorage persistence
    const [apiKey, setApiKey] = useState<string>(() => {
        const stored = localStorage.getItem('gemini_api_key');
        return stored || DEFAULT_API_KEY;
    });
    const [showApiKey, setShowApiKey] = useState(false);

    const { state, connect, disconnect, getVolumeLevels } = useLiveAgent(apiKey);

    // Save API key to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('gemini_api_key', apiKey);
    }, [apiKey]);

    // App State
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [profiles, setProfiles] = useState<VisualizerProfile[]>([]);
    const [activeProfileId, setActiveProfileId] = useState<string>('');
    const [showSettings, setShowSettings] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Customization State
    const [previewMode, setPreviewMode] = useState<AgentMode | null>(null);
    const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
    const [saveAsName, setSaveAsName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [savedProfileFilenames, setSavedProfileFilenames] = useState<Record<string, string>>({});
    // Track original profiles to detect unsaved changes
    const [originalProfiles, setOriginalProfiles] = useState<Record<string, VisualizerProfile>>({});

    // Show notification helper
    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || null;

    useEffect(() => {
        // Apply theme to body
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            document.body.style.backgroundColor = '#000000';
        } else {
            document.documentElement.classList.remove('dark');
            document.body.style.backgroundColor = '#ffffff';
        }
    }, [isDarkMode]);

    // Load profiles from disk on mount
    useEffect(() => {
        const loadProfiles = async () => {
            setIsLoading(true);
            try {
                const loaded = await loadAllProfiles();
                // Filter out default templates - they shouldn't appear in the profiles list
                const userProfiles = loaded.filter(p => !(p as any)._isDefault);
                if (userProfiles.length > 0) {
                    // Ensure each profile has an id
                    const profilesWithIds = userProfiles.map((p, i) => ({
                        ...p,
                        id: p.id || `loaded_${i}_${Date.now()}`
                    }));
                    setProfiles(profilesWithIds);
                    setActiveProfileId(profilesWithIds[0].id);
                    // Track filenames and original states
                    const filenames: Record<string, string> = {};
                    const originals: Record<string, VisualizerProfile> = {};
                    profilesWithIds.forEach(p => {
                        if ((p as any)._filename) {
                            filenames[p.id] = (p as any)._filename;
                        }
                        // Store deep copy of original
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

    // Check if a profile has unsaved changes
    const hasUnsavedChanges = (profileId: string): boolean => {
        const current = profiles.find(p => p.id === profileId);
        const original = originalProfiles[profileId];
        if (!current || !original) return false;
        return JSON.stringify(current) !== JSON.stringify(original);
    };

    // Save profile (override existing)
    const handleSaveProfile = async (profile: VisualizerProfile) => {
        setIsSaving(true);
        try {
            // Check if name changed - if so, delete old file first
            const oldFilename = savedProfileFilenames[profile.id];
            const original = originalProfiles[profile.id];
            if (oldFilename && original && original.name !== profile.name) {
                // Name changed, delete old file
                await deleteProfileFromDisk(oldFilename);
            }

            const result = await saveProfile(profile);
            if (result.success && result.filename) {
                setSavedProfileFilenames(prev => ({ ...prev, [profile.id]: result.filename! }));
                // Update original to match current (no more unsaved changes)
                setOriginalProfiles(prev => ({ ...prev, [profile.id]: JSON.parse(JSON.stringify(profile)) }));
                showNotification('success', 'Saved!');
            } else {
                showNotification('error', result.error || 'Save failed');
            }
        } catch (err) {
            showNotification('error', 'Save failed');
        }
        setIsSaving(false);
    };

    // Ignore changes (revert to original)
    const handleIgnoreChanges = (profileId: string) => {
        const original = originalProfiles[profileId];
        if (original) {
            setProfiles(profiles.map(p => p.id === profileId ? { ...original } : p));
            showNotification('success', 'Changes discarded');
        }
    };

    // Save as copy
    const handleSaveCopy = async (profile: VisualizerProfile) => {
        const copyName = `${profile.name} (Copy)`;
        const newProfile: VisualizerProfile = {
            ...profile,
            id: Date.now().toString(),
            name: copyName
        };
        setIsSaving(true);
        try {
            const result = await saveProfile(newProfile);
            if (result.success && result.filename) {
                setProfiles([...profiles, newProfile]);
                setSavedProfileFilenames(prev => ({ ...prev, [newProfile.id]: result.filename! }));
                setOriginalProfiles(prev => ({ ...prev, [newProfile.id]: JSON.parse(JSON.stringify(newProfile)) }));
                setActiveProfileId(newProfile.id);
                showNotification('success', `Saved as ${copyName}`);
            } else {
                showNotification('error', result.error || 'Save failed');
            }
        } catch (err) {
            showNotification('error', 'Save failed');
        }
        setIsSaving(false);
    };

    const handleToggleMic = () => {
        if (state.isConnected) disconnect();
        else connect();
    };

    const handleAddProfile = async (type: ThemeType) => {
        // Try to load default template for this type
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
        setProfiles([...profiles, newProfile]);
        setActiveProfileId(newProfile.id);
        // Save new profile immediately and track as original
        const result = await saveProfile(newProfile);
        if (result.success && result.filename) {
            setSavedProfileFilenames(prev => ({ ...prev, [newProfile.id]: result.filename! }));
            setOriginalProfiles(prev => ({ ...prev, [newProfile.id]: JSON.parse(JSON.stringify(newProfile)) }));
            showNotification('success', 'Created new profile');
        }
    };

    const handleDuplicate = async (id: string) => {
        const profile = profiles.find(p => p.id === id);
        if (!profile) return;
        const newProfile = {
            ...profile,
            id: Date.now().toString(),
            name: `${profile.name} (Copy)`
        };
        setProfiles([...profiles, newProfile]);
        setActiveProfileId(newProfile.id);
        // Save new profile immediately and track as original
        const result = await saveProfile(newProfile);
        if (result.success && result.filename) {
            setSavedProfileFilenames(prev => ({ ...prev, [newProfile.id]: result.filename! }));
            setOriginalProfiles(prev => ({ ...prev, [newProfile.id]: JSON.parse(JSON.stringify(newProfile)) }));
            showNotification('success', 'Duplicated profile');
        }
    };

    const updateSetting = (key: keyof typeof activeProfile.settings, value: any) => {
        setProfiles(profiles.map(p =>
            p.id === activeProfileId ? { ...p, settings: { ...p.settings, [key]: value } } : p
        ));
        // Changes are tracked automatically by comparing to originalProfiles
    };

    const handleDeleteProfile = async (id: string) => {
        if (profiles.length === 1) return;

        // Delete from disk if saved
        const filename = savedProfileFilenames[id];
        if (filename) {
            await deleteProfileFromDisk(filename);
        }

        const newProfiles = profiles.filter(p => p.id !== id);
        setProfiles(newProfiles);
        if (activeProfileId === id) setActiveProfileId(newProfiles[0].id);

        // Clean up tracking
        setSavedProfileFilenames(prev => {
            const { [id]: _, ...rest } = prev;
            return rest;
        });
        setOriginalProfiles(prev => {
            const { [id]: _, ...rest } = prev;
            return rest;
        });
    };

    const renameProfile = (id: string, name: string) => {
        setProfiles(profiles.map(p => p.id === id ? { ...p, name } : p));
        setEditingProfileId(null);
        // Changes are tracked automatically by comparing to originalProfiles
    };

    // Export as HTML File (for manual download)
    const handleExport = (profileToExport: VisualizerProfile) => {
        const htmlContent = generateProfileHtml(profileToExport, isDarkMode);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const filename = `${profileToExport.name.replace(/\s+/g, '_')}.html`;

        // Download as file
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('success', `Downloaded ${filename}`);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            try {
                const match = text.match(/<script id="nora-profile-data" type="application\/json">([\s\S]*?)<\/script>/);
                let jsonString = match ? match[1] : text;

                const profile = JSON.parse(jsonString);
                if (profile && profile.type && profile.settings) {
                    const newProfile = { ...profile, id: Date.now().toString(), name: `Imported ${profile.name}` };
                    setProfiles([...profiles, newProfile]);
                    setActiveProfileId(newProfile.id);
                } else {
                    alert("Invalid profile file.");
                }
            } catch (err) {
                alert("Could not parse profile.");
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset
    };

    const effectiveMode = previewMode || state.mode;

    const getThemeIcon = (type: ThemeType) => {
        switch (type) {
            case 'PARTICLE_CIRCLE': return <Aperture size={16} />;
            case 'STRAIGHT_LINE': return <Activity size={16} />;
            case 'SIMPLE_CIRCLE': return <Circle size={16} />;
            case 'CIRCLE_RADIUS': return <Disc size={16} />;
            case 'SPHERICAL_PARTICLE': return <Globe size={16} />;
        }
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className={`h-[100dvh] w-full flex items-center justify-center font-mono ${isDarkMode ? 'text-white bg-black' : 'text-black bg-white'}`}>
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin" size={32} />
                    <span className="text-sm opacity-70">Loading profiles...</span>
                </div>
            </div>
        );
    }

    // Show empty state - prompt to create first profile
    if (!activeProfile) {
        return (
            <div className={`h-[100dvh] w-full flex items-center justify-center font-mono ${isDarkMode ? 'text-white bg-black' : 'text-black bg-white'}`}>
                <div className="flex flex-col items-center gap-6 text-center p-8">
                    <h1 className="text-2xl font-bold tracking-widest">AI INTERFACE STUDIO</h1>
                    <p className="opacity-70">No profiles found. Create your first visualizer:</p>
                    <div className="flex gap-4">
                        {(['PARTICLE_CIRCLE', 'STRAIGHT_LINE', 'SIMPLE_CIRCLE', 'CIRCLE_RADIUS', 'SPHERICAL_PARTICLE'] as ThemeType[]).map(t => (
                            <button
                                key={t}
                                onClick={() => handleAddProfile(t)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all hover:scale-105 ${isDarkMode ? 'border-white/30 hover:bg-white/10' : 'border-black/30 hover:bg-black/5'}`}
                            >
                                {getThemeIcon(t)}
                                <span className="text-xs">{t.replace(/_/g, ' ')}</span>
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="mt-4 opacity-50 hover:opacity-100"
                    >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </div>
        );
    }

    const showRadius = activeProfile.type !== 'STRAIGHT_LINE';
    const showRadiusSensitivity = activeProfile.type !== 'STRAIGHT_LINE';
    const showDisplacementSensitivity = true;
    const showSizeSensitivity = ['PARTICLE_CIRCLE', 'SPHERICAL_PARTICLE'].includes(activeProfile.type);
    const showDensity = ['PARTICLE_CIRCLE', 'STRAIGHT_LINE', 'SPHERICAL_PARTICLE'].includes(activeProfile.type);
    const showThickness = ['STRAIGHT_LINE', 'SIMPLE_CIRCLE', 'CIRCLE_RADIUS'].includes(activeProfile.type);
    const showBreathing = ['PARTICLE_CIRCLE', 'SIMPLE_CIRCLE', 'CIRCLE_RADIUS', 'SPHERICAL_PARTICLE'].includes(activeProfile.type);
    const showRotation = activeProfile.type === 'SPHERICAL_PARTICLE';
    const showParticleFade = ['PARTICLE_CIRCLE', 'SPHERICAL_PARTICLE'].includes(activeProfile.type);

    return (
        <div className={`h-[100dvh] w-full flex flex-col md:block overflow-hidden transition-colors duration-500 font-mono ${isDarkMode ? 'text-white bg-black' : 'text-black bg-white'}`}>

            {/* --- Visualizer Area --- */}
            <div className={`
        relative w-full transition-all duration-300
        ${showSettings
                    ? 'h-[40vh] md:h-full md:absolute md:inset-0'
                    : 'h-full md:absolute md:inset-0'
                }
      `}>
                <NoraVisualizer
                    mode={effectiveMode}
                    getVolumeLevels={getVolumeLevels}
                    profile={activeProfile}
                    isDarkMode={isDarkMode}
                />

                {/* --- Minimal Controls (Moved inside visualizer container) --- */}
                <div className="absolute bottom-4 left-0 w-full flex justify-center items-center gap-6 z-10">
                    {/* Settings */}
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-3 rounded-full border transition-all hover:scale-105 backdrop-blur-sm ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/5'}`}
                    >
                        <Settings size={18} />
                    </button>

                    {/* Mic Toggle */}
                    <button
                        onClick={handleToggleMic}
                        className={`
                w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 backdrop-blur-sm
                ${state.isConnected
                                ? 'bg-transparent border-current animate-pulse'
                                : `bg-transparent ${isDarkMode ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'}`
                            }
            `}
                    >
                        {state.isConnected ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`p-3 rounded-full border transition-all hover:scale-105 backdrop-blur-sm ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/5'}`}
                    >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>

                {/* Error Message */}
                {state.error && (
                    <div className="absolute top-8 w-full text-center pointer-events-none">
                        <p className="inline-block text-red-500 text-xs bg-red-100 dark:bg-red-900 px-2 py-1 rounded">{state.error}</p>
                    </div>
                )}

            </div>

            {/* --- Settings Drawer --- */}
            {showSettings && (
                <div className={`
            w-full h-[60vh] md:h-full md:w-96 
            md:absolute md:top-0 md:left-0 
            overflow-y-auto 
            p-8 shadow-2xl z-20 
            flex flex-col gap-8 
            backdrop-blur-md border-t md:border-t-0 md:border-r 
            ${isDarkMode ? 'bg-black/90 border-white/10' : 'bg-white/90 border-black/10'}
        `}>

                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold tracking-widest uppercase">Configuration</h2>
                        <button onClick={() => setShowSettings(false)}><X size={24} /></button>
                    </div>



                    {/* Import/Export */}
                    <div className="flex gap-2">
                        <button onClick={() => handleExport(activeProfile)} className={`flex-1 py-2 flex items-center justify-center gap-2 text-xs uppercase border rounded ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'}`}>
                            <Upload size={14} /> Export HTML
                        </button>
                        <button onClick={handleImportClick} className={`flex-1 py-2 flex items-center justify-center gap-2 text-xs uppercase border rounded ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'}`}>
                            <Download size={14} /> Import
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".html,.json" onChange={handleFileChange} />
                    </div>

                    {/* Local Storage */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-end border-b pb-2 border-current opacity-50">
                            <span className="text-xs font-bold uppercase tracking-wider">Local Storage</span>
                            <button
                                onClick={() => openSavedFolder()}
                                className="text-xs opacity-50 hover:opacity-100 flex items-center gap-1"
                                title="Open saved profiles folder"
                            >
                                <FolderOpen size={12} /> Open Folder
                            </button>
                        </div>

                        {/* Always show Set Default button */}
                        <button
                            onClick={async () => {
                                setIsSaving(true);
                                const result = await setAsDefaultTemplate(activeProfile);
                                setIsSaving(false);
                                if (result.success) {
                                    showNotification('success', `Set as default for ${activeProfile.type.replace(/_/g, ' ')}`);
                                } else {
                                    showNotification('error', result.error || 'Failed to set default');
                                }
                            }}
                            disabled={isSaving}
                            className={`w-full py-2 flex items-center justify-center gap-2 text-xs uppercase border rounded transition-all ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'}`}
                        >
                            <Check size={14} />
                            Set Default
                        </button>

                        {/* Save/Ignore/Save Copy buttons - always visible, disabled when no changes */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-current/20">
                            <button
                                onClick={() => handleSaveProfile(activeProfile)}
                                disabled={isSaving || !hasUnsavedChanges(activeProfile.id)}
                                className={`py-2 flex items-center justify-center gap-1 text-xs uppercase border rounded transition-all ${hasUnsavedChanges(activeProfile.id)
                                    ? (isDarkMode ? 'border-white/40 hover:bg-white/10' : 'border-black/40 hover:bg-black/10')
                                    : 'opacity-40 cursor-not-allowed border-current/20'
                                    }`}
                            >
                                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                Save
                            </button>
                            <button
                                onClick={() => handleIgnoreChanges(activeProfile.id)}
                                disabled={isSaving || !hasUnsavedChanges(activeProfile.id)}
                                className={`py-2 flex items-center justify-center gap-1 text-xs uppercase border rounded transition-all ${hasUnsavedChanges(activeProfile.id)
                                    ? (isDarkMode ? 'border-white/40 hover:bg-white/10' : 'border-black/40 hover:bg-black/10')
                                    : 'opacity-40 cursor-not-allowed border-current/20'
                                    }`}
                            >
                                <RotateCcw size={12} />
                                Ignore
                            </button>
                            <button
                                onClick={() => handleSaveCopy(activeProfile)}
                                disabled={isSaving}
                                className={`py-2 flex items-center justify-center gap-1 text-xs uppercase border rounded transition-all ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'}`}
                            >
                                <Copy size={12} />
                                Copy
                            </button>
                        </div>
                    </div>

                    {/* Profile Manager */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end border-b pb-2 border-current opacity-50">
                            <span className="text-xs font-bold uppercase tracking-wider">Profiles</span>
                        </div>

                        {/* Add New */}
                        <div className="grid grid-cols-5 gap-2 mb-4">
                            {(['PARTICLE_CIRCLE', 'STRAIGHT_LINE', 'SIMPLE_CIRCLE', 'CIRCLE_RADIUS', 'SPHERICAL_PARTICLE'] as ThemeType[]).map(t => (
                                <button key={t} onClick={() => handleAddProfile(t)} className={`flex items-center justify-center p-2 rounded border ${isDarkMode ? 'border-white/20 hover:bg-white/20' : 'border-black/20 hover:bg-black/5'}`} title={`Add ${t}`}>
                                    {getThemeIcon(t)}
                                    <Plus size={10} className="ml-1" />
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
                            {profiles.map(p => (
                                <div key={p.id} className={`group flex items-center justify-between p-3 rounded border cursor-pointer transition-all ${activeProfileId === p.id ? (isDarkMode ? 'border-white bg-white/10' : 'border-black bg-black/5') : 'border-transparent hover:opacity-70'}`}
                                    onClick={() => setActiveProfileId(p.id)}
                                >
                                    {editingProfileId === p.id ? (
                                        <input
                                            autoFocus
                                            className="bg-transparent border-b border-current outline-none w-full text-sm font-mono"
                                            defaultValue={p.name}
                                            onBlur={(e) => renameProfile(p.id, e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && renameProfile(p.id, (e.target as HTMLInputElement).value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                {getThemeIcon(p.type)}
                                                {hasUnsavedChanges(p.id) && (
                                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                                                )}
                                            </div>
                                            <span className="text-sm font-medium truncate max-w-[100px]">{p.name}</span>
                                        </div>
                                    )}

                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                                        <button onClick={(e) => { e.stopPropagation(); handleDuplicate(p.id); }} className="hover:scale-110" title="Duplicate"><Copy size={14} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); setEditingProfileId(p.id); }} className="hover:scale-110"><Edit2 size={14} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteProfile(p.id); }} className="hover:text-red-500"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Parameters */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-end border-b pb-2 border-current opacity-50">
                            <span className="text-xs font-bold uppercase tracking-wider">Parameters</span>
                        </div>

                        <div className="space-y-4">
                            {showRadius && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono opacity-70"><span>BASE RADIUS</span> <span>{activeProfile.settings.radius}</span></div>
                                    <input
                                        type="range" min="20" max="300"
                                        value={activeProfile.settings.radius}
                                        onChange={(e) => updateSetting('radius', Number(e.target.value))}
                                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                    />
                                </div>
                            )}

                            {showBreathing && (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-mono opacity-70"><span>BREATHING AMOUNT</span> <span>{activeProfile.settings.breathingAmount || 0}</span></div>
                                        <input
                                            type="range" min="0" max="20" step="1"
                                            value={activeProfile.settings.breathingAmount || 0}
                                            onChange={(e) => updateSetting('breathingAmount', Number(e.target.value))}
                                            className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-mono opacity-70"><span>BREATHING FREQ</span> <span>{activeProfile.settings.breathingFrequency || 1}</span></div>
                                        <input
                                            type="range" min="0.1" max="5.0" step="0.1"
                                            value={activeProfile.settings.breathingFrequency || 1}
                                            onChange={(e) => updateSetting('breathingFrequency', Number(e.target.value))}
                                            className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                        />
                                    </div>
                                </>
                            )}

                            {showRotation && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono opacity-70"><span>ROTATION SPEED</span> <span>{activeProfile.settings.rotationSpeed || 1}</span></div>
                                    <input
                                        type="range" min="0.0" max="5.0" step="0.1"
                                        value={activeProfile.settings.rotationSpeed !== undefined ? activeProfile.settings.rotationSpeed : 1.0}
                                        onChange={(e) => updateSetting('rotationSpeed', Number(e.target.value))}
                                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                    />
                                </div>
                            )}

                            {showRadiusSensitivity && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono opacity-70"><span>RADIUS SENSITIVITY</span> <span>{activeProfile.settings.radiusSensitivity.toFixed(1)}</span></div>
                                    <input
                                        type="range" min="0.0" max="5.0" step="0.1"
                                        value={activeProfile.settings.radiusSensitivity}
                                        onChange={(e) => updateSetting('radiusSensitivity', Number(e.target.value))}
                                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                    />
                                </div>
                            )}

                            {showDisplacementSensitivity && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono opacity-70"><span>DISPLACEMENT SENSITIVITY</span> <span>{activeProfile.settings.displacementSensitivity.toFixed(1)}</span></div>
                                    <input
                                        type="range" min="0.0" max="5.0" step="0.1"
                                        value={activeProfile.settings.displacementSensitivity}
                                        onChange={(e) => updateSetting('displacementSensitivity', Number(e.target.value))}
                                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                    />
                                </div>
                            )}

                            {showSizeSensitivity && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono opacity-70"><span>SIZE SENSITIVITY</span> <span>{(activeProfile.settings.sizeSensitivity || 1).toFixed(1)}</span></div>
                                    <input
                                        type="range" min="0.0" max="3.0" step="0.1"
                                        value={activeProfile.settings.sizeSensitivity || 1}
                                        onChange={(e) => updateSetting('sizeSensitivity', Number(e.target.value))}
                                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                    />
                                </div>
                            )}

                            {showParticleFade && (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-mono opacity-70"><span>PARTICLE FADE</span> <span>{((activeProfile.settings.particleFade || 0) * 100).toFixed(0)}%</span></div>
                                        <input
                                            type="range" min="0.0" max="1.0" step="0.05"
                                            value={activeProfile.settings.particleFade || 0}
                                            onChange={(e) => updateSetting('particleFade', Number(e.target.value))}
                                            className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-mono opacity-70"><span>NOISE SCALE</span> <span>{(activeProfile.settings.noiseScale || 1).toFixed(1)}</span></div>
                                        <input
                                            type="range" min="0.0" max="3.0" step="0.1"
                                            value={activeProfile.settings.noiseScale || 1}
                                            onChange={(e) => updateSetting('noiseScale', Number(e.target.value))}
                                            className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                        />
                                    </div>
                                </>
                            )}

                            {showDensity && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono opacity-70"><span>DENSITY / DETAIL</span> <span>{(activeProfile.settings.density * 100).toFixed(0)}%</span></div>
                                    <input
                                        type="range" min="0.1" max="1.0" step="0.1"
                                        value={activeProfile.settings.density}
                                        onChange={(e) => updateSetting('density', Number(e.target.value))}
                                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                    />
                                </div>
                            )}

                            {showThickness && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono opacity-70"><span>THICKNESS</span> <span>{activeProfile.settings.thickness}px</span></div>
                                    <input
                                        type="range" min="1" max="20"
                                        value={activeProfile.settings.thickness}
                                        onChange={(e) => updateSetting('thickness', Number(e.target.value))}
                                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mode Simulation */}
                    <div className="space-y-4 pb-8">
                        <div className="flex justify-between items-end border-b pb-2 border-current opacity-50">
                            <span className="text-xs font-bold uppercase tracking-wider">Simulation</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setPreviewMode(null)} className={`px-3 py-2 rounded text-xs border uppercase tracking-wider ${!previewMode ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white') : 'opacity-50'}`}>Auto</button>
                            <button onClick={() => setPreviewMode(AgentMode.LISTENING)} className={`px-3 py-2 rounded text-xs border uppercase tracking-wider ${previewMode === AgentMode.LISTENING ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white') : 'opacity-50'}`}>Listening</button>
                            <button onClick={() => setPreviewMode(AgentMode.SPEAKING)} className={`px-3 py-2 rounded text-xs border uppercase tracking-wider ${previewMode === AgentMode.SPEAKING ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white') : 'opacity-50'}`}>Speaking</button>
                            <button onClick={() => setPreviewMode(AgentMode.SEARCHING)} className={`px-3 py-2 rounded text-xs border uppercase tracking-wider ${previewMode === AgentMode.SEARCHING ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white') : 'opacity-50'}`}>Searching</button>
                        </div>
                    </div>

                    {/* API Settings */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end border-b pb-2 border-current opacity-50">
                            <span className="text-xs font-bold uppercase tracking-wider">API Settings</span>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-mono opacity-70">
                                <Key size={14} />
                                <span>GEMINI API KEY</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your Gemini API key"
                                    className={`w-full px-3 py-2 pr-16 rounded border text-sm font-mono ${isDarkMode ? 'bg-black/50 border-white/20 text-white placeholder-white/30' : 'bg-white/50 border-black/20 text-black placeholder-black/30'}`}
                                />
                                <button
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs uppercase px-2 py-1 rounded ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                                >
                                    {showApiKey ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            <p className={`text-xs opacity-50 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                Your API key is stored locally in your browser.
                            </p>
                        </div>
                    </div>

                </div>
            )}

            {/* Save As Dialog */}
            {showSaveAsDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className={`p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                        <h3 className="text-lg font-bold mb-4">Save Profile As</h3>
                        <input
                            type="text"
                            value={saveAsName}
                            onChange={(e) => setSaveAsName(e.target.value)}
                            placeholder="Profile name"
                            className={`w-full p-2 rounded border mb-4 ${isDarkMode ? 'bg-black border-white/20' : 'bg-white border-black/20'}`}
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowSaveAsDialog(false)}
                                className={`px-4 py-2 rounded ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    setIsSaving(true);
                                    const result = await saveProfileAsNew(activeProfile, saveAsName);
                                    setIsSaving(false);
                                    if (result.success) {
                                        const newProfile = { ...activeProfile, id: Date.now().toString(), name: saveAsName };
                                        setProfiles([...profiles, newProfile]);
                                        setActiveProfileId(newProfile.id);
                                        setSavedProfileFilenames(prev => ({ ...prev, [newProfile.id]: result.filename! }));
                                        showNotification('success', 'Profile saved!');
                                    } else {
                                        showNotification('error', result.error || 'Failed to save');
                                    }
                                    setShowSaveAsDialog(false);
                                }}
                                disabled={!saveAsName.trim() || isSaving}
                                className={`px-4 py-2 rounded ${isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {notification.message}
                </div>
            )}

        </div>
    );
};

export default App;

