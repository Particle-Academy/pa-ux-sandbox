import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Badge,
    Button,
    Callout,
    Card,
    Field,
    Heading,
    Popover,
    Progress,
    Slider,
    Switch,
    Text,
    Tooltip,
} from "@particle-academy/react-fancy";
// Imported as components rather than via <Icon name="x" />. The brand pack
// registers its X mark under the key "x", which is ALSO a lucide icon (the close
// glyph) — and an addendum only fills gaps, so the base set wins and
// <Icon name="x" /> silently renders a close cross instead of the X logo.
// Importing the mark directly is unambiguous.
import { XIcon, LinkedinIcon } from "@particle-academy/fancy-brand-icons";
import { Seo } from "@particle-academy/fancy-inertia/seo";
import { Copy, Check, RefreshCw, Share2, Mail, Link2 } from "lucide-react";

/**
 * /pw — a standalone password generator.
 *
 * Deliberately shell-less: no site header, no nav, no footer. The ONLY Fancy
 * branding is the Fancy Pixel badge, which is injected into every page by the
 * root Blade view (the admin-pasted tracker snippet) rather than mounted here —
 * so this page inherits it exactly like an external consumer's site would.
 *
 * Entirely client-side. There is no route handler doing work, no fetch, and no
 * state that outlives the tab.
 */

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/~";

/**
 * Glyphs that are hard to tell apart in most fonts, and the reason a password
 * that has to be read aloud or retyped from a screen goes wrong.
 */
const AMBIGUOUS = new Set("O0oIl1|`'\"".split(""));

type SetKey = "upper" | "lower" | "digits" | "symbols";

const SETS: { key: SetKey; label: string; chars: string; hint: string }[] = [
    { key: "upper", label: "A–Z", chars: UPPER, hint: "Uppercase letters" },
    { key: "lower", label: "a–z", chars: LOWER, hint: "Lowercase letters" },
    { key: "digits", label: "0–9", chars: DIGITS, hint: "Digits" },
    { key: "symbols", label: "!@#", chars: SYMBOLS, hint: "Punctuation and symbols" },
];

/**
 * A uniformly-distributed integer in [0, max).
 *
 * The obvious `getRandomValues(...)[0] % max` is WRONG whenever `max` does not
 * divide 2^32: the first `2^32 % max` values become reachable one extra way, so
 * early characters in the alphabet get chosen slightly more often. The bias is
 * small, but it is a bias in the one function whose entire job is not having
 * one — so this rejects the non-uniform tail instead and draws again.
 */
function randomInt(max: number): number {
    const limit = Math.floor(0xffffffff / max) * max;
    const buf = new Uint32Array(1);
    let n = 0;
    do {
        crypto.getRandomValues(buf);
        n = buf[0]!;
    } while (n >= limit);
    return n % max;
}

function buildAlphabet(enabled: Record<SetKey, boolean>, avoidAmbiguous: boolean): string {
    const chars = SETS.filter((s) => enabled[s.key])
        .map((s) => s.chars)
        .join("");
    return avoidAmbiguous
        ? [...chars].filter((c) => !AMBIGUOUS.has(c)).join("")
        : chars;
}

/**
 * Generate a password, optionally guaranteeing at least one character from
 * every enabled set.
 *
 * The guarantee is done by rejecting a draw that misses a set and drawing
 * again, NOT by placing one character from each set at a fixed position and
 * filling around it — that second approach is what most generators do and it
 * leaks structure (position 0 is always uppercase, and so on).
 *
 * Retrying keeps the result uniform across all passwords that satisfy the
 * constraint. The retry probability is negligible at any sane length; the cap
 * exists so a pathological config (length 4, four sets, look-alikes excluded)
 * cannot spin forever — it falls back to the last unconstrained draw.
 */
function generate(
    length: number,
    enabled: Record<SetKey, boolean>,
    avoidAmbiguous: boolean,
    requireEach: boolean,
): string {
    const alphabet = buildAlphabet(enabled, avoidAmbiguous);
    if (!alphabet.length || length <= 0) return "";

    const active = SETS.filter((s) => enabled[s.key]).map((s) => ({
        key: s.key,
        pool: new Set(
            (avoidAmbiguous ? [...s.chars].filter((c) => !AMBIGUOUS.has(c)) : [...s.chars]),
        ),
    })).filter((s) => s.pool.size > 0);

    let last = "";
    for (let attempt = 0; attempt < 64; attempt++) {
        let out = "";
        for (let i = 0; i < length; i++) out += alphabet[randomInt(alphabet.length)];
        last = out;
        if (!requireEach) return out;
        const covers = active.every((s) => [...out].some((c) => s.pool.has(c)));
        if (covers) return out;
    }
    return last;
}

/**
 * What gets shared. Fixed copy plus the page URL — never the generated
 * password, and never any of the current settings.
 *
 * This is the one place on the page where a value could leave the browser, so
 * the share payload is built from constants and `location.origin` ONLY. It does
 * not read component state, which is what makes "the password is never sent
 * anywhere" true rather than merely intended: there is no code path from
 * `password` to a share target.
 */
const SHARE_TEXT = "A fast, entirely client-side password generator — nothing you generate ever leaves your browser.";

/**
 * Built on click, not at module load: `location` does not exist during Inertia
 * SSR, and origin is the only part that varies between environments.
 */
function shareUrl(): string {
    return `${window.location.origin}/pw`;
}

function openShare(href: string): void {
    // noopener/noreferrer: without them the opened tab gets a handle on
    // window.opener and can navigate this page somewhere else.
    window.open(href, "_blank", "noopener,noreferrer");
}

/** Shannon entropy of a uniform draw: length × log2(alphabet). */
function entropyBits(length: number, alphabetSize: number): number {
    return alphabetSize > 1 ? length * Math.log2(alphabetSize) : 0;
}

function strengthOf(bits: number): { label: string; color: "red" | "amber" | "blue" | "green"; pct: number } {
    // Anchored on entropy, not on the "has a symbol!" checklist that scores
    // "P@ssw0rd" as strong. 128 bits is the point past which the meter stops
    // being interesting, so the bar saturates there.
    const pct = Math.min(100, Math.round((bits / 128) * 100));
    if (bits < 45) return { label: "Weak", color: "red", pct };
    if (bits < 70) return { label: "Fair", color: "amber", pct };
    if (bits < 100) return { label: "Strong", color: "blue", pct };
    return { label: "Very strong", color: "green", pct };
}

/**
 * One row of the share menu. A plain button rather than a react-fancy control so
 * the `data-pw-share-target` handle actually reaches the DOM — see the note on
 * the Switch handles below.
 */
function ShareItem({
    label,
    icon,
    handle,
    onSelect,
}: {
    label: string;
    icon: React.ReactNode;
    handle: string;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            data-pw-share-target={handle}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span>
            {label}
        </button>
    );
}

export default function Pw() {
    const [length, setLength] = useState(20);
    const [enabled, setEnabled] = useState<Record<SetKey, boolean>>({
        upper: true,
        lower: true,
        digits: true,
        symbols: true,
    });
    const [avoidAmbiguous, setAvoidAmbiguous] = useState(false);
    const [requireEach, setRequireEach] = useState(true);
    const [password, setPassword] = useState("");
    const [copied, setCopied] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [canNativeShare, setCanNativeShare] = useState(false);

    // Feature-detected on mount rather than during render: navigator does not
    // exist under SSR, and branching on it while rendering would change the
    // markup between the server and client passes.
    useEffect(() => {
        setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    }, []);

    const alphabet = useMemo(
        () => buildAlphabet(enabled, avoidAmbiguous),
        [enabled, avoidAmbiguous],
    );
    const empty = alphabet.length === 0;

    const regenerate = useCallback(() => {
        if (empty) {
            setPassword("");
            return;
        }
        setPassword(generate(length, enabled, avoidAmbiguous, requireEach));
        setCopied(false);
    }, [empty, length, enabled, avoidAmbiguous, requireEach]);

    // Generate in an effect, never during render. The showcase runs Inertia SSR,
    // and a password produced while rendering would differ between the server
    // pass and the client pass — which is a hydration mismatch by construction.
    // `crypto` also is not guaranteed on the server. So the first paint is the
    // empty field and the first password appears on mount.
    useEffect(() => {
        regenerate();
    }, [regenerate]);

    const copy = useCallback(async () => {
        if (!password) return;
        try {
            // Only defined in a secure context; on plain http this throws rather
            // than silently doing nothing, so the catch is the real path.
            await navigator.clipboard.writeText(password);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
        } catch {
            setCopied(false);
        }
    }, [password]);

    const copyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(shareUrl());
            setLinkCopied(true);
            window.setTimeout(() => setLinkCopied(false), 1600);
        } catch {
            setLinkCopied(false);
        }
    }, []);

    const nativeShare = useCallback(async () => {
        try {
            await navigator.share({ title: "Password generator", text: SHARE_TEXT, url: shareUrl() });
        } catch {
            // Dismissing the OS share sheet rejects. That is a user choice, not
            // an error, and there is nothing to report.
        }
    }, []);

    const bits = entropyBits(length, alphabet.length);
    const strength = strengthOf(bits);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
            <Seo
                title="Password generator"
                description="A fast, entirely client-side password generator. Nothing you generate is ever sent anywhere."
            />

            <main className="w-full max-w-xl">
                <Card>
                    <div className="grid gap-6 p-1">
                        <div className="grid gap-1.5">
                            <Heading size="lg">Password generator</Heading>
                            <Text size="sm" color="muted">
                                Generated in your browser with{" "}
                                <code className="font-mono text-[0.85em]">crypto.getRandomValues</code>. The
                                password is never sent anywhere and never leaves this tab.
                            </Text>
                        </div>

                        {/* The output. readOnly rather than disabled so it stays
                            selectable and screen-reader reachable. */}
                        <div className="grid gap-2">
                            <div className="flex items-stretch gap-2">
                                <input
                                    readOnly
                                    value={password}
                                    aria-label="Generated password"
                                    data-pw-output
                                    spellCheck={false}
                                    autoComplete="off"
                                    className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 font-mono text-base tracking-wide break-all text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                                />
                                <Tooltip content={copied ? "Copied" : "Copy to clipboard"}>
                                    <Button
                                        color="zinc"
                                        onClick={copy}
                                        disabled={!password}
                                        aria-label="Copy password"
                                        data-pw-copy
                                    >
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                    </Button>
                                </Tooltip>
                                <Tooltip content="Generate a new password">
                                    <Button
                                        color="blue"
                                        onClick={regenerate}
                                        disabled={empty}
                                        aria-label="Regenerate password"
                                        data-pw-regenerate
                                    >
                                        <RefreshCw size={16} />
                                    </Button>
                                </Tooltip>
                            </div>

                            <div className="flex items-center gap-3">
                                <Progress
                                    value={strength.pct}
                                    color={strength.color}
                                    size="sm"
                                    className="flex-1"
                                />
                                <Badge color={strength.color} variant="soft" size="sm">
                                    {strength.label}
                                </Badge>
                                <Text size="xs" color="muted" className="tabular-nums whitespace-nowrap">
                                    {Math.round(bits)} bits
                                </Text>
                            </div>
                        </div>

                        {empty && (
                            <Callout color="amber">
                                Pick at least one character set — there is nothing to build a password from.
                            </Callout>
                        )}

                        <Field label={`Length — ${length}`}>
                            <Slider
                                min={8}
                                max={64}
                                step={1}
                                value={length}
                                onValueChange={setLength}
                                data-pw-length
                            />
                        </Field>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {/* `id`, not `data-*`: react-fancy's Switch renders a
                                <button role="switch"> and forwards `id` to it, but
                                does NOT spread unknown props — a data-* handle here
                                is silently dropped and never reaches the DOM, so an
                                agent (or a test) has nothing to address. Button and
                                plain inputs do forward theirs, which is why the rest
                                of this page uses data-*. */}
                            {SETS.map((s) => (
                                <Switch
                                    key={s.key}
                                    id={`pw-set-${s.key}`}
                                    label={`${s.hint} (${s.label})`}
                                    checked={enabled[s.key]}
                                    onCheckedChange={(checked) =>
                                        setEnabled((prev) => ({ ...prev, [s.key]: checked }))
                                    }
                                />
                            ))}
                        </div>

                        <div className="grid gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                            <Switch
                                id="pw-avoid-ambiguous"
                                label="Avoid look-alike characters (O 0 l 1 I)"
                                checked={avoidAmbiguous}
                                onCheckedChange={setAvoidAmbiguous}
                            />
                            <Switch
                                id="pw-require-each"
                                label="Require one character from every set"
                                checked={requireEach}
                                onCheckedChange={setRequireEach}
                            />
                        </div>

                        <div className="flex justify-center border-t border-zinc-200 pt-4 dark:border-zinc-800">
                            <Popover placement="top">
                                <Popover.Trigger>
                                    {/* Icon and label live in ONE span rather than as
                                        two children of Button. Button is a flex
                                        container, so a bare icon + text node are two
                                        flex ITEMS — and when the trigger wrapper
                                        constrains the width they wrap onto separate
                                        lines, stacking the icon above the label.
                                        `whitespace-nowrap` does not help, because the
                                        text node was never what wrapped. */}
                                    <Button variant="ghost" size="sm" data-pw-share>
                                        <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
                                            <Share2 size={15} />
                                            Share this tool
                                        </span>
                                    </Button>
                                </Popover.Trigger>
                                <Popover.Content>
                                    <div className="grid w-56 gap-1 p-1">
                                        <ShareItem
                                            label="Share on X"
                                            icon={<XIcon className="h-4 w-4" />}
                                            handle="x"
                                            onSelect={() =>
                                                openShare(
                                                    `https://x.com/intent/post?url=${encodeURIComponent(shareUrl())}&text=${encodeURIComponent(SHARE_TEXT)}`,
                                                )
                                            }
                                        />
                                        <ShareItem
                                            label="Share on LinkedIn"
                                            icon={<LinkedinIcon className="h-4 w-4" />}
                                            handle="linkedin"
                                            onSelect={() =>
                                                openShare(
                                                    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl())}`,
                                                )
                                            }
                                        />
                                        <ShareItem
                                            label="Share by email"
                                            icon={<Mail size={16} />}
                                            handle="email"
                                            onSelect={() =>
                                                openShare(
                                                    `mailto:?subject=${encodeURIComponent("Password generator")}&body=${encodeURIComponent(`${SHARE_TEXT}\n\n${shareUrl()}`)}`,
                                                )
                                            }
                                        />
                                        <ShareItem
                                            label={linkCopied ? "Link copied" : "Copy link"}
                                            icon={linkCopied ? <Check size={16} /> : <Link2 size={16} />}
                                            handle="copy-link"
                                            onSelect={copyLink}
                                        />
                                        {/* Only where the OS sheet exists — an item
                                            that silently does nothing is worse than
                                            an absent one. */}
                                        {canNativeShare && (
                                            <ShareItem
                                                label="More…"
                                                icon={<Share2 size={16} />}
                                                handle="native"
                                                onSelect={nativeShare}
                                            />
                                        )}
                                    </div>
                                </Popover.Content>
                            </Popover>
                        </div>
                    </div>
                </Card>

                <Text size="xs" color="muted" className="mt-6 block text-center">
                    No account, no backend, no storage. The page loads a Fancy Pixel badge, which
                    records that the page was viewed — it never sees your password.
                </Text>
            </main>
        </div>
    );
}
