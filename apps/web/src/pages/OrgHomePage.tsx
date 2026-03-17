import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../utils/api';
import { Spinner, Toast, AppShell } from '@botcontrol/ui';
import { BotSettings } from '../components/BotSettings';
import { AuditLogList } from '../components/AuditLogList';
import { OrgMembers } from '../components/OrgMembers';
import { OrgSettings } from '../components/OrgSettings';
import { ChannelsPage } from './ChannelsPage';
import { InboxPage } from './InboxPage';
import { HealthPage } from './HealthPage';
import './OrgHomePage.css';

interface Organization {
    id: string;
    name: string;
    slug: string;
    active?: boolean;
    [key: string]: unknown;
}

type TabKey = 'summary' | 'bot' | 'members' | 'audit' | 'channels' | 'inbox' | 'health';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'summary', label: 'Summary' },
    { key: 'bot',     label: 'Bot/IA' },
    { key: 'members', label: 'Users' },
    { key: 'audit',   label: 'Audit' },
    { key: 'channels',label: 'WhatsApp' },
    { key: 'inbox',   label: 'Inbox' },
    { key: 'health',  label: 'Health' },
];

export function OrgHomePage() {
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const { signOut, user } = useAuth();
    const api = useApi();
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>('summary');
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => { if (orgId) loadOrg(); }, [orgId]);

    const loadOrg = async () => {
        if (!orgId) return;
        setLoading(true);
        setError(null);
        const { data, error: apiError } = await api.getOrg(orgId);
        setLoading(false);
        if (apiError) { setError(apiError.message); return; }
        setOrg(data as Organization);
    };

    const handleCopyPortalLink = () => {
        const link = `${window.location.origin}/org/${orgId}`;
        navigator.clipboard.writeText(link).catch(() => {});
        setCopied(true);
        setToast({ message: 'Portal link copied to clipboard!', type: 'success' });
        setTimeout(() => setCopied(false), 3000);
    };

    if (loading) return <div className="org-loading-screen"><Spinner /></div>;

    if (!org) return (
        <div className="org-error-screen">
            <div style={{textAlign:'center'}}>
                <p style={{color:'var(--text-primary)',marginBottom:'1rem'}}>Organization not found</p>
                <button onClick={() => navigate('/admin')} style={{color:'var(--accent-blue)',background:'none',border:'none',cursor:'pointer',fontWeight:600}}>
                    ← Back to Admin
                </button>
            </div>
        </div>
    );

    const sidebarItems = [
        { label: 'Dashboard', href: '/admin', active: false,
          icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
        },
        { label: 'Members', href: '#', active: false, onClick: () => setActiveTab('members'),
          icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
        },
        { label: 'Bot Config', href: '#', active: false, onClick: () => setActiveTab('bot'),
          icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
        },
        { label: 'Logs', href: '#', active: false, onClick: () => setActiveTab('audit'),
          icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
        },
    ];

    return (
        <AppShell
            brand={org.name}
            logo={<svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" style={{width:'18px',height:'18px',color:'white'}}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>}
            sidebarItems={sidebarItems}
            onLogout={async () => { await signOut(); navigate('/login'); }}
            user={user ? { name: user.email?.split('@')[0] ?? 'User', email: user.email ?? '' } : undefined}
            header={
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
                        <button onClick={() => navigate('/admin')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.9rem'}}>
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{width:'18px',height:'18px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                        </button>
                        <h1 className="header-title">Organization Details</h1>
                    </div>
                    <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:'1.3rem'}}>⋮</button>
                </div>
            }
            content={
                <div>
                    {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

                    {/* Org Header Block */}
                    <div className="org-header-card">
                        <div className="org-logo">
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                            </svg>
                        </div>
                        <div className="org-header-info">
                            <p className="org-header-name">{org.name}</p>
                            <p className="org-header-slug">{org.slug}</p>
                        </div>
                    </div>

                    {/* Copy portal link */}
                    <button className={`portal-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopyPortalLink}>
                        {copied ? '✓ Copied!' : (
                            <>
                                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{width:'18px',height:'18px'}}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9 3.375h1.49" />
                                </svg>
                                Copy Portal Link
                            </>
                        )}
                    </button>

                    {/* Tabs */}
                    <div className="org-nav-tabs">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                className={`org-nav-tab ${activeTab === tab.key ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    {activeTab === 'summary' && (
                        <div>
                            <p className="info-section-label">Basic Information</p>
                            <div className="info-field">
                                <p className="info-field-label">Organization Name</p>
                                <p className="info-field-value">{org.name}</p>
                            </div>
                            <div className="info-fields-row">
                                <div className="info-field">
                                    <p className="info-field-label">Status</p>
                                    <p className="info-field-value with-dot">{org.active !== false ? 'Active' : 'Disabled'}</p>
                                </div>
                                <div className="info-field">
                                    <p className="info-field-label">Slug</p>
                                    <p className="info-field-value">{org.slug}</p>
                                </div>
                            </div>

                            <p className="info-section-label" style={{marginTop:'1.5rem'}}>Usage Overview</p>
                            <div className="usage-item" onClick={() => setActiveTab('members')}>
                                <div className="usage-item-icon">
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                                </div>
                                <div>
                                    <p className="usage-item-label">Total Users</p>
                                    <p className="usage-item-value">—</p>
                                </div>
                                <span style={{marginLeft:'auto',color:'var(--text-muted)'}}>›</span>
                            </div>
                            <div className="usage-item" onClick={() => setActiveTab('bot')}>
                                <div className="usage-item-icon">
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                                </div>
                                <div>
                                    <p className="usage-item-label">AI Bots</p>
                                    <p className="usage-item-value">1 Active</p>
                                </div>
                                <span style={{marginLeft:'auto',color:'var(--text-muted)'}}>›</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bot'      && <BotSettings orgId={orgId!} />}
                    {activeTab === 'members'  && <OrgMembers orgId={orgId!} />}
                    {activeTab === 'audit'    && <AuditLogList orgId={orgId!} />}
                    {activeTab === 'channels' && <ChannelsPage orgId={orgId!} />}
                    {activeTab === 'inbox'    && <InboxPage orgId={orgId!} />}
                    {activeTab === 'health'   && <HealthPage orgId={orgId!} />}

                    {error && (
                        <div style={{marginTop:'1rem',padding:'1rem',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'10px',color:'#FCA5A5',fontSize:'0.875rem'}}>
                            {error}
                        </div>
                    )}
                </div>
            }
        />
    );
}
