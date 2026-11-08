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
 * The three tokens the plan names, and only those: `{{appUrl}}` (no trailing
 * slash, so `{{appUrl}}/callback` never doubles one), `{{appName}}` and
 * `{{connector}}` (the index slug). A blank field falls back to the default
 * rather than filling an empty string into a redirect URI.
 */
export function wizardTokens(appUrl: string, appName: string, connector: string): Record<string, string> {
    const url = appUrl.trim().replace(/\/+$/, "");

    return {
        appUrl: url === "" ? DEFAULT_APP_URL : url,
        appName: appName.trim() === "" ? DEFAULT_APP_NAME : appName.trim(),
        connector,
    };
}

export const progressKey = (connector: string) => `fancy:connector-setup:${connector}`;
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
