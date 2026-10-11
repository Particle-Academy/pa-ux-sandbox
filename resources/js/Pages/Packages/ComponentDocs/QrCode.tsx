import type { ComponentDoc } from "./types";
import { QrCode } from "@particle-academy/react-fancy";

const Caption = ({ children }: { children: React.ReactNode }) => (
    <span className="mt-2 block text-center text-xs text-zinc-500 dark:text-zinc-400">{children}</span>
);

export const qrCodeDoc: ComponentDoc = {
    intro: (
        <p>
            A QR code rendered as an <strong>SVG</strong>, with <strong>no dependencies</strong> —
            the encoder ships inside the component. ISO/IEC 18004, versions 1–40, error
            correction L/M/Q/H, and numeric / alphanumeric / byte modes selected automatically.
            It is one <code>&lt;path&gt;</code> on a module-unit <code>viewBox</code>, so{" "}
            <code>size</code> scales it with no resampling and it prints at the printer's
            resolution rather than the screen's.
        </p>
    ),
    examples: [
        {
            name: "A pairing URL",
            description:
                "value and a required label. The label names the DESTINATION, not the artefact — \"QR code\" tells a screen-reader user only that an image they cannot use is present.",
            render: () => (
                <div>
                    <QrCode
                        value="https://device.example.com/pair#482913"
                        size={192}
                        label="Pair this device"
                    />
                    <Caption>byte mode, error correction M</Caption>
                </div>
            ),
            code: `<QrCode
    value="https://device.example.com/pair#482913"
    size={192}
    label="Pair this device"
/>`,
        },
        {
            name: "A PIN is denser than a URL",
            description:
                "Mode selection is automatic and it matters. Numeric mode packs three digits into ten bits where byte mode spends twenty-four, so a six-digit PIN is a version 1 symbol — 21 modules, the largest modules and the easiest read. Both of these render at 160px; only the module size differs.",
            render: () => (
                <div className="flex flex-wrap items-start justify-center gap-8">
                    <div>
                        <QrCode value="482913" size={160} label="Pairing PIN" />
                        <Caption>“482913” — numeric, version 1, 21 modules</Caption>
                    </div>
                    <div>
                        <QrCode
                            value="https://device.example.com/pair#482913"
                            size={160}
                            label="Pairing URL"
                        />
                        <Caption>the full URL — byte mode, 29 modules</Caption>
                    </div>
                </div>
            ),
            code: `// Numeric mode: 21 modules at version 1 — the easiest possible read.
<QrCode value="482913" size={160} label="Pairing PIN" />

// The same pixel width, but byte mode needs more, smaller modules.
<QrCode value={pairUrl} size={160} label="Pairing URL" />`,
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
                "A QR code is unusable to anyone who cannot point a second device at the screen — every screen-reader user, and anyone whose phone is the device displaying it. label gives it an accessible name, but an aria-label cannot carry a URL someone is expected to type. Show the value as text too.",
            render: () => (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800">
                    <QrCode
                        value="https://device.example.com/pair#482913"
                        size={168}
                        label="Pair this device"
                        foreground="#0b0b0c"
                        background="#ffffff"
                    />
                    <code className="text-xs text-zinc-600">device.example.com/pair</code>
                    <span className="font-mono text-lg tracking-[0.3em] text-zinc-900">482913</span>
                </div>
            ),
            code: `<div className="flex flex-col items-center gap-3">
    <QrCode value={pairUrl} label="Pair this device" foreground="#0b0b0c" background="#ffffff" />
    <code>{pairHost}</code>
    <span className="font-mono tracking-widest">{pin}</span>
</div>`,
        },
    ],
    props: [
        {
            name: "value",
            type: "string",
            description:
                "What the code carries. An empty string renders a valid empty symbol rather than throwing, so a controlled surface can render before its value arrives.",
            required: true,
        },
        {
            name: "label",
            type: "string",
            description:
                "Accessible name. Describe the destination (\"Pair this device\"), not the artefact (\"QR code\").",
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
                <strong>Not supported:</strong> Kanji mode and structured append. Neither has a
                caller, and an untested branch in an encoder fails as a code a phone quietly
                refuses to read.
            </p>
        </div>
    ),
};
