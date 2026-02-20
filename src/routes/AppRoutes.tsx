import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedLayout } from '../components/layout';

// Pages
import { OnboardingPage } from '../pages/auth/OnboardingPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { FeedPage } from '../pages/feed/FeedPage';
import { BandsPage } from '../pages/bands/BandsPage';
import { BandWorkspacePage } from '../pages/bands/BandWorkspacePage'; // New Page
import { CreateBandRequestPage } from '../pages/bands/CreateBandRequestPage';
import { BandRequestsPage } from '../pages/bands/BandRequestsPage';
import { BandRequestDetailsPage } from '../pages/bands/BandRequestDetailsPage';
import { BandDetailsPage } from '../pages/bands/BandDetailsPage';
import { EventsPage } from '../pages/events/EventsPage';
import { EventDetailsPage } from '../pages/events/EventDetailsPage';
import { EditProfilePage } from '../pages/profile/EditProfilePage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { UserProfilePage } from '../pages/profile/UserProfilePage';
import { NotificationsPage } from '../pages/notifications/NotificationsPage';
import { AdminPage } from '../pages/admin/AdminPage';
import { BandChatPage } from '../pages/chat/BandChatPage';
import { MessagesPage } from '../pages/chat/MessagesPage';
import { DirectChatPage } from '../pages/chat/DirectChatPage';
import { RehearsalSchedulerPage } from '../pages/scheduler/RehearsalSchedulerPage';

// Simple Not Found Page
const NotFoundPage = () => (
    <div className="page" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
        <p style={{ fontSize: '1.2rem', color: '#9ca3af' }}>העמוד שחיפשת לא נמצא</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '2rem' }}>
            חזור לדף הבית
        </Link>
    </div>
);

export function AppRoutes() {
    console.log('[DEBUG] AppRoutes rendering');
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    return (
        <Routes>
            {/* Onboarding & Auth */}
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Main App Routes with Layout */}
            <Route path="/" element={
                <ProtectedLayout>
                    <FeedPage />
                </ProtectedLayout>
            } />

            <Route path="/requests" element={
                <ProtectedLayout>
                    <BandRequestsPage />
                </ProtectedLayout>
            } />

            <Route path="/requests/new" element={
                <ProtectedLayout>
                    <CreateBandRequestPage />
                </ProtectedLayout>
            } />

            <Route path="/requests/:id" element={
                <ProtectedLayout>
                    <BandRequestDetailsPage />
                </ProtectedLayout>
            } />

            {/* Bands Listing Page */}
            <Route path="/bands" element={
                <ProtectedLayout>
                    <BandsPage />
                </ProtectedLayout>
            } />

            {/* Public Band Profile -> Refactored from BandDetailsPage */}
            <Route path="/bands/:id" element={
                <ProtectedLayout>
                    <BandDetailsPage />
                </ProtectedLayout>
            } />

            {/* Private Band Workspace -> New Route */}
            <Route path="/bands/:bandId/workspace" element={
                <ProtectedLayout>
                    <BandWorkspacePage />
                </ProtectedLayout>
            } />

            {/* Legacy/Specific feature routes (can be folded into workspace later) */}
            <Route path="/bands/:bandId/chat" element={
                <ProtectedLayout>
                    <BandChatPage />
                </ProtectedLayout>
            } />

            <Route path="/messages" element={
                <ProtectedLayout>
                    <MessagesPage />
                </ProtectedLayout>
            } />

            <Route path="/messages/:conversationId" element={
                <ProtectedLayout>
                    <DirectChatPage />
                </ProtectedLayout>
            } />

            <Route path="/events" element={
                <ProtectedLayout>
                    <EventsPage />
                </ProtectedLayout>
            } />

            <Route path="/events/:id" element={
                <ProtectedLayout>
                    <EventDetailsPage />
                </ProtectedLayout>
            } />

            <Route path="/profile/edit" element={
                <ProtectedLayout>
                    <EditProfilePage />
                </ProtectedLayout>
            } />

            <Route path="/profile" element={
                <ProtectedLayout>
                    <ProfilePage />
                </ProtectedLayout>
            } />

            <Route path="/profile/:userId" element={
                <ProtectedLayout>
                    <UserProfilePage />
                </ProtectedLayout>
            } />

            <Route path="/notifications" element={
                <ProtectedLayout>
                    <NotificationsPage />
                </ProtectedLayout>
            } />

            <Route path="/admin" element={
                <ProtectedLayout>
                    <AdminPage />
                </ProtectedLayout>
            } />

            {/* Catch all - redirect to feed */}
            <Route path="*" element={
                <ProtectedLayout>
                    <NotFoundPage />
                </ProtectedLayout>
            } />
        </Routes>
    );
}
