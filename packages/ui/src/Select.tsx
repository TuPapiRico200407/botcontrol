import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export function Select({ label, error, id, options, className = '', ...rest }: SelectProps) {
    return (
        <div className="flex flex-col gap-1">
            {label && <label htmlFor={id} className="text-sm font-medium text-gray-300">{label}</label>}
            <select
                id={id}
                className={`block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-900 disabled:text-gray-600 transition-colors duration-200 ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
                {...rest}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-gray-800 text-gray-100">{opt.label}</option>
                ))}
            </select>
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    );
}
