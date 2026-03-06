import React from 'react';

interface FormFieldProps {
    label: string;
    error?: string;
    helper?: string;
    required?: boolean;
    children: React.ReactNode;
}

/**
 * FormField is a wrapper component that provides label, error, and helper text
 * for form inputs. Use this to wrap Input, Select, Textarea, etc.
 *
 * @example
 * <FormField label="Email" error={errors.email} required>
 *   <Input id="email" name="email" type="email" {...register('email')} />
 * </FormField>
 */
export function FormField({ label, error, helper, required, children }: FormFieldProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">
                {label}
                {required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <div className="flex flex-col gap-1">
                {children}
                {error && <p className="text-xs text-red-400">{error}</p>}
                {helper && !error && <p className="text-xs text-gray-500">{helper}</p>}
            </div>
        </div>
    );
}
