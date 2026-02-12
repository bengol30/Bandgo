// ============================================
// bandgo - Notifications Page
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Check,
    Trash2,
    Bell,
    CheckCheck,
    Music,
    Users,
    MessageSquare,
    Calendar,
    Star
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { localRepository } from '../../repositories/LocalRepository';
import { Notification } from '../../types';
import { formatTimeAgo } from '../../utils';
import './Notifications.css';

export function NotificationsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadNotifications();
        } else {
            navigate('/');
        }
    }, [user]);

    const loadNotifications = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await localRepository.getNotifications(user.id);
            setNotifications(data);
        } catch (error) {
            console.error('Failed to load notifications:', error);
            showToast('שגיאה בטעינת התראות', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await localRepository.markNotificationRead(id);
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, read: true } : n
            ));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!user) return;
        try {
            await localRepository.markAllNotificationsRead(user.id);
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            showToast('כל ההתראות סומנו כנקראו', 'success');
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            localRepository.markNotificationRead(notification.id); // Fire and forget
        }

        // Navigate based on type
        if (notification.relatedEntityType === 'band_request' && notification.relatedEntityId) {
            navigate(`/requests/${notification.relatedEntityId}`);
        } else if (notification.relatedEntityType === 'application' && notification.relatedEntityId) {
            // Need to figure out where to link for application review
            // For now, maybe to the requests page?
            navigate('/requests');
        } else if (notification.relatedEntityType === 'band' && notification.relatedEntityId) {
            navigate(`/bands/${notification.relatedEntityId}`);
        } else if (notification.relatedEntityType === 'event' && notification.relatedEntityId) {
            navigate(`/events/${notification.relatedEntityId}`);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'application_received':
            case 'application_approved':
                return <Users size={20} />;
            case 'new_sketch':
                return <Music size={20} />;
            case 'new_message':
                return <MessageSquare size={20} />;
            case 'event_invite':
                return <Calendar size={20} />;
            case 'like':
                return <Star size={20} />;
            default:
                return <Bell size={20} />;
        }
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="page page-notifications">
            <div className="notifications-header">
                <div className="header-left">
                    <button className="btn btn-icon btn-ghost notifications-back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft />
                    </button>
                    <h1>התראות {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}</h1>
                </div>
                {unreadCount > 0 && (
                    <button className="btn btn-text btn-sm" onClick={handleMarkAllAsRead}>
                        <CheckCheck size={16} />
                        <span className="hide-mobile">סמן הכל כנקרא</span>
                    </button>
                )}
            </div>

            <div className="container notifications-container">
                {notifications.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <Bell size={48} />
                        </div>
                        <h3>אין התראות חדשות</h3>
                        <p>הכל שקט בינתיים...</p>
                    </div>
                ) : (
                    <div className="notifications-list">
                        {notifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className={`notification-icon type-${notification.type}`}>
                                    {getIcon(notification.type)}
                                </div>
                                <div className="notification-content">
                                    <div className="notification-title">
                                        {notification.title}
                                        {!notification.read && <span className="unread-dot" />}
                                    </div>
                                    <p className="notification-body">{notification.body}</p>
                                    <span className="notification-time">
                                        {formatTimeAgo(notification.createdAt)}
                                    </span>
                                </div>
                                {!notification.read && (
                                    <button
                                        className="btn btn-icon btn-ghost mark-read-btn"
                                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                                        title="סמן כנקרא"
                                    >
                                        <Check size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
