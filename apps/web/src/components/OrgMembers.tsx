import React, { useEffect, useState } from 'react';
import { useApi } from '../utils/api';
import { DataTable, Badge, Button, Spinner, EmptyState, Toast } from '@botcontrol/ui';
import { InviteUserModal } from './InviteUserModal';

interface Member {
    id: string;
    user_id: string;
    email: string;
    role: 'OWNER' | 'AGENT';
    activated_at: string | null;
    created_at: string;
    [key: string]: unknown;
}

export function OrgMembers({ orgId }: { orgId: string }) {
    const api = useApi();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadMembers();
    }, [orgId]);

    const loadMembers = async () => {
        setLoading(true);
        const { data, error } = await api.listMembers(orgId);
        setLoading(false);
        if (error) {
            setToast({ message: `Failed to load members: ${error.message}`, type: 'error' });
            return;
        }
        setMembers((data as Member[]) ?? []);
    };

    const handleMemberInvited = (newMember: Member) => {
        const member: Member = {
            id: newMember.id,
            user_id: newMember.user_id,
            email: newMember.email,
            role: newMember.role as 'OWNER' | 'AGENT',
            activated_at: newMember.activated_at,
            created_at: newMember.created_at,
        };
        setMembers([...members, member]);
        setShowInviteModal(false);
        setToast({ message: 'Member invited successfully!', type: 'success' });
    };

    if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Team Members</h3>
                    <p className="text-gray-400 text-sm">Manage members of this organization</p>
                </div>
                <Button onClick={() => setShowInviteModal(true)}>Invite Member</Button>
            </div>

            {members.length === 0 ? (
                <EmptyState
                    title="No members"
                    description="Invite members to collaborate on this organization"
                    action={<Button onClick={() => setShowInviteModal(true)}>Invite Member</Button>}
                />
            ) : (
                <DataTable
                    data={members as Record<string, unknown>[]}
                    columns={[
                        { key: 'email', header: 'Email' },
                        {
                            key: 'role',
                            header: 'Role',
                            render: (row) => {
                                const role = String(row.role);
                                const variant = role === 'OWNER' ? 'warning' : 'info';
                                return <Badge variant={variant}>{role}</Badge>;
                            },
                        },
                        {
                            key: 'activated_at',
                            header: 'Status',
                            render: (row) => {
                                const isActive = row.activated_at !== null;
                                return (
                                    <Badge variant={isActive ? 'success' : 'warning'}>
                                        {isActive ? 'Active' : 'Pending'}
                                    </Badge>
                                );
                            },
                        },
                        {
                            key: 'created_at',
                            header: 'Invited',
                            render: (row) => new Date(String(row.created_at)).toLocaleDateString(),
                        },
                    ]}
                />
            )}

            {showInviteModal && (
                <InviteUserModal
                    orgId={orgId}
                    onClose={() => setShowInviteModal(false)}
                    onSuccess={handleMemberInvited}
                />
            )}
        </div>
    );
}
