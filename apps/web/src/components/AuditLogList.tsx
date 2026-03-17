import React, { useEffect, useState } from 'react';
import { useApi } from '../utils/api';
import { Spinner } from '@botcontrol/ui';
import '../pages/OrgHomePage.css';

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

function timeAgo(dateStr: string) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} hour${diffH > 1 ? 's' : ''} ago`;
    return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const DANGER_ACTIONS = ['DELETE', 'REVOKE', 'DISABLE'];

export function AuditLogList({ orgId }: { orgId: string }) {
    const api = useApi();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadLogs(); }, [orgId]);

    const loadLogs = async () => {
        setLoading(true);
        const { data, error } = await api.getAuditLogs(orgId);
        setLoading(false);
        if (error) { console.error(error); return; }
        setLogs((data as AuditLog[]) ?? []);
    };

    if (loading) return <div style={{display:'flex',justifyContent:'center',padding:'2rem'}}><Spinner /></div>;
    if (logs.length === 0) return (
        <p style={{color:'var(--text-muted)',padding:'2rem',textAlign:'center'}}>No audit logs yet.</p>
    );

    const isDanger = (action: string) => DANGER_ACTIONS.some(d => action.toUpperCase().includes(d));

    return (
        <div>
            {/* Filter pills */}
            <div className="audit-filters">
                {['Time: Last 7 days', 'Actor: All', 'Severity: All'].map(f => (
                    <button key={f} className="audit-filter-pill">
                        {f}
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{width:'12px',height:'12px'}}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                ))}
            </div>

            <div className="audit-log-list">
                {logs.map(log => (
                    <div key={log.id} className="audit-log-item">
                        <div className="audit-log-top">
                            <div className="audit-actor-icon">
                                <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </div>
                            <div>
                                <p className="audit-actor-name">{log.actor_user_id?.slice(0, 8) ?? 'system'}</p>
                                <p className="audit-actor-role">Actor</p>
                            </div>
                            <span className="audit-time">{timeAgo(log.created_at)}</span>
                        </div>

                        <div className="audit-log-body">
                            <div>
                                <p className="audit-field-label">Action</p>
                                <p className="audit-field-value">{log.action}</p>
                            </div>
                            <div>
                                <p className="audit-field-label">Entity</p>
                                <p className={`audit-field-value ${isDanger(log.action) ? 'danger' : ''}`}>
                                    {log.entity_type}{log.entity_id ? `: ${log.entity_id.slice(0, 12)}…` : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button className="load-more-btn" onClick={loadLogs}>Load more history</button>
        </div>
    );
}
