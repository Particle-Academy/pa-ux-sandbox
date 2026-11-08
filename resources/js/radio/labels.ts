import type { StreamingAudioLabels } from "@particle-academy/react-fancy";

/**
 * Every string the radio drawer shows, in one place, English by default, so a
 * translation layer replaces them without touching a component. The player's
 * own strings are react-fancy StreamingAudio `labels`, passed through below.
 */
export const RADIO_LABELS = {
    open: "Open the radio",
    close: "Close the radio",
    title: "Radio",
    playingBadge: "On air",
    stations: "Stations",
    live: "Live",
    track: "Track",
    nowPlaying: "Now playing",
    nowPlayingUnknown: "The station is not sending a title right now",
    visitSite: "Visit {site}",
    hostedHere: "Played from this site, with the owner's permission.",
};

export type RadioLabels = typeof RADIO_LABELS;

export const RADIO_PLAYER_LABELS: Partial<StreamingAudioLabels> = {
    player: "Showcase radio",
    station: "Station",
};

export function fill(template: string, slots: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (whole, key: string) => slots[key] ?? whole);
}
