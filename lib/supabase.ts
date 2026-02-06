import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Cloud features will be disabled.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
    return Boolean(supabaseUrl && supabaseAnonKey);
};

// Get or create device ID for anonymous storage
export const getDeviceId = (): string => {
    const DEVICE_ID_KEY = 'nora_device_id';
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
};

// Database types
export interface DbProfile {
    id: string;
    device_id: string;
    name: string;
    type: string;
    settings: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface DbDefaultTemplate {
    id: string;
    device_id: string;
    profile_type: string;
    profile_id: string | null;
    created_at: string;
}
