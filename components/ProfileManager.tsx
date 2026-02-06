import React from 'react';
import { Plus, Trash2, Edit2, Copy, Circle, Activity, Aperture, Disc, Globe } from 'lucide-react';
import { VisualizerProfile, ThemeType } from '../types';

interface ProfileManagerProps {
    profiles: VisualizerProfile[];
    activeProfileId: string;
    editingProfileId: string | null;
    isDarkMode: boolean;
    hasUnsavedChanges: (id: string) => boolean;
    onSelectProfile: (id: string) => void;
    onAddProfile: (type: ThemeType) => void;
    onDuplicateProfile: (id: string) => void;
    onDeleteProfile: (id: string) => void;
    onStartEditing: (id: string) => void;
    onRenameProfile: (id: string, name: string) => void;
}

const getThemeIcon = (type: ThemeType) => {
    switch (type) {
        case 'PARTICLE_CIRCLE': return <Aperture size={16} />;
        case 'STRAIGHT_LINE': return <Activity size={16} />;
        case 'SIMPLE_CIRCLE': return <Circle size={16} />;
        case 'CIRCLE_RADIUS': return <Disc size={16} />;
        case 'SPHERICAL_PARTICLE': return <Globe size={16} />;
    }
};

const THEME_TYPES: ThemeType[] = ['PARTICLE_CIRCLE', 'STRAIGHT_LINE', 'SIMPLE_CIRCLE', 'CIRCLE_RADIUS', 'SPHERICAL_PARTICLE'];

export const ProfileManager: React.FC<ProfileManagerProps> = ({
    profiles,
    activeProfileId,
    editingProfileId,
    isDarkMode,
    hasUnsavedChanges,
    onSelectProfile,
    onAddProfile,
    onDuplicateProfile,
    onDeleteProfile,
    onStartEditing,
    onRenameProfile
}) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end border-b pb-2 border-current opacity-50">
                <span className="text-xs font-bold uppercase tracking-wider">Profiles</span>
            </div>

            {/* Add New */}
            <div className="grid grid-cols-5 gap-2 mb-4">
                {THEME_TYPES.map(t => (
                    <button
                        key={t}
                        onClick={() => onAddProfile(t)}
                        className={`flex items-center justify-center p-2 rounded border ${isDarkMode ? 'border-white/20 hover:bg-white/20' : 'border-black/20 hover:bg-black/5'
                            }`}
                        title={`Add ${t}`}
                    >
                        {getThemeIcon(t)}
                        <Plus size={10} className="ml-1" />
                    </button>
                ))}
            </div>

            {/* Profile List */}
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
                {profiles.map(p => (
                    <div
                        key={p.id}
                        className={`group flex items-center justify-between p-3 rounded border cursor-pointer transition-all ${activeProfileId === p.id
                                ? (isDarkMode ? 'border-white bg-white/10' : 'border-black bg-black/5')
                                : 'border-transparent hover:opacity-70'
                            }`}
                        onClick={() => onSelectProfile(p.id)}
                    >
                        {editingProfileId === p.id ? (
                            <input
                                autoFocus
                                className="bg-transparent border-b border-current outline-none w-full text-sm font-mono"
                                defaultValue={p.name}
                                onBlur={(e) => onRenameProfile(p.id, e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && onRenameProfile(p.id, (e.target as HTMLInputElement).value)}
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
                            <button onClick={(e) => { e.stopPropagation(); onDuplicateProfile(p.id); }} className="hover:scale-110" title="Duplicate">
                                <Copy size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onStartEditing(p.id); }} className="hover:scale-110">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDeleteProfile(p.id); }} className="hover:text-red-500">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
