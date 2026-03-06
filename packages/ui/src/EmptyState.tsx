import React from 'react';

interface EmptyStateProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            {icon && <div className="mb-4 text-gray-600 text-5xl">{icon}</div>}
            <h3 className="text-base font-semibold text-gray-200">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
