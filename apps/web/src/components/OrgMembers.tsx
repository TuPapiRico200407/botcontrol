import React, { useEffect, useState } from 'react';
import { useApi } from '../utils/api';
import { Spinner, Toast } from '@botcontrol/ui';
import { InviteUserModal } from './InviteUserModal';
import '../pages/OrgHomePage.css';

interface Member {
    id: string;
    user_id: string;
    email: string;
    role: 'OWNER' | 'AGENT';
    activated_at: string | null;
    created_at: string;
    [key: string]: unknown;
}

function getInitials(email: string) {
    const parts = email.split('@')[0].split('.');
    return (parts[0]?.[0] ?? 'U').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

function getStatus(member: Member): { label: string; cls: string } {
    if (!member.activated_at) return { label: 'Pending Invite', cls: 'pending' };
    return { label: 'Active', cls: 'active' };
}

export function OrgMembers({ orgId }: { orgId: string }) {
    const api = useApi();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => { loadMembers(); }, [orgId]);

    const loadMembers = async () => {
        setLoading(true);
        const { data, error } = await api.listMembers(orgId);
        setLoading(false);
        if (error) { setToast({ message: `Failed to load members: ${error.message}`, type: 'error' }); return; }
        setMembers((data as Member[]) ?? []);
    };

    const handleMemberInvited = (newMember: Member) => {
        setMembers([...members, { ...newMember, role: newMember.role as 'OWNER' | 'AGENT' }]);
        setShowInviteModal(false);
        setToast({ message: 'Member invited successfully!', type: 'success' });
    };

    if (loading) return <div style={{display:'flex',justifyContent:'center',padding:'2rem'}}><Spinner /></div>;

    const filtered = members.filter(m => m.email.toLowerCase().includes(search.toLowerCase()));

    return (
        <div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="members-list-header">
                <span className="members-section-label">Member List</span>
                <button className="invite-btn" onClick={() => setShowInviteModal(true)}>
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{width:'14px',height:'14px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Invite Member
                </button>
            </div>

            <div className="member-search">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                    placeholder="Search members..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="member-list">
                {filtered.length === 0 ? (
                    <div style={{padding:'3rem',textAlign:'center',color:'var(--text-muted)'}}>
                        No members found.
                    </div>
                ) : filtered.map(member => {
                    const status = getStatus(member);
                    return (
                        <div key={member.id} className="member-item">
                            <div className="member-avatar">{getInitials(member.email)}</div>
                            <div className="member-info">
                                <p className="member-name">{member.email.split('@')[0].replace('.', ' ')}</p>
                                <p className="member-email">{member.email}</p>
                                <div className="member-status">
                                    <span className={`status-dot ${status.cls}`}></span>
                                    {status.label}
                                </div>
                            </div>
                            <span className={`role-badge ${member.role.toLowerCase()}`}>
                                {member.role}
                            </span>
                            {status.cls === 'pending' && (
                                <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',marginLeft:'0.5rem',fontSize:'1.2rem'}} title="Cancel invite">✕</button>
                            )}
                        </div>
                    );
                })}
            </div>

            {showInviteModal && (
                <InviteUserModal orgId={orgId} onClose={() => setShowInviteModal(false)} onSuccess={handleMemberInvited} />
            )}
        </div>
    );
}
