import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Callout, Card, Heading, Text } from "@particle-academy/react-fancy";
import {
    CompletionCertificate,
    EnvelopeTimeline,
    SignatureVerifier,
    SignerCeremony,
    type Envelope,
    type OtpPurpose,
    type SignEvent,
} from "@particle-academy/fancy-sign-ui";
import { DemoFrame } from "../shared/DemoFrame";
import { quoteUrl, type QuoteInput } from "./quote";
import { DEMO_TOKEN, createDemoSignClient, pdfCompletion, type DemoSignClient } from "./sign";

/**
 * The signer's side of fancy-sign, live: fancy-sign-ui's own SignerCeremony,
 * EnvelopeTimeline, CompletionCertificate and SignatureVerifier, against an
 * in-page backend (./sign.ts). The document is the quote PDF from the
 * Templates demo. No email is sent and nothing is stored: the codes appear on
 * this page, and closing the tab discards the envelope.
 */

type Code = { purpose: OtpPurpose; code: string };

function useObjectUrl(blob: Blob | null): string | null {
    const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
    useEffect(() => () => {
        if (url) URL.revokeObjectURL(url);
    }, [url]);
    return url;
}

export function SignDemo({ input }: { input: QuoteInput }) {
    const [run, setRun] = useState(0);
    const [code, setCode] = useState<Code | null>(null);
    const [envelope, setEnvelope] = useState<Envelope | null>(null);
    const [events, setEvents] = useState<SignEvent[]>([]);

    // One envelope per run. The document is fixed when the signer first opens it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const client: DemoSignClient = useMemo(
        () =>
            createDemoSignClient({
                title: `Quote Q-2026-0142 for ${input.company || "your company"}`,
                signerName: input.contact || "Signer",
                loadDocument: async () => {
                    const res = await fetch(quoteUrl(input, "pdf", "&inline=1"));
                    if (!res.ok) throw new Error(`The quote PDF did not load (${res.status}).`);
                    return res.blob();
                },
                onCode: (purpose, value) => setCode({ purpose, code: value }),
                onChange: (env, evs) => {
                    setEnvelope(env);
                    setEvents(evs);
                },
            }),
        [run],
    );

    const completed = envelope?.status === "completed" && envelope.completion;
    const signedPdf = useObjectUrl(completed ? client.signedDocument() : null);
    const completionJson = useObjectUrl(completed ? new Blob([JSON.stringify(envelope.completion, null, 2)], { type: "application/json" }) : null);
    const eventsJson = useObjectUrl(completed ? new Blob([JSON.stringify(events, null, 2)], { type: "application/json" }) : null);

    const actorNames = { [`signer:signer_1`]: input.contact || "Signer", sender: "Fieldwork Studio", system: "fancy-sign" };

    const restart = () => {
        setCode(null);
        setEnvelope(null);
        setEvents([]);
        setRun((n) => n + 1);
    };

    return (
        <DemoFrame
            id="documents-sign"
            label="fancy-sign-ui: the signer's ceremony"
            status="Live · in-page backend"
            caption="Request a code (it appears here instead of in an email), accept the consent, read the quote, complete both fields, draw or type a signature, then sign with a second code. Everything happens in this tab and is gone when you leave."
        >
            <div className="docs-sign" key={run}>
                <div className="docs-sign__ceremony">
                    <SignerCeremony token={DEMO_TOKEN} client={client} surfaceId="documents-signer-ceremony" />
                </div>

                <div className="docs-sign__side">
                    <Card variant="outlined" padding="sm" className="docs-sign__inbox" data-documents-sign-inbox="">
                        <div className="docs-demo__label">
                            <Text as="span" size="sm" weight="semibold">
                                The signer's inbox
                            </Text>
                            <Badge color="zinc" variant="soft">
                                no email is sent
                            </Badge>
                        </div>
                        {code ? (
                            <Text as="p" size="sm">
                                Your {code.purpose === "view" ? "code to view the document" : "code to sign"} is{" "}
                                <strong className="docs-sign__code" data-documents-sign-code={code.purpose}>
                                    {code.code}
                                </strong>
                            </Text>
                        ) : (
                            <Text as="p" size="sm" color="muted">
                                Codes show up here. fancy-sign emails them.
                            </Text>
                        )}
                    </Card>

                    <div>
                        <Heading as="h3" size="sm" weight="semibold">
                            Audit trail
                        </Heading>
                        <Text as="p" size="sm" color="muted">
                            Every event is hash-chained to the one before it. This demo records no IP address or browser.
                        </Text>
                        <div className="docs-sign__trail">
                            <EnvelopeTimeline events={events} actorNames={actorNames} showNetwork={false} surfaceId="documents-envelope-timeline" />
                        </div>
                    </div>
                </div>

                {completed && pdfCompletion(envelope.completion) && (
                    <div className="docs-sign__record">
                        <CompletionCertificate completion={pdfCompletion(envelope.completion)!} events={events} title={envelope.title} surfaceId="documents-completion-certificate" />
                        <div className="docs-bridge__actions">
                            {signedPdf && (
                                <Button href={signedPdf} download="signed-quote.pdf" icon="download" size="sm">
                                    Signed PDF
                                </Button>
                            )}
                            {completionJson && (
                                <Button href={completionJson} download="completion.json" icon="download" size="sm">
                                    completion.json
                                </Button>
                            )}
                            {eventsJson && (
                                <Button href={eventsJson} download="events.json" icon="download" size="sm">
                                    events.json
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                <div className="docs-sign__verify">
                    <Heading as="h3" size="sm" weight="semibold">
                        Verify a signed document
                    </Heading>
                    <Text as="p" size="sm" color="muted">
                        Drop the three files from a completed ceremony. The verifier recomputes the document hash, the record's token and
                        every link of the audit chain; change a byte of any of them and it says which check failed. The seal row
                        reads "Not checked" here: only fancy-sign's server holds the sealing key.
                    </Text>
                    <SignatureVerifier client={client} maxFileSize={5 * 1024 * 1024} surfaceId="documents-signature-verifier" />
                </div>

                <div className="docs-sign__footer">
                    <Callout color="blue" icon={null}>
                        This ceremony runs against an in-page backend so it is safe to try here. The real one is the{" "}
                        <code className="feature-code">particle-academy/fancy-sign</code> Laravel package, which also emails the codes,
                        stamps the marks into the PDF with fine-print, seals the completion with an Ed25519 key (here the seal is
                        "none", so the verifier reports it as not checked) and records IP addresses and user agents. It is designed
                        to support simple electronic signatures (SES); have a lawyer review your use.
                    </Callout>
                    <Button variant="ghost" icon="rotate-ccw" onClick={restart} data-documents-sign-restart="">
                        Start a new envelope
                    </Button>
                </div>
            </div>
        </DemoFrame>
    );
}
