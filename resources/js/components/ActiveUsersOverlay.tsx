import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, Tooltip } from "@particle-academy/react-fancy";
import { useFancyStream } from "@particle-academy/fancy-query";

/** A live ActiveUser row (matches the backend ActiveUserResource payload). */
export type ActiveUserRow = {
    id: number | string;
    user_id: number | null;
    name: string;
    avatar_url: string | null;
    activity_type: string | null;
    activity_label: string | null;
    activity_at: string | null;
    is_xp: boolean;
    is_achievement: boolean;
    last_active_at: string | null;
    is_fake: boolean;
};

type Phase = "enter" | "hold" | "exit";
type Slot = { row: ActiveUserRow; version: number; phase: Phase };

const HOLD_MS = 1000; // hold fully visible
const EXIT_MS = 1200; // slow slide-left + fade
const SPACING_MS = 1000; // ≥1s between distinct users

function initials(name: string): string {
    return name
        .split(/\s+/)
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function glowFor(row: ActiveUserRow): "xp" | "achievement" | false {
    return row.is_xp ? "xp" : row.is_achievement ? "achievement" : false;
}

/**
 * Live "active users" overlay. Each time a user acts, their avatar enters at the
 * right, holds 1s, then slowly slides left + fades. A new action by the same
 * user RESETS in place immediately (no waiting for the fade). Distinct users
 * stack via a queue ≥1s apart. XP / achievement activity adds a pulsing glow.
 *
 * The overlay keeps its own animation state; the Echo subscription only feeds it
 * events. It stays inert until a real Echo client is wired into FancyDataRoot
 * (useFancyStream no-ops with a null Echo).
 */
export function ActiveUsersOverlay() {
    const [slots, setSlots] = useState<Map<string, Slot>>(() => new Map());

    // Mutable, non-render state.
    const timersRef = useRef<Map<string, number[]>>(new Map());
    const queueRef = useRef<ActiveUserRow[]>([]);
    const lastReleaseRef = useRef<number>(0);
    const drainTimerRef = useRef<number | null>(null);
    // Latest activity_at (epoch ms) seen per row — dedupes the WS push and the
    // HTTP poll so a row only animates once per new activity.
    const seenRef = useRef<Map<string, number>>(new Map());

    const clearTimers = useCallback((key: string) => {
        const t = timersRef.current.get(key);
        if (t) t.forEach((id) => window.clearTimeout(id));
        timersRef.current.delete(key);
    }, []);

    const removeSlot = useCallback(
        (key: string) => {
            clearTimers(key);
            setSlots((prev) => {
                if (!prev.has(key)) return prev;
                const next = new Map(prev);
                next.delete(key);
                return next;
            });
        },
        [clearTimers],
    );

    const armTimers = useCallback(
        (key: string) => {
            clearTimers(key);
            const tHold = window.setTimeout(() => {
                setSlots((prev) => {
                    const slot = prev.get(key);
                    if (!slot) return prev;
                    const next = new Map(prev);
                    next.set(key, { ...slot, phase: "exit" });
                    return next;
                });
            }, HOLD_MS);
            const tExit = window.setTimeout(() => removeSlot(key), HOLD_MS + EXIT_MS);
            timersRef.current.set(key, [tHold, tExit]);
        },
        [clearTimers, removeSlot],
    );

    const drain = useCallback(() => {
        drainTimerRef.current = null;
        const row = queueRef.current.shift();
        if (!row) return;
        const key = String(row.id);
        // Raced a reset — this user already has a live slot; skip + keep draining.
        if (!timersRef.current.has(key)) {
            lastReleaseRef.current = Date.now();
            setSlots((prev) => {
                const next = new Map(prev);
                next.set(key, { row, version: 0, phase: "enter" });
                return next;
            });
            armTimers(key);
        }
        if (queueRef.current.length > 0) {
            drainTimerRef.current = window.setTimeout(drain, SPACING_MS);
        }
    }, [armTimers]);

    const requestDrain = useCallback(() => {
        if (drainTimerRef.current != null) return;
        const wait = Math.max(0, lastReleaseRef.current + SPACING_MS - Date.now());
        drainTimerRef.current = window.setTimeout(drain, wait);
    }, [drain]);

    const ingest = useCallback(
        (row: ActiveUserRow) => {
            const key = String(row.id);
            // Dedupe across the WS push + the HTTP poll: only animate when this
            // row's activity is newer than what we last showed for it.
            const at = row.activity_at ? Date.parse(row.activity_at) : Date.now();
            const seen = seenRef.current.get(key) ?? 0;
            if (at <= seen) return;
            seenRef.current.set(key, at);
            // Same user already on screen → reset in place (bump version → remount →
            // restart entrance), bypassing the queue.
            if (timersRef.current.has(key)) {
                setSlots((prev) => {
                    const slot = prev.get(key);
                    if (!slot) return prev;
                    const next = new Map(prev);
                    next.set(key, { row, version: slot.version + 1, phase: "enter" });
                    return next;
                });
                armTimers(key);
                return;
            }
            // New user → queue (dedupe: replace any pending entry for this user).
            const pending = queueRef.current.findIndex((r) => String(r.id) === key);
            if (pending >= 0) queueRef.current[pending] = row;
            else queueRef.current.push(row);
            requestDrain();
        },
        [armTimers, requestDrain],
    );

    // Subscribe to the live channel; events feed `ingest`. No cache reducer — the
    // overlay renders from its own `slots` state.
    useFancyStream<ActiveUserRow[]>(["active-users"], {
        channel: "active-users",
        fetchInitial: async () => [],
        events: ["active-user.updated"],
        onEvent: (event, payload) => {
            if (event === "active-user.updated") ingest(payload as ActiveUserRow);
        },
        streaming: false,
        flushSync: true,
    });

    // Reliable path: poll the REST endpoint (works regardless of WebSocket /
    // TLS / queue state). Each poll feeds rows through `ingest`, which dedupes
    // by activity time — so this surfaces the current user, simulated fakes, and
    // other real users even when the WS push never connects. The first poll runs
    // immediately so the user sees their own avatar on load.
    const ingestRef = useRef(ingest);
    ingestRef.current = ingest;
    useEffect(() => {
        let alive = true;
        const poll = async () => {
            try {
                const res = await fetch("/active-users", { headers: { Accept: "application/json" } });
                if (!res.ok) return;
                const body = await res.json();
                const rows: ActiveUserRow[] = Array.isArray(body) ? body : (body.data ?? []);
                if (!alive) return;
                // Oldest activity first so they queue in chronological order.
                rows
                    .slice()
                    .sort((a, b) => (a.activity_at ?? "").localeCompare(b.activity_at ?? ""))
                    .forEach((r) => ingestRef.current(r));
            } catch {
                /* offline / transient — next tick retries */
            }
        };
        void poll();
        const id = window.setInterval(poll, 3000);
        return () => {
            alive = false;
            window.clearInterval(id);
        };
    }, []);

    // Cleanup every timer on unmount.
    useEffect(() => {
        const timers = timersRef.current;
        return () => {
            timers.forEach((ids) => ids.forEach((id) => window.clearTimeout(id)));
            timers.clear();
            if (drainTimerRef.current != null) window.clearTimeout(drainTimerRef.current);
        };
    }, []);

    if (slots.size === 0) return null;

    return (
        <div className="active-users-overlay" aria-live="polite">
            {[...slots.values()].map(({ row, version, phase }) => (
                <div
                    key={`${row.id}:${version}`}
                    className="active-user-avatar"
                    data-phase={phase}
                    style={{ pointerEvents: "auto" }}
                >
                    <Tooltip content={row.activity_label ?? row.name}>
                        <span>
                            <Avatar
                                src={row.avatar_url ?? undefined}
                                alt={row.name}
                                fallback={initials(row.name)}
                                size="sm"
                                glow={glowFor(row)}
                            />
                        </span>
                    </Tooltip>
                </div>
            ))}
        </div>
    );
}
