import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../utils/api';
import { AppShell, Spinner, Toast } from '@botcontrol/ui';
import { CreateOrgModal } from '../components/CreateOrgModal';
import './AdminDashboard.css';

interface Organization {
    id: string;
    name: string;
    slug: string;
    active?: boolean;
    created_at?: string;
    [key: string]: unknown;
}

// SVG Icons inline for no-dependency approach
const IconBuilding = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
);
const IconBot = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
    </svg>
);
const IconMail = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
);
const IconSearch = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);
const IconExternalLink = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" style={{width:'12px', height:'12px'}}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
);
const IconPlus = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{width:'18px', height:'18px'}}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

type FilterStatus = 'all' | 'active' | 'disabled';

export function AdminDashboard() {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const api = useApi();
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

    const loadOrgs = async () => {
        setLoading(true);
        setError(null);
        const { data, error: apiError } = await api.listOrgs();
        setLoading(false);
        if (apiError) {
            setError(apiError.message);
            setToast({ message: `Error: ${apiError.message}`, type: 'error' });
            return;
        }
        setOrgs((data as Organization[]) ?? []);
    };

    useEffect(() => { loadOrgs(); }, []);

    const handleOrgCreated = (newOrg: Organization) => {
        setOrgs([...orgs, newOrg as Organization]);
        setShowCreateModal(false);
        setToast({ message: 'Organization created successfully!', type: 'success' });
    };

    const filteredOrgs = orgs
        .filter(o => statusFilter === 'all' || (statusFilter === 'active' ? o.active !== false : o.active === false))
        .filter(o => o.name.toLowerCase().includes(search.toLowerCase()) || o.slug.toLowerCase().includes(search.toLowerCase()));

    const activeCount  = orgs.filter(o => o.active !== false).length;
    const pendingCount = orgs.filter(o => o.active === false).length;

    const sidebarItems = [
        {
            label: 'Dashboard',
            href: '/admin',
            active: true,
            icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
        },
        {
            label: 'Organizations',
            href: '/admin',
            active: false,
            icon: <IconBuilding />
        },
        {
            label: 'Users',
            href: '#',
            active: false,
            icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
        },
        {
            label: 'Logs',
            href: '#',
            active: false,
            icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
        },
    ];

    return (
        <AppShell
            brand="Super Admin"
            logo={<svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" style={{width:'18px', height:'18px', color:'white'}}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" /></svg>}
            sidebarItems={sidebarItems}
            onLogout={async () => { await signOut(); navigate('/login'); }}
            user={user ? { name: user.email?.split('@')[0] ?? 'Admin', email: user.email ?? '' } : undefined}
            header={
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%'}}>
                    <h1 className="header-title">System Overview</h1>
                    <div className="header-actions">
                        <div className="search-bar" style={{width:'260px', marginBottom:0}}>
                            <IconSearch />
                            <input placeholder="Global search..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <button style={{background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'1.3rem'}}>🔔</button>
                        <button style={{background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'1.3rem'}}>⚙️</button>
                    </div>
                </div>
            }
            content={
                <div>
                    {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

                    {/* KPI Cards */}
                    <p className="kpi-section-label">System Performance</p>
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div className="kpi-top-row">
                                <div className="kpi-icon-wrap blue"><IconBuilding /></div>
                                <span className="kpi-badge up">▲ 12%</span>
                            </div>
                            <p className="kpi-label">Total Organizations</p>
                            <p className="kpi-value">{loading ? '…' : orgs.length}</p>
                            <p className="kpi-footnote">Updated just now</p>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-top-row">
                                <div className="kpi-icon-wrap green"><IconBot /></div>
                                <span className="kpi-badge up">▲ 6.4%</span>
                            </div>
                            <p className="kpi-label">Active Bots</p>
                            <p className="kpi-value">{loading ? '…' : activeCount}</p>
                            <p className="kpi-footnote">98% success rate</p>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-top-row">
                                <div className="kpi-icon-wrap amber"><IconMail /></div>
                                <span className="kpi-badge down">▼ 2%</span>
                            </div>
                            <p className="kpi-label">Pending Invites</p>
                            <p className="kpi-value">{loading ? '…' : pendingCount}</p>
                            <p className="kpi-footnote">Requires attention</p>
                        </div>
                    </div>

                    {/* Orgs List */}
                    <div className="section-header">
                        <p className="section-label">Organizations</p>
                        <button className="create-org-btn" onClick={() => setShowCreateModal(true)}>
                            <IconPlus /> New Organization
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="filter-tabs">
                        {(['all', 'active', 'disabled'] as FilterStatus[]).map(f => (
                            <button
                                key={f}
                                className={`filter-tab ${statusFilter === f ? 'active' : ''}`}
                                onClick={() => setStatusFilter(f)}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="search-bar">
                        <IconSearch />
                        <input
                            placeholder="Search organizations..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {/* List */}
                    {loading ? (
                        <div style={{display:'flex', justifyContent:'center', padding:'4rem'}}>
                            <Spinner />
                        </div>
                    ) : (
                        <div className="org-list">
                            {filteredOrgs.length === 0 ? (
                                <div style={{padding:'3rem', textAlign:'center', color:'var(--text-muted)'}}>
                                    No organizations match your filters.
                                </div>
                            ) : filteredOrgs.map(org => (
                                <Link
                                    to={`/org/${org.id}`}
                                    key={org.id}
                                    className="org-list-item"
                                >
                                    <div className="org-icon"><IconBuilding /></div>
                                    <div className="org-info">
                                        <p className="org-name">{org.name}</p>
                                        <div className="org-meta">
                                            <span>slug: {org.slug}</span>
                                            {org.created_at && <span>• {new Date(org.created_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</span>}
                                        </div>
                                        <a
                                            href={`/org/${org.id}`}
                                            className="portal-link"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <IconExternalLink /> Portal Link
                                        </a>
                                    </div>
                                    <span className={`status-badge ${org.active !== false ? 'active' : 'disabled'}`}>
                                        {org.active !== false ? 'Active' : 'Disabled'}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div style={{marginTop:'1rem', padding:'1rem', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'10px', color:'#FCA5A5', fontSize:'0.875rem'}}>
                            {error}
                        </div>
                    )}

                    {showCreateModal && (
                        <CreateOrgModal onClose={() => setShowCreateModal(false)} onSuccess={handleOrgCreated} />
                    )}
                </div>
            }
        />
    );
}
