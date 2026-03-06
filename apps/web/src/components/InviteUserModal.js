import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useApi } from '../utils/api';
import { Modal, Button, Input, Select, Spinner } from '@botcontrol/ui';
const roleOptions = [
    { value: 'OWNER', label: 'Owner' },
    { value: 'AGENT', label: 'Agent' },
];
export function InviteUserModal({ orgId, onClose, onSuccess }) {
    const api = useApi();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('AGENT');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
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
        onSuccess(data);
    };
    return (_jsx(Modal, { title: "Invite Member", onClose: onClose, children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsx(Input, { id: "email", label: "Email Address", type: "email", placeholder: "user@example.com", value: email, onChange: (e) => setEmail(e.target.value), required: true }), _jsx(Select, { id: "role", label: "Role", options: roleOptions, value: role, onChange: (e) => setRole(e.target.value) }), error && _jsx("p", { className: "text-sm text-red-400", children: error }), _jsxs("div", { className: "flex gap-3 justify-end", children: [_jsx(Button, { variant: "ghost", onClick: onClose, disabled: loading, children: "Cancel" }), _jsx(Button, { onClick: handleSubmit, disabled: loading, children: loading ? _jsx(Spinner, { size: "sm" }) : 'Invite' })] })] }) }));
}
