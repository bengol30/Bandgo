// ============================================
// bandgo - Band Chat Page
// Group chat for band members with real-time updates
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Send, Image, Smile, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { repository } from '../../repositories';
import { useBandChat } from '../../hooks/useChat';
import type { User, Band } from '../../types';
import { formatDate } from '../../utils';
import './Chat.css';

export function BandChatPage() {
    const { bandId } = useParams<{ bandId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [band, setBand] = useState<Band | null>(null);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [newMessage, setNewMessage] = useState('');
    const [initialLoading, setInitialLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);

    // Use the real-time chat hook
    const { messages, loading, sending, sendMessage } = useBandChat({
        bandId: bandId || '',
        pollingInterval: 2000, // Check for new messages every 2 seconds
    });

    // Load band data and users
    useEffect(() => {
        if (bandId) {
            loadBandData();
        }
    }, [bandId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Online/offline detection
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const loadBandData = async () => {
        if (!bandId) return;
        try {
            const [bandData, usersData] = await Promise.all([
                repository.getBand(bandId),
                repository.getAllUsers(),
            ]);

            if (!bandData) {
                showToast('הלהקה לא נמצאה', 'error');
                navigate('/bands');
                return;
            }

            setBand(bandData);

            const usersMap: Record<string, User> = {};
            usersData.forEach(u => { usersMap[u.id] = u; });
            setUsers(usersMap);
        } catch (error) {
            console.error('Failed to load band data:', error);
            showToast('שגיאה בטעינת הנתונים', 'error');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        try {
            await sendMessage(newMessage.trim());
            setNewMessage('');
            inputRef.current?.focus();
        } catch {
            showToast('שגיאה בשליחת ההודעה', 'error');
        }
    };

    const formatMessageTime = (date: Date) => {
        const now = new Date();
        const messageDate = new Date(date);
        const isToday = now.toDateString() === messageDate.toDateString();

        if (isToday) {
            return messageDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        }
        return formatDate(date);
    };

    if (initialLoading || loading) {
        return (
            <div className="page-loading">
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    if (!band) return null;

    return (
        <div className="page page-chat">
            {/* Header */}
            {/* Header */}
            <div className="chat-header band-chat-header">
                {band.coverImageUrl && (
                    <img src={band.coverImageUrl} alt={band.name} className="chat-header-bg" />
                )}
                <div className="chat-header-overlay">
                    <button className="back-button" onClick={() => navigate(-1)}>
                        <ArrowRight size={20} />
                    </button>
                    <div className="chat-header-info">
                        <h1 className="chat-title">{band.name}</h1>
                        <div className="chat-status-row">
                            <span className="chat-subtitle">
                                {band.members.length} חברים
                            </span>
                            {isOnline ? (
                                <span className="status-badge online">
                                    <Wifi size={12} />
                                    מחובר
                                </span>
                            ) : (
                                <span className="status-badge offline">
                                    <WifiOff size={12} />
                                    אופליין
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages List */}
            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="empty-messages">
                        <Smile size={48} />
                        <p>אין הודעות עדיין</p>
                        <span>היה הראשון לשלוח הודעה!</span>
                    </div>
                ) : (
                    <div className="messages-list">
                        {messages.map((message, index) => {
                            const sender = users[message.senderId];
                            const isOwn = message.senderId === user?.id;
                            const showAvatar = !isOwn && (
                                index === 0 ||
                                messages[index - 1].senderId !== message.senderId
                            );

                            return (
                                <div
                                    key={message.id}
                                    className={`message ${isOwn ? 'message-own' : 'message-other'}`}
                                >
                                    {showAvatar && (
                                        <div className="message-avatar">
                                            {sender?.avatarUrl ? (
                                                <img src={sender.avatarUrl} alt={sender.displayName} />
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    {sender?.displayName?.charAt(0) || '?'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="message-bubble">
                                        {!isOwn && showAvatar && (
                                            <span className="message-sender">{sender?.displayName || 'משתמש'}</span>
                                        )}
                                        <p className="message-content">{message.content}</p>
                                        {message.media && (
                                            <div className="message-media">
                                                {message.media.type === 'image' && (
                                                    <img src={message.media.url} alt="Attached" />
                                                )}
                                            </div>
                                        )}
                                        <span className="message-time">
                                            {formatMessageTime(message.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Message Input */}
            <form className="message-input-container" onSubmit={handleSendMessage}>
                <button type="button" className="message-action-btn">
                    <Image size={20} />
                </button>
                <input
                    ref={inputRef}
                    type="text"
                    className="message-input"
                    placeholder={isOnline ? "כתוב הודעה..." : "אתה אופליין..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending || !isOnline}
                />
                <button
                    type="submit"
                    className={`send-button ${sending ? 'sending' : ''}`}
                    disabled={!newMessage.trim() || sending || !isOnline}
                >
                    {sending ? (
                        <div className="spinner spinner-sm"></div>
                    ) : (
                        <Send size={20} />
                    )}
                </button>
            </form>
        </div>
    );
}
