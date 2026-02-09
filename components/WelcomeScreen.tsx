import React, { useEffect, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';

interface WelcomeScreenProps {
    onEnterStudio: () => void;
    onAbout?: () => void;
    isDarkMode: boolean;
    onToggleTheme: () => void;
}

// Spherical particle animation for the AI tile
const SphereAnimation: React.FC<{ isDark: boolean; isSpeaking: boolean }> = ({ isDark, isSpeaking }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const timeRef = useRef(0);
    const particlesRef = useRef<any[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize canvas to match container
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(container);

        const count = 120; // Slightly more particles
        particlesRef.current = [];
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                baseSize: Math.random() * 2.0 + 0.5,
                opacity: Math.random() * 0.5 + 0.4,
                theta: Math.random() * 2 * Math.PI,
                phi: Math.acos(2 * Math.random() - 1),
                speedOffset: Math.random() * 10,
            });
        }

        const render = () => {
            const rect = container.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;
            const dpr = window.devicePixelRatio || 1;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);

            // Slower base speed, moderate increase when speaking
            // Was 0.015 base, 0.05 speaking -> Now 0.005 base, 0.02 speaking (3x slower base)
            timeRef.current += isSpeaking ? 0.02 : 0.005;
            const time = timeRef.current;

            const dotColor = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
            ctx.fillStyle = dotColor;

            const centerX = w / 2;
            const centerY = h / 2;
            const baseRadius = Math.min(w, h) * 0.28;

            // Slower breathing (frequency was time*2, now time*1)
            // Amplitude: Base 2, Speaking 6
            const breathe = Math.sin(time * 1.5) * (isSpeaking ? 6 : 2);
            const currentRadius = baseRadius + breathe;

            // Slower rotation
            const rotX = time * 0.2;
            const rotY = time * 0.3;

            particlesRef.current.forEach((p) => {
                let x = currentRadius * Math.sin(p.phi) * Math.cos(p.theta);
                let y = currentRadius * Math.sin(p.phi) * Math.sin(p.theta);
                let z = currentRadius * Math.cos(p.phi);

                const x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
                const z1 = z * Math.cos(rotY) + x * Math.sin(rotY);
                const y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
                const z2 = z1 * Math.cos(rotX) + y * Math.sin(rotX);

                const scale = 200 / (200 + z2);

                // Particle Size Animation (Pulse)
                // "Squid particle" interpreted as fluid pulsing size
                const pulse = Math.sin(time * 3 + p.speedOffset) * (isSpeaking ? 1.5 : 0.5);
                const size = Math.max(0.1, (p.baseSize + pulse) * scale);

                const alpha = Math.max(0.1, Math.min(1, scale * p.opacity));

                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(centerX + x1 * scale, centerY + y2 * scale, size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;

            animRef.current = requestAnimationFrame(render);
        };

        render();
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
            ro.disconnect();
        };
    }, [isDark, isSpeaking]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block', position: 'absolute', top: 0, left: 0 }}
            />
        </div>
    );
};

// Meeting tile data with real images
const TILES = [
    { type: 'human', label: 'Jessica', img: '/assets/jessica.png', imgSpeaking: '/assets/jessica_speaking.png', imgSpeaking2: '/assets/jessica_speaking2.png' },
    { type: 'human', label: 'Marcus', img: '/assets/marcus.png', imgSpeaking: '/assets/marcus_speaking.png', imgSpeaking2: '/assets/marcus_speaking2.png' },
    { type: 'human', label: 'Elena', img: '/assets/elena.png', imgSpeaking: '/assets/elena_speaking.png', imgSpeaking2: '/assets/elena_speaking2.png' },
    { type: 'ai', label: 'Norah AI', img: '', imgSpeaking: '', imgSpeaking2: '' },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnterStudio, onAbout, isDarkMode, onToggleTheme }) => {
    const fg = isDarkMode ? '255, 255, 255' : '0, 0, 0';
    const textColor = isDarkMode ? '#fff' : '#000';
    const bgColor = isDarkMode ? '#000' : '#f5f5f5';

    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
    const [frame, setFrame] = React.useState(0);

    // Animation loop for speaking frames
    useEffect(() => {
        const interval = setInterval(() => {
            setFrame(f => (f + 1) % 2);
        }, 400); // 400ms cycle for speaking animation
        return () => clearInterval(interval);
    }, []);

    // Preload speaking images
    useEffect(() => {
        TILES.forEach(tile => {
            if (tile.imgSpeaking) {
                const img = new Image();
                img.src = tile.imgSpeaking;
            }
            if (tile.imgSpeaking2) {
                const img = new Image();
                img.src = tile.imgSpeaking2;
            }
        });
    }, []);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: bgColor,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            color: textColor,
            overflow: 'hidden',
            transition: 'background-color 0.4s ease, color 0.4s ease',
        }}>
            {/* Theme Toggle - Top Right */}
            <button
                onClick={onToggleTheme}
                style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    background: 'none',
                    border: `1px solid rgba(${fg}, 0.2)`,
                    borderRadius: 8,
                    padding: 10,
                    cursor: 'pointer',
                    color: textColor,
                    opacity: 0.6,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
            >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Meeting Grid - 2x2 Google Meet Style */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr',
                gap: 6,
                width: 420,
                height: 320,
                marginBottom: 48,
            }}>
                {TILES.map((tile, index) => {
                    const isAi = tile.type === 'ai';
                    const isHovered = hoveredIndex === index;

                    // Dynamic label for AI
                    let label = tile.label;
                    if (isAi) {
                        if (hoveredIndex === index) label = 'Norah AI - Speaking...';
                        else if (hoveredIndex !== null) label = 'Norah AI - Listening...';
                    }

                    return (
                        <div
                            key={index}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            style={{
                                borderRadius: 12,
                                border: isHovered
                                    ? `2px solid ${textColor}`
                                    : (isAi ? `1px solid rgba(${fg}, 0.2)` : `1px solid rgba(${fg}, 0.08)`),
                                backgroundColor: isAi ? `rgba(${fg}, 0.03)` : `rgba(${fg}, 0.02)`,
                                overflow: 'hidden',
                                position: 'relative',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease, background-color 0.4s ease',
                                boxShadow: isHovered ? `0 8px 24px rgba(0,0,0,${isDarkMode ? 0.5 : 0.2})` : 'none',
                                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                                zIndex: isHovered ? 10 : 1,
                                cursor: 'pointer',
                                backfaceVisibility: 'hidden', // Improves blurriness on scale
                                WebkitFontSmoothing: 'subpixel-antialiased',
                                willChange: 'transform',
                            }}
                        >
                            {isAi ? (
                                <SphereAnimation isDark={isDarkMode} isSpeaking={isHovered} />
                            ) : (
                                <img
                                    src={
                                        (isHovered && tile.imgSpeaking && tile.imgSpeaking2)
                                            ? (frame === 0 ? tile.imgSpeaking : tile.imgSpeaking2)
                                            : tile.img
                                    }
                                    alt={tile.label}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        filter: 'grayscale(1)',
                                        opacity: 0.9,
                                        transition: 'filter 0.4s ease',
                                    }}
                                />
                            )}

                            {/* Name label at bottom */}
                            <div style={{
                                position: 'absolute',
                                bottom: 6,
                                left: 8,
                                fontSize: 9,
                                letterSpacing: '0.05em',
                                opacity: isAi ? 0.8 : 0.6,
                                whiteSpace: 'nowrap',
                                color: isAi ? textColor : '#000',
                                textShadow: isAi
                                    ? (isDarkMode ? '0 1px 2px rgba(0,0,0,0.8)' : '0 1px 2px rgba(255,255,255,0.8)')
                                    : '0 1px 2px rgba(255,255,255,0.8)',
                                zIndex: 10,
                                fontWeight: (isAi && hoveredIndex !== null) || !isAi ? 600 : 400,
                            }}>
                                {label}
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
                    Integral Labs
                </h1>
                <p style={{
                    fontSize: 12,
                    opacity: 0.5,
                    letterSpacing: '0.15em',
                    margin: 0,
                }}>
                    AI Agent for Team Meetings
                </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 16 }}>
                <button
                    onClick={onEnterStudio}
                    style={{
                        padding: '14px 40px',
                        fontSize: 12,
                        fontFamily: 'inherit',
                        fontWeight: 500,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        border: `1px solid rgba(${fg}, 0.3)`,
                        borderRadius: 6,
                        backgroundColor: 'transparent',
                        color: textColor,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `rgba(${fg}, 0.1)`;
                        e.currentTarget.style.borderColor = `rgba(${fg}, 0.5)`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = `rgba(${fg}, 0.3)`;
                    }}
                >
                    Start a Session
                </button>
                {onAbout && (
                    <button
                        onClick={onAbout}
                        style={{
                            padding: '14px 40px',
                            fontSize: 12,
                            fontFamily: 'inherit',
                            fontWeight: 500,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            border: `1px solid rgba(${fg}, 0.15)`,
                            borderRadius: 6,
                            backgroundColor: 'transparent',
                            color: textColor,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            opacity: 0.6,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `rgba(${fg}, 0.1)`;
                            e.currentTarget.style.borderColor = `rgba(${fg}, 0.4)`;
                            e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = `rgba(${fg}, 0.15)`;
                            e.currentTarget.style.opacity = '0.6';
                        }}
                    >
                        About
                    </button>
                )}
            </div>
        </div>
    );
};
