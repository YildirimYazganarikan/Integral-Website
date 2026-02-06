import React, { useState } from 'react';
import { SimulationSettings, SimulationMode, Particle } from '../types';
import { MIN_MAX_SETTINGS } from '../constants';
import { Settings2, X, Download, ChevronRight, ChevronLeft, ToggleLeft, ToggleRight } from 'lucide-react';

interface ControlsProps {
  settings: SimulationSettings;
  mode: SimulationMode;
  onSettingChange: (key: keyof SimulationSettings, value: number) => void;
  onModeChange: (mode: SimulationMode) => void;
}

const Controls: React.FC<ControlsProps> = ({ settings, mode, onSettingChange, onModeChange }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Core');

  const tabs = ['Core', 'Squid', 'Breath', 'Listen', 'Speak', 'Search'];

  const groups: Record<string, (keyof SimulationSettings)[]> = {
    Core: ['density', 'radius', 'baseSize', 'opacity', 'rotationSpeed'],
    Squid: ['squidSpeed', 'squidAmplitude', 'squidOpacityVar'],
    Breath: ['breathingFrequency', 'breathingAmplitude'],
    Listen: ['listeningTriggerSens', 'listeningIntensity'],
    Speak: ['speakingRate', 'speakingIntensity'],
    Search: ['searchingSpeed', 'searchingJitter', 'enableOuterSphere', 'outerSphereRadius', 'outerSphereSpeed', 'outerSphereDensity'],
  };

  const handleExport = () => {
    const htmlContent = generateHtmlExport(settings, mode);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'squid-skin-sphere.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
        {!isOpen && (
            <button 
                onClick={() => setIsOpen(true)}
                className="absolute top-6 left-6 z-50 bg-black/50 backdrop-blur-md border border-white/10 p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
                <ChevronRight size={20} />
            </button>
        )}

        <div className={`absolute top-0 left-0 h-full w-80 bg-black/95 backdrop-blur-xl border-r border-white/5 text-gray-200 z-40 flex flex-col transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Settings</span>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="text-white/30 hover:text-white transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
            </div>

            {/* Mode Selectors */}
            <div className="p-4 grid grid-cols-3 gap-2 border-b border-white/5">
                {(Object.keys(SimulationMode) as Array<keyof typeof SimulationMode>).map((m) => (
                <button
                    key={m}
                    onClick={() => onModeChange(m as SimulationMode)}
                    className={`text-[10px] uppercase py-2 rounded border transition-all tracking-wider ${
                    mode === m 
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                        : 'bg-transparent border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                    }`}
                >
                    {m}
                </button>
                ))}
            </div>

            {/* Tab Navigation */}
            <div className="flex overflow-x-auto no-scrollbar border-b border-white/5 bg-black/20">
                {tabs.map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-shrink-0 px-4 py-3 text-[10px] uppercase tracking-widest font-semibold transition-colors ${
                    activeTab === tab 
                        ? 'text-white border-b border-indigo-500 bg-white/5' 
                        : 'text-white/30 hover:text-white/60'
                    }`}
                >
                    {tab}
                </button>
                ))}
            </div>

            {/* Sliders */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {groups[activeTab].map((key) => {
                    const settingKey = key as keyof SimulationSettings;
                    // Filter outer sphere settings if disabled
                    if (settingKey.startsWith('outerSphere') && settings.enableOuterSphere === 0) {
                        return null;
                    }

                    const config = MIN_MAX_SETTINGS[settingKey];

                    // Render Boolean Toggle
                    if (config.type === 'toggle') {
                         return (
                            <div key={key} className="flex justify-between items-center py-2 group cursor-pointer" onClick={() => onSettingChange(settingKey, settings[settingKey] === 0 ? 1 : 0)}>
                                <label className="text-[10px] font-medium text-white/50 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                                    {config.label}
                                </label>
                                <div className={`${settings[settingKey] === 1 ? 'text-indigo-400' : 'text-white/20'}`}>
                                    {settings[settingKey] === 1 ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                </div>
                            </div>
                         );
                    }

                    return (
                        <div key={key} className="space-y-3 group">
                            <div className="flex justify-between items-end">
                                <label className="text-[10px] font-medium text-white/50 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                                {config.label}
                                </label>
                                <span className="text-[10px] font-mono text-white/30">
                                {settings[settingKey].toFixed(2)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={config.min}
                                max={config.max}
                                step={config.step}
                                value={settings[settingKey]}
                                onChange={(e) => onSettingChange(settingKey, parseFloat(e.target.value))}
                                className="w-full h-[2px] bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                            <style>{`
                                input[type=range]::-webkit-slider-thumb {
                                    background: #6366f1;
                                    box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
                                }
                            `}</style>
                        </div>
                    );
                })}
            </div>

            {/* Footer / Export */}
            <div className="p-5 border-t border-white/5">
                <button 
                    onClick={handleExport}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs uppercase tracking-widest text-white/70 hover:text-white transition-all group"
                >
                    <Download size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                    <span>Export Sphere</span>
                </button>
            </div>
        </div>
    </>
  );
};

// Standalone HTML Generator
const generateHtmlExport = (settings: SimulationSettings, mode: SimulationMode) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Squid Skin Sphere</title>
    <style>
        body { margin: 0; overflow: hidden; background: #050505; font-family: sans-serif; }
        canvas { display: block; }
        .controls {
            position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
            z-index: 10; display: flex; gap: 8px;
            background: rgba(0,0,0,0.5); padding: 8px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
            backdrop-filter: blur(8px);
        }
        button {
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.7); padding: 8px 16px; border-radius: 6px;
            cursor: pointer; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;
            transition: all 0.2s;
        }
        button:hover { background: rgba(255,255,255,0.15); color: #fff; }
        button.active { background: rgba(99, 102, 241, 0.3); border-color: rgba(99, 102, 241, 0.6); color: #fff; }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    
    <div class="controls">
        <button onclick="setMode('LISTENING')" id="btn-LISTENING">Listening</button>
        <button onclick="setMode('SPEAKING')" id="btn-SPEAKING">Speaking</button>
        <button onclick="setMode('SEARCHING')" id="btn-SEARCHING">Searching</button>
    </div>

    <script>
        const settings = ${JSON.stringify(settings)};
        let mode = "${mode}";
        
        function setMode(m) {
            mode = m;
            document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            document.getElementById('btn-' + m).classList.add('active');
        }
        setMode(mode); // init

        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        let width, height;
        
        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        }
        window.addEventListener('resize', resize);
        resize();

        // Initialize Particles
        const count = Math.floor(50 + settings.density * 500);
        const particles = [];
        for (let i = 0; i < count; i++) {
            const goldenRatio = (1 + Math.sqrt(5)) / 2;
            const theta = 2 * Math.PI * i / goldenRatio;
            const phi = Math.acos(1 - 2 * (i + 0.5) / count);
            particles.push({
                theta, phi,
                baseSize: Math.random() * 0.5 + 0.5,
                phase: Math.random() * Math.PI * 2,
                randomX: Math.random() * 2 - 1,
                randomY: Math.random() * 2 - 1,
            });
        }

        // Initialize Outer Particles
        const outerCount = Math.floor(20 + settings.outerSphereDensity * 300);
        const outerParticles = [];
        for (let i = 0; i < outerCount; i++) {
            const goldenRatio = (1 + Math.sqrt(5)) / 2;
            const theta = 2 * Math.PI * i / goldenRatio;
            const phi = Math.acos(1 - 2 * (i + 0.5) / outerCount);
            outerParticles.push({
                theta, phi,
                baseSize: Math.random() * 1.0 + 0.5,
                phase: Math.random() * Math.PI * 2,
                randomX: Math.random() * 2 - 1,
                randomY: Math.random() * 2 - 1,
            });
        }

        let time = 0;
        let intensity = 0;
        let targetIntensity = 0;

        function update() {
             // Simulation Logic
            if (mode === 'LISTENING') {
                if (Math.random() < settings.listeningTriggerSens) {
                    targetIntensity = Math.random() * settings.listeningIntensity;
                }
                targetIntensity *= 0.92;
            } else if (mode === 'SPEAKING') {
                targetIntensity = (Math.sin(time * settings.speakingRate) + 1) * 0.5 * settings.speakingIntensity;
            } else {
                targetIntensity = 0.3;
            }
            intensity += (targetIntensity - intensity) * 0.1;

            ctx.clearRect(0, 0, width, height);
            
            const centerX = width / 2;
            const centerY = height / 2;

            // Rotation
            let rotSpeedX = settings.rotationSpeed * 0.5;
            let rotSpeedY = settings.rotationSpeed * 0.8;
            
            if (mode === 'SEARCHING') {
                rotSpeedX = settings.searchingSpeed;
                rotSpeedY = settings.searchingSpeed * 1.5;
            }
            
            const rotX = time * rotSpeedX;
            const rotY = time * rotSpeedY;

            // Breathing
            const breathe = Math.sin(time * settings.breathingFrequency) * settings.breathingAmplitude;
            const currentRadius = settings.radius + (intensity * 40) + breathe;

            // Draw Main Particles
            particles.forEach((p, i) => {
                const squidPulse = Math.sin(time * settings.squidSpeed + p.phase);
                let jitter = intensity * 10;
                if (mode === 'SEARCHING') jitter = settings.searchingJitter;
                
                let r = currentRadius + (p.randomX * jitter);
                let x = r * Math.sin(p.phi) * Math.cos(p.theta);
                let y = r * Math.sin(p.phi) * Math.sin(p.theta);
                let z = r * Math.cos(p.phi);

                // Rotate
                let x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
                let z1 = z * Math.cos(rotY) + x * Math.sin(rotY);
                let y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
                let z2 = z1 * Math.cos(rotX) + y * Math.sin(rotX);

                // Project
                const fov = 400;
                const scale = fov / (fov + z2);
                const pX = centerX + x1 * scale;
                const pY = centerY + y2 * scale;

                // Visuals
                const pulseScale = 1 + (squidPulse * settings.squidAmplitude * 0.5);
                let size = (p.baseSize * settings.baseSize * scale) * pulseScale;
                size += intensity * 5 * scale;
                
                let alpha = settings.opacity * scale;
                alpha *= (1 + squidPulse * settings.squidOpacityVar);
                alpha = Math.max(0, Math.min(1, alpha));

                ctx.beginPath();
                ctx.arc(pX, pY, Math.max(0, size), 0, Math.PI * 2);
                
                const brightness = Math.floor(255 * scale);
                const blueTint = Math.floor(200 + (squidPulse * 55)); 
                ctx.fillStyle = \`rgba(\${brightness}, \${brightness}, \${blueTint}, \${alpha})\`;
                ctx.fill();
            });

            // Draw Outer Sphere (Searching)
            if (mode === 'SEARCHING' && settings.enableOuterSphere > 0) {
                const outerRotX = time * settings.outerSphereSpeed * 0.1;
                const outerRotY = time * settings.outerSphereSpeed * 0.15;
                const outerRadius = settings.outerSphereRadius;
                const globalAlpha = (Math.sin(time * settings.outerSphereSpeed * 2) + 1) * 0.5 * 0.3;

                outerParticles.forEach((p) => {
                    let x = outerRadius * Math.sin(p.phi) * Math.cos(p.theta);
                    let y = outerRadius * Math.sin(p.phi) * Math.sin(p.theta);
                    let z = outerRadius * Math.cos(p.phi);

                    let x1 = x * Math.cos(outerRotY) - z * Math.sin(outerRotY);
                    let z1 = z * Math.cos(outerRotY) + x * Math.sin(outerRotY);
                    let y2 = y * Math.cos(outerRotX) - z1 * Math.sin(outerRotX);
                    let z2 = z1 * Math.cos(outerRotX) + y * Math.sin(outerRotX);

                    const fov = 400;
                    const scale = fov / (fov + z2);
                    const pX = centerX + x1 * scale;
                    const pY = centerY + y2 * scale;

                    const size = p.baseSize * scale * 2;
                    
                    ctx.beginPath();
                    ctx.arc(pX, pY, Math.max(0, size), 0, Math.PI * 2);
                    
                    const r = 255; const g = 100; const b = 100;
                    const alpha = Math.min(1, globalAlpha * scale * 2 + 0.1); 

                    ctx.fillStyle = \`rgba(\${r}, \${g}, \${b}, \${alpha})\`;
                    ctx.fill();
                });
            }

            time += 0.01;
            requestAnimationFrame(update);
        }

        requestAnimationFrame(update);
    </script>
</body>
</html>`;
}

export default Controls;