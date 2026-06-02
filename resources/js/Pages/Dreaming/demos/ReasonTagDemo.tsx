import { useMemo, useState } from "react";
import {
  Popover,
  Button,
  Card,
  Badge,
  Select,
  Switch,
  Slider,
} from "@particle-academy/react-fancy";

/**
 * ReasonTag — react-fancy primitive that wraps any value with a small
 * "?" affordance. On hover or click, it pops a card with:
 *
 *   • the reason (free-form text — agent's justification)
 *   • a confidence band (0..1)
 *   • zero-or-more sources (label + optional href)
 *   • an "ask follow-up" action that re-emits a callback to the host
 *
 * The pattern: every AI-suggested value in the app gets a ReasonTag.
 * The human can hover any value to see why it's there, click to dig
 * deeper, or pin the reason inline. Explainability becomes a primitive
 * instead of an afterthought.
 *
 * The dot color reflects confidence — green high, amber medium, red
 * low — so a quick scan tells you which suggestions deserve a closer
 * look without opening any tooltips.
 */
type Source = { label: string; href?: string };

const CONFIDENCE_TIERS = [
  { min: 0.85, color: "#10b981", label: "high" },
  { min: 0.6, color: "#f59e0b", label: "medium" },
  { min: 0, color: "#ef4444", label: "low" },
];

function tier(c: number) {
  return CONFIDENCE_TIERS.find((t) => c >= t.min) ?? CONFIDENCE_TIERS[2];
}

type Sample = {
  id: string;
  value: string;
  reason: string;
  confidence: number;
  sources: Source[];
  agent: string;
};

const SAMPLES: Sample[] = [
  {
    id: "arr",
    value: "$1.4M",
    reason:
      "Projected Q3 ARR after stacking the two renewals from yesterday's call. Expansion uplift applied at the 14% historical rate.",
    confidence: 0.91,
    sources: [
      { label: "Q2 actuals · CRM export" },
      { label: "Expansion model v3 · sheet" },
    ],
    agent: "Forecaster",
  },
  {
    id: "owner",
    value: "Linus",
    reason:
      "Linus owns 7 of the 9 accounts in the same vertical and was assigned to two of the three most recent expansions. Reassign if you'd rather load-balance.",
    confidence: 0.74,
    sources: [{ label: "ownership graph · Linear" }],
    agent: "Planner",
  },
  {
    id: "status",
    value: "Renewal",
    reason:
      "Customer indicated 'committed' in the QBR transcript but no purchase order has landed yet — confidence is below tier because the verbal isn't legally binding.",
    confidence: 0.48,
    sources: [
      { label: "QBR · 2026-05-08 transcript" },
      { label: "billing portal · no PO" },
    ],
    agent: "Auditor",
  },
];

export function ReasonTagDemo() {
  const [showInline, setShowInline] = useState(false);
  const [theme, setTheme] = useState<"dot" | "underline" | "chip">("dot");
  const [demoConfidence, setDemoConfidence] = useState(0.78);
  const [pins, setPins] = useState<string[]>([]);
  const togglePin = (id: string) =>
    setPins((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const live: Sample = useMemo(
    () => ({
      id: "live",
      value: "edit me",
      reason:
        "Move the slider to see how the dot color and tier label shift in real time.",
      confidence: demoConfidence,
      sources: [{ label: "live demo · this page" }],
      agent: "Demo",
    }),
    [demoConfidence],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">ReasonTag</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Wrap any value with a small affordance that reveals the agent's
          reasoning, sources, and confidence on hover or click. Explainability
          as a primitive — every AI-suggested value gets it for free.
        </p>
      </header>

      <Card>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
          <Select
            label="Visual style"
            list={[
              { value: "dot", label: "dot (subtle)" },
              { value: "underline", label: "dotted underline" },
              { value: "chip", label: "chip (loud)" },
            ]}
            value={theme}
            onValueChange={(v) => setTheme(v as typeof theme)}
          />
          <div className="flex items-center gap-3 pt-5">
            <Switch checked={showInline} onCheckedChange={setShowInline} />
            <span className="text-sm text-zinc-700 dark:text-zinc-200">
              Pin reasons inline
            </span>
          </div>
          <Slider
            label="Live confidence"
            min={0}
            max={1}
            step={0.01}
            value={demoConfidence}
            onValueChange={(v) =>
              setDemoConfidence(typeof v === "number" ? v : v[0])
            }
            showValue
          />
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <div className="mb-2 text-sm font-medium">Live preview</div>
          <p className="text-[14px] leading-relaxed text-zinc-700 dark:text-zinc-200">
            The deal is projected to close at{" "}
            <ReasonTag sample={live} theme={theme} pinned={showInline} /> next
            quarter.
          </p>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <div className="mb-3 text-sm font-medium">In context</div>
          <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-[10px] uppercase tracking-wider text-zinc-500 dark:bg-zinc-900">
                <tr>
                  <th className="px-3 py-1.5 text-left font-semibold">Field</th>
                  <th className="px-3 py-1.5 text-left font-semibold">
                    Suggested value
                  </th>
                  <th className="px-3 py-1.5 text-left font-semibold">Tier</th>
                  <th className="px-3 py-1.5 text-right font-semibold">Pin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {SAMPLES.map((s) => {
                  const t = tier(s.confidence);
                  const pinned = pins.includes(s.id) || showInline;
                  return (
                    <tr key={s.id}>
                      <td className="px-3 py-2 font-mono text-[12px] text-zinc-500">
                        {s.id}
                      </td>
                      <td className="px-3 py-2">
                        <ReasonTag sample={s} theme={theme} pinned={pinned} />
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          color={
                            t.label === "high"
                              ? "emerald"
                              : t.label === "medium"
                                ? "amber"
                                : "red"
                          }
                        >
                          {t.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          size="sm"
                          variant={pins.includes(s.id) ? "filled" : "outline"}
                          onClick={() => togglePin(s.id)}
                        >
                          {pins.includes(s.id) ? "unpin" : "pin"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ReasonTag({
  sample,
  theme,
  pinned,
}: {
  sample: Sample;
  theme: "dot" | "underline" | "chip";
  pinned: boolean;
}) {
  const t = tier(sample.confidence);

  const trigger =
    theme === "chip" ? (
      <span
        className="inline-flex cursor-help items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium"
        style={{ backgroundColor: t.color + "22", color: t.color }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: t.color }}
        />
        {sample.value}
        <span className="text-[10px] opacity-70">?</span>
      </span>
    ) : theme === "underline" ? (
      <span
        className="cursor-help underline decoration-dotted underline-offset-2"
        style={{ textDecorationColor: t.color }}
      >
        {sample.value}
        <span
          className="ml-0.5 text-[10px] font-mono"
          style={{ color: t.color }}
        >
          ?
        </span>
      </span>
    ) : (
      <span className="inline-flex cursor-help items-baseline gap-1">
        <span className="font-medium">{sample.value}</span>
        <span
          className="inline-block h-1.5 w-1.5 rounded-full align-middle"
          style={{ backgroundColor: t.color }}
          title="reason available"
        />
      </span>
    );

  const card = (
    <div className="w-72 space-y-2 text-sm">
      <div className="flex items-baseline gap-2">
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: t.color }}
        >
          {t.label} confidence · {(sample.confidence * 100).toFixed(0)}%
        </span>
        <span className="ml-auto font-mono text-[10px] text-zinc-400">
          @{sample.agent}
        </span>
      </div>
      <p className="text-[13px] leading-snug text-zinc-700 dark:text-zinc-200">
        {sample.reason}
      </p>
      {sample.sources.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-400">
            sources
          </div>
          <ul className="mt-0.5 space-y-0.5 text-[12px]">
            {sample.sources.map((s, i) => (
              <li key={i}>
                {s.href ? (
                  <a className="text-violet-600 hover:underline" href={s.href}>
                    {s.label}
                  </a>
                ) : (
                  <span className="text-zinc-600 dark:text-zinc-300">
                    {s.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex justify-end pt-1">
        <Button size="sm" variant="outline">
          ask follow-up
        </Button>
      </div>
    </div>
  );

  if (pinned) {
    // Inline-pinned mode: value + tiny "why" toggle, with the reason
    // rendered below the value as a small annotation.
    return (
      <span className="inline-flex flex-col items-start gap-0.5 align-top">
        {trigger}
        <span
          className="block max-w-[280px] rounded border-l-2 pl-2 text-[11px] leading-snug text-zinc-600 dark:text-zinc-300"
          style={{ borderColor: t.color }}
        >
          {sample.reason}
        </span>
      </span>
    );
  }

  return (
    <Popover hover>
      <Popover.Trigger>{trigger}</Popover.Trigger>
      <Popover.Content>{card}</Popover.Content>
    </Popover>
  );
}
