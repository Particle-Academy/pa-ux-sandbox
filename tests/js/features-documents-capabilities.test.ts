import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as lucide from "lucide-react";
import { DOCUMENTS_CAPABILITIES } from "../../resources/js/Pages/Features/Documents/content";
import { inspectTemplate, quoteQuery, quoteUrl, renderInBrowser, sameJson, QUOTE_DEFAULTS } from "../../resources/js/Pages/Features/Documents/quote";
import { DEMO_TOKEN, createDemoSignClient, verifyCompletion } from "../../resources/js/Pages/Features/Documents/sign";

/**
 * The /features/documents capability demos, in Node.
 *
 * The quote fixture is written by PHP (DocumentsFeatureSiteTest keeps it equal
 * to what QuoteDemo renders today), so "TypeScript render == PHP render" here
 * is a real cross-language check of fancy-template on the page's own template.
 */

const fixture = JSON.parse(readFileSync(join(process.cwd(), "tests/js/fixtures/documents-quote.json"), "utf8")) as {
    data: Record<string, unknown>;
    document: Record<string, unknown>;
};

describe("the quote template", () => {
    it.each(["last-word", "holy-sheet"] as const)("%s passes the TypeScript leg's inspect()", (writer) => {
        expect(inspectTemplate(writer)).toEqual({ ok: true, issues: [] });
    });

    it("renders in the browser exactly as PHP renders it", () => {
        const doc = renderInBrowser(fixture.data);
        expect(sameJson(doc, fixture.document)).toBe(true);
    });

    it("refuses data that does not fit the template", () => {
        expect(() => renderInBrowser({ ...fixture.data, models: "nope" })).toThrow(/models/);
    });

    it("builds bounded query strings for the server", () => {
        const query = new URLSearchParams(quoteQuery({ ...QUOTE_DEFAULTS, seats: 99999, months: 0, company: "x".repeat(200) }));
        expect(query.get("seats")).toBe("5000");
        expect(query.get("months")).toBe("1");
        expect(query.get("company")).toHaveLength(80);
        expect(query.getAll("models[]")).toEqual(["fixed", "retainer", "usage"]);
        expect(quoteUrl(QUOTE_DEFAULTS, "pdf")).toMatch(/^\/features\/documents\/quote\.pdf\?/);
    });
});

describe("capability cards", () => {
    const pascal = (name: string) => name.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");

    it.each(DOCUMENTS_CAPABILITIES.map((c) => c.icon))("%s is a lucide icon", (name) => {
        expect((lucide as Record<string, unknown>)[pascal(name)]).toBeTruthy();
    });
});

describe("the in-page signing backend", () => {
    const pdfBytes = new TextEncoder().encode("%PDF-1.7 demo document");
    const make = () => {
        const codes: Record<string, string> = {};
        const client = createDemoSignClient({
            title: "Quote",
            signerName: "Jordan Lee",
            loadDocument: async () => new Blob([pdfBytes], { type: "application/pdf" }),
            codeFor: (purpose) => (purpose === "view" ? "111111" : "222222"),
            onCode: (purpose, code) => {
                codes[purpose] = code;
            },
        });
        return { client, codes };
    };

    const signAll = async () => {
        const { client } = make();
        await client.requestCode(DEMO_TOKEN, "view");
        await client.verifyViewCode(DEMO_TOKEN, "111111");
        const view = await client.getSignerView(DEMO_TOKEN);
        await client.consent(DEMO_TOKEN, view.consent.version);
        await client.signerDocument(DEMO_TOKEN);
        await client.requestCode(DEMO_TOKEN, "accept");
        const signed = await client.sign(DEMO_TOKEN, {
            fields: { sig_client: true, date_client: true },
            mark: { kind: "typed", text: "Jordan Lee" },
            adoption: view.adoption_text,
            code: "222222",
        });
        return { client, signed };
    };

    it("runs a whole ceremony to a completion record", async () => {
        const { client, signed } = await signAll();
        expect(signed.signer.status).toBe("signed");
        const envelope = client.envelope();
        expect(envelope.status).toBe("completed");
        expect(envelope.completion?.final_sha256).toMatch(/^[0-9a-f]{64}$/);
        expect(client.events().map((e) => e.type)).toEqual(
            expect.arrayContaining(["otp.sent", "otp.verified", "consent.accepted", "document.opened", "mark.adopted", "signer.signed", "envelope.completed"]),
        );
        // No personal network data in the trail.
        expect(client.events().every((e) => e.ip === null && e.user_agent === null)).toBe(true);
    });

    it("verifies the record, and names the check a tampered file fails", async () => {
        const { client } = await signAll();
        const completion = client.envelope().completion!;
        const events = client.events();
        const pdf = new Blob([pdfBytes]);

        expect(await verifyCompletion({ pdf, completion, events })).toMatchObject({ ok: true, checks: { token: true, final_hash: true, chain: true, seal: null } });
        expect((await verifyCompletion({ pdf: new Blob([new TextEncoder().encode("%PDF-1.7 changed")]), completion, events })).reason).toBe("final_hash_mismatch");
        expect((await verifyCompletion({ pdf, completion: { ...completion, final_sha256: "0".repeat(64) }, events })).reason).toBe("token_mismatch");
        const forged = events.map((e, i) => (i === 3 ? { ...e, data: { forged: true } } : e));
        expect((await verifyCompletion({ pdf, completion, events: forged })).reason).toBe("chain_broken");
    });

    it("refuses signing before the code, and locks after five wrong codes", async () => {
        const { client } = make();
        await expect(client.getSignerView(DEMO_TOKEN)).rejects.toMatchObject({ code: "session_required" });
        await client.requestCode(DEMO_TOKEN, "view");
        for (let i = 0; i < 4; i++) {
            await expect(client.verifyViewCode(DEMO_TOKEN, "000000")).rejects.toMatchObject({ code: "otp_invalid" });
        }
        await expect(client.verifyViewCode(DEMO_TOKEN, "000000")).rejects.toMatchObject({ code: "otp_locked" });
        await expect(client.verifyViewCode(DEMO_TOKEN, "111111")).rejects.toMatchObject({ code: "otp_invalid" });
    });

    it("refuses sender actions: the demo is the signer's side", async () => {
        const { client } = make();
        await expect(client.sendEnvelope("env_demo")).rejects.toMatchObject({ code: "forbidden" });
    });
});
