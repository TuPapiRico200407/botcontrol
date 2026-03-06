import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '@botcontrol/ui';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireSuperAdmin?: boolean;
}

export function ProtectedRoute({ children, requireSuperAdmin }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check super_admin claim from metadata
    if (requireSuperAdmin) {
        const role = user?.app_metadata?.app_role ?? user?.user_metadata?.app_role;
        if (role !== 'super_admin') {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return <>{children}</>;
}
