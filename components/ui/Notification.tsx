import React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { Notification as NotificationType } from '../../hooks/useNotification';

interface NotificationProps {
    notification: NotificationType | null;
}

export const Notification: React.FC<NotificationProps> = ({ notification }) => {
    if (!notification) return null;

    return (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
            {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            {notification.message}
        </div>
    );
};
