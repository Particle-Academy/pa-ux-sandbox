import { useState } from "react";
import { ReasonTag, Card, Select, Switch, Slider } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function ReasonTagDemo() {
  const [theme, setTheme] = useState<"dot" | "underline" | "chip">("dot");
  const [pinned, setPinned] = useState(false);
  const [confidence, setConfidence] = useState(0.78);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">ReasonTag</h1>
        <p className="mt-2 text-zinc-500">
          Wraps any value with an "ask why" affordance. Hover or click to see the
          agent's reasoning, sources, and confidence. Three visual styles; pinned
          mode keeps the reason permanently visible.
        </p>
      </header>

      <DemoSection title="Knobs" description="Visual style, confidence, and pinned mode.">
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
              <Switch checked={pinned} onCheckedChange={setPinned} />
              <span className="text-sm text-zinc-700 dark:text-zinc-200">Pin reason inline</span>
            </div>
            <Slider
              label="Confidence"
              min={0}
              max={1}
              step={0.01}
              value={confidence}
              onValueChange={(v) => setConfidence(typeof v === "number" ? v : v[0])}
              showValue
            />
          </div>
        </Card>
      </DemoSection>

      <DemoSection title="Live preview" description={`Confidence ${(confidence * 100).toFixed(0)}% drives the colour tier.`}>
        <Card>
          <div className="p-4">
            <p className="text-[14px] leading-relaxed text-zinc-700 dark:text-zinc-200">
              The deal is projected to close at{" "}
              <ReasonTag
                value="$1.4M"
                reason="Projected Q3 ARR after stacking renewals; 14% expansion uplift applied at the historical rate."
                confidence={confidence}
                sources={[
                  { label: "Q2 actuals · CRM export" },
                  { label: "Expansion model v3 · sheet" },
                ]}
                by="Forecaster"
                theme={theme}
                pinned={pinned}
                onFollowUp={() => alert("ask follow-up")}
              />{" "}
              next quarter.
            </p>
          </div>
        </Card>
      </DemoSection>
    </div>
  );
}
