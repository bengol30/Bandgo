// ============================================
// bandgo - Real-time Chat Hook
// Provides real-time updates for band and direct chats
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { localRepository } from '../repositories/LocalRepository';
import { chatService } from '../services/ChatService';
import type { ChatMessage, DirectMessage } from '../types';

interface UseBandChatOptions {
    bandId: string;
    pollingInterval?: number; // Default 3000ms
}

interface UseBandChatReturn {
    messages: ChatMessage[];
    loading: boolean;
    sending: boolean;
    sendMessage: (content: string) => Promise<void>;
    refresh: () => Promise<void>;
}

export function useBandChat({ bandId, pollingInterval = 3000 }: UseBandChatOptions): UseBandChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const lastMessageIdRef = useRef<string | null>(null);

    // Load messages
    const loadMessages = useCallback(async () => {
        try {
            const data = await localRepository.getChatMessages(bandId);
            setMessages(data);

            // Track last message for polling comparison
            if (data.length > 0) {
                lastMessageIdRef.current = data[data.length - 1].id;
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    }, [bandId]);

    // Check for new messages (polling)
    const checkForNewMessages = useCallback(async () => {
        try {
            const data = await localRepository.getChatMessages(bandId);

            // Only update if there are new messages
            if (data.length > 0) {
                const newLastId = data[data.length - 1].id;
                if (newLastId !== lastMessageIdRef.current) {
                    setMessages(data);
                    lastMessageIdRef.current = newLastId;
                }
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, [bandId]);

    // Send message
    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || sending) return;

        setSending(true);
        try {
            const message = await localRepository.sendChatMessage(bandId, content.trim());

            // Optimistic update
            setMessages(prev => [...prev, message]);
            lastMessageIdRef.current = message.id;

            // Emit event for real-time sync
            chatService.emitBandChatMessage(bandId, {
                id: message.id,
                senderId: message.senderId,
                content: message.content,
                createdAt: message.createdAt,
            });
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        } finally {
            setSending(false);
        }
    }, [bandId, sending]);

    // Initial load
    useEffect(() => {
        loadMessages();
        localRepository.markChatAsRead(bandId);
    }, [bandId, loadMessages]);

    // Subscribe to real-time events
    useEffect(() => {
        const unsubscribe = chatService.subscribeToBandChat(bandId, (_, event) => {
            if (event.type === 'new_message' && event.message) {
                // Check if message is not already in the list (from optimistic update)
                setMessages(prev => {
                    if (prev.some(m => m.id === event.message!.id)) {
                        return prev;
                    }
                    return [...prev, {
                        id: event.message!.id,
                        bandId,
                        senderId: event.message!.senderId,
                        content: event.message!.content,
                        createdAt: event.message!.createdAt,
                        readBy: [],
                    }];
                });
            }
        });

        return unsubscribe;
    }, [bandId]);

    // Polling for messages from other devices/browsers
    useEffect(() => {
        const stopPolling = chatService.startPolling(
            `band_chat_${bandId}`,
            checkForNewMessages,
            pollingInterval
        );

        return stopPolling;
    }, [bandId, checkForNewMessages, pollingInterval]);

    return {
        messages,
        loading,
        sending,
        sendMessage,
        refresh: loadMessages,
    };
}

// ============ DIRECT MESSAGES HOOK ============

interface UseDirectChatOptions {
    conversationId: string;
    pollingInterval?: number;
}

interface UseDirectChatReturn {
    messages: DirectMessage[];
    loading: boolean;
    sending: boolean;
    sendMessage: (content: string) => Promise<void>;
    refresh: () => Promise<void>;
}

export function useDirectChat({ conversationId, pollingInterval = 3000 }: UseDirectChatOptions): UseDirectChatReturn {
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const lastMessageIdRef = useRef<string | null>(null);

    const loadMessages = useCallback(async () => {
        try {
            const data = await localRepository.getDirectMessages(conversationId);
            setMessages(data);

            if (data.length > 0) {
                lastMessageIdRef.current = data[data.length - 1].id;
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    }, [conversationId]);

    const checkForNewMessages = useCallback(async () => {
        try {
            const data = await localRepository.getDirectMessages(conversationId);

            if (data.length > 0) {
                const newLastId = data[data.length - 1].id;
                if (newLastId !== lastMessageIdRef.current) {
                    setMessages(data);
                    lastMessageIdRef.current = newLastId;
                }
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, [conversationId]);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || sending) return;

        setSending(true);
        try {
            const message = await localRepository.sendDirectMessage(conversationId, content.trim());

            setMessages(prev => [...prev, message]);
            lastMessageIdRef.current = message.id;

            chatService.emitDirectMessage(conversationId, {
                id: message.id,
                senderId: message.senderId,
                content: message.content,
                createdAt: message.createdAt,
            });
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        } finally {
            setSending(false);
        }
    }, [conversationId, sending]);

    useEffect(() => {
        loadMessages();
        localRepository.markDirectMessagesAsRead(conversationId);
    }, [conversationId, loadMessages]);

    useEffect(() => {
        const unsubscribe = chatService.subscribeToDirectChat(conversationId, (_, event) => {
            if (event.type === 'new_message' && event.message) {
                setMessages(prev => {
                    if (prev.some(m => m.id === event.message!.id)) {
                        return prev;
                    }
                    return [...prev, {
                        id: event.message!.id,
                        conversationId,
                        senderId: event.message!.senderId,
                        content: event.message!.content,
                        createdAt: event.message!.createdAt,
                        read: false,
                    }];
                });
            }
        });

        return unsubscribe;
    }, [conversationId]);

    useEffect(() => {
        const stopPolling = chatService.startPolling(
            `direct_chat_${conversationId}`,
            checkForNewMessages,
            pollingInterval
        );

        return stopPolling;
    }, [conversationId, checkForNewMessages, pollingInterval]);

    return {
        messages,
        loading,
        sending,
        sendMessage,
        refresh: loadMessages,
    };
}

// ============ UNREAD COUNT HOOK ============

interface UseUnreadCountsReturn {
    bandUnreadCounts: Record<string, number>;
    totalDirectUnread: number;
    refresh: () => Promise<void>;
}

export function useUnreadCounts(bandIds: string[]): UseUnreadCountsReturn {
    const [bandUnreadCounts, setBandUnreadCounts] = useState<Record<string, number>>({});
    const [totalDirectUnread, setTotalDirectUnread] = useState(0);

    const loadCounts = useCallback(async () => {
        try {
            // Load band unread counts
            const counts: Record<string, number> = {};
            for (const bandId of bandIds) {
                counts[bandId] = await localRepository.getUnreadChatCount(bandId);
            }
            setBandUnreadCounts(counts);

            // Load direct message unread count
            const directCount = await localRepository.getUnreadDirectMessageCount();
            setTotalDirectUnread(directCount);
        } catch (error) {
            console.error('Failed to load unread counts:', error);
        }
    }, [bandIds]);

    useEffect(() => {
        loadCounts();

        // Subscribe to global updates
        const unsubscribe = chatService.subscribeToGlobalUpdates(loadCounts);

        return unsubscribe;
    }, [loadCounts]);

    return {
        bandUnreadCounts,
        totalDirectUnread,
        refresh: loadCounts,
    };
}
