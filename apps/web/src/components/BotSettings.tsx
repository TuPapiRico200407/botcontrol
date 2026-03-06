import React, { useEffect, useState } from 'react';
import { useApi } from '../utils/api';
import { Button, Input, Textarea, Select, Spinner, Toast } from '@botcontrol/ui';

interface Bot {
    id: string;
    prompt: string;
    model: string;
    temperature: number;
    [key: string]: unknown;
}

const modelOptions = [
    { value: 'llama3.1-8b', label: 'Cerebras Llama 3.1 8B' },
    { value: 'llama3.1-70b', label: 'Cerebras Llama 3.1 70B' },
    { value: 'llama3.3-70b', label: 'Cerebras Llama 3.3 70B' },
];

export function BotSettings({ orgId }: { orgId: string }) {
    const api = useApi();
    const [bot, setBot] = useState<Bot | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadBot();
    }, [orgId]);

    const loadBot = async () => {
        setLoading(true);
        const { data, error } = await api.getBot(orgId);
        setLoading(false);
        if (error) {
            setToast({ message: `Failed to load bot: ${error.message}`, type: 'error' });
            return;
        }
        setBot(data as Bot ?? null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bot) return;
        
        // Validate prompt
        if (!bot.prompt || bot.prompt.trim().length === 0) {
            setToast({ message: 'Prompt cannot be empty', type: 'error' });
            return;
        }
        if (bot.prompt.length > 5000) {
            setToast({ message: 'Prompt cannot exceed 5000 characters', type: 'error' });
            return;
        }
        
        // Validate temperature
        if (typeof bot.temperature !== 'number' || bot.temperature < 0 || bot.temperature > 2) {
            setToast({ message: 'Temperature must be between 0 and 2', type: 'error' });
            return;
        }

        setSaving(true);
        const { data, error } = await api.updateBot(orgId, {
            prompt: bot.prompt,
            model: bot.model,
            temperature: bot.temperature,
        });
        setSaving(false);

        if (error) {
            setToast({ message: `Failed to save: ${error.message}`, type: 'error' });
            return;
        }

        setToast({ message: 'Bot settings saved successfully!', type: 'success' });
        setBot(data as Bot);
    };

    if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;
    if (!bot) return <p className="text-gray-400 py-8 text-center">No bot configured for this organization.</p>;

    return (
        <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <Textarea
                id="prompt"
                label="System Prompt"
                placeholder="You are a helpful assistant..."
                rows={8}
                value={bot.prompt || ''}
                onChange={(e) => setBot({ ...bot, prompt: e.target.value })}
                required
            />

            <p className="text-sm text-gray-400">{(bot.prompt || '').length}/5000 characters</p>

            <Select
                id="model"
                label="Model"
                options={modelOptions}
                value={bot.model || ''}
                onChange={(e) => setBot({ ...bot, model: e.target.value })}
            />

            <Input
                id="temperature"
                label="Temperature (0–2)"
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={bot.temperature || 0.7}
                onChange={(e) => setBot({ ...bot, temperature: parseFloat(e.target.value) })}
            />

            <div className="flex gap-3">
                <Button type="submit" isLoading={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </form>
    );
}
