// ============================================
// bandgo - Messages Page (Conversations List)
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { repository } from '../../repositories';
import type { Conversation, User } from '../../types';
import { formatDate } from '../../utils';
import './Messages.css';

export function MessagesPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [convData, usersData] = await Promise.all([
                repository.getConversations(),
                repository.getAllUsers(),
            ]);

            setConversations(convData);

            const usersMap: Record<string, User> = {};
            usersData.forEach(u => { usersMap[u.id] = u; });
            setUsers(usersMap);
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const getOtherUser = (conv: Conversation): User | undefined => {
        const otherUserId = conv.participantIds.find(id => id !== user?.id);
        return otherUserId ? users[otherUserId] : undefined;
    };

    const formatLastMessageTime = (date: Date) => {
        const now = new Date();
        const messageDate = new Date(date);
        const diffMs = now.getTime() - messageDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return messageDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'אתמול';
        } else if (diffDays < 7) {
            return messageDate.toLocaleDateString('he-IL', { weekday: 'short' });
        }
        return formatDate(date);
    };

    const filteredConversations = conversations.filter(conv => {
        const otherUser = getOtherUser(conv);
        if (!searchQuery) return true;
        return otherUser?.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="page page-messages-list">
            <div className="messages-list-header">
                <h1>הודעות</h1>
                <div className="search-input-wrapper">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="חפש שיחות..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {/* Conversations List */}
            {loading ? (
                <div className="page-loading">
                    <div className="spinner spinner-lg"></div>
                </div>
            ) : filteredConversations.length === 0 ? (
                <div className="empty-messages-state">
                    <div className="empty-icon-wrapper">
                        <MessageCircle size={48} />
                    </div>
                    <h2>אין הודעות עדיין</h2>
                    <p>התחילו שיחה עם חברי להקה או נגנים אחרים</p>
                    <button className="find-users-btn" onClick={() => navigate('/bands')}>
                        מצא נגנים
                    </button>
                </div>
            ) : (
                <div className="conversations-list">
                    {filteredConversations.map(conv => {
                        const otherUser = getOtherUser(conv);
                        return (
                            <div
                                key={conv.id}
                                className="conversation-item"
                                onClick={() => navigate(`/messages/${conv.id}`)}
                            >
                                <div className="conversation-avatar">
                                    {otherUser?.avatarUrl ? (
                                        <img src={otherUser.avatarUrl} alt={otherUser.displayName} />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {otherUser?.displayName?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="conversation-info">
                                    <div className="conversation-header-row">
                                        <h3 className="conversation-name">
                                            {otherUser?.displayName || 'משתמש'}
                                        </h3>
                                        <span className="conversation-time">
                                            {formatLastMessageTime(conv.lastMessageAt)}
                                        </span>
                                    </div>
                                    <p className="conversation-preview">
                                        {conv.lastMessagePreview || 'התחילו לדבר...'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
