import { useEffect, useRef, useState } from "react";
import {
    ChannelPlayer,
    Text,
    createChannelValue,
    selectChannel,
    type Channel,
    type ChannelPlayerErrorKind,
    type ChannelPlayerValue,
} from "@particle-academy/react-fancy";
import { PLAYLIST_CHANNEL, RADIO_CHANNELS, SINGLE_TRACK_CHANNEL, riverwestChannel } from "../../../radio/channels";
import type { ComponentDoc } from "./types";

/*
 * Every channel here is the showcase radio's (resources/js/radio/channels.ts):
 * Thunder in the Garden tracks this server hosts, and Riverwest Radio's live
 * Icecast mount. Nothing plays until someone presses play.
 */

/** A value tuned to `channel`, at 0.8 volume, not playing. */
export function tunedTo(channel: Channel | undefined): ChannelPlayerValue {
    return selectChannel(createChannelValue({ volume: 0.8 }), channel);
}

export function ChannelPlayerExample({
    channels = RADIO_CHANNELS,
    initial = PLAYLIST_CHANNEL.id,
    showValue = true,
}: {
    channels?: Channel[];
    initial?: string;
    showValue?: boolean;
}) {
    const [value, setValue] = useState<ChannelPlayerValue>(() => tunedTo(channels.find((c) => c.id === initial)));
    const [error, setError] = useState<string | null>(null);
    return (
        <div className="w-full max-w-xl space-y-2">
            <ChannelPlayer
                channels={channels}
                value={value}
                onChange={setValue}
                onError={(channelId: string, kind: ChannelPlayerErrorKind) => setError(`${channelId}: ${kind}`)}
            />
            {showValue && (
                <Text size="sm" className="font-mono break-all">
                    value: {JSON.stringify(value)}
                </Text>
            )}
            {error && (
                <Text size="sm" className="font-mono">
                    onError: {error}
                </Text>
            )}
        </div>
    );
}

function MediaRefExample() {
    const mediaRef = useRef<HTMLMediaElement | null>(null);
    const [value, setValue] = useState<ChannelPlayerValue>(() => tunedTo(SINGLE_TRACK_CHANNEL));
    const [element, setElement] = useState("");
    useEffect(() => {
        const el = mediaRef.current;
        setElement(el ? `<${el.tagName.toLowerCase()}> preload="${el.preload}"` : "none");
    }, [value.channelId]);
    return (
        <div className="w-full max-w-xl space-y-2">
            <ChannelPlayer channels={[SINGLE_TRACK_CHANNEL]} value={value} onChange={setValue} mediaRef={mediaRef} />
            <Text size="sm" className="font-mono">
                mediaRef.current: {element}
            </Text>
        </div>
    );
}

function SpanishExample() {
    const live = riverwestChannel("En directo desde Milwaukee");
    const [value, setValue] = useState<ChannelPlayerValue>(() => tunedTo(live));
    return (
        <div className="w-full max-w-xl">
            <ChannelPlayer
                channels={[live]}
                value={value}
                onChange={setValue}
                labels={{ player: "Reproductor", play: "Reproducir", pause: "Pausa", mute: "Silenciar", volume: "Volumen", connecting: "Conectando", reconnecting: "Reconectando" }}
                liveLabels={{ live: "EN VIVO", starting: "Empezando", offline: "Sin señal", ended: "Terminado" }}
                embedLabels={{ play: "Reproducir {title} en {provider}", unsupported: "Este vídeo no se puede insertar." }}
            />
        </div>
    );
}

export const channelPlayerDoc: ComponentDoc = {
    intro: (
        <p>
            The one player for every channel kind: a single track, a playlist, or a live stream. It plays on{" "}
            <code>&lt;audio&gt;</code> or <code>&lt;video&gt;</code>, or in a <code>MediaEmbed</code> for a provider's own player.
            It is fully controlled through one <code>ChannelPlayerValue</code>, the same value ChannelGuide, Playlist and
            MediaQueue take, so they stay in step and an agent can drive all of them by writing that one object.
        </p>
    ),
    examples: [
        {
            name: "A playlist",
            description:
                "A playlist channel gets previous / next, shuffle and repeat, and moves on when a track ends. The player reports whole-second progress in value.position, and moving value.position seeks.",
            render: () => <ChannelPlayerExample />,
            code: `const [value, setValue] = useState(() =>
    selectChannel(createChannelValue({ volume: 0.8 }), channels[1]),
);

<ChannelPlayer
    channels={channels}
    value={value}
    onChange={setValue}
    onError={(channelId, kind) => console.warn(channelId, kind)}
/>`,
        },
        {
            name: "A single track and a live stream",
            description:
                "A track channel has no previous / next. A live channel has no seek bar: pause drops the connection and play reopens it at the live edge, with three reconnects (1s, 2s, 4s) before it reports failed.",
            render: () => (
                <div className="w-full space-y-4">
                    <ChannelPlayerExample initial={SINGLE_TRACK_CHANNEL.id} showValue={false} />
                    <ChannelPlayerExample initial="riverwest" showValue={false} />
                </div>
            ),
            code: `const channels: Channel[] = [
    { id: "single", kind: "track", name: "No Second Life",
      track: { id: "no-second-life", title: "No Second Life", artist: "Thunder in the Garden",
               source: { type: "file", url: "/radio/no-second-life.mp3", mime: "audio/mpeg" } } },
    { id: "riverwest", kind: "live", name: "Riverwest Radio", status: "live",
      source: { type: "stream", url: "https://radio.computer:8443/riverwestradio", protocol: "icecast" } },
];`,
        },
        {
            name: "An address it refuses",
            description:
                "Only http(s) URLs and same-origin paths reach the element. This channel's javascript: address never does; onError fires with \"refused\" and the value stays playing: false.",
            render: () => (
                <ChannelPlayerExample
                    initial="bad"
                    showValue={false}
                    channels={[{ id: "bad", kind: "live", name: "Not a stream", source: { type: "stream", url: "javascript:alert(1)" } }]}
                />
            ),
            code: `<ChannelPlayer
    channels={[{ id: "bad", kind: "live", name: "Not a stream",
                 source: { type: "stream", url: "javascript:alert(1)" } }]}
    value={value}
    onChange={setValue}
    onError={(channelId, kind) => console.warn(channelId, kind)} // "refused"
/>`,
        },
        {
            name: "The media element",
            description: "mediaRef forwards the underlying <audio> or <video> element, for a visualiser or analytics.",
            render: () => <MediaRefExample />,
            code: `const mediaRef = useRef<HTMLMediaElement | null>(null);

<ChannelPlayer channels={channels} value={value} onChange={setValue} mediaRef={mediaRef} />`,
        },
        {
            name: "Labels in another language",
            description: "Every visible string is a label with an English default. liveLabels go to the LIVE badge and embedLabels to an embed.",
            render: () => <SpanishExample />,
            code: `<ChannelPlayer
    channels={channels}
    value={value}
    onChange={setValue}
    labels={{ player: "Reproductor", play: "Reproducir", pause: "Pausa", volume: "Volumen" }}
    liveLabels={{ live: "EN VIVO", starting: "Empezando", offline: "Sin señal", ended: "Terminado" }}
    embedLabels={{ play: "Reproducir {title} en {provider}" }}
/>`,
        },
    ],
    props: [
        { name: "channels", type: "Channel[]", default: "—", description: "Every channel the value may point at: track, playlist or live.", required: true },
        { name: "value", type: "ChannelPlayerValue", default: "—", description: "{ channelId, trackId, playing, position, volume, muted, shuffle, repeat, order }. Fully controlled.", required: true },
        { name: "onChange", type: "(next) => void", default: "—", description: "Every move, and whole-second progress in position.", required: true },
        { name: "onError", type: `(channelId, "refused" | "unsupported" | "failed" | "blocked") => void`, default: "—", description: "A refused src, a source nothing can play, a failed file or stream, or a blocked autoplay." },
        { name: "labels", type: "Partial<ChannelPlayerLabels>", default: "English", description: "Every visible and announced string." },
        { name: "liveLabels", type: "Partial<LiveBadgeLabels>", default: "—", description: "Passed to the LIVE badge." },
        { name: "embedLabels", type: "Partial<MediaEmbedLabels>", default: "—", description: "Passed to a provider embed." },
        { name: "mediaRef", type: "Ref<HTMLMediaElement>", default: "—", description: "The underlying <audio> or <video> element." },
    ],
    notes: (
        <ul>
            <li>
                <code>playing: false</code> comes back through <code>onChange</code> when autoplay is blocked, a stream gives up,
                a src is refused, or nothing can play the source. The value never claims to be playing when it is not.
            </li>
            <li>
                HLS plays natively on Safari and iOS. Elsewhere it needs the opt-in{" "}
                <code>@particle-academy/react-fancy/channels/hls</code> adapter (hls.js, an optional peer); this site does not
                load it, because every channel here is a file or an Icecast mount.
            </li>
            <li>
                Handles: <code>data-react-fancy-channel-player</code>, <code>data-channel-id</code>, <code>data-channel-kind</code>,{" "}
                <code>data-track-id</code>, <code>data-channel-playing</code>, and{" "}
                <code>data-channel-control="prev|play|next|shuffle|repeat|mute|volume|seek"</code>.
            </li>
        </ul>
    ),
};
