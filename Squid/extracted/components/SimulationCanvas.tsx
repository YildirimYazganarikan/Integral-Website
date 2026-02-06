import React, { useRef, useEffect } from 'react';
import { SimulationSettings, SimulationMode, Particle } from '../types';

interface SimulationCanvasProps {
  settings: SimulationSettings;
  mode: SimulationMode;
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ settings, mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const outerParticlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number>();
  const timeRef = useRef<number>(0);
  
  // Simulation State
  const intensityRef = useRef<number>(0);
  const targetIntensityRef = useRef<number>(0);

  // Initialize Particles (Main Sphere)
  useEffect(() => {
    const count = Math.floor(50 + settings.density * 500);
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const goldenRatio = (1 + Math.sqrt(5)) / 2;
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);

      newParticles.push({
        theta,
        phi,
        baseSize: Math.random() * 0.5 + 0.5,
        phase: Math.random() * Math.PI * 2,
        randomX: Math.random() * 2 - 1,
        randomY: Math.random() * 2 - 1,
      });
    }

    particlesRef.current = newParticles;
  }, [settings.density]);

  // Initialize Outer Particles
  useEffect(() => {
    const count = Math.floor(20 + settings.outerSphereDensity * 300);
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const goldenRatio = (1 + Math.sqrt(5)) / 2;
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);
      newParticles.push({
        theta,
        phi,
        baseSize: Math.random() * 1.0 + 0.5,
        phase: Math.random() * Math.PI * 2,
        randomX: Math.random() * 2 - 1,
        randomY: Math.random() * 2 - 1,
      });
    }
    outerParticlesRef.current = newParticles;
  }, [settings.outerSphereDensity]);

  const updateSimulation = () => {
    if (mode === SimulationMode.LISTENING) {
        if (Math.random() < settings.listeningTriggerSens) {
            targetIntensityRef.current = Math.random() * settings.listeningIntensity;
        }
        targetIntensityRef.current *= 0.92;
    } else if (mode === SimulationMode.SPEAKING) {
        targetIntensityRef.current = (Math.sin(timeRef.current * settings.speakingRate) + 1) * 0.5 * settings.speakingIntensity;
    } else {
        // Searching: Steady state
        targetIntensityRef.current = 0.3;
    }
    intensityRef.current += (targetIntensityRef.current - intensityRef.current) * 0.1;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const time = timeRef.current;
    const intensity = intensityRef.current;

    updateSimulation();

    // --- Main Sphere ---
    let rotSpeedX = settings.rotationSpeed * 0.5;
    let rotSpeedY = settings.rotationSpeed * 0.8;

    if (mode === SimulationMode.SEARCHING) {
        rotSpeedX = settings.searchingSpeed;
        rotSpeedY = settings.searchingSpeed * 1.5;
    }

    const rotX = time * rotSpeedX;
    const rotY = time * rotSpeedY;

    const breathe = Math.sin(time * settings.breathingFrequency) * settings.breathingAmplitude;
    const currentRadius = settings.radius + (intensity * 40) + breathe;

    particlesRef.current.forEach((p, i) => {
        const squidPulse = Math.sin(time * settings.squidSpeed + p.phase);
        let jitter = intensity * 10;
        if (mode === SimulationMode.SEARCHING) {
            jitter = settings.searchingJitter;
        }

        const r = currentRadius + (p.randomX * jitter);
        
        let x = r * Math.sin(p.phi) * Math.cos(p.theta);
        let y = r * Math.sin(p.phi) * Math.sin(p.theta);
        let z = r * Math.cos(p.phi);

        let x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
        let z1 = z * Math.cos(rotY) + x * Math.sin(rotY);
        let y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = z1 * Math.cos(rotX) + y * Math.sin(rotX);

        const fov = 400;
        const scale = fov / (fov + z2);
        const projectedX = centerX + x1 * scale;
        const projectedY = centerY + y2 * scale;

        const pulseScale = 1 + (squidPulse * settings.squidAmplitude * 0.5);
        let size = (p.baseSize * settings.baseSize * scale) * pulseScale;
        
        size += intensity * 5 * scale;

        let alpha = settings.opacity * scale;
        alpha *= (1 + squidPulse * settings.squidOpacityVar);
        alpha = Math.max(0, Math.min(1, alpha));

        if (mode === SimulationMode.SEARCHING) {
            // Extra wobble for main sphere in search
             // pX += ... (Removed strictly to keep clean, jitter is handled in radius)
        }

        ctx.beginPath();
        ctx.arc(projectedX, projectedY, Math.max(0, size), 0, Math.PI * 2);
        
        const brightness = Math.floor(255 * scale);
        const blueTint = Math.floor(200 + (squidPulse * 55)); 
        
        ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${blueTint}, ${alpha})`;
        ctx.fill();
    });

    // --- Outer Sphere (Searching Mode) ---
    if (mode === SimulationMode.SEARCHING && settings.enableOuterSphere > 0) {
        // Fast counter-rotation
        const outerRotX = time * settings.outerSphereSpeed * 0.1;
        const outerRotY = time * settings.outerSphereSpeed * 0.15;
        const outerRadius = settings.outerSphereRadius;
        
        // Fast blink
        const globalAlpha = (Math.sin(time * settings.outerSphereSpeed * 2) + 1) * 0.5 * 0.3; // max 0.3 opacity

        outerParticlesRef.current.forEach((p) => {
             // Simple sphere logic
             let x = outerRadius * Math.sin(p.phi) * Math.cos(p.theta);
             let y = outerRadius * Math.sin(p.phi) * Math.sin(p.theta);
             let z = outerRadius * Math.cos(p.phi);

             let x1 = x * Math.cos(outerRotY) - z * Math.sin(outerRotY);
             let z1 = z * Math.cos(outerRotY) + x * Math.sin(outerRotY);
             let y2 = y * Math.cos(outerRotX) - z1 * Math.sin(outerRotX);
             let z2 = z1 * Math.cos(outerRotX) + y * Math.sin(outerRotX);

             const fov = 400;
             const scale = fov / (fov + z2);
             const projectedX = centerX + x1 * scale;
             const projectedY = centerY + y2 * scale;

             const size = p.baseSize * scale * 2; // slightly larger
             
             ctx.beginPath();
             ctx.arc(projectedX, projectedY, Math.max(0, size), 0, Math.PI * 2);
             
             // Red/Scanning tint
             const r = 255;
             const g = 100;
             const b = 100;
             const alpha = Math.min(1, globalAlpha * scale * 2 + 0.1); 

             ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
             ctx.fill();
        });
    }

    timeRef.current += 0.01;
    requestRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    requestRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [settings, mode]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full bg-[#050505]"
    />
  );
};

export default SimulationCanvas;