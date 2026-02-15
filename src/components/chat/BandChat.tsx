
// ============================================
// bandgo - Band Chat Component
// Embedded group chat for band workspace
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { Send, Image, Smile, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { repository } from '../../repositories';
import { useBandChat } from '../../hooks/useChat';
import type { User, Band } from '../../types';
import { formatDate } from '../../utils';
import '../../pages/chat/Chat.css'; // Reusing existing styles

interface BandChatProps {
    band: Band;
}

export function BandChat({ band }: BandChatProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [users, setUsers] = useState<Record<string, User>>({});
    const [newMessage, setNewMessage] = useState('');
    const [isOnline, setIsOnline] = useState(true);

    // Use the real-time chat hook
    const { messages, loading, sending, sendMessage } = useBandChat({
        bandId: band.id,
        pollingInterval: 3000,
    });

    // Load users
    useEffect(() => {
        loadUsers();
    }, []);

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

    const loadUsers = async () => {
        try {
            const usersData = await repository.getAllUsers();
            const usersMap: Record<string, User> = {};
            usersData.forEach(u => { usersMap[u.id] = u; });
            setUsers(usersMap);
        } catch (error) {
            console.error('Failed to load users for chat:', error);
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

    return (
        <div className="chat-component">
            <div className="chat-status-bar mb-sm flex justify-between items-center bg-card p-xs rounded-md">
                <span className="text-sm text-secondary">
                    {band.members.length} חברים בצ'אט
                </span>
                {isOnline ? (
                    <span className="status-badge online flex items-center gap-xs text-xs text-success">
                        <Wifi size={12} />
                        מחובר
                    </span>
                ) : (
                    <span className="status-badge offline flex items-center gap-xs text-xs text-error">
                        <WifiOff size={12} />
                        אופליין
                    </span>
                )}
            </div>

            <div className="messages-container" style={{ height: '500px', overflowY: 'auto', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
                {messages.length === 0 ? (
                    <div className="empty-messages flex flex-col items-center justify-center h-full text-secondary">
                        <Smile size={48} className="mb-md opacity-50" />
                        <p>אין הודעות עדיין</p>
                        <span>היה הראשון לשלוח הודעה!</span>
                    </div>
                ) : (
                    <div className="messages-list flex flex-col gap-sm">
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
                                    className={`message flex gap-xs ${isOwn ? 'flex-row-reverse' : ''}`}
                                >
                                    {showAvatar && (
                                        <div className="message-avatar w-8 h-8 rounded-full overflow-hidden bg-surface flex items-center justify-center shrink-0">
                                            {sender?.avatarUrl ? (
                                                <img src={sender.avatarUrl} alt={sender.displayName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs">{sender?.displayName?.charAt(0) || '?'}</span>
                                            )}
                                        </div>
                                    )}
                                    {!showAvatar && !isOwn && <div className="w-8 shrink-0"></div>}

                                    <div className={`message-bubble p-sm rounded-lg max-w-[70%] ${isOwn ? 'bg-primary text-white rounded-tl-none' : 'bg-card text-text rounded-tr-none'}`}>
                                        {!isOwn && showAvatar && (
                                            <span className="message-sender text-xs font-bold block mb-xs opacity-80">{sender?.displayName || 'משתמש'}</span>
                                        )}
                                        <p className="message-content break-words">{message.content}</p>
                                        <span className={`message-time text-[10px] block text-right mt-xs ${isOwn ? 'opacity-70' : 'text-secondary'}`}>
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

            <form className="message-input-container flex gap-sm" onSubmit={handleSendMessage}>
                <input
                    ref={inputRef}
                    type="text"
                    className="message-input input flex-1"
                    placeholder={isOnline ? "כתוב הודעה..." : "אתה אופליין..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending || !isOnline}
                />
                <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                >
                    <Image size={20} />
                </button>
                <button
                    type="submit"
                    className="btn btn-primary btn-icon"
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
