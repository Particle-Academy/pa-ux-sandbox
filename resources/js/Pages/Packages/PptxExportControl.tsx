import { Button, Dropdown } from "@particle-academy/react-fancy";
// The Node/TS port of dark-slide — the pptx writer running in the browser,
// byte-identical to the PHP engine. This control is injected into DeckEditor's
// toolbar via `toolbarExtra` to demonstrate customizing the editor chrome: pick
// which writer renders the deck on export.
import { Agent as NodeDarkSlide } from "@particle-academy/dark-slide";

type AnyDeck = { title?: string } & Record<string, unknown>;

/**
 * Inline image/background sources as data URIs before export. Neither writer
 * fetches remote/relative images (the Node one can't fetch synchronously in the
 * browser; the PHP one treats a web path as a missing local file) — so the host
 * resolves them here. The browser can fetch same-origin assets, and data URIs
 * embed identically in both engines, so this both fixes the images AND keeps the
 * PHP/Node output byte-for-byte identical. Unfetchable sources are left as-is
 * (the writer then emits its placeholder), so this never throws.
 */
export async function inlineImages(deck: AnyDeck): Promise<AnyDeck> {
    const clone: AnyDeck = structuredClone(deck);

    const toDataUri = async (src: unknown): Promise<string | null> => {
        if (typeof src !== "string" || src === "" || src.startsWith("data:")) {
            return typeof src === "string" ? src : null;
        }
        try {
            const res = await fetch(src);
            if (!res.ok) return src;
            const blob = await res.blob();
            return await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch {
            return src; // leave original; writer emits its placeholder
        }
    };

    const tasks: Promise<void>[] = [];
    for (const slide of (clone.slides as Record<string, unknown>[] | undefined) ?? []) {
        const bg = slide.background as { image?: unknown } | undefined;
        if (bg && typeof bg.image === "string" && !bg.image.startsWith("data:")) {
            tasks.push(toDataUri(bg.image).then((d) => { if (d) bg.image = d; }));
        }
        for (const el of (slide.elements as Record<string, unknown>[] | undefined) ?? []) {
            if (el.type === "image" && typeof el.src === "string" && !el.src.startsWith("data:")) {
                tasks.push(toDataUri(el.src).then((d) => { if (d) el.src = d; }));
            }
        }
    }
    await Promise.all(tasks);
    return clone;
}

/**
 * Toolbar export-writer picker for DeckEditor. Drop it into `toolbarExtra`.
 * Exports the current deck to .pptx via either the Node engine (browser) or the
 * PHP engine (server `/dark-slide/export`) — both produce byte-identical output.
 */
export function PptxExportControl({ deck }: { deck: AnyDeck }) {
    const filename = () => (deck.title || "deck").replace(/[^\w-]+/g, "_") + ".pptx";

    const download = (bytes: Uint8Array, name: string) => {
        const blob = new Blob([bytes.slice()], {
            type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const exportNode = async () => {
        try {
            const ready = await inlineImages(deck);
            download(NodeDarkSlide.toBytes(ready), filename());
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Node pptx export failed", e);
        }
    };

    const exportPhp = async () => {
        try {
            const ready = await inlineImages(deck);
            const res = await fetch("/dark-slide/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deck: ready, filename: filename() }),
            });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText);
            download(new Uint8Array(await res.arrayBuffer()), filename());
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("PHP pptx export failed", e);
        }
    };

    return (
        <Dropdown placement="bottom-end">
            <Dropdown.Trigger>
                <Button variant="ghost" size="sm" icon="download" iconTrailing="chevron-down">
                    Export .pptx
                </Button>
            </Dropdown.Trigger>
            <Dropdown.Items>
                <Dropdown.Item icon="globe" onClick={exportNode}>
                    Node — browser (dark-slide-js)
                </Dropdown.Item>
                <Dropdown.Item icon="server" onClick={exportPhp}>
                    PHP — server (dark-slide)
                </Dropdown.Item>
            </Dropdown.Items>
        </Dropdown>
    );
}
