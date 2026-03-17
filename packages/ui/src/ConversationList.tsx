import React from 'react';
import { Badge } from './Badge';

export interface Conversation {
    id: string;
    org_id: string;
    channel_id: string;
    phone_number: string;
    contact_name: string | null;
    state: 'BOT' | 'HUMAN' | 'PENDING';
    message_count: number;
    last_message_at: string | null;
    last_message_text: string | null;
    assigned_agent_id?: string | null;
    override_model?: string | null;
}

export interface ConversationListProps {
    conversations: Conversation[];
    selectedId?: string;
    onSelect?: (id: string) => void;
}

export function ConversationList({
    conversations,
    selectedId,
    onSelect
}: ConversationListProps) {
    if (conversations.length === 0) {
        return (
            <div className="p-4 text-center text-gray-400 text-sm">
                No conversations found.
            </div>
        );
    }

    const formatTime = (isoString?: string | null) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="divide-y divide-gray-800 border-t border-gray-800">
            {conversations.map(conv => (
                <div
                    key={conv.id}
                    onClick={() => onSelect?.(conv.id)}
                    className={`p-3 cursor-pointer hover:bg-gray-800 transition-colors ${selectedId === conv.id ? 'bg-gray-800 border-l-2 border-blue-500' : 'border-l-2 border-transparent'
                        }`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <div className="font-medium text-gray-100 text-sm">
                            {conv.contact_name || conv.phone_number}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-xs text-gray-500">{formatTime(conv.last_message_at)}</span>
                            <Badge variant={conv.state === 'BOT' ? 'info' : conv.state === 'HUMAN' ? 'success' : 'warning'}>
                                {conv.state}
                            </Badge>
                        </div>
                    </div>
                    {conv.contact_name && (
                        <div className="text-xs text-gray-400 mb-1">{conv.phone_number}</div>
                    )}
                    <div className="text-sm text-gray-400 truncate pr-6">
                        {conv.last_message_text || 'No messages yet'}
                    </div>
                </div>
            ))}
        </div>
    );
}
