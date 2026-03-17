import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';

export interface ChannelFormData {
    phone_number: string;
    phone_number_id: string;
    business_account_id?: string;
    access_token: string;
    webhook_verify_token?: string;
}

export interface ChannelFormProps {
    onSubmit: (data: ChannelFormData) => Promise<void>;
    isLoading?: boolean;
}

export function ChannelForm({ onSubmit, isLoading }: ChannelFormProps) {
    const [formData, setFormData] = useState<ChannelFormData>({
        phone_number: '',
        phone_number_id: '',
        business_account_id: '',
        access_token: '',
        webhook_verify_token: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    Phone Number
                </label>
                <Input
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="+1234567890"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    Phone Number ID
                </label>
                <Input
                    name="phone_number_id"
                    value={formData.phone_number_id}
                    onChange={handleChange}
                    placeholder="123456789012345"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    Business Account ID (optional)
                </label>
                <Input
                    name="business_account_id"
                    value={formData.business_account_id}
                    onChange={handleChange}
                    placeholder="123456789012345"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    Access Token (System User)
                </label>
                <Input
                    type="password"
                    name="access_token"
                    value={formData.access_token}
                    onChange={handleChange}
                    placeholder="EAAB..."
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    Webhook Verify Token (optional)
                </label>
                <Input
                    type="password"
                    name="webhook_verify_token"
                    value={formData.webhook_verify_token}
                    onChange={handleChange}
                    placeholder="Leave blank to use system default"
                />
            </div>

            <div className="pt-2">
                <Button type="submit" isLoading={isLoading} className="w-full">
                    Connect Channel
                </Button>
            </div>
        </form>
    );
}
