import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { OrgHomePage } from './pages/OrgHomePage';

const RootRedirect = () => {
    const location = useLocation();
    return <Navigate to={{ pathname: "/login", hash: location.hash }} replace />;
};

export function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute requireSuperAdmin>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/org/:orgId"
                        element={
                            <ProtectedRoute>
                                <OrgHomePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/unauthorized" element={
                        <div className="flex flex-col h-screen items-center justify-center text-gray-400 bg-[#0A0D14]">
                            <div className="text-xl mb-4">403 — You are not authorized to access this page.</div>
                            <button 
                                onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Sign Out & Try Again
                            </button>
                        </div>
                    } />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
