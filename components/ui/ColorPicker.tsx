import React from 'react';

interface ColorPickerProps {
    label: string;
    value: string;
    onChange: (color: string) => void;
    isDarkMode: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
    label,
    value,
    onChange,
    isDarkMode
}) => {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs font-mono opacity-70">{label}</span>
            <div className="flex items-center gap-2">
                <div
                    className="w-6 h-6 rounded border cursor-pointer"
                    style={{
                        backgroundColor: value,
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
                    }}
                    onClick={() => document.getElementById(`color-input-${label}`)?.click()}
                />
                <input
                    id={`color-input-${label}`}
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-0 h-0 opacity-0 absolute"
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-20 px-2 py-1 text-xs font-mono rounded border ${isDarkMode
                            ? 'bg-black/50 border-white/20 text-white'
                            : 'bg-white/50 border-black/20 text-black'
                        }`}
                    placeholder="#ffffff"
                />
            </div>
        </div>
    );
};
