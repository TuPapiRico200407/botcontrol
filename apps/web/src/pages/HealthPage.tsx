import React, { useEffect, useState } from 'react';
import { useApi } from '../utils/api';
import { Card, Spinner, Badge, DataTable } from '@botcontrol/ui';

interface HealthLog {
    id: string;
    org_id: string;
    component: string;
    status: string;
    message: string;
    created_at: string;
    [key: string]: unknown;
}

interface MediaJob {
    id: string;
    org_id: string;
    message_id: string;
    media_url: string;
    media_type: string;
    status: string;
    result_text?: string;
    error_message?: string;
    created_at: string;
    [key: string]: unknown;
}

export function HealthPage({ orgId }: { orgId: string }) {
    const api = useApi();
    const [healthData, setHealthData] = useState<{ status: string; recent_logs: HealthLog[]; media_jobs: MediaJob[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadHealth();
    }, [orgId]);

    const loadHealth = async () => {
        setIsLoading(true);
        const { data } = await api.getHealth(orgId);
        setIsLoading(false);
        if (data?.data) {
            setHealthData(data.data as { status: string; recent_logs: HealthLog[]; media_jobs: MediaJob[] });
        }
    };

    if (isLoading) return <div className="p-8 flex justify-center"><Spinner /></div>;
    if (!healthData) return <div className="p-8 text-red-400">Error loading health metrics.</div>;

    const { status, recent_logs, media_jobs } = healthData;

    const typedLogs = (recent_logs || []).map((l: Record<string, unknown>) => ({ ...l })) as unknown as HealthLog[];
    const typedJobs = (media_jobs || []).map((j: Record<string, unknown>) => ({ ...j })) as unknown as MediaJob[];

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">System Health & Logistics</h1>
                <Badge variant={status === 'HEALTHY' ? 'success' : 'warning'}>
                    {status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <div className="p-4 border-b border-gray-800 font-semibold text-gray-200">System Logs</div>
                    <div className="p-0">
                        <DataTable<HealthLog>
                            columns={[
                                { key: 'status', header: 'Lvl', render: (row) => <Badge variant={row.status === 'ERROR' ? 'danger' : 'info'}>{row.status}</Badge> },
                                { key: 'component', header: 'Component', render: (row) => row.component },
                                { key: 'msg', header: 'Message', render: (row) => <span className="text-xs truncate max-w-xs">{row.message}</span> },
                                { key: 'time', header: 'Time', render: (row) => new Date(row.created_at).toLocaleTimeString() }
                            ]}
                            data={typedLogs}
                        />
                    </div>
                </Card>

                <Card>
                    <div className="p-4 border-b border-gray-800 font-semibold text-gray-200">Media Extraction Jobs</div>
                    <div className="p-0">
                        <DataTable<MediaJob>
                            columns={[
                                { key: 'type', header: 'Type', render: (row) => row.media_type },
                                { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'DONE' ? 'success' : row.status === 'FAILED' ? 'danger' : 'warning'}>{row.status}</Badge> },
                                { key: 'res', header: 'Result', render: (row) => <span className="text-xs text-gray-400 truncate max-w-xs block">{row.result_text || row.error_message || '...'}</span> },
                                { key: 'time', header: 'Time', render: (row) => new Date(row.created_at).toLocaleTimeString() }
                            ]}
                            data={typedJobs}
                        />
                    </div>
                </Card>
            </div>
        </div>
    );
}
