import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { router } from "@inertiajs/react";
import {
    useCoBrowseSession,
    type CoBrowseSession,
    type NavigationBridgeAdapter,
    type NavigationConfirmRequest,
    type PageAction,
    type PageSnapshot,
} from "@particle-academy/agent-integrations";

/**
 * Site-wide co-browsing. Mounts ONE persistent in-page MCP server (the
 * navigation bridge) above the Inertia page outlet, so a connected agent can
 * drive *any* page — navigate, scroll, fill, click — while the human watches,
 * and the agent stays aware of what the human does. SSR-safe: every effect is
 * client-only; render is a passthrough (provider + a staged-confirm modal).
 *
 * The Inertia/DOM adapter is the host half of the contract in
 * @particle-academy/agent-integrations' `registerNavigationBridge`. Handles are
 * STABLE (data-co-handle → name → id → role+label), never CSS selectors — the
 * Human+ way: the agent acts on labeled handles, not the DOM.
 */
const CoBrowseContext = createContext<CoBrowseSession | null>(null);

export function useCoBrowse(): CoBrowseSession | null {
    return useContext(CoBrowseContext);
}

// ───────────────────────── DOM walker (client-only) ─────────────────────────

const INTERACTIVE =
    "a[href], button, input, select, textarea, [role=button], [role=link], [role=checkbox], [role=tab], [data-co-handle]";

function isVisible(el: Element): boolean {
    const he = el as HTMLElement;
    if ((el as HTMLInputElement).type === "hidden") return false;
    if (he.hidden || he.getAttribute("aria-hidden") === "true") return false;
    return he.offsetParent !== null || he.getClientRects().length > 0;
}

/** Sensitive fields whose value is never read into the snapshot. */
function isSensitive(el: Element): boolean {
    const input = el as HTMLInputElement;
    const ac = (el.getAttribute("autocomplete") ?? "").toLowerCase();
    return (
        input.type === "password" ||
        ac.startsWith("cc-") ||
        ac === "one-time-code" ||
        el.hasAttribute("data-private")
    );
}

function roleOf(el: Element): string {
    const explicit = el.getAttribute("role");
    if (explicit) return explicit;
    const tag = el.tagName.toLowerCase();
    if (tag === "a") return "link";
    if (tag === "button") return "button";
    if (tag === "select") return "select";
    if (tag === "textarea") return "textbox";
    if (tag === "input") {
        const t = (el as HTMLInputElement).type;
        if (t === "checkbox") return "checkbox";
        if (t === "radio") return "radio";
        if (t === "submit" || t === "button") return "button";
        return "textbox";
    }
    return "generic";
}

function accessibleName(el: Element): string {
    const aria = el.getAttribute("aria-label");
    if (aria) return aria.trim();
    const labelledby = el.getAttribute("aria-labelledby");
    if (labelledby) {
        const txt = labelledby
            .split(/\s+/)
            .map((id) => document.getElementById(id)?.textContent ?? "")
            .join(" ")
            .trim();
        if (txt) return txt;
    }
    const id = el.getAttribute("id");
    if (id) {
        const lbl = document.querySelector(`label[for="${CSS.escape(id)}"]`);
        if (lbl?.textContent?.trim()) return lbl.textContent.trim();
    }
    const wrapping = el.closest("label");
    if (wrapping?.textContent?.trim()) return wrapping.textContent.trim();
    const placeholder = el.getAttribute("placeholder");
    if (placeholder) return placeholder.trim();
    const text = (el as HTMLElement).textContent?.trim();
    if (text) return text.replace(/\s+/g, " ").slice(0, 80);
    return el.getAttribute("name") ?? el.getAttribute("id") ?? roleOf(el);
}

function isDestructive(el: Element, label: string): boolean {
    if (el.hasAttribute("data-co-confirm")) return true;
    if ((el as HTMLInputElement).type === "submit") return true;
    if (el.tagName === "BUTTON" && (el as HTMLButtonElement).type === "submit") return true;
    return /\b(delete|remove|destroy|sign out|log ?out|cancel subscription|deactivate)\b/i.test(label);
}

/**
 * Build a fresh snapshot + a handle→element registry. Handle preference:
 * data-co-handle → name → id → `role#index` (stable within a snapshot).
 */
function walk(): { snapshot: PageSnapshot; registry: Map<string, Element> } {
    const registry = new Map<string, Element>();
    const actions: PageAction[] = [];
    const seen = new Set<Element>();
    let synthetic = 0;

    for (const el of Array.from(document.querySelectorAll(INTERACTIVE))) {
        if (seen.has(el) || !isVisible(el)) continue;
        seen.add(el);
        const label = accessibleName(el);
        const role = roleOf(el);
        let handle =
            el.getAttribute("data-co-handle") ??
            (el as HTMLInputElement).name ??
            el.getAttribute("id") ??
            "";
        if (!handle || registry.has(handle)) handle = `${role}#${synthetic++}`;
        registry.set(handle, el);

        let value: unknown;
        if (role === "textbox" || role === "select") {
            value = isSensitive(el) ? undefined : (el as HTMLInputElement).value;
        } else if (role === "checkbox" || role === "radio") {
            value = (el as HTMLInputElement).checked;
        }

        actions.push({ handle, role, label, value, destructive: isDestructive(el, label) });
    }

    return {
        snapshot: { url: window.location.pathname + window.location.search, title: document.title, actions },
        registry,
    };
}

/** Set a controlled React input/select/textarea value so its onChange fires. */
function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: unknown): void {
    if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
        const proto = HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, "checked")?.set;
        setter?.call(el, Boolean(value));
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return;
    }
    const proto =
        el instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : el instanceof HTMLSelectElement
              ? HTMLSelectElement.prototype
              : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    setter?.call(el, String(value));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
}

// ───────────────────────────── Provider ─────────────────────────────

type PendingConfirm = { req: NavigationConfirmRequest; resolve: (ok: boolean) => void };

// Best-effort CSRF token. The relay routes (/agent-relay/*) are
// CSRF-exempt (bootstrap/app.php), so this is belt-and-braces — read the
// meta tag if present, else the XSRF-TOKEN cookie Laravel sets. CoBrowseProvider
// mounts ABOVE the Inertia <App>, so usePage() is unavailable here.
function readCsrf(): string | undefined {
    if (typeof document === "undefined") return undefined;
    const meta = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
    if (meta) return meta;
    const m = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : undefined;
}

export function CoBrowseProvider({ children }: { children: ReactNode }) {
    const registryRef = useRef<Map<string, Element>>(new Map());
    const [pending, setPending] = useState<PendingConfirm | null>(null);

    const resolve = useCallback((handle: string): Element | null => {
        const hit = registryRef.current.get(handle);
        if (hit && hit.isConnected) return hit;
        // Fallback: a real attribute handle the agent may use before describe().
        return (
            document.querySelector(`[data-co-handle="${CSS.escape(handle)}"]`) ??
            document.querySelector(`[name="${CSS.escape(handle)}"]`) ??
            document.getElementById(handle)
        );
    }, []);

    // Stable adapter — built once; every method reads live DOM / window.
    const adapter = useMemo<NavigationBridgeAdapter>(
        () => ({
            getLocation: () => ({
                url: window.location.pathname + window.location.search,
                title: document.title,
            }),
            describe: () => {
                const { snapshot, registry } = walk();
                registryRef.current = registry;
                return snapshot;
            },
            read: () => {
                const main = document.querySelector("main") ?? document.body;
                const heads = Array.from(main.querySelectorAll("h1, h2, h3"))
                    .map((h) => `${h.tagName}: ${h.textContent?.trim() ?? ""}`)
                    .filter(Boolean);
                const text = (main.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 4000);
                return [document.title, ...heads, "", text].join("\n");
            },
            visit: (url) => router.visit(url),
            back: () => window.history.back(),
            forward: () => window.history.forward(),
            scrollTo: ({ x, y, handle }) => {
                if (handle) {
                    resolve(handle)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    return;
                }
                window.scrollTo({ left: x ?? window.scrollX, top: y ?? window.scrollY, behavior: "smooth" });
            },
            scrollBy: (dy) => window.scrollBy({ top: dy, behavior: "smooth" }),
            setField: (handle, value) => {
                const el = resolve(handle);
                if (!el) return { ok: false, error: `No element for handle "${handle}"` };
                if (
                    el instanceof HTMLInputElement ||
                    el instanceof HTMLTextAreaElement ||
                    el instanceof HTMLSelectElement
                ) {
                    setNativeValue(el, value);
                    return { ok: true };
                }
                return { ok: false, error: `Handle "${handle}" is not a form field` };
            },
            click: (handle) => {
                const el = resolve(handle);
                if (!el) return { ok: false, error: `No element for handle "${handle}"` };
                (el as HTMLElement).click();
                return { ok: true };
            },
            submit: (handle) => {
                const el = resolve(handle);
                if (!el) return { ok: false, error: `No element for handle "${handle}"` };
                const form = el instanceof HTMLFormElement ? el : el.closest("form");
                if (!form) return { ok: false, error: `Handle "${handle}" is not inside a form` };
                if (typeof form.requestSubmit === "function") form.requestSubmit();
                else form.submit();
                return { ok: true };
            },
            confirm: (req) => new Promise<boolean>((res) => setPending({ req, resolve: res })),
        }),
        [resolve],
    );

    const session = useCoBrowseSession({
        adapter,
        agent: { id: "agent", name: "Agent", color: "#a855f7" },
        relayBaseUrl: "/agent-relay",
        info: {
            name: "Fancy UI — co-browse",
            version: "0.1.0",
            instructions:
                "You are co-browsing the Fancy UI showcase with a watching human. Call page_describe first (and after every navigation) to get stable handles, then navigate/scroll/fill/click. Submits and destructive clicks are staged — the human confirms. You receive notifications/agent_activity (source:\"user\") when the human navigates, scrolls, or types.",
        },
        csrfToken: readCsrf,
    });

    // Observe the human so the connected agent stays aware. Only while sharing.
    const active = session.session != null;
    const observeRef = useRef(session.observeUser);
    observeRef.current = session.observeUser;

    useEffect(() => {
        if (!active) return;
        const offNavigate = router.on("navigate", (event) => {
            const url = (event as any).detail?.page?.url ?? window.location.pathname;
            observeRef.current({ kind: "navigation", url, title: document.title });
        });

        const onInput = (e: Event) => {
            const t = e.target as HTMLElement | null;
            if (!t || !(t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement)) {
                return;
            }
            const handle = t.getAttribute("data-co-handle") ?? (t as HTMLInputElement).name ?? t.id ?? "field";
            const masked = isSensitive(t);
            observeRef.current({
                kind: "form",
                handle,
                value: masked ? undefined : (t as HTMLInputElement).value,
                masked,
            });
        };
        document.addEventListener("change", onInput, true);

        let raf = 0;
        const onScroll = () => {
            if (raf) return;
            raf = window.requestAnimationFrame(() => {
                raf = 0;
                observeRef.current({ kind: "scroll", y: window.scrollY });
            });
        };
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => {
            offNavigate();
            document.removeEventListener("change", onInput, true);
            window.removeEventListener("scroll", onScroll);
            if (raf) window.cancelAnimationFrame(raf);
        };
    }, [active]);

    const decide = (ok: boolean) => {
        pending?.resolve(ok);
        setPending(null);
    };

    return (
        <CoBrowseContext.Provider value={session}>
            {children}
            {pending && (
                <div className="co-browse-confirm-backdrop" role="dialog" aria-modal="true" data-co-browse-confirm>
                    <div className="co-browse-confirm-card">
                        <p className="co-browse-confirm-title">
                            The agent wants to {pending.req.action === "submit" ? "submit" : "activate"}:
                        </p>
                        <p className="co-browse-confirm-label">{pending.req.label}</p>
                        <div className="co-browse-confirm-actions">
                            <button type="button" className="btn btn-ghost" onClick={() => decide(false)}>
                                Decline
                            </button>
                            <button type="button" className="btn btn-primary" onClick={() => decide(true)} autoFocus>
                                Allow
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </CoBrowseContext.Provider>
    );
}
