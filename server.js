import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

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

app.listen(PORT, () => {
    console.log(`\n📁 File Server running on http://localhost:${PORT}`);
    console.log(`   Saved Profiles: ${SAVED_PROFILES_DIR}\n`);
});
