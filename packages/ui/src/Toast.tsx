import React, { useEffect, useState } from 'react';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
    id: string;
    message: string;
    variant: ToastVariant;
}

const variantClasses: Record<ToastVariant, string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-yellow-500',
};

interface ToastProps {
    toasts: ToastItem[];
    onRemove: (id: string) => void;
}

function ToastNotification({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${variantClasses[toast.variant]}`}>
            <span>{toast.message}</span>
            <button onClick={() => onRemove(toast.id)} className="ml-2 text-white/70 hover:text-white">&times;</button>
        </div>
    );
}

export function ToastContainer({ toasts, onRemove }: ToastProps) {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((t) => (
                <ToastNotification key={t.id} toast={t} onRemove={onRemove} />
            ))}
        </div>
    );
}

export function useToast() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const addToast = (message: string, variant: ToastVariant = 'info') => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev: ToastItem[]) => [...prev, { id, message, variant }]);
    };

    const removeToast = (id: string) => {
        setToasts((prev: ToastItem[]) => prev.filter((t: ToastItem) => t.id !== id));
    };

    return { toasts, addToast, removeToast };
}
