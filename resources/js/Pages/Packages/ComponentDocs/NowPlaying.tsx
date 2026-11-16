import { NowPlaying } from "@particle-academy/react-fancy";
import { PLAYLIST_CHANNEL, RADIO_TRACKS, riverwestChannel } from "../../../radio/channels";
import type { ComponentDoc } from "./types";

export function NowPlayingExample() {
    return (
        <div className="w-full max-w-xl space-y-4">
            <NowPlaying channel={PLAYLIST_CHANNEL} track={RADIO_TRACKS[1]} />
            <NowPlaying channel={riverwestChannel("Morning show")} />
        </div>
    );
}

export const nowPlayingDoc: ComponentDoc = {
    intro: (
        <p>
            What is on. For a track: artwork, title and artist, plus the playlist's name when the track is in one. For a live
            channel: the channel's name, what is on air and its LiveBadge. ChannelPlayer uses it; use it alone for a mini player
            or a header.
        </p>
    ),
    examples: [
        {
            name: "A playlist track and a live channel",
            description: "track is usually currentTrack(channel, value). A live channel's nowPlaying is supplied by the host, from a status poll or a provider API.",
            render: () => <NowPlayingExample />,
            code: `<NowPlaying channel={channel} track={currentTrack(channel, value)} />
<NowPlaying channel={{ ...riverwest, nowPlaying: "Morning show" }} />`,
        },
        {
            name: "Small, labels, and nothing on",
            description: "size=\"sm\" drops the artwork to 40px. With no channel it says so, in the labels you give it; liveLabels go to the badge.",
            render: () => (
                <div className="w-full max-w-xl space-y-4">
                    <NowPlaying channel={{ ...riverwestChannel(), status: "offline" }} size="sm" liveLabels={{ offline: "Fuera del aire" }} />
                    <NowPlaying size="sm" labels={{ nothing: "Nada sonando" }} />
                </div>
            ),
            code: `<NowPlaying channel={{ ...riverwest, status: "offline" }} size="sm" liveLabels={{ offline: "Fuera del aire" }} />
<NowPlaying size="sm" labels={{ nothing: "Nada sonando" }} />`,
        },
    ],
    props: [
        { name: "channel", type: "Channel", default: "—", description: "The channel that is on." },
        { name: "track", type: "MediaTrack", default: "—", description: "The current track of a track or playlist channel." },
        { name: "size", type: `"sm" | "md"`, default: `"md"`, description: "Artwork 40px or 56px." },
        { name: "labels", type: "Partial<NowPlayingLabels>", default: "English", description: "nothing." },
        { name: "liveLabels", type: "Partial<LiveBadgeLabels>", default: "—", description: "Passed to the badge." },
    ],
    notes: (
        <ul>
            <li>
                Handles: <code>data-react-fancy-now-playing</code>, <code>data-channel-id</code>, <code>data-track-id</code>.
            </li>
        </ul>
    ),
};
