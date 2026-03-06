import React, { useState } from 'react';

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
}

export function AppShell({ brand, subNav, logo, sidebarItems, header, footer, content, children, onLogout }: AppShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const mainContent = content || children;

    return (
        <div className="flex h-screen bg-gray-900">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300 overflow-hidden`}>
                {/* Logo / Brand */}
                <div className="px-4 py-4 border-b border-gray-700 flex items-center justify-between">
                    {sidebarOpen && (brand || logo) && <div className="text-lg font-semibold text-gray-100">{brand || logo}</div>}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200 text-gray-400 hover:text-gray-200"
                        aria-label="Toggle sidebar"
                    >
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                </div>

                {/* SubNav */}
                {sidebarOpen && subNav && (
                    <div className="px-4 py-2 text-sm border-b border-gray-700">
                        {subNav}
                    </div>
                )}

                {/* Nav Items */}
                <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
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
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium ${
                                item.active
                                    ? 'bg-blue-900 text-blue-200'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                            }`}
                            title={!sidebarOpen ? item.label : undefined}
                        >
                            {item.icon && <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>}
                            {sidebarOpen && <span>{item.label}</span>}
                        </a>
                    ))}
                </nav>

                {/* Logout Button */}
                {onLogout && (
                    <div className="px-4 py-4 border-t border-gray-700">
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-red-900 text-red-200 hover:bg-red-800 transition-colors duration-200 text-sm font-medium"
                            title={!sidebarOpen ? 'Logout' : undefined}
                        >
                            <span className="flex-shrink-0">🚪</span>
                            {sidebarOpen && <span>Logout</span>}
                        </button>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                {header && (
                    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
                        {header}
                    </header>
                )}

                {/* Content */}
                <main className="flex-1 overflow-auto px-6 py-4">
                    {mainContent}
                </main>

                {/* Footer */}
                {footer && (
                    <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 text-xs text-gray-500 flex-shrink-0">
                        {footer}
                    </footer>
                )}
            </div>
        </div>
    );
}
