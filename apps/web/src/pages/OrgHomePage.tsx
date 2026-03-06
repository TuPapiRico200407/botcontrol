import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../utils/api';
import { Tabs, Spinner, AppShell, Toast } from '@botcontrol/ui';
import { BotSettings } from '../components/BotSettings';
import { AuditLogList } from '../components/AuditLogList';
import { OrgMembers } from '../components/OrgMembers';
import { OrgSettings } from '../components/OrgSettings';

interface Organization {
    id: string;
    name: string;
    slug: string;
    [key: string]: unknown;
}

export function OrgHomePage() {
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const api = useApi();
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (!orgId) return;
        loadOrg();
    }, [orgId]);

    const loadOrg = async () => {
        if (!orgId) return;
        setLoading(true);
        setError(null);
        const { data, error: apiError } = await api.getOrg(orgId);
        setLoading(false);
        if (apiError) {
            setError(apiError.message);
            setToast({ message: `Failed to load organization: ${apiError.message}`, type: 'error' });
            return;
        }
        setOrg(data as Organization);
    };

    const handleLogout = async () => {
        await signOut();
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-900">
                <Spinner />
            </div>
        );
    }

    if (!org) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-900">
                <div className="text-center">
                    <p className="text-white mb-4">Organization not found</p>
                    <button
                        onClick={() => navigate('/admin')}
                        className="text-blue-400 hover:text-blue-300"
                    >
                        Back to Admin
                    </button>
                </div>
            </div>
        );
    }

    const tabs = [
        { key: 'overview', label: 'Overview', content: <OrgSettings orgId={orgId!} org={org} onRefresh={loadOrg} /> },
        { key: 'bot', label: 'Bot / IA', content: <BotSettings orgId={orgId!} /> },
        { key: 'members', label: 'Members', content: <OrgMembers orgId={orgId!} /> },
        { key: 'audit', label: 'Audit', content: <AuditLogList orgId={orgId!} /> },
    ];

    return (
        <AppShell
            brand={org.name}
            subNav={<p className="text-gray-400 text-sm">{org.slug}</p>}
            onLogout={handleLogout}
            content={
                <div className="max-w-6xl mx-auto">
                    {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                    {error && (
                        <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
                            <p className="text-red-200">{error}</p>
                        </div>
                    )}
                    <Tabs tabs={tabs} defaultTab="overview" />
                </div>
            }
        />
    );
}
