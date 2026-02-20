// ============================================
// bandgo - Top Header Component
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { repository } from '../../repositories';
import './Navigation.css';

export function TopHeader() {
    const { user, isAdmin } = useAuth();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);

    const loadNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const notifications = await repository.getNotifications(user.id);
            const unread = notifications.filter(n => !n.read).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }, [user]);

    // Load notifications on mount and when user changes
    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    // Refresh notification count when navigating away from notifications page
    useEffect(() => {
        if (location.pathname !== '/notifications' && user) {
            loadNotifications();
        }
    }, [location.pathname, user, loadNotifications]);

    // Don't show header on onboarding or specific pages
    // Routes where the top header should be hidden
    const hideHeaderRoutes = [
        '/onboarding',
        '/chat',
        '/messages'
    ];

    const shouldHideHeader = hideHeaderRoutes.some(route => location.pathname.startsWith(route));

    if (shouldHideHeader) {
        return null;
    }

    return (
        <header className="top-header">
            <div className="header-content">
                <Link to="/" className="header-logo">
                    <span className="header-logo-icon">🎸</span>
                    <span className="header-logo-text">BandGo</span>
                </Link>

                <div className="header-actions">
                    <Link to="/notifications" className="btn btn-icon btn-ghost notification-btn">
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="notification-badge">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </Link>

                    {isAdmin && (
                        <Link to="/admin" className="btn btn-icon btn-ghost">
                            <Settings size={20} />
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
