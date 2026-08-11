import { useRef, useState } from "react";
import { Avatar, Badge, Button, Card, Heading, Text } from "@particle-academy/react-fancy";
import { FancyDataRoot, useFancyStream } from "@particle-academy/fancy-query";

/**
 * Realtime Chat — the streaming face of @particle-academy/fancy-query.
 *
 * This is the chat pattern fancy-query's `useFancyStream` exists for: Echo
 * channel events are mapped onto `setQueryData` reducers so the cache is
 * patched IN PLACE — append the user's message, stream the assistant's reply
 * token-by-token, reconcile on completion — without the invalidate-and-refetch
 * that would drop optimistic / in-flight state.
 *
 * The hook wiring (FancyDataRoot + useFancyStream + the `on` reducer map) is
 * exactly what you'd write against a real Laravel Echo + Reverb backend. The
 * only stand-in is `makeChatServer()` below: an in-memory object that quacks
 * like Echo and simulates a streaming assistant, so this kit runs anywhere
 * with no server. Swap it for `window.Echo` and a `/history` endpoint and the
 * component is unchanged.
 */

type Role = "user" | "assistant";
type Message = { id: string; role: Role; text: string; streaming?: boolean; pending?: boolean };

const SEED: Message[] = [
    { id: "m0", role: "assistant", text: "Hey! Ask me anything — I'll stream the answer back token by token." },
];

const REPLIES = [
    "Great question. `useFancyStream` maps each Echo event to a reducer, so I render as the tokens arrive — no refetch, no flicker.",
    "Under the hood your message was appended optimistically, then reconciled by id when the server echoed it back. Zero duplicates.",
    "Because the cache is patched in place, your scroll position and any half-typed draft survive the whole exchange.",
    "A poll fallback re-fetches authoritative history if a broadcast is ever missed — resilience without hand-rolled socket state.",
];

let replyCursor = 0;

// ---------------------------------------------------------------------------
// Stand-in "server": an EchoLike emitter + a simulated streaming assistant.
// Everything here is what a real Laravel Echo + Reverb backend would provide.
// ---------------------------------------------------------------------------

type Listener = (payload: unknown) => void;

function makeChatServer() {
    const listeners = new Map<string, Set<Listener>>();
    // The authoritative history — what `fetchInitial` (and the poll fallback)
    // read. Kept in sync as the assistant streams, exactly like a DB would be.
    const serverLog: Message[] = [...SEED];

    const channel = {
        listen(event: string, cb: Listener) {
            (listeners.get(event) ?? listeners.set(event, new Set()).get(event)!).add(cb);
            return channel;
        },
        stopListening(event: string, cb?: Listener) {
            if (cb) listeners.get(event)?.delete(cb);
            else listeners.delete(event);
            return channel;
        },
    };

    const echo = {
        channel: () => channel,
        private: () => channel,
        join: () => channel,
        leave: () => {},
    };

    const emit = (event: string, payload: unknown) =>
        listeners.get(event)?.forEach((cb) => cb(payload));

    /** Persist + broadcast the user's message, then stream a reply. */
    function send(text: string, clientId: string) {
        const userMsg: Message = { id: clientId, role: "user", text };
        serverLog.push(userMsg);
        // Echo the persisted message back (the client dedupes by id).
        emit("post.created", { post: userMsg });
        streamReply();
    }

    function streamReply() {
        const id = `a${Math.random().toString(36).slice(2, 8)}`;
        const full = REPLIES[replyCursor++ % REPLIES.length];
        const tokens = full.match(/\S+\s*/g) ?? [full];

        const placeholder: Message = { id, role: "assistant", text: "", streaming: true };
        serverLog.push(placeholder);
        emit("stream.started", { id });

        let i = 0;
        const tick = () => {
            if (i < tokens.length) {
                const delta = tokens[i++];
                placeholder.text += delta;
                emit("post.delta", { id, delta });
                window.setTimeout(tick, 55);
            } else {
                placeholder.streaming = false;
                emit("stream.completed", { id, text: full });
            }
        };
        window.setTimeout(tick, 260);
    }

    function fetchInitial(): Promise<Message[]> {
        // Simulated network round-trip; returns current authoritative history.
        return new Promise((res) => window.setTimeout(() => res(serverLog.slice()), 220));
    }

    return { echo, send, fetchInitial };
}

// ---------------------------------------------------------------------------
// Reducers — append/patch the cache in place. These are the heart of the kit.
// ---------------------------------------------------------------------------

const upsertById = (cache: Message[], msg: Message): Message[] => {
    const i = cache.findIndex((m) => m.id === msg.id);
    if (i === -1) return [...cache, msg];
    const next = cache.slice();
    next[i] = { ...next[i], ...msg };
    return next;
};

// ---------------------------------------------------------------------------
// The chat surface. Lives under <FancyDataRoot> so it sees the QueryClient +
// the (stand-in) Echo client.
// ---------------------------------------------------------------------------

function ChatRoom({ server }: { server: ReturnType<typeof makeChatServer> }) {
    const [draft, setDraft] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const { data, isStreaming, isLoading, append } = useFancyStream<Message[]>(["chat", "demo"], {
        channel: "chat.demo",
        fetchInitial: server.fetchInitial,
        on: {
            // The user's own message, echoed by the server → reconcile by id.
            "post.created": (cache, e: any) => upsertById(cache ?? [], e.post),
            // Assistant placeholder appears, then fills token by token, then settles.
            "stream.started": (cache, e: any) =>
                upsertById(cache ?? [], { id: e.id, role: "assistant", text: "", streaming: true }),
            "post.delta": (cache, e: any) =>
                (cache ?? []).map((m) => (m.id === e.id ? { ...m, text: m.text + e.delta } : m)),
            "stream.completed": (cache, e: any) =>
                (cache ?? []).map((m) => (m.id === e.id ? { ...m, text: e.text ?? m.text, streaming: false } : m)),
        },
        // Recover any broadcast missed while the socket was down. Safe: the
        // server's history is authoritative, so a refetch only reconciles.
        poll: { while: "streaming", intervalMs: 5000 },
    });

    const messages = data ?? [];

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = draft.trim();
        if (!text || isStreaming) return;
        const clientId = `u${Math.random().toString(36).slice(2, 8)}`;
        // 1. Optimistic: show it immediately, before the server echoes it back.
        append({ id: clientId, role: "user", text, pending: true });
        setDraft("");
        // 2. Hand off to the "server" (→ post.created + streamed reply).
        server.send(text, clientId);
        requestAnimationFrame(() =>
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }),
        );
    };

    return (
        <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    <Heading as="h3" size="sm">Support chat</Heading>
                    <Badge color="emerald" size="sm">
                        <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-emerald-500 align-middle" />
                        live
                    </Badge>
                </div>
                <Text size="xs" className="!font-mono !text-zinc-400">useFancyStream</Text>
            </div>

            <div ref={scrollRef} className="h-[340px] space-y-3 overflow-y-auto bg-zinc-50 px-4 py-4 dark:bg-zinc-950">
                {isLoading ? (
                    <Text size="sm" className="!text-zinc-400">Loading history…</Text>
                ) : (
                    messages.map((m) => <Bubble key={m.id} msg={m} />)
                )}
                {isStreaming && (
                    <Text size="xs" className="!text-zinc-400">assistant is typing…</Text>
                )}
            </div>

            <form onSubmit={submit} className="flex items-center gap-2 border-t border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
                <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={isStreaming ? "Waiting for the reply to finish…" : "Type a message…"}
                    disabled={isStreaming}
                    className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <Button type="submit" color="violet" size="sm" disabled={isStreaming || !draft.trim()}>
                    Send
                </Button>
            </form>
        </Card>
    );
}

function Bubble({ msg }: { msg: Message }) {
    const isUser = msg.role === "user";
    return (
        <div className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
            <Avatar size="sm" fallback={isUser ? "You" : "AI"} alt={isUser ? "You" : "AI"} />
            <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    isUser
                        ? "rounded-tr-sm bg-violet-600 text-white"
                        : "rounded-tl-sm bg-white text-zinc-800 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800"
                } ${msg.pending ? "opacity-70" : ""}`}
            >
                {msg.text}
                {msg.streaming && (
                    <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-current align-text-bottom" />
                )}
            </div>
        </div>
    );
}

export function RealtimeChatKit() {
    // One server instance per mount; survives re-renders.
    const [server] = useState(makeChatServer);
    return (
        <div className="space-y-3">
            <FancyDataRoot echo={server.echo}>
                <ChatRoom server={server} />
            </FancyDataRoot>
            <Text size="xs" className="!text-zinc-500">
                Real <code className="font-mono">useFancyStream</code> wiring — Echo events → <code className="font-mono">setQueryData</code> reducers
                (append / patch / reconcile), optimistic <code className="font-mono">append()</code>, <code className="font-mono">isStreaming</code>, and a poll
                fallback. The streaming backend is stubbed in-file; swap it for <code className="font-mono">window.Echo</code> + a history endpoint and this component is unchanged.
            </Text>
        </div>
    );
}
