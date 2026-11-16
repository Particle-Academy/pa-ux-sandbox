import { useState } from "react";
import {
    Playlist,
    Text,
    type ChannelPlayerValue,
    type MediaTrack,
    type PendingQueueEdit,
    type PlaylistChannel,
} from "@particle-academy/react-fancy";
import { PLAYLIST_CHANNEL, RADIO_TRACKS, SINGLE_TRACK_CHANNEL } from "../../../radio/channels";
import { tunedTo } from "./ChannelPlayer";
import type { ComponentDoc } from "./types";

/** An editable playlist over the radio's tracks; the library is every track the radio hosts. */
export function PlaylistExample({ start = RADIO_TRACKS.slice(0, 2), showValue = true }: { start?: MediaTrack[]; showValue?: boolean }) {
    const [channel, setChannel] = useState<PlaylistChannel>({ ...PLAYLIST_CHANNEL, tracks: start });
    const [value, setValue] = useState<ChannelPlayerValue>(() => tunedTo(channel));
    return (
        <div className="w-full max-w-xl space-y-2">
            <Playlist
                channel={channel}
                value={value}
                onChange={setValue}
                onTracksChange={(_channelId: string, tracks: MediaTrack[]) => setChannel((c) => ({ ...c, tracks }))}
                library={RADIO_TRACKS}
            />
            {showValue && (
                <Text size="sm" className="font-mono break-all">
                    tracks: {JSON.stringify(channel.tracks.map((t) => t.id))}, trackId: {JSON.stringify(value.trackId)}
                </Text>
            )}
        </div>
    );
}

function ProposedEditsExample() {
    const [channel, setChannel] = useState<PlaylistChannel>(PLAYLIST_CHANNEL);
    const [value, setValue] = useState<ChannelPlayerValue>(() => tunedTo(PLAYLIST_CHANNEL));
    const [pending, setPending] = useState<PendingQueueEdit[]>([
        { id: "agent-1", op: "remove", trackId: RADIO_TRACKS[1]!.id },
        { id: "agent-2", op: "replace", tracks: RADIO_TRACKS.slice(0, 1) },
    ]);
    const [log, setLog] = useState<string[]>([]);
    return (
        <div className="w-full max-w-xl space-y-2">
            <Playlist
                channel={channel}
                value={value}
                onChange={setValue}
                onTracksChange={(_id, tracks) => setChannel((c) => ({ ...c, tracks }))}
                pendingEdits={pending}
                onResolvePending={(editId: string, accepted: boolean) => {
                    setPending((p) => p.filter((e) => e.id !== editId));
                    setLog((l) => [...l, `${editId}: ${accepted ? "accepted" : "rejected"}`]);
                }}
            />
            <Text size="sm" className="font-mono">
                onResolvePending: {log.length ? log.join(", ") : "nothing yet"}
            </Text>
        </div>
    );
}

function ReadOnlyExample() {
    const [value, setValue] = useState<ChannelPlayerValue>(() => tunedTo(SINGLE_TRACK_CHANNEL));
    return (
        <div className="w-full max-w-xl">
            <Playlist channel={SINGLE_TRACK_CHANNEL} value={value} onChange={setValue} hideModes />
        </div>
    );
}

function LabelsExample() {
    const [value, setValue] = useState<ChannelPlayerValue>(() => tunedTo(PLAYLIST_CHANNEL));
    return (
        <div className="w-full max-w-xl">
            <Playlist
                channel={PLAYLIST_CHANNEL}
                value={value}
                onChange={setValue}
                labels={{ list: "Pistas de {channel}", count: "{count} pistas", countOne: "{count} pista", shuffle: "Aleatorio", repeatOff: "Repetir: no", repeatAll: "Repetir: todo", repeatOne: "Repetir: una" }}
                trackLabels={{ nowPlaying: "Sonando", play: "Reproducir {title} de {artist}" }}
            />
        </div>
    );
}

export const playlistDoc: ComponentDoc = {
    intro: (
        <p>
            A channel's tracks. Play any of them, turn shuffle on, cycle repeat, and with <code>onTracksChange</code> reorder
            (Move up / Move down buttons, so the keyboard can do it), remove, and add from a <code>library</code>. The tracks are
            your data: an edit comes back through <code>onTracksChange</code>, and the shared value is kept in step through{" "}
            <code>onChange</code>.
        </p>
    ),
    examples: [
        {
            name: "An editable playlist",
            description:
                "Two of the three tracks, with the third offered from the library. Removing the current track moves to the next one; an emptied playlist stops.",
            render: () => <PlaylistExample />,
            code: `<Playlist
    channel={channel}
    value={value}
    onChange={setValue}
    onTracksChange={(channelId, tracks) => saveTracks(channelId, tracks)}
    library={allTracks}
/>`,
        },
        {
            name: "Edits an agent proposed",
            description:
                "pendingEdits are shown in place with Accept / Reject, and nothing changes until a person accepts. Accept applies the edit through onTracksChange, then reports it to onResolvePending.",
            render: () => <ProposedEditsExample />,
            code: `<Playlist
    channel={channel}
    value={value}
    onChange={setValue}
    onTracksChange={(id, tracks) => saveTracks(id, tracks)}
    pendingEdits={[
        { id: "agent-1", op: "remove", trackId: "locked-on" },
        { id: "agent-2", op: "replace", tracks: [firstTrack] },
    ]}
    onResolvePending={(editId, accepted) => dropProposal(editId)}
/>`,
        },
        {
            name: "A single track, read-only",
            description: "Given a track channel, it shows that one track. Without onTracksChange there is no editing; hideModes drops shuffle and repeat.",
            render: () => <ReadOnlyExample />,
            code: `<Playlist channel={singleTrackChannel} value={value} onChange={setValue} hideModes />`,
        },
        {
            name: "Labels",
            description: "labels cover the list, the modes, every action and the proposals; trackLabels go to each row.",
            render: () => <LabelsExample />,
            code: `<Playlist
    channel={channel}
    value={value}
    onChange={setValue}
    labels={{ list: "Pistas de {channel}", shuffle: "Aleatorio", repeatAll: "Repetir: todo" }}
    trackLabels={{ nowPlaying: "Sonando", play: "Reproducir {title} de {artist}" }}
/>`,
        },
    ],
    props: [
        { name: "channel", type: "Channel", default: "—", description: "A playlist (editable) or a track channel (read-only).", required: true },
        { name: "value", type: "ChannelPlayerValue", default: "—", description: "The shared value. Selecting a track tunes to this channel.", required: true },
        { name: "onChange", type: "(next) => void", default: "—", description: "Selection, shuffle, repeat, and keeping the value in step after an edit.", required: true },
        { name: "onTracksChange", type: "(channelId, tracks) => void", default: "—", description: "Turns on reorder, remove and add." },
        { name: "library", type: "MediaTrack[]", default: "—", description: "Tracks that can be added; those already listed are not offered." },
        { name: "pendingEdits", type: "PendingQueueEdit[]", default: "[]", description: `{ op: "remove", trackId } | { op: "clear" } | { op: "replace", tracks }, each held for Accept / Reject.` },
        { name: "onResolvePending", type: "(editId, accepted) => void", default: "—", description: "Accept applies the edit through onTracksChange first." },
        { name: "hideModes", type: "boolean", default: "false", description: "Hide the shuffle / repeat header." },
        { name: "labels", type: "Partial<PlaylistLabels>", default: "English", description: "Every visible string." },
        { name: "trackLabels", type: "Partial<TrackItemLabels>", default: "—", description: "Passed to each TrackItem." },
    ],
    notes: (
        <ul>
            <li>
                Handles: <code>data-react-fancy-playlist</code> and <code>data-channel-id</code> on the root,{" "}
                <code>data-playlist-track=&lt;id&gt;</code> on each row, <code>data-playlist-pending</code> on a proposal, and{" "}
                <code>data-playlist-action="up|down|remove|add|shuffle|repeat|accept|reject"</code> on the buttons.
            </li>
        </ul>
    ),
};
