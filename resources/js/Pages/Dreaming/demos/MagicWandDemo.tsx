import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  Button,
  Badge,
  Switch,
  Select,
  Textarea,
} from "@particle-academy/react-fancy";

/**
 * MagicWand — react-fancy primitive for selection-anchored AI
 * actions. The user selects text inside a content host (textarea,
 * contentEditable, or any wrapper that emits selection events); the
 * wand floats above the selection with a row of quick actions. Each
 * action invokes the host callback with the selected substring; the
 * host can replace the selection with the agent's response.
 *
 * Default actions are AI-flavored (rephrase / shorten / expand /
 * explain / translate / cite) but the action set is fully overridable
 * via the `actions` prop. The wand auto-hides on click-away, scroll,
 * or when the selection collapses.
 *
 * In a real react-fancy build this would expose a `useMagicWand` hook
 * + a `<MagicWand>` component, plus a `<MagicWand.Trigger>` wrapper
 * for any DOM region that should emit wand events. The demo uses a
 * single textarea for clarity.
 */
type WandAction = {
  id: string;
  label: string;
  hint: string;
  /** Optional badge label (e.g. "agent"). */
  tag?: string;
  /** Returns the transformed text. async simulates the AI call. */
  run: (selection: string, opts?: Record<string, unknown>) => Promise<string>;
};

const DEFAULT_ACTIONS: WandAction[] = [
  {
    id: "rephrase",
    label: "Rephrase",
    hint: "same meaning, different words",
    run: async (s) => transform(s, "rephrase"),
  },
  {
    id: "shorten",
    label: "Shorten",
    hint: "≤ 60% of the original length",
    run: async (s) => transform(s, "shorten"),
  },
  {
    id: "expand",
    label: "Expand",
    hint: "add context, examples, evidence",
    run: async (s) => transform(s, "expand"),
  },
  {
    id: "explain",
    label: "Explain",
    hint: "what this means, in plain words",
    run: async (s) => transform(s, "explain"),
  },
  {
    id: "translate",
    label: "Translate",
    hint: "pick a target language",
    tag: "ask",
    run: async (s, opts) => transform(s, "translate", String(opts?.lang ?? "es")),
  },
  {
    id: "cite",
    label: "Cite",
    hint: "add inline source markers",
    run: async (s) => transform(s, "cite"),
  },
];

export function MagicWandDemo() {
  const [body, setBody] = useState<string>(
    "The Q3 forecast holds. ARR climbs roughly 14% on existing-customer expansion, with renewals capturing the bulk. Two accounts remain at risk; both have a clean mitigation path I've drafted on the whiteboard.",
  );
  const [log, setLog] = useState<Array<{ at: number; line: string }>>([]);
  const [appearance, setAppearance] = useState<"pill" | "floating">("floating");
  const [autoHide, setAutoHide] = useState(true);

  const note = useCallback((line: string) => {
    setLog((cur) => [{ at: Date.now(), line }, ...cur].slice(0, 8));
  }, []);

  const onAction = useCallback(
    async (action: WandAction, selection: Selection) => {
      note(`${action.id} → "${selection.text.slice(0, 40)}${selection.text.length > 40 ? "…" : ""}"`);
      const opts =
        action.id === "translate" ? { lang: prompt("Target language (en/es/fr/de):", "es") ?? "es" } : undefined;
      const replaced = await action.run(selection.text, opts);
      setBody((cur) =>
        cur.slice(0, selection.start) + replaced + cur.slice(selection.end),
      );
    },
    [note],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">MagicWand</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Select text below; a floating toolbar appears with AI quick-actions.
          Each action invokes a host callback with the selection and replaces
          the range with the result. Overridable action set, dismiss-on-click-
          away, keyboard-friendly.
        </p>
      </header>

      <Card>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          <Select
            label="Appearance"
            list={[
              { value: "floating", label: "floating (above selection)" },
              { value: "pill", label: "pill (icon-only, compact)" },
            ]}
            value={appearance}
            onValueChange={(v) => setAppearance(v as "pill" | "floating")}
          />
          <div className="flex items-center gap-3 pt-5">
            <Switch checked={autoHide} onCheckedChange={setAutoHide} />
            <span className="text-sm text-zinc-700 dark:text-zinc-200">
              Auto-hide on click-away
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <div className="mb-2 text-sm font-medium">Try it — select any phrase below</div>
          <MagicWandTextarea
            value={body}
            onValueChange={setBody}
            actions={DEFAULT_ACTIONS}
            appearance={appearance}
            autoHide={autoHide}
            onAction={onAction}
          />
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <div className="mb-2 text-sm font-medium">Action log</div>
          {log.length === 0 ? (
            <div className="text-[11px] italic text-zinc-400">
              Nothing yet. Highlight a phrase and click a wand action.
            </div>
          ) : (
            <ol className="space-y-0.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
              {log.map((l, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-zinc-400">
                    {new Date(l.at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <span>{l.line}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </Card>
    </div>
  );
}

type Selection = { start: number; end: number; text: string };

function MagicWandTextarea({
  value,
  onValueChange,
  actions,
  appearance,
  autoHide,
  onAction,
}: {
  value: string;
  onValueChange: (v: string) => void;
  actions: WandAction[];
  appearance: "pill" | "floating";
  autoHide: boolean;
  onAction: (action: WandAction, selection: Selection) => Promise<void> | void;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const wandRef = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<Selection | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const measureSelection = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    if (start === end) {
      setSel(null);
      setPos(null);
      return;
    }
    const text = ta.value.slice(start, end);
    setSel({ start, end, text });
    // Best-effort caret coords: mirror the textarea into a hidden div and
    // measure the bounding rect of the selected substring's mid-line.
    const rect = caretRect(ta, start, end);
    if (rect) setPos({ x: rect.x, y: rect.y });
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (autoHide) {
        setSel(null);
        setPos(null);
      }
    };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [autoHide]);

  useEffect(() => {
    if (!autoHide) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (wandRef.current?.contains(e.target as Node)) return;
      if (taRef.current?.contains(e.target as Node)) return;
      setSel(null);
      setPos(null);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [autoHide]);

  const handleAction = async (action: WandAction) => {
    if (!sel) return;
    setBusy(action.id);
    try {
      await onAction(action, sel);
    } finally {
      setBusy(null);
      setSel(null);
      setPos(null);
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={taRef as unknown as React.Ref<HTMLTextAreaElement>}
        value={value}
        onValueChange={onValueChange}
        onSelect={measureSelection}
        onKeyUp={measureSelection}
        onMouseUp={measureSelection}
        rows={6}
      />
      {sel && pos && (
        <Wand
          ref={wandRef}
          pos={pos}
          actions={actions}
          appearance={appearance}
          busy={busy}
          onAction={handleAction}
          selectionLength={sel.text.length}
        />
      )}
    </div>
  );
}

const Wand = ({
  ref,
  pos,
  actions,
  appearance,
  busy,
  onAction,
  selectionLength,
}: {
  ref: React.RefObject<HTMLDivElement | null>;
  pos: { x: number; y: number };
  actions: WandAction[];
  appearance: "pill" | "floating";
  busy: string | null;
  onAction: (a: WandAction) => void;
  selectionLength: number;
}) => {
  return (
    <div
      ref={ref}
      className="absolute z-20 -translate-x-1/2 -translate-y-full"
      style={{ left: pos.x, top: pos.y - 6 }}
    >
      <div className="flex items-center gap-1 rounded-full border border-violet-300 bg-white px-1.5 py-1 shadow-lg ring-1 ring-violet-200 dark:border-violet-700 dark:bg-zinc-900 dark:ring-violet-900">
        <span className="ml-1 mr-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-violet-700 dark:text-violet-300">
          <span aria-hidden>✦</span>
          {appearance === "floating" && (
            <Badge color="violet">{selectionLength} chars</Badge>
          )}
        </span>
        {actions.map((a) => (
          <Button
            key={a.id}
            size="sm"
            variant="ghost"
            onClick={() => onAction(a)}
            disabled={busy !== null}
            title={a.hint}
          >
            {busy === a.id ? "…" : appearance === "pill" ? a.label[0] : a.label}
            {appearance === "floating" && a.tag && (
              <span className="ml-1 rounded-full bg-zinc-100 px-1 text-[9px] font-medium text-zinc-500 dark:bg-zinc-800">
                {a.tag}
              </span>
            )}
          </Button>
        ))}
      </div>
      {/* arrow */}
      <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-px">
        <div className="h-2 w-2 rotate-45 border-b border-r border-violet-300 bg-white dark:border-violet-700 dark:bg-zinc-900" />
      </div>
    </div>
  );
};

/* --- Caret/selection geometry: render a hidden mirror to find the
       selection rect within a textarea. Trade-off: not perfect for
       resized textareas, but enough for the demo. --- */

function caretRect(
  ta: HTMLTextAreaElement,
  start: number,
  end: number,
): { x: number; y: number } | null {
  const div = document.createElement("div");
  const style = getComputedStyle(ta);
  const props = [
    "boxSizing",
    "width",
    "height",
    "overflowX",
    "overflowY",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "fontStretch",
    "fontSize",
    "fontSizeAdjust",
    "lineHeight",
    "fontFamily",
    "textAlign",
    "textTransform",
    "textIndent",
    "letterSpacing",
    "wordSpacing",
    "tabSize",
  ] as const;
  for (const p of props) (div.style as any)[p] = (style as any)[p];
  div.style.position = "absolute";
  div.style.top = "-9999px";
  div.style.left = "-9999px";
  div.style.whiteSpace = "pre-wrap";
  div.style.wordWrap = "break-word";

  const value = ta.value;
  div.textContent = value.substring(0, start);
  const startSpan = document.createElement("span");
  startSpan.textContent = value.substring(start, end) || ".";
  div.appendChild(startSpan);

  document.body.appendChild(div);
  const taRect = ta.getBoundingClientRect();
  const parentRect = (ta.offsetParent as HTMLElement | null)?.getBoundingClientRect() ?? taRect;
  const spanRect = startSpan.getBoundingClientRect();
  const divRect = div.getBoundingClientRect();
  const offsetX = spanRect.left - divRect.left;
  const offsetY = spanRect.top - divRect.top;
  document.body.removeChild(div);

  // Coords relative to the textarea's offset parent
  const x = taRect.left - parentRect.left + offsetX + spanRect.width / 2;
  const y = taRect.top - parentRect.top + offsetY - ta.scrollTop;
  return { x, y };
}

/* --- Mock transforms so the demo runs without a backend. --- */

async function transform(s: string, op: string, lang?: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 350 + Math.random() * 350));
  switch (op) {
    case "rephrase":
      return s
        .replace(/holds\./gi, "stays on track.")
        .replace(/climbs/gi, "rises")
        .replace(/the bulk/gi, "the majority");
    case "shorten":
      return s
        .split(/\.\s+/)
        .slice(0, Math.max(1, Math.floor(s.split(/\.\s+/).length * 0.5)))
        .join(". ")
        .replace(/\.$/, "") + ".";
    case "expand":
      return (
        s.trim() +
        " (This estimate assumes the renewal commitments hold through quarter close and excludes any new logos in the pipeline.)"
      );
    case "explain":
      return `In plain terms: ${s.toLowerCase()}`;
    case "translate":
      if (lang === "es") return `[ES] ${s}`;
      if (lang === "fr") return `[FR] ${s}`;
      if (lang === "de") return `[DE] ${s}`;
      return `[EN] ${s}`;
    case "cite":
      return s.replace(/\.\s+/g, ". [1] ");
    default:
      return s;
  }
}
