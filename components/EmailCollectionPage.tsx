import React, { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface EmailCollectionPageProps {
    onComplete: () => void;
    onBack: () => void;
    isDarkMode: boolean;
}

const EmailCollectionPage: React.FC<EmailCollectionPageProps> = ({ onComplete, onBack, isDarkMode }) => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const bg = isDarkMode ? '#000' : '#f5f5f5';
    const fg = isDarkMode ? '255, 255, 255' : '0, 0, 0';
    const text = isDarkMode ? '#fff' : '#000';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsSubmitting(true);

        // Save to local storage for persistence across reloads if needed
        localStorage.setItem('user_email', email);

        const googleScriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

        console.log('Using Script URL:', googleScriptUrl); // DEBUG: Check if URL is loaded

        if (googleScriptUrl) {
            try {
                console.log('Sending fetch request...');
                // simple-fetch to Google Apps Script (no-cors mode is typical for these scripts)
                await fetch(googleScriptUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                });
                console.log('Fetch request sent (opaque response due to no-cors)');
            } catch (error) {
                console.error('Error saving email to Google Sheet:', error);
            }
        } else {
            console.warn('VITE_GOOGLE_SCRIPT_URL not set');
        }

        setIsSubmitting(false);
        setIsSubmitted(true);
        // onComplete(); // Disable entering the app
    };

    if (isSubmitted) {
        return (
            <div style={{
                width: '100vw',
                height: '100vh',
                backgroundColor: bg,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                color: text,
                transition: 'background-color 0.4s ease, color 0.4s ease',
            }}>
                <div style={{
                    maxWidth: 400,
                    width: '100%',
                    textAlign: 'center',
                    padding: '0 24px',
                    animation: 'fadeIn 0.8s ease-out'
                }}>
                    <h1 style={{
                        fontSize: 24,
                        fontWeight: 600,
                        letterSpacing: '-0.02em',
                        marginBottom: 16,
                        color: text
                    }}>
                        Thank You
                    </h1>
                    <p style={{
                        fontSize: 13,
                        opacity: 0.6,
                        marginBottom: 40,
                        lineHeight: '1.6',
                        fontFamily: 'inherit'
                    }}>
                        We will get back to you soon.
                    </p>

                    <button
                        onClick={onBack}
                        style={{
                            marginTop: 32,
                            padding: '12px 24px',
                            fontSize: 12,
                            fontFamily: 'inherit',
                            fontWeight: 500,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            border: `1px solid rgba(${fg}, 0.2)`,
                            borderRadius: 6,
                            backgroundColor: 'transparent',
                            color: text,
                            cursor: 'pointer',
                            opacity: 0.6,
                            transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `rgba(${fg}, 0.05)`;
                            e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.opacity = '0.6';
                        }}
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: bg,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            color: text,
            transition: 'background-color 0.4s ease, color 0.4s ease',
            position: 'relative'
        }}>
            {/* Back Button */}
            <button
                onClick={onBack}
                style={{
                    position: 'absolute',
                    top: 24,
                    left: 24,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'none',
                    border: 'none',
                    color: text,
                    opacity: 0.5,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    transition: 'opacity 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
            >
                <ArrowLeft size={16} />
                Back
            </button>

            <div style={{
                maxWidth: 400,
                width: '100%',
                textAlign: 'center',
                padding: '0 24px',
                animation: 'fadeIn 0.8s ease-out'
            }}>
                <h1 style={{
                    fontSize: 24,
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    marginBottom: 16,
                    color: text
                }}>
                    Experience Norah
                </h1>

                <p style={{
                    fontSize: 13,
                    opacity: 0.6,
                    marginBottom: 40,
                    lineHeight: '1.6',
                    fontFamily: 'inherit'
                }}>
                    Enter your email to join the waitlist.
                </p>

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <div style={{ marginBottom: 24 }}>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                            style={{
                                width: '100%',
                                padding: '12px 0',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: `1px solid rgba(${fg}, 0.2)`,
                                borderRadius: 0,
                                fontSize: 16,
                                color: text,
                                outline: 'none',
                                textAlign: 'center',
                                fontFamily: 'inherit',
                                transition: 'border-color 0.3s ease'
                            }}
                            onFocus={(e) => e.target.style.borderBottomColor = `rgba(${fg}, 0.8)`}
                            onBlur={(e) => e.target.style.borderBottomColor = `rgba(${fg}, 0.2)`}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '14px 0',
                            fontSize: 12,
                            fontFamily: 'inherit',
                            fontWeight: 500,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            border: `1px solid rgba(${fg}, 0.3)`,
                            borderRadius: 6,
                            backgroundColor: 'transparent',
                            color: text,
                            cursor: isSubmitting ? 'wait' : 'pointer',
                            opacity: isSubmitting ? 0.5 : 1,
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 12
                        }}
                        onMouseEnter={(e) => {
                            if (!isSubmitting) {
                                e.currentTarget.style.backgroundColor = `rgba(${fg}, 0.05)`;
                                e.currentTarget.style.borderColor = `rgba(${fg}, 0.6)`;
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isSubmitting) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.borderColor = `rgba(${fg}, 0.3)`;
                            }
                        }}
                    >
                        {isSubmitting ? 'Processing...' : 'Join Waitlist'}
                        {!isSubmitting && <ArrowRight size={14} style={{ opacity: 0.7 }} />}
                    </button>
                    <style>{`
                        input::placeholder {
                            color: rgba(${fg}, 0.3);
                        }
                    `}</style>
                </form>

                <div style={{ marginTop: 32, fontSize: 10, opacity: 0.3, letterSpacing: '0.05em' }}>
                    Integral Labs
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default EmailCollectionPage;
