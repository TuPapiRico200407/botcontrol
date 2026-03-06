import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Toast } from '@botcontrol/ui';

export function LoginPage() {
    const { supabase } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (authError) {
            setError(authError.message);
            setToast({ message: authError.message, type: 'error' });
            return;
        }
        setToast({ message: 'Sign in successful! Redirecting...', type: 'success' });
        setTimeout(() => navigate('/admin', { replace: true }), 1500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="w-full max-w-sm rounded-xl bg-gray-800 border border-gray-700 shadow-2xl p-8">
                <h1 className="text-3xl font-bold text-white mb-2">BotControl</h1>
                <p className="text-sm text-gray-400 mb-8">Sign in to your account</p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <Input
                        id="email"
                        label="Email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        id="password"
                        label="Password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    <Button type="submit" isLoading={loading} className="w-full">
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
