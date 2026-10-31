/**
 * A WebSocket double that speaks just enough to be driven from a test.
 *
 * It records the URL it was opened with and every frame the client sends, and
 * lets the test play the server's side of the Pusher protocol. Supports BOTH
 * `addEventListener` and the `on*` properties, so it serves any Pusher-protocol
 * client, not only the one the showcase happens to use today.
 */
export class FakeWebSocket {
    static instances: FakeWebSocket[] = [];

    static reset(): void {
        FakeWebSocket.instances = [];
    }

    static latest(): FakeWebSocket | undefined {
        return FakeWebSocket.instances.at(-1);
    }

    readyState = 0;
    sent: Array<{ event: string; data: Record<string, unknown> }> = [];
    onopen: ((event: Event) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    private listeners = new Map<string, Set<(event: Event) => void>>();

    constructor(readonly url: string) {
        FakeWebSocket.instances.push(this);
    }

    addEventListener(type: string, listener: (event: Event) => void): void {
        const set = this.listeners.get(type) ?? new Set();
        set.add(listener);
        this.listeners.set(type, set);
    }

    removeEventListener(type: string, listener: (event: Event) => void): void {
        this.listeners.get(type)?.delete(listener);
    }

    send(frame: string): void {
        this.sent.push(JSON.parse(frame));
    }

    close(): void {
        this.readyState = 3;
    }

    /** Server side: open the socket and complete the Pusher handshake. */
    establish(socketId = "1234.5678"): void {
        this.readyState = 1;
        this.emit("open", new Event("open"));
        this.receive({
            event: "pusher:connection_established",
            data: JSON.stringify({ socket_id: socketId, activity_timeout: 120 }),
        });
    }

    /** Server side: deliver one protocol frame. */
    receive(frame: Record<string, unknown>): void {
        this.emit("message", new MessageEvent("message", { data: JSON.stringify(frame) }));
    }

    private emit(type: string, event: Event): void {
        const property = (this as unknown as Record<string, unknown>)[`on${type}`];
        if (typeof property === "function") {
            (property as (event: Event) => void).call(this, event);
        }
        for (const listener of [...(this.listeners.get(type) ?? [])]) {
            listener.call(this, event);
        }
    }
}
