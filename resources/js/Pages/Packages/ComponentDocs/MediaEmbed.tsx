import { useState } from "react";
import { MediaEmbed, Text, registerEmbedProvider, type EmbedSource } from "@particle-academy/react-fancy";
import type { ComponentDoc } from "./types";

/*
 * The demos never load a third-party player. They use a provider registered
 * here, "showcase", that embeds a file this site serves, so pressing play sends
 * nothing to YouTube, Vimeo or Twitch. The built-in providers appear in code
 * only. An embed URL must be https:, so on plain http the provider declines
 * and the embed shows its "can't be embedded" state, which is the honest
 * answer there.
 */
const SHOWCASE_PAGES: Record<string, string> = {
    diagram: "/showcase-assets/file-viewer/diagram.svg",
};

let registered = false;
function registerShowcaseProvider(): void {
    if (registered) {
        return;
    }
    registered = true;
    registerEmbedProvider({
        id: "showcase",
        title: "this site",
        embedUrl: (source) => {
            const path = SHOWCASE_PAGES[source.id];
            if (!path || typeof window === "undefined") {
                return null;
            }
            return `${window.location.origin}${path}`;
        },
    });
}
registerShowcaseProvider();

export const SHOWCASE_SOURCE: EmbedSource = { type: "embed", provider: "showcase", id: "diagram" };
export const SHOWCASE_POSTER = "/showcase-shots/fancy-slides.png";

export function MediaEmbedExample({ source = SHOWCASE_SOURCE }: { source?: EmbedSource }) {
    const [playing, setPlaying] = useState(false);
    const [error, setError] = useState(false);
    return (
        <div className="w-full max-w-xl space-y-2">
            <MediaEmbed
                source={source}
                playing={playing}
                onPlayingChange={setPlaying}
                title="A diagram"
                poster={SHOWCASE_POSTER}
                onError={() => setError(true)}
            />
            <Text size="sm" className="font-mono">
                playing: {String(playing)}
                {error ? ", onError fired" : ""}
            </Text>
        </div>
    );
}

export const mediaEmbedDoc: ComponentDoc = {
    intro: (
        <p>
            A provider's own player in an iframe: YouTube (on the privacy-enhanced youtube-nocookie.com host), Vimeo, Twitch, or
            a provider you add with <code>registerEmbedProvider</code>. Nothing loads from the provider until it is played: until
            then it is a poster with a play button, so a page that shows an embed makes no request to the provider.
        </p>
    ),
    examples: [
        {
            name: "A provider of your own",
            description:
                "This provider embeds a file this site serves, so the demo calls no third party. Press play: the first playing=true loads the iframe; onPlayingChange is the poster asking to play.",
            render: () => <MediaEmbedExample />,
            code: `registerEmbedProvider({
    id: "owncast",
    title: "Owncast",
    embedUrl: (s) => (/^[a-z0-9-]+$/.test(s.id) ? \`https://live.example.com/embed/video?stream=\${s.id}\` : null),
});

const [playing, setPlaying] = useState(false);

<MediaEmbed
    source={{ type: "embed", provider: "owncast", id: "main" }}
    playing={playing}
    onPlayingChange={setPlaying}
    title="Main stage"
    poster="/images/main-stage.webp"
/>`,
        },
        {
            name: "The built-in providers",
            description: "YouTube takes the 11-character video id, Vimeo a numeric id, Twitch a channel name. YouTube and Vimeo are driven through their postMessage APIs; Twitch is not.",
            render: () => (
                <Text size="sm" color="muted">
                    Not loaded here: this site embeds no third-party player. The code below is the whole integration.
                </Text>
            ),
            code: `<MediaEmbed source={{ type: "embed", provider: "youtube", id: "VIDEO_ID_11" }} playing={playing} onPlayingChange={setPlaying} />
<MediaEmbed source={{ type: "embed", provider: "vimeo", id: "123456789" }} playing={playing} onPlayingChange={setPlaying} />
<MediaEmbed source={{ type: "embed", provider: "twitch", id: "your_channel" }} playing={playing} onPlayingChange={setPlaying} />`,
        },
        {
            name: "A provider it does not know",
            description: "An unknown provider, or an id the provider refuses, shows the unsupported label and fires onError. labels translate both strings.",
            render: () => (
                <div className="w-full max-w-xl">
                    <MediaEmbed
                        source={{ type: "embed", provider: "nobody", id: "x" }}
                        playing={false}
                        labels={{ play: "Reproducir {title} en {provider}", unsupported: "Este vídeo no se puede insertar." }}
                    />
                </div>
            ),
            code: `<MediaEmbed
    source={{ type: "embed", provider: "nobody", id: "x" }}
    playing={false}
    onError={() => console.warn("not embeddable")}
    labels={{ play: "Reproducir {title} en {provider}", unsupported: "Este vídeo no se puede insertar." }}
/>`,
        },
    ],
    props: [
        { name: "source", type: `{ type: "embed", provider, id, params? }`, default: "—", description: "Which provider, and its id.", required: true },
        { name: "playing", type: "boolean", default: "—", description: "The first true loads the player, autoplaying; after that it drives play / pause where the provider allows.", required: true },
        { name: "onPlayingChange", type: "(playing) => void", default: "—", description: "The poster asks to play." },
        { name: "title", type: "string", default: "the provider's name", description: "The iframe title and the poster's name." },
        { name: "poster", type: "string", default: "—", description: "Shown before the player loads. Host it yourself." },
        { name: "onError", type: "() => void", default: "—", description: "Unknown provider, or an id it does not accept." },
        { name: "labels", type: "Partial<MediaEmbedLabels>", default: "English", description: "play (slots {title}, {provider}), unsupported." },
    ],
    notes: (
        <ul>
            <li>
                The iframe is sandboxed (<code>allow-scripts allow-same-origin allow-presentation allow-popups</code>), sends{" "}
                <code>strict-origin-when-cross-origin</code> referrers, and its URL must be <code>https:</code>.
            </li>
            <li>
                Handles: <code>data-react-fancy-media-embed</code>, <code>data-embed-provider</code>, <code>data-embed-loaded</code>,{" "}
                <code>data-embed-poster</code>, <code>data-embed-error</code>.
            </li>
        </ul>
    ),
};
