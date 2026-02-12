// ============================================
// bandgo - Chat Service with Real-time Support
// Provides event-based messaging and cross-tab sync
// ============================================

type MessageListener = (bandId: string, message: ChatMessageEvent) => void;
type ConversationListener = (conversationId: string, message: DirectMessageEvent) => void;

export interface ChatMessageEvent {
    type: 'new_message' | 'messages_read';
    bandId: string;
    message?: {
        id: string;
        senderId: string;
        content: string;
        createdAt: Date;
    };
}

export interface DirectMessageEvent {
    type: 'new_message' | 'messages_read';
    conversationId: string;
    message?: {
        id: string;
        senderId: string;
        content: string;
        createdAt: Date;
    };
}

class ChatService {
    private bandChatListeners: Map<string, Set<MessageListener>> = new Map();
    private directChatListeners: Map<string, Set<ConversationListener>> = new Map();
    private globalListeners: Set<() => void> = new Set();
    private broadcastChannel: BroadcastChannel | null = null;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

    constructor() {
        this.initBroadcastChannel();
    }

    // ============ BROADCAST CHANNEL (Cross-tab sync) ============
    private initBroadcastChannel() {
        if (typeof BroadcastChannel !== 'undefined') {
            this.broadcastChannel = new BroadcastChannel('bandgo_chat_channel');
            this.broadcastChannel.onmessage = (event) => {
                this.handleBroadcastMessage(event.data);
            };
        }
    }

    private handleBroadcastMessage(data: { type: string; payload: unknown }) {
        if (data.type === 'band_chat_message') {
            const payload = data.payload as ChatMessageEvent;
            this.notifyBandChatListeners(payload.bandId, payload);
        } else if (data.type === 'direct_message') {
            const payload = data.payload as DirectMessageEvent;
            this.notifyDirectChatListeners(payload.conversationId, payload);
        } else if (data.type === 'global_update') {
            this.notifyGlobalListeners();
        }
    }

    private broadcast(type: string, payload: unknown) {
        if (this.broadcastChannel) {
            this.broadcastChannel.postMessage({ type, payload });
        }
    }

    // ============ BAND CHAT SUBSCRIPTIONS ============
    subscribeToBandChat(bandId: string, listener: MessageListener): () => void {
        if (!this.bandChatListeners.has(bandId)) {
            this.bandChatListeners.set(bandId, new Set());
        }
        this.bandChatListeners.get(bandId)!.add(listener);

        // Return unsubscribe function
        return () => {
            this.bandChatListeners.get(bandId)?.delete(listener);
            if (this.bandChatListeners.get(bandId)?.size === 0) {
                this.bandChatListeners.delete(bandId);
            }
        };
    }

    notifyBandChatListeners(bandId: string, event: ChatMessageEvent) {
        this.bandChatListeners.get(bandId)?.forEach(listener => {
            listener(bandId, event);
        });
    }

    // Called when a message is sent
    emitBandChatMessage(bandId: string, message: ChatMessageEvent['message']) {
        const event: ChatMessageEvent = {
            type: 'new_message',
            bandId,
            message,
        };

        // Notify local listeners
        this.notifyBandChatListeners(bandId, event);

        // Broadcast to other tabs
        this.broadcast('band_chat_message', event);

        // Notify global listeners (for unread counts, etc.)
        this.notifyGlobalListeners();
        this.broadcast('global_update', null);
    }

    // ============ DIRECT MESSAGE SUBSCRIPTIONS ============
    subscribeToDirectChat(conversationId: string, listener: ConversationListener): () => void {
        if (!this.directChatListeners.has(conversationId)) {
            this.directChatListeners.set(conversationId, new Set());
        }
        this.directChatListeners.get(conversationId)!.add(listener);

        return () => {
            this.directChatListeners.get(conversationId)?.delete(listener);
            if (this.directChatListeners.get(conversationId)?.size === 0) {
                this.directChatListeners.delete(conversationId);
            }
        };
    }

    notifyDirectChatListeners(conversationId: string, event: DirectMessageEvent) {
        this.directChatListeners.get(conversationId)?.forEach(listener => {
            listener(conversationId, event);
        });
    }

    emitDirectMessage(conversationId: string, message: DirectMessageEvent['message']) {
        const event: DirectMessageEvent = {
            type: 'new_message',
            conversationId,
            message,
        };

        this.notifyDirectChatListeners(conversationId, event);
        this.broadcast('direct_message', event);
        this.notifyGlobalListeners();
        this.broadcast('global_update', null);
    }

    // ============ GLOBAL LISTENERS (for badges, notifications) ============
    subscribeToGlobalUpdates(listener: () => void): () => void {
        this.globalListeners.add(listener);
        return () => {
            this.globalListeners.delete(listener);
        };
    }

    notifyGlobalListeners() {
        this.globalListeners.forEach(listener => listener());
    }

    // ============ POLLING ============
    startPolling(key: string, callback: () => void, intervalMs: number = 2000): () => void {
        // Clear existing interval if any
        this.stopPolling(key);

        const interval = setInterval(callback, intervalMs);
        this.pollingIntervals.set(key, interval);

        return () => this.stopPolling(key);
    }

    stopPolling(key: string) {
        const interval = this.pollingIntervals.get(key);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(key);
        }
    }

    // ============ CLEANUP ============
    destroy() {
        this.broadcastChannel?.close();
        this.pollingIntervals.forEach(interval => clearInterval(interval));
        this.pollingIntervals.clear();
        this.bandChatListeners.clear();
        this.directChatListeners.clear();
        this.globalListeners.clear();
    }
}

// Export singleton instance
export const chatService = new ChatService();
