import type { SetupWizardStep, SetupWizardValue } from "@particle-academy/react-fancy";
import type { ConnectorSetupStep } from "./types";

/**
 * The pure half of the connector setup page: turning the index's steps into
 * react-fancy `SetupWizard` steps, the tokens its Copy buttons fill in, and the
 * progress kept per connector in localStorage.
 */

/** The example host the app-URL field starts on (RFC 2606: never a real site). */
export const DEFAULT_APP_URL = "https://app.example.com";
export const DEFAULT_APP_NAME = "My App";

/**
 * The index's steps as SetupWizard steps. A null becomes an absent key, so the
 * wizard's own defaults apply (a step with no `actor` is the person's). The
 * text is passed through untouched: the wizard fills `{{tokens}}` itself, as
 * literal replacement, and nothing here invents or rewrites a step.
 */
export function toWizardSteps(steps: ConnectorSetupStep[]): SetupWizardStep[] {
    return steps.map((step, i) => ({
        id: `step-${i + 1}`,
        title: step.title,
        detail: step.detail,
        ...(step.url ? { url: step.url } : {}),
        ...(step.actor ? { actor: step.actor } : {}),
        ...(step.prompt ? { prompt: step.prompt } : {}),
        ...(step.copy && step.copy.length > 0 ? { copy: step.copy } : {}),
        ...(step.done ? { done: step.done } : {}),
    }));
}

/**
 * The closed set of five tokens (`.ai/plans/setup-wizards.md`, decided
 * 2026-11-08). Nothing else is ever filled in: a step naming any other token
 * shows it as written.
 */
export const WIZARD_TOKENS = ["appUrl", "appName", "connector", "webhookUrl", "oauthRedirectUrl"] as const;
export type WizardToken = (typeof WIZARD_TOKENS)[number];

/** The two URLs the host supplies. `null` (or blank) means "use the example". */
export type WizardUrls = { webhookUrl: string | null; oauthRedirectUrl: string | null };

/**
 * Trailing slashes off, in one linear pass. Not `/\/+$/`: that regex is
 * quadratic on a long run of slashes followed by anything else.
 */
function trimSlashes(value: string): string {
    let end = value.length;
    while (end > 0 && value.charCodeAt(end - 1) === 47) end--;
    return value.slice(0, end);
}

function appUrlOf(appUrl: string): string {
    const url = trimSlashes(appUrl.trim());
    return url === "" ? DEFAULT_APP_URL : url;
}

/**
 * Example values for the two URL fields, built from the app URL. They are only
 * examples: the routes are the host's own, so the person changes them to
 * whatever their app really serves.
 */
export function exampleUrls(appUrl: string, connector: string): { webhookUrl: string; oauthRedirectUrl: string } {
    const base = appUrlOf(appUrl);

    return {
        webhookUrl: `${base}/connectors/${connector}/webhooks`,
        oauthRedirectUrl: `${base}/connectors/${connector}/oauth/callback`,
    };
}

/**
 * The five tokens: `{{appUrl}}` (no trailing slash, so `{{appUrl}}/callback`
 * never doubles one), `{{appName}}`, `{{connector}}` (the index slug), and the
 * two URLs, as typed or else their example. A blank field falls back to the
 * default rather than filling an empty string into a redirect URI.
 */
export function wizardTokens(appUrl: string, appName: string, connector: string, urls?: Partial<WizardUrls>): Record<WizardToken, string> {
    const examples = exampleUrls(appUrl, connector);
    const typed = (value: string | null | undefined, example: string) => {
        const v = (value ?? "").trim();
        return v === "" ? example : v;
    };

    return {
        appUrl: appUrlOf(appUrl),
        appName: appName.trim() === "" ? DEFAULT_APP_NAME : appName.trim(),
        connector,
        webhookUrl: typed(urls?.webhookUrl, examples.webhookUrl),
        oauthRedirectUrl: typed(urls?.oauthRedirectUrl, examples.oauthRedirectUrl),
    };
}

const TOKEN = /\{\{([A-Za-z]+)\}\}/g;

/** Literal replacement of the five tokens; anything else stays as written. */
function fillText(text: string, tokens: Record<WizardToken, string>): string {
    return text.replace(TOKEN, (whole: string, name: string) =>
        (WIZARD_TOKENS as readonly string[]).includes(name) ? tokens[name as WizardToken] : whole,
    );
}

/**
 * Fills the step `title` and `done` line. react-fancy 6.19.1's SetupWizard
 * fills `detail`, `prompt` and copy values itself but shows a title (and the
 * stepper label built from it) and `done` as written, so twilio's "Create a
 * Standard API key for {{appName}}" reached the screen with the braces in it.
 * The same closed set, the same literal replacement (a function replacer, so
 * a value is never read as a pattern). Drop this once the wizard fills them.
 */
export function fillStepText(steps: SetupWizardStep[], tokens: Record<WizardToken, string>): SetupWizardStep[] {
    return steps.map((step) => ({
        ...step,
        title: fillText(step.title, tokens),
        ...(step.done ? { done: fillText(step.done, tokens) } : {}),
    }));
}

export const progressKey = (connector: string) => `fancy:connector-setup:${connector}`;
const urlsKey = (connector: string) => `${progressKey(connector)}:urls`;

/** The two URLs for one connector, as the person last typed them; null where they have not. */
export function loadUrls(storage: Pick<Storage, "getItem"> | null, connector: string): WizardUrls {
    const none: WizardUrls = { webhookUrl: null, oauthRedirectUrl: null };
    if (!storage) return none;
    try {
        const raw = JSON.parse(storage.getItem(urlsKey(connector)) ?? "null");
        return {
            webhookUrl: typeof raw?.webhookUrl === "string" ? raw.webhookUrl : null,
            oauthRedirectUrl: typeof raw?.oauthRedirectUrl === "string" ? raw.oauthRedirectUrl : null,
        };
    } catch {
        return none;
    }
}

export function saveUrls(storage: Pick<Storage, "setItem"> | null, connector: string, urls: WizardUrls): void {
    try {
        storage?.setItem(urlsKey(connector), JSON.stringify(urls));
    } catch {
        // Private mode or a full quota: the URLs just aren't kept.
    }
}
export const APP_KEY = "fancy:connector-setup:app";

/**
 * Saved progress for one connector, or a fresh start. Anything malformed, or
 * pointing past the steps this connector has NOW, is discarded rather than
 * trusted: the steps can change between visits.
 */
export function loadProgress(storage: Pick<Storage, "getItem"> | null, connector: string, stepCount: number): SetupWizardValue {
    const fresh: SetupWizardValue = { current: 0, done: [] };
    if (!storage) return fresh;
    try {
        const raw = JSON.parse(storage.getItem(progressKey(connector)) ?? "null");
        if (!raw || typeof raw !== "object") return fresh;
        const current = Number.isInteger(raw.current) && raw.current >= 0 && raw.current < stepCount ? raw.current : 0;
        const done = Array.isArray(raw.done)
            ? [...new Set<number>(raw.done.filter((n: unknown) => Number.isInteger(n) && (n as number) >= 0 && (n as number) < stepCount))].sort((a, b) => a - b)
            : [];
        return { current, done };
    } catch {
        return fresh;
    }
}

export function saveProgress(storage: Pick<Storage, "setItem"> | null, connector: string, value: SetupWizardValue): void {
    try {
        storage?.setItem(progressKey(connector), JSON.stringify(value));
    } catch {
        // Private mode or a full quota: progress just isn't kept.
    }
}

/** The person's app URL and name, shared by every connector's wizard. */
export function loadApp(storage: Pick<Storage, "getItem"> | null): { appUrl: string; appName: string } {
    const fallback = { appUrl: DEFAULT_APP_URL, appName: DEFAULT_APP_NAME };
    if (!storage) return fallback;
    try {
        const raw = JSON.parse(storage.getItem(APP_KEY) ?? "null");
        return {
            appUrl: typeof raw?.appUrl === "string" ? raw.appUrl : fallback.appUrl,
            appName: typeof raw?.appName === "string" ? raw.appName : fallback.appName,
        };
    } catch {
        return fallback;
    }
}

export function saveApp(storage: Pick<Storage, "setItem"> | null, app: { appUrl: string; appName: string }): void {
    try {
        storage?.setItem(APP_KEY, JSON.stringify(app));
    } catch {
        // As above.
    }
}

/** The browser's localStorage, or null on the server and when it is blocked. */
export function browserStorage(): Storage | null {
    try {
        return typeof window === "undefined" ? null : window.localStorage;
    } catch {
        return null;
    }
}
