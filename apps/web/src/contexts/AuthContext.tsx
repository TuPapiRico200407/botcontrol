import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, type SupabaseClient, type User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextValue {
    user: SupabaseUser | null;
    supabase: SupabaseClient;
    loading: boolean;
    signOut: () => Promise<void>;
}

const getSupabaseUrl = () => {
    const v = (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
    return v;
};

const getSupabaseKey = () => {
    const v = (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_ANON_KEY || 'dummy_anon';
    return v;
};

const supabase = createClient(getSupabaseUrl(), getSupabaseKey());

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }: { data: { session: { user: SupabaseUser } | null } }) => {
            setUser(data.session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: { user: SupabaseUser } | null) => {
            setUser(session?.user ?? null);
        });

        return () => subscription?.unsubscribe();
    }, []);

    const signOut = () => supabase.auth.signOut().then(() => setUser(null));

    return <AuthContext.Provider value={{ user, supabase, loading, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
