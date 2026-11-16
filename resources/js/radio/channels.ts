import type { Channel, LiveChannel, MediaTrack, PlaylistChannel, TrackChannel } from "@particle-academy/react-fancy";
import { RADIO_STATIONS, type RadioStation } from "./stations";

/*
 * The showcase radio's stations as react-fancy channels (react-fancy 6.26.0):
 * one single track, a playlist of the three Thunder in the Garden tracks, and
 * Riverwest Radio live. Everything is derived from RADIO_STATIONS, so this file
 * names no media URL of its own and the channel demos play exactly what the
 * radio plays (self-hosted tracks, owner-approved 2026-11-08, and the Riverwest
 * Icecast mount, the owner's choice). Riverwest is Icecast MP3, which every
 * browser plays natively, so nothing here needs the hls.js adapter.
 *
 * Nothing is ever started from here: every value built on these channels
 * begins with playing: false, and only a person pressing play changes that.
 */

function stationOrThrow(id: string): RadioStation {
    const station = RADIO_STATIONS.find((s) => s.id === id);
    if (!station) {
        throw new Error(`the radio has no station "${id}"; resources/js/radio/channels.ts needs updating`);
    }
    return station;
}

/** A radio file station as a track. */
export function radioTrack(station: RadioStation): MediaTrack {
    return {
        id: station.id,
        title: station.name,
        artist: station.description,
        artwork: station.artwork,
        source: { type: "file", url: station.src, mime: "audio/mpeg", media: "audio" },
    };
}

/** The radio's self-hosted tracks, in the radio's order. */
export const RADIO_TRACKS: MediaTrack[] = RADIO_STATIONS.filter((s) => s.kind === "file").map(radioTrack);

const first = RADIO_TRACKS[0]!;

/** A single-track channel: the radio's first track. */
export const SINGLE_TRACK_CHANNEL: TrackChannel = {
    id: "single",
    kind: "track",
    name: first.title,
    description: "A single track",
    artwork: first.artwork,
    track: first,
};

/** A playlist channel: every track the radio hosts. */
export const PLAYLIST_CHANNEL: PlaylistChannel = {
    id: "thunder",
    kind: "playlist",
    name: "Thunder in the Garden",
    description: "A playlist",
    artwork: first.artwork,
    tracks: RADIO_TRACKS,
};

const riverwest = stationOrThrow("riverwest");

/** The Riverwest Radio mount, for an Icecast status lookup. */
export const RIVERWEST_LISTEN_URL = riverwest.listenUrl ?? riverwest.src;

/** Riverwest Radio live, with what is on air when the host knows it. */
export function riverwestChannel(nowPlaying?: string): LiveChannel {
    return {
        id: riverwest.id,
        kind: "live",
        name: riverwest.name,
        description: riverwest.description,
        artwork: riverwest.artwork,
        source: { type: "stream", url: riverwest.src, protocol: "icecast", media: "audio" },
        status: "live",
        nowPlaying,
    };
}

/** The three channel kinds, in guide order. */
export const RADIO_CHANNELS: Channel[] = [SINGLE_TRACK_CHANNEL, PLAYLIST_CHANNEL, riverwestChannel()];
