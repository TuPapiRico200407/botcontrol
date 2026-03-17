import React, { useEffect, useState } from 'react';
import { useApi } from '../utils/api';
import { ConversationList, ChatTimeline, ChatMessage, MessageComposer, ContextSidebar, Tag, Note, Conversation } from '@botcontrol/ui';
import { useAuth } from '../contexts/AuthContext';

export function InboxPage({ orgId }: { orgId: string }) {
    const api = useApi();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string | undefined>();
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    // Status filters
    const [filterState, setFilterState] = useState<'ALL' | 'BOT' | 'HUMAN' | 'PENDING'>('ALL');

    const [isLoadingConvs, setIsLoadingConvs] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    // Load conversations list
    const loadConversations = async (silent = false) => {
        if (!silent) setIsLoadingConvs(true);
        const filters = filterState !== 'ALL' ? { state: filterState } : {};
        const { data } = await api.getInbox(orgId, filters);
        if (data?.data) {
            setConversations(data.data as Conversation[]);
        }
        if (!silent) setIsLoadingConvs(false);
    };

    // Initial load and filter change
    useEffect(() => {
        loadConversations();
    }, [orgId, filterState]);

    // Polling simple para inbox
    useEffect(() => {
        const intervalId = setInterval(() => {
            loadConversations(true);
        }, 5000); // Poll every 5 seconds
        return () => clearInterval(intervalId);
    }, [orgId, filterState]);

    // Context Sidebar states
    const [tags, setTags] = useState<Tag[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const { user } = useAuth(); // used for checking assigned agent

    // Load messages when conversation is selected
    useEffect(() => {
        if (!selectedConvId) {
            setMessages([]);
            setTags([]);
            setNotes([]);
            return;
        }

        const loadMessagesAndSidebar = async (silent = false) => {
            if (!silent) setIsLoadingMessages(true);
            const [msgRes, tagsRes, notesRes] = await Promise.all([
                api.getMessages(orgId, selectedConvId),
                api.getTags(orgId, selectedConvId),
                api.getNotes(orgId, selectedConvId)
            ]);

            if (msgRes.data?.data) setMessages(msgRes.data.data as ChatMessage[]);
            if (tagsRes.data?.data) setTags(tagsRes.data.data as Tag[]);
            if (notesRes.data?.data) setNotes(notesRes.data.data as Note[]);

            if (!silent) setIsLoadingMessages(false);
        };

        loadMessagesAndSidebar();

        // Polling para mensajes de la conversación activa
        const intervalId = setInterval(() => {
            loadMessagesAndSidebar(true);
        }, 3000); // Poll every 3 seconds
        return () => clearInterval(intervalId);
    }, [orgId, selectedConvId]);

    const activeConv = conversations.find(c => c.id === selectedConvId);
    const isAssignedToMe = activeConv?.assigned_agent_id === user?.id;
    const canTake = activeConv && !activeConv.assigned_agent_id && activeConv.state !== 'HUMAN';

    const handleTake = async () => {
        if (!selectedConvId) return;
        await api.takeConv(orgId, selectedConvId);
        loadConversations();
    };

    const handleRelease = async () => {
        if (!selectedConvId) return;
        await api.releaseConv(orgId, selectedConvId);
        loadConversations();
    };

    const handleSend = async (text: string) => {
        if (!selectedConvId) return;
        await api.sendOutboundMessage(orgId, selectedConvId, { message_type: 'text', body: text });
        // Optimistic refresh
        const { data } = await api.getMessages(orgId, selectedConvId);
        if (data?.data) setMessages(data.data as ChatMessage[]);
    };

    const handleAddTag = async (tagName: string) => {
        if (!selectedConvId) return;
        await api.addTag(orgId, selectedConvId, tagName);
        const { data } = await api.getTags(orgId, selectedConvId);
        if (data?.data) setTags(data.data as Tag[]);
    };

    const handleRemoveTag = async (tagName: string) => {
        if (!selectedConvId) return;
        await api.removeTag(orgId, selectedConvId, tagName);
        const { data } = await api.getTags(orgId, selectedConvId);
        if (data?.data) setTags(data.data as Tag[]);
    };

    const handleAddNote = async (content: string) => {
        if (!selectedConvId) return;
        await api.addNote(orgId, selectedConvId, content);
        const { data } = await api.getNotes(orgId, selectedConvId);
        if (data?.data) setNotes(data.data as Note[]);
    };

    const handleModelOverride = async (model: string | null) => {
        if (!selectedConvId) return;
        setIsLoadingConvs(true);
        await api.updateConvOverride(orgId, selectedConvId, model);
        await loadConversations();
        setIsLoadingConvs(false);
    };

    return (
        <div className="flex h-[calc(100vh-140px)] border border-gray-800 rounded-lg overflow-hidden bg-gray-900">
            {/* Left Panel: Inbox List */}
            <div className="w-1/3 flex flex-col border-r border-gray-800 bg-gray-900">
                <div className="p-4 border-b border-gray-800">
                    <h2 className="text-lg font-semibold text-white">Inbox</h2>
                    <div className="flex gap-2 mt-3">
                        {['ALL', 'PENDING', 'HUMAN', 'BOT'].map((state) => (
                            <button
                                key={state}
                                onClick={() => {
                                    setFilterState(state as 'ALL' | 'BOT' | 'HUMAN' | 'PENDING');
                                    setSelectedConvId(undefined); // Clear selection on filter change
                                }}
                                className={`px - 3 py - 1 text - xs font - medium rounded - full transition - colors ${filterState === state
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                    } `}
                            >
                                {state}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoadingConvs && conversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">Loading...</div>
                    ) : (
                        <ConversationList
                            conversations={conversations}
                            selectedId={selectedConvId}
                            onSelect={setSelectedConvId}
                        />
                    )}
                </div>
            </div>

            {/* Center Panel: Chat Timeline & Composer */}
            <div className="flex-1 flex flex-col bg-gray-950 relative">
                {selectedConvId ? (
                    <>
                        <div className="p-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center shadow-sm z-10 shrink-0">
                            <div>
                                <h3 className="text-lg font-medium text-white">{activeConv?.contact_name || activeConv?.phone_number}</h3>
                                <div className="text-xs text-gray-400 mt-1">
                                    Status: <span className="font-semibold text-gray-300 mr-2">{activeConv?.state}</span>
                                    {activeConv?.assigned_agent_id ? (
                                        <span className="bg-blue-900 text-blue-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                                            {isAssignedToMe ? 'Assigned to You' : 'Assigned to Agent'}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {activeConv?.state === 'BOT' && (
                                    <div className="flex items-center gap-2 mr-2">
                                        <label className="text-xs text-gray-400">AI Model:</label>
                                        <select
                                            value={activeConv?.override_model || ''}
                                            onChange={(e) => handleModelOverride(e.target.value || null)}
                                            className="bg-gray-800 border-none text-xs text-white rounded px-2 py-1 shadow-sm focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                        >
                                            <option value="">Default (Global)</option>
                                            <option value="cerebras-llama3">Llama 3 (Cerebras)</option>
                                            <option value="deepseek-r1">DeepSeek R1</option>
                                            <option value="gpt-4o">GPT-4o</option>
                                        </select>
                                    </div>
                                )}
                                {canTake && (
                                    <button onClick={handleTake} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-md transition-colors">
                                        Take Conversation
                                    </button>
                                )}
                                {isAssignedToMe && (
                                    <button onClick={handleRelease} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-md transition-colors">
                                        Release
                                    </button>
                                )}
                            </div>
                        </div>
                        <ChatTimeline messages={messages} isLoading={isLoadingMessages} />
                        <MessageComposer
                            onSend={handleSend}
                            disabled={!isAssignedToMe && activeConv?.state !== 'BOT'}
                            placeholder={isAssignedToMe ? "Type a reply to the user..." : "Take the conversation to reply"}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <svg className="w-16 h-16 mb-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-lg">Select a conversation</p>
                        <p className="text-sm">Choose a chat from the inbox list to view messages</p>
                    </div>
                )}
            </div>

            {/* Right Panel: Context Sidebar */}
            {selectedConvId && (
                <ContextSidebar
                    tags={tags}
                    notes={notes}
                    onAddTag={handleAddTag}
                    onRemoveTag={handleRemoveTag}
                    onAddNote={handleAddNote}
                    contactName={activeConv?.contact_name}
                    phoneNumber={activeConv?.phone_number}
                />
            )}
        </div>
    );
}
