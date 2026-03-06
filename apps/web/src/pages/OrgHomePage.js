import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../utils/api';
import { Tabs, Spinner, AppShell, Toast } from '@botcontrol/ui';
import { BotSettings } from '../components/BotSettings';
import { AuditLogList } from '../components/AuditLogList';
import { OrgMembers } from '../components/OrgMembers';
import { OrgSettings } from '../components/OrgSettings';
export function OrgHomePage() {
    const { orgId } = useParams();
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const api = useApi();
    const [org, setOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    useEffect(() => {
        if (!orgId)
            return;
        loadOrg();
    }, [orgId]);
    const loadOrg = async () => {
        if (!orgId)
            return;
        setLoading(true);
        setError(null);
        const { data, error: apiError } = await api.getOrg(orgId);
        setLoading(false);
        if (apiError) {
            setError(apiError.message);
            setToast({ message: `Failed to load organization: ${apiError.message}`, type: 'error' });
            return;
        }
        setOrg(data);
    };
    const handleLogout = async () => {
        await signOut();
    };
    if (loading) {
        return (_jsx("div", { className: "flex h-screen items-center justify-center bg-gray-900", children: _jsx(Spinner, {}) }));
    }
    if (!org) {
        return (_jsx("div", { className: "flex h-screen items-center justify-center bg-gray-900", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-white mb-4", children: "Organization not found" }), _jsx("button", { onClick: () => navigate('/admin'), className: "text-blue-400 hover:text-blue-300", children: "Back to Admin" })] }) }));
    }
    const tabs = [
        { key: 'overview', label: 'Overview', content: _jsx(OrgSettings, { orgId: orgId, org: org, onRefresh: loadOrg }) },
        { key: 'bot', label: 'Bot / IA', content: _jsx(BotSettings, { orgId: orgId }) },
        { key: 'members', label: 'Members', content: _jsx(OrgMembers, { orgId: orgId }) },
        { key: 'audit', label: 'Audit', content: _jsx(AuditLogList, { orgId: orgId }) },
    ];
    return (_jsx(AppShell, { brand: org.name, subNav: _jsx("p", { className: "text-gray-400 text-sm", children: org.slug }), onLogout: handleLogout, content: _jsxs("div", { className: "max-w-6xl mx-auto", children: [toast && _jsx(Toast, { message: toast.message, type: toast.type, onClose: () => setToast(null) }), error && (_jsx("div", { className: "mb-6 p-4 bg-red-900 border border-red-700 rounded-lg", children: _jsx("p", { className: "text-red-200", children: error }) })), _jsx(Tabs, { tabs: tabs, defaultTab: "overview" })] }) }));
}
