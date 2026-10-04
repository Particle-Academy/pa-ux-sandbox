import type { ComponentDoc } from "./types";
import { MediaViewer, Text } from "@particle-academy/react-fancy";

const IMAGE = "/showcase-shots/fancy-artboard.png";
const AUDIO = "/showcase-assets/audio/make-it-fancy.mp3";
const PDF = "/showcase-assets/file-viewer/sample.pdf";
const SVG = "/showcase-assets/file-viewer/diagram.svg";

function Box({ children, tall }: { children: React.ReactNode; tall?: boolean }) {
    return (
        <div
            className={`w-full overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800 ${
                tall ? "h-80" : "h-56"
            }`}
        >
            {children}
        </div>
    );
}

export const mediaViewerDoc: ComponentDoc = {
    intro: (
        <p>
            One component for a file whose type you do not know yet. It picks the viewer —{" "}
            <code>ImageViewer</code>, <code>VideoViewer</code>, <code>AudioViewer</code> or{" "}
            <code>PdfViewer</code> — from the MIME type, or by sniffing the source when no
            MIME is given, and falls back to a download card for anything it cannot preview.
            The shape a file browser or an attachment list needs, where branching on
            extension in the caller is the thing you are trying to avoid.
        </p>
    ),
    examples: [
        {
            name: "Detected from the source",
            description:
                "With no mime, the kind is sniffed from the extension. Four different files, one component, four different viewers.",
            render: () => (
                <div className="w-full space-y-4">
                    <div>
                        <Text className="mb-1 text-xs font-medium text-zinc-500">
                            .png → ImageViewer
                        </Text>
                        <Box>
                            <MediaViewer src={IMAGE} alt="Screenshot" style={{ height: "100%" }} />
                        </Box>
                    </div>
                    <div>
                        <Text className="mb-1 text-xs font-medium text-zinc-500">
                            .mp3 → AudioViewer
                        </Text>
                        <MediaViewer src={AUDIO} alt="Make It Fancy" />
                    </div>
                    <div>
                        <Text className="mb-1 text-xs font-medium text-zinc-500">
                            .pdf → PdfViewer
                        </Text>
                        <Box>
                            <MediaViewer src={PDF} alt="Sample document" style={{ height: "100%" }} />
                        </Box>
                    </div>
                </div>
            ),
            code: `{/* Whatever the file is, this renders the right viewer. */}
<MediaViewer src={file.url} alt={file.name} />`,
        },
        {
            name: "Pass the MIME type when you have it",
            description:
                "mime is preferred over sniffing, because an extension is a guess and a Content-Type is a statement. Always pass it with a bare blob: URL, which carries no type of its own and would otherwise fall through to the download card.",
            render: () => (
                <Box>
                    <MediaViewer
                        src={SVG}
                        mime="image/svg+xml"
                        alt="Diagram"
                        style={{ height: "100%" }}
                    />
                </Box>
            ),
            code: `<MediaViewer src={file.url} mime={file.contentType} alt={file.name} />

{/* A blob carries no type — sniffing cannot help here. */}
<MediaViewer src={objectUrl} mime="application/pdf" />`,
        },
        {
            name: "Forcing a viewer",
            description:
                "kind bypasses detection entirely — for the cases where the server lies about Content-Type, or the URL has no extension because it is a signed download link.",
            render: () => (
                <Box>
                    <MediaViewer
                        src={IMAGE}
                        kind="image"
                        alt="Forced to the image viewer"
                        style={{ height: "100%" }}
                    />
                </Box>
            ),
            code: `{/* A signed URL with no extension, served as application/octet-stream. */}
<MediaViewer src={signedUrl} kind="image" alt={file.name} />`,
        },
        {
            name: "Configuring the viewer it picks",
            description:
                "imageProps, videoProps, audioProps and pdfProps are forwarded to whichever viewer wins. src and alt are already owned by MediaViewer, so they are omitted from each — there is no way to set them twice and have the two disagree.",
            render: () => (
                <Box tall>
                    <MediaViewer
                        src={IMAGE}
                        alt="Opens zoomed, no checkerboard"
                        imageProps={{
                            fit: "cover",
                            checkerboard: false,
                            defaultViewport: { panX: 0, panY: 0, zoom: 1.5 },
                        }}
                        style={{ height: "100%" }}
                    />
                </Box>
            ),
            code: `<MediaViewer
    src={file.url}
    alt={file.name}
    imageProps={{ fit: "cover", maxZoom: 16 }}
    audioProps={{ preload: "none" }}
    videoProps={{ muted: true, loop: true }}
    pdfProps={{ title: file.name }}
/>`,
        },
        {
            name: "The fallback",
            description:
                "Anything it cannot preview gets a download card by default. Pass fallback to replace it — with your own card, an upsell to a converter, or a message that names the type.",
            render: () => (
                <div className="w-full space-y-4">
                    <div>
                        <Text className="mb-1 text-xs font-medium text-zinc-500">
                            default — a download card
                        </Text>
                        <MediaViewer src="/showcase-assets/archive.zip" alt="archive.zip" />
                    </div>
                    <div>
                        <Text className="mb-1 text-xs font-medium text-zinc-500">
                            custom fallback
                        </Text>
                        <MediaViewer
                            src="/showcase-assets/model.step"
                            alt="model.step"
                            fallback={
                                <div className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                                    No preview for STEP files — open it in your CAD tool.
                                </div>
                            }
                        />
                    </div>
                </div>
            ),
            code: `<MediaViewer
    src={file.url}
    alt={file.name}
    fallback={<UnsupportedType name={file.name} />}
/>`,
        },
        {
            name: "In a file list",
            description:
                "What the component is for: the caller never branches on type. Add a format next week and the list renders it without a change here.",
            render: () => {
                const files = [
                    { url: IMAGE, name: "artboard.png" },
                    { url: AUDIO, name: "make-it-fancy.mp3" },
                ];

                return (
                    <div className="w-full space-y-4">
                        {files.map((file) => (
                            <div key={file.name}>
                                <Text className="mb-1 text-xs font-medium text-zinc-500">
                                    {file.name}
                                </Text>
                                <MediaViewer
                                    src={file.url}
                                    alt={file.name}
                                    imageProps={{ zoomable: false }}
                                    audioProps={{ preload: "none" }}
                                    style={{ height: 160 }}
                                />
                            </div>
                        ))}
                    </div>
                );
            },
            code: `{files.map((file) => (
    <MediaViewer
        key={file.id}
        src={file.url}
        mime={file.contentType}
        alt={file.name}
        audioProps={{ preload: "none" }}
    />
))}`,
        },
    ],
    props: [
        { name: "src", type: `string`, default: "—", description: "Media source — an `http(s):`, `data:` or `blob:` URL.", required: true },
        { name: "mime", type: `string`, default: "—", description: "MIME type, preferred over sniffing. Always pass it with a bare `blob:` URL." },
        { name: "alt", type: `string`, default: "—", description: "Alt text / label, forwarded as image alt and audio/PDF title." },
        { name: "kind", type: `MediaKind`, default: "—", description: "Force a specific viewer, bypassing detection." },
        { name: "imageProps", type: `Partial<Omit<ImageViewerProps, "src" | "alt">>`, default: "—", description: "Extra props for the underlying `ImageViewer`." },
        { name: "videoProps", type: `Partial<Omit<VideoViewerProps, "src">>`, default: "—", description: "Extra props for the underlying `VideoViewer`." },
        { name: "audioProps", type: `Partial<Omit<AudioViewerProps, "src">>`, default: "—", description: "Extra props for the underlying `AudioViewer`." },
        { name: "pdfProps", type: `Partial<Omit<PdfViewerProps, "src">>`, default: "—", description: "Extra props for the underlying `PdfViewer`." },
        { name: "fallback", type: `ReactNode`, default: "a download card", description: "Rendered for unknown or unpreviewable types." },
        { name: "onError", type: `() => void`, default: "—", description: "Fired when the chosen viewer reports a load error." },
        { name: "className", type: `string`, default: "—", description: "Additional classes, forwarded to the chosen viewer." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles, forwarded to the chosen viewer." },
    ],
    notes: (
        <ul>
            <li>
                Detection order: <code>kind</code> if given, then <code>mime</code>, then a
                sniff of <code>src</code>. The first two are statements and the third is a
                guess — prefer a statement whenever the server gave you one.
            </li>
            <li>
                The <code>*Props</code> objects omit <code>src</code> (and{" "}
                <code>alt</code> for images) on purpose. Two props writing one value is how
                they end up disagreeing.
            </li>
            <li>
                Sizing is inherited from whichever viewer wins — the image, video and PDF
                viewers all fill their container, so give it a height. Audio does not.
            </li>
        </ul>
    ),
};
