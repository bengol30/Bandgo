// ============================================
// bandgo - Protected Route Component
// Handles authentication and onboarding redirects
// ============================================

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireOnboarding?: boolean;
}

export function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    // If not authenticated, redirect to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If authenticated but not onboarded and onboarding is required, redirect to onboarding
    if (requireOnboarding && !user.isOnboarded) {
        return <Navigate to="/onboarding" replace />;
    }

    return <>{children}</>;
}
