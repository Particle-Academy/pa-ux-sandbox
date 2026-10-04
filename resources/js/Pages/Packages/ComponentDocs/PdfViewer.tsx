import type { ComponentDoc } from "./types";
import { PdfViewer } from "@particle-academy/react-fancy";

const SAMPLE = "/showcase-assets/file-viewer/sample.pdf";

export const pdfViewerDoc: ComponentDoc = {
    intro: (
        <p>
            A PDF embedded through the browser&rsquo;s own viewer. Four props and no
            rendering engine — deliberately. Shipping a JS PDF renderer would add megabytes
            to every consumer&rsquo;s bundle to reproduce something every target browser
            already does well, and would then owe its own security updates. If you need
            page-level control — annotations, text extraction, a custom toolbar — that is a
            different component and a real dependency decision, not a prop on this one.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description:
                "A source and a height. The toolbar, pagination, zoom and text selection are the browser's.",
            render: () => (
                <div className="h-96 w-full overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                    <PdfViewer src={SAMPLE} style={{ height: "100%" }} />
                </div>
            ),
            code: `<div className="h-96">
    <PdfViewer src="/docs/invoice.pdf" style={{ height: "100%" }} />
</div>`,
        },
        {
            name: "With a title",
            description:
                "title is the accessible name of the embedded document, which is what a screen reader announces when focus enters the frame. The default, \"PDF document\", tells a listener nothing about which one.",
            render: () => (
                <div className="h-96 w-full overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                    <PdfViewer
                        src={SAMPLE}
                        title="Invoice 2026-0042 — Particle Academy"
                        style={{ height: "100%" }}
                    />
                </div>
            ),
            code: `<PdfViewer src={invoice.url} title={\`Invoice \${invoice.number}\`} />`,
        },
        {
            name: "Sizing it",
            description:
                "The viewer fills its container, so the height comes from you — a fixed height for an inline preview, or 100% inside a flex column for a full-page reader.",
            render: () => (
                <div className="h-48 w-full overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                    <PdfViewer
                        src={SAMPLE}
                        title="Short inline preview"
                        style={{ height: "100%" }}
                    />
                </div>
            ),
            code: `{/* Inline preview in a card. */}
<div className="h-48">
    <PdfViewer src={src} style={{ height: "100%" }} />
</div>

{/* Full-height reader. */}
<div className="flex h-screen flex-col">
    <Toolbar />
    <PdfViewer src={src} className="flex-auto" />
</div>`,
        },
        {
            name: "From a blob",
            description:
                "A PDF generated in the browser — by last-word, holy-sheet or dark-slide, say — is a Blob. Make an object URL for it and revoke it when you are done, or the buffer stays alive for the life of the document.",
            render: () => (
                <div className="w-full rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                    Nothing to render here — the pattern is in the code below, because a live
                    example would have to generate a PDF on every page view.
                </div>
            ),
            code: `const [url, setUrl] = useState<string>();

useEffect(() => {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);

    // Without this the buffer is held for the life of the document.
    return () => URL.revokeObjectURL(objectUrl);
}, [bytes]);

{url && <PdfViewer src={url} title="Generated report" />}`,
        },
    ],
    props: [
        { name: "src", type: `string`, default: "—", description: "PDF source — an `http(s):`, `data:` or `blob:` URL.", required: true },
        { name: "title", type: `string`, default: `"PDF document"`, description: "Accessible title for the embedded document." },
        { name: "className", type: `string`, default: "—", description: "Additional classes for the container." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles — in practice, the height." },
    ],
    notes: (
        <ul>
            <li>
                <strong>The browser renders it, not us.</strong> So the toolbar, the
                keyboard shortcuts and the print behaviour are the browser&rsquo;s, and they
                differ between Chrome, Safari and Firefox. That is a real trade and worth
                knowing before you build a workflow around a particular toolbar button.
            </li>
            <li>
                Give the container a height. With none, the frame collapses and the document
                appears blank — which reads as a broken file rather than a layout problem.
            </li>
            <li>
                A cross-origin PDF needs the serving host to allow framing. A{" "}
                <code>X-Frame-Options: DENY</code> on the file&rsquo;s origin produces an
                empty frame with no error you can catch here.
            </li>
        </ul>
    ),
};
