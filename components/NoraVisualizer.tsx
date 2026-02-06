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
                drawSphericalParticle(ctx, width, height, timeRef.current, intensity, particlesRef.current, profile.settings, mode, primaryColor, secondaryColor, isDarkMode);
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

    // Compute global smoothed intensity from frequency data for EVEN displacement
    let globalFreqIntensity = 0;
    if (freqData && freqData.length > 0) {
        let weightedSum = 0;
        let totalWeight = 0;
        for (let i = 0; i < freqData.length; i++) {
            // Weight bass frequencies more heavily
            const weight = 1 - (i / freqData.length) * 0.7;
            weightedSum += freqData[i] * weight;
            totalWeight += weight;
        }
        const rawIntensity = weightedSum / totalWeight / 255;
        // Apply noise gate
        globalFreqIntensity = rawIntensity > 0.15 ? (rawIntensity - 0.15) / 0.85 : 0;
    }

    particles.forEach((p, idx) => {
        // SMOOTH organic noise using per-particle offsets for unique timing
        // Much slower time progression for gentler, flowing movement
        const slowTime = time * 0.15; // Very slow for smooth motion

        // Each particle has unique noise patterns due to noiseOffsetX/Y
        // Reduced amplitudes for gentler displacement
        const wave1 = Math.sin(p.angle * 3 + slowTime + p.noiseOffsetX) * 0.35;
        const wave2 = Math.cos(p.angle * 2 - slowTime * 0.7 + p.noiseOffsetY) * 0.2;
        const wave3 = Math.sin(p.angle * 5 + slowTime * 0.5 + p.noiseOffsetX * 0.5) * 0.15;

        // Apply per-particle displacement multiplier for varied displacement amounts
        const organicNoise = (wave1 + wave2 + wave3) * settings.displacementSensitivity * 6 * p.displacementMultiplier;

        // EVEN displacement: Apply global frequency intensity to ALL particles equally
        // Each particle varies only by its displacementMultiplier, not by angle
        const spectralDisplacement = globalFreqIntensity * 35 * settings.displacementSensitivity * p.displacementMultiplier;

        // UNEVEN size distribution using per-particle frequency sampling
        let size = p.size;
        if (freqData && freqData.length > 0) {
            // Each particle samples a different frequency bin based on its unique noiseOffsetX
            // This creates organic variation where some particles react to bass, others to treble
            const particleFreqIdx = Math.floor((p.noiseOffsetX / (Math.PI * 2)) * freqData.length) % freqData.length;

            // Sample a small range around that index for smoothness
            const range = 3;
            let freqSum = 0;
            for (let j = -range; j <= range; j++) {
                const sampleIdx = (particleFreqIdx + j + freqData.length) % freqData.length;
                freqSum += freqData[sampleIdx];
            }
            const particleFreqVal = freqSum / (range * 2 + 1) / 255;

            // Apply per-particle frequency-based size boost
            const freqSizeBoost = particleFreqVal * 4 * sizeSensitivity * p.sizeMultiplier;
            size = Math.max(0.5, size + freqSizeBoost);
        } else {
            // Fallback to intensity-based sizing
            const sizeBoost = intensity * 3 * sizeSensitivity * p.sizeMultiplier;
            size = Math.max(0.5, size + sizeBoost);
        }

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
    const baseRadius = Math.min(w, h) * (settings.radius / 800) * 3;
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
    ctx.setLineDash([]);

    // Draw standard rings
    for (let i = 0; i < ringCount; i++) {
        const speed = mode === AgentMode.SEARCHING ? 4 : 2;
        const chaos = intensity * 20 * settings.displacementSensitivity;
        const ringPulse = Math.sin(time * speed - i) * (pulse * 0.2 + chaos);
        const ringR = r + (i * ringSpacing) + ringPulse;

        const opacity = (0.6) * (1 - (i / ringCount));

        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(0, ringR), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${accentRGB}, ${opacity})`;
        ctx.stroke();
    }

    // === SEARCHING MODE: Signal Rings ===
    if (mode === AgentMode.SEARCHING) {
        const signalSpeed = settings.signalSpeed ?? 2.0;
        const signalMaxRadius = settings.signalMaxRadius ?? 200;
        const signalCount = settings.signalCount ?? 3;
        const signalThickness = settings.signalThickness ?? 2;

        for (let i = 0; i < signalCount; i++) {
            // Stagger signals evenly
            const phase = (time * signalSpeed + (i * (Math.PI * 2 / signalCount))) % (Math.PI * 2);
            const progress = phase / (Math.PI * 2); // 0 to 1

            // Signal expands from center outward
            const signalRadius = r + (progress * signalMaxRadius);

            // Fade out as it expands (fade in quickly, fade out slowly)
            const fadeIn = Math.min(1, progress * 4); // Quick fade in
            const fadeOut = 1 - progress; // Linear fade out
            const signalOpacity = fadeIn * fadeOut * 0.8;

            if (signalOpacity > 0.01) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, Math.max(0, signalRadius), 0, Math.PI * 2);
                ctx.lineWidth = signalThickness * (1 - progress * 0.5); // Thin as it expands
                ctx.strokeStyle = `rgba(${accentRGB}, ${signalOpacity})`;
                ctx.stroke();
            }
        }
    }

    ctx.restore();
}

function drawSphericalParticle(
    ctx: CanvasRenderingContext2D, w: number, h: number, time: number, intensity: number,
    particles: Particle[], settings: any, mode: AgentMode, color: string, secondaryColor: string, isDark: boolean = true
) {
    const centerX = w / 2;
    const centerY = h / 2;

    // === EXTRACT ALL SQUID SETTINGS WITH DEFAULTS ===
    const baseRadius = settings.radius ?? 160;
    const baseSize = settings.baseSize ?? 3.9;
    const baseOpacity = settings.opacity ?? 0.6;
    const rotationSpeed = settings.rotationSpeed ?? 0.2;

    // Squid Effect
    const squidSpeed = settings.squidSpeed ?? 3.3;
    const squidAmplitude = settings.squidAmplitude ?? 2.2;
    const squidOpacityVar = settings.squidOpacityVar ?? 0.45;

    // Breathing
    const breathingFrequency = settings.breathingFrequency ?? 0.3;
    const breathingAmplitude = settings.breathingAmplitude ?? 29;

    // Mode: Listening
    const listeningTriggerSens = settings.listeningTriggerSens ?? 0.078;
    const listeningIntensity = settings.listeningIntensity ?? 0.8;

    // Mode: Speaking
    const speakingRate = settings.speakingRate ?? 16;
    const speakingIntensity = settings.speakingIntensity ?? 0.4;

    // Mode: Searching
    const searchingSpeed = settings.searchingSpeed ?? 0.8;
    const searchingJitter = settings.searchingJitter ?? 23;

    // Outer Sphere
    const enableOuterSphere = settings.enableOuterSphere ?? 0;
    const outerSphereRadius = settings.outerSphereRadius ?? 300;
    const outerSphereSpeed = settings.outerSphereSpeed ?? 8;
    const outerSphereDensity = settings.outerSphereDensity ?? 0.2;

    // Colors
    const useCustomColors = settings.useCustomColors ?? 0;
    const particleColor = settings.particleColor ?? '#88aaff';
    const outerSphereColor = settings.outerSphereColor ?? '#ff6464';

    // Parse hex color to RGB
    const hexToRgb = (hex: string): { r: number, g: number, b: number } => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 136, g: 170, b: 255 };
    };

    // === MODE-BASED INTENSITY CALCULATION ===
    let targetIntensity = intensity;

    if (mode === AgentMode.LISTENING) {
        // Spike based on audio + random trigger for simulation
        if (intensity > 0.1 || Math.random() < listeningTriggerSens) {
            targetIntensity = Math.max(intensity, Math.random() * listeningIntensity);
        }
    } else if (mode === AgentMode.SPEAKING) {
        // Oscillating intensity based on speaking rate
        targetIntensity = (Math.sin(time * speakingRate) + 1) * 0.5 * speakingIntensity + intensity * 0.5;
    } else if (mode === AgentMode.SEARCHING) {
        // Steady moderate intensity
        targetIntensity = 0.3 + intensity * 0.3;
    }

    // === ROTATION SPEED (MODE-DEPENDENT) ===
    let rotSpeedX = rotationSpeed * 0.5;
    let rotSpeedY = rotationSpeed * 0.8;

    if (mode === AgentMode.SEARCHING) {
        rotSpeedX = searchingSpeed;
        rotSpeedY = searchingSpeed * 1.5;
    }

    const rotX = time * rotSpeedX;
    const rotY = time * rotSpeedY;

    // === BREATHING ANIMATION ===
    const breathe = Math.sin(time * breathingFrequency) * breathingAmplitude;
    const currentRadius = baseRadius + (targetIntensity * 40) + breathe;

    // === DRAW MAIN PARTICLES ===
    particles.forEach(p => {
        if (p.theta === undefined || p.phi === undefined) return;

        // Squid pulsing effect (per-particle phase offset)
        const squidPulse = Math.sin(time * squidSpeed + p.fadePhase);

        // Jitter based on mode
        let jitter = targetIntensity * 10;
        if (mode === AgentMode.SEARCHING) {
            jitter = searchingJitter;
        }

        const r = currentRadius + (p.displacementMultiplier * jitter);

        let x = r * Math.sin(p.phi) * Math.cos(p.theta);
        let y = r * Math.sin(p.phi) * Math.sin(p.theta);
        let z = r * Math.cos(p.phi);

        // Rotation
        let x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
        let z1 = z * Math.cos(rotY) + x * Math.sin(rotY);
        let y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = z1 * Math.cos(rotX) + y * Math.sin(rotX);

        // Perspective projection
        const fov = 400;
        const scale = fov / (fov + z2);
        const projectedX = centerX + x1 * scale;
        const projectedY = centerY + y2 * scale;

        // Squid size pulsing
        const pulseScale = 1 + (squidPulse * squidAmplitude * 0.5);
        let size = (p.sizeMultiplier * baseSize * scale) * pulseScale;
        size += targetIntensity * 5 * scale;

        // Squid opacity pulsing
        let alpha = baseOpacity * scale;
        alpha *= (1 + squidPulse * squidOpacityVar);
        alpha = Math.max(0, Math.min(1, alpha));

        ctx.beginPath();
        ctx.arc(projectedX, projectedY, Math.max(0, size), 0, Math.PI * 2);

        // Color calculation
        if (useCustomColors) {
            // Use custom particle color
            const rgb = hexToRgb(particleColor);
            const pulseFactor = 0.7 + (squidPulse * 0.3); // Subtle pulse variation
            ctx.fillStyle = `rgba(${Math.floor(rgb.r * scale * pulseFactor)}, ${Math.floor(rgb.g * scale * pulseFactor)}, ${Math.floor(rgb.b * scale * pulseFactor)}, ${alpha})`;
        } else if (isDark) {
            // Original squid blue tint for dark mode
            const brightness = Math.floor(255 * scale);
            const blueTint = Math.floor(200 + (squidPulse * 55));
            ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${blueTint}, ${alpha})`;
        } else {
            // Inverted for light mode: dark particles with subtle blue
            const darkness = Math.floor(255 * (1 - scale));
            const blueTint = Math.floor(55 - (squidPulse * 55));
            ctx.fillStyle = `rgba(${darkness}, ${darkness}, ${Math.max(0, blueTint)}, ${alpha})`;
        }
        ctx.fill();
    });

    // === OUTER SPHERE (SEARCHING MODE ONLY) ===
    if (mode === AgentMode.SEARCHING && enableOuterSphere > 0) {
        const outerRotX = time * outerSphereSpeed * 0.1;
        const outerRotY = time * outerSphereSpeed * 0.15;

        // Fast blink effect
        const globalAlpha = (Math.sin(time * outerSphereSpeed * 2) + 1) * 0.5 * 0.3;

        // Generate outer particles on the fly (or use a subset)
        const outerCount = Math.floor(20 + outerSphereDensity * 300);
        const goldenRatio = (1 + Math.sqrt(5)) / 2;

        for (let i = 0; i < outerCount; i++) {
            const theta = 2 * Math.PI * i / goldenRatio;
            const phi = Math.acos(1 - 2 * (i + 0.5) / outerCount);
            const pBaseSize = Math.random() * 1.0 + 0.5;

            let x = outerSphereRadius * Math.sin(phi) * Math.cos(theta);
            let y = outerSphereRadius * Math.sin(phi) * Math.sin(theta);
            let z = outerSphereRadius * Math.cos(phi);

            let x1 = x * Math.cos(outerRotY) - z * Math.sin(outerRotY);
            let z1 = z * Math.cos(outerRotY) + x * Math.sin(outerRotY);
            let y2 = y * Math.cos(outerRotX) - z1 * Math.sin(outerRotX);
            let z2 = z1 * Math.cos(outerRotX) + y * Math.sin(outerRotX);

            const fov = 400;
            const scale = fov / (fov + z2);
            const projectedX = centerX + x1 * scale;
            const projectedY = centerY + y2 * scale;

            const size = pBaseSize * scale * 2;

            ctx.beginPath();
            ctx.arc(projectedX, projectedY, Math.max(0, size), 0, Math.PI * 2);

            // Outer sphere color
            if (useCustomColors) {
                const rgb = hexToRgb(outerSphereColor);
                const outerAlpha = Math.min(1, globalAlpha * scale * 2 + 0.1);
                ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${outerAlpha})`;
            } else {
                // Red/Scanning tint (same for both themes - red stands out)
                const outerAlpha = Math.min(1, globalAlpha * scale * 2 + 0.1);
                ctx.fillStyle = isDark ? `rgba(255, 100, 100, ${outerAlpha})` : `rgba(180, 50, 50, ${outerAlpha})`;
            }
            ctx.fill();
        }
    }

    ctx.globalAlpha = 1.0;
}