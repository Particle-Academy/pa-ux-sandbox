import { useState } from "react";
import type { ComponentDoc } from "./types";
import { Badge, PdfViewer } from "@particle-academy/react-fancy";

const SAMPLE = "/showcase-assets/file-viewer/sample.pdf";

// Demo page images. In an app these come from the server, rendered behind its
// own auth -- the raw PDF never reaches the browser.
const PAGES = { count: 4, url: (page: number) => `/showcase-assets/file-viewer/pages/${page}.png` };

export const pdfViewerDoc: ComponentDoc = {
    intro: (
        <p>
            Two ways to show a PDF. With <code>src</code>, the browser&rsquo;s own viewer
            renders the file -- its toolbar, its download and print buttons. With{" "}
            <code>pages</code>, your server renders each page to an image behind your own
            auth and the viewer only shows those: the PDF itself never reaches the browser,
            and a <code>policy</code> and <code>watermark</code> apply. No PDF engine ships in
            the browser either way.
        </p>
    ),
    examples: [
        {
            name: "Secure page images",
            description:
                "pages gives a count and a url(page, scale) for each page image -- served by your app behind its auth, so the PDF is never downloadable. policy turns off download, print and copy and blurs on tab-away (screenshot: \"deter\"); watermark tiles the viewer's name over each page. Page and zoom are controllable: defaultPage, defaultZoom, onPageChange, onZoomChange.",
            render: () => (
                <div className="h-[32rem] w-full">
                    <PdfViewer
                        pages={PAGES}
                        title="Contract (page images)"
                        defaultPage={1}
                        defaultZoom={1}
                        onPageChange={() => {}}
                        onZoomChange={() => {}}
                        policy={{ download: false, print: false, copy: false, screenshot: "deter" }}
                        watermark={{ text: "Viewed by ada@example.com", opacity: 0.12 }}
                        style={{ height: "100%" }}
                        frame
                    />
                </div>
            ),
            code: `<PdfViewer
    pages={{ count: doc.pageCount, url: (page, scale) => route("docs.page", { doc, page, scale }) }}
    defaultPage={1}
    onPageChange={(page) => track(page)}
    defaultZoom={1}
    onZoomChange={(zoom) => remember(zoom)}
    policy={{ download: false, print: false, copy: false, screenshot: "deter" }}
    watermark={{ text: \`Viewed by \${user.email}\`, opacity: 0.12 }}
    style={{ height: "100%" }}
    frame
/>`,
        },
        {
            name: "A page that fails to load",
            description:
                "When the server refuses a page image (an incomplete render, a file too large, a revoked file), that page says so and offers Retry; the rest of the document still shows. Retry asks for the same url again, so a signed URL stays valid. onPageError reports each failure, and renderPageError replaces the message. Page 3 here points at an image that does not exist.",
            render: () => {
                function Failing() {
                    const [failures, setFailures] = useState<number[]>([]);
                    const pages = {
                        count: 4,
                        url: (page: number) =>
                            page === 3 ? "/showcase-assets/file-viewer/pages/missing-3.png" : `/showcase-assets/file-viewer/pages/${page}.png`,
                    };
                    return (
                        <div className="flex h-[32rem] w-full flex-col gap-2">
                            <div className="flex gap-2">
                                <Badge color={failures.length ? "rose" : "zinc"}>
                                    {failures.length ? `failed: page ${[...new Set(failures)].join(", ")}` : "no failures yet"}
                                </Badge>
                            </div>
                            <div className="min-h-0 flex-1">
                                <PdfViewer
                                    pages={pages}
                                    title="Contract (one page missing)"
                                    defaultPage={3}
                                    onPageError={(page) => setFailures((f) => [...f, page])}
                                    style={{ height: "100%" }}
                                />
                            </div>
                        </div>
                    );
                }

                return <Failing />;
            },
            code: `<PdfViewer
    pages={{ count, url: (page, scale) => route("docs.page", { doc, page, scale }) }}
    onPageError={(page, { scale, url }) => report("pdf page failed", { page, scale })}
    // optional: your own message, inside the same page box
    renderPageError={({ page, retry }) => (
        <Button size="sm" onClick={retry}>Page {page} is still being prepared. Try again</Button>
    )}
/>`,
        },
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
            name: "In the file-viewer frame",
            description:
                "frame puts the PDF in react-fancy's FauxClient frame with its title in the address bar; hover the bar for full screen. Zoom stays on the browser's PDF toolbar, which knows the page size. frameProps reaches the frame.",
            render: () => (
                <div className="h-96 w-full">
                    <PdfViewer src={SAMPLE} title="sample.pdf" style={{ height: "100%" }} frame frameProps={{ onFullscreenChange: () => {} }} />
                </div>
            ),
            code: `<div className="h-96">
    <PdfViewer src="/docs/invoice.pdf" title="invoice.pdf" style={{ height: "100%" }} frame />
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
        { name: "src", type: `string`, default: "—", description: "PDF source — an `http(s):`, `data:` or `blob:` URL. Ignored (and never exposed) when `pages` is set." },
        { name: "pages", type: `{ count: number; url: (page, scale) => string; aspectRatio?: number }`, default: "—", description: "Page images served by your app. The viewer never requests a PDF; `scale` is zoom × device pixel ratio, rounded to 1, 1.5, 2, 3 or 4." },
        { name: "policy", type: `{ download?; print?; copy?: boolean; screenshot?: "allow" | "deter" }`, default: "all allowed", description: "Deterrents only: a web page cannot prevent screenshots, and real download protection is never serving the PDF. Page-image mode only." },
        { name: "watermark", type: `{ text: string; opacity?; angle?; density?: number }`, default: "—", description: "A tiled overlay drawn in the browser. Burn it into the images server-side when it has to hold." },
        { name: "onPageError", type: `(page: number, info: { scale; url }) => void`, default: "—", description: "A page image failed to load. An `<img>` cannot see the HTTP status, so 422, 413 and 404 arrive alike. Page-image mode only." },
        { name: "renderPageError", type: `(ctx: { page; scale; url; retry }) => ReactNode`, default: "the message + Retry", description: "What a failed page shows, inside its own box at its size. `retry()` asks for the same url again." },
        { name: "defaultPage", type: `number`, default: `1`, description: "Initial page (1-based), uncontrolled." },
        { name: "onPageChange", type: `(page: number) => void`, default: "—", description: "Called as the current page changes; pair with `page` to control it." },
        { name: "defaultZoom", type: `number`, default: `1`, description: "Initial zoom; 1 fits the width, 0.25 to 4." },
        { name: "onZoomChange", type: `(zoom: number) => void`, default: "—", description: "Called as the zoom changes; pair with `zoom` to control it." },
        { name: "title", type: `string`, default: `"PDF document"`, description: "Accessible title for the embedded document." },
        { name: "className", type: `string`, default: "—", description: "Additional classes for the container." },
        { name: "frame", type: `boolean`, default: `false`, description: "Show the PDF in the FauxClient frame, title in the bar, full screen on hover." },
        { name: "frameProps", type: `Partial<FauxClientProps>`, default: "—", description: "Passed to the frame: `variant`, `onFullscreenChange`, …" },
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
