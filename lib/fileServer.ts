const API_BASE = 'http://localhost:3001/api';

export interface SavedFile {
    name: string;
    path: string;
    modified: string;
}

// Check if file server is running
export const isFileServerRunning = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE}/list-saved`, { method: 'GET' });
        return response.ok;
    } catch {
        return false;
    }
};

// Save HTML to Saved HTML Files folder
export const saveHtmlFile = async (filename: string, content: string): Promise<{ success: boolean; path?: string; error?: string }> => {
    try {
        const response = await fetch(`${API_BASE}/save-html`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, content }),
        });
        return await response.json();
    } catch (error: any) {
        return { success: false, error: error.message || 'Server not running' };
    }
};

// Save to Default Templates folder
export const saveDefaultTemplate = async (filename: string, content: string): Promise<{ success: boolean; path?: string; error?: string }> => {
    try {
        const response = await fetch(`${API_BASE}/save-default-template`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, content }),
        });
        return await response.json();
    } catch (error: any) {
        return { success: false, error: error.message || 'Server not running' };
    }
};

// List saved HTML files
export const listSavedFiles = async (): Promise<SavedFile[]> => {
    try {
        const response = await fetch(`${API_BASE}/list-saved`);
        const data = await response.json();
        return data.files || [];
    } catch {
        return [];
    }
};

// List default templates
export const listDefaultTemplates = async (): Promise<SavedFile[]> => {
    try {
        const response = await fetch(`${API_BASE}/list-templates`);
        const data = await response.json();
        return data.files || [];
    } catch {
        return [];
    }
};

// Load file content
export const loadFileContent = async (filePath: string): Promise<string | null> => {
    try {
        const response = await fetch(`${API_BASE}/load-file?path=${encodeURIComponent(filePath)}`);
        const data = await response.json();
        return data.content || null;
    } catch {
        return null;
    }
};

// Delete saved file
export const deleteSavedFile = async (filePath: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE}/delete-file`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: filePath }),
        });
        const data = await response.json();
        return data.success || false;
    } catch {
        return false;
    }
};
