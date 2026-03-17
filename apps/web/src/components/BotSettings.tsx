import React, { useEffect, useState } from 'react';
import { useApi } from '../utils/api';
import { Spinner, Toast } from '@botcontrol/ui';
import '../pages/OrgHomePage.css';

interface Bot {
    id: string;
    prompt: string;
    model: string;
    temperature: number;
    updated_at?: string;
    [key: string]: unknown;
}

const modelOptions = [
    { value: 'llama3.1-8b', label: 'Llama-3.1-8B-Cerebras' },
    { value: 'llama3.1-70b', label: 'Llama-3.1-70B-Cerebras' },
    { value: 'llama3.3-70b', label: 'Llama-3.3-70B-Cerebras' },
];

export function BotSettings({ orgId }: { orgId: string }) {
    const api = useApi();
    const [bot, setBot] = useState<Bot | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => { loadBot(); }, [orgId]);

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
        if (!bot.prompt?.trim()) { setToast({ message: 'Prompt cannot be empty', type: 'error' }); return; }
        if (bot.prompt.length > 5000) { setToast({ message: 'Prompt exceeds 5000 characters', type: 'error' }); return; }
        if (typeof bot.temperature !== 'number' || bot.temperature < 0 || bot.temperature > 2) {
            setToast({ message: 'Temperature must be between 0 and 2', type: 'error' });
            return;
        }
        setSaving(true);
        const { data, error } = await api.updateBot(orgId, { prompt: bot.prompt, model: bot.model, temperature: bot.temperature });
        setSaving(false);
        if (error) { setToast({ message: `Failed to save: ${error.message}`, type: 'error' }); return; }
        setToast({ message: 'Bot settings saved!', type: 'success' });
        setBot(data as Bot);
    };

    if (loading) return <div style={{display:'flex',justifyContent:'center',padding:'2rem'}}><Spinner /></div>;
    if (!bot) return <p style={{color:'var(--text-muted)',padding:'2rem',textAlign:'center'}}>No bot configured.</p>;

    const sliderPct = Math.round((bot.temperature / 2) * 100);

    return (
        <form onSubmit={handleSave} className="bot-form">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <h2 className="bot-form-title">Configuration Form</h2>
            <p className="bot-form-subtitle">Adjust the core parameters for the organization's AI assistant.</p>

            <div className="form-group">
                <label className="form-label">Base System Prompt</label>
                <textarea
                    className="dark-textarea"
                    placeholder="Enter the primary behavioral instructions for the AI bot..."
                    rows={7}
                    value={bot.prompt || ''}
                    onChange={e => setBot({ ...bot, prompt: e.target.value })}
                    required
                />
                <p className="form-hint">This prompt defines the AI's personality and operational boundaries. ({(bot.prompt || '').length}/5000)</p>
            </div>

            <div className="form-group">
                <label className="form-label">Cerebras Model</label>
                <select
                    className="dark-select"
                    value={bot.model || 'llama3.1-8b'}
                    onChange={e => setBot({ ...bot, model: e.target.value })}
                >
                    {modelOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>

            <div className="form-group">
                <div className="slider-row">
                    <label className="form-label" style={{marginBottom:0}}>Temperature</label>
                    <span className="slider-value">{bot.temperature?.toFixed(1) ?? '0.7'}</span>
                </div>
                <input
                    type="range"
                    className="custom-slider"
                    style={{'--value': `${sliderPct}%`} as React.CSSProperties}
                    min={0}
                    max={2}
                    step={0.1}
                    value={bot.temperature ?? 0.7}
                    onChange={e => setBot({ ...bot, temperature: parseFloat(e.target.value) })}
                />
                <div className="slider-labels">
                    <span>Precise</span>
                    <span>Creative</span>
                </div>
            </div>

            <button type="submit" className="save-settings-btn" disabled={saving}>
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{width:'18px',height:'18px'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9" />
                </svg>
                {saving ? 'Saving...' : 'Save Settings'}
            </button>

            {bot.updated_at && (
                <p className="last-updated-note">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{width:'14px',height:'14px'}}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Last updated: {new Date(bot.updated_at).toLocaleString()}
                </p>
            )}
        </form>
    );
}
