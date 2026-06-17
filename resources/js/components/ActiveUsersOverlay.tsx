import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@particle-academy/react-fancy";
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

const RISE_MS = 4200; // total time a pill is on screen (rise + fade, matches the CSS)
const SPACING_MS = 1000; // ≥1s between pills so a burst streams in rather than piling up

// Latest activity_at (epoch ms) we've already animated, per row id. Persisted
// as a module singleton (survives Inertia navigations within the SPA) AND in
// sessionStorage (survives a hard refresh) — so a row only animates once per
// NEW activity. Without this, every page visit / refresh re-mounts the overlay
// with empty state and re-plays the whole active roster (most visibly the
// simulated fakes, which linger briefly).
const SEEN_KEY = "fancy:active-users:seen";
let seenStore: Record<string, number> | null = null;
function seenMap(): Record<string, number> {
    if (seenStore) return seenStore;
    try {
        seenStore = JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "{}") as Record<string, number>;
    } catch {
        seenStore = {};
    }
    return seenStore;
}
function markSeen(key: string, at: number): void {
    const s = seenMap();
    s[key] = at;
    try {
        sessionStorage.setItem(SEEN_KEY, JSON.stringify(s));
    } catch {
        /* storage unavailable (private mode / SSR) — module singleton still dedupes */
    }
}

type Pill = { key: number; row: ActiveUserRow };

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

/** Short, human label for what the activity was. */
function actionLabel(row: ActiveUserRow): string {
    if (row.activity_label) return row.activity_label;
    if (row.is_achievement) return "unlocked an achievement";
    if (row.is_xp) return "earned XP";
    return row.activity_type ?? "is active";
}

/**
 * Live "active users" stream. Each new activity posts a pill — the user's avatar
 * plus what they just did (an action, an XP gain, or an achievement/award) — that
 * rises up from just above the Fancy Pixel (bottom-right) and fades as it climbs.
 * A burst streams in ≥1s apart, stacking upward. XP / achievement activity tints
 * the pill and pulses the avatar's glow.
 *
 * The overlay owns its animation state; the Echo subscription + REST poll only
 * feed it events. It stays inert until a real Echo client is wired into
 * FancyDataRoot (useFancyStream no-ops with a null Echo); the poll is the
 * reliable delivery path regardless of WebSocket / TLS / queue state.
 */
export function ActiveUsersOverlay() {
    const [pills, setPills] = useState<Pill[]>([]);

    const queueRef = useRef<ActiveUserRow[]>([]);
    const drainTimerRef = useRef<number | null>(null);
    const lastReleaseRef = useRef<number>(0);
    const idRef = useRef<number>(0);
    const removeTimersRef = useRef<Set<number>>(new Set());

    const removePill = useCallback((key: number) => {
        setPills((prev) => prev.filter((p) => p.key !== key));
    }, []);

    const drain = useCallback(() => {
        drainTimerRef.current = null;
        const row = queueRef.current.shift();
        if (row) {
            lastReleaseRef.current = Date.now();
            const key = ++idRef.current;
            setPills((prev) => [...prev, { key, row }]);
            // Remove on a timer (not animationend — the avatar's infinite glow
            // animation would otherwise never fire it, and reduced-motion has no
            // animation at all).
            const t = window.setTimeout(() => {
                removeTimersRef.current.delete(t);
                removePill(key);
            }, RISE_MS);
            removeTimersRef.current.add(t);
        }
        if (queueRef.current.length > 0) {
            drainTimerRef.current = window.setTimeout(drain, SPACING_MS);
        }
    }, [removePill]);

    const requestDrain = useCallback(() => {
        if (drainTimerRef.current != null) return;
        const wait = Math.max(0, lastReleaseRef.current + SPACING_MS - Date.now());
        drainTimerRef.current = window.setTimeout(drain, wait);
    }, [drain]);

    const ingest = useCallback(
        (row: ActiveUserRow) => {
            const key = String(row.id);
            // Dedupe across the WS push + the HTTP poll + remounts: only post a
            // pill when this row's activity is newer than what we last showed.
            const at = row.activity_at ? Date.parse(row.activity_at) : Date.now();
            if (at <= (seenMap()[key] ?? 0)) return;
            markSeen(key, at);
            // Collapse a same-user burst already waiting in the queue to its latest.
            const pending = queueRef.current.findIndex((r) => String(r.id) === key);
            if (pending >= 0) queueRef.current[pending] = row;
            else queueRef.current.push(row);
            requestDrain();
        },
        [requestDrain],
    );

    // Subscribe to the live channel; events feed `ingest`.
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

    // Reliable path: poll the REST endpoint (works regardless of WebSocket / TLS
    // / queue state). Oldest activity first so a burst streams in chronologically.
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
                rows.slice()
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

    // Cleanup every pending timer on unmount.
    useEffect(() => {
        const timers = removeTimersRef.current;
        return () => {
            timers.forEach((id) => window.clearTimeout(id));
            timers.clear();
            if (drainTimerRef.current != null) window.clearTimeout(drainTimerRef.current);
        };
    }, []);

    if (pills.length === 0) return null;

    return (
        <div className="active-users-stream" aria-live="polite">
            {pills.map(({ key, row }) => {
                const glow = glowFor(row);
                return (
                    <div key={key} className="active-user-pill" data-glow={glow || undefined}>
                        <Avatar
                            src={row.avatar_url ?? undefined}
                            alt={row.name}
                            fallback={initials(row.name)}
                            size="sm"
                            glow={glow}
                        />
                        <span className="active-user-pill-body">
                            <span className="active-user-pill-name">{row.name}</span>
                            <span className="active-user-pill-action">{actionLabel(row)}</span>
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
