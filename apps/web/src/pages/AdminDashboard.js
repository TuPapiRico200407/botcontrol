import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../utils/api';
import { DataTable, Badge, Button, Spinner, EmptyState, AppShell, Toast } from '@botcontrol/ui';
import { CreateOrgModal } from '../components/CreateOrgModal';
export function AdminDashboard() {
    const { signOut } = useAuth();
    const api = useApi();
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [toast, setToast] = useState(null);
    const loadOrgs = async () => {
        setLoading(true);
        setError(null);
        const { data, error: apiError } = await api.listOrgs();
        setLoading(false);
        if (apiError) {
            setError(apiError.message);
            setToast({ message: `Failed to load organizations: ${apiError.message}`, type: 'error' });
            return;
        }
        setOrgs(data ?? []);
    };
    useEffect(() => {
        loadOrgs();
    }, []);
    const handleOrgCreated = (newOrg) => {
        setOrgs([...orgs, newOrg]);
        setShowCreateModal(false);
        setToast({ message: 'Organization created successfully!', type: 'success' });
    };
    const handleLogout = async () => {
        await signOut();
    };
    return (_jsx(AppShell, { brand: "BotControl Admin", onLogout: handleLogout, content: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "Organizations" }), _jsx("p", { className: "text-gray-400 mt-1", children: "Manage all organizations and their settings" })] }), _jsx(Button, { onClick: () => setShowCreateModal(true), children: "Create Organization" })] }), toast && _jsx(Toast, { message: toast.message, type: toast.type, onClose: () => setToast(null) }), error && (_jsx("div", { className: "mb-6 p-4 bg-red-900 border border-red-700 rounded-lg", children: _jsx("p", { className: "text-red-200", children: error }) })), loading ? (_jsx("div", { className: "flex justify-center py-16", children: _jsx(Spinner, {}) })) : orgs.length === 0 ? (_jsx(EmptyState, { title: "No organizations", description: "Create your first organization to get started", action: _jsx(Button, { onClick: () => setShowCreateModal(true), children: "Create Organization" }) })) : (_jsx(DataTable, { data: orgs, columns: [
                        {
                            key: 'name',
                            header: 'Name',
                            render: (row) => (_jsx(Link, { to: `/org/${row.id}`, className: "text-blue-400 hover:text-blue-300 font-medium", children: String(row.name) })),
                        },
                        { key: 'slug', header: 'Slug' },
                        {
                            key: 'status',
                            header: 'Status',
                            render: (row) => (_jsx(Badge, { variant: row.status === 'active' ? 'success' : 'danger', children: String(row.status) })),
                        },
                        {
                            key: 'created_at',
                            header: 'Created',
                            render: (row) => new Date(String(row.created_at)).toLocaleDateString(),
                        },
                    ] })), showCreateModal && (_jsx(CreateOrgModal, { onClose: () => setShowCreateModal(false), onSuccess: handleOrgCreated }))] }) }));
}
