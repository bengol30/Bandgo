import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { chatService } from '../ChatService';
import type { ChatMessageEvent, DirectMessageEvent } from '../ChatService';

describe('ChatService', () => {
  let service: typeof chatService;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../ChatService');
    service = mod.chatService;
  });

  afterEach(() => {
    service.destroy();
  });

  describe('Band Chat Subscriptions', () => {
    it('subscribes to band chat and receives messages', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribeToBandChat('band-1', listener);

      const event: ChatMessageEvent = {
        type: 'new_message',
        bandId: 'band-1',
        message: {
          id: 'msg-1',
          senderId: 'user-1',
          content: 'Hello!',
          createdAt: new Date(),
        },
      };

      service.notifyBandChatListeners('band-1', event);

      expect(listener).toHaveBeenCalledOnce();
      expect(listener).toHaveBeenCalledWith('band-1', event);

      unsubscribe();
    });

    it('does not receive messages after unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribeToBandChat('band-1', listener);
      unsubscribe();

      service.notifyBandChatListeners('band-1', {
        type: 'new_message',
        bandId: 'band-1',
      });

      expect(listener).not.toHaveBeenCalled();
    });

    it('supports multiple listeners on same band', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsub1 = service.subscribeToBandChat('band-1', listener1);
      const unsub2 = service.subscribeToBandChat('band-1', listener2);

      service.notifyBandChatListeners('band-1', {
        type: 'new_message',
        bandId: 'band-1',
      });

      expect(listener1).toHaveBeenCalledOnce();
      expect(listener2).toHaveBeenCalledOnce();

      unsub1();
      unsub2();
    });

    it('does not notify listeners of other bands', () => {
      const listener = vi.fn();
      service.subscribeToBandChat('band-1', listener);

      service.notifyBandChatListeners('band-2', {
        type: 'new_message',
        bandId: 'band-2',
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Direct Chat Subscriptions', () => {
    it('subscribes to direct chat and receives messages', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribeToDirectChat('conv-1', listener);

      const event: DirectMessageEvent = {
        type: 'new_message',
        conversationId: 'conv-1',
        message: {
          id: 'dm-1',
          senderId: 'user-2',
          content: 'Hey!',
          createdAt: new Date(),
        },
      };

      service.notifyDirectChatListeners('conv-1', event);

      expect(listener).toHaveBeenCalledOnce();
      expect(listener).toHaveBeenCalledWith('conv-1', event);

      unsubscribe();
    });

    it('cleans up listener set when last listener unsubscribes', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribeToDirectChat('conv-1', listener);
      unsubscribe();

      service.notifyDirectChatListeners('conv-1', {
        type: 'new_message',
        conversationId: 'conv-1',
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Global Listeners', () => {
    it('notifies global listeners', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribeToGlobalUpdates(listener);

      service.notifyGlobalListeners();

      expect(listener).toHaveBeenCalledOnce();

      unsubscribe();
    });

    it('does not notify after unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribeToGlobalUpdates(listener);
      unsubscribe();

      service.notifyGlobalListeners();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('emitBandChatMessage', () => {
    it('notifies local listeners and global listeners', () => {
      const bandListener = vi.fn();
      const globalListener = vi.fn();

      service.subscribeToBandChat('band-1', bandListener);
      service.subscribeToGlobalUpdates(globalListener);

      service.emitBandChatMessage('band-1', {
        id: 'msg-1',
        senderId: 'user-1',
        content: 'Test message',
        createdAt: new Date(),
      });

      expect(bandListener).toHaveBeenCalledOnce();
      expect(globalListener).toHaveBeenCalledOnce();

      const event = bandListener.mock.calls[0][1] as ChatMessageEvent;
      expect(event.type).toBe('new_message');
      expect(event.bandId).toBe('band-1');
      expect(event.message?.content).toBe('Test message');
    });
  });

  describe('emitDirectMessage', () => {
    it('notifies direct listeners and global listeners', () => {
      const directListener = vi.fn();
      const globalListener = vi.fn();

      service.subscribeToDirectChat('conv-1', directListener);
      service.subscribeToGlobalUpdates(globalListener);

      service.emitDirectMessage('conv-1', {
        id: 'dm-1',
        senderId: 'user-2',
        content: 'Direct test',
        createdAt: new Date(),
      });

      expect(directListener).toHaveBeenCalledOnce();
      expect(globalListener).toHaveBeenCalledOnce();

      const event = directListener.mock.calls[0][1] as DirectMessageEvent;
      expect(event.type).toBe('new_message');
      expect(event.conversationId).toBe('conv-1');
      expect(event.message?.content).toBe('Direct test');
    });
  });

  describe('Polling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('starts polling at given interval', () => {
      const callback = vi.fn();
      service.startPolling('test-key', callback, 1000);

      vi.advanceTimersByTime(3000);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('stops polling when stop is called', () => {
      const callback = vi.fn();
      const stop = service.startPolling('test-key', callback, 1000);

      vi.advanceTimersByTime(2000);
      expect(callback).toHaveBeenCalledTimes(2);

      stop();

      vi.advanceTimersByTime(3000);
      expect(callback).toHaveBeenCalledTimes(2); // No more calls
    });

    it('replaces existing polling with same key', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      service.startPolling('same-key', callback1, 1000);
      service.startPolling('same-key', callback2, 1000);

      vi.advanceTimersByTime(2000);

      // Only callback2 should be called (callback1's interval was cleared)
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(2);
    });
  });

  describe('destroy', () => {
    it('cleans up all resources', () => {
      vi.useFakeTimers();

      const bandListener = vi.fn();
      const directListener = vi.fn();
      const globalListener = vi.fn();
      const pollCallback = vi.fn();

      service.subscribeToBandChat('band-1', bandListener);
      service.subscribeToDirectChat('conv-1', directListener);
      service.subscribeToGlobalUpdates(globalListener);
      service.startPolling('key', pollCallback, 1000);

      service.destroy();

      vi.advanceTimersByTime(5000);
      service.notifyBandChatListeners('band-1', { type: 'new_message', bandId: 'band-1' });
      service.notifyDirectChatListeners('conv-1', { type: 'new_message', conversationId: 'conv-1' });
      service.notifyGlobalListeners();

      expect(bandListener).not.toHaveBeenCalled();
      expect(directListener).not.toHaveBeenCalled();
      expect(globalListener).not.toHaveBeenCalled();
      expect(pollCallback).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });
});
