import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useApi } from '../utils/api';
import { DataTable, Badge, Button, Spinner, EmptyState, Toast } from '@botcontrol/ui';
import { InviteUserModal } from './InviteUserModal';
export function OrgMembers({ orgId }) {
    const api = useApi();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [toast, setToast] = useState(null);
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
        setMembers(data ?? []);
    };
    const handleMemberInvited = (newMember) => {
        const member = {
            id: newMember.id,
            user_id: newMember.user_id,
            email: newMember.email,
            role: newMember.role,
            activated_at: newMember.activated_at,
            created_at: newMember.created_at,
        };
        setMembers([...members, member]);
        setShowInviteModal(false);
        setToast({ message: 'Member invited successfully!', type: 'success' });
    };
    if (loading)
        return _jsx("div", { className: "flex justify-center py-8", children: _jsx(Spinner, {}) });
    return (_jsxs("div", { className: "space-y-6", children: [toast && _jsx(Toast, { message: toast.message, type: toast.type, onClose: () => setToast(null) }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "Team Members" }), _jsx("p", { className: "text-gray-400 text-sm", children: "Manage members of this organization" })] }), _jsx(Button, { onClick: () => setShowInviteModal(true), children: "Invite Member" })] }), members.length === 0 ? (_jsx(EmptyState, { title: "No members", description: "Invite members to collaborate on this organization", action: _jsx(Button, { onClick: () => setShowInviteModal(true), children: "Invite Member" }) })) : (_jsx(DataTable, { data: members, columns: [
                    { key: 'email', header: 'Email' },
                    {
                        key: 'role',
                        header: 'Role',
                        render: (row) => {
                            const role = String(row.role);
                            const variant = role === 'OWNER' ? 'warning' : 'info';
                            return _jsx(Badge, { variant: variant, children: role });
                        },
                    },
                    {
                        key: 'activated_at',
                        header: 'Status',
                        render: (row) => {
                            const isActive = row.activated_at !== null;
                            return (_jsx(Badge, { variant: isActive ? 'success' : 'warning', children: isActive ? 'Active' : 'Pending' }));
                        },
                    },
                    {
                        key: 'created_at',
                        header: 'Invited',
                        render: (row) => new Date(String(row.created_at)).toLocaleDateString(),
                    },
                ] })), showInviteModal && (_jsx(InviteUserModal, { orgId: orgId, onClose: () => setShowInviteModal(false), onSuccess: handleMemberInvited }))] }));
}
