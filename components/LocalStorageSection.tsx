import React from 'react';
import { Save, RotateCcw, Copy, Check, Loader2, FolderOpen } from 'lucide-react';
import { VisualizerProfile } from '../types';

interface LocalStorageSectionProps {
    profile: VisualizerProfile;
    isDarkMode: boolean;
    isSaving: boolean;
    hasUnsavedChanges: boolean;
    onSave: () => void;
    onIgnoreChanges: () => void;
    onSaveCopy: () => void;
    onSetDefault: () => void;
    onOpenFolder: () => void;
}

export const LocalStorageSection: React.FC<LocalStorageSectionProps> = ({
    profile,
    isDarkMode,
    isSaving,
    hasUnsavedChanges,
    onSave,
    onIgnoreChanges,
    onSaveCopy,
    onSetDefault,
    onOpenFolder
}) => {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end border-b pb-2 border-current opacity-50">
                <span className="text-xs font-bold uppercase tracking-wider">Local Storage</span>
                <button
                    onClick={onOpenFolder}
                    className="text-xs opacity-50 hover:opacity-100 flex items-center gap-1"
                    title="Open saved profiles folder"
                >
                    <FolderOpen size={12} /> Open Folder
                </button>
            </div>

            {/* Set Default button */}
            <button
                onClick={onSetDefault}
                disabled={isSaving}
                className={`w-full py-2 flex items-center justify-center gap-2 text-xs uppercase border rounded transition-all ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'
                    }`}
            >
                <Check size={14} />
                Set Default
            </button>

            {/* Save/Ignore/Copy buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-current/20">
                <button
                    onClick={onSave}
                    disabled={isSaving || !hasUnsavedChanges}
                    className={`py-2 flex items-center justify-center gap-1 text-xs uppercase border rounded transition-all ${hasUnsavedChanges
                            ? (isDarkMode ? 'border-white/40 hover:bg-white/10' : 'border-black/40 hover:bg-black/10')
                            : 'opacity-40 cursor-not-allowed border-current/20'
                        }`}
                >
                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    Save
                </button>
                <button
                    onClick={onIgnoreChanges}
                    disabled={isSaving || !hasUnsavedChanges}
                    className={`py-2 flex items-center justify-center gap-1 text-xs uppercase border rounded transition-all ${hasUnsavedChanges
                            ? (isDarkMode ? 'border-white/40 hover:bg-white/10' : 'border-black/40 hover:bg-black/10')
                            : 'opacity-40 cursor-not-allowed border-current/20'
                        }`}
                >
                    <RotateCcw size={12} />
                    Ignore
                </button>
                <button
                    onClick={onSaveCopy}
                    disabled={isSaving}
                    className={`py-2 flex items-center justify-center gap-1 text-xs uppercase border rounded transition-all ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'
                        }`}
                >
                    <Copy size={12} />
                    Copy
                </button>
            </div>
        </div>
    );
};
