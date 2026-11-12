import { useState } from "react";
import type { ComponentDoc } from "./types";
import { Button, Card, FileUpload, ImagePill, ImageViewer, Text } from "@particle-academy/react-fancy";

const SHOT = "/showcase-shots/fancy-artboard.png";

/** Resolves after a short delay, so the loading state is visible. */
function slowThumbnail(): Promise<string> {
    return new Promise((resolve) => setTimeout(() => resolve(SHOT), 900));
}

function failingThumbnail(): Promise<string> {
    return new Promise((_, reject) => setTimeout(() => reject(new Error("gone")), 600));
}

function ControlledPill() {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex w-full max-w-md flex-wrap items-center gap-3">
            <ImagePill label="dashboard.png" src={SHOT} open={open} onOpenChange={setOpen} placement="right" />
            <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
                {open ? "Close preview" : "Open preview"}
            </Button>
            <Text size="xs">open: {String(open)}</Text>
        </div>
    );
}

export const imagePillDoc: ComponentDoc = {
    intro: (
        <p>
            The image attachment pill from <code>Composer</code> and <code>PromptInput</code>, with
            its thumbnail preview, exported so a thread can show the same pill on a message that
            has already been sent. The preview opens on hover <strong>and</strong> on keyboard
            focus, and closes on blur or Escape. The composers draw their pills with this
            component, so the three cannot drift apart.
        </p>
    ),
    examples: [
        {
            name: "On a sent message",
            description:
                "label is the pill's text, the thumbnail's alt and its accessible name; src is the thumbnail URL. Hover or Tab to the pill.",
            render: () => (
                <Card className="w-full max-w-md p-4">
                    <Text size="sm">Here is the layout bug I mentioned.</Text>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <ImagePill label="Pasted image 1" src={SHOT} />
                        <ImagePill label="artboard.png" src={SHOT} />
                    </div>
                </Card>
            ),
            code: `<ImagePill label="Pasted image 1" src={attachment.thumbnailUrl} />`,
        },
        {
            name: "Lazy thumbnail, loading and error",
            description:
                "loadThumbnail is called once, on the first hover or focus, never on render or on the server, so a thread of fifty attachments fetches nothing until someone looks. Pending shows labels.loading; a rejection shows labels.error and is not retried.",
            render: () => (
                <div className="flex w-full max-w-md flex-wrap gap-2">
                    <ImagePill label="report.png (slow)" loadThumbnail={slowThumbnail} />
                    <ImagePill
                        label="deleted.png"
                        loadThumbnail={failingThumbnail}
                        labels={{ loading: "Vorschau wird geladen…", error: "Keine Vorschau" }}
                    />
                </div>
            ),
            code: `<ImagePill
    label="report.png"
    loadThumbnail={() => api.signedThumbnailUrl(attachment.id)}
    labels={{ loading: "Vorschau wird geladen…", error: "Keine Vorschau" }}
/>`,
        },
        {
            name: "From a File",
            description:
                "file takes a File or Blob, such as one the person just picked. Its object URL exists only while the preview is open, and is revoked when it closes.",
            render: () => <FilePill />,
            code: `<ImagePill label={file.name} file={file} />`,
        },
        {
            name: "Controlled open state",
            description:
                "open + onOpenChange let the host, or an agent, show the preview. defaultOpen is the uncontrolled starting state. placement sets where it opens; it flips when there is no room.",
            render: () => <ControlledPill />,
            code: `const [open, setOpen] = useState(false);

<ImagePill label="dashboard.png" src={url} open={open} onOpenChange={setOpen} placement="right" />
<ImagePill label="hero.png" src={url} defaultOpen />`,
        },
        {
            name: "Your own preview",
            description:
                "preview replaces the thumbnail with any content. previewClassName styles the panel and previewProps reaches the content's wrapper, for a data-* handle of your own.",
            render: () => (
                <div className="w-full max-w-md">
                    <ImagePill
                        label="chart.png"
                        src={SHOT}
                        previewClassName="max-w-xs"
                        previewProps={{ "data-demo": "image-pill-custom-preview" }}
                        preview={
                            <div className="w-56 p-2">
                                <ImageViewer src={SHOT} alt="chart.png" aspectRatio="16 / 10" zoomable={false} pannable={false} checkerboard={false} />
                                <Text size="xs" className="mt-1">1280 × 800 · 214 KB</Text>
                            </div>
                        }
                    />
                </div>
            ),
            code: `<ImagePill
    label="chart.png"
    src={url}
    previewClassName="max-w-xs"
    previewProps={{ "data-attachment-id": attachment.id }}
    preview={<AttachmentDetails attachment={attachment} />}
/>`,
        },
    ],
    props: [
        { name: "label", type: `string`, default: "—", description: "The pill's text, the thumbnail's `alt` and the accessible name.", required: true },
        { name: "src", type: `string`, default: "—", description: "Thumbnail URL. Wins over `file` and `loadThumbnail`." },
        { name: "file", type: `Blob | null`, default: "—", description: "A File or Blob to preview; its object URL lives only while the preview is open." },
        { name: "loadThumbnail", type: `() => Promise<string>`, default: "—", description: "Fetch the thumbnail URL once, on the first hover or focus." },
        { name: "open", type: `boolean`, default: "—", description: "Preview open state, controlled." },
        { name: "defaultOpen", type: `boolean`, default: `false`, description: "Starting open state, uncontrolled." },
        { name: "onOpenChange", type: `(open: boolean) => void`, default: "—", description: "Hover, focus, blur or Escape asks to open or close." },
        { name: "placement", type: `Placement`, default: `"top"`, description: "Where the preview opens. Flips when there is no room." },
        { name: "preview", type: `ReactNode`, default: "the thumbnail", description: "Replaces the preview's content." },
        { name: "previewClassName", type: `string`, default: "—", description: "Merged onto the preview panel's classes." },
        { name: "previewProps", type: `HTMLAttributes<HTMLSpanElement>`, default: "—", description: "Attributes for the preview content's wrapper." },
        { name: "labels", type: `{ loading?, error? }`, default: "English", description: "Words shown while loading and on failure." },
    ],
    notes: (
        <p>
            Handles: <code>data-react-fancy-image-pill</code> on the pill, with{" "}
            <code>data-state</code> (open or closed) and <code>data-thumbnail</code>{" "}
            (<code>none</code>, <code>idle</code>, <code>loading</code>, <code>ready</code>,{" "}
            <code>error</code>), plus <code>-preview</code>, <code>-loading</code> and{" "}
            <code>-error</code>. Also at <code>@particle-academy/react-fancy/image-pill</code>.
        </p>
    ),
};

function FilePill() {
    const [files, setFiles] = useState<File[]>([]);
    const file = files[0] ?? null;

    return (
        <div className="flex w-full max-w-md flex-col gap-3">
            <FileUpload value={files} onChange={setFiles} accept="image/*">
                <FileUpload.Dropzone />
            </FileUpload>
            {file ? <ImagePill label={file.name} file={file} /> : <Text size="xs">Pick an image to see its pill.</Text>}
        </div>
    );
}
