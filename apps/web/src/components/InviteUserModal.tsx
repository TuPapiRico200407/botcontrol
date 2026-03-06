import React, { useState } from 'react';
import { useApi } from '../utils/api';
import { Modal, Button, Input, Select, Spinner } from '@botcontrol/ui';

interface InvitedMember {
    id: string;
    email: string;
    role: 'OWNER' | 'AGENT';
    user_id: string;
    activated_at: string | null;
    created_at: string;
    [key: string]: unknown;
}

interface InviteUserModalProps {
    orgId: string;
    onClose: () => void;
    onSuccess: (member: InvitedMember) => void;
}

const roleOptions = [
    { value: 'OWNER', label: 'Owner' },
    { value: 'AGENT', label: 'Agent' },
];

export function InviteUserModal({ orgId, onClose, onSuccess }: InviteUserModalProps) {
    const api = useApi();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('AGENT');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setError(null);

        if (!email.trim()) {
            setError('Email is required');
            return;
        }

        setLoading(true);
        const { data, error: apiError } = await api.inviteMember(orgId, email, role);
        setLoading(false);

        if (apiError) {
            setError(apiError.message);
            return;
        }

        onSuccess(data as InvitedMember);
    };

    return (
        <Modal title="Invite Member" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    id="email"
                    label="Email Address"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <Select
                    id="role"
                    label="Role"
                    options={roleOptions}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                />

                {error && <p className="text-sm text-red-400">{error}</p>}

                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? <Spinner size="sm" /> : 'Invite'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
