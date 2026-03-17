import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

export function LoginPage() {
    const { supabase } = useAuth();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        const { error: authError } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin
            }
        });

        if (authError) {
            setStatus('error');
            setMessage(authError.message);
            return;
        }

        setStatus('success');
        setMessage('Magic link sent! Please check your inbox (or Inbucket in local dev) to sign in.');
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1 className="login-title">BotControl</h1>
                    <p className="login-subtitle">Sign in to your intelligent workspace</p>
                </div>

                {status === 'success' ? (
                    <div className="message-box success-message">
                        <svg style={{width:'48px', height:'48px', margin:'0 auto 1rem', display:'block', color:'#10b981'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                        </svg>
                        {message}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="input-group">
                            <label htmlFor="email" className="input-label">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                className="premium-input"
                                autoComplete="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        
                        {status === 'error' && (
                            <div className="message-box error-message">
                                {message}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="premium-button"
                            disabled={status === 'loading'}
                        >
                            {status === 'loading' ? 'Sending Magic Link...' : 'Continue with Email'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
