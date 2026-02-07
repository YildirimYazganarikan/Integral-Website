import React, { useEffect, useRef, useState } from 'react';
import { ThemeType } from '../types';

interface WelcomeScreenProps {
    onEnterStudio: () => void;
}

// Mini visualizer types to showcase
const VISUALIZER_TYPES: ThemeType[] = [
    'PARTICLE_CIRCLE',
    'STRAIGHT_LINE',
    'SIMPLE_CIRCLE',
    'CIRCLE_RADIUS',
    'SPHERICAL_PARTICLE'
];

// Mini visualizer renderer for preview
const MiniVisualizer: React.FC<{ type: ThemeType; isHovered: boolean }> = ({ type, isHovered }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const timeRef = useRef(0);
    const particlesRef = useRef<any[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Initialize particles for particle-based visualizers
        const count = 80;
        particlesRef.current = [];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            particlesRef.current.push({
                angle,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.5,
                theta: Math.random() * 2 * Math.PI,
                phi: Math.acos(2 * Math.random() - 1),
                sizeMultiplier: 0.3 + Math.random() * 1.4,
            });
        }

        const render = () => {
            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            timeRef.current += 0.02;
            const time = timeRef.current;
            const intensity = 0.3 + Math.sin(time * 2) * 0.2;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';

            const centerX = w / 2;
            const centerY = h / 2;
            const baseRadius = Math.min(w, h) * 0.25;

            switch (type) {
                case 'PARTICLE_CIRCLE': {
                    const breathe = Math.sin(time * 2) * 5;
                    particlesRef.current.forEach((p) => {
                        const dynamicR = baseRadius + breathe + intensity * 20;
                        const x = centerX + Math.cos(p.angle) * dynamicR;
                        const y = centerY + Math.sin(p.angle) * dynamicR;
                        ctx.globalAlpha = p.opacity;
                        ctx.beginPath();
                        ctx.arc(x, y, p.size, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    ctx.globalAlpha = 1;
                    break;
                }
                case 'STRAIGHT_LINE': {
                    const points = 60;
                    const spacing = w / points;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    for (let i = 0; i <= points; i++) {
                        const x = i * spacing;
                        const edgeFactor = Math.sin((i / points) * Math.PI);
                        const wave = Math.sin(i * 0.2 + time * 8) * 20 * intensity * edgeFactor;
                        if (i === 0) ctx.moveTo(x, centerY + wave);
                        else ctx.lineTo(x, centerY + wave);
                    }
                    ctx.stroke();
                    break;
                }
                case 'SIMPLE_CIRCLE': {
                    const breathe = Math.sin(time * 1.5) * 5;
                    const r = baseRadius + breathe + intensity * 30;
                    ctx.fillStyle = '#000';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.stroke();
                    // Inner pulsing circle
                    const innerR = r * 0.4 + Math.sin(time * 10) * r * 0.15;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, innerR, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }
                case 'CIRCLE_RADIUS': {
                    const r = baseRadius * 1.5;
                    ctx.save();
                    ctx.translate(centerX, centerY);
                    ctx.rotate(time * 0.1);
                    ctx.translate(-centerX, -centerY);
                    ctx.lineWidth = 2;
                    for (let i = 0; i < 5; i++) {
                        const ringR = r + i * 12 + Math.sin(time * 2 - i) * 8;
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, ringR, 0, Math.PI * 2);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * (1 - i / 5)})`;
                        ctx.stroke();
                    }
                    ctx.restore();
                    break;
                }
                case 'SPHERICAL_PARTICLE': {
                    const breathe = Math.sin(time * 2) * 8;
                    const currentRadius = baseRadius + breathe;
                    const rotX = time * 0.5;
                    const rotY = time * 0.8;

                    particlesRef.current.forEach((p) => {
                        let x = currentRadius * Math.sin(p.phi) * Math.cos(p.theta);
                        let y = currentRadius * Math.sin(p.phi) * Math.sin(p.theta);
                        let z = currentRadius * Math.cos(p.phi);

                        const x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
                        const z1 = z * Math.cos(rotY) + x * Math.sin(rotY);
                        const y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
                        const z2 = z1 * Math.cos(rotX) + y * Math.sin(rotX);

                        const scale = 200 / (200 + z2);
                        const alpha = Math.max(0.1, Math.min(1, scale * p.opacity));

                        ctx.globalAlpha = alpha;
                        ctx.beginPath();
                        ctx.arc(centerX + x1 * scale, centerY + y2 * scale, Math.max(0.5, p.size * scale), 0, Math.PI * 2);
                        ctx.fill();
                    });
                    ctx.globalAlpha = 1;
                    break;
                }
            }

            animRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [type]);

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={300}
            style={{
                width: '100%',
                height: '100%',
                display: 'block',
            }}
        />
    );
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnterStudio }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            color: '#fff',
            overflow: 'hidden',
        }}>
            {/* Artwork - Expandable Visualizer Slices */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 300,
                gap: 4,
                marginBottom: 48,
            }}>
                {VISUALIZER_TYPES.map((type, index) => {
                    const isHovered = hoveredIndex === index;
                    const hasHover = hoveredIndex !== null;

                    // Calculate widths: hovered gets 280px, others shrink
                    let width = 56; // default narrow width
                    if (hasHover) {
                        if (isHovered) {
                            width = 280;
                        } else {
                            width = 40;
                        }
                    }

                    return (
                        <div
                            key={type}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            style={{
                                width,
                                height: 300,
                                overflow: 'hidden',
                                borderRadius: 8,
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                cursor: 'pointer',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                            }}
                        >
                            <div style={{
                                width: 300,
                                height: 300,
                                position: 'absolute',
                                left: '50%',
                                transform: 'translateX(-50%)',
                            }}>
                                <MiniVisualizer type={type} isHovered={isHovered} />
                            </div>

                            {/* Label that appears on hover */}
                            <div style={{
                                position: 'absolute',
                                bottom: 12,
                                left: 0,
                                right: 0,
                                textAlign: 'center',
                                fontSize: 10,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                opacity: isHovered ? 0.7 : 0,
                                transition: 'opacity 0.3s ease',
                                whiteSpace: 'nowrap',
                            }}>
                                {type.replace(/_/g, ' ')}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Branding */}
            <div style={{
                textAlign: 'center',
                marginBottom: 40,
            }}>
                <h1 style={{
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    margin: 0,
                    marginBottom: 12,
                }}>
                    AI Interface Studio
                </h1>
                <p style={{
                    fontSize: 12,
                    opacity: 0.5,
                    letterSpacing: '0.15em',
                    margin: 0,
                }}>
                    by LEO (Yildirim Yazganarikan)
                </p>
            </div>

            {/* Go to Studio Button */}
            <button
                onClick={onEnterStudio}
                style={{
                    padding: '14px 40px',
                    fontSize: 12,
                    fontFamily: 'inherit',
                    fontWeight: 500,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: 6,
                    backgroundColor: 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
            >
                Go to Studio
            </button>
        </div>
    );
};
