import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Badge,
    Button,
    Callout,
    Card,
    Field,
    Heading,
    Progress,
    Slider,
    Switch,
    Text,
    Tooltip,
} from "@particle-academy/react-fancy";
import { Seo } from "@particle-academy/fancy-inertia/seo";
import { Copy, Check, RefreshCw } from "lucide-react";

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
