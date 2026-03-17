import React, { useState } from 'react';
import { Button } from './Button';
import { Textarea } from './Input';

export interface MessageComposerProps {
    onSend: (message: string) => Promise<void>;
    disabled?: boolean;
    placeholder?: string;
}

export function MessageComposer({ onSend, disabled = false, placeholder = "Type a message..." }: MessageComposerProps) {
    const [text, setText] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!text.trim() || disabled || isSending) return;

        setIsSending(true);
        try {
            await onSend(text.trim());
            setText('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t border-gray-800 bg-gray-900 p-4 shrink-0">
            <div className="flex gap-3 items-end">
                <div className="grow">
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={disabled ? "You cannot reply to this conversation" : placeholder}
                        disabled={disabled || isSending}
                        rows={1}
                        className="resize-none min-h-[44px] max-h-32 focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <Button
                    onClick={handleSend}
                    disabled={!text.trim() || disabled || isSending}
                    isLoading={isSending}
                    className="shrink-0 mb-[2px]"
                >
                    Send
                </Button>
            </div>
            {!disabled && (
                <div className="text-xs text-gray-500 mt-2">
                    Press <kbd className="bg-gray-800 px-1 py-0.5 rounded border border-gray-700">Enter</kbd> to send, <kbd className="bg-gray-800 px-1 py-0.5 rounded border border-gray-700">Shift</kbd> + <kbd className="bg-gray-800 px-1 py-0.5 rounded border border-gray-700">Enter</kbd> for new line
                </div>
            )}
        </div>
    );
}
