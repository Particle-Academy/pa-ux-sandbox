import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
    DEFAULT_APP_NAME,
    DEFAULT_APP_URL,
    exampleUrls,
    fillStepText,
    loadApp,
    loadProgress,
    loadUrls,
    progressKey,
    saveApp,
    saveProgress,
    saveUrls,
    toWizardSteps,
    WIZARD_TOKENS,
    wizardTokens,
} from "../../resources/js/Pages/Features/Connectors/wizard";
import type { ConnectorSetupStep } from "../../resources/js/Pages/Features/Connectors/types";

/*
 * The pure half of /features/connectors/{service}/setup: index steps into
 * SetupWizard steps, the closed set of five tokens, and progress per connector.
 */

const step = (over: Partial<ConnectorSetupStep>): ConnectorSetupStep => ({
    title: "T",
    detail: "D",
    url: null,
    actor: null,
    prompt: null,
    copy: null,
    fields: null,
    done: null,
    ...over,
});

function memory(): Storage {
    const data = new Map<string, string>();
    return {
        getItem: (k) => data.get(k) ?? null,
        setItem: (k, v) => void data.set(k, v),
        removeItem: (k) => void data.delete(k),
        clear: () => data.clear(),
        key: (i) => [...data.keys()][i] ?? null,
        get length() {
            return data.size;
        },
    };
}

describe("toWizardSteps", () => {
    it("drops nulls so the wizard's own defaults apply, and keeps text untouched", () => {
        const [person, agent] = toWizardSteps([
            step({ title: "Create a key", detail: "For {{appName}}.", url: "https://console.twilio.com/", copy: [{ label: "Callback", value: "{{appUrl}}/x" }], done: "You have it." }),
            step({ actor: "agent", prompt: "Install {{connector}}." }),
        ]);

        expect(person).toEqual({
            id: "step-1",
            title: "Create a key",
            detail: "For {{appName}}.",
            url: "https://console.twilio.com/",
            copy: [{ label: "Callback", value: "{{appUrl}}/x" }],
            done: "You have it.",
        });
        expect(person).not.toHaveProperty("actor");
        expect(agent).toEqual({ id: "step-2", title: "T", detail: "D", actor: "agent", prompt: "Install {{connector}}." });
    });

    it("never invents a step", () => {
        expect(toWizardSteps([])).toEqual([]);
    });
});

describe("wizardTokens", () => {
    it("fills exactly the closed set of five, without a trailing slash", () => {
        const tokens = wizardTokens("https://shop.example.org/", " Shop ", "twilio");

        expect(Object.keys(tokens).sort()).toEqual([...WIZARD_TOKENS].sort());
        expect(WIZARD_TOKENS).toEqual(["appUrl", "appName", "connector", "webhookUrl", "oauthRedirectUrl"]);
        expect(tokens).toEqual({
            appUrl: "https://shop.example.org",
            appName: "Shop",
            connector: "twilio",
            webhookUrl: "https://shop.example.org/connectors/twilio/webhooks",
            oauthRedirectUrl: "https://shop.example.org/connectors/twilio/oauth/callback",
        });
    });

    it("falls back to the example host and default name rather than an empty string", () => {
        expect(wizardTokens("  ", "", "stripe")).toEqual({
            appUrl: DEFAULT_APP_URL,
            appName: DEFAULT_APP_NAME,
            connector: "stripe",
            webhookUrl: "https://app.example.com/connectors/stripe/webhooks",
            oauthRedirectUrl: "https://app.example.com/connectors/stripe/oauth/callback",
        });
        expect(DEFAULT_APP_URL).toBe("https://app.example.com");
    });

    it("pre-fills both URLs from the app URL, as examples the person can change", () => {
        expect(exampleUrls("https://crm.example.net///", "microsoft-teams")).toEqual({
            webhookUrl: "https://crm.example.net/connectors/microsoft-teams/webhooks",
            oauthRedirectUrl: "https://crm.example.net/connectors/microsoft-teams/oauth/callback",
        });
    });

    it("uses what the person typed for either URL, and the example when it is blank", () => {
        const tokens = wizardTokens("https://shop.example.org", "Shop", "microsoft-teams", {
            webhookUrl: " https://hooks.example.org/in ",
            oauthRedirectUrl: "   ",
        });

        expect(tokens.webhookUrl).toBe("https://hooks.example.org/in");
        expect(tokens.oauthRedirectUrl).toBe("https://shop.example.org/connectors/microsoft-teams/oauth/callback");
    });

    it("strips a long run of trailing slashes in linear time", () => {
        const started = Date.now();
        const tokens = wizardTokens("https://a.example.com" + "/".repeat(50_000) + "x", "A", "twilio");
        expect(Date.now() - started).toBeLessThan(500);
        expect(tokens.appUrl.endsWith("x")).toBe(true);
    });
});

describe("fillStepText", () => {
    const tokens = wizardTokens("https://shop.example.org", "Shop", "twilio");

    it("fills the title and done line, which SetupWizard 6.19.1 shows as written", () => {
        const [filled] = fillStepText(
            toWizardSteps([step({ title: "Create a key for {{appName}}", detail: "For {{appName}}.", done: "{{connector}} answers." })]),
            tokens,
        );

        expect(filled.title).toBe("Create a key for Shop");
        expect(filled.done).toBe("twilio answers.");
        // The rest is left for the wizard, which fills it itself.
        expect(filled.detail).toBe("For {{appName}}.");
    });

    it("fills only the closed set, literally: an unknown token stays, and a value is never a pattern", () => {
        const [filled] = fillStepText(
            toWizardSteps([step({ title: "{{appName}} {{secret}} {{webhookUrl}}" })]),
            { ...tokens, appName: "$& $1 Shop" },
        );

        expect(filled.title).toBe("$& $1 Shop {{secret}} https://shop.example.org/connectors/twilio/webhooks");
    });
});

describe("the served index", () => {
    const index = JSON.parse(readFileSync(resolve(process.cwd(), "resources/registry/connectors.json"), "utf8")) as {
        connectors: { slug: string; setup: ConnectorSetupStep[] | null }[];
    };

    it("uses no token outside the closed set, so every step renders filled", () => {
        const used = new Set<string>();
        for (const c of index.connectors) {
            for (const m of JSON.stringify(c.setup ?? []).matchAll(/\{\{([^}]*)\}\}/g)) used.add(m[1]);
        }

        expect([...used].filter((t) => !(WIZARD_TOKENS as readonly string[]).includes(t))).toEqual([]);
        expect(used.has("oauthRedirectUrl")).toBe(true);
    });

    it("gives twilio its five real steps, the last one the agent's", () => {
        const twilio = index.connectors.find((c) => c.slug === "twilio");
        const steps = toWizardSteps(twilio?.setup ?? []);

        expect(steps).toHaveLength(5);
        expect(steps[1].copy).toEqual([{ label: "Friendly name", value: "{{appName}} ({{connector}})" }]);
        expect(steps[4].actor).toBe("agent");
        expect(steps[4].prompt).toContain("message_get");
        expect(steps[4].done).toBeTruthy();
    });
});

describe("the two URL fields", () => {
    it("are kept per connector, and absent until the person edits one", () => {
        const storage = memory();
        expect(loadUrls(storage, "twilio")).toEqual({ webhookUrl: null, oauthRedirectUrl: null });

        saveUrls(storage, "twilio", { webhookUrl: "https://hooks.example.org/sms", oauthRedirectUrl: null });
        expect(loadUrls(storage, "twilio")).toEqual({ webhookUrl: "https://hooks.example.org/sms", oauthRedirectUrl: null });
        expect(loadUrls(storage, "stripe")).toEqual({ webhookUrl: null, oauthRedirectUrl: null });
    });

    it("ignore garbage", () => {
        const storage = memory();
        storage.setItem(`${progressKey("twilio")}:urls`, JSON.stringify({ webhookUrl: 5, oauthRedirectUrl: "https://ok.example.org/cb" }));
        expect(loadUrls(storage, "twilio")).toEqual({ webhookUrl: null, oauthRedirectUrl: "https://ok.example.org/cb" });
        storage.setItem(`${progressKey("twilio")}:urls`, "{nope");
        expect(loadUrls(storage, "twilio")).toEqual({ webhookUrl: null, oauthRedirectUrl: null });
    });
});

describe("progress", () => {
    it("is kept per connector", () => {
        const storage = memory();
        saveProgress(storage, "twilio", { current: 2, done: [0, 1] });
        saveProgress(storage, "stripe", { current: 1, done: [0] });

        expect(loadProgress(storage, "twilio", 4)).toEqual({ current: 2, done: [0, 1] });
        expect(loadProgress(storage, "stripe", 4)).toEqual({ current: 1, done: [0] });
        expect(progressKey("twilio")).toBe("fancy:connector-setup:twilio");
    });

    it("discards progress that points past the steps the connector has now", () => {
        const storage = memory();
        saveProgress(storage, "twilio", { current: 5, done: [0, 4, 9, -1] });

        expect(loadProgress(storage, "twilio", 3)).toEqual({ current: 0, done: [0] });
    });

    it("starts fresh on garbage, and with no storage at all", () => {
        const storage = memory();
        storage.setItem(progressKey("twilio"), "{not json");

        expect(loadProgress(storage, "twilio", 3)).toEqual({ current: 0, done: [] });
        expect(loadProgress(null, "twilio", 3)).toEqual({ current: 0, done: [] });
    });

    it("keeps the app URL and name across connectors", () => {
        const storage = memory();
        expect(loadApp(storage)).toEqual({ appUrl: DEFAULT_APP_URL, appName: DEFAULT_APP_NAME });

        saveApp(storage, { appUrl: "https://crm.example.net", appName: "CRM" });
        expect(loadApp(storage)).toEqual({ appUrl: "https://crm.example.net", appName: "CRM" });
    });
});
