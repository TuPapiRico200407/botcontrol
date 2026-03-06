import React from 'react';

interface CardProps {
    title?: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    variant?: 'default' | 'highlight';
}

export function Card({ title, description, children, footer, className = '', variant = 'default' }: CardProps) {
    const variantClasses = variant === 'highlight'
        ? 'bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700'
        : 'bg-gray-800 border-gray-700';

    return (
        <div className={`rounded-lg border ${variantClasses} overflow-hidden shadow-md ${className}`}>
            {(title || description) && (
                <div className="px-6 py-4 border-b border-gray-700">
                    {title && <h3 className="text-lg font-semibold text-gray-100">{title}</h3>}
                    {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
                </div>
            )}
            <div className="px-6 py-4">
                {children}
            </div>
            {footer && (
                <div className="px-6 py-4 border-t border-gray-700 bg-gray-900 flex gap-2">
                    {footer}
                </div>
            )}
        </div>
    );
}
