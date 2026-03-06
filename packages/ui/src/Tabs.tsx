import React, { useState } from 'react';

interface Tab {
    key: string;
    label: string;
    content: React.ReactNode;
}

interface TabsProps {
    tabs: Tab[];
    defaultTab?: string;
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
    const [active, setActive] = useState(defaultTab ?? tabs[0]?.key);
    const current = tabs.find((t) => t.key === active);

    return (
        <div>
            <div className="flex border-b border-gray-700 bg-gray-800">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActive(tab.key)}
                        className={`px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${active === tab.key ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="mt-4 bg-gray-800 rounded-b-lg p-4">{current?.content}</div>
        </div>
    );
}
