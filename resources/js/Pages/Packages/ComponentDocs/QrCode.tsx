import { useState } from "react";
import type { ComponentDoc } from "./types";
import {
    Badge,
    Button,
    Card,
    QrCode,
    QrCodePanel,
    qrCodePng,
    qrCodeSvg,
    Text,
    type QrCodeActionEvent,
} from "@particle-academy/react-fancy";

const Caption = ({ children }: { children: React.ReactNode }) => (
    <span className="mt-2 block text-center text-xs text-zinc-500 dark:text-zinc-400">{children}</span>
);

/** The panel with every action, and what `onAction` reported, as the JSON an agent would get. */
function PanelDemo() {
    const [events, setEvents] = useState<QrCodeActionEvent[]>([]);

    return (
        <div className="flex flex-wrap items-start justify-center gap-6">
            <QrCodePanel
                value="https://example.com/r/AbC123"
                label="Your sign-up link"
                showValue
                fileName="sign-up-link"
                onAction={(event) => setEvents((previous) => [event, ...previous].slice(0, 4))}
            />
            <Card className="w-full max-w-xs">
                <Card.Body>
                    <Text className="text-sm font-semibold">onAction</Text>
                    {events.length === 0 ? (
                        <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            Nothing yet. Use a button: each action reports how it ended.
                        </Text>
                    ) : (
                        <ul className="mt-2 space-y-1" aria-label="Actions reported by onAction">
                            {events.map((event, index) => (
                                <li key={index} className="font-mono text-xs break-all">
                                    {JSON.stringify(event)}
                                </li>
                            ))}
                        </ul>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}

/** `qrCodeSvg` / `qrCodePng` called directly: no panel, nothing rendered. */
function FilesDemo() {
    const [result, setResult] = useState<string | null>(null);
    const value = "SN-4829-13";
    const label = "Asset tag for pump 14";

    const writeSvg = () => {
        const svg = qrCodeSvg(value, { label });
        setResult(`SVG: ${new Blob([svg]).size} bytes, starts "${svg.slice(0, 38)}…"`);
    };

    const writePng = async () => {
        try {
            const png = await qrCodePng(value, { label, scale: 8 });
            setResult(`PNG: ${png.size} bytes, ${png.type}`);
        } catch (error) {
            setResult(`PNG failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={writeSvg}>qrCodeSvg()</Button>
                <Button onClick={writePng}>qrCodePng()</Button>
            </div>
            <div role="status" aria-live="polite" className="min-h-6">
                {result !== null && <Badge variant="soft">{result}</Badge>}
            </div>
        </div>
    );
}

export const qrCodeDoc: ComponentDoc = {
    intro: (
        <p>
            A QR code rendered as an <strong>SVG</strong>, with <strong>no dependencies</strong> —
            the encoder ships inside the component. ISO/IEC 18004, versions 1–40, error
            correction L/M/Q/H, and numeric / alphanumeric / byte modes selected automatically.
            It is one <code>&lt;path&gt;</code> on a module-unit <code>viewBox</code>, so{" "}
            <code>size</code> scales it with no resampling and it prints at the printer's
            resolution rather than the screen's.
            {" "}
            <strong>
                <code>value</code> is any string — this is not a link component.
            </strong>{" "}
            A QR code is a byte container, and most of what belongs in one is not a web address:
            an asset or serial number, a lot code, a ticket id, a WiFi credential block, a
            contact card, a <code>tel:</code> or <code>geo:</code> URI, plain text. Those are
            the cases where the format earns its place, because they need no network at all.
        </p>
    ),
    examples: [
        {
            name: "value is any string — this is not a link component",
            description:
                "A QR code is a byte container, and most of what belongs in one is not a web address. These are the cases where the format earns its place: nothing here needs a network, because the scanner reads the value and that IS the payload. A link is one payload among them. label names what the code is FOR — \"QR code\" tells a screen-reader user only that an image they cannot use is present.",
            render: () => (
                <div className="flex flex-wrap items-start justify-center gap-6">
                    {[
                        { v: "SN-4829-13", l: "Asset tag for pump 14", c: "an asset serial — alphanumeric" },
                        { v: "4829134829", l: "Order reference", c: "digits only — numeric" },
                        { v: "WIFI:T:WPA;S:Guest;P:hunter2;;", l: "Join the guest WiFi", c: "WiFi credentials" },
                        { v: "tel:+15550100", l: "Call the service desk", c: "a tel: URI" },
                        { v: "https://example.com/menu", l: "Today's menu", c: "a link — one of many" },
                    ].map((p) => (
                        <div key={p.v} className="w-[132px]">
                            <QrCode value={p.v} size={132} label={p.l} background="#ffffff" foreground="#0b0b0c" />
                            <Caption>{p.c}</Caption>
                        </div>
                    ))}
                </div>
            ),
            code: `// Any string. Nothing inspects or validates it.
<QrCode value="SN-4829-13" label="Asset tag for pump 14" />
<QrCode value="4829134829" label="Order reference" />
<QrCode value="WIFI:T:WPA;S:Guest;P:hunter2;;" label="Join the guest WiFi" />
<QrCode value="tel:+15550100" label="Call the service desk" />

// A link is ONE payload, not the default case.
<QrCode value="https://example.com/menu" label="Today's menu" />`,
        },
        {
            name: "Mode selection, and why uppercase matters",
            description:
                "Automatic, and it decides how scannable the result is at a given pixel size. Numeric mode packs three digits into ten bits; alphanumeric covers 0-9 A-Z and $%*+-./: at 5½ bits; everything else is byte mode at 8. So LOWER-CASING AN IDENTIFIER PUSHES IT INTO BYTE MODE and makes the symbol bigger for the same information — if you control the format of a code you are printing, uppercase it. All four render at 150px; only the module size differs.",
            render: () => (
                <div className="flex flex-wrap items-start justify-center gap-6">
                    {[
                        { v: "4829134829", c: "numeric" },
                        { v: "SN-4829-13", c: "alphanumeric (uppercase)" },
                        { v: "sn-4829-13", c: "byte — same value, lower case" },
                        { v: "MECARD:N:Okafor,Ada;TEL:+15550100;;", c: "byte — mixed case" },
                    ].map((p) => (
                        <div key={p.v} className="w-[150px]">
                            <QrCode value={p.v} size={150} label={`Example: ${p.c}`} background="#ffffff" foreground="#0b0b0c" />
                            <Caption>{p.c}</Caption>
                        </div>
                    ))}
                </div>
            ),
            code: `<QrCode value="4829134829" label="Order reference" />   // numeric,      3⅓ bits/char
<QrCode value="SN-4829-13" label="Asset tag" />         // alphanumeric, 5½ bits/char
<QrCode value="sn-4829-13" label="Asset tag" />         // byte,         8 bits/char

// Capacity at the largest symbol (version 40, level L):
// 7,089 digits / 4,296 alphanumeric / 2,953 bytes.`,
        },
        {
            name: "On a dark surface, set BOTH colours",
            description:
                "background defaults to transparent, which inherits whatever is behind it — so on a dark panel the symbol renders dark-on-dark and most scanners refuse it. This is the most common way a code that looks perfect fails to scan, and it is invisible in a screenshot review. Contrast is what gets scanned, not the dark modules on their own.",
            render: () => (
                <div className="flex flex-wrap items-start justify-center gap-8 rounded-xl bg-zinc-900 p-6">
                    <div>
                        <QrCode
                            value="https://ui.particle.academy"
                            size={150}
                            label="Transparent background on a dark panel"
                        />
                        <Caption>
                            <span className="text-zinc-400">default — inherits the panel, will not scan</span>
                        </Caption>
                    </div>
                    <div>
                        <QrCode
                            value="https://ui.particle.academy"
                            size={150}
                            label="Explicit colours on a dark panel"
                            foreground="#0b0b0c"
                            background="#ffffff"
                        />
                        <Caption>
                            <span className="text-zinc-300">foreground + background set</span>
                        </Caption>
                    </div>
                </div>
            ),
            code: `// On a dark surface this renders dark-on-dark and will not scan:
<QrCode value={url} label="Pair" />

// Set both. Contrast is what gets scanned.
<QrCode value={url} label="Pair" foreground="#0b0b0c" background="#ffffff" />`,
        },
        {
            name: "The quiet zone is not padding",
            description:
                "It is how a scanner finds the symbol's edge, and it defaults to the standard's minimum of four modules. quietZone={0} is allowed — a consumer compositing their own margin has a reason — but it is not a space saving, and a code flush against surrounding content is the single most common cause of “the QR code doesn't work”.",
            render: () => (
                <div className="flex flex-wrap items-start justify-center gap-8">
                    <div>
                        <QrCode value="quiet zone" size={140} label="Default quiet zone" background="#ffffff" />
                        <Caption>quietZone = 4 (default)</Caption>
                    </div>
                    <div>
                        <QrCode
                            value="quiet zone"
                            size={140}
                            label="No quiet zone"
                            quietZone={0}
                            background="#ffffff"
                        />
                        <Caption>quietZone = 0 — no margin to find</Caption>
                    </div>
                </div>
            ),
            code: `<QrCode value={url} label="Pair" />                 // 4 modules, the standard's minimum
<QrCode value={url} label="Pair" quietZone={0} />   // allowed, and not a space saving`,
        },
        {
            name: "Error correction — H is not a free upgrade",
            description:
                "H survives about 30% damage against M's 15%, but it holds a third less — so the same value needs a larger symbol, and at the same pixel width that means SMALLER modules. On a phone screen H can read worse than M. Raise it for print, for a label that will be scuffed, or when a logo covers part of the symbol.",
            render: () => (
                <div className="flex flex-wrap items-start justify-center gap-6">
                    {(["L", "M", "Q", "H"] as const).map((level) => (
                        <div key={level}>
                            <QrCode
                                value="https://ui.particle.academy/packages/react-fancy/qr-code"
                                size={130}
                                errorCorrection={level}
                                label={`Error correction ${level}`}
                            />
                            <Caption>{level}</Caption>
                        </div>
                    ))}
                </div>
            ),
            code: `// M is right for a screen. Raise it for print or a covered symbol.
<QrCode value={url} label="Pair" errorCorrection="M" />
<QrCode value={url} label="Pair" errorCorrection="H" />   // smaller modules at the same size`,
        },
        {
            name: "Forcing a version, so a row of codes shares a module scale",
            description:
                "version fixes the module count regardless of how little the value needs, which is how several codes rendered side by side end up at the same module size rather than different ones. It throws if the value does not fit. Both of these are version 4 at 140px, so their modules are identical even though the second value is far shorter.",
            render: () => (
                <div className="flex flex-wrap items-start justify-center gap-8">
                    <div>
                        <QrCode
                            value="https://ui.particle.academy/packages/react-fancy/qr-code"
                            size={140}
                            version={4}
                            label="A long value at version 4"
                        />
                        <Caption>56 characters, version 4</Caption>
                    </div>
                    <div>
                        <QrCode value="482913" size={140} version={4} label="A short value at version 4" />
                        <Caption>6 characters, also version 4</Caption>
                    </div>
                </div>
            ),
            code: `// Same module scale for both, however short the value.
<QrCode value={longUrl} size={140} version={4} label="Long" />
<QrCode value="482913" size={140} version={4} label="Short" />`,
        },
        {
            name: "Forcing a mode",
            description:
                "mode overrides the automatic choice. Rarely useful — the default already picks the narrowest mode the value allows — and forcing a narrower one than the value permits throws. Shown here as byte mode applied to digits, which is strictly worse than the numeric mode the default would pick: same value, bigger symbol.",
            render: () => (
                <div className="flex flex-wrap items-start justify-center gap-8">
                    <div>
                        <QrCode value="4829134829134829" size={140} label="Digits, automatic mode" />
                        <Caption>automatic — numeric</Caption>
                    </div>
                    <div>
                        <QrCode value="4829134829134829" size={140} mode="byte" label="Digits forced to byte" />
                        <Caption>forced byte — larger for the same value</Caption>
                    </div>
                </div>
            ),
            code: `<QrCode value="4829134829134829" label="Automatic" />              // numeric
<QrCode value="4829134829134829" label="Forced" mode="byte" />    // larger, same value`,
        },
        {
            name: "It is an image of a value, not the value",
            description:
                "A QR code is unusable to anyone who cannot point a second device at the screen — every screen-reader user, and anyone whose phone is the device displaying it. label gives it an accessible name, but an aria-label cannot carry a serial number or a WiFi password someone is expected to read off. Show the value as selectable text too.",
            render: () => (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800">
                    <QrCode
                        value="SN-4829-13"
                        size={168}
                        label="Asset tag for pump 14"
                        foreground="#0b0b0c"
                        background="#ffffff"
                    />
                    <span className="select-all font-mono text-lg tracking-[0.2em] text-zinc-900">SN-4829-13</span>
                    <span className="text-xs text-zinc-500">Pump 14 · condensate return</span>
                </div>
            ),
            code: `<div className="flex flex-col items-center gap-3">
    <QrCode value={serial} label={\`Asset tag for \${asset.name}\`} foreground="#0b0b0c" background="#ffffff" />
    <span className="select-all font-mono tracking-widest">{serial}</span>
    <span className="text-xs">{asset.description}</span>
</div>`,
        },
        {
            name: "QrCodePanel: download, share and print",
            description:
                "QrCodePanel composes <QrCode> with what a person does with one: download it as SVG or PNG, share it (the Web Share sheet, or a copy where there is none, when the button reads \"Copy link\"), and print a page holding only the code. Each action is a react-fancy Button with a visible label, 44px tall by default (WCAG 2.5.5 AAA), reachable with Tab and pressed with Enter or Space. What each did is announced in a polite status region, and reported to onAction as plain JSON. The tile is black on white in dark mode too, because a code needs a light surround to scan. showValue puts the value on screen as selectable text.",
            render: () => <PanelDemo />,
            code: `import { QrCodePanel } from "@particle-academy/react-fancy/qr-code";

<QrCodePanel
    value="https://example.com/r/AbC123"
    label="Your sign-up link"   // names the group, the code, the file and the print page
    showValue                   // the value as text: a code is an image of a value
    fileName="sign-up-link"     // sign-up-link.svg / sign-up-link.png
    onAction={(event) => log(event)}
    // { action: "download-png", outcome: "done", fileName: "sign-up-link.png" }
    // { action: "share", outcome: "done", via: "clipboard" }
/>`,
        },
        {
            name: "Fewer actions, and a value that should not be shown",
            description:
                "actions picks which buttons appear and in what order; [] renders none. showValue is off by default because not every value is meant to be read aloud or printed: this WiFi block carries a password. labels translates the button text and the announcements.",
            render: () => (
                <div className="flex justify-center">
                    <QrCodePanel
                        value="WIFI:T:WPA;S:Guest;P:hunter2;;"
                        label="Join the guest WiFi"
                        actions={["download-png", "print"]}
                        fileName="guest-wifi"
                        labels={{ downloadPng: "Save image", print: "Print card" }}
                    />
                </div>
            ),
            code: `<QrCodePanel
    value={wifiBlock}
    label="Join the guest WiFi"
    actions={["download-png", "print"]}
    labels={{ downloadPng: "Save image", print: "Print card" }}
/>   // showValue stays off: the value carries a password`,
        },
        {
            name: "The files without the panel: qrCodeSvg and qrCodePng",
            description:
                "The panel's file formats are plain functions, for a host or an agent that needs the file and not the UI. qrCodeSvg returns a standalone SVG document with a <title> and an accessible name; qrCodePng resolves to a PNG Blob drawn with Path2D from the same path data, at a whole number of pixels per module, so a CSP of img-src 'self' cannot block it. A file is always opaque: transparent becomes white and currentColor black, since a file has no page behind it. Both throw a RangeError for a value that cannot fit.",
            render: () => <FilesDemo />,
            code: `import { qrCodeSvg, qrCodePng } from "@particle-academy/react-fancy/qr-code";

const svg = qrCodeSvg(serial, { label: "Asset tag for pump 14" });          // string
const png = await qrCodePng(serial, { label: "Asset tag for pump 14", scale: 8 }); // Blob

// On the server, particle-academy/fancy-qr writes the same SVG bytes:
//   FancyQr\\QrCode::svg($serial, label: 'Asset tag for pump 14');`,
        },
    ],
    props: [
        {
            name: "value",
            type: "string",
            description:
                "ANY string -- an identifier, a credential block, a URI, arbitrary text. Nothing inspects or validates it. An empty string renders a valid empty symbol rather than throwing.",
            required: true,
        },
        {
            name: "label",
            type: "string",
            description:
                "Accessible name. Describe what the code is FOR (\"Asset tag for pump 14\"), not the artefact (\"QR code\").",
            required: true,
        },
        { name: "size", type: "number", default: "192", description: "Rendered width and height in pixels." },
        {
            name: "errorCorrection",
            type: '"L" | "M" | "Q" | "H"',
            default: '"M"',
            description:
                "Damage tolerance. H survives more and holds less, so at the same pixel width its modules are smaller — on a screen it can read worse than M.",
        },
        {
            name: "quietZone",
            type: "number",
            default: "4",
            description:
                "Modules of clear margin. Not padding — it is how a scanner finds the symbol's edge. 4 is the standard's minimum.",
        },
        {
            name: "foreground",
            type: "string",
            default: '"currentColor"',
            description: "Module colour. Inherits text colour by default.",
        },
        {
            name: "background",
            type: "string",
            default: '"transparent"',
            description:
                "Background colour. Transparent inherits the surface behind it, which renders dark-on-dark on a dark panel — set it explicitly there.",
        },
        {
            name: "mode",
            type: '"numeric" | "alphanumeric" | "byte"',
            default: "auto",
            description: "Force an encoding mode. The default picks the narrowest the value allows.",
        },
        {
            name: "version",
            type: "number",
            default: "auto",
            description:
                "Force a symbol version 1–40, fixing the module count. Throws if the value does not fit.",
        },
        { name: "QrCodePanel — value / label", type: "string", description: "As on QrCode. label also names the group, the SVG file's <title>, the print page and the share sheet.", required: true },
        {
            name: "QrCodePanel — actions",
            type: 'readonly ("download-svg" | "download-png" | "share" | "print")[]',
            default: "all four",
            description: "Which buttons to show, in order. [] renders none.",
        },
        { name: "QrCodePanel — showValue", type: "boolean", default: "false", description: "The value as selectable text under the code and on the printed page. Off by default: a value can be a password." },
        { name: "QrCodePanel — fileName", type: "string", default: '"qr-code"', description: "Download name without extension. Sanitised." },
        { name: "QrCodePanel — foreground / background", type: "string", default: '"#000000" / "#ffffff"', description: "Pinned dark on light in both colour schemes, unlike a bare QrCode, because a code must be dark on light to scan." },
        { name: "QrCodePanel — pngScale", type: "number", default: "10", description: "PNG pixels per module, a whole number." },
        { name: "QrCodePanel — printSizeMm", type: "number", default: "50", description: "Printed width of the code in millimetres." },
        { name: "QrCodePanel — shareTitle", type: "string", default: "label", description: "Title for the Web Share sheet." },
        { name: "QrCodePanel — buttonSize", type: "Size", default: '"lg"', description: "Action button size. lg is 44px tall, WCAG 2.5.5's AAA target." },
        { name: "QrCodePanel — labels", type: "Partial<QrCodePanelLabels>", default: "English", description: "Button text and announcements, for translation." },
        {
            name: "QrCodePanel — onAction",
            type: "(event: QrCodeActionEvent) => void",
            description: 'Once per action: { action, outcome: "done" | "cancelled" | "failed", via?, fileName?, error? }.',
        },
        { name: "qrCodeSvg(value, options)", type: "string", description: "A standalone SVG document. options: label (required), size, errorCorrection, mode, version, quietZone, foreground, background." },
        { name: "qrCodePng(value, options)", type: "Promise<Blob>", description: "A PNG drawn with Path2D. options as qrCodeSvg plus scale (pixels per module, at most 8192px a side) and canvas." },
    ],
    notes: (
        <div className="space-y-3">
            <p>
                <strong>The encoder is exported separately</strong> —{" "}
                <code>encodeQr</code> and <code>selectMode</code> from{" "}
                <code>@particle-academy/react-fancy</code> — for a consumer that needs the modules
                rather than an SVG: a canvas, a PDF, a thermal printer, a terminal.{" "}
                <code>encodeQr</code> throws a <code>RangeError</code> rather than truncating a
                value that will not fit, because a truncated symbol scans cleanly and yields the{" "}
                <em>wrong</em> string.
            </p>
            <p>
                <strong>Accessibility:</strong> <code>role="img"</code> with{" "}
                <code>aria-label</code> from <code>label</code>. Also expose the value as text or a
                link — a QR code is unreadable to anyone who cannot point a second device at the
                screen, and an <code>aria-label</code> cannot carry a URL someone is expected to
                type.
            </p>
            <p>
                <strong>QrCodePanel</strong> is a <code>role="group"</code> named by{" "}
                <code>label</code>. Every action is a native button in the tab order with a visible
                text label and the kit's focus ring, and each outcome is announced through a polite{" "}
                <code>role="status"</code>. Every part carries a{" "}
                <code>data-react-fancy-qr-code-*</code> handle, so an agent reads and drives it by
                handle rather than by guessing at markup. <code>QrCodePanel</code>,{" "}
                <code>qrCodeSvg</code> and <code>qrCodePng</code> arrived in react-fancy 6.8.0 and
                ship on the <code>./qr-code</code> subpath and the root.
            </p>
            <p>
                <strong>On the server:</strong> <code>particle-academy/fancy-qr</code> is a PHP port
                of this encoder with zero dependencies, so a code generated in PHP is the same symbol
                as the one drawn here, and its SVG output is byte-identical to{" "}
                <code>qrCodeSvg</code>.
            </p>
            <p>
                <strong>Not supported:</strong> Kanji mode and structured append. Neither has a
                caller, and an untested branch in an encoder fails as a code a phone quietly
                refuses to read.
            </p>
        </div>
    ),
};
