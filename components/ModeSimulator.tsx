import React from 'react';
import { AgentMode } from '../types';

interface ModeSimulatorProps {
    previewMode: AgentMode | null;
    isDarkMode: boolean;
    onSetPreviewMode: (mode: AgentMode | null) => void;
}

export const ModeSimulator: React.FC<ModeSimulatorProps> = ({
    previewMode,
    isDarkMode,
    onSetPreviewMode
}) => {
    const buttonClass = (isActive: boolean) => `px-3 py-2 rounded text-xs border uppercase tracking-wider ${isActive
            ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white')
            : 'opacity-50'
        }`;

    return (
        <div className="space-y-4 pb-8">
            <div className="flex justify-between items-end border-b pb-2 border-current opacity-50">
                <span className="text-xs font-bold uppercase tracking-wider">Simulation</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onSetPreviewMode(null)} className={buttonClass(!previewMode)}>
                    Auto
                </button>
                <button onClick={() => onSetPreviewMode(AgentMode.LISTENING)} className={buttonClass(previewMode === AgentMode.LISTENING)}>
                    Listening
                </button>
                <button onClick={() => onSetPreviewMode(AgentMode.SPEAKING)} className={buttonClass(previewMode === AgentMode.SPEAKING)}>
                    Speaking
                </button>
                <button onClick={() => onSetPreviewMode(AgentMode.SEARCHING)} className={buttonClass(previewMode === AgentMode.SEARCHING)}>
                    Searching
                </button>
            </div>
        </div>
    );
};
