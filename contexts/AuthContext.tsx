import React, { createContext, useContext, useState } from 'react';

// Mock types since we aren't using Supabase
export interface User {
    id: string;
    email?: string;
    app_metadata: Record<string, any>;
    user_metadata: Record<string, any>;
    aud: string;
    created_at: string;
    phone?: string;
    confirmed_at?: string;
    last_sign_in_at?: string;
    role?: string;
    updated_at?: string;
    identities?: any[];
}

export interface Session {
    user: User;
    access_token: string;
}

export interface AuthError {
    message: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    deleteAccount: () => Promise<{ error: string | null }>;
    isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for local mode
const MOCK_USER: User = {
    id: 'guest',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'guest@localhost',
    phone: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    role: 'authenticated',
    updated_at: new Date().toISOString(),
    identities: []
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Always authenticated as guest
    const [user] = useState<User | null>(MOCK_USER);
    const [session] = useState<Session | null>(null);
    const [loading] = useState(false);

    const signUp = async (email: string, password: string) => {
        return { error: null };
    };

    const signIn = async (email: string, password: string) => {
        return { error: null };
    };

    const signOut = async () => {
        // No-op for guest
        return;
    };

    const deleteAccount = async (): Promise<{ error: string | null }> => {
        return { error: 'Cannot delete guest account' };
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                loading,
                signUp,
                signIn,
                signOut,
                deleteAccount,
                isConfigured: false, // Supabase is not configured
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
