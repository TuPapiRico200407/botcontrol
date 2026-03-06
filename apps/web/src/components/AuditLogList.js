import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useApi } from '../utils/api';
import { DataTable, Badge, Spinner, EmptyState } from '@botcontrol/ui';
export function AuditLogList({ orgId }) {
    const api = useApi();
    const [logs, setLogs] = useState([]);
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
        setLogs(data ?? []);
    };
    if (loading)
        return _jsx("div", { className: "flex justify-center py-8", children: _jsx(Spinner, {}) });
    if (logs.length === 0) {
        return _jsx(EmptyState, { title: "No audit logs", description: "Activity will appear here once actions are taken." });
    }
    return (_jsx(DataTable, { data: logs, columns: [
            {
                key: 'action',
                header: 'Action',
                render: (row) => {
                    const action = String(row.action).toUpperCase();
                    const variantMap = {
                        CREATE: 'success',
                        UPDATE: 'info',
                        DELETE: 'danger',
                        INVITE: 'success',
                    };
                    return _jsx(Badge, { variant: variantMap[action] || 'info', children: action });
                },
            },
            { key: 'entity_type', header: 'Entity Type' },
            {
                key: 'created_at',
                header: 'Date',
                render: (row) => new Date(String(row.created_at)).toLocaleString(),
            },
        ] }));
}
