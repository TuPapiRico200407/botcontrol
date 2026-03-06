import React, { useState } from 'react';
import { useApi } from '../utils/api';
import { Card, Button, Input, Toast } from '@botcontrol/ui';

interface Organization {
    id: string;
    name: string;
    slug: string;
    [key: string]: unknown;
}

interface OrgSettingsProps {
    orgId: string;
    org: Organization;
    onRefresh: () => void;
}

export function OrgSettings({ orgId, org, onRefresh }: OrgSettingsProps) {
    const [name, setName] = useState(org.name);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setToast({ message: 'Organization name is required', type: 'error' });
            return;
        }

        setSaving(true);
        const api = useApi();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { data: _data, error } = await api.updateOrg(orgId, { name });
        setSaving(false);

        if (error) {
            setToast({ message: `Failed to save: ${error.message}`, type: 'error' });
            return;
        }

        setToast({ message: 'Organization updated successfully!', type: 'success' });
        onRefresh();
    };

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <Card title="Organization Settings" description="Manage your organization details">
                <form onSubmit={handleSave} className="space-y-4">
                    <Input
                        id="name"
                        label="Organization Name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <div className="flex gap-3">
                        <Button type="submit" isLoading={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            </Card>

            <Card title="Organization Info" description="View your organization details">
                <div className="space-y-3">
                    <div>
                        <p className="text-gray-400 text-sm">Organization ID</p>
                        <p className="text-white font-mono text-sm break-all">{orgId}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Slug</p>
                        <p className="text-white">{org.slug}</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
