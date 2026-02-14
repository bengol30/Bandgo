import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppLayout } from '../components/layout';

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
                <AppLayout>
                    <FeedPage />
                </AppLayout>
            } />

            <Route path="/requests" element={
                <AppLayout>
                    <BandRequestsPage />
                </AppLayout>
            } />

            <Route path="/requests/new" element={
                <AppLayout>
                    <CreateBandRequestPage />
                </AppLayout>
            } />

            <Route path="/requests/:id" element={
                <AppLayout>
                    <BandRequestDetailsPage />
                </AppLayout>
            } />

            {/* Bands Listing Page */}
            <Route path="/bands" element={
                <AppLayout>
                    <BandsPage />
                </AppLayout>
            } />

            {/* Public Band Profile -> Refactored from BandDetailsPage */}
            <Route path="/bands/:id" element={
                <AppLayout>
                    <BandDetailsPage />
                </AppLayout>
            } />

            {/* Private Band Workspace -> New Route */}
            <Route path="/bands/:bandId/workspace" element={
                <AppLayout>
                    <BandWorkspacePage />
                </AppLayout>
            } />

            {/* Legacy/Specific feature routes (can be folded into workspace later) */}
            <Route path="/bands/:bandId/chat" element={
                <AppLayout>
                    <BandChatPage />
                </AppLayout>
            } />

            <Route path="/messages" element={
                <AppLayout>
                    <MessagesPage />
                </AppLayout>
            } />

            <Route path="/messages/:conversationId" element={
                <AppLayout>
                    <DirectChatPage />
                </AppLayout>
            } />

            <Route path="/events" element={
                <AppLayout>
                    <EventsPage />
                </AppLayout>
            } />

            <Route path="/events/:id" element={
                <AppLayout>
                    <EventDetailsPage />
                </AppLayout>
            } />

            <Route path="/profile/edit" element={
                <AppLayout>
                    <EditProfilePage />
                </AppLayout>
            } />

            <Route path="/profile" element={
                <AppLayout>
                    <ProfilePage />
                </AppLayout>
            } />

            <Route path="/profile/:userId" element={
                <AppLayout>
                    <UserProfilePage />
                </AppLayout>
            } />

            <Route path="/notifications" element={
                <AppLayout>
                    <NotificationsPage />
                </AppLayout>
            } />

            <Route path="/admin" element={
                <AppLayout>
                    <AdminPage />
                </AppLayout>
            } />

            {/* Catch all - redirect to feed */}
            <Route path="*" element={
                <AppLayout>
                    <NotFoundPage />
                </AppLayout>
            } />
        </Routes>
    );
}
