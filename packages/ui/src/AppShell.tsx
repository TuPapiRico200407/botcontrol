import React, { useState } from 'react';
import './AppShell.css';

interface AppShellProps {
    brand?: React.ReactNode;
    subNav?: React.ReactNode;
    logo?: React.ReactNode;
    sidebarItems?: Array<{
        icon?: React.ReactNode;
        label: string;
        href: string;
        active?: boolean;
        onClick?: () => void;
    }>;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    content?: React.ReactNode;
    children?: React.ReactNode;
    onLogout?: () => void;
    user?: {
        name: string;
        email: string;
    };
}

export function AppShell({ brand, subNav, logo, sidebarItems, header, footer, content, children, onLogout, user }: AppShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const mainContent = content || children;

    return (
        <div className="app-shell">
            {/* Sidebar */}
            <aside className={`sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
                <div className="sidebar-brand">
                    <div className="brand-wrapper">
                        {logo && <div className="brand-icon">{logo}</div>}
                        {sidebarOpen && brand && <div className="brand-text">{brand}</div>}
                    </div>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="sidebar-toggle"
                        aria-label="Toggle sidebar"
                    >
                        {sidebarOpen ? (
                           <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                           </svg>
                        ) : (
                           <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                           </svg>
                        )}
                    </button>
                </div>

                {sidebarOpen && subNav && (
                    <div className="px-4 py-2 border-b border-gray-700">
                        {subNav}
                    </div>
                )}

                <nav className="sidebar-nav">
                    {sidebarItems?.map((item, i) => (
                        <a
                            key={i}
                            href={item.href}
                            onClick={(e) => {
                                if (item.onClick) {
                                    e.preventDefault();
                                    item.onClick();
                                }
                            }}
                            className={`nav-item ${item.active ? 'active' : ''}`}
                            title={!sidebarOpen ? item.label : undefined}
                        >
                            {item.icon && <span className="nav-icon">{item.icon}</span>}
                            {sidebarOpen && <span>{item.label}</span>}
                        </a>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    {user && sidebarOpen && (
                        <div className="user-snippet">
                            <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                            <div className="user-info">
                                <span className="user-name">{user.name}</span>
                                <span className="user-email">{user.email}</span>
                            </div>
                        </div>
                    )}
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className="logout-btn"
                            title={!sidebarOpen ? 'Logout' : undefined}
                        >
                            <span className="nav-icon">
                                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </span>
                            {sidebarOpen && <span>Logout</span>}
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="main-wrapper">
                {header && (
                    <header className="main-header">
                        {header}
                    </header>
                )}

                <main className="main-content">
                    {mainContent}
                </main>
            </div>
        </div>
    );
}
