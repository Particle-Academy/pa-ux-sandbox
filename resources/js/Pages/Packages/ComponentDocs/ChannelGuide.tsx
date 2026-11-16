import { useState } from "react";
import { ChannelGuide, Text, type Channel, type ChannelPlayerValue } from "@particle-academy/react-fancy";
import { PLAYLIST_CHANNEL, RADIO_CHANNELS, riverwestChannel, SINGLE_TRACK_CHANNEL } from "../../../radio/channels";
import { tunedTo } from "./ChannelPlayer";
import type { ComponentDoc } from "./types";

export function ChannelGuideExample({ layout, showValue = true }: { layout?: "list" | "grid"; showValue?: boolean }) {
    const [value, setValue] = useState<ChannelPlayerValue>(() => tunedTo(RADIO_CHANNELS[0]));
    return (
        <div className="w-full max-w-xl space-y-2">
            <ChannelGuide channels={RADIO_CHANNELS} value={value} onChange={setValue} layout={layout} />
            {showValue && (
                <Text size="sm" className="font-mono break-all">
                    channelId: {JSON.stringify(value.channelId)}, trackId: {JSON.stringify(value.trackId)}
                </Text>
            )}
        </div>
    );
}

function GermanExample() {
    const channels: Channel[] = [SINGLE_TRACK_CHANNEL, PLAYLIST_CHANNEL, { ...riverwestChannel(), status: "starting" }];
    const [value, setValue] = useState<ChannelPlayerValue>(() => tunedTo(PLAYLIST_CHANNEL));
    return (
        <div className="w-full max-w-xl">
            <ChannelGuide
                channels={channels}
                value={value}
                onChange={setValue}
                labels={{ guide: "Sender", single: "Einzeltitel", playlist: "Playlist, {count} Titel", playlistOne: "Playlist, {count} Titel", live: "Live" }}
                liveLabels={{ live: "LIVE", starting: "Startet", offline: "Offline", ended: "Beendet" }}
            />
        </div>
    );
}

export const channelGuideDoc: ComponentDoc = {
    intro: (
        <p>
            The channel list. Each channel shows its artwork (or an icon for its kind) and name, and under it "Single",
            "Playlist, N tracks", or a LiveBadge with what is on air. Selecting one runs <code>selectChannel</code> on the shared{" "}
            <code>ChannelPlayerValue</code>: it tunes to the channel's first track from the start and keeps <code>playing</code>{" "}
            as it was.
        </p>
    ),
    examples: [
        {
            name: "A list",
            description: "The default layout. aria-current marks the channel that is on.",
            render: () => <ChannelGuideExample />,
            code: `const [value, setValue] = useState(() => createChannelValue());

<ChannelGuide channels={channels} value={value} onChange={setValue} />`,
        },
        {
            name: "A grid of cards",
            description: "layout=\"grid\" shows the same channels as cards.",
            render: () => <ChannelGuideExample layout="grid" showValue={false} />,
            code: `<ChannelGuide channels={channels} value={value} onChange={setValue} layout="grid" />`,
        },
        {
            name: "Labels, and a live channel that is starting",
            description: "labels name the list and each kind; liveLabels go to each live channel's badge. The status is the host's to supply.",
            render: () => <GermanExample />,
            code: `<ChannelGuide
    channels={[single, playlist, { ...riverwest, status: "starting" }]}
    value={value}
    onChange={setValue}
    labels={{ guide: "Sender", single: "Einzeltitel", playlist: "Playlist, {count} Titel" }}
    liveLabels={{ live: "LIVE", starting: "Startet" }}
/>`,
        },
    ],
    props: [
        { name: "channels", type: "Channel[]", default: "—", description: "The channels to list.", required: true },
        { name: "value", type: "ChannelPlayerValue", default: "—", description: "The shared channel value.", required: true },
        { name: "onChange", type: "(next) => void", default: "—", description: "Selecting a channel sets channelId and its first track.", required: true },
        { name: "layout", type: `"list" | "grid"`, default: `"list"`, description: "grid shows cards." },
        { name: "labels", type: "Partial<ChannelGuideLabels>", default: "English", description: "guide, single, playlist / playlistOne (slot {count}), live." },
        { name: "liveLabels", type: "Partial<LiveBadgeLabels>", default: "—", description: "Passed to each live channel's badge." },
    ],
    notes: (
        <ul>
            <li>
                Handles: <code>data-react-fancy-channel-guide</code>, and on each item <code>data-channel-guide-item=&lt;id&gt;</code>{" "}
                and <code>data-channel-kind</code>.
            </li>
        </ul>
    ),
};
