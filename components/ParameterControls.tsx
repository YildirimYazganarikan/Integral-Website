import React from 'react';
import { Slider } from './ui/Slider';
import { VisualizerProfile, VisualizerSettings } from '../types';

interface ParameterControlsProps {
    profile: VisualizerProfile;
    isDarkMode: boolean;
    onUpdateSetting: (key: keyof VisualizerSettings, value: any) => void;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
    profile,
    isDarkMode,
    onUpdateSetting
}) => {
    const { type, settings } = profile;

    const showRadius = type !== 'STRAIGHT_LINE';
    const showRadiusSensitivity = type !== 'STRAIGHT_LINE';
    const showDisplacementSensitivity = true;
    const showSizeSensitivity = ['PARTICLE_CIRCLE', 'SPHERICAL_PARTICLE'].includes(type);
    const showDensity = ['PARTICLE_CIRCLE', 'STRAIGHT_LINE', 'SPHERICAL_PARTICLE'].includes(type);
    const showThickness = ['STRAIGHT_LINE', 'SIMPLE_CIRCLE', 'CIRCLE_RADIUS'].includes(type);
    const showBreathing = ['PARTICLE_CIRCLE', 'SIMPLE_CIRCLE', 'CIRCLE_RADIUS', 'SPHERICAL_PARTICLE'].includes(type);
    const showRotation = type === 'SPHERICAL_PARTICLE';
    const showParticleFade = ['PARTICLE_CIRCLE', 'SPHERICAL_PARTICLE'].includes(type);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end border-b pb-2 border-current opacity-50">
                <span className="text-xs font-bold uppercase tracking-wider">Parameters</span>
            </div>

            <div className="space-y-4">
                {showRadius && (
                    <Slider
                        label="BASE RADIUS"
                        value={settings.radius}
                        min={20}
                        max={300}
                        onChange={(v) => onUpdateSetting('radius', v)}
                        isDarkMode={isDarkMode}
                    />
                )}

                {showBreathing && (
                    <>
                        <Slider
                            label="BREATHING AMOUNT"
                            value={settings.breathingAmount || 0}
                            min={0}
                            max={20}
                            onChange={(v) => onUpdateSetting('breathingAmount', v)}
                            isDarkMode={isDarkMode}
                        />
                        <Slider
                            label="BREATHING FREQ"
                            value={settings.breathingFrequency || 1}
                            min={0.1}
                            max={5.0}
                            step={0.1}
                            onChange={(v) => onUpdateSetting('breathingFrequency', v)}
                            isDarkMode={isDarkMode}
                        />
                    </>
                )}

                {showRotation && (
                    <Slider
                        label="ROTATION SPEED"
                        value={settings.rotationSpeed ?? 1}
                        min={0}
                        max={5}
                        step={0.1}
                        onChange={(v) => onUpdateSetting('rotationSpeed', v)}
                        isDarkMode={isDarkMode}
                    />
                )}

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

                {showDensity && (
                    <Slider
                        label="DENSITY / DETAIL"
                        value={settings.density}
                        min={0.1}
                        max={1}
                        step={0.1}
                        formatValue={(v) => `${(v * 100).toFixed(0)}%`}
                        onChange={(v) => onUpdateSetting('density', v)}
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
            </div>
        </div>
    );
};
