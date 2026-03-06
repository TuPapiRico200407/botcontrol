import React, { useEffect } from 'react';

interface ModalProps {
    open?: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export function Modal({ open = true, onClose, title, children }: ModalProps) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md rounded-xl bg-gray-800 shadow-2xl border border-gray-700">
                <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
                    {title && <h2 className="text-base font-semibold text-gray-100">{title}</h2>}
                    <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-200 text-xl leading-none transition-colors duration-200">&times;</button>
                </div>
                <div className="px-6 py-4">{children}</div>
            </div>
        </div>
    );
}
