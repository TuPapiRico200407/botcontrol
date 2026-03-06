import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '@botcontrol/ui';
export function ProtectedRoute({ children, requireSuperAdmin }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) {
        return (_jsx("div", { className: "flex h-screen items-center justify-center", children: _jsx(Spinner, { size: "lg" }) }));
    }
    if (!user) {
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    }
    // Check super_admin claim from metadata
    if (requireSuperAdmin) {
        const role = user?.app_metadata?.app_role ?? user?.user_metadata?.app_role;
        if (role !== 'super_admin') {
            return _jsx(Navigate, { to: "/unauthorized", replace: true });
        }
    }
    return _jsx(_Fragment, { children: children });
}
