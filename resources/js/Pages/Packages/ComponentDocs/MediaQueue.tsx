import { useState } from "react";
import {
    Button,
    MediaQueue,
    cycleRepeat,
    toggleShuffle,
    type ChannelPlayerValue,
} from "@particle-academy/react-fancy";
import { PLAYLIST_CHANNEL } from "../../../radio/channels";
import { tunedTo } from "./ChannelPlayer";
import type { ComponentDoc } from "./types";

export function MediaQueueExample({ limit }: { limit?: number }) {
    const [value, setValue] = useState<ChannelPlayerValue>(() => tunedTo(PLAYLIST_CHANNEL));
    return (
        <div className="w-full max-w-xl space-y-2">
            <div className="flex flex-wrap gap-2">
                <Button size="sm" icon="shuffle" active={value.shuffle} onClick={() => setValue(toggleShuffle(value, PLAYLIST_CHANNEL))}>
                    Shuffle: {value.shuffle ? "on" : "off"}
                </Button>
                <Button size="sm" icon="repeat" onClick={() => setValue(cycleRepeat(value))}>
                    Repeat: {value.repeat}
                </Button>
            </div>
            <MediaQueue channel={PLAYLIST_CHANNEL} value={value} onChange={setValue} limit={limit} />
        </div>
    );
}

export const mediaQueueDoc: ComponentDoc = {
    intro: (
        <p>
            "Up next": the tracks after the current one, in play order. It follows the shared value's shuffle order, and with
            repeat all it wraps round. Selecting a queued track jumps to it; without <code>onChange</code> the queue is
            read-only.
        </p>
    ),
    examples: [
        {
            name: "Up next, following shuffle and repeat",
            description: "Turn shuffle on and the queue reorders; set repeat to all and it wraps round to the first track.",
            render: () => <MediaQueueExample />,
            code: `<MediaQueue channel={findChannel(channels, value.channelId)} value={value} onChange={setValue} />`,
        },
        {
            name: "A shorter queue, read-only, with labels",
            description: "limit caps how many it shows (default 5). Leave out onChange for a queue nobody can jump in.",
            render: () => (
                <div className="w-full max-w-xl">
                    <MediaQueue
                        channel={PLAYLIST_CHANNEL}
                        value={tunedTo(PLAYLIST_CHANNEL)}
                        limit={1}
                        labels={{ heading: "Als Nächstes", empty: "Nichts mehr in der Warteschlange" }}
                        trackLabels={{ nowPlaying: "Läuft gerade" }}
                    />
                </div>
            ),
            code: `<MediaQueue
    channel={channel}
    value={value}
    limit={1}
    labels={{ heading: "Als Nächstes", empty: "Nichts mehr in der Warteschlange" }}
    trackLabels={{ nowPlaying: "Läuft gerade" }}
/>`,
        },
    ],
    props: [
        { name: "channel", type: "Channel | undefined", default: "—", description: "Usually findChannel(channels, value.channelId).", required: true },
        { name: "value", type: "ChannelPlayerValue", default: "—", description: "The shared value: the queue follows its order and repeat.", required: true },
        { name: "onChange", type: "(next) => void", default: "—", description: "Jump to a queued track. Without it the queue is read-only." },
        { name: "limit", type: "number", default: "5", description: "Show at most this many." },
        { name: "labels", type: "Partial<MediaQueueLabels>", default: "English", description: "heading, empty." },
        { name: "trackLabels", type: "Partial<TrackItemLabels>", default: "—", description: "Passed to each TrackItem." },
    ],
    notes: (
        <ul>
            <li>
                Handles: <code>data-react-fancy-media-queue</code>, <code>data-queue-track=&lt;id&gt;</code>,{" "}
                <code>data-queue-empty</code>.
            </li>
        </ul>
    ),
};
