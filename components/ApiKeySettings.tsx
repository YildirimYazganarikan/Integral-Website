import React from 'react';
import { Key } from 'lucide-react';

interface ApiKeySettingsProps {
    apiKey: string;
    showApiKey: boolean;
    isDarkMode: boolean;
    onApiKeyChange: (key: string) => void;
    onToggleShow: () => void;
}

export const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({
    apiKey,
    showApiKey,
    isDarkMode,
    onApiKeyChange,
    onToggleShow
}) => {
    return (
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
                        onChange={(e) => onApiKeyChange(e.target.value)}
                        placeholder="Enter your Gemini API key"
                        className={`w-full px-3 py-2 pr-16 rounded border text-sm font-mono ${isDarkMode
                                ? 'bg-black/50 border-white/20 text-white placeholder-white/30'
                                : 'bg-white/50 border-black/20 text-black placeholder-black/30'
                            }`}
                    />
                    <button
                        onClick={onToggleShow}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs uppercase px-2 py-1 rounded ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
                            }`}
                    >
                        {showApiKey ? 'Hide' : 'Show'}
                    </button>
                </div>
                <p className={`text-xs opacity-50 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Your API key is stored locally in your browser.
                </p>
            </div>
        </div>
    );
};
