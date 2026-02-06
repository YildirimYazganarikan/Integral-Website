import { useState, useEffect } from 'react';

const DEFAULT_API_KEY = 'AIzaSyCz3XxWf-iWU0VzuawBiBZTiTQ40QGW7pA';

export function useApiKey() {
    const [apiKey, setApiKey] = useState<string>(() => {
        const stored = localStorage.getItem('gemini_api_key');
        return stored || DEFAULT_API_KEY;
    });
    const [showApiKey, setShowApiKey] = useState(false);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('gemini_api_key', apiKey);
    }, [apiKey]);

    return {
        apiKey,
        setApiKey,
        showApiKey,
        setShowApiKey
    };
}
