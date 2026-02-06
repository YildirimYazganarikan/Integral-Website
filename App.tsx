import React, { useState, useEffect, useRef } from 'react';
import { useLiveAgent } from './hooks/useLiveAgent';
import { useSupabaseProfiles } from './hooks/useSupabaseProfiles';
import { NoraVisualizer } from './components/NoraVisualizer';
import { AgentMode, VisualizerProfile, ThemeType } from './types';
import { Mic, MicOff, Settings, Plus, Trash2, Edit2, X, Sun, Moon, Circle, Activity, Aperture, Disc, Globe, Download, Upload, Save, Copy, Key, Loader2, Check, AlertCircle } from 'lucide-react';

const DEFAULT_API_KEY = 'AIzaSyCz3XxWf-iWU0VzuawBiBZTiTQ40QGW7pA';

const DEFAULT_PROFILES: VisualizerProfile[] = [
    {
        id: 'p1',
        name: 'Core Pulse',
        type: 'SIMPLE_CIRCLE',
        settings: { radius: 80, radiusSensitivity: 1.2, displacementSensitivity: 0.5, density: 0, thickness: 2, breathingAmount: 8, breathingFrequency: 1.5 }
    },
    {
        id: 'p2',
        name: 'Particle Flow',
        type: 'PARTICLE_CIRCLE',
        settings: { radius: 100, radiusSensitivity: 1.0, displacementSensitivity: 1.0, sizeSensitivity: 1.0, density: 0.5, thickness: 2, breathingAmount: 5, breathingFrequency: 2 }
    },
    {
        id: 'p3',
        name: 'Neural Wave',
        type: 'STRAIGHT_LINE',
        settings: { radius: 100, radiusSensitivity: 1.0, displacementSensitivity: 1.5, density: 0.8, thickness: 3 }
    },
    {
        id: 'p4',
        name: 'Circular Radius',
        type: 'CIRCLE_RADIUS',
        settings: { radius: 100, radiusSensitivity: 1.0, displacementSensitivity: 1.0, density: 0, thickness: 2, breathingAmount: 0, breathingFrequency: 1 }
    },
    {
        id: 'p5',
        name: 'Orbital Sphere',
        type: 'SPHERICAL_PARTICLE',
        settings: { radius: 120, radiusSensitivity: 0.8, displacementSensitivity: 1.2, sizeSensitivity: 1.0, density: 0.6, thickness: 1, rotationSpeed: 1.0, breathingAmount: 5, breathingFrequency: 1 }
    }
];

const App: React.FC = () => {
    // API Key State with localStorage persistence
    const [apiKey, setApiKey] = useState<string>(() => {
        const stored = localStorage.getItem('gemini_api_key');
        return stored || DEFAULT_API_KEY;
    });
    const [showApiKey, setShowApiKey] = useState(false);

    const { state, connect, disconnect, getVolumeLevels } = useLiveAgent(apiKey);

    // Save API key to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('gemini_api_key', apiKey);
    }, [apiKey]);

    // App State
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [profiles, setProfiles] = useState<VisualizerProfile[]>(DEFAULT_PROFILES);
    const [activeProfileId, setActiveProfileId] = useState<string>('p1');
    const [showSettings, setShowSettings] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Customization State
    const [previewMode, setPreviewMode] = useState<AgentMode | null>(null);
    const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

    // Supabase Integration
    const supabase = useSupabaseProfiles();
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
    const [saveAsName, setSaveAsName] = useState('');

    // Show notification helper
    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

    useEffect(() => {
        // Apply theme to body
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            document.body.style.backgroundColor = '#000000';
        } else {
            document.documentElement.classList.remove('dark');
            document.body.style.backgroundColor = '#ffffff';
        }
    }, [isDarkMode]);

    const handleToggleMic = () => {
        if (state.isConnected) disconnect();
        else connect();
    };

    const handleAddProfile = (type: ThemeType) => {
        const newProfile: VisualizerProfile = {
            id: Date.now().toString(),
            name: `New Style`,
            type,
            settings: {
                radius: 100,
                radiusSensitivity: 1,
                displacementSensitivity: 1,
                sizeSensitivity: 1,
                density: 0.5,
                thickness: 2,
                rotationSpeed: type === 'SPHERICAL_PARTICLE' ? 1 : undefined,
                breathingAmount: 5,
                breathingFrequency: 2
            }
        };
        setProfiles([...profiles, newProfile]);
        setActiveProfileId(newProfile.id);
    };

    const handleDuplicate = (id: string) => {
        const profile = profiles.find(p => p.id === id);
        if (!profile) return;
        const newProfile = {
            ...profile,
            id: Date.now().toString(),
            name: `${profile.name} (Copy)`
        };
        setProfiles([...profiles, newProfile]);
        setActiveProfileId(newProfile.id);
    };

    const updateSetting = (key: keyof typeof activeProfile.settings, value: any) => {
        setProfiles(profiles.map(p =>
            p.id === activeProfileId ? { ...p, settings: { ...p.settings, [key]: value } } : p
        ));
    };

    const deleteProfile = (id: string) => {
        if (profiles.length === 1) return;
        const newProfiles = profiles.filter(p => p.id !== id);
        setProfiles(newProfiles);
        if (activeProfileId === id) setActiveProfileId(newProfiles[0].id);
    };

    const renameProfile = (id: string, name: string) => {
        setProfiles(profiles.map(p => p.id === id ? { ...p, name } : p));
        setEditingProfileId(null);
    };

    // Export as HTML File
    const handleExport = (profileToExport: VisualizerProfile) => {
        const dataStr = JSON.stringify(profileToExport);
        // Standalone Visualizer Engine Script
        const visualizerEngineScript = `
    const profile = JSON.parse(document.getElementById('nora-profile-data').textContent);
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    let mode = 'LISTENING';
    let time = 0;
    let particles = [];
    let intensity = 0;
    let simInput = 0;
    let simOutput = 0;
    let isDark = true;

    function getColors() {
        if (isDark) {
            return {
                primary: 'rgba(255, 255, 255, 0.9)',
                secondary: 'rgba(255, 255, 255, 0.4)',
                accent: '255, 255, 255'
            };
        } else {
            return {
                primary: 'rgba(0, 0, 0, 0.9)',
                secondary: 'rgba(0, 0, 0, 0.4)',
                accent: '0, 0, 0'
            };
        }
    }

    function updateTheme() {
        document.body.style.background = isDark ? '#000' : '#fff';
        document.body.style.color = isDark ? '#fff' : '#000';
        document.querySelectorAll('button').forEach(btn => {
            btn.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
            btn.style.borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
            btn.style.color = isDark ? 'white' : 'black';
        });
        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) themeBtn.textContent = isDark ? '☀️' : '🌙';
    }

    function init() {
        resize();
        window.addEventListener('resize', resize);
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                mode = e.target.dataset.mode;
                document.querySelectorAll('.mode-btn').forEach(b => b.style.opacity = '0.5');
                e.target.style.opacity = '1';
            });
        });

        document.getElementById('theme-btn').addEventListener('click', () => {
            isDark = !isDark;
            updateTheme();
        });

        const settings = profile.settings;
        const width = canvas.width; // Initial read
        const height = canvas.height;
        // Count depends on settings, not screen size
        const count = Math.floor(50 + settings.density * 250);

        particles = [];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            particles.push({
                angle, 
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.5,
                theta: Math.random() * 2 * Math.PI,
                phi: Math.acos(2 * Math.random() - 1)
            });
        }
        animate();
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // DRAW FUNCTIONS - Mirrored from React implementation with dynamic sizing
    function drawParticleCircle(w, h, time, intensity, settings, color) {
        const centerX = w / 2;
        const centerY = h / 2;
        const baseRadius = Math.min(w, h) * (settings.radius / 800);
        
        const freq = settings.breathingFrequency || 2;
        const amount = settings.breathingAmount || 5;
        const breathe = Math.sin(time * freq) * amount;
        const radiusExpansion = intensity * 40 * settings.radiusSensitivity;
        const displacementScale = intensity * 20 * settings.displacementSensitivity;

        ctx.fillStyle = color;
        particles.forEach(p => {
            const noise = Math.sin(p.angle * 10 + time * 5) * Math.cos(p.angle * 5 - time * 2);
            
            // SIMULATED FREQUENCY DATA
            let spectralDisplacement = 0;
            if (intensity > 0.05) {
                // Fake spikes based on angle
                const spike = Math.abs(Math.sin(p.angle * 8 + time * 2));
                spectralDisplacement = spike * intensity * 80 * settings.displacementSensitivity;
            }

            let size = p.size;
            if (intensity > 0.1) size += (intensity * 2 * settings.displacementSensitivity);
            const dynamicR = baseRadius + breathe + radiusExpansion + spectralDisplacement + (noise * displacementScale);
            let x = centerX + Math.cos(p.angle) * dynamicR;
            let y = centerY + Math.sin(p.angle) * dynamicR;
            
            if (mode === 'SEARCHING') {
                const orbitSpeed = time * 4;
                x = centerX + Math.cos(p.angle + orbitSpeed) * (baseRadius + Math.sin(time*5)*10);
                y = centerY + Math.sin(p.angle + orbitSpeed) * (baseRadius + Math.sin(time*5)*10);
            }
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.globalAlpha = p.opacity;
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
    
    function drawStraightLine(w, h, time, intensity, settings, color, secColor) {
        ctx.strokeStyle = color;
        ctx.lineWidth = settings.thickness;
        ctx.lineCap = 'round';
        const centerY = h / 2;
        const points = Math.floor(10 + settings.density * 190);
        const spacing = w / points;
        const amplitude = 50 * intensity * settings.displacementSensitivity;

        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
            const x = i * spacing;
            let offset = Math.sin(i * 0.1 + time) * 5;
            if (intensity > 0.001) {
                const edge = Math.sin((i / points) * Math.PI);
                offset += (Math.sin(i * 0.2 + time * 10) + Math.cos(i * 0.5 - time * 8)) * amplitude * edge;
            }
            if (mode === 'SEARCHING') offset = Math.sin(i * 0.2 - time * 10) * 20 * Math.sin((i/points) * Math.PI);
            i === 0 ? ctx.moveTo(x, centerY + offset) : ctx.lineTo(x, centerY + offset);
        }
        ctx.stroke();
    }

    function drawSimpleCircle(w, h, time, intensity, settings, color, secColor, isDark) {
        const centerX = w / 2;
        const centerY = h / 2;
        const baseR = Math.min(w, h) * (settings.radius / 800);
        const freq = settings.breathingFrequency || 1.5;
        const amount = settings.breathingAmount || 5;
        const breathe = Math.sin(time * freq) * amount;
        const r = baseR + breathe + (intensity * 60 * settings.radiusSensitivity);

        if (mode === 'SEARCHING') {
            ctx.beginPath();
            ctx.strokeStyle = secColor;
            ctx.lineWidth = 2;
            ctx.arc(centerX, centerY, baseR + Math.sin(time*10)*5 + 30, time*5, time*5 + Math.PI*1.5);
            ctx.stroke();
        }

        ctx.fillStyle = isDark ? '#000' : '#fff';
        ctx.strokeStyle = color;
        ctx.lineWidth = settings.thickness;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (intensity > 0.05) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, Math.min(r, r * intensity * 0.8 * settings.displacementSensitivity), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawCircleRadius(w, h, time, intensity, settings, accent) {
        const centerX = w / 2;
        const centerY = h / 2;
        const freq = settings.breathingFrequency || 1;
        const amount = settings.breathingAmount || 0;
        const breathe = Math.sin(time * freq) * amount;
        const r = (Math.min(w, h) * (settings.radius / 800) * 3) + (intensity * 100 * settings.radiusSensitivity) + breathe;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(time * 0.05);
        ctx.translate(-centerX, -centerY);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(0,r), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + accent + ', 0.05)';
        ctx.fill();
        
        ctx.lineWidth = settings.thickness;
        for(let i=0; i<5; i++) {
            const chaos = intensity * 20 * settings.displacementSensitivity;
            const ringR = r + (i * 15) + Math.sin(time * (mode === 'SEARCHING' ? 10 : 2) - i) * ((intensity * 100 * settings.radiusSensitivity * 0.2) + chaos);
            ctx.beginPath();
            if (mode === 'SEARCHING') ctx.setLineDash([10, 20]); else ctx.setLineDash([]);
            ctx.arc(centerX, centerY, Math.max(0, ringR), 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(' + accent + ',' + (0.6 * (1 - i/5)) + ')';
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawSphericalParticle(w, h, time, intensity, settings, color, secColor) {
        const centerX = w / 2;
        const centerY = h / 2;
        const baseRadius = Math.min(w, h) * (settings.radius / 800) * 2;
        const rotMult = settings.rotationSpeed !== undefined ? settings.rotationSpeed : 1.0;
        let rotSpeedX = (mode === 'SEARCHING' ? 2.0 : 0.5) * rotMult;
        let rotSpeedY = (mode === 'SEARCHING' ? 3.0 : 0.8) * rotMult;
        
        const freq = settings.breathingFrequency || 2;
        const amount = settings.breathingAmount || 5;
        const breathe = Math.sin(time * freq) * amount;
        
        // Searching mode gets pulsing radius
        let currentRadius = baseRadius + (intensity * 50 * settings.radiusSensitivity) + breathe;
        if (mode === 'SEARCHING') {
            currentRadius = baseRadius + Math.sin(time * 3) * 15 + Math.cos(time * 2.3) * 10;
        }
        
        const jitter = intensity * 10 * settings.displacementSensitivity;
        
        ctx.fillStyle = color;
        particles.forEach((p, idx) => {
             const rotX = time * rotSpeedX;
             const rotY = time * rotSpeedY;
             
             // Add wobble for searching mode
             let particleR = currentRadius + (Math.random() - 0.5) * jitter;
             if (mode === 'SEARCHING') {
                 particleR += Math.sin(idx * 0.5 + time * 4) * 8;
             }
             
             let x = particleR * Math.sin(p.phi) * Math.cos(p.theta);
             let y = particleR * Math.sin(p.phi) * Math.sin(p.theta);
             let z = particleR * Math.cos(p.phi);
             let x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
             let z1 = z * Math.cos(rotY) + x * Math.sin(rotY);
             let y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
             let z2 = z1 * Math.cos(rotX) + y * Math.sin(rotX);
             const scale = 300 / (300 + z2);
             const alpha = Math.max(0.1, Math.min(1, scale * p.opacity));
             
             // Dynamic size for searching
             let particleSize = (p.size * scale) + intensity * 2;
             if (mode === 'SEARCHING') {
                 particleSize = (p.size * scale) * (0.8 + Math.sin(time * 5 + idx) * 0.3);
             }
             
             ctx.globalAlpha = alpha;
             ctx.beginPath();
             ctx.arc(centerX + x1 * scale, centerY + y2 * scale, Math.max(0.5, particleSize), 0, Math.PI * 2);
             ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    function animate() {
        if (mode === 'LISTENING') {
            if (Math.random() > 0.95) simInput = Math.random();
            simInput *= 0.9;
            simOutput = 0;
        } else if (mode === 'SPEAKING') {
            simInput = 0;
            simOutput = (Math.sin(time * 5) + 1) * 0.5;
        } else {
            simInput = 0;
            simOutput = 0;
        }
        let target = mode === 'LISTENING' ? simInput : (mode === 'SPEAKING' ? simOutput : 0.2);
        intensity += (target - intensity) * 0.1;
        time += 0.02;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const settings = profile.settings;
        const colors = getColors();
        
        if (profile.type === 'PARTICLE_CIRCLE') drawParticleCircle(canvas.width, canvas.height, time, intensity, settings, colors.primary);
        else if (profile.type === 'STRAIGHT_LINE') drawStraightLine(canvas.width, canvas.height, time, intensity, settings, colors.primary, colors.secondary);
        else if (profile.type === 'SIMPLE_CIRCLE') drawSimpleCircle(canvas.width, canvas.height, time, intensity, settings, colors.primary, colors.secondary, isDark);
        else if (profile.type === 'CIRCLE_RADIUS') drawCircleRadius(canvas.width, canvas.height, time, intensity, settings, colors.accent);
        else if (profile.type === 'SPHERICAL_PARTICLE') drawSphericalParticle(canvas.width, canvas.height, time, intensity, settings, colors.primary, colors.secondary);
        
        requestAnimationFrame(animate);
    }
    init();
    `;

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${profileToExport.name}</title>
    <style>
        body { margin: 0; overflow: hidden; background: #000; color: #fff; font-family: monospace; transition: background 0.3s, color 0.3s; }
        canvas { position: absolute; top: 0; left: 0; }
        #controls { position: absolute; bottom: 30px; left: 0; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 10; }
        button { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 16px; border-radius: 20px; cursor: pointer; opacity: 0.5; transition: all 0.3s; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }
        button:hover { opacity: 0.8; }
        #theme-btn { position: absolute; top: 12px; right: 12px; z-index: 10; opacity: 0.3; font-size: 12px; padding: 4px 8px; border-radius: 12px; background: transparent; border: none; }
        #theme-btn:hover { opacity: 0.6; }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    <button id="theme-btn">☀️</button>
    <div id="controls">
        <button class="mode-btn" data-mode="LISTENING" style="opacity:1">Listening</button>
        <button class="mode-btn" data-mode="SPEAKING">Speaking</button>
        <button class="mode-btn" data-mode="SEARCHING">Searching</button>
    </div>
    <script id="nora-profile-data" type="application/json">${dataStr}</script>
    <script>${visualizerEngineScript}</script>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${profileToExport.name.replace(/\s+/g, '_')}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            try {
                const match = text.match(/<script id="nora-profile-data" type="application\/json">([\s\S]*?)<\/script>/);
                let jsonString = match ? match[1] : text;

                const profile = JSON.parse(jsonString);
                if (profile && profile.type && profile.settings) {
                    const newProfile = { ...profile, id: Date.now().toString(), name: `Imported ${profile.name}` };
                    setProfiles([...profiles, newProfile]);
                    setActiveProfileId(newProfile.id);
                } else {
                    alert("Invalid profile file.");
                }
            } catch (err) {
                alert("Could not parse profile.");
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset
    };

    const effectiveMode = previewMode || state.mode;

    const getThemeIcon = (type: ThemeType) => {
        switch (type) {
            case 'PARTICLE_CIRCLE': return <Aperture size={16} />;
            case 'STRAIGHT_LINE': return <Activity size={16} />;
            case 'SIMPLE_CIRCLE': return <Circle size={16} />;
            case 'CIRCLE_RADIUS': return <Disc size={16} />;
            case 'SPHERICAL_PARTICLE': return <Globe size={16} />;
        }
    };

    const showRadius = activeProfile.type !== 'STRAIGHT_LINE';
    const showRadiusSensitivity = activeProfile.type !== 'STRAIGHT_LINE';
    const showDisplacementSensitivity = true;
    const showSizeSensitivity = ['PARTICLE_CIRCLE', 'SPHERICAL_PARTICLE'].includes(activeProfile.type);
    const showDensity = ['PARTICLE_CIRCLE', 'STRAIGHT_LINE', 'SPHERICAL_PARTICLE'].includes(activeProfile.type);
    const showThickness = ['STRAIGHT_LINE', 'SIMPLE_CIRCLE', 'CIRCLE_RADIUS'].includes(activeProfile.type);
    const showBreathing = ['PARTICLE_CIRCLE', 'SIMPLE_CIRCLE', 'CIRCLE_RADIUS', 'SPHERICAL_PARTICLE'].includes(activeProfile.type);
    const showRotation = activeProfile.type === 'SPHERICAL_PARTICLE';

    return (
        <div className={`h-[100dvh] w-full flex flex-col md:block overflow-hidden transition-colors duration-500 font-mono ${isDarkMode ? 'text-white bg-black' : 'text-black bg-white'}`}>

            {/* --- Visualizer Area --- */}
            <div className={`
        relative w-full transition-all duration-300
        ${showSettings
                    ? 'h-[40vh] md:h-full md:absolute md:inset-0'
                    : 'h-full md:absolute md:inset-0'
                }
      `}>
                <NoraVisualizer
                    mode={effectiveMode}
                    getVolumeLevels={getVolumeLevels}
                    profile={activeProfile}
                    isDarkMode={isDarkMode}
                />

                {/* --- Minimal Controls (Moved inside visualizer container) --- */}
                <div className="absolute bottom-4 left-0 w-full flex justify-center items-center gap-6 z-10">
                    {/* Settings */}
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-3 rounded-full border transition-all hover:scale-105 backdrop-blur-sm ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/5'}`}
                    >
                        <Settings size={18} />
                    </button>

                    {/* Mic Toggle */}
                    <button
                        onClick={handleToggleMic}
                        className={`
                w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 backdrop-blur-sm
                ${state.isConnected
                                ? 'bg-transparent border-current animate-pulse'
                                : `bg-transparent ${isDarkMode ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'}`
                            }
            `}
                    >
                        {state.isConnected ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`p-3 rounded-full border transition-all hover:scale-105 backdrop-blur-sm ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/5'}`}
                    >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>

                {/* Error Message */}
                {state.error && (
                    <div className="absolute top-8 w-full text-center pointer-events-none">
                        <p className="inline-block text-red-500 text-xs bg-red-100 dark:bg-red-900 px-2 py-1 rounded">{state.error}</p>
                    </div>
                )}

            </div>

            {/* --- Settings Drawer --- */}
            {showSettings && (
                <div className={`
            w-full h-[60vh] md:h-full md:w-96 
            md:absolute md:top-0 md:left-0 
            overflow-y-auto 
            p-8 shadow-2xl z-20 
            flex flex-col gap-8 
            backdrop-blur-md border-t md:border-t-0 md:border-r 
            ${isDarkMode ? 'bg-black/90 border-white/10' : 'bg-white/90 border-black/10'}
        `}>

                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold tracking-widest uppercase">Configuration</h2>
                        <button onClick={() => setShowSettings(false)}><X size={24} /></button>
                    </div>

                    {/* Project Actions */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-end border-b pb-2 border-current opacity-50">
                            <span className="text-xs font-bold uppercase tracking-wider">Cloud Storage</span>
                            {!supabase.isConfigured && (
                                <span className="text-xs opacity-50">Not configured</span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                disabled={!supabase.isConfigured || supabase.isLoading}
                                onClick={async () => {
                                    const id = await supabase.saveProfile(activeProfile);
                                    if (id) {
                                        showNotification('success', 'Profile saved!');
                                    } else {
                                        showNotification('error', supabase.error || 'Failed to save');
                                    }
                                }}
                                className={`py-2 flex items-center justify-center gap-2 text-xs uppercase border rounded transition-all ${supabase.isConfigured
                                    ? `${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'}`
                                    : 'opacity-40 cursor-not-allowed'
                                    } ${isDarkMode ? 'border-white/20' : 'border-black/20'}`}
                                title={supabase.isConfigured ? 'Save profile to cloud' : 'Configure Supabase to enable'}
                            >
                                {supabase.isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save
                            </button>
                            <button
                                disabled={!supabase.isConfigured || supabase.isLoading}
                                onClick={() => {
                                    setSaveAsName(activeProfile.name + ' Copy');
                                    setShowSaveAsDialog(true);
                                }}
                                className={`py-2 flex items-center justify-center gap-2 text-xs uppercase border rounded transition-all ${supabase.isConfigured
                                    ? `${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'}`
                                    : 'opacity-40 cursor-not-allowed'
                                    } ${isDarkMode ? 'border-white/20' : 'border-black/20'}`}
                                title={supabase.isConfigured ? 'Save as new profile' : 'Configure Supabase to enable'}
                            >
                                <Copy size={14} />
                                Save As
                            </button>
                            <button
                                disabled={!supabase.isConfigured || supabase.isLoading}
                                onClick={async () => {
                                    const reloaded = await supabase.reloadProfile(activeProfile.id);
                                    if (reloaded) {
                                        setProfiles(profiles.map(p => p.id === reloaded.id ? reloaded : p));
                                        showNotification('success', 'Changes discarded');
                                    } else {
                                        showNotification('error', 'Profile not saved to cloud yet');
                                    }
                                }}
                                className={`py-2 flex items-center justify-center gap-2 text-xs uppercase border rounded transition-all ${supabase.isConfigured
                                    ? `${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'}`
                                    : 'opacity-40 cursor-not-allowed'
                                    } ${isDarkMode ? 'border-white/20' : 'border-black/20'}`}
                                title={supabase.isConfigured ? 'Reload from cloud (discard changes)' : 'Configure Supabase to enable'}
                            >
                                <X size={14} />
                                Ignore Edits
                            </button>
                            <button
                                disabled={!supabase.isConfigured || supabase.isLoading}
                                onClick={async () => {
                                    // First save the profile, then set as default
                                    await supabase.saveProfile(activeProfile);
                                    const success = await supabase.setDefaultTemplate(activeProfile.type, activeProfile.id);
                                    if (success) {
                                        showNotification('success', `Set as default for ${activeProfile.type.replace(/_/g, ' ')}`);
                                    } else {
                                        showNotification('error', supabase.error || 'Failed to set default');
                                    }
                                }}
                                className={`py-2 flex items-center justify-center gap-2 text-xs uppercase border rounded transition-all ${supabase.isConfigured
                                    ? `${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'}`
                                    : 'opacity-40 cursor-not-allowed'
                                    } ${isDarkMode ? 'border-white/20' : 'border-black/20'}`}
                                title={supabase.isConfigured ? 'Set as default template for this type' : 'Configure Supabase to enable'}
                            >
                                <Check size={14} />
                                Set Default
                            </button>
                        </div>
                        {!supabase.isConfigured && (
                            <p className={`text-xs opacity-40 italic ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local
                            </p>
                        )}
                    </div>

                    {/* Import/Export */}
                    <div className="flex gap-2">
                        <button onClick={() => handleExport(activeProfile)} className={`flex-1 py-2 flex items-center justify-center gap-2 text-xs uppercase border rounded ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'}`}>
                            <Download size={14} /> Export Current
                        </button>
                        <button onClick={handleImportClick} className={`flex-1 py-2 flex items-center justify-center gap-2 text-xs uppercase border rounded ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'}`}>
                            <Upload size={14} /> Import HTML
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".html,.json" onChange={handleFileChange} />
                    </div>

                    {/* Profile Manager */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end border-b pb-2 border-current opacity-50">
                            <span className="text-xs font-bold uppercase tracking-wider">Profiles</span>
                        </div>

                        {/* Add New */}
                        <div className="grid grid-cols-5 gap-2 mb-4">
                            {(['PARTICLE_CIRCLE', 'STRAIGHT_LINE', 'SIMPLE_CIRCLE', 'CIRCLE_RADIUS', 'SPHERICAL_PARTICLE'] as ThemeType[]).map(t => (
                                <button key={t} onClick={() => handleAddProfile(t)} className={`flex items-center justify-center p-2 rounded border ${isDarkMode ? 'border-white/20 hover:bg-white/20' : 'border-black/20 hover:bg-black/5'}`} title={`Add ${t}`}>
                                    {getThemeIcon(t)}
                                    <Plus size={10} className="ml-1" />
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
                            {profiles.map(p => (
                                <div key={p.id} className={`group flex items-center justify-between p-3 rounded border cursor-pointer transition-all ${activeProfileId === p.id ? (isDarkMode ? 'border-white bg-white/10' : 'border-black bg-black/5') : 'border-transparent hover:opacity-70'}`}
                                    onClick={() => setActiveProfileId(p.id)}
                                >
                                    {editingProfileId === p.id ? (
                                        <input
                                            autoFocus
                                            className="bg-transparent border-b border-current outline-none w-full text-sm font-mono"
                                            defaultValue={p.name}
                                            onBlur={(e) => renameProfile(p.id, e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && renameProfile(p.id, (e.target as HTMLInputElement).value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            {getThemeIcon(p.type)}
                                            <span className="text-sm font-medium truncate max-w-[100px]">{p.name}</span>
                                        </div>
                                    )}

                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                                        <button onClick={(e) => { e.stopPropagation(); handleDuplicate(p.id); }} className="hover:scale-110" title="Duplicate"><Copy size={14} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleExport(p); }} className="hover:scale-110" title="Export this profile"><Save size={14} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); setEditingProfileId(p.id); }} className="hover:scale-110"><Edit2 size={14} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); deleteProfile(p.id); }} className="hover:text-red-500"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Parameters */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-end border-b pb-2 border-current opacity-50">
                            <span className="text-xs font-bold uppercase tracking-wider">Parameters</span>
                        </div>

                        <div className="space-y-4">
                            {showRadius && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono opacity-70"><span>BASE RADIUS</span> <span>{activeProfile.settings.radius}</span></div>
                                    <input
                                        type="range" min="20" max="300"
                                        value={activeProfile.settings.radius}
                                        onChange={(e) => updateSetting('radius', Number(e.target.value))}
                                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                    />
                                </div>
                            )}

                            {showBreathing && (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-mono opacity-70"><span>BREATHING AMOUNT</span> <span>{activeProfile.settings.breathingAmount || 0}</span></div>
                                        <input
                                            type="range" min="0" max="20" step="1"
                                            value={activeProfile.settings.breathingAmount || 0}
                                            onChange={(e) => updateSetting('breathingAmount', Number(e.target.value))}
                                            className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-mono opacity-70"><span>BREATHING FREQ</span> <span>{activeProfile.settings.breathingFrequency || 1}</span></div>
                                        <input
                                            type="range" min="0.1" max="5.0" step="0.1"
                                            value={activeProfile.settings.breathingFrequency || 1}
                                            onChange={(e) => updateSetting('breathingFrequency', Number(e.target.value))}
                                            className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                        />
                                    </div>
                                </>
                            )}

                            {showRotation && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono opacity-70"><span>ROTATION SPEED</span> <span>{activeProfile.settings.rotationSpeed || 1}</span></div>
                                    <input
                                        type="range" min="0.0" max="5.0" step="0.1"
                                        value={activeProfile.settings.rotationSpeed !== undefined ? activeProfile.settings.rotationSpeed : 1.0}
                                        onChange={(e) => updateSetting('rotationSpeed', Number(e.target.value))}
                                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                    />
                                </div>
                            )}

                            {showRadiusSensitivity && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono opacity-70"><span>RADIUS SENSITIVITY</span> <span>{activeProfile.settings.radiusSensitivity.toFixed(1)}</span></div>
                                    <input
                                        type="range" min="0.0" max="5.0" step="0.1"
                                        value={activeProfile.settings.radiusSensitivity}
                                        onChange={(e) => updateSetting('radiusSensitivity', Number(e.target.value))}
                                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                    />
                                </div>
                            )}

                            {showDisplacementSensitivity && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono opacity-70"><span>DISPLACEMENT SENSITIVITY</span> <span>{activeProfile.settings.displacementSensitivity.toFixed(1)}</span></div>
                                    <input
                                        type="range" min="0.0" max="5.0" step="0.1"
                                        value={activeProfile.settings.displacementSensitivity}
                                        onChange={(e) => updateSetting('displacementSensitivity', Number(e.target.value))}
                                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                    />
                                </div>
                            )}

                            {showSizeSensitivity && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono opacity-70"><span>SIZE SENSITIVITY</span> <span>{(activeProfile.settings.sizeSensitivity || 1).toFixed(1)}</span></div>
                                    <input
                                        type="range" min="0.0" max="3.0" step="0.1"
                                        value={activeProfile.settings.sizeSensitivity || 1}
                                        onChange={(e) => updateSetting('sizeSensitivity', Number(e.target.value))}
                                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                    />
                                </div>
                            )}

                            {showDensity && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono opacity-70"><span>DENSITY / DETAIL</span> <span>{(activeProfile.settings.density * 100).toFixed(0)}%</span></div>
                                    <input
                                        type="range" min="0.1" max="1.0" step="0.1"
                                        value={activeProfile.settings.density}
                                        onChange={(e) => updateSetting('density', Number(e.target.value))}
                                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                    />
                                </div>
                            )}

                            {showThickness && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono opacity-70"><span>THICKNESS</span> <span>{activeProfile.settings.thickness}px</span></div>
                                    <input
                                        type="range" min="1" max="20"
                                        value={activeProfile.settings.thickness}
                                        onChange={(e) => updateSetting('thickness', Number(e.target.value))}
                                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-white/20 accent-white' : 'bg-black/20 accent-black'}`}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mode Simulation */}
                    <div className="space-y-4 pb-8">
                        <div className="flex justify-between items-end border-b pb-2 border-current opacity-50">
                            <span className="text-xs font-bold uppercase tracking-wider">Simulation</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setPreviewMode(null)} className={`px-3 py-2 rounded text-xs border uppercase tracking-wider ${!previewMode ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white') : 'opacity-50'}`}>Auto</button>
                            <button onClick={() => setPreviewMode(AgentMode.LISTENING)} className={`px-3 py-2 rounded text-xs border uppercase tracking-wider ${previewMode === AgentMode.LISTENING ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white') : 'opacity-50'}`}>Listening</button>
                            <button onClick={() => setPreviewMode(AgentMode.SPEAKING)} className={`px-3 py-2 rounded text-xs border uppercase tracking-wider ${previewMode === AgentMode.SPEAKING ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white') : 'opacity-50'}`}>Speaking</button>
                            <button onClick={() => setPreviewMode(AgentMode.SEARCHING)} className={`px-3 py-2 rounded text-xs border uppercase tracking-wider ${previewMode === AgentMode.SEARCHING ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white') : 'opacity-50'}`}>Searching</button>
                        </div>
                    </div>

                    {/* Save Copy Button */}
                    <div className="pt-4 border-t border-current opacity-80">
                        <button
                            onClick={() => handleDuplicate(activeProfileId)}
                            className={`w-full py-3 flex items-center justify-center gap-2 text-xs uppercase font-bold tracking-wider border rounded transition-colors ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'}`}
                        >
                            <Copy size={14} /> Save Copy (Ignore Duplicate)
                        </button>
                    </div>

                    {/* API Settings */}
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
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your Gemini API key"
                                    className={`w-full px-3 py-2 pr-16 rounded border text-sm font-mono ${isDarkMode ? 'bg-black/50 border-white/20 text-white placeholder-white/30' : 'bg-white/50 border-black/20 text-black placeholder-black/30'}`}
                                />
                                <button
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs uppercase px-2 py-1 rounded ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                                >
                                    {showApiKey ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            <p className={`text-xs opacity-50 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                Your API key is stored locally in your browser.
                            </p>
                        </div>
                    </div>

                </div>
            )}

            {/* Save As Dialog */}
            {showSaveAsDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className={`p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                        <h3 className="text-lg font-bold mb-4">Save Profile As</h3>
                        <input
                            type="text"
                            value={saveAsName}
                            onChange={(e) => setSaveAsName(e.target.value)}
                            placeholder="Profile name"
                            className={`w-full p-2 rounded border mb-4 ${isDarkMode ? 'bg-black border-white/20' : 'bg-white border-black/20'}`}
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowSaveAsDialog(false)}
                                className={`px-4 py-2 rounded ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    const newId = await supabase.saveProfileAs(activeProfile, saveAsName);
                                    if (newId) {
                                        const newProfile = { ...activeProfile, id: newId, name: saveAsName };
                                        setProfiles([...profiles, newProfile]);
                                        setActiveProfileId(newId);
                                        showNotification('success', 'Profile saved!');
                                    } else {
                                        showNotification('error', supabase.error || 'Failed to save');
                                    }
                                    setShowSaveAsDialog(false);
                                }}
                                disabled={!saveAsName.trim() || supabase.isLoading}
                                className={`px-4 py-2 rounded ${isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
                            >
                                {supabase.isLoading ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {notification.message}
                </div>
            )}

        </div>
    );
};

export default App;

