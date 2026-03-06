import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useApi } from '../utils/api';
import { Button, Input, Textarea, Select, Spinner, Toast } from '@botcontrol/ui';
const modelOptions = [
    { value: 'llama3.1-8b', label: 'Cerebras Llama 3.1 8B' },
    { value: 'llama3.1-70b', label: 'Cerebras Llama 3.1 70B' },
    { value: 'llama3.3-70b', label: 'Cerebras Llama 3.3 70B' },
];
export function BotSettings({ orgId }) {
    const api = useApi();
    const [bot, setBot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
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
        setBot(data ?? null);
    };
    const handleSave = async (e) => {
        e.preventDefault();
        if (!bot)
            return;
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
        setBot(data);
    };
    if (loading)
        return _jsx("div", { className: "flex justify-center py-8", children: _jsx(Spinner, {}) });
    if (!bot)
        return _jsx("p", { className: "text-gray-400 py-8 text-center", children: "No bot configured for this organization." });
    return (_jsxs("form", { onSubmit: handleSave, className: "space-y-6 max-w-2xl", children: [toast && _jsx(Toast, { message: toast.message, type: toast.type, onClose: () => setToast(null) }), _jsx(Textarea, { id: "prompt", label: "System Prompt", placeholder: "You are a helpful assistant...", rows: 8, value: bot.prompt || '', onChange: (e) => setBot({ ...bot, prompt: e.target.value }), required: true }), _jsxs("p", { className: "text-sm text-gray-400", children: [(bot.prompt || '').length, "/5000 characters"] }), _jsx(Select, { id: "model", label: "Model", options: modelOptions, value: bot.model || '', onChange: (e) => setBot({ ...bot, model: e.target.value }) }), _jsx(Input, { id: "temperature", label: "Temperature (0\u20132)", type: "number", min: 0, max: 2, step: 0.1, value: bot.temperature || 0.7, onChange: (e) => setBot({ ...bot, temperature: parseFloat(e.target.value) }) }), _jsx("div", { className: "flex gap-3", children: _jsx(Button, { type: "submit", isLoading: saving, children: saving ? 'Saving...' : 'Save Settings' }) })] }));
}
