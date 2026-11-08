import { describe, expect, it } from "vitest";
import {
    DEFAULT_APP_NAME,
    DEFAULT_APP_URL,
    loadApp,
    loadProgress,
    progressKey,
    saveApp,
    saveProgress,
    toWizardSteps,
    wizardTokens,
} from "../../resources/js/Pages/Features/Connectors/wizard";
import type { ConnectorSetupStep } from "../../resources/js/Pages/Features/Connectors/types";

/*
 * The pure half of /features/connectors/{service}/setup: index steps into
 * SetupWizard steps, the three tokens, and progress per connector.
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
    it("fills exactly appUrl, appName and connector, without a trailing slash", () => {
        expect(wizardTokens("https://shop.example.org/", " Shop ", "twilio")).toEqual({
            appUrl: "https://shop.example.org",
            appName: "Shop",
            connector: "twilio",
        });
    });

    it("falls back to the example host and default name rather than an empty string", () => {
        expect(wizardTokens("  ", "", "stripe")).toEqual({ appUrl: DEFAULT_APP_URL, appName: DEFAULT_APP_NAME, connector: "stripe" });
        expect(DEFAULT_APP_URL).toBe("https://app.example.com");
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
