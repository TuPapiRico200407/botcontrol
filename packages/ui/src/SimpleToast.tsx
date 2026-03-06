import React, { useEffect, useState } from 'react';

interface SimpleToastProps {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    onClose: () => void;
    duration?: number;
}

const typeClasses: Record<string, string> = {
    success: 'bg-green-900 border-green-700 text-green-200',
    error: 'bg-red-900 border-red-700 text-red-200',
    info: 'bg-blue-900 border-blue-700 text-blue-200',
    warning: 'bg-yellow-900 border-yellow-700 text-yellow-200',
};

export function Toast({ message, type, onClose, duration = 4000 }: SimpleToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    return (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg border ${typeClasses[type]}`}>
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{message}</span>
                <button
                    onClick={onClose}
                    className="ml-2 text-current/70 hover:text-current transition-colors"
                    aria-label="Close"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
