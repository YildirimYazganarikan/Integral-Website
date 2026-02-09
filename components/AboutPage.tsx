import React, { useState } from 'react';
import { ArrowRight, Users, Monitor, MessageCircle, MapPin, Mic, ChevronDown, Sun, Moon } from 'lucide-react';

interface AboutPageProps {
    onBack?: () => void;
    isDarkMode: boolean;
    onToggleTheme: () => void;
}

// Team member data
const TEAM = [
    { name: 'Gokhan Urul', role: 'Co-founder' },
    { name: 'Ulaşcan Deniz Genç', role: 'Co-founder' },
    { name: 'Chris Berkner', role: 'Co-founder' },
    { name: 'Yildirim Yazganarikan', role: 'Co-founder' },
];

// Thesis points
const THESIS_POINTS = [
    'Voice is the fastest externalization of human thought',
    'AI is evolving from 1 human ↔ 1 AI interaction to 1 AI ↔ multi-human interaction eventually multi AI ↔ multi-human',
    'AI moves from being assistive to becoming facilitative',
    'AI now has the potential to reshape how groups think together',
    'In real-time conversations, humans cannot reliably access or verify information without breaking presence and flow',
];

// Industry use cases
const INDUSTRIES = [
    {
        title: 'Sales & Revenue',
        items: ['B2B Sales & Procurement', 'Legal / Mediation / HR', 'Partnerships / BD / M&A', 'Customer Support', 'Public Sector / NGOs'],
        description: 'Designed for moments where price, scope, and authority are in play. Turns objections into negotiable terms and outputs agreed conditions, open issues, owners, and a clear path to signature.',
    },
    {
        title: 'Community Building',
        items: ['DAOs / Web3 Communities', 'Workplace Communities', 'Wellness / Spiritual', 'Creator Communities'],
        description: 'Built for belonging + momentum, not just conversation. Supports onboarding, norms, rituals, and gentle moderation—producing roles, next gatherings, and follow-ups that compound participation.',
    },
    {
        title: 'Education',
        items: ['K-12 / University', 'Test prep', 'Enterprise training', 'Healthcare training', 'Skilled trades'],
        description: 'Optimized for learning that sticks. Diagnoses gaps, adapts explanations, generates practice, and tracks progress, producing feedback, exercises, and measurable checkpoints.',
    },
];

export const AboutPage: React.FC<AboutPageProps> = ({ onBack, isDarkMode, onToggleTheme }) => {
    const [expandedIndustry, setExpandedIndustry] = useState<number | null>(null);

    const fg = isDarkMode ? '255, 255, 255' : '0, 0, 0';
    const textColor = isDarkMode ? '#fff' : '#111';
    const bgColor = isDarkMode ? '#000' : '#f5f5f5';
    const cardBg = isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)';
    const cardBorder = `1px solid rgba(${fg}, 0.1)`;
    const pillBg = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
    const pillBorder = `1px solid rgba(${fg}, 0.2)`;

    const slideStyle: React.CSSProperties = {
        minHeight: '100vh',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        scrollSnapAlign: 'start',
        position: 'relative',
    };

    const contentStyle: React.CSSProperties = {
        maxWidth: 1000,
        width: '100%',
        margin: '0 auto',
    };

    const headingStyle: React.CSSProperties = {
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.3em',
        textTransform: 'uppercase' as const,
        opacity: 0.4,
        marginBottom: 32,
        textAlign: 'center',
    };

    const cardStyle: React.CSSProperties = {
        padding: 28,
        borderRadius: 12,
        border: cardBorder,
        backgroundColor: cardBg,
        transition: 'all 0.3s ease',
    };

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            backgroundColor: bgColor,
            color: textColor,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            overflowY: 'scroll',
            overflowX: 'hidden',
            scrollSnapType: 'y mandatory',
            scrollBehavior: 'smooth',
            transition: 'background-color 0.4s ease, color 0.4s ease',
        }}>
            {/* Navigation - Fixed */}
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 100,
                backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(245, 245, 245, 0.9)',
                backdropFilter: 'blur(10px)',
                borderBottom: `1px solid rgba(${fg}, 0.1)`,
                transition: 'background-color 0.4s ease',
            }}>
                {onBack && (
                    <button
                        onClick={onBack}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: textColor,
                            cursor: 'pointer',
                            fontSize: 12,
                            letterSpacing: '0.1em',
                            opacity: 0.7,
                        }}
                    >
                        ← Back to Studio
                    </button>
                )}
                <button
                    onClick={onToggleTheme}
                    style={{
                        background: 'none',
                        border: `1px solid rgba(${fg}, 0.2)`,
                        borderRadius: 8,
                        padding: 8,
                        cursor: 'pointer',
                        color: textColor,
                        opacity: 0.6,
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 'auto',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
                >
                    {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
            </nav>

            {/* Slide 1: Hero */}
            <section style={slideStyle}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: 11,
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        opacity: 0.4,
                        marginBottom: 32,
                    }}>
                        INTEGRAL LABS
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(26px, 5vw, 48px)',
                        fontWeight: 300,
                        lineHeight: 1.3,
                        maxWidth: 900,
                        margin: '0 auto 40px',
                        opacity: 0.9,
                    }}>
                        What if every relationship had a highly conscious mediator, a neutral, deeply aware space-holder?
                    </h1>

                    <p style={{
                        fontSize: 18,
                        opacity: 0.6,
                        marginBottom: 60,
                    }}>
                        We build <span style={{ opacity: 1, fontWeight: 500 }}>multi-party AI systems</span>
                    </p>

                    <div style={{ opacity: 0.3, animation: 'bounce 2s infinite' }}>
                        <ChevronDown size={28} />
                    </div>
                </div>
            </section>

            {/* Slide 2: What is Multi-Party AI */}
            <section style={slideStyle}>
                <div style={contentStyle}>
                    <div style={headingStyle}>What is Multi-Party AI?</div>
                    <div style={{
                        ...cardStyle,
                        maxWidth: 700,
                        margin: '0 auto',
                        textAlign: 'center',
                        background: isDarkMode
                            ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                            : 'linear-gradient(135deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.01) 100%)',
                    }}>
                        <Users size={40} style={{ opacity: 0.5, marginBottom: 24 }} />
                        <p style={{ fontSize: 22, lineHeight: 1.6, opacity: 0.85 }}>
                            Multi-party awareness is an AI system's ability to understand and act on <strong>group dynamics in real time</strong>.
                        </p>
                    </div>
                </div>
            </section>

            {/* Slide 3: Where It Works */}
            <section style={slideStyle}>
                <div style={contentStyle}>
                    <div style={headingStyle}>Where It Works</div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 20,
                    }}>
                        <div style={cardStyle}>
                            <Monitor size={28} style={{ opacity: 0.5, marginBottom: 16 }} />
                            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, letterSpacing: '0.1em' }}>
                                ONLINE MEETING ROOMS
                            </h3>
                            <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.65 }}>
                                Agent brings shared awareness into live digital conversations. She listens across meeting rooms, understands group dynamics in real time, and helps conversations move toward clarity, alignment, and meaningful outcomes.
                            </p>
                        </div>

                        <div style={cardStyle}>
                            <MessageCircle size={28} style={{ opacity: 0.5, marginBottom: 16 }} />
                            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, letterSpacing: '0.1em' }}>
                                TWO PEOPLE INTERACTION
                            </h3>
                            <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.65 }}>
                                Agent supports one-to-one conversations with presence and timing. By sensing rhythm, emotion, and intent, she helps dialogue unfold naturally and strengthens mutual understanding.
                            </p>
                        </div>

                        <div style={cardStyle}>
                            <MapPin size={28} style={{ opacity: 0.5, marginBottom: 16 }} />
                            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, letterSpacing: '0.1em' }}>
                                IN-PERSON ENVIRONMENT
                            </h3>
                            <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.65 }}>
                                Agent extends into physical spaces as an ambient intelligence. She accompanies groups as a quiet facilitator, supporting connection, reflection, and collective decision-making.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Slide 4: Meet Norah */}
            <section style={{
                ...slideStyle,
                background: isDarkMode
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 50%)'
                    : 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, transparent 50%)',
            }}>
                <div style={{ ...contentStyle, textAlign: 'center', maxWidth: 800 }}>
                    <div style={headingStyle}>Meet Norah</div>

                    <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        border: `2px solid rgba(${fg}, 0.2)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 32px',
                        background: isDarkMode
                            ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)'
                            : 'linear-gradient(135deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.02) 100%)',
                    }}>
                        <Mic size={32} style={{ opacity: 0.6 }} />
                    </div>

                    <h2 style={{
                        fontSize: 26,
                        fontWeight: 400,
                        marginBottom: 24,
                        opacity: 0.9,
                    }}>
                        Multi-Party Aware AI
                    </h2>

                    <p style={{
                        fontSize: 16,
                        lineHeight: 1.8,
                        opacity: 0.7,
                        marginBottom: 28,
                    }}>
                        Norah is a real-time facilitator for group voice conversations. She joins a call on Google Meet, Zoom, or Teams, tracks who's speaking and what threads are forming, and only steps in when it will improve the human outcome.
                    </p>

                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 12,
                        justifyContent: 'center',
                        marginBottom: 28,
                    }}>
                        {['Reducing cross-talk', 'Surfacing the unspoken', 'Clarifying decisions', 'Amplifying quiet voices'].map((item) => (
                            <span key={item} style={{
                                padding: '8px 16px',
                                borderRadius: 20,
                                border: pillBorder,
                                fontSize: 12,
                                opacity: 0.7,
                            }}>
                                {item}
                            </span>
                        ))}
                    </div>

                    <p style={{
                        fontSize: 14,
                        lineHeight: 1.8,
                        opacity: 0.45,
                        fontStyle: 'italic',
                    }}>
                        When the room aligns, Norah quietly turns the moment into structure—decision, owner, next step—without derailing the flow.
                    </p>
                </div>
            </section>

            {/* Slide 5: Industry Use Cases */}
            <section style={slideStyle}>
                <div style={contentStyle}>
                    <div style={headingStyle}>Industry Use Cases</div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 20,
                    }}>
                        {INDUSTRIES.map((industry, index) => (
                            <div
                                key={industry.title}
                                style={{
                                    ...cardStyle,
                                    cursor: 'pointer',
                                }}
                                onClick={() => setExpandedIndustry(expandedIndustry === index ? null : index)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
                                    e.currentTarget.style.borderColor = `rgba(${fg}, 0.2)`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = cardBg;
                                    e.currentTarget.style.borderColor = `rgba(${fg}, 0.1)`;
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                }}>
                                    <h3 style={{
                                        fontSize: 15,
                                        fontWeight: 600,
                                        marginBottom: 14,
                                        letterSpacing: '0.05em',
                                    }}>
                                        {industry.title}
                                    </h3>
                                    <ChevronDown
                                        size={16}
                                        style={{
                                            opacity: 0.4,
                                            transform: expandedIndustry === index ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.3s ease',
                                        }}
                                    />
                                </div>

                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 6,
                                    marginBottom: expandedIndustry === index ? 14 : 0,
                                }}>
                                    {industry.items.map((item) => (
                                        <span key={item} style={{
                                            padding: '4px 10px',
                                            borderRadius: 4,
                                            backgroundColor: pillBg,
                                            fontSize: 10,
                                            opacity: 0.7,
                                        }}>
                                            {item}
                                        </span>
                                    ))}
                                </div>

                                <div style={{
                                    maxHeight: expandedIndustry === index ? 150 : 0,
                                    overflow: 'hidden',
                                    transition: 'max-height 0.3s ease',
                                }}>
                                    <p style={{
                                        fontSize: 12,
                                        lineHeight: 1.7,
                                        opacity: 0.6,
                                        marginTop: 8,
                                    }}>
                                        {industry.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Slide 6: Team */}
            <section style={slideStyle}>
                <div style={contentStyle}>
                    <div style={headingStyle}>Team</div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        gap: 40,
                    }}>
                        {TEAM.map((member) => (
                            <div key={member.name} style={{
                                textAlign: 'center',
                                padding: 20,
                            }}>
                                <div style={{
                                    width: 72,
                                    height: 72,
                                    borderRadius: '50%',
                                    border: `1px solid rgba(${fg}, 0.2)`,
                                    backgroundColor: `rgba(${fg}, 0.05)`,
                                    margin: '0 auto 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 24,
                                    fontWeight: 300,
                                }}>
                                    {member.name.charAt(0)}
                                </div>
                                <h4 style={{
                                    fontSize: 14,
                                    fontWeight: 500,
                                    marginBottom: 4,
                                }}>
                                    {member.name}
                                </h4>
                                <p style={{
                                    fontSize: 10,
                                    opacity: 0.5,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                }}>
                                    {member.role}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Slide 7: Thesis */}
            <section style={{
                ...slideStyle,
                background: isDarkMode
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 50%)'
                    : 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, transparent 50%)',
            }}>
                <div style={{ ...contentStyle, maxWidth: 700 }}>
                    <div style={headingStyle}>Our Thesis</div>
                    <div>
                        {THESIS_POINTS.map((point, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 16,
                                    marginBottom: 24,
                                }}
                            >
                                <span style={{
                                    fontSize: 10,
                                    opacity: 0.3,
                                    fontWeight: 600,
                                    minWidth: 24,
                                }}>
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <p style={{
                                    fontSize: 16,
                                    lineHeight: 1.7,
                                    opacity: 0.8,
                                }}>
                                    {point}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Slide 8: CTA */}
            <section style={slideStyle}>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{
                        fontSize: 32,
                        fontWeight: 300,
                        marginBottom: 40,
                        opacity: 0.9,
                    }}>
                        Experience Norah
                    </h2>
                    <a
                        href="https://app.integrallabs.ai/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '18px 36px',
                            fontSize: 14,
                            fontFamily: 'inherit',
                            fontWeight: 500,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            border: `1px solid rgba(${fg}, 0.3)`,
                            borderRadius: 6,
                            backgroundColor: 'transparent',
                            color: textColor,
                            textDecoration: 'none',
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
                        Try Integral Labs
                        <ArrowRight size={18} />
                    </a>
                </div>
            </section>

            {/* Global styles */}
            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(8px); }
                }
                ::-webkit-scrollbar {
                    width: 0px;
                    background: transparent;
                }
            `}</style>
        </div>
    );
};
