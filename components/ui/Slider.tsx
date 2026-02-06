import React from 'react';

interface SliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    formatValue?: (value: number) => string;
    onChange: (value: number) => void;
    isDarkMode: boolean;
}

export const Slider: React.FC<SliderProps> = ({
    label,
    value,
    min,
    max,
    step = 1,
    formatValue,
    onChange,
    isDarkMode
}) => {
    const displayValue = formatValue ? formatValue(value) : value.toString();

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono opacity-70">
                <span>{label}</span>
                <span>{displayValue}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'
                    }`}
            />
        </div>
    );
};
