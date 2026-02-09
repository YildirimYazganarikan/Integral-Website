import React, { useEffect, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';

interface WelcomeScreenProps {
    onEnterStudio: () => void;
    onAbout?: () => void;
    isDarkMode: boolean;
    onToggleTheme: () => void;
}

// Spherical particle animation for the AI tile
const SphereAnimation: React.FC<{ isDark: boolean; isSpeaking: boolean; isListening: boolean }> = ({ isDark, isSpeaking, isListening }) => {
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
            // Was 0.015 base, 0.05 speaking -> Now 0.005 base, 0.02 speaking, 0.01 listening
            let speed = 0.005;
            if (isSpeaking) speed = 0.02;
            else if (isListening) speed = 0.01;

            timeRef.current += speed;
            const time = timeRef.current;

            const dotColor = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
            ctx.fillStyle = dotColor;

            const centerX = w / 2;
            const centerY = h / 2;
            const baseRadius = Math.min(w, h) * 0.28;

            // Slower breathing (frequency was time*2, now time*1)
            // Amplitude: Base 2, Speaking 6, Listening 4
            let breatheAmp = 2;
            if (isSpeaking) breatheAmp = 6;
            else if (isListening) breatheAmp = 4;

            const breathe = Math.sin(time * 1.5) * breatheAmp;
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
                // Pulse intensity: Base 0.5, Speaking 1.5, Listening 2.0 (High pulse requested)
                let pulseIntensity = 0.5;
                if (isSpeaking) pulseIntensity = 1.5;
                else if (isListening) pulseIntensity = 2.0;

                const pulse = Math.sin(time * 3 + p.speedOffset) * pulseIntensity;
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
    }, [isDark, isSpeaking, isListening]);

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
    { type: 'human', label: 'Jessica', img: '/assets/jessica.png', imgSpeaking: '/assets/jessica_speaking.png', imgSpeaking2: '/assets/jessica_speaking2.png', imgAmazed: '/assets/jessica_amazed.png', imgAmazed2: '/assets/jessica_amazed2.png' },
    { type: 'human', label: 'Marcus', img: '/assets/marcus.png', imgSpeaking: '/assets/marcus_speaking.png', imgSpeaking2: '/assets/marcus_speaking2.png', imgAmazed: '/assets/marcus_amazed.png', imgAmazed2: '/assets/marcus_amazed2.png' },
    { type: 'human', label: 'Elena', img: '/assets/elena.png', imgSpeaking: '/assets/elena_speaking.png', imgSpeaking2: '/assets/elena_speaking2.png', imgAmazed: '/assets/elena_amazed.png', imgAmazed2: '/assets/elena_amazed2.png' },
    { type: 'ai', label: 'Norah AI', img: '', imgSpeaking: '', imgSpeaking2: '', imgAmazed: '', imgAmazed2: '' },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnterStudio, onAbout, isDarkMode, onToggleTheme }) => {
    const fg = isDarkMode ? '255, 255, 255' : '0, 0, 0';
    const textColor = isDarkMode ? '#fff' : '#000';
    const bgColor = isDarkMode ? '#000' : '#f5f5f5';

    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
    const [frame, setFrame] = React.useState(0);
    const [amazedLevel, setAmazedLevel] = React.useState(0); // 0: none, 1: amazed, 2: very amazed

    // Animation loop for speaking frames
    useEffect(() => {
        const interval = setInterval(() => {
            setFrame(f => (f + 1) % 2);
        }, 400); // 400ms cycle for speaking animation
        return () => clearInterval(interval);
    }, []);

    // Logic for amazed state (hover AI for 2 seconds -> level 1, then +1.5s -> level 2)
    useEffect(() => {
        let timer1: ReturnType<typeof setTimeout>;
        let timer2: ReturnType<typeof setTimeout>;

        if (hoveredIndex === 3) { // 3 is Norah AI
            timer1 = setTimeout(() => {
                setAmazedLevel(1);
                // Start timer for level 2
                timer2 = setTimeout(() => {
                    setAmazedLevel(2);
                }, 1500);
            }, 2000);
        } else {
            setAmazedLevel(0);
        }

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [hoveredIndex]);

    // Preload speaking and amazed images
    useEffect(() => {
        TILES.forEach(tile => {
            if (tile.imgSpeaking) new Image().src = tile.imgSpeaking;
            if (tile.imgSpeaking2) new Image().src = tile.imgSpeaking2;
            if (tile.imgAmazed) new Image().src = tile.imgAmazed;
            if (tile.imgAmazed2) new Image().src = tile.imgAmazed2;
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

                    const isListening = hoveredIndex !== null && !isHovered;

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
                                transform: 'scale(1)',
                                zIndex: isHovered ? 10 : 1,
                                cursor: 'pointer',
                                backfaceVisibility: 'hidden', // Improves blurriness on scale
                                WebkitFontSmoothing: 'subpixel-antialiased',
                                willChange: 'transform',
                            }}
                        >
                            {isAi ? (
                                <SphereAnimation isDark={isDarkMode} isSpeaking={isHovered} isListening={isListening} />
                            ) : (
                                <>
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundColor: '#e6e6e6', // TODO: Update this to your desired color
                                        mixBlendMode: 'multiply',
                                        pointerEvents: 'none',
                                        zIndex: 2,
                                    }} />
                                    <img
                                        src={
                                            amazedLevel === 2 && tile.imgAmazed2
                                                ? tile.imgAmazed2
                                                : (amazedLevel >= 1 && tile.imgAmazed
                                                    ? tile.imgAmazed
                                                    : (isHovered && tile.imgSpeaking && tile.imgSpeaking2)
                                                        ? (frame === 0 ? tile.imgSpeaking : tile.imgSpeaking2)
                                                        : tile.img)
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
                                </>
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
                    AI Agent for Team Meetings
                </h1>
                <p style={{
                    fontSize: 12,
                    opacity: 0.5,
                    letterSpacing: '0.15em',
                    margin: 0,
                }}>
                    Integral Labs
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
