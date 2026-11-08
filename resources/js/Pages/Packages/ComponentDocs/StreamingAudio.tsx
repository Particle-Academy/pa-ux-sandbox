import { useState } from "react";
import { StreamingAudio, Text, type StreamingAudioValue, type StreamingStation } from "@particle-academy/react-fancy";
import type { ComponentDoc } from "./types";

/*
 * The stations are this site's own radio (resources/js/radio): Thunder in the
 * Garden tracks served from this server with Range support, and Riverwest
 * Radio's live Icecast mount. Both are approved for the showcase. Nothing
 * plays until someone presses play.
 */
export const DOC_STATIONS: StreamingStation[] = [
    {
        id: "no-second-life",
        name: "No Second Life",
        src: "/radio/no-second-life.mp3",
        description: "Thunder in the Garden",
        artwork: "/radio/thunder-in-the-garden-512.webp",
    },
    {
        id: "riverwest",
        name: "Riverwest Radio",
        src: "https://radio.computer:8443/riverwestradio",
        kind: "live",
        description: "WXRW-LP 104.1 FM, Milwaukee",
        genre: "128 kbps",
        artwork: "/radio/riverwest-radio-512.webp",
    },
];

export function StreamingAudioExample({
    layout,
    initial = "no-second-life",
    stations = DOC_STATIONS,
    showValue = true,
}: {
    layout?: "bar" | "compact";
    initial?: string;
    stations?: StreamingStation[];
    showValue?: boolean;
}) {
    const [value, setValue] = useState<StreamingAudioValue>({ stationId: initial, playing: false, volume: 0.8, muted: false });
    return (
        <div className="w-full max-w-xl space-y-2">
            <StreamingAudio stations={stations} value={value} onChange={setValue} layout={layout} />
            {showValue && (
                <Text size="sm" className="font-mono">
                    value: {JSON.stringify(value)}
                </Text>
            )}
        </div>
    );
}

export const streamingAudioDoc: ComponentDoc = {
    intro: (
        <p>
            A controlled player for server-hosted MP3s and Icecast or Shoutcast live streams, on the native{" "}
            <code>&lt;audio&gt;</code> element only. Nothing plays until <code>value.playing</code> is true, and when the
            browser blocks autoplay or a stream gives up, the component reports <code>playing: false</code> back, so the
            value never claims to be playing when it is not. This site's radio, under the header, is built on it.
        </p>
    ),
    examples: [
        {
            name: "A file and a live stream",
            description:
                "A file gets elapsed / duration and a seek bar; a live station gets a LIVE badge, and pause drops the connection so play resumes from the live edge.",
            render: () => <StreamingAudioExample />,
            code: `const [value, setValue] = useState<StreamingAudioValue>({
    stationId: "no-second-life", playing: false, volume: 0.8, muted: false,
});

<StreamingAudio
    stations={[
        { id: "no-second-life", name: "No Second Life", src: "/radio/no-second-life.mp3", artwork: "/radio/cover-512.webp" },
        { id: "riverwest", name: "Riverwest Radio", src: "https://radio.computer:8443/riverwestradio", kind: "live" },
    ]}
    value={value}
    onChange={setValue}
/>`,
        },
        {
            name: "Compact",
            description: "layout=\"compact\" drops the artwork, description and button text, for a toolbar or a sidebar.",
            render: () => <StreamingAudioExample layout="compact" initial="riverwest" showValue={false} />,
            code: `<StreamingAudio stations={stations} value={value} onChange={setValue} layout="compact" />`,
        },
        {
            name: "An address it refuses",
            description:
                "Only http(s) URLs and same-origin paths reach the element. This station's javascript: address is refused: the element never receives it and onError fires with \"refused\".",
            render: () => (
                <StreamingAudioExample
                    initial="bad"
                    showValue={false}
                    stations={[{ id: "bad", name: "Not a stream", src: "javascript:alert(1)", kind: "live" }]}
                />
            ),
            code: `<StreamingAudio
    stations={[{ id: "bad", name: "Not a stream", src: "javascript:alert(1)" }]}
    value={value}
    onChange={setValue}
    onError={(stationId, kind) => console.warn(stationId, kind)} // "refused"
/>`,
        },
    ],
    props: [
        { name: "stations", type: "StreamingStation[]", default: "—", description: "{ id, name, src, kind?, description?, artwork?, genre? }.", required: true },
        { name: "value", type: "StreamingAudioValue", default: "—", description: "{ stationId, playing, volume (0..1), muted }. Fully controlled.", required: true },
        { name: "onChange", type: "(next) => void", default: "—", description: "Every control, Media Session action, autoplay block and give-up.", required: true },
        { name: "nowPlaying", type: "string", default: "—", description: "What is on air. Browsers cannot read ICY metadata, so the host supplies it." },
        { name: "onError", type: `(stationId, "refused" | "failed" | "blocked") => void`, default: "—", description: "A refused address, a failed stream or file, or a blocked autoplay." },
        { name: "labels", type: "Partial<StreamingAudioLabels>", default: "English", description: "Every visible string." },
        { name: "layout", type: `"bar" | "compact"`, default: `"bar"`, description: "compact drops artwork, description and button text." },
        { name: "audioRef", type: "Ref<HTMLAudioElement>", default: "—", description: "The underlying <audio> element." },
        { name: "id", type: "string", default: "generated", description: "Root id; control ids derive from it." },
    ],
    notes: (
        <ul>
            <li>
                A live stream that errors or stalls while playing reconnects with backoff (1s, 2s, 4s; three attempts), then
                reports <code>failed</code> and <code>playing: false</code>.
            </li>
            <li>
                Icecast mounts named like files (<code>/stream.mp3</code>) need <code>kind: "live"</code>; otherwise the kind
                is guessed from the extension.
            </li>
            <li>
                An agent drives the player by writing <code>value</code>, never by clicking. The root and every control carry
                a <code>data-streaming-*</code> handle.
            </li>
        </ul>
    ),
};
