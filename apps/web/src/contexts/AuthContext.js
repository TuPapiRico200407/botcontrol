import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
const getSupabaseUrl = () => {
    const v = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
    return v;
};
const getSupabaseKey = () => {
    const v = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy_anon';
    return v;
};
const supabase = createClient(getSupabaseUrl(), getSupabaseKey());
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setUser(data.session?.user ?? null);
            setLoading(false);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => subscription?.unsubscribe();
    }, []);
    const signOut = () => supabase.auth.signOut().then(() => setUser(null));
    return _jsx(AuthContext.Provider, { value: { user, supabase, loading, signOut }, children: children });
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
