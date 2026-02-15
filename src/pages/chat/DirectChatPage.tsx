// ============================================
// bandgo - Direct Message Chat Page
// Private chat between two users with real-time updates
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Send, Image, Smile, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { repository } from '../../repositories';
import { useDirectChat } from '../../hooks/useChat';
import type { User, Conversation } from '../../types';
import { formatDate } from '../../utils';
import './Chat.css';

export function DirectChatPage() {
    const { conversationId } = useParams<{ conversationId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [otherUser, setOtherUser] = useState<User | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [initialLoading, setInitialLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);

    // Use the real-time direct chat hook
    const { messages, loading, sending, sendMessage } = useDirectChat({
        conversationId: conversationId || '',
        pollingInterval: 2000,
    });

    // Load conversation data
    useEffect(() => {
        if (conversationId) {
            loadConversationData();
        }
    }, [conversationId]);

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

    const loadConversationData = async () => {
        if (!conversationId) return;
        try {
            const [convData, usersData] = await Promise.all([
                repository.getConversations(),
                repository.getAllUsers(),
            ]);

            const conv = convData.find(c => c.id === conversationId);
            if (!conv) {
                showToast('השיחה לא נמצאה', 'error');
                navigate('/messages');
                return;
            }

            setConversation(conv);

            const otherUserId = conv.participantIds.find(id => id !== user?.id);
            const other = usersData.find(u => u.id === otherUserId);
            setOtherUser(other || null);
        } catch (error) {
            console.error('Failed to load conversation:', error);
            showToast('שגיאה בטעינת השיחה', 'error');
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

    return (
        <div className="page page-chat">
            {/* Header */}
            <div className="chat-header">
                <button className="back-button" onClick={() => navigate('/messages')}>
                    <ArrowRight size={20} />
                </button>
                <div className="chat-header-info">
                    <h1 className="chat-title">{otherUser?.displayName || 'משתמש'}</h1>
                    <span className="chat-subtitle">
                        שיחה פרטית
                        {!isOnline && (
                            <span className="offline-indicator">
                                <WifiOff size={12} />
                                אופליין
                            </span>
                        )}
                    </span>
                </div>
                <div className="chat-header-right">
                    {isOnline ? (
                        <span className="online-indicator" title="מחובר - הודעות מתעדכנות בזמן אמת">
                            <Wifi size={16} />
                        </span>
                    ) : (
                        <span className="offline-indicator-icon" title="אופליין">
                            <WifiOff size={16} />
                        </span>
                    )}
                    {otherUser?.avatarUrl && (
                        <img src={otherUser.avatarUrl} alt={otherUser.displayName} className="chat-header-avatar" />
                    )}
                </div>
            </div>

            {/* Messages List */}
            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="empty-messages">
                        <Smile size={48} />
                        <p>אין הודעות עדיין</p>
                        <span>התחילו לדבר!</span>
                    </div>
                ) : (
                    <div className="messages-list">
                        {messages.map((message) => {
                            const isOwn = message.senderId === user?.id;

                            return (
                                <div
                                    key={message.id}
                                    className={`message ${isOwn ? 'message-own' : 'message-other'}`}
                                >
                                    <div className="message-bubble">
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
