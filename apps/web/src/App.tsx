import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { OrgHomePage } from './pages/OrgHomePage';

export function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
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
                        <div className="flex h-screen items-center justify-center text-gray-600">
                            403 — You are not authorized to access this page.
                        </div>
                    } />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
