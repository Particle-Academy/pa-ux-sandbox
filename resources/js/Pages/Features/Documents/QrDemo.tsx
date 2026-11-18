import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, ImageViewer, Input, QrCode, Text, qrCodeSvg } from "@particle-academy/react-fancy";
import { DemoFrame } from "../shared/DemoFrame";

/**
 * fancy-qr on the server beside react-fancy's QrCode in the browser. The
 * server's SVG is fetched as text and compared with `qrCodeSvg()` for the same
 * value and label: fancy-qr promises they are byte-identical.
 */

const LABEL = "Link to the quote";
const MAX = 300;

export function qrUrl(value: string, format: "svg" | "png"): string {
    const params = new URLSearchParams({ value, label: LABEL });
    return `/features/documents/qr.${format}?${params.toString()}`;
}

type Match = { status: "idle" | "checking" | "same" | "differs" | "error"; detail?: string };

export function QrDemo() {
    const [value, setValue] = useState("https://quotes.example.com/Q-2026-0142");
    const [debounced, setDebounced] = useState(value);
    const [match, setMatch] = useState<Match>({ status: "idle" });

    useEffect(() => {
        const timer = window.setTimeout(() => setDebounced(value), 350);
        return () => window.clearTimeout(timer);
    }, [value]);

    const clientSvg = useMemo(() => {
        try {
            return debounced === "" ? null : qrCodeSvg(debounced, { label: LABEL });
        } catch {
            return null;
        }
    }, [debounced]);

    useEffect(() => {
        if (debounced === "") return;
        const controller = new AbortController();
        setMatch({ status: "checking" });
        fetch(qrUrl(debounced, "svg"), { signal: controller.signal })
            .then(async (res) => {
                if (!res.ok) throw new Error(res.status === 429 ? "Too many requests; wait a minute." : `The server said ${res.status}.`);
                return res.text();
            })
            .then((serverSvg) => setMatch(serverSvg === clientSvg ? { status: "same", detail: `${serverSvg.length} bytes` } : { status: "differs" }))
            .catch((error: Error) => {
                if (error.name !== "AbortError") setMatch({ status: "error", detail: error.message });
            });
        return () => controller.abort();
    }, [debounced, clientSvg]);

    return (
        <DemoFrame
            id="documents-qr"
            label="fancy-qr (PHP) beside react-fancy QrCode"
            status="Live · this server + your browser"
            caption="Type any value: a link, a ticket number, a WiFi block. The left code is drawn in your browser; the right ones come from the server as SVG and PNG. The quote PDF above carries one of these."
        >
            <div className="docs-qr">
                <Input
                    label="Value"
                    value={value}
                    onValueChange={(v) => setValue(v.slice(0, MAX))}
                    description={`Up to ${MAX} characters.`}
                    data-documents-qr-value=""
                />
                <div className="docs-qr__grid">
                    <Card variant="outlined" padding="sm" className="docs-qr__card">
                        <Text as="span" size="sm" weight="semibold">
                            Browser: react-fancy QrCode
                        </Text>
                        <QrCode value={debounced} label={LABEL} size={168} />
                    </Card>
                    <Card variant="outlined" padding="sm" className="docs-qr__card">
                        <Text as="span" size="sm" weight="semibold">
                            Server: QrCode::svg()
                        </Text>
                        {debounced !== "" && <div className="docs-qr__image" data-documents-qr-server="svg"><ImageViewer src={qrUrl(debounced, "svg")} alt={LABEL} fit="contain" zoomable={false} pannable={false} controls={false} checkerboard={false} /></div>}
                    </Card>
                    <Card variant="outlined" padding="sm" className="docs-qr__card">
                        <Text as="span" size="sm" weight="semibold">
                            Server: QrCode::png()
                        </Text>
                        {debounced !== "" && <div className="docs-qr__image" data-documents-qr-server="png"><ImageViewer src={qrUrl(debounced, "png")} alt={LABEL} fit="contain" zoomable={false} pannable={false} controls={false} checkerboard={false} /></div>}
                    </Card>
                </div>
                <div className="docs-qr__status" aria-live="polite">
                    <Badge
                        color={match.status === "same" ? "green" : match.status === "checking" || match.status === "idle" ? "zinc" : "red"}
                        variant="soft"
                        data-documents-qr-match={match.status}
                    >
                        {match.status === "same"
                            ? `Server SVG and browser SVG are byte-identical (${match.detail})`
                            : match.status === "differs"
                              ? "Server SVG and browser SVG differ"
                              : match.status === "error"
                                ? (match.detail ?? "The server refused it")
                                : "Comparing..."}
                    </Badge>
                    {debounced !== "" && (
                        <Button href={qrUrl(debounced, "png")} download="qr.png" variant="ghost" icon="download" size="sm">
                            Download the PNG
                        </Button>
                    )}
                </div>
                <Text as="p" size="sm" color="muted">
                    Value: <code className="feature-code">{debounced || "(empty)"}</code>
                </Text>
            </div>
        </DemoFrame>
    );
}
