import React, { useEffect, useRef } from 'react';
import { AgentMode, AudioLevels, VisualizerProfile } from '../types';

interface NoraVisualizerProps {
    mode: AgentMode;
    getVolumeLevels: () => AudioLevels;
    profile: VisualizerProfile;
    isDarkMode: boolean;
}

// Internal Particle Structure
interface Particle {
    x: number;
    y: number;
    baseX: number;
    baseY: number;
    angle: number;
    distance: number;
    size: number;
    opacity: number;
    // 3D properties
    theta?: number;
    phi?: number;
    // Fade properties
    fadePhase: number;
    fadeSpeed: number;
    // Per-particle variation for smooth, uneven behavior
    sizeMultiplier: number;        // Unique factor for audio-reactive size (0.3-1.7)
    noiseOffsetX: number;          // Unique time offset for X displacement noise
    noiseOffsetY: number;          // Unique time offset for Y displacement noise
    displacementMultiplier: number; // Unique factor for displacement amount (0.5-1.5)
}

export const NoraVisualizer: React.FC<NoraVisualizerProps> = ({ mode, getVolumeLevels, profile, isDarkMode }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const timeRef = useRef<number>(0);
    const intensityRef = useRef<number>(0);
    const particlesRef = useRef<Particle[]>([]);

    // Initialize particles when theme/density changes
    useEffect(() => {
        // Just init the persistent properties (angle, phase, 3D coords).
        const particleCount = Math.floor(50 + profile.settings.density * 250);

        const newParticles: Particle[] = [];
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            // Radius will be calculated dynamically in draw
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);

            newParticles.push({
                x: 0, y: 0, baseX: 0, baseY: 0, // Placeholder
                size: Math.random() * 2 + 1,
                angle: angle,
                distance: 100, // Placeholder
                opacity: Math.random() * 0.5 + 0.5,
                theta,
                phi,
                fadePhase: Math.random() * Math.PI * 2, // Random starting phase
                fadeSpeed: 0.5 + Math.random() * 1.5, // Random fade speed
                // Per-particle variation for organic, uneven behavior
                sizeMultiplier: 0.3 + Math.random() * 1.4, // Range 0.3-1.7 for varied size response
                noiseOffsetX: Math.random() * Math.PI * 2,  // Unique phase offset for X noise
                noiseOffsetY: Math.random() * Math.PI * 2,  // Unique phase offset for Y noise
                displacementMultiplier: 0.5 + Math.random(), // Range 0.5-1.5 for varied displacement
            });
        }
        particlesRef.current = newParticles;
    }, [profile.type, profile.settings.density, profile.settings.radius]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            const { input, output, inputFrequencies, outputFrequencies } = getVolumeLevels();
            timeRef.current += 0.02;

            // --- Resize Logic ---
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            const displayWidth = Math.floor(rect.width * dpr);
            const displayHeight = Math.floor(rect.height * dpr);

            if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
                canvas.width = displayWidth;
                canvas.height = displayHeight;
                ctx.scale(dpr, dpr);
            }

            const width = rect.width;
            const height = rect.height;

            // --- Intensity Logic ---
            let targetIntensity = 0;
            if (mode === AgentMode.LISTENING) {
                targetIntensity = Math.max(0, (input - 0.05) * 1.5);
            } else if (mode === AgentMode.SPEAKING) {
                targetIntensity = output * 2.5;
            } else if (mode === AgentMode.SEARCHING) {
                targetIntensity = 0.15 + (Math.sin(timeRef.current * 5) * 0.05);
            }

            intensityRef.current += (targetIntensity - intensityRef.current) * 0.15;
            const intensity = Math.max(0, intensityRef.current);

            // Determine active frequency data
            let freqData: Uint8Array | undefined;
            if (mode === AgentMode.SPEAKING) {
                freqData = outputFrequencies;
            } else if (mode === AgentMode.LISTENING) {
                freqData = inputFrequencies;
            }

            // Clear
            ctx.clearRect(0, 0, width, height);

            const primaryColor = isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
            const secondaryColor = isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
            const accentRGB = isDarkMode ? '255, 255, 255' : '0, 0, 0';

            if (profile.type === 'PARTICLE_CIRCLE') {
                drawParticleCircle(ctx, width, height, timeRef.current, intensity, particlesRef.current, profile.settings, mode, primaryColor, freqData);
            }
            else if (profile.type === 'STRAIGHT_LINE') {
                drawStraightLine(ctx, width, height, timeRef.current, intensity, profile.settings, mode, primaryColor, secondaryColor);
            }
            else if (profile.type === 'SIMPLE_CIRCLE') {
                drawSimpleCircle(ctx, width, height, timeRef.current, intensity, profile.settings, mode, primaryColor, secondaryColor, isDarkMode);
            }
            else if (profile.type === 'CIRCLE_RADIUS') {
                drawCircleRadius(ctx, width, height, timeRef.current, intensity, profile.settings, mode, accentRGB);
            }
            else if (profile.type === 'SPHERICAL_PARTICLE') {
                drawSphericalParticle(ctx, width, height, timeRef.current, intensity, particlesRef.current, profile.settings, mode, primaryColor, secondaryColor);
            }

            requestRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(requestRef.current);
        };
    }, [mode, getVolumeLevels, profile, isDarkMode]);

    return (
        <div className="w-full h-full">
            <canvas
                ref={canvasRef}
                className="w-full h-full block"
            />
        </div>
    );
};

// --- Drawing Implementations (Coordinates relative to passed width/height) ---

function drawParticleCircle(
    ctx: CanvasRenderingContext2D, w: number, h: number, time: number, intensity: number,
    particles: Particle[], settings: any, mode: AgentMode, color: string, freqData?: Uint8Array
) {
    const centerX = w / 2;
    const centerY = h / 2;
    const baseRadius = Math.min(w, h) * (settings.radius / 800);

    const freq = settings.breathingFrequency || 2;
    const amount = settings.breathingAmount || 5;
    const breathe = Math.sin(time * freq) * amount;

    const radiusExpansion = intensity * 40 * settings.radiusSensitivity;
    const sizeSensitivity = settings.sizeSensitivity !== undefined ? settings.sizeSensitivity : 1.0;

    ctx.fillStyle = color;

    // Precompute weighted average frequency (bass-heavy) for size pulsing
    let weightedAvgFreq = 0;
    if (freqData && freqData.length > 0) {
        let weightedSum = 0;
        let totalWeight = 0;
        for (let i = 0; i < freqData.length; i++) {
            // Weight bass frequencies (low indices) more heavily
            const weight = 1 - (i / freqData.length) * 0.7; // Bass gets 1.0, highs get 0.3
            weightedSum += freqData[i] * weight;
            totalWeight += weight;
        }
        weightedAvgFreq = weightedSum / totalWeight / 255;
    }

    particles.forEach((p, idx) => {
        // Smooth organic noise using per-particle offsets for unique timing
        // Slower time progression for gentler, flowing movement
        const slowTime = time * 0.3; // Even slower for smoother motion

        // Each particle has unique noise patterns due to noiseOffsetX/Y
        const wave1 = Math.sin(p.angle * 3 + slowTime + p.noiseOffsetX) * 0.5;
        const wave2 = Math.cos(p.angle * 2 - slowTime * 0.7 + p.noiseOffsetY) * 0.3;
        const wave3 = Math.sin(p.angle * 5 + slowTime * 0.8 + p.noiseOffsetX * 0.5) * 0.2;

        // Apply per-particle displacement multiplier for varied displacement amounts
        const organicNoise = (wave1 + wave2 + wave3) * settings.displacementSensitivity * 8 * p.displacementMultiplier;

        // Even spectral displacement around the entire circle with frequency weighting
        let spectralDisplacement = 0;
        if (freqData && freqData.length > 0) {
            // Map angle to frequency bin evenly across the full circle
            const angleNorm = p.angle / (Math.PI * 2); // 0..1

            // Sample from frequency data with wrapping
            const freqLen = freqData.length;
            const primaryIdx = Math.floor(angleNorm * freqLen) % freqLen;
            const nextIdx = (primaryIdx + 1) % freqLen;
            const blend = (angleNorm * freqLen) % 1;

            // Blend between adjacent frequencies for smoothness
            const val1 = freqData[primaryIdx] || 0;
            const val2 = freqData[nextIdx] || 0;
            let val = val1 * (1 - blend) + val2 * blend;

            // Apply frequency weighting - reduce high frequency impact
            const freqWeight = 1 - (primaryIdx / freqLen) * 0.6; // Bass: 1.0, Treble: 0.4
            val = val * freqWeight;

            // Noise gate to prevent low-level displacement
            const noiseGateThreshold = 50;
            if (val < noiseGateThreshold) {
                val = 0;
            } else {
                // Gradual ramp after threshold
                val = (val - noiseGateThreshold) * (255 / (255 - noiseGateThreshold));
            }

            // Smooth displacement based on frequency, with per-particle variation
            spectralDisplacement = (val / 255) * 40 * settings.displacementSensitivity * p.displacementMultiplier;
        }

        // Particle size with UNEVEN distribution using per-particle sizeMultiplier
        let size = p.size;
        // Size boost from overall intensity - varied per particle
        const sizeBoost = intensity * 3 * sizeSensitivity * p.sizeMultiplier;
        // Additional pulsing based on weighted average frequency - also varied per particle
        const sizePulse = weightedAvgFreq * 3 * sizeSensitivity * p.sizeMultiplier;
        size = Math.max(0.5, size + sizeBoost + sizePulse);

        // Combine all displacement components smoothly
        const dynamicR = baseRadius + breathe + radiusExpansion + spectralDisplacement + organicNoise;

        let x = centerX + Math.cos(p.angle) * dynamicR;
        let y = centerY + Math.sin(p.angle) * dynamicR;

        if (mode === AgentMode.SEARCHING) {
            const orbitSpeed = time * 2; // Slower orbit for smoother searching animation
            const pulse = Math.sin(time * 3) * 8;
            x = centerX + Math.cos(p.angle + orbitSpeed) * (baseRadius + pulse);
            y = centerY + Math.sin(p.angle + orbitSpeed) * (baseRadius + pulse);
            size = p.size * 0.8; // Slightly smaller during search
        }

        // Calculate fade effect
        const particleFade = settings.particleFade !== undefined ? settings.particleFade : 0;
        const noiseScale = settings.noiseScale !== undefined ? settings.noiseScale : 1;

        let fadeAlpha = p.opacity;
        if (particleFade > 0) {
            // Apply noise-based fade timing
            const noiseOffset = Math.sin(p.angle * noiseScale * 3 + time * 0.3) * 0.5;
            const fadeValue = Math.sin(time * p.fadeSpeed + p.fadePhase + noiseOffset);
            // Map sine wave to fade: -1 to 1 -> 0 to 1, then apply particleFade amount
            fadeAlpha = p.opacity * (1 - particleFade + particleFade * (fadeValue * 0.5 + 0.5));
        }

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.globalAlpha = fadeAlpha;
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;
}

function drawStraightLine(
    ctx: CanvasRenderingContext2D, w: number, h: number, time: number, intensity: number,
    settings: any, mode: AgentMode, color: string, secondaryColor: string
) {
    ctx.strokeStyle = color;
    ctx.lineWidth = settings.thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const centerY = h / 2;
    const points = Math.floor(10 + settings.density * 190);
    const spacing = w / points;

    const amplitude = 50 * intensity * settings.displacementSensitivity;

    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
        const x = i * spacing;
        let offset = Math.sin(i * 0.1 + time) * 5;

        if (intensity > 0.001) {
            const edgeFactor = Math.sin((i / points) * Math.PI);
            const wave1 = Math.sin(i * 0.2 + time * 10);
            const wave2 = Math.cos(i * 0.5 - time * 8);
            offset += (wave1 + wave2) * amplitude * edgeFactor;
        }

        if (mode === AgentMode.SEARCHING) {
            const travel = Math.sin(i * 0.2 - time * 10) * 20 * Math.sin((i / points) * Math.PI);
            offset = travel;
        }

        if (i === 0) ctx.moveTo(x, centerY + offset);
        else ctx.lineTo(x, centerY + offset);
    }
    ctx.stroke();

    if (mode === AgentMode.SPEAKING) {
        ctx.beginPath();
        ctx.strokeStyle = secondaryColor;
        for (let i = 0; i <= points; i++) {
            const x = i * spacing;
            const edgeFactor = Math.sin((i / points) * Math.PI);
            const offset = -(Math.sin(i * 0.2 + time * 10) + Math.cos(i * 0.5 - time * 8)) * amplitude * edgeFactor * 0.5;
            if (i === 0) ctx.moveTo(x, centerY + offset);
            else ctx.lineTo(x, centerY + offset);
        }
        ctx.stroke();
    }
}

function drawSimpleCircle(
    ctx: CanvasRenderingContext2D, w: number, h: number, time: number, intensity: number,
    settings: any, mode: AgentMode, color: string, secondaryColor: string, isDark: boolean
) {
    const centerX = w / 2;
    const centerY = h / 2;
    const baseR = Math.min(w, h) * (settings.radius / 800);

    const freq = settings.breathingFrequency || 1.5;
    const amount = settings.breathingAmount || 5;
    const breathe = Math.sin(time * freq) * amount;

    const radiusReaction = intensity * 60 * settings.radiusSensitivity;

    let r = baseR + breathe + radiusReaction;

    if (mode === AgentMode.SEARCHING) {
        r = baseR + Math.sin(time * 10) * 5;
        ctx.beginPath();
        ctx.strokeStyle = secondaryColor;
        ctx.lineWidth = 2;
        const startAngle = time * 5;
        const endAngle = startAngle + Math.PI * 1.5;
        ctx.arc(centerX, centerY, r + 30, startAngle, endAngle);
        ctx.stroke();
    }

    ctx.fillStyle = isDark ? '#000000' : '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = settings.thickness;

    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (intensity > 0.05) {
        ctx.fillStyle = color;
        ctx.beginPath();
        const innerR = r * intensity * 0.8 * settings.displacementSensitivity;
        ctx.arc(centerX, centerY, Math.min(r, innerR), 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawCircleRadius(
    ctx: CanvasRenderingContext2D, w: number, h: number, time: number, intensity: number,
    settings: any, mode: AgentMode, accentRGB: string
) {
    const centerX = w / 2;
    const centerY = h / 2;

    const pulse = intensity * 100 * settings.radiusSensitivity;
    // Scale base radius
    const baseRadius = Math.min(w, h) * (settings.radius / 800) * 3; // Multiplier to match visual weight
    const ringCount = 5;
    const ringSpacing = 15;

    const freq = settings.breathingFrequency || 1;
    const amount = settings.breathingAmount || 0;
    const breathe = Math.sin(time * freq) * amount;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(time * 0.05);
    ctx.translate(-centerX, -centerY);

    const r = baseRadius + pulse + breathe;

    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.max(0, r), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${accentRGB}, 0.05)`;
    ctx.fill();

    ctx.lineWidth = settings.thickness;

    for (let i = 0; i < ringCount; i++) {
        const speed = mode === AgentMode.SEARCHING ? 10 : 2;
        const chaos = intensity * 20 * settings.displacementSensitivity;
        const ringPulse = Math.sin(time * speed - i) * (pulse * 0.2 + chaos);
        const ringR = r + (i * ringSpacing) + ringPulse;

        const opacity = (0.6) * (1 - (i / ringCount));

        ctx.beginPath();
        if (mode === AgentMode.SEARCHING) ctx.setLineDash([10, 20]);
        else ctx.setLineDash([]);

        ctx.arc(centerX, centerY, Math.max(0, ringR), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${accentRGB}, ${opacity})`;
        ctx.stroke();
    }

    ctx.restore();
}

function drawSphericalParticle(
    ctx: CanvasRenderingContext2D, w: number, h: number, time: number, intensity: number,
    particles: Particle[], settings: any, mode: AgentMode, color: string, secondaryColor: string
) {
    const centerX = w / 2;
    const centerY = h / 2;
    const baseRadius = Math.min(w, h) * (settings.radius / 800) * 2;

    const rotMult = settings.rotationSpeed !== undefined ? settings.rotationSpeed : 1.0;

    let rotSpeedX = 0.5 * rotMult;
    let rotSpeedY = 0.8 * rotMult;

    if (mode === AgentMode.SEARCHING) {
        rotSpeedX = 2.0 * rotMult;
        rotSpeedY = 3.0 * rotMult;
    }

    const freq = settings.breathingFrequency || 2;
    const amount = settings.breathingAmount || 5;
    const breathe = Math.sin(time * freq) * amount;

    const expansion = intensity * 50 * settings.radiusSensitivity;
    const currentRadius = baseRadius + expansion + breathe;

    const displacementSensitivity = settings.displacementSensitivity || 1;
    const sizeSensitivity = settings.sizeSensitivity !== undefined ? settings.sizeSensitivity : 1.0;

    ctx.fillStyle = color;

    particles.forEach(p => {
        if (p.theta === undefined || p.phi === undefined) return;

        const rotX = time * rotSpeedX;
        const rotY = time * rotSpeedY;

        // SMOOTH displacement using deterministic noise instead of Math.random()
        // Use particle's unique position (theta/phi) and time for smooth, flowing motion
        const slowTime = time * 0.3; // Slower time for gentler animation
        const noiseWave1 = Math.sin(p.theta * 3 + slowTime + p.noiseOffsetX) * 0.5;
        const noiseWave2 = Math.cos(p.phi * 2 + slowTime * 0.7 + p.noiseOffsetY) * 0.3;
        const noiseWave3 = Math.sin((p.theta + p.phi) * 2 + slowTime * 0.5) * 0.2;

        // Combine waves for organic displacement, scaled by intensity and per-particle multiplier
        const smoothDisplacement = (noiseWave1 + noiseWave2 + noiseWave3) *
            intensity * 15 * displacementSensitivity * p.displacementMultiplier;

        const particleR = currentRadius + smoothDisplacement;

        let x = particleR * Math.sin(p.phi) * Math.cos(p.theta);
        let y = particleR * Math.sin(p.phi) * Math.sin(p.theta);
        let z = particleR * Math.cos(p.phi);

        let x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
        let z1 = z * Math.cos(rotY) + x * Math.sin(rotY);

        let y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = z1 * Math.cos(rotX) + y * Math.sin(rotX);

        const fov = 300;
        const scale = fov / (fov + z2);

        const x2d = centerX + x1 * scale;
        const y2d = centerY + y2 * scale;

        // UNEVEN size distribution using per-particle sizeMultiplier
        const size = Math.max(0.5, (p.size * scale) + (intensity * 3 * sizeSensitivity * p.sizeMultiplier));
        const alpha = Math.max(0.1, Math.min(1, scale * p.opacity));

        // Calculate fade effect
        const particleFade = settings.particleFade !== undefined ? settings.particleFade : 0;
        const noiseScale = settings.noiseScale !== undefined ? settings.noiseScale : 1;

        let fadeAlpha = alpha;
        if (particleFade > 0 && p.fadePhase !== undefined) {
            const noiseOffset = Math.sin((p.theta || 0) * noiseScale * 3 + time * 0.3) * 0.5;
            const fadeValue = Math.sin(time * p.fadeSpeed + p.fadePhase + noiseOffset);
            fadeAlpha = alpha * (1 - particleFade + particleFade * (fadeValue * 0.5 + 0.5));
        }

        ctx.globalAlpha = fadeAlpha;
        ctx.beginPath();
        ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
        ctx.fill();

        if (mode === AgentMode.SEARCHING && Math.random() > 0.98) {
            ctx.strokeStyle = secondaryColor;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x2d, y2d);
            ctx.stroke();
        }
    });
    ctx.globalAlpha = 1.0;
}