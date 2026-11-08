import type { StreamingStation } from "@particle-academy/react-fancy";

/*
 * The showcase radio's stations: Riverwest Radio live (owner's choice), and
 * three Thunder in the Garden tracks this server hosts (owner-approved for
 * public streaming, 2026-11-08). Content source: sandbox/radio/STATIONS.md.
 *
 * Every station carries its own artwork: a 512 webp, a 1024 webp for 2x, and
 * jpg fallbacks at both sizes. Riverwest's 1024x555 logo is letterboxed onto
 * a white square with PHP GD. Track files are served by RadioAudioController
 * (`/radio/{slug}.mp3`, Range-capable); RadioTest checks every `src` here
 * against it and every cover against public/radio.
 */

export type RadioCover = { webp: string; webp2x: string; jpg: string; jpg2x: string };

export type RadioStation = StreamingStation & {
    cover: RadioCover;
    /** Icecast's `listenurl` for this mount, matched against status-json.xsl. */
    listenUrl?: string;
    /** The station's own site, linked from the drawer. */
    site?: { href: string; label: string };
};

const cover = (name: string): RadioCover => ({
    webp: `/radio/${name}-512.webp`,
    webp2x: `/radio/${name}-1024.webp`,
    jpg: `/radio/${name}-512.jpg`,
    jpg2x: `/radio/${name}-1024.jpg`,
});

const RIVERWEST = cover("riverwest-radio");
const THUNDER = cover("thunder-in-the-garden");

/** Icecast status for both Riverwest mounts. CORS: `Access-Control-Allow-Origin: *`. */
export const RIVERWEST_STATUS_URL = "https://radio.computer:8443/status-json.xsl";

const riverwestSite = { href: "https://www.riverwestradio.com", label: "riverwestradio.com" };

export const RADIO_STATIONS: RadioStation[] = [
    {
        id: "riverwest",
        name: "Riverwest Radio",
        src: "https://radio.computer:8443/riverwestradio",
        kind: "live",
        description: "WXRW-LP 104.1 FM, Milwaukee",
        genre: "128 kbps",
        artwork: RIVERWEST.webp,
        cover: RIVERWEST,
        listenUrl: "https://radio.computer:8443/riverwestradio",
        site: riverwestSite,
    },
    {
        id: "riverwest-hq",
        name: "Riverwest Radio HQ",
        src: "https://radio.computer:8443/riverwestradio-hq",
        kind: "live",
        description: "WXRW-LP 104.1 FM, Milwaukee",
        genre: "256 kbps",
        artwork: RIVERWEST.webp,
        cover: RIVERWEST,
        listenUrl: "https://radio.computer:8443/riverwestradio-hq",
        site: riverwestSite,
    },
    {
        id: "no-second-life",
        name: "No Second Life",
        src: "/radio/no-second-life.mp3",
        kind: "file",
        description: "Thunder in the Garden",
        artwork: THUNDER.webp,
        cover: THUNDER,
    },
    {
        id: "locked-on",
        name: "Locked On",
        src: "/radio/locked-on.mp3",
        kind: "file",
        description: "Thunder in the Garden",
        artwork: THUNDER.webp,
        cover: THUNDER,
    },
    {
        id: "run-it-back",
        name: "Run it Back",
        src: "/radio/run-it-back.mp3",
        kind: "file",
        description: "Thunder in the Garden",
        artwork: THUNDER.webp,
        cover: THUNDER,
    },
];

export const DEFAULT_STATION_ID = "riverwest";

export function findStation(id: string | null | undefined): RadioStation | undefined {
    return RADIO_STATIONS.find((s) => s.id === id);
}

type IcecastSource = { listenurl?: unknown; title?: unknown; artist?: unknown };

/**
 * What is on air for `listenUrl`, from Icecast's status-json.xsl. `source` is
 * an object when the server has one mount and an array when it has several.
 *
 * The match is on `listenurl`'s MOUNT (its path), not the whole URL: Icecast
 * reports its own internal address (Riverwest's status says
 * `http://radio.computer:8000/riverwestradio`, measured 2026-11-07) while
 * listeners play the public `https://radio.computer:8443/riverwestradio`.
 * Undefined when the mount is not listed or sends no title.
 */
export function nowPlayingFrom(status: unknown, listenUrl: string): string | undefined {
    const raw = (status as { icestats?: { source?: IcecastSource | IcecastSource[] } } | null)?.icestats?.source;
    const sources = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const mount = (u: string) => {
        try {
            return new URL(u.trim()).pathname.replace(/\/+$/, "").toLowerCase();
        } catch {
            return u.trim().replace(/\/+$/, "").toLowerCase();
        }
    };
    const match = sources.find((s) => typeof s.listenurl === "string" && mount(s.listenurl) === mount(listenUrl));
    if (!match) {
        return undefined;
    }
    const title = typeof match.title === "string" ? match.title.trim() : "";
    const artist = typeof match.artist === "string" ? match.artist.trim() : "";
    if (title === "") {
        return undefined;
    }
    return artist !== "" && !title.includes(artist) ? `${artist} - ${title}` : title;
}

/** What survives a reload: the chosen station and the volume. Never "playing". */
export type RadioPrefs = { stationId: string; volume: number };

export const RADIO_PREFS_KEY = "fancy:radio:v1";

export function readPrefs(raw: string | null): RadioPrefs {
    const fallback: RadioPrefs = { stationId: DEFAULT_STATION_ID, volume: 0.8 };
    if (!raw) {
        return fallback;
    }
    try {
        const parsed = JSON.parse(raw) as Partial<RadioPrefs>;
        const stationId = typeof parsed.stationId === "string" && findStation(parsed.stationId) ? parsed.stationId : fallback.stationId;
        const volume = typeof parsed.volume === "number" && Number.isFinite(parsed.volume) ? Math.min(1, Math.max(0, parsed.volume)) : fallback.volume;
        return { stationId, volume };
    } catch {
        return fallback;
    }
}
