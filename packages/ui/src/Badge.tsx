import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-gray-700 text-gray-300',
    success: 'bg-green-900 text-green-200',
    warning: 'bg-yellow-900 text-yellow-200',
    danger: 'bg-red-900 text-red-200',
    info: 'bg-blue-900 text-blue-200',
};

interface BadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
}

export function Badge({ variant = 'default', children }: BadgeProps) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}>
            {children}
        </span>
    );
}
