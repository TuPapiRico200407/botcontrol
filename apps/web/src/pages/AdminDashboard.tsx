import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../utils/api';
import { DataTable, Badge, Button, Spinner, EmptyState, AppShell, Toast } from '@botcontrol/ui';
import { CreateOrgModal } from '../components/CreateOrgModal';

interface Organization {
    id: string;
    name: string;
    slug: string;
    status?: string;
    created_at?: string;
    [key: string]: unknown;
}

export function AdminDashboard() {
    const { signOut } = useAuth();
    const api = useApi();
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
        setOrgs((data as Organization[]) ?? []);
    };

    useEffect(() => {
        loadOrgs();
    }, []);

    const handleOrgCreated = (newOrg: Organization) => {
        setOrgs([...orgs, newOrg as Organization]);
        setShowCreateModal(false);
        setToast({ message: 'Organization created successfully!', type: 'success' });
    };

    const handleLogout = async () => {
        await signOut();
    };

    return (
        <AppShell
            brand="BotControl Admin"
            onLogout={handleLogout}
            content={
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Organizations</h1>
                            <p className="text-gray-400 mt-1">Manage all organizations and their settings</p>
                        </div>
                        <Button onClick={() => setShowCreateModal(true)}>Create Organization</Button>
                    </div>

                    {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

                    {error && (
                        <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
                            <p className="text-red-200">{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Spinner />
                        </div>
                    ) : orgs.length === 0 ? (
                        <EmptyState
                            title="No organizations"
                            description="Create your first organization to get started"
                            action={<Button onClick={() => setShowCreateModal(true)}>Create Organization</Button>}
                        />
                    ) : (
                        <DataTable
                            data={(orgs as unknown) as Record<string, unknown>[]}
                            columns={[
                                {
                                    key: 'name',
                                    header: 'Name',
                                    render: (row) => (
                                        <Link to={`/org/${row.id}`} className="text-blue-400 hover:text-blue-300 font-medium">
                                            {String(row.name)}
                                        </Link>
                                    ),
                                },
                                { key: 'slug', header: 'Slug' },
                                {
                                    key: 'status',
                                    header: 'Status',
                                    render: (row) => (
                                        <Badge variant={row.status === 'active' ? 'success' : 'danger'}>
                                            {String(row.status)}
                                        </Badge>
                                    ),
                                },
                                {
                                    key: 'created_at',
                                    header: 'Created',
                                    render: (row) => new Date(String(row.created_at)).toLocaleDateString(),
                                },
                            ]}
                        />
                    )}

                    {showCreateModal && (
                        <CreateOrgModal onClose={() => setShowCreateModal(false)} onSuccess={handleOrgCreated} />
                    )}
                </div>
            }
        />
    );
}
