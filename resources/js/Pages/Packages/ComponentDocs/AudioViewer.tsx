import type { ComponentDoc } from "./types";
import { AudioViewer } from "@particle-academy/react-fancy";

/** Ours, which is the only reason it can ship here. Press play — it really is audio. */
const TRACK = "/showcase-assets/audio/make-it-fancy.mp3";

export const audioViewerDoc: ComponentDoc = {
    intro: (
        <p>
            A themed card around the browser&rsquo;s own audio transport. The one prop
            worth reading about is <code>preload</code>: it defaults to{" "}
            <code>"metadata"</code> rather than leaving the attribute off, because with no
            attribute Chrome chooses <code>"auto"</code> for audio — which means{" "}
            <strong>rendering the component downloads the whole file.</strong> Measured on
            this showcase: one audio tile on the package grid transferred 995&nbsp;KB before
            anyone pressed play.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description:
                "Native controls, and metadata-only preload — enough for the duration and a working scrubber, nothing more.",
            render: () => (
                <div className="w-full max-w-md">
                    <AudioViewer src={TRACK} />
                </div>
            ),
            code: `<AudioViewer src="/audio/make-it-fancy.mp3" />`,
        },
        {
            name: "With a title",
            description:
                "title is a label above the player — usually the file name or the track. It is also what MediaViewer forwards when it picks this viewer.",
            render: () => (
                <div className="w-full max-w-md">
                    <AudioViewer src={TRACK} title="Make It Fancy.mp3" />
                </div>
            ),
            code: `<AudioViewer src="/audio/make-it-fancy.mp3" title="Make It Fancy.mp3" />`,
        },
        {
            name: "preload — what it costs to render",
            description:
                "none fetches nothing until the user presses play, so the scrubber has no duration until then; metadata (the default) fetches the header only; auto restores the eager behaviour deliberately. Pick none for a thumbnail in a list, where the component may be mounted a dozen times.",
            render: () => (
                <div className="w-full max-w-md space-y-4">
                    <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500">
                            preload="none" — costs nothing to render
                        </p>
                        <AudioViewer src={TRACK} preload="none" title="Lazy" />
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500">
                            preload="metadata" — the default
                        </p>
                        <AudioViewer src={TRACK} preload="metadata" title="Default" />
                    </div>
                </div>
            ),
            code: `{/* In a list of many files, pay nothing until someone presses play. */}
<AudioViewer src={file.url} title={file.name} preload="none" />

{/* On a detail page, metadata gives a real scrubber immediately. */}
<AudioViewer src={file.url} title={file.name} />`,
        },
        {
            name: "Looping",
            description: "loop restarts on end — for a short sample or an ambient bed.",
            render: () => (
                <div className="w-full max-w-md">
                    <AudioViewer src={TRACK} title="Looping" loop />
                </div>
            ),
            code: `<AudioViewer src={src} loop />`,
        },
        {
            name: "Without controls",
            description:
                "controls={false} hides the transport, leaving the card and title. Only useful when something else on the page drives playback — on its own it gives the listener no way to start or stop, so pair it with your own controls.",
            render: () => (
                <div className="w-full max-w-md">
                    <AudioViewer src={TRACK} title="Driven from elsewhere" controls={false} />
                </div>
            ),
            code: `<AudioViewer src={src} title="Driven from elsewhere" controls={false} />`,
        },
        {
            name: "Handling a bad source",
            description:
                "onError fires when the audio fails to load — a 404, a CORS refusal, an unsupported codec. This one points at a file that does not exist.",
            render: () => (
                <div className="w-full max-w-md">
                    <AudioViewer
                        src="/showcase-assets/audio/does-not-exist.mp3"
                        title="Missing file"
                        onError={() => console.warn("[AudioViewer] source failed to load")}
                    />
                </div>
            ),
            code: `<AudioViewer
    src={src}
    onError={() => setPlayable(false)}
/>`,
        },
    ],
    props: [
        { name: "src", type: `string`, default: "—", description: "Audio source — an `http(s):`, `data:` or `blob:` URL.", required: true },
        { name: "preload", type: `"none" | "metadata" | "auto"`, default: `"metadata"`, description: "How much to fetch before playback is requested. `none` makes rendering free." },
        { name: "title", type: `string`, default: "—", description: "Label shown above the player, e.g. the file name." },
        { name: "controls", type: `boolean`, default: `true`, description: "Show native playback controls." },
        { name: "autoPlay", type: `boolean`, default: `false`, description: "Begin playback on mount. Most browsers block this unless muted." },
        { name: "loop", type: `boolean`, default: `false`, description: "Restart on end." },
        { name: "onError", type: `() => void`, default: "—", description: "Fired when the audio fails to load." },
        { name: "className", type: `string`, default: "—", description: "Additional classes for the card." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles for the card." },
    ],
    notes: (
        <ul>
            <li>
                <code>preload</code> is the prop that has actually cost bandwidth here.
                Defaulting it to <code>"metadata"</code> rather than leaving the attribute
                unset is a deliberate departure from the platform default, because the
                platform default for audio is &ldquo;download everything&rdquo;.
            </li>
            <li>
                <code>autoPlay</code> without <code>muted</code> is refused by most browsers.
                There is no <code>muted</code> prop here — it is an audio player, and a muted
                one is a spinner. Use <code>VideoViewer</code> if you need that combination.
            </li>
            <li>
                For a file whose type you do not know ahead of time, use{" "}
                <code>MediaViewer</code>, which sniffs the kind and forwards to this
                component through <code>audioProps</code>.
            </li>
        </ul>
    ),
};
