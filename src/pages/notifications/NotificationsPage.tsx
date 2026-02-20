// ============================================
// bandgo - Notifications Page
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Check,
    Bell,
    CheckCheck,
    Music,
    Users,
    MessageSquare,
    Calendar,
    Heart,
    PartyPopper,
    Ticket,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { repository } from '../../repositories';
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
            const data = await repository.getNotifications(user.id);
            setNotifications(data);

            // Auto-mark all unread notifications as read when viewing the notifications page
            const unreadNotifications = data.filter(n => !n.read);
            if (unreadNotifications.length > 0) {
                // Update UI immediately for responsive feel
                setNotifications(data.map(n => ({ ...n, read: true })));

                // Mark all as read in the database
                try {
                    await repository.markAllNotificationsRead(user.id);
                } catch (err) {
                    console.error('Failed to auto-mark notifications as read:', err);
                    // Revert UI if database update failed
                    setNotifications(data);
                }
            }
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
            await repository.markNotificationRead(id);
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
            await repository.markAllNotificationsRead(user.id);
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            showToast('כל ההתראות סומנו כנקראו', 'success');
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            repository.markNotificationRead(notification.id); // Fire and forget
        }

        // Navigate based on type
        switch (notification.type) {
            case 'poll_created':
            case 'rehearsal_scheduled':
                if (notification.relatedEntityType === 'band' && notification.relatedEntityId) {
                    navigate(`/bands/${notification.relatedEntityId}/schedule`);
                }
                break;

            case 'like':
            case 'comment':
            case 'admin_message':
                if (notification.relatedEntityType === 'post' && notification.relatedEntityId) {
                    navigate(`/?postId=${notification.relatedEntityId}`);
                }
                break;

            case 'new_song':
            case 'new_sketch':
                if (notification.relatedEntityType === 'band' && notification.relatedEntityId) {
                    navigate(`/bands/${notification.relatedEntityId}`);
                }
                break;

            case 'band_formed':
            case 'chat_message':
                if (notification.relatedEntityType === 'band' && notification.relatedEntityId) {
                    navigate(`/bands/${notification.relatedEntityId}`);
                }
                break;

            case 'application_approved':
                if (notification.relatedEntityType === 'band' && notification.relatedEntityId) {
                    navigate(`/bands/${notification.relatedEntityId}`);
                } else if (notification.relatedEntityType === 'band_request' && notification.relatedEntityId) {
                    navigate(`/requests/${notification.relatedEntityId}`);
                }
                break;

            case 'application_received':
            case 'application_rejected':
            case 'band_request':
                if (notification.relatedEntityType === 'band' && notification.relatedEntityId) {
                    navigate(`/bands/${notification.relatedEntityId}`);
                } else if (notification.relatedEntityType === 'band_request' && notification.relatedEntityId) {
                    navigate(`/requests/${notification.relatedEntityId}`);
                } else if (notification.relatedEntityType === 'application' && notification.relatedEntityId) {
                    try {
                        const applications = await repository.getAllApplications();
                        const app = applications.find(a => a.id === notification.relatedEntityId);
                        if (app) {
                            const bands = await repository.getBands();
                            const band = bands.find(b => b.originalBandRequestId === app.bandRequestId);
                            if (band) {
                                navigate(`/bands/${band.id}`);
                                return;
                            }
                            navigate(`/requests/${app.bandRequestId}`);
                            return;
                        }
                    } catch (e) {
                        console.error('Error navigating from application notification:', e);
                    }
                    navigate('/requests');
                } else {
                    navigate('/requests');
                }
                break;

            case 'event_registration':
            case 'event_approved':
            case 'event_invite':
                if (notification.relatedEntityType === 'event' && notification.relatedEntityId) {
                    navigate(`/events/${notification.relatedEntityId}`);
                } else {
                    navigate('/events');
                }
                break;

            case 'event_rejected':
            case 'event_needs_changes':
                navigate('/events');
                break;

            case 'direct_message':
                navigate(`/messages/${notification.relatedEntityId}`);
                break;

            default:
                if (notification.relatedEntityType === 'band' && notification.relatedEntityId) {
                    navigate(`/bands/${notification.relatedEntityId}`);
                } else if (notification.relatedEntityType === 'event' && notification.relatedEntityId) {
                    navigate(`/events/${notification.relatedEntityId}`);
                } else if (notification.relatedEntityType === 'band_request' && notification.relatedEntityId) {
                    navigate(`/requests/${notification.relatedEntityId}`);
                } else if (notification.relatedEntityType === 'post' && notification.relatedEntityId) {
                    navigate(`/?postId=${notification.relatedEntityId}`);
                }
                break;
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'application_received':
            case 'application_approved':
            case 'application_rejected':
            case 'band_request':
                return <Users size={20} />;
            case 'band_formed':
                return <PartyPopper size={20} />;
            case 'new_song':
            case 'new_sketch':
                return <Music size={20} />;
            case 'chat_message':
            case 'new_message':
            case 'direct_message':
            case 'comment':
                return <MessageSquare size={20} />;
            case 'poll_created':
            case 'rehearsal_scheduled':
            case 'event_invite':
            case 'event_approved':
            case 'event_rejected':
            case 'event_needs_changes':
                return <Calendar size={20} />;
            case 'event_registration':
                return <Ticket size={20} />;
            case 'like':
                return <Heart size={20} />;
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
