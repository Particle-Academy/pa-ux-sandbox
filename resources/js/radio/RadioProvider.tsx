import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { StreamingAudioValue } from "@particle-academy/react-fancy";
import { RadioPanel } from "./RadioPanel";
import { DEFAULT_STATION_ID, findStation, nowPlayingFrom, RADIO_PREFS_KEY, readPrefs, RIVERWEST_STATUS_URL } from "./stations";

/** How often the live station's now-playing is asked for while it is shown. */
export const NOW_PLAYING_POLL_MS = 30_000;

type RadioContextValue = {
    open: boolean;
    setOpen: (open: boolean) => void;
    toggle: () => void;
    value: StreamingAudioValue;
    setValue: (next: StreamingAudioValue) => void;
    nowPlaying: string | undefined;
};

const RadioContext = createContext<RadioContextValue | null>(null);

export function useRadio(): RadioContextValue | null {
    return useContext(RadioContext);
}

/** Never playing on load: the server render and the first client render agree. */
const INITIAL: StreamingAudioValue = { stationId: DEFAULT_STATION_ID, playing: false, volume: 0.8, muted: false };

/**
 * The showcase radio, mounted ONCE in the app-level provider tree
 * (showcase-app.tsx and ssr.tsx), outside every Inertia page. Pages come and go
 * under it, so the <audio> element inside the panel survives navigation and
 * playback carries on. The panel is always mounted and only hidden when closed:
 * react-fancy's Drawer unmounts its children on close, which would stop the
 * audio, so the panel is built from the kit's Card instead.
 *
 * The chosen station and the volume persist in localStorage. Playing never
 * does: nothing plays until the person presses play.
 */
export function RadioProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const [value, setValueState] = useState<StreamingAudioValue>(INITIAL);
    const [nowPlaying, setNowPlaying] = useState<string | undefined>(undefined);
    const [restored, setRestored] = useState(false);

    // Restore after mount, never during render, so SSR markup matches.
    useEffect(() => {
        let raw: string | null = null;
        try {
            raw = window.localStorage.getItem(RADIO_PREFS_KEY);
        } catch {
            raw = null;
        }
        const prefs = readPrefs(raw);
        setValueState((v) => ({ ...v, stationId: prefs.stationId, volume: prefs.volume, playing: false }));
        setRestored(true);
    }, []);

    useEffect(() => {
        if (!restored || value.stationId === null) {
            return;
        }
        try {
            window.localStorage.setItem(RADIO_PREFS_KEY, JSON.stringify({ stationId: value.stationId, volume: value.volume }));
        } catch {
            // Storage refused (private mode, quota): the choice simply is not remembered.
        }
    }, [restored, value.stationId, value.volume]);

    const station = findStation(value.stationId);
    const listenUrl = station?.listenUrl;

    // Poll Icecast only while a live station is selected AND the drawer is open.
    useEffect(() => {
        if (!open || !listenUrl) {
            setNowPlaying(undefined);
            return;
        }
        const controller = new AbortController();
        const poll = () => {
            fetch(RIVERWEST_STATUS_URL, { signal: controller.signal, cache: "no-store" })
                .then((r) => (r.ok ? r.json() : null))
                .then((status) => setNowPlaying(status ? nowPlayingFrom(status, listenUrl) : undefined))
                .catch(() => {
                    if (!controller.signal.aborted) {
                        setNowPlaying(undefined);
                    }
                });
        };
        poll();
        const timer = window.setInterval(poll, NOW_PLAYING_POLL_MS);
        return () => {
            controller.abort();
            window.clearInterval(timer);
        };
    }, [open, listenUrl]);

    const setValue = useCallback((next: StreamingAudioValue) => setValueState(next), []);
    const toggle = useCallback(() => setOpen((o) => !o), []);

    const ctx = useMemo<RadioContextValue>(
        () => ({ open, setOpen, toggle, value, setValue, nowPlaying }),
        [open, toggle, value, setValue, nowPlaying],
    );

    return (
        <RadioContext.Provider value={ctx}>
            {children}
            <RadioPanel />
        </RadioContext.Provider>
    );
}
