import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '../src/core/event-bus';

describe('EventBus', () => {
    let bus: EventBus;

    beforeEach(() => {
        bus = new EventBus();
    });

    it('should emit events to subscribers', () => {
        const spy = vi.fn();
        bus.on('auth:changed', spy);
        bus.emit('auth:changed', { isAuthenticated: true });
        expect(spy).toHaveBeenCalledWith({ isAuthenticated: true });
    });

    it('should support multiple subscribers for same event', () => {
        const spy1 = vi.fn();
        const spy2 = vi.fn();
        bus.on('test-event', spy1);
        bus.on('test-event', spy2);
        bus.emit('test-event', 'data');
        expect(spy1).toHaveBeenCalledWith('data');
        expect(spy2).toHaveBeenCalledWith('data');
    });

    it('should unsubscribe correctly', () => {
        const spy = vi.fn();
        const unsubscribe = bus.on('test-event', spy);
        unsubscribe();
        bus.emit('test-event', 'data');
        expect(spy).not.toHaveBeenCalled();
    });

    it('should handle once() for one-time subscriptions', () => {
        const spy = vi.fn();
        bus.once('test-event', spy);
        bus.emit('test-event', 'data');
        bus.emit('test-event', 'data');
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should clear all listeners on clear()', () => {
        const spy = vi.fn();
        bus.on('test-event', spy);
        bus.clear();
        bus.emit('test-event', 'data');
        expect(spy).not.toHaveBeenCalled();
    });
});
