import React, { useEffect, useRef } from 'react';

export interface ChatMessage {
    id: string;
    message_id: string;
    body: string | null;
    direction: 'inbound' | 'outbound';
    message_type: string;
    media_url?: string | null;
    ia_tokens_used?: number | null;
    webhook_timestamp: number | null;
    created_at: string;
}

export interface ChatTimelineProps {
    messages: ChatMessage[];
    isLoading?: boolean;
}

export function ChatTimeline({ messages, isLoading = false }: ChatTimelineProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logic could be improved to only scroll if user is already at bottom,
    // but for now we automatically scroll to the bottom whenever messages change.
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    if (isLoading && messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-gray-400">
                <p>No messages in this conversation yet.<br />When the user sends a message, it will appear here.</p>
            </div>
        );
    }

    const formatTimestamp = (ts: number | null, createdAt: string) => {
        const date = ts ? new Date(ts) : new Date(createdAt);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
                const isInbound = msg.direction === 'inbound';
                return (
                    <div
                        key={msg.id}
                        className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}
                    >
                        <div
                            className={`max-w-[75%] rounded-lg px-4 py-2 ${isInbound
                                ? 'bg-gray-800 text-gray-100 rounded-bl-none'
                                : 'bg-blue-600 text-white rounded-br-none'
                                }`}
                        >
                            {msg.message_type !== 'text' && (
                                <div className="text-xs opacity-75 mb-1 italic flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                    [{msg.message_type}]
                                </div>
                            )}
                            {msg.media_url && (
                                <a href={msg.media_url} target="_blank" rel="noreferrer" className="text-blue-200 underline text-xs mt-1 block">
                                    View Media Attachment
                                </a>
                            )}
                            <div className="whitespace-pre-wrap text-sm">{msg.body}</div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 mx-1 flex items-center gap-2">
                            <span>{formatTimestamp(msg.webhook_timestamp, msg.created_at)}</span>
                            {msg.ia_tokens_used && (
                                <span className="text-[10px] text-purple-400 font-mono bg-purple-900/30 px-1 py-0.5 rounded" title="AI Tokens Used">
                                    ~{msg.ia_tokens_used} tks
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>
    );
}
