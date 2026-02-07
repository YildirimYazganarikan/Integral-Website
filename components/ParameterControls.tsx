import React, { useState } from 'react';
import { Slider } from './ui/Slider';
import { ColorPicker } from './ui/ColorPicker';
import { VisualizerProfile, VisualizerSettings } from '../types';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ParameterControlsProps {
    profile: VisualizerProfile;
    isDarkMode: boolean;
    onUpdateSetting: (key: keyof VisualizerSettings, value: any) => void;
}

interface SectionProps {
    title: string;
    children: React.ReactNode;
    isDarkMode: boolean;
    defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<SectionProps> = ({ title, children, isDarkMode, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="space-y-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-70 hover:opacity-100 w-full ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                {title}
            </button>
            {isOpen && <div className="space-y-3 pl-4 border-l border-current/20">{children}</div>}
        </div>
    );
};

export const ParameterControls: React.FC<ParameterControlsProps> = ({
    profile,
    isDarkMode,
    onUpdateSetting
}) => {
    const { type, settings } = profile;
    const isSpherical = type === 'SPHERICAL_PARTICLE';

    const showRadius = type !== 'STRAIGHT_LINE';
    const showRadiusSensitivity = type !== 'STRAIGHT_LINE';
    const showDisplacementSensitivity = true;
    const showSizeSensitivity = ['PARTICLE_CIRCLE', 'SPHERICAL_PARTICLE'].includes(type);
    const showDensity = ['PARTICLE_CIRCLE', 'STRAIGHT_LINE', 'SPHERICAL_PARTICLE'].includes(type);
    const showThickness = ['STRAIGHT_LINE', 'SIMPLE_CIRCLE', 'CIRCLE_RADIUS'].includes(type);
    const showBreathing = ['PARTICLE_CIRCLE', 'SIMPLE_CIRCLE', 'CIRCLE_RADIUS', 'SPHERICAL_PARTICLE'].includes(type);
    const showRotation = isSpherical;
    const showParticleFade = ['PARTICLE_CIRCLE', 'SPHERICAL_PARTICLE'].includes(type);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end border-b pb-2 border-current opacity-50">
                <span className="text-xs font-bold uppercase tracking-wider">Parameters</span>
            </div>

            {/* === GLOBAL SECTION === */}
            <CollapsibleSection title="Global" isDarkMode={isDarkMode}>
                {showRadius && (
                    <Slider
                        label="RADIUS"
                        value={settings.radius}
                        min={isSpherical ? 50 : 20}
                        max={isSpherical ? 400 : 300}
                        step={isSpherical ? 10 : 1}
                        onChange={(v) => onUpdateSetting('radius', v)}
                        isDarkMode={isDarkMode}
                    />
                )}

                {showDensity && (
                    <Slider
                        label="DENSITY"
                        value={settings.density}
                        min={0.1}
                        max={1}
                        step={0.01}
                        formatValue={(v) => `${(v * 100).toFixed(0)}%`}
                        onChange={(v) => onUpdateSetting('density', v)}
                        isDarkMode={isDarkMode}
                    />
                )}

                {isSpherical && (
                    <>
                        <Slider
                            label="PARTICLE SIZE"
                            value={settings.baseSize ?? 3.9}
                            min={0.5}
                            max={8.0}
                            step={0.1}
                            formatValue={(v) => v.toFixed(1)}
                            onChange={(v) => onUpdateSetting('baseSize', v)}
                            isDarkMode={isDarkMode}
                        />
                        <Slider
                            label="BASE OPACITY"
                            value={settings.opacity ?? 0.6}
                            min={0}
                            max={1}
                            step={0.05}
                            formatValue={(v) => `${(v * 100).toFixed(0)}%`}
                            onChange={(v) => onUpdateSetting('opacity', v)}
                            isDarkMode={isDarkMode}
                        />
                    </>
                )}

                {showRotation && (
                    <Slider
                        label="IDLE ROTATION"
                        value={settings.rotationSpeed ?? 0.2}
                        min={0}
                        max={2}
                        step={0.05}
                        formatValue={(v) => v.toFixed(2)}
                        onChange={(v) => onUpdateSetting('rotationSpeed', v)}
                        isDarkMode={isDarkMode}
                    />
                )}

                {showThickness && (
                    <Slider
                        label="THICKNESS"
                        value={settings.thickness}
                        min={1}
                        max={20}
                        formatValue={(v) => `${v}px`}
                        onChange={(v) => onUpdateSetting('thickness', v)}
                        isDarkMode={isDarkMode}
                    />
                )}
            </CollapsibleSection>

            {/* === SQUID EFFECT (SPHERICAL ONLY) === */}
            {isSpherical && (
                <CollapsibleSection title="Squid Effect" isDarkMode={isDarkMode}>
                    <Slider
                        label="PULSE SPEED"
                        value={settings.squidSpeed ?? 3.3}
                        min={0}
                        max={10}
                        step={0.1}
                        formatValue={(v) => v.toFixed(1)}
                        onChange={(v) => onUpdateSetting('squidSpeed', v)}
                        isDarkMode={isDarkMode}
                    />
                    <Slider
                        label="PULSE SCALE"
                        value={settings.squidAmplitude ?? 2.2}
                        min={0}
                        max={5}
                        step={0.1}
                        formatValue={(v) => v.toFixed(1)}
                        onChange={(v) => onUpdateSetting('squidAmplitude', v)}
                        isDarkMode={isDarkMode}
                    />
                    <Slider
                        label="PULSE FADE"
                        value={settings.squidOpacityVar ?? 0.45}
                        min={0}
                        max={1}
                        step={0.05}
                        formatValue={(v) => `${(v * 100).toFixed(0)}%`}
                        onChange={(v) => onUpdateSetting('squidOpacityVar', v)}
                        isDarkMode={isDarkMode}
                    />
                </CollapsibleSection>
            )}

            {/* === BREATHING === */}
            {showBreathing && (
                <CollapsibleSection title="Breathing" isDarkMode={isDarkMode}>
                    <Slider
                        label={isSpherical ? "BREATH AMPLITUDE" : "BREATHING AMOUNT"}
                        value={isSpherical ? (settings.breathingAmplitude ?? 29) : (settings.breathingAmount ?? 0)}
                        min={0}
                        max={isSpherical ? 100 : 20}
                        step={1}
                        onChange={(v) => onUpdateSetting(isSpherical ? 'breathingAmplitude' : 'breathingAmount', v)}
                        isDarkMode={isDarkMode}
                    />
                    <Slider
                        label="BREATH FREQUENCY"
                        value={settings.breathingFrequency ?? (isSpherical ? 0.3 : 1)}
                        min={0.1}
                        max={5.0}
                        step={0.1}
                        formatValue={(v) => v.toFixed(1)}
                        onChange={(v) => onUpdateSetting('breathingFrequency', v)}
                        isDarkMode={isDarkMode}
                    />
                </CollapsibleSection>
            )}

            {/* === LISTENING MODE (SPHERICAL ONLY) === */}
            {isSpherical && (
                <CollapsibleSection title="Listening Mode" isDarkMode={isDarkMode} defaultOpen={false}>
                    <Slider
                        label="TRIGGER SENSITIVITY"
                        value={settings.listeningTriggerSens ?? 0.078}
                        min={0.001}
                        max={0.2}
                        step={0.001}
                        formatValue={(v) => v.toFixed(3)}
                        onChange={(v) => onUpdateSetting('listeningTriggerSens', v)}
                        isDarkMode={isDarkMode}
                    />
                    <Slider
                        label="SPIKE INTENSITY"
                        value={settings.listeningIntensity ?? 0.8}
                        min={0.1}
                        max={2.0}
                        step={0.1}
                        formatValue={(v) => v.toFixed(1)}
                        onChange={(v) => onUpdateSetting('listeningIntensity', v)}
                        isDarkMode={isDarkMode}
                    />
                </CollapsibleSection>
            )}

            {/* === SPEAKING MODE (SPHERICAL ONLY) === */}
            {isSpherical && (
                <CollapsibleSection title="Speaking Mode" isDarkMode={isDarkMode} defaultOpen={false}>
                    <Slider
                        label="VOICE RATE"
                        value={settings.speakingRate ?? 16}
                        min={1}
                        max={30}
                        step={0.5}
                        formatValue={(v) => v.toFixed(1)}
                        onChange={(v) => onUpdateSetting('speakingRate', v)}
                        isDarkMode={isDarkMode}
                    />
                    <Slider
                        label="VOICE AMPLITUDE"
                        value={settings.speakingIntensity ?? 0.4}
                        min={0.1}
                        max={2.0}
                        step={0.1}
                        formatValue={(v) => v.toFixed(1)}
                        onChange={(v) => onUpdateSetting('speakingIntensity', v)}
                        isDarkMode={isDarkMode}
                    />
                </CollapsibleSection>
            )}

            {/* === SEARCHING MODE (SPHERICAL ONLY) === */}
            {isSpherical && (
                <CollapsibleSection title="Searching Mode" isDarkMode={isDarkMode} defaultOpen={false}>
                    <Slider
                        label="SEARCH SPEED"
                        value={settings.searchingSpeed ?? 0.8}
                        min={0.1}
                        max={5.0}
                        step={0.1}
                        formatValue={(v) => v.toFixed(1)}
                        onChange={(v) => onUpdateSetting('searchingSpeed', v)}
                        isDarkMode={isDarkMode}
                    />
                    <Slider
                        label="JITTER"
                        value={settings.searchingJitter ?? 23}
                        min={0}
                        max={50}
                        step={1}
                        onChange={(v) => onUpdateSetting('searchingJitter', v)}
                        isDarkMode={isDarkMode}
                    />
                </CollapsibleSection>
            )}

            {/* === OUTER SPHERE (SPHERICAL ONLY) === */}
            {isSpherical && (
                <CollapsibleSection title="Outer Sphere" isDarkMode={isDarkMode} defaultOpen={false}>
                    <div className="flex items-center justify-between text-xs font-mono opacity-70">
                        <span>ENABLED</span>
                        <button
                            onClick={() => onUpdateSetting('enableOuterSphere', settings.enableOuterSphere ? 0 : 1)}
                            className={`px-3 py-1 rounded border ${settings.enableOuterSphere
                                ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white')
                                : 'opacity-50'
                                }`}
                        >
                            {settings.enableOuterSphere ? 'ON' : 'OFF'}
                        </button>
                    </div>
                    <Slider
                        label="OUTER RADIUS"
                        value={settings.outerSphereRadius ?? 300}
                        min={200}
                        max={600}
                        step={10}
                        onChange={(v) => onUpdateSetting('outerSphereRadius', v)}
                        isDarkMode={isDarkMode}
                    />
                    <Slider
                        label="OUTER SPEED"
                        value={settings.outerSphereSpeed ?? 8}
                        min={1}
                        max={20}
                        step={0.5}
                        formatValue={(v) => v.toFixed(1)}
                        onChange={(v) => onUpdateSetting('outerSphereSpeed', v)}
                        isDarkMode={isDarkMode}
                    />
                    <Slider
                        label="OUTER DENSITY"
                        value={settings.outerSphereDensity ?? 0.2}
                        min={0.05}
                        max={0.5}
                        step={0.01}
                        formatValue={(v) => `${(v * 100).toFixed(0)}%`}
                        onChange={(v) => onUpdateSetting('outerSphereDensity', v)}
                        isDarkMode={isDarkMode}
                    />
                </CollapsibleSection>
            )}

            {/* === COLORS (SPHERICAL ONLY) === */}
            {isSpherical && (
                <CollapsibleSection title="Colors" isDarkMode={isDarkMode} defaultOpen={false}>
                    <div className="flex items-center justify-between text-xs font-mono opacity-70">
                        <span>CUSTOM COLORS</span>
                        <button
                            onClick={() => onUpdateSetting('useCustomColors', settings.useCustomColors ? 0 : 1)}
                            className={`px-3 py-1 rounded border ${settings.useCustomColors
                                ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white')
                                : 'opacity-50'
                                }`}
                        >
                            {settings.useCustomColors ? 'ON' : 'OFF'}
                        </button>
                    </div>
                    {settings.useCustomColors ? (
                        <>
                            <p className="text-xs opacity-50 font-bold mt-2 border-b border-current/20 pb-1">DARK THEME</p>
                            <ColorPicker
                                label="MAIN PARTICLE"
                                value={settings.particleColorDark ?? '#88aaff'}
                                onChange={(v) => onUpdateSetting('particleColorDark', v)}
                                isDarkMode={isDarkMode}
                            />
                            <ColorPicker
                                label="SECONDARY"
                                value={settings.secondaryColorDark ?? '#aaccff'}
                                onChange={(v) => onUpdateSetting('secondaryColorDark', v)}
                                isDarkMode={isDarkMode}
                            />
                            <ColorPicker
                                label="OUTER SPHERE"
                                value={settings.outerSphereColorDark ?? '#ff6464'}
                                onChange={(v) => onUpdateSetting('outerSphereColorDark', v)}
                                isDarkMode={isDarkMode}
                            />
                            <p className="text-xs opacity-50 font-bold mt-3 border-b border-current/20 pb-1">LIGHT THEME</p>
                            <ColorPicker
                                label="MAIN PARTICLE"
                                value={settings.particleColorLight ?? '#3355aa'}
                                onChange={(v) => onUpdateSetting('particleColorLight', v)}
                                isDarkMode={isDarkMode}
                            />
                            <ColorPicker
                                label="SECONDARY"
                                value={settings.secondaryColorLight ?? '#224488'}
                                onChange={(v) => onUpdateSetting('secondaryColorLight', v)}
                                isDarkMode={isDarkMode}
                            />
                            <ColorPicker
                                label="OUTER SPHERE"
                                value={settings.outerSphereColorLight ?? '#cc4444'}
                                onChange={(v) => onUpdateSetting('outerSphereColorLight', v)}
                                isDarkMode={isDarkMode}
                            />
                        </>
                    ) : (
                        <p className="text-xs opacity-50 italic">
                            Grayscale mode. Enable custom colors for full control.
                        </p>
                    )}
                </CollapsibleSection>
            )}

            {/* === SIGNAL SETTINGS (CIRCLE_RADIUS ONLY) === */}
            {type === 'CIRCLE_RADIUS' && (
                <CollapsibleSection title="Search Signals" isDarkMode={isDarkMode} defaultOpen={false}>
                    <Slider
                        label="SIGNAL SPEED"
                        value={settings.signalSpeed ?? 2.0}
                        min={0.5}
                        max={5}
                        step={0.1}
                        formatValue={(v) => v.toFixed(1)}
                        onChange={(v) => onUpdateSetting('signalSpeed', v)}
                        isDarkMode={isDarkMode}
                    />
                    <Slider
                        label="SIGNAL RANGE"
                        value={settings.signalMaxRadius ?? 200}
                        min={50}
                        max={400}
                        step={10}
                        onChange={(v) => onUpdateSetting('signalMaxRadius', v)}
                        isDarkMode={isDarkMode}
                    />
                    <Slider
                        label="SIGNAL COUNT"
                        value={settings.signalCount ?? 3}
                        min={1}
                        max={6}
                        step={1}
                        onChange={(v) => onUpdateSetting('signalCount', v)}
                        isDarkMode={isDarkMode}
                    />
                    <Slider
                        label="SIGNAL THICKNESS"
                        value={settings.signalThickness ?? 2}
                        min={1}
                        max={8}
                        step={0.5}
                        formatValue={(v) => v.toFixed(1)}
                        onChange={(v) => onUpdateSetting('signalThickness', v)}
                        isDarkMode={isDarkMode}
                    />
                </CollapsibleSection>
            )}

            {/* === SENSITIVITY (NON-SPHERICAL) === */}
            {!isSpherical && (
                <CollapsibleSection title="Sensitivity" isDarkMode={isDarkMode}>
                    {showRadiusSensitivity && (
                        <Slider
                            label="RADIUS SENSITIVITY"
                            value={settings.radiusSensitivity}
                            min={0}
                            max={5}
                            step={0.1}
                            formatValue={(v) => v.toFixed(1)}
                            onChange={(v) => onUpdateSetting('radiusSensitivity', v)}
                            isDarkMode={isDarkMode}
                        />
                    )}

                    {showDisplacementSensitivity && (
                        <Slider
                            label="DISPLACEMENT SENSITIVITY"
                            value={settings.displacementSensitivity}
                            min={0}
                            max={5}
                            step={0.1}
                            formatValue={(v) => v.toFixed(1)}
                            onChange={(v) => onUpdateSetting('displacementSensitivity', v)}
                            isDarkMode={isDarkMode}
                        />
                    )}

                    {showSizeSensitivity && (
                        <Slider
                            label="SIZE SENSITIVITY"
                            value={settings.sizeSensitivity || 1}
                            min={0}
                            max={3}
                            step={0.1}
                            formatValue={(v) => v.toFixed(1)}
                            onChange={(v) => onUpdateSetting('sizeSensitivity', v)}
                            isDarkMode={isDarkMode}
                        />
                    )}

                    {showParticleFade && (
                        <>
                            <Slider
                                label="PARTICLE FADE"
                                value={settings.particleFade || 0}
                                min={0}
                                max={1}
                                step={0.05}
                                formatValue={(v) => `${(v * 100).toFixed(0)}%`}
                                onChange={(v) => onUpdateSetting('particleFade', v)}
                                isDarkMode={isDarkMode}
                            />
                            <Slider
                                label="NOISE SCALE"
                                value={settings.noiseScale || 1}
                                min={0}
                                max={3}
                                step={0.1}
                                formatValue={(v) => v.toFixed(1)}
                                onChange={(v) => onUpdateSetting('noiseScale', v)}
                                isDarkMode={isDarkMode}
                            />
                        </>
                    )}
                </CollapsibleSection>
            )}
        </div>
    );
};
