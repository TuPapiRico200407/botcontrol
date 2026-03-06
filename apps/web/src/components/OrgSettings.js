import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useApi } from '../utils/api';
import { Card, Button, Input, Toast } from '@botcontrol/ui';
export function OrgSettings({ orgId, org, onRefresh }) {
    const [name, setName] = useState(org.name);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const handleSave = async (e) => {
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
    return (_jsxs("div", { className: "space-y-6", children: [toast && _jsx(Toast, { message: toast.message, type: toast.type, onClose: () => setToast(null) }), _jsx(Card, { title: "Organization Settings", description: "Manage your organization details", children: _jsxs("form", { onSubmit: handleSave, className: "space-y-4", children: [_jsx(Input, { id: "name", label: "Organization Name", type: "text", value: name, onChange: (e) => setName(e.target.value), required: true }), _jsx("div", { className: "flex gap-3", children: _jsx(Button, { type: "submit", isLoading: saving, children: saving ? 'Saving...' : 'Save' }) })] }) }), _jsx(Card, { title: "Organization Info", description: "View your organization details", children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Organization ID" }), _jsx("p", { className: "text-white font-mono text-sm break-all", children: orgId })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Slug" }), _jsx("p", { className: "text-white", children: org.slug })] })] }) })] }));
}
