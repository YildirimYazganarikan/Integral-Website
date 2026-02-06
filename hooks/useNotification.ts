import { useState, useCallback } from 'react';

export interface Notification {
    type: 'success' | 'error';
    message: string;
}

export function useNotification() {
    const [notification, setNotification] = useState<Notification | null>(null);

    const showNotification = useCallback((type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    }, []);

    const clearNotification = useCallback(() => {
        setNotification(null);
    }, []);

    return {
        notification,
        showNotification,
        clearNotification
    };
}
