import type { ComponentDoc } from "./types";
import { Text, VideoViewer } from "@particle-academy/react-fancy";

/*
 * This showcase ships no video file on purpose — a sample large enough to be a
 * real test is a sample large enough to be a real download, on every page load,
 * for everyone. So the examples below drive the POSTER and the chrome, which is
 * the part these props actually control, and say so rather than pretending.
 */
const POSTER = "/showcase-shots/fancy-motion.png";

function Box({ children }: { children: React.ReactNode }) {
    return (
        <div className="h-56 w-full overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            {children}
        </div>
    );
}

export const videoViewerDoc: ComponentDoc = {
    intro: (
        <>
            <p>
                A themed container around the browser&rsquo;s own video element, with poster
                handling and a fit mode. Like <code>AudioViewer</code>, its{" "}
                <code>preload</code> defaults to <code>"metadata"</code> rather than letting
                the browser decide — an unset attribute is how a grid of thumbnails quietly
                downloads every file it shows.
            </p>
            <p className="text-zinc-500">
                The examples below ship a poster and no video, because a sample big enough
                to be a real test is a sample big enough to be a real download on every page
                load. The chrome, the poster and <code>fit</code> are what these props
                control, and they are what you can see here.
            </p>
        </>
    ),
    examples: [
        {
            name: "Poster, before playback",
            description:
                "poster is what the viewer shows until play is pressed. With no poster the element is a black box, which reads as broken rather than as not-started.",
            render: () => (
                <Box>
                    <VideoViewer src="" poster={POSTER} controls muted />
                </Box>
            ),
            code: `<VideoViewer src="/clips/intro.mp4" poster="/clips/intro.jpg" controls />`,
        },
        {
            name: "fit",
            description:
                "contain fits the whole frame inside the box and letterboxes; cover fills the box and crops. Cover for a background or a hero band, contain whenever the frame's content matters.",
            render: () => (
                <div className="w-full space-y-3">
                    {(["contain", "cover"] as const).map((fit) => (
                        <div key={fit}>
                            <Text className="mb-1 text-xs font-medium text-zinc-500">
                                fit="{fit}"
                            </Text>
                            <Box>
                                <VideoViewer src="" poster={POSTER} fit={fit} controls muted />
                            </Box>
                        </div>
                    ))}
                </div>
            ),
            code: `<VideoViewer src={src} poster={poster} fit="contain" />
<VideoViewer src={src} poster={poster} fit="cover" />`,
        },
        {
            name: "Without controls",
            description:
                "controls={false} strips the transport — the right choice for an ambient background clip, which should also be muted and looping so it never demands attention or asks for permission.",
            render: () => (
                <Box>
                    <VideoViewer
                        src=""
                        poster={POSTER}
                        controls={false}
                        muted
                        loop
                        fit="cover"
                    />
                </Box>
            ),
            code: `{/* Ambient background: no chrome, muted, looping. */}
<VideoViewer src={src} poster={poster} controls={false} muted loop fit="cover" />`,
        },
        {
            name: "Autoplay needs muted",
            description:
                "Browsers block autoplay with sound. autoPlay on its own is silently refused, so pass muted with it — and treat the sound as something the viewer turns on, never something you start for them.",
            render: () => (
                <Box>
                    <VideoViewer src="" poster={POSTER} autoPlay muted loop controls />
                </Box>
            ),
            code: `{/* muted is not optional here — without it the browser refuses. */}
<VideoViewer src={src} poster={poster} autoPlay muted loop />`,
        },
        {
            name: "preload",
            description:
                "none costs nothing to render and is what you want for any list of clips; metadata (the default) gets the duration and a working scrubber; auto restores the eager fetch deliberately.",
            render: () => (
                <div className="w-full space-y-3">
                    <div>
                        <Text className="mb-1 text-xs font-medium text-zinc-500">
                            preload="none" — a thumbnail that costs nothing
                        </Text>
                        <Box>
                            <VideoViewer src="" poster={POSTER} preload="none" controls muted />
                        </Box>
                    </div>
                </div>
            ),
            code: `{/* A grid of clips: pay for the posters, not the videos. */}
{clips.map((c) => (
    <VideoViewer key={c.id} src={c.url} poster={c.poster} preload="none" />
))}`,
        },
        {
            name: "Handling a bad source",
            description:
                "onError fires on a 404, a CORS refusal or an unsupported codec — the last of which is common enough that a fallback message is worth wiring.",
            render: () => (
                <Box>
                    <VideoViewer
                        src="/showcase-assets/video/does-not-exist.mp4"
                        poster={POSTER}
                        controls
                        muted
                        onError={() => console.warn("[VideoViewer] source failed to load")}
                    />
                </Box>
            ),
            code: `<VideoViewer
    src={src}
    poster={poster}
    onError={() => setUnplayable(true)}
/>`,
        },
    ],
    props: [
        { name: "src", type: `string`, default: "—", description: "Video source — an `http(s):`, `data:` or `blob:` URL.", required: true },
        { name: "poster", type: `string`, default: "—", description: "Image shown before playback. Without one the element is a black box." },
        { name: "preload", type: `"none" | "metadata" | "auto"`, default: `"metadata"`, description: "How much to fetch before playback is requested." },
        { name: "controls", type: `boolean`, default: `true`, description: "Show native playback controls." },
        { name: "autoPlay", type: `boolean`, default: `false`, description: "Begin on mount. Requires `muted` in most browsers." },
        { name: "muted", type: `boolean`, default: `false`, description: "Start muted. Required alongside `autoPlay`." },
        { name: "loop", type: `boolean`, default: `false`, description: "Restart on end." },
        { name: "fit", type: `"contain" | "cover"`, default: `"contain"`, description: "How the video fits its box." },
        { name: "onError", type: `() => void`, default: "—", description: "Fired when the video fails to load." },
        { name: "className", type: `string`, default: "—", description: "Additional classes for the container." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles — usually a fixed height." },
    ],
    notes: (
        <ul>
            <li>
                Give the container a height. Like <code>ImageViewer</code>, the player fills
                its box and collapses in one with no height.
            </li>
            <li>
                <code>autoPlay</code> without <code>muted</code> is refused by Chrome, Safari
                and Firefox. The component does not add <code>muted</code> for you — doing so
                would silently change what you asked for.
            </li>
            <li>
                For a file whose type is not known ahead of time, use{" "}
                <code>MediaViewer</code>, which sniffs the kind and forwards here through{" "}
                <code>videoProps</code>.
            </li>
        </ul>
    ),
};
