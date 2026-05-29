import { useEffect, useMemo, useState } from "react";
import { Action, Badge, Card, Heading, Tabs, Text, Textarea, Toast, useToast } from "@particle-academy/react-fancy";
import { Slide, defaultTheme, type Deck } from "@particle-academy/fancy-slides";
import { defaultElementRegistry } from "@particle-academy/fancy-slides/registry";
import "@particle-academy/fancy-slides/styles.css";

/**
 * Demo for `dark-slide` — the PHP pptx writer. Mirrors the holy-sheet
 * "edit JSON → export real file" pattern: a controlled JSON textarea
 * on the left, a live `<Slide>` preview on the right, and a "Download
 * .pptx" button that POSTs to the Laravel route which calls
 * `DarkSlide\Agent::toBytes()`.
 */

const sampleDeck: Deck = {
    id: "dark-slide-demo",
    title: "DarkSlide demo",
    theme: defaultTheme,
    slides: [
        {
            id: "s1",
            layout: "title-content",
            transition: { kind: "fade", duration: 500 },
            elements: [
                {
                    id: "h",
                    type: "text",
                    x: 0.08,
                    y: 0.08,
                    w: 0.84,
                    h: 0.14,
                    content: "DarkSlide → PPTX",
                    format: "plain",
                    style: { fontSize: 44, weight: "semibold" },
                },
                {
                    id: "body",
                    type: "text",
                    x: 0.08,
                    y: 0.28,
                    w: 0.55,
                    h: 0.6,
                    content:
                        "Edit the JSON on the left.\n\nThe live preview updates.\n\nClick **Download .pptx** to round-trip the deck through `DarkSlide\\Agent::toBytes()` and save a real `.pptx`.",
                    format: "markdown",
                    style: { fontSize: 20, lineHeight: 1.6 },
                },
                {
                    id: "tbl",
                    type: "table",
                    x: 0.66,
                    y: 0.28,
                    w: 0.28,
                    h: 0.4,
                    columns: [
                        { key: "feature", label: "Feature" },
                        { key: "status", label: "Status" },
                    ],
                    rows: [
                        { feature: "Tables", status: "shipped" },
                        { feature: "Gradients", status: "shipped" },
                        { feature: "Charts", status: "v0.3" },
                    ],
                },
            ],
            background: { gradient: "linear-gradient(135deg, #faf5ff 0%, #ffffff 60%)" },
        },
        {
            id: "s2",
            layout: "two-column",
            transition: { kind: "slide", direction: "left", duration: 450 },
            elements: [
                {
                    id: "h2",
                    type: "text",
                    x: 0.06,
                    y: 0.07,
                    w: 0.88,
                    h: 0.1,
                    content: "## Native charts in the .pptx",
                    format: "markdown",
                    style: { fontSize: 32, weight: "semibold" },
                },
                {
                    id: "bar",
                    type: "chart",
                    x: 0.06,
                    y: 0.22,
                    w: 0.43,
                    h: 0.64,
                    option: {
                        xAxis: { data: ["Q1", "Q2", "Q3", "Q4"] },
                        series: [{ type: "bar", name: "Revenue", data: [42, 58, 71, 96] }],
                    },
                },
                {
                    id: "pie",
                    type: "chart",
                    x: 0.52,
                    y: 0.22,
                    w: 0.42,
                    h: 0.64,
                    option: {
                        series: [
                            { type: "pie", data: [{ name: "Web", value: 48 }, { name: "Mobile", value: 33 }, { name: "API", value: 19 }] },
                        ],
                    },
                },
            ],
        },
    ],
};

function DarkSlideDemoBody() {
    const [raw, setRaw] = useState(() => JSON.stringify(sampleDeck, null, 2));
    const [busy, setBusy] = useState(false);
    const { toast } = useToast();

    const parsed = useMemo(() => {
        try {
            const v = JSON.parse(raw);
            if (v && typeof v === "object") return { ok: true as const, deck: v as Deck };
            return { ok: false as const, error: "not an object" };
        } catch (e) {
            return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
        }
    }, [raw]);

    const validation = useMemo(() => {
        if (!parsed.ok) return null;
        const issues: string[] = [];
        const d = parsed.deck;
        if (typeof d.id !== "string") issues.push("/id must be a string");
        if (typeof d.title !== "string") issues.push("/title must be a string");
        if (!Array.isArray(d.slides)) issues.push("/slides must be an array");
        return issues;
    }, [parsed]);

    const download = async () => {
        if (!parsed.ok) {
            toast({ title: "Invalid JSON", description: parsed.error, variant: "error" });
            return;
        }
        setBusy(true);
        try {
            const res = await fetch("/dark-slide/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deck: parsed.deck, filename: ((parsed.deck as Deck).title || "deck") + ".pptx" }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast({ title: "Export failed", description: err.message || res.statusText, variant: "error" });
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = ((parsed.deck as Deck).title || "deck").replace(/[^\w-]+/g, "_") + ".pptx";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast({ title: "PPTX downloaded", description: "Open in PowerPoint, Keynote, or Google Slides.", variant: "success" });
        } catch (e) {
            toast({ title: "Export failed", description: e instanceof Error ? e.message : String(e), variant: "error" });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <Heading as="h1" size="lg">DarkSlide</Heading>
                        <Badge color="indigo" size="sm">PHP</Badge>
                    </div>
                    <Text className="mt-1 !text-zinc-600 dark:!text-zinc-300">
                        Edit the deck JSON on the left, see the live `&lt;Slide&gt;` preview on the right, and round-trip through `DarkSlide\\Agent::toBytes()` to download a real `.pptx` that opens in PowerPoint / Keynote / Google Slides / LibreOffice.
                    </Text>
                </div>
                <div className="flex items-center gap-2">
                    <Action size="sm" variant="ghost" onClick={() => setRaw(JSON.stringify(sampleDeck, null, 2))}>
                        Reset deck
                    </Action>
                    <Action size="sm" color="violet" icon="download" loading={busy} onClick={download}>
                        Download .pptx
                    </Action>
                </div>
            </header>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card className="overflow-hidden">
                    <Card.Header>
                        <div className="flex items-center justify-between">
                            <Text size="sm" weight="semibold">Deck JSON</Text>
                            {parsed.ok ? (
                                validation && validation.length === 0
                                    ? <Badge color="green" size="sm">valid</Badge>
                                    : <Badge color="amber" size="sm">{validation?.length} issue(s)</Badge>
                            ) : (
                                <Badge color="red" size="sm">parse error</Badge>
                            )}
                        </div>
                    </Card.Header>
                    <Textarea
                        value={raw}
                        onValueChange={setRaw}
                        rows={28}
                        className="!w-full !border-0 !font-mono !text-xs"
                    />
                </Card>

                <Card className="overflow-hidden">
                    <Card.Header>
                        <div className="flex items-center justify-between">
                            <Text size="sm" weight="semibold">Live preview</Text>
                            <Text size="xs" className="!text-zinc-500">first slide</Text>
                        </div>
                    </Card.Header>
                    <div className="border-t border-zinc-100 dark:border-zinc-800">
                        {parsed.ok && (parsed.deck as Deck).slides?.[0] ? (
                            <Slide slide={(parsed.deck as Deck).slides[0]} theme={(parsed.deck as Deck).theme} renderElement={defaultElementRegistry} />
                        ) : (
                            <div className="grid h-56 place-items-center text-sm text-zinc-500">
                                {parsed.ok ? "Empty deck" : "JSON error — see badge above"}
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <Card padding="md">
                <Tabs defaultTab="api" variant="pills">
                    <Tabs.List>
                        <Tabs.Tab value="api">PHP API</Tabs.Tab>
                        <Tabs.Tab value="route">Laravel route</Tabs.Tab>
                        <Tabs.Tab value="features">v0.4 features</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panels>
                        <Tabs.Panel value="api">
                            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                                The PHP side mirrors holy-sheet's static `Agent` surface:
                            </Text>
                            <pre className="mt-2 overflow-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100">{`use DarkSlide\\Agent;

$errors = Agent::validate($deck);          // empty list = valid
$result = Agent::write($deck, $path);      // ['path','bytes','slides']
$bytes  = Agent::toBytes($deck);           // PPTX bytes, no temp file
$deck2  = Agent::read($path);              // round-trip back to JSON
$desc   = Agent::describe($deck);          // plain-text summary
$schema = Agent::jsonSchema();             // for LLM tool registration`}</pre>
                        </Tabs.Panel>
                        <Tabs.Panel value="route">
                            <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                                The Download button POSTs to a sandbox-owned route. dark-slide itself ships no HTTP layer; apps wire their own routes against the facade:
                            </Text>
                            <pre className="mt-2 overflow-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100">{`// routes/web.php
Route::post('/dark-slide/export', DarkSlideExportController::class);

// DarkSlideExportController
use DarkSlide\\Laravel\\Facades\\DarkSlide;

$bytes = DarkSlide::toBytes($request->input('deck'));
return response($bytes, 200, [
    'Content-Type' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'Content-Disposition' => 'attachment; filename="deck.pptx"',
]);`}</pre>
                        </Tabs.Panel>
                        <Tabs.Panel value="features">
                            <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
                                <li><strong>Native charts</strong> — bar / line / area / pie / scatter as real `&lt;c:chart&gt;` parts (editable in PowerPoint), image/placeholder fallback</li>
                                <li><strong>Slide transitions</strong> — `&lt;p:transition&gt;` fade / push / zoom from `slide.transition`</li>
                                <li><strong>Images</strong> — fit (cover center-crop, contain letterbox) + explicit crop via `&lt;a:srcRect&gt;`</li>
                                <li><strong>Theme + 8 layouts</strong> — color scheme + font scheme + real `slideLayout` parts</li>
                                <li>Inline markdown spans + syntax-highlighted code, real `&lt;a:tbl&gt;` tables</li>
                                <li>Gradient / solid / image backgrounds, speaker notes, 6 shape primitives</li>
                            </ul>
                        </Tabs.Panel>
                    </Tabs.Panels>
                </Tabs>
            </Card>
        </div>
    );
}

export function DarkSlideDemo() {
    return (
        <Toast.Provider position="bottom-right">
            <DarkSlideDemoBody />
        </Toast.Provider>
    );
}
