import React from 'react';
import { TopHeader } from './TopHeader';
import { BottomNav } from './BottomNav';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ToastContainer } from '../common';

export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <TopHeader />
            <ErrorBoundary>
                {children}
            </ErrorBoundary>
            <BottomNav />
            <ToastContainer />
        </>
    );
}
