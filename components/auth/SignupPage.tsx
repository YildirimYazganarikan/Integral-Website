import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Loader2, ArrowRight, LogIn, Check } from 'lucide-react';

interface SignupPageProps {
    onSwitchToLogin: () => void;
    onSkip?: () => void;
    isDarkMode: boolean;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onSwitchToLogin, onSkip, isDarkMode }) => {
    const { signUp } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        const { error } = await signUp(email, password);

        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
        }
        setLoading(false);
    };

    const bgClass = isDarkMode ? 'bg-black text-white' : 'bg-white text-black';
    const inputClass = isDarkMode
        ? 'bg-white/10 border-white/20 focus:border-white/50 placeholder-white/40'
        : 'bg-black/5 border-black/20 focus:border-black/50 placeholder-black/40';
    const buttonClass = isDarkMode
        ? 'bg-white text-black hover:bg-white/90'
        : 'bg-black text-white hover:bg-black/90';

    if (success) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${bgClass} p-4`}>
                <div className="w-full max-w-md text-center">
                    <div className={`w-16 h-16 rounded-full ${isDarkMode ? 'bg-green-500/20' : 'bg-green-500/10'} flex items-center justify-center mx-auto mb-6`}>
                        <Check className="text-green-500" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Account Created!</h1>
                    <p className="opacity-60 mb-6">You can now sign in with your credentials.</p>
                    <button
                        onClick={onSwitchToLogin}
                        className={`py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 mx-auto transition-colors ${buttonClass}`}
                    >
                        <LogIn size={18} />
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex items-center justify-center ${bgClass} p-4`}>
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Create Account</h1>
                    <p className="opacity-60">Sign up to save your visualizer profiles</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={18} />
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 rounded-lg border outline-none transition-colors ${inputClass}`}
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={18} />
                        <input
                            type="password"
                            placeholder="Password (min 6 characters)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 rounded-lg border outline-none transition-colors ${inputClass}`}
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={18} />
                        <input
                            type="password"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 rounded-lg border outline-none transition-colors ${inputClass}`}
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${buttonClass} disabled:opacity-50`}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <>
                                Create Account
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center space-y-3">
                    <button
                        onClick={onSwitchToLogin}
                        className="opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 mx-auto"
                    >
                        <LogIn size={16} />
                        Already have an account? Sign in
                    </button>

                    {onSkip && (
                        <button
                            onClick={onSkip}
                            className="text-sm opacity-40 hover:opacity-70 transition-opacity"
                        >
                            Continue without account
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
