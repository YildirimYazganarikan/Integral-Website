import React, { useState, useEffect, useRef } from 'react';
import { useLiveAgent } from './hooks/useLiveAgent';
import { useNotification } from './hooks/useNotification';
import { useApiKey } from './hooks/useApiKey';
import { useProfiles } from './hooks/useProfiles';
import { useAuth } from './contexts/AuthContext';
import { generateProfileHtml, openSavedFolder } from './lib/fileServer';
import { NoraVisualizer } from './components/NoraVisualizer';
import { ControlBar } from './components/ControlBar';
import { ProfileManager } from './components/ProfileManager';
import { ParameterControls } from './components/ParameterControls';
import { ModeSimulator } from './components/ModeSimulator';
import { ApiKeySettings } from './components/ApiKeySettings';
import { LocalStorageSection } from './components/LocalStorageSection';
import { ImportExportButtons } from './components/ImportExportButtons';
import { Notification } from './components/ui/Notification';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AboutPage } from './components/AboutPage';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import EmailCollectionPage from './components/EmailCollectionPage';
import { AgentMode, ThemeType } from './types';
import { Loader2, X, Circle, Activity, Aperture, Disc, Globe, Sun, Moon, LogOut, User, Trash2, MoreVertical } from 'lucide-react';

const App: React.FC = () => {
    // Custom hooks
    const { apiKey, setApiKey, showApiKey, setShowApiKey } = useApiKey();
    const { notification, showNotification } = useNotification();
    const { state, connect, disconnect, getVolumeLevels } = useLiveAgent(apiKey);
    const {
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
        setAsDefault
    } = useProfiles(showNotification);

    // Auth state
    const { user, loading: authLoading, signOut, deleteAccount, isConfigured: isSupabaseConfigured } = useAuth();
    const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Local UI state
    const [showWelcome, setShowWelcome] = useState(true);
    const [showAbout, setShowAbout] = useState(false);
    const [showEmailCollection, setShowEmailCollection] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [previewMode, setPreviewMode] = useState<AgentMode | null>(null);
    const [previewCountdown, setPreviewCountdown] = useState<number>(0);
    const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    // Redirect to Welcome when user logs out or is deleted
    useEffect(() => {
        if (!user && !authLoading) {
            setShowWelcome(true);
            if (state.isConnected) {
                disconnect();
            }
        }
    }, [user, authLoading]);

    // 5-second countdown for preview mode
    useEffect(() => {
        if (previewMode !== null) {
            setPreviewCountdown(5);

            // Clear any existing interval
            if (countdownRef.current) clearInterval(countdownRef.current);

            countdownRef.current = setInterval(() => {
                setPreviewCountdown(prev => {
                    if (prev <= 1) {
                        setPreviewMode(null);
                        if (countdownRef.current) clearInterval(countdownRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => {
                if (countdownRef.current) clearInterval(countdownRef.current);
            };
        }
    }, [previewMode]);

    // Apply theme
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            document.body.style.backgroundColor = '#000000';
        } else {
            document.documentElement.classList.remove('dark');
            document.body.style.backgroundColor = '#ffffff';
        }
    }, [isDarkMode]);

    // Handlers
    const handleToggleMic = () => {
        if (state.isConnected) disconnect();
        else connect();
    };

    const handleExport = () => {
        if (!activeProfile) return;
        const htmlContent = generateProfileHtml(activeProfile, isDarkMode);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const filename = `${activeProfile.name.replace(/\s+/g, '_')}.html`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('success', `Downloaded ${filename}`);
    };

    const handleImportClick = () => fileInputRef.current?.click();

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
                    importProfile(profile);
                } else {
                    alert("Invalid profile file.");
                }
            } catch (err) {
                alert("Could not parse profile.");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleSetDefault = async () => {
        if (!activeProfile) return;
        const result = await setAsDefault(activeProfile);
        if (result.success) {
            showNotification('success', `Set as default for ${activeProfile.type.replace(/_/g, ' ')}`);
        } else {
            showNotification('error', result.error || 'Failed to set default');
        }
    };

    const handleRename = (id: string, name: string) => {
        renameProfile(id, name);
        setEditingProfileId(null);
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

    // Auth loading
    if (authLoading) {
        return (
            <div className={`h-[100dvh] w-full flex items-center justify-center font-mono ${isDarkMode ? 'text-white bg-black' : 'text-black bg-white'}`}>
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    // Welcome screen - PRECEDENCE OVER AUTH
    // This allows the welcome screen to be shown even if not logged in (e.g. after logout)
    if (showWelcome) {
        return <WelcomeScreen
            onEnterStudio={() => {
                setShowWelcome(false);
                setShowEmailCollection(true);
            }}
            onAbout={() => { setShowWelcome(false); setShowAbout(true); }}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />;
    }

    // Email collection page - Gated entry
    if (showEmailCollection) {
        return <EmailCollectionPage
            isDarkMode={isDarkMode}
            onBack={() => {
                setShowEmailCollection(false);
                setShowWelcome(true);
            }}
            onComplete={() => {
                setShowEmailCollection(false);
                // Proceed to enter studio
                const particleProfile = profiles.find(p => p.type === 'SPHERICAL_PARTICLE');
                if (particleProfile) {
                    setActiveProfileId(particleProfile.id);
                }
            }}
        />;
    }


    if (showAbout) {
        return <AboutPage
            onBack={() => { setShowAbout(false); setShowWelcome(true); }}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            onTryNora={() => {
                setShowAbout(false);
                setShowEmailCollection(true);
            }}
        />;
    }

    // Auth pages (Supabase required, no skip option)
    if (isSupabaseConfigured && !user) {
        if (authPage === 'signup') {
            return (
                <SignupPage
                    isDarkMode={isDarkMode}
                    onSwitchToLogin={() => setAuthPage('login')}
                />
            );
        }
        return (
            <LoginPage
                isDarkMode={isDarkMode}
                onSwitchToSignup={() => setAuthPage('signup')}
            />
        );
    }

    // Loading state
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

    // Empty state (Should not happen due to useProfiles auto-creation, but strictly handled)
    if (!activeProfile) {
        return (
            <div className={`h-[100dvh] w-full flex items-center justify-center font-mono ${isDarkMode ? 'text-white bg-black' : 'text-black bg-white'}`}>
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin" size={32} />
                    <span className="text-sm opacity-70">Initializing default profile...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`h-[100dvh] w-full flex flex-col md:block overflow-hidden transition-colors duration-500 font-mono ${isDarkMode ? 'text-white bg-black' : 'text-black bg-white'}`}>

            {/* Visualizer Area */}
            <div className={`relative w-full transition-all duration-300 ${showSettings ? 'h-[40vh] md:h-full md:absolute md:inset-0' : 'h-full md:absolute md:inset-0'}`}>
                <NoraVisualizer
                    mode={effectiveMode}
                    getVolumeLevels={getVolumeLevels}
                    profile={activeProfile}
                    isDarkMode={isDarkMode}
                />

                <ControlBar
                    isConnected={state.isConnected}
                    isDarkMode={isDarkMode}
                    onToggleMic={handleToggleMic}
                    onToggleSettings={() => setShowSettings(!showSettings)}
                    onToggleTheme={() => setIsDarkMode(!isDarkMode)}
                />

                {state.error && (
                    <div className="absolute top-8 w-full text-center pointer-events-none">
                        <p className="inline-block text-red-500 text-xs bg-red-100 dark:bg-red-900 px-2 py-1 rounded">{state.error}</p>
                    </div>
                )}

                {/* Minimal Mode Buttons */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {(['LISTENING', 'SPEAKING', 'SEARCHING'] as const).map((mode) => {
                        const isActive = previewMode === AgentMode[mode];
                        const isCurrentAIMode = previewMode === null && effectiveMode === AgentMode[mode];
                        const showCountdown = isActive && previewCountdown > 0;

                        return (
                            <div key={mode} className="flex flex-col items-center group relative">
                                <button
                                    onClick={() => setPreviewMode(previewMode === AgentMode[mode] ? null : AgentMode[mode])}
                                    className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded transition-all ${isActive || isCurrentAIMode
                                        ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white')
                                        : (isDarkMode ? 'bg-white/10 text-white/50 hover:bg-white/20' : 'bg-black/10 text-black/50 hover:bg-black/20')
                                        }`}
                                >
                                    {mode.charAt(0)}
                                </button>
                                {/* Countdown timer */}
                                {showCountdown && (
                                    <span className={`text-[8px] font-mono mt-0.5 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                                        {previewCountdown}s
                                    </span>
                                )}
                                {/* Tooltip on hover */}
                                <div className={`absolute top-full mt-1 px-2 py-1 text-[9px] font-mono rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                                    }`}>
                                    {mode.toLowerCase()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Settings Drawer */}
            {showSettings && (
                <div className={`w-full h-[60vh] md:h-full md:w-96 md:absolute md:top-0 md:left-0 overflow-y-auto p-8 shadow-2xl z-20 flex flex-col gap-8 backdrop-blur-md border-t md:border-t-0 md:border-r ${isDarkMode ? 'bg-black/90 border-white/10' : 'bg-white/90 border-black/10'}`}>

                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold tracking-widest uppercase">Configuration</h2>
                        <button onClick={() => setShowSettings(false)}><X size={24} /></button>
                    </div>

                    {/* User Account Section */}
                    {user && (
                        <div className={`flex items-center justify-between p-3 rounded-lg border ${isDarkMode ? 'border-white/20 bg-white/5' : 'border-black/20 bg-black/5'}`}>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <User size={16} className="opacity-60 flex-shrink-0" />
                                <span className="text-sm truncate">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => signOut()}
                                    className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                                >
                                    <LogOut size={14} />
                                    Logout
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className={`p-1.5 rounded transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                    {showUserMenu && (
                                        <div className={`absolute right-0 top-full mt-1 py-1 rounded-lg shadow-xl border z-50 min-w-[160px] ${isDarkMode ? 'bg-black border-white/20' : 'bg-white border-black/20'}`}>
                                            <button
                                                onClick={async () => {
                                                    setShowUserMenu(false);
                                                    if (confirm('Are you sure you want to delete your account? This will permanently delete all your data and cannot be undone.')) {
                                                        const { error } = await deleteAccount();
                                                        if (error) {
                                                            showNotification(`Failed to delete account: ${error}`, 'error');
                                                        } else {
                                                            showNotification('Account deleted successfully', 'success');
                                                        }
                                                    }
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                                Delete Account
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <ImportExportButtons
                        isDarkMode={isDarkMode}
                        onExport={handleExport}
                        onImportClick={handleImportClick}
                    />
                    <input type="file" ref={fileInputRef} className="hidden" accept=".html,.json" onChange={handleFileChange} />

                    {/* LocalStorageSection removed as it relies on local file server */}

                    {/* Save Controls */}
                    <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                        <h3 className="text-xs font-bold uppercase tracking-wider mb-3 opacity-50">Save Changes</h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => saveProfile(activeProfile)}
                                disabled={!hasUnsavedChanges(activeProfile.id) || isSaving}
                                className={`px-3 py-1.5 text-xs rounded border transition-all ${hasUnsavedChanges(activeProfile.id)
                                    ? (isDarkMode ? 'bg-white text-black border-white hover:bg-white/90' : 'bg-black text-white border-black hover:bg-black/90')
                                    : 'opacity-50 cursor-not-allowed border-transparent'
                                    }`}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => saveCopy(activeProfile)}
                                disabled={isSaving}
                                className={`px-3 py-1.5 text-xs rounded border transition-colors ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'
                                    }`}
                            >
                                Save as Copy
                            </button>
                            <button
                                onClick={handleSetDefault}
                                disabled={isSaving}
                                className={`px-3 py-1.5 text-xs rounded border transition-colors ${activeProfile.is_default
                                    ? (isDarkMode ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-green-500/10 border-green-500/50 text-green-600')
                                    : (isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10')
                                    }`}
                            >
                                {activeProfile.is_default ? 'Default Profile' : 'Set as Default'}
                            </button>
                            {hasUnsavedChanges(activeProfile.id) && (
                                <button
                                    onClick={() => ignoreChanges(activeProfile.id)}
                                    className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 transition-colors ml-auto"
                                >
                                    Revert
                                </button>
                            )}
                        </div>
                    </div>

                    <ProfileManager
                        profiles={profiles}
                        activeProfileId={activeProfileId}
                        editingProfileId={editingProfileId}
                        isDarkMode={isDarkMode}
                        hasUnsavedChanges={hasUnsavedChanges}
                        onSelectProfile={setActiveProfileId}
                        onAddProfile={addProfile}
                        onDuplicateProfile={duplicateProfile}
                        onDeleteProfile={deleteProfile}
                        onStartEditing={setEditingProfileId}
                        onRenameProfile={handleRename}
                        onReorderProfiles={reorderProfiles}
                    />

                    <ParameterControls
                        profile={activeProfile}
                        isDarkMode={isDarkMode}
                        onUpdateSetting={updateSetting}
                    />

                    <ModeSimulator
                        previewMode={previewMode}
                        isDarkMode={isDarkMode}
                        onSetPreviewMode={setPreviewMode}
                    />

                    <ApiKeySettings
                        apiKey={apiKey}
                        showApiKey={showApiKey}
                        isDarkMode={isDarkMode}
                        onApiKeyChange={setApiKey}
                        onToggleShow={() => setShowApiKey(!showApiKey)}
                    />
                </div>
            )}

            <Notification notification={notification} />
        </div>
    );
};

export default App;
