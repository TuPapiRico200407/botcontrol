import React, { useState } from 'react';
import { useApi } from '../utils/api';
import { Modal, Button, Input, Spinner } from '@botcontrol/ui';

interface CreatedOrganization {
    id: string;
    name: string;
    slug: string;
    [key: string]: unknown;
}

interface CreateOrgModalProps {
    onClose: () => void;
    onSuccess: (org: CreatedOrganization) => void;
}

export function CreateOrgModal({ onClose, onSuccess }: CreateOrgModalProps) {
    const api = useApi();
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setError(null);
        if (!name.trim()) {
            setError('Organization name is required');
            return;
        }
        if (!slug.trim()) {
            setError('Organization slug is required');
            return;
        }

        setLoading(true);
        const { data, error: apiError } = await api.createOrg(name, slug);
        setLoading(false);

        if (apiError) {
            setError(apiError.message);
            return;
        }

        onSuccess(data as CreatedOrganization);
    };

    return (
        <Modal title="Create Organization" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    id="name"
                    label="Organization Name"
                    type="text"
                    placeholder="Acme Inc"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        // Auto-generate slug from name
                        setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }}
                    required
                />
                <Input
                    id="slug"
                    label="Organization Slug"
                    type="text"
                    placeholder="acme-inc"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    required
                />

                {error && <p className="text-sm text-red-400">{error}</p>}

                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? <Spinner size="sm" /> : 'Create'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
