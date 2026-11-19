import {
    SignError,
    type CertificateJson,
    type Completion,
    type Envelope,
    type Field,
    type Mark,
    type OtpPurpose,
    type SignClient,
    type SignEvent,
    type SignInput,
    type SignerView,
    type VerifyInput,
    type VerifyResult,
} from "@particle-academy/fancy-sign-ui/client";

/**
 * An IN-PAGE signing backend for the /features/documents demo: a `SignClient`
 * that lives in this tab, so fancy-sign-ui's real components run a whole
 * ceremony with no server, no email and no stored personal data.
 *
 * What it does for real: one-time codes (shown on the page instead of
 * emailed), a SHA-256 hash-chained audit trail, the document hash, and a
 * completion record whose token and chain the verifier re-checks.
 *
 * What only the real backend does, and this one says so on the page: email
 * delivery, the Ed25519 seal (`fancy-sign` signs completions with a server
 * key; here `seal` is "none", so the verifier reports the seal as not
 * checked), stamping the marks into the PDF (fine-print's Signable writer), and
 * recording IP addresses and user agents (this demo records neither).
 *
 * Kept free of React so tests/js/features-documents.test.ts can drive a whole
 * ceremony in Node.
 */

export const DEMO_TOKEN = "demo-link-token";
const SESSION = "demo-session";
const CONSENT_VERSION = "2026-11";
const CONSENT_TEXT =
    "I agree to sign this document electronically. My electronic signature has the same effect as a handwritten one. This is a demonstration: nothing I enter here is stored or sent anywhere.";
const ADOPTION_TEXT = "By selecting Sign, I adopt the mark above as my signature on this document.";
const MAX_ATTEMPTS = 5;

export type DemoSignOptions = {
    /** The document to sign. Fetched once, when the signer opens it. */
    loadDocument: () => Promise<Blob>;
    signerName: string;
    title: string;
    /** The page shows the code here, in place of an email. */
    onCode?: (purpose: OtpPurpose, code: string) => void;
    /** Called after every state change, with the envelope and its trail. */
    onChange?: (envelope: Envelope, events: SignEvent[]) => void;
    /** Codes are random by default; tests pass a fixed one. */
    codeFor?: (purpose: OtpPurpose) => string;
    now?: () => Date;
};

export type DemoSignClient = SignClient & {
    /** The signed document's bytes, once there are any (the as-sent PDF in this demo). */
    signedDocument(): Blob | null;
    events(): SignEvent[];
    envelope(): Envelope;
};

const ZERO = "0".repeat(64);

/**
 * The PDF-mode completion, or null. Since fancy-sign-ui 0.6 an envelope's
 * `completion` may be a data-mode record, which has no `as_sent_sha256` /
 * `final_sha256`; this demo only ever makes PDF-mode ones.
 */
export function pdfCompletion(completion: Envelope["completion"]): Completion | null {
    return completion && "final_sha256" in completion ? completion : null;
}

export async function sha256Hex(data: ArrayBuffer | Uint8Array | string): Promise<string> {
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data instanceof Uint8Array ? data : new Uint8Array(data);
    const digest = await crypto.subtle.digest("SHA-256", bytes.slice().buffer);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Sorted-key JSON, so a hash does not depend on key order. */
export function canonical(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
    if (value && typeof value === "object") {
        const keys = Object.keys(value as Record<string, unknown>).sort();
        return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`).join(",")}}`;
    }
    return JSON.stringify(value ?? null);
}

/** The hash of one event: its predecessor's hash, then everything but its own hash. */
export async function eventHash(event: Omit<SignEvent, "hash">): Promise<string> {
    return sha256Hex(`${event.prev_hash}\n${canonical(event)}`);
}

function completionCore(c: Omit<Completion, "token" | "seal">): string {
    return canonical(c);
}

function randomCode(): string {
    const n = new Uint32Array(1);
    crypto.getRandomValues(n);
    return String(n[0] % 1_000_000).padStart(6, "0");
}

function refused(code: ConstructorParameters<typeof SignError>[0], message: string, status = 422): never {
    throw new SignError(code, message, status);
}

export function createDemoSignClient(options: DemoSignOptions): DemoSignClient {
    const now = options.now ?? (() => new Date());
    const codeFor = options.codeFor ?? randomCode;
    const signerId = "signer_1";
    const envelopeId = "env_demo";

    const fields: Field[] = [
        { id: "sig_client", signer_id: signerId, kind: "signature", anchor: { final_page: true }, required: true, label: "Client signature", placement: null, completed: false },
        { id: "date_client", signer_id: signerId, kind: "date_signed", anchor: { final_page: true }, required: true, label: "Date signed", placement: null, completed: false },
    ];

    let envelope: Envelope = {
        id: envelopeId,
        org_id: null,
        title: options.title,
        status: "sent",
        document: { as_sent_sha256: null, final_sha256: null, pages: null },
        settings: { per_page: "none", otp: { view: true, accept: true }, step_up: "none", level: "ses", seal: "none", expires_at: null },
        signers: [
            { id: signerId, name: options.signerName, email: "signer@example.com", order: 1, status: "pending", consent: null, signed_at: null, declined_at: null, decline_reason: null },
        ],
        fields,
        chain_head: ZERO,
        completion: null,
        created_at: now().toISOString(),
        sent_at: now().toISOString(),
        completed_at: null,
    };

    const events: SignEvent[] = [];
    const codes: Partial<Record<OtpPurpose, { code: string; attempts: number }>> = {};
    let session: string | null = null;
    let documentBlob: Blob | null = null;
    let otpSeq = 0;
    let consentSeq = 0;
    let changes = 0;
    let queue: Promise<unknown> = Promise.resolve();

    /** Appends are serialised, so the chain is never forked by two calls at once. */
    const record = (type: string, actor: string, data: Record<string, unknown> = {}, source: "server" | "client" = "server") => {
        const next = queue.then(async () => {
            const base: Omit<SignEvent, "hash"> = {
                envelope_id: envelopeId,
                seq: events.length + 1,
                at: now().toISOString(),
                type,
                actor,
                source,
                ip: null,
                user_agent: null,
                data,
                prev_hash: events.length > 0 ? events[events.length - 1].hash : ZERO,
            };
            const event: SignEvent = { ...base, hash: await eventHash(base) };
            events.push(event);
            envelope = { ...envelope, chain_head: event.hash };
            options.onChange?.(envelope, [...events]);
            return event;
        });
        queue = next.catch(() => undefined);
        return next;
    };

    // The trail starts with what the sender did.
    void record("envelope.created", "sender", { title: options.title });
    void record("envelope.sent", "sender", { signers: 1, delivery: "in-page demo, no email" });

    const signer = () => envelope.signers[0];
    const setSigner = (patch: Partial<Envelope["signers"][number]>) => {
        envelope = { ...envelope, signers: [{ ...signer(), ...patch }] };
    };
    const actor = `signer:${signerId}`;

    const requireToken = (token: string) => {
        if (token !== DEMO_TOKEN) refused("link_invalid", "This signing link is not valid.", 404);
    };
    const requireSession = () => {
        if (session !== SESSION) refused("session_required", "Enter the code first.", 401);
    };

    const view = (): SignerView => ({
        envelope: { id: envelopeId, title: envelope.title, status: envelope.status, pages: envelope.document.pages },
        signer: {
            id: signerId,
            name: signer().name,
            email: signer().email,
            status: signer().status,
            consent_at: signer().consent?.at ?? null,
            signed_at: signer().signed_at,
            declined_at: signer().declined_at,
        },
        consent: { required: true, text: CONSENT_TEXT, version: CONSENT_VERSION },
        adoption_text: ADOPTION_TEXT,
        fields: envelope.fields,
        changes_requested: changes,
        max_change_requests: 3,
    });

    const checkCode = async (purpose: OtpPurpose, code: string) => {
        const entry = codes[purpose];
        if (!entry) refused("otp_invalid", "Request a code first.");
        if (entry.attempts >= MAX_ATTEMPTS) refused("otp_locked", "Too many wrong codes. Request a new one.", 429);
        if (entry.code !== code) {
            entry.attempts += 1;
            await record("otp.failed", actor, { purpose, attempts: entry.attempts });
            if (entry.attempts >= MAX_ATTEMPTS) {
                delete codes[purpose];
                await record("otp.locked", actor, { purpose });
                refused("otp_locked", "Too many wrong codes. Request a new one.", 429);
            }
            refused("otp_invalid", "That code is not right.");
        }
        delete codes[purpose];
        const event = await record("otp.verified", actor, { purpose });
        if (purpose === "accept") otpSeq = event.seq;
    };

    const notHere = (what: string): never => refused("forbidden", `${what} is a sender action; this demo shows the signer's side.`, 403);
    const notDataMode = (): never => refused("invalid_request", "This demo signs a PDF; data mode is not part of it.", 422);

    const client: DemoSignClient = {
        getSession: () => session,
        setSession: (s) => {
            session = s;
        },

        listEnvelopes: async () => [envelope],
        createEnvelope: async () => notHere("Creating an envelope"),
        getEnvelope: async () => envelope,
        updateEnvelope: async () => notHere("Editing an envelope"),
        sendEnvelope: async () => notHere("Sending"),
        voidEnvelope: async () => notHere("Voiding"),
        remindEnvelope: async () => notHere("Reminding"),
        listEvents: async () => [...events],
        getCertificate: async (): Promise<CertificateJson> => ({ envelope, completion: pdfCompletion(envelope.completion), events: [...events] }),
        getCertificatePdf: async () => notHere("The certificate PDF"),
        getDocument: async () => documentBlob ?? refused("not_found", "No document yet.", 404),
        certificateUrl: () => "#",
        documentUrl: () => "#",
        getOrgSettings: async () => refused("not_found", "No organisation in this demo.", 404),
        updateOrgSettings: async () => notHere("Organisation settings"),

        // Data mode (fancy-sign-ui 0.6): this demo signs a PDF, so the data-mode
        // calls refuse rather than pretend.
        inviteSigner: async () => notHere("Inviting a signer"),
        attachFinal: async () => notHere("Registering the final PDF"),
        getSignatures: async () => notDataMode(),
        signerData: async () => notDataMode(),
        reportRendered: async () => notDataMode(),

        requestCode: async (token, purpose) => {
            requireToken(token);
            if (purpose === "accept") requireSession();
            const code = codeFor(purpose);
            codes[purpose] = { code, attempts: 0 };
            await record("otp.sent", actor, { purpose, channel: "shown on this page" });
            options.onCode?.(purpose, code);
            return { sent: true, expires_in: 600 };
        },
        verifyViewCode: async (token, code) => {
            requireToken(token);
            await checkCode("view", code);
            session = SESSION;
            if (signer().status === "pending") setSigner({ status: "viewed" });
            await record("link.opened", actor);
            return { session: SESSION, expires_at: new Date(now().getTime() + 3_600_000).toISOString() };
        },
        getSignerView: async (token) => {
            requireToken(token);
            requireSession();
            return view();
        },
        consent: async (token, version) => {
            requireToken(token);
            requireSession();
            if (version !== CONSENT_VERSION) refused("consent_required", "That consent text has changed.");
            const at = now().toISOString();
            setSigner({ consent: { text_sha256: await sha256Hex(CONSENT_TEXT), version, at } });
            consentSeq = (await record("consent.accepted", actor, { version })).seq;
            return view();
        },
        signerDocument: async (token) => {
            requireToken(token);
            requireSession();
            if (!documentBlob) {
                documentBlob = await options.loadDocument();
                const hash = await sha256Hex(await documentBlob.arrayBuffer());
                envelope = { ...envelope, document: { ...envelope.document, as_sent_sha256: hash } };
            }
            await record("document.opened", actor);
            return documentBlob;
        },
        reportPageView: async (token, page, ms) => {
            requireToken(token);
            requireSession();
            await record("page.viewed", actor, { page, ms }, "client");
        },
        sign: async (token, input: SignInput) => {
            requireToken(token);
            requireSession();
            if (signer().status === "signed") refused("already_signed", "Already signed.", 409);
            if (!signer().consent) refused("consent_required", "Accept the consent first.");
            if (!documentBlob) refused("not_viewed", "Open the document first.");
            const missing = envelope.fields.filter((f) => f.required && !input.fields[f.id]);
            if (missing.length > 0) refused("fields_incomplete", "Complete every required field.");
            if (!validMark(input.mark)) refused("mark_invalid", "Draw or type a signature.");
            await checkCode("accept", input.code);

            for (const field of envelope.fields) await record("field.completed", actor, { field: field.id, kind: field.kind });
            await record("mark.adopted", actor, { kind: input.mark.kind });
            const signedAt = now().toISOString();
            setSigner({ status: "signed", signed_at: signedAt });
            await record("signer.signed", actor, { method: "otp" });

            // In fancy-sign the final PDF has the marks stamped in and is sealed.
            // Here the final document IS the as-sent PDF, and the record says so.
            const finalHash = envelope.document.as_sent_sha256 ?? ZERO;
            const completed = await record("envelope.completed", "system", { final: "as-sent (in-page demo)" });
            const core: Omit<Completion, "token" | "seal"> = {
                type: "fancy-sign.completion",
                version: 1,
                envelope_id: envelopeId,
                as_sent_sha256: envelope.document.as_sent_sha256 ?? ZERO,
                final_sha256: finalHash,
                signers: [{ id: signerId, name: signer().name, email: signer().email, signed_at: signedAt, method: "otp", otp_seq: otpSeq, consent_seq: consentSeq }],
                chain_head: completed.hash,
                nonce: randomCode() + randomCode(),
                key_id: "none (in-page demo)",
            };
            const completion: Completion = { ...core, token: await sha256Hex(completionCore(core)), seal: "none" };
            envelope = {
                ...envelope,
                status: "completed",
                fields: envelope.fields.map((f) => ({ ...f, completed: true })),
                document: { ...envelope.document, final_sha256: finalHash },
                completion,
                completed_at: now().toISOString(),
            };
            options.onChange?.(envelope, [...events]);
            return view();
        },
        decline: async (token, reason) => {
            requireToken(token);
            requireSession();
            setSigner({ status: "declined", declined_at: now().toISOString(), decline_reason: null });
            envelope = { ...envelope, status: "declined" };
            // The reason is not recorded: it is signer-written text, and this demo keeps none.
            await record("signer.declined", actor, { reason_length: reason.length });
            return view();
        },
        requestChanges: async (token, text) => {
            requireToken(token);
            requireSession();
            if (changes >= 3) refused("limit_exceeded", "That is the most change requests one signer can send.", 429);
            changes += 1;
            await record("signer.requested_changes", actor, { length: text.length });
            return view();
        },

        verify: async (input: VerifyInput) => verifyCompletion(input),
        publicKey: async () => refused("not_found", "The in-page demo has no sealing key.", 404),

        signedDocument: () => (envelope.status === "completed" ? documentBlob : null),
        events: () => [...events],
        envelope: () => envelope,
    };

    return client;
}

function validMark(mark: Mark | null | undefined): boolean {
    if (!mark) return false;
    if (mark.kind === "typed") return mark.text.trim().length > 0 && mark.text.length <= 128;
    return mark.strokes.length > 0 && mark.strokes.length <= 64 && mark.strokes.every((s) => s.every(([x, y]) => x >= 0 && x <= 1 && y >= 0 && y <= 1));
}

async function readJson(value: Blob | string | Record<string, unknown> | SignEvent[] | Completion): Promise<unknown> {
    if (typeof value === "string") return JSON.parse(value);
    if (value instanceof Blob) return JSON.parse(await value.text());
    return value;
}

/**
 * Re-check a completion against the document and the trail: the token over the
 * record, the document hash, and every link of the hash chain. The seal is not
 * checked (`null`) because the in-page demo has no key; fancy-sign's server
 * checks it against its Ed25519 public key.
 */
export async function verifyCompletion(input: VerifyInput): Promise<VerifyResult> {
    const checks: VerifyResult["checks"] = { seal: null, token: null, final_hash: null, prefix: null, chain: null };
    let completion: Completion;
    try {
        completion = (await readJson(input.completion)) as Completion;
        if (completion?.type !== "fancy-sign.completion") throw new Error("not a completion");
    } catch {
        return { ok: false, reason: "completion_invalid", checks };
    }

    const { token, seal: _seal, ...core } = completion;
    checks.token = (await sha256Hex(completionCore(core))) === token;
    if (!checks.token) return { ok: false, reason: "token_mismatch", checks };

    checks.final_hash = (await sha256Hex(await input.pdf.arrayBuffer())) === completion.final_sha256;
    if (!checks.final_hash) return { ok: false, reason: "final_hash_mismatch", checks };

    if (input.events !== undefined) {
        let events: SignEvent[];
        try {
            events = (await readJson(input.events)) as SignEvent[];
            if (!Array.isArray(events)) throw new Error("not a list");
        } catch {
            return { ok: false, reason: "chain_broken", checks };
        }
        let prev = ZERO;
        for (const event of events) {
            const { hash, ...rest } = event;
            if (rest.prev_hash !== prev || (await eventHash(rest)) !== hash) {
                checks.chain = false;
                return { ok: false, reason: "chain_broken", checks };
            }
            prev = hash;
        }
        checks.chain = events.some((e) => e.hash === completion.chain_head);
        if (!checks.chain) return { ok: false, reason: "chain_head_mismatch", checks };
    }

    return { ok: true, reason: null, checks };
}
