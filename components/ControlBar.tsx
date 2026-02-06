import React from 'react';
import { Mic, MicOff, Settings, Sun, Moon } from 'lucide-react';

interface ControlBarProps {
    isConnected: boolean;
    isDarkMode: boolean;
    onToggleMic: () => void;
    onToggleSettings: () => void;
    onToggleTheme: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
    isConnected,
    isDarkMode,
    onToggleMic,
    onToggleSettings,
    onToggleTheme
}) => {
    return (
        <div className="absolute bottom-4 left-0 w-full flex justify-center items-center gap-6 z-10">
            {/* Settings */}
            <button
                onClick={onToggleSettings}
                className={`p-3 rounded-full border transition-all hover:scale-105 backdrop-blur-sm ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/5'
                    }`}
            >
                <Settings size={18} />
            </button>

            {/* Mic Toggle */}
            <button
                onClick={onToggleMic}
                className={`
                    w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 backdrop-blur-sm
                    ${isConnected
                        ? 'bg-transparent border-current animate-pulse'
                        : `bg-transparent ${isDarkMode ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'}`
                    }
                `}
            >
                {isConnected ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            {/* Theme Toggle */}
            <button
                onClick={onToggleTheme}
                className={`p-3 rounded-full border transition-all hover:scale-105 backdrop-blur-sm ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/5'
                    }`}
            >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
        </div>
    );
};
