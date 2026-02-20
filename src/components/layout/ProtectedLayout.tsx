// ============================================
// bandgo - Protected Layout Component
// Combines ProtectedRoute with AppLayout
// ============================================

import React from 'react';
import { ProtectedRoute } from '../common/ProtectedRoute';
import { AppLayout } from './AppLayout';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute>
            <AppLayout>
                {children}
            </AppLayout>
        </ProtectedRoute>
    );
}
