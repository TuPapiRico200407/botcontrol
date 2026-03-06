import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export function Input({ label, error, id, className = '', ...rest }: InputProps) {
    return (
        <div className="flex flex-col gap-1">
            {label && <label htmlFor={id} className="text-sm font-medium text-gray-300">{label}</label>}
            <input
                id={id}
                className={`block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-900 disabled:text-gray-600 transition-colors duration-200 ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
                {...rest}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    );
}

export function Textarea({ label, error, id, className = '', ...rest }: TextareaProps) {
    return (
        <div className="flex flex-col gap-1">
            {label && <label htmlFor={id} className="text-sm font-medium text-gray-300">{label}</label>}
            <textarea
                id={id}
                className={`block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-900 disabled:text-gray-600 transition-colors duration-200 resize-vertical min-h-[100px] ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
                {...rest}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    );
}
