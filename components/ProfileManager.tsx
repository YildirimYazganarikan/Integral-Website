import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Copy, Circle, Activity, Aperture, Disc, Globe, GripVertical } from 'lucide-react';
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
    onReorderProfiles: (fromIndex: number, toIndex: number) => void;
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
    onRenameProfile,
    onReorderProfiles
}) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedIndex !== null && index !== draggedIndex) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== toIndex) {
            onReorderProfiles(draggedIndex, toIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

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
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-2">
                {profiles.map((p, index) => (
                    <div
                        key={p.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`group flex items-center justify-between p-3 rounded border cursor-pointer transition-all ${activeProfileId === p.id
                            ? (isDarkMode ? 'border-white bg-white/10' : 'border-black bg-black/5')
                            : 'border-transparent hover:opacity-70'
                            } ${draggedIndex === index ? 'opacity-50' : ''
                            } ${dragOverIndex === index ? 'border-blue-500 bg-blue-500/10' : ''
                            }`}
                        onClick={() => onSelectProfile(p.id)}
                    >
                        {/* Drag Handle */}
                        <div
                            className={`cursor-grab mr-2 opacity-30 hover:opacity-70 ${isDarkMode ? 'text-white' : 'text-black'}`}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <GripVertical size={14} />
                        </div>

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
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="relative flex-shrink-0">
                                    {getThemeIcon(p.type)}
                                    {hasUnsavedChanges(p.id) && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                                    )}
                                </div>
                                <span className="text-sm font-medium truncate">{p.name}</span>
                            </div>
                        )}

                        <div className="flex gap-2 opacity-60 hover:opacity-100 transition-opacity items-center flex-shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); onDuplicateProfile(p.id); }} className="hover:scale-110" title="Duplicate">
                                <Copy size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onStartEditing(p.id); }} className="hover:scale-110" title="Rename">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDeleteProfile(p.id); }} className="hover:text-red-500 hover:scale-110" title="Delete Profile">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
