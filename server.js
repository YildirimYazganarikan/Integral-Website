import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Supabase Admin Client (for server-side operations)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabaseAdmin = null;

if (supabaseUrl && supabaseServiceKey && supabaseServiceKey !== 'YOUR_SERVICE_ROLE_KEY_HERE') {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
    console.log('✅ Supabase Admin client initialized');
} else {
    console.warn('⚠️ Supabase Admin client not configured - user deletion disabled');
}

// Base paths for saving files
const BASE_DIR = __dirname;
const SAVED_PROFILES_DIR = path.join(BASE_DIR, 'Saved Profiles');

// Ensure directory exists
if (!fs.existsSync(SAVED_PROFILES_DIR)) {
    fs.mkdirSync(SAVED_PROFILES_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper: Extract profile JSON from HTML content
const extractProfileFromHtml = (htmlContent) => {
    const match = htmlContent.match(/<script id="nora-profile-data" type="application\/json">([\s\S]*?)<\/script>/);
    if (match && match[1]) {
        return JSON.parse(match[1]);
    }
    return null;
};

// Helper: Check if filename is a default template
const isDefaultTemplate = (filename) => {
    return filename.endsWith('_Default.html');
};

// Helper: Get profile type from default template filename
const getTypeFromDefaultFilename = (filename) => {
    const match = filename.match(/^(.+)_Default\.html$/);
    return match ? match[1] : null;
};

// List all profiles (for initial load)
app.get('/api/list-all-profiles', (req, res) => {
    try {
        const files = fs.readdirSync(SAVED_PROFILES_DIR)
            .filter(f => f.endsWith('.html'));

        const profiles = [];
        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(SAVED_PROFILES_DIR, file), 'utf8');
                const profile = extractProfileFromHtml(content);
                if (profile) {
                    profiles.push({
                        ...profile,
                        _filename: file,
                        _isDefault: isDefaultTemplate(file)
                    });
                }
            } catch (err) {
                console.error(`Error reading ${file}:`, err.message);
            }
        }

        res.json({ profiles });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save profile as HTML
app.post('/api/save-profile', (req, res) => {
    try {
        const { filename, htmlContent, isDefault, profileType } = req.body;
        if (!filename || !htmlContent) {
            return res.status(400).json({ error: 'Missing filename or htmlContent' });
        }

        // Clean filename
        let baseName = filename.replace(/\.html$/i, '').replace(/[^a-zA-Z0-9_\-\. ]/g, '_');

        // For default templates, use TYPE_Default.html format
        let safeName;
        if (isDefault && profileType) {
            safeName = `${profileType}_Default.html`;
        } else {
            safeName = `${baseName}.html`;
        }

        const filePath = path.join(SAVED_PROFILES_DIR, safeName);

        fs.writeFileSync(filePath, htmlContent, 'utf8');
        console.log(`Saved profile: ${filePath}`);

        res.json({ success: true, path: filePath, filename: safeName });
    } catch (error) {
        console.error('Error saving profile:', error);
        res.status(500).json({ error: error.message });
    }
});

// List saved profiles (metadata only)
app.get('/api/list-profiles', (req, res) => {
    try {
        const files = fs.readdirSync(SAVED_PROFILES_DIR)
            .filter(f => f.endsWith('.html'))
            .map(f => {
                const stats = fs.statSync(path.join(SAVED_PROFILES_DIR, f));
                return {
                    name: f,
                    path: path.join(SAVED_PROFILES_DIR, f),
                    modified: stats.mtime,
                    isDefault: isDefaultTemplate(f)
                };
            });
        res.json({ files });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Load profile content from HTML
app.get('/api/load-profile', (req, res) => {
    try {
        const { filename } = req.query;
        if (!filename) {
            return res.status(400).json({ error: 'Missing filename' });
        }

        const filePath = path.join(SAVED_PROFILES_DIR, filename);

        // Security: ensure path is within our directory
        if (!filePath.startsWith(SAVED_PROFILES_DIR)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const htmlContent = fs.readFileSync(filePath, 'utf8');
        const profile = extractProfileFromHtml(htmlContent);

        if (profile) {
            res.json({ profile, filename, htmlContent });
        } else {
            res.status(400).json({ error: 'Could not parse profile from HTML' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete profile
app.delete('/api/delete-profile', (req, res) => {
    try {
        const { filename } = req.body;
        if (!filename) {
            return res.status(400).json({ error: 'Missing filename' });
        }

        const filePath = path.join(SAVED_PROFILES_DIR, filename);

        if (!filePath.startsWith(SAVED_PROFILES_DIR)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Open folder in file explorer
app.get('/api/open-folder', (req, res) => {
    try {
        exec(`explorer "${SAVED_PROFILES_DIR}"`);
        res.json({ success: true, path: SAVED_PROFILES_DIR });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get default template for a profile type
app.get('/api/get-default-template', (req, res) => {
    try {
        const { type } = req.query;
        const expectedFilename = `${type}_Default.html`;
        const filePath = path.join(SAVED_PROFILES_DIR, expectedFilename);

        if (fs.existsSync(filePath)) {
            const htmlContent = fs.readFileSync(filePath, 'utf8');
            const profile = extractProfileFromHtml(htmlContent);
            if (profile) {
                res.json({ found: true, filename: expectedFilename, profile });
                return;
            }
        }

        res.json({ found: false });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save profile order
app.post('/api/save-profile-order', (req, res) => {
    try {
        const { order } = req.body;
        if (!Array.isArray(order)) {
            return res.status(400).json({ error: 'Order must be an array' });
        }

        const orderPath = path.join(SAVED_PROFILES_DIR, '_profile_order.json');
        fs.writeFileSync(orderPath, JSON.stringify({ order }, null, 2), 'utf8');
        console.log('Saved profile order:', order.length, 'profiles');
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving profile order:', error);
        res.status(500).json({ error: error.message });
    }
});

// Load profile order
app.get('/api/load-profile-order', (req, res) => {
    try {
        const orderPath = path.join(SAVED_PROFILES_DIR, '_profile_order.json');
        if (fs.existsSync(orderPath)) {
            const content = fs.readFileSync(orderPath, 'utf8');
            const data = JSON.parse(content);
            res.json({ order: data.order || [] });
        } else {
            res.json({ order: [] });
        }
    } catch (error) {
        console.error('Error loading profile order:', error);
        res.json({ order: [] });
    }
});

// DELETE USER ACCOUNT (requires auth token)
app.delete('/api/delete-user', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        if (!supabaseAdmin) {
            return res.status(503).json({ error: 'User deletion is not configured on this server' });
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
        res.json({ success: true, message: 'Account deleted successfully' });

    } catch (error) {
        console.error('Error in delete-user endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n📁 File Server running on http://localhost:${PORT}`);
    console.log(`   Saved Profiles: ${SAVED_PROFILES_DIR}\n`);
});
