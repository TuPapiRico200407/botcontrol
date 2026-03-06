import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { OrgHomePage } from './pages/OrgHomePage';
export function App() {
    return (_jsx(AuthProvider, { children: _jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/admin", element: _jsx(ProtectedRoute, { requireSuperAdmin: true, children: _jsx(AdminDashboard, {}) }) }), _jsx(Route, { path: "/org/:orgId", element: _jsx(ProtectedRoute, { children: _jsx(OrgHomePage, {}) }) }), _jsx(Route, { path: "/unauthorized", element: _jsx("div", { className: "flex h-screen items-center justify-center text-gray-600", children: "403 \u2014 You are not authorized to access this page." }) })] }) }) }));
}
