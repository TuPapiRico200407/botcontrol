import React, { useState } from 'react';
import { Button } from './Button';
import { Input, Textarea } from './Input';
import { Badge } from './Badge';

export interface Tag {
    id: string;
    tag_name: string;
}

export interface Note {
    id: string;
    content: string;
    created_at: string;
    author: { email: string } | null;
}

export interface ContextSidebarProps {
    tags: Tag[];
    notes: Note[];
    onAddTag: (tagName: string) => Promise<void>;
    onRemoveTag: (tagName: string) => Promise<void>;
    onAddNote: (content: string) => Promise<void>;
    contactName?: string | null;
    phoneNumber?: string;
}

export function ContextSidebar({
    tags, notes, onAddTag, onRemoveTag, onAddNote, contactName, phoneNumber
}: ContextSidebarProps) {
    const [newTag, setNewTag] = useState('');
    const [newNote, setNewNote] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [isAddingNote, setIsAddingNote] = useState(false);

    const handleAddTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTag.trim() || isAddingTag) return;
        setIsAddingTag(true);
        await onAddTag(newTag.trim());
        setNewTag('');
        setIsAddingTag(false);
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim() || isAddingNote) return;
        setIsAddingNote(true);
        await onAddNote(newNote.trim());
        setNewNote('');
        setIsAddingNote(false);
    };

    const formatDate = (isoString?: string) => {
        if (!isoString) return '';
        return new Date(isoString).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    };

    return (
        <div className="w-80 shrink-0 border-l border-gray-800 bg-gray-900 flex flex-col h-full overflow-hidden">
            {/* Contact Info Header */}
            <div className="p-4 border-b border-gray-800 shrink-0">
                <h3 className="font-semibold text-white text-lg">{contactName || 'Unknown Contact'}</h3>
                <p className="text-gray-400 text-sm mt-1">{phoneNumber}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Tags Section */}
                <section>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {tags.map(tag => (
                            <div key={tag.id} className="inline-flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-sm text-gray-200">
                                {tag.tag_name}
                                <button
                                    onClick={() => onRemoveTag(tag.tag_name)}
                                    className="text-gray-500 hover:text-red-400 focus:outline-none"
                                    aria-label={`Remove ${tag.tag_name} tag`}
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                        {tags.length === 0 && <span className="text-sm text-gray-500">No tags added.</span>}
                    </div>

                    <form onSubmit={handleAddTag} className="flex gap-2">
                        <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add a tag..."
                            className="text-sm py-1 h-8"
                            disabled={isAddingTag}
                        />
                        <Button type="submit" size="sm" variant="secondary" disabled={!newTag.trim() || isAddingTag}>
                            Add
                        </Button>
                    </form>
                </section>

                <hr className="border-gray-800 border-t" />

                {/* Internal Notes Section */}
                <section>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Internal Notes</h4>

                    <form onSubmit={handleAddNote} className="mb-4">
                        <Textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Type a private note..."
                            className="text-sm min-h-[80px]"
                            disabled={isAddingNote}
                        />
                        <div className="flex justify-end mt-2">
                            <Button type="submit" size="sm" variant="secondary" disabled={!newNote.trim() || isAddingNote} isLoading={isAddingNote}>
                                Save Note
                            </Button>
                        </div>
                    </form>

                    <div className="space-y-3">
                        {notes.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No internal notes yet.</p>
                        ) : (
                            notes.map(note => (
                                <div key={note.id} className="bg-gray-800/50 rounded p-3 border border-gray-800">
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{note.content}</p>
                                    <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
                                        <span className="truncate max-w-[120px]">{note.author?.email || 'Unknown'}</span>
                                        <span>{formatDate(note.created_at)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
