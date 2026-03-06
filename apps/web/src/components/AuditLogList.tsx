import React, { useEffect, useState } from 'react';
import { useApi } from '../utils/api';
import { DataTable, Badge, Spinner, EmptyState } from '@botcontrol/ui';

interface AuditLog {
    id: string;
    actor_user_id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    created_at: string;
    description?: string;
    [key: string]: unknown;
}

export function AuditLogList({ orgId }: { orgId: string }) {
    const api = useApi();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, [orgId]);

    const loadLogs = async () => {
        setLoading(true);
        const { data, error } = await api.getAuditLogs(orgId);
        setLoading(false);
        if (error) {
            console.error('Failed to load audit logs:', error);
            return;
        }
        setLogs((data as AuditLog[]) ?? []);
    };

    if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

    if (logs.length === 0) {
        return <EmptyState title="No audit logs" description="Activity will appear here once actions are taken." />;
    }

    return (
        <DataTable
            data={logs as Record<string, unknown>[]}
            columns={[
                {
                    key: 'action',
                    header: 'Action',
                    render: (row) => {
                        const action = String(row.action).toUpperCase();
                        const variantMap: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
                            CREATE: 'success',
                            UPDATE: 'info',
                            DELETE: 'danger',
                            INVITE: 'success',
                        };
                        return <Badge variant={variantMap[action] || 'info'}>{action}</Badge>;
                    },
                },
                { key: 'entity_type', header: 'Entity Type' },
                {
                    key: 'created_at',
                    header: 'Date',
                    render: (row) => new Date(String(row.created_at)).toLocaleString(),
                },
            ]}
        />
    );
}
