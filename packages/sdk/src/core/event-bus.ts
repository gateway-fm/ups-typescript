type Callback<T = any> = (payload: T) => void;
type Unsubscribe = () => void;

export class EventBus {
    private listeners: Map<string, Set<Callback>> = new Map();

    emit<T>(event: string, payload: T): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach((callback) => {
                try {
                    callback(payload);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    on<T>(event: string, callback: Callback<T>): Unsubscribe {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);

        return () => this.off(event, callback);
    }

    once<T>(event: string, callback: Callback<T>): Unsubscribe {
        const unsubscribe = this.on<T>(event, (payload) => {
            unsubscribe();
            callback(payload);
        });
        return unsubscribe;
    }

    off(event: string, callback: Callback): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    clear(): void {
        this.listeners.clear();
    }
}
