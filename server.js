const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Base paths for saving files
const BASE_DIR = 'C:\\Custom Apps\\AI Interface Studio 2';
const SAVED_HTML_DIR = path.join(BASE_DIR, 'Saved HTML Files');
const DEFAULT_TEMPLATES_DIR = path.join(BASE_DIR, 'Default Templates');

// Ensure directories exist
[SAVED_HTML_DIR, DEFAULT_TEMPLATES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Save HTML file to Saved HTML Files folder
app.post('/api/save-html', (req, res) => {
    try {
        const { filename, content } = req.body;
        if (!filename || !content) {
            return res.status(400).json({ error: 'Missing filename or content' });
        }

        const safeName = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const filePath = path.join(SAVED_HTML_DIR, safeName);

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Saved: ${filePath}`);

        res.json({ success: true, path: filePath });
    } catch (error) {
        console.error('Error saving HTML:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save default template
app.post('/api/save-default-template', (req, res) => {
    try {
        const { filename, content } = req.body;
        if (!filename || !content) {
            return res.status(400).json({ error: 'Missing filename or content' });
        }

        const safeName = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const filePath = path.join(DEFAULT_TEMPLATES_DIR, safeName);

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Saved default template: ${filePath}`);

        res.json({ success: true, path: filePath });
    } catch (error) {
        console.error('Error saving template:', error);
        res.status(500).json({ error: error.message });
    }
});

// List saved HTML files
app.get('/api/list-saved', (req, res) => {
    try {
        const files = fs.readdirSync(SAVED_HTML_DIR)
            .filter(f => f.endsWith('.html'))
            .map(f => ({
                name: f,
                path: path.join(SAVED_HTML_DIR, f),
                modified: fs.statSync(path.join(SAVED_HTML_DIR, f)).mtime
            }));
        res.json({ files });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List default templates
app.get('/api/list-templates', (req, res) => {
    try {
        const files = fs.readdirSync(DEFAULT_TEMPLATES_DIR)
            .filter(f => f.endsWith('.html'))
            .map(f => ({
                name: f,
                path: path.join(DEFAULT_TEMPLATES_DIR, f),
                modified: fs.statSync(path.join(DEFAULT_TEMPLATES_DIR, f)).mtime
            }));
        res.json({ files });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Load a file
app.get('/api/load-file', (req, res) => {
    try {
        const { path: filePath } = req.query;
        if (!filePath) {
            return res.status(400).json({ error: 'Missing path' });
        }

        // Security: only allow reading from our directories
        const normalized = path.normalize(filePath);
        if (!normalized.startsWith(SAVED_HTML_DIR) && !normalized.startsWith(DEFAULT_TEMPLATES_DIR)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const content = fs.readFileSync(normalized, 'utf8');
        res.json({ content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a saved file
app.delete('/api/delete-file', (req, res) => {
    try {
        const { path: filePath } = req.body;
        if (!filePath) {
            return res.status(400).json({ error: 'Missing path' });
        }

        const normalized = path.normalize(filePath);
        if (!normalized.startsWith(SAVED_HTML_DIR)) {
            return res.status(403).json({ error: 'Can only delete from Saved HTML Files' });
        }

        fs.unlinkSync(normalized);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n📁 File Server running on http://localhost:${PORT}`);
    console.log(`   Saved HTML: ${SAVED_HTML_DIR}`);
    console.log(`   Templates:  ${DEFAULT_TEMPLATES_DIR}\n`);
});
