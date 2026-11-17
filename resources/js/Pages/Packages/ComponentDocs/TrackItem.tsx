import { useState } from "react";
import { Button, TrackItem } from "@particle-academy/react-fancy";
import { RADIO_TRACKS } from "../../../radio/channels";
import type { ComponentDoc } from "./types";
import { LiveState } from "../LiveState";

export function TrackItemExample() {
    const [current, setCurrent] = useState<string>(RADIO_TRACKS[0]!.id);
    const [starred, setStarred] = useState<string[]>([]);
    return (
        <div className="w-full max-w-xl space-y-1">
            {RADIO_TRACKS.map((track, i) => (
                <TrackItem
                    key={track.id}
                    track={track}
                    index={i + 1}
                    active={track.id === current}
                    playing={track.id === current}
                    onSelect={(trackId: string) => setCurrent(trackId)}
                    actions={
                        <Button
                            size="sm"
                            variant="ghost"
                            icon="star"
                            aria-label={`Star ${track.title}`}
                            active={starred.includes(track.id)}
                            onClick={() => setStarred((s) => (s.includes(track.id) ? s.filter((id) => id !== track.id) : [...s, track.id]))}
                        />
                    }
                />
            ))}
            <LiveState value={{ current, starred }} />
        </div>
    );
}

export const trackItemDoc: ComponentDoc = {
    intro: (
        <p>
            One track as a row: position, artwork, title, artist, duration, a now-playing mark, and room for actions. Playlist and
            MediaQueue are built from it; use it on its own for a track list of your own.
        </p>
    ),
    examples: [
        {
            name: "A track list",
            description: "onSelect makes the title a button named \"Play {title}\"; active and playing mark the current track; actions sit at the end of the row.",
            render: () => <TrackItemExample />,
            code: `{tracks.map((track, i) => (
    <TrackItem
        key={track.id}
        track={track}
        index={i + 1}
        active={track.id === current}
        playing={track.id === current && isPlaying}
        onSelect={(trackId) => setCurrent(trackId)}
        actions={<Button size="sm" variant="ghost" icon="star" aria-label={\`Star \${track.title}\`} />}
    />
))}`,
        },
        {
            name: "Plain, and with labels",
            description: "With no onSelect the row is just text. labels rename the now-playing mark and the select button.",
            render: () => (
                <div className="w-full max-w-xl space-y-1">
                    <TrackItem track={{ ...RADIO_TRACKS[1]!, duration: 214 }} />
                    <TrackItem
                        track={RADIO_TRACKS[2]!}
                        active
                        playing
                        onSelect={() => {}}
                        labels={{ nowPlaying: "Sonando ahora", play: "Reproducir {title} de {artist}" }}
                    />
                </div>
            ),
            code: `<TrackItem track={{ ...track, duration: 214 }} />
<TrackItem
    track={track}
    active
    playing
    onSelect={play}
    labels={{ nowPlaying: "Sonando ahora", play: "Reproducir {title} de {artist}" }}
/>`,
        },
    ],
    props: [
        { name: "track", type: "MediaTrack", default: "—", description: "{ id, title, artist?, album?, duration?, artwork?, source }.", required: true },
        { name: "index", type: "number", default: "—", description: "1-based position, shown before the title." },
        { name: "active", type: "boolean", default: "false", description: "The current track." },
        { name: "playing", type: "boolean", default: "false", description: "The current track is playing: shows the mark and reads \"Now playing\"." },
        { name: "onSelect", type: "(trackId) => void", default: "—", description: "Makes the title a button." },
        { name: "actions", type: "ReactNode", default: "—", description: "Controls at the end of the row." },
        { name: "labels", type: "Partial<TrackItemLabels>", default: "English", description: "nowPlaying, play (slots {title}, {artist})." },
    ],
    notes: (
        <ul>
            <li>
                Handles: <code>data-react-fancy-track-item</code>, <code>data-track-id</code>, <code>data-active</code>,{" "}
                <code>data-track-select</code>, <code>data-track-duration</code>, <code>data-track-now-playing</code>.
            </li>
        </ul>
    ),
};
