import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface EmailCollectionPageProps {
    onComplete: () => void;
    isDarkMode: boolean;
}

const EmailCollectionPage: React.FC<EmailCollectionPageProps> = ({ onComplete, isDarkMode }) => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const bg = isDarkMode ? '#000' : '#f5f5f5';
    const fg = isDarkMode ? '255, 255, 255' : '0, 0, 0';
    const text = isDarkMode ? '#fff' : '#000';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsSubmitting(true);

        // Simulate API call / save to local storage
        await new Promise(resolve => setTimeout(resolve, 800));
        localStorage.setItem('user_email', email);

        setIsSubmitting(false);
        onComplete();
    };

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
                    Experience Nora
                </h1>

                <p style={{
                    fontSize: 13,
                    opacity: 0.6,
                    marginBottom: 40,
                    lineHeight: '1.6',
                    fontFamily: 'inherit'
                }}>
                    Enter your email to begin your session.
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
                        {isSubmitting ? 'Processing...' : 'Continue'}
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
