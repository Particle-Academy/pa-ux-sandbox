import { Action, Dropdown } from "@particle-academy/react-fancy";
// The Node/TS port of dark-slide — the pptx writer running in the browser,
// byte-identical to the PHP engine. This control is injected into DeckEditor's
// toolbar via `toolbarExtra` to demonstrate customizing the editor chrome: pick
// which writer renders the deck on export.
import { Agent as NodeDarkSlide } from "@particle-academy/dark-slide";

/**
 * Toolbar export-writer picker for DeckEditor. Drop it into `toolbarExtra`.
 * Exports the current deck to .pptx via either the Node engine (browser) or the
 * PHP engine (server `/dark-slide/export`) — both produce byte-identical output.
 */
export function PptxExportControl({ deck }: { deck: { title?: string } & Record<string, unknown> }) {
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

    const exportNode = () => {
        try {
            download(NodeDarkSlide.toBytes(deck), filename());
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Node pptx export failed", e);
        }
    };

    const exportPhp = async () => {
        try {
            const res = await fetch("/dark-slide/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deck, filename: filename() }),
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
                <Action variant="ghost" size="sm" icon="download" iconTrailing="chevron-down">
                    Export .pptx
                </Action>
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
