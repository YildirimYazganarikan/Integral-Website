
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    // Only allow DELETE requests
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify configuration
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase credentials in environment variables');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        const token = authHeader.split(' ')[1];

        // Verify the token and get the user
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Delete all user data first (profiles, settings)
        await supabaseAdmin.from('visualizer_profiles').delete().eq('user_id', user.id);
        await supabaseAdmin.from('user_settings').delete().eq('user_id', user.id);
        await supabaseAdmin.from('user_profiles').delete().eq('id', user.id);

        // Delete the user account
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (deleteError) {
            console.error('Error deleting user:', deleteError);
            return res.status(500).json({ error: 'Failed to delete user account' });
        }

        console.log(`✅ Deleted user account: ${user.email}`);
        res.status(200).json({ success: true, message: 'Account deleted successfully' });

    } catch (error) {
        console.error('Error in delete-user endpoint:', error);
        res.status(500).json({ error: error.message });
    }
}
