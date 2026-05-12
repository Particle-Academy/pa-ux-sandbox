import { useState } from "react";
import { MagicWand, Card, type MagicWandAction } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

const ACTIONS: MagicWandAction[] = [
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
    hint: "to spanish",
    tag: "es",
    run: async (s) => transform(s, "translate", "es"),
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

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">MagicWand</h1>
        <p className="mt-2 text-zinc-500">
          Selection-anchored floating toolbar. Highlight any phrase in the
          textarea below — a wand of AI quick-actions pops over the selection.
          Click one and the result replaces the highlighted text.
        </p>
      </header>

      <DemoSection title="Try it" description="Select any phrase, then click an action.">
        <Card>
          <div className="p-4">
            <MagicWand value={body} onValueChange={setBody} actions={ACTIONS} appearance="floating" />
          </div>
        </Card>
      </DemoSection>
    </div>
  );
}

// Mock transforms so the demo runs without a backend.
async function transform(s: string, op: string, lang?: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 350 + Math.random() * 350));
  switch (op) {
    case "rephrase":
      return s
        .replace(/holds\./gi, "stays on track.")
        .replace(/climbs/gi, "rises")
        .replace(/the bulk/gi, "the majority");
    case "shorten":
      return (
        s
          .split(/\.\s+/)
          .slice(0, Math.max(1, Math.floor(s.split(/\.\s+/).length * 0.5)))
          .join(". ")
          .replace(/\.$/, "") + "."
      );
    case "expand":
      return (
        s.trim() +
        " (This estimate assumes the renewal commitments hold through quarter close and excludes any new logos in the pipeline.)"
      );
    case "explain":
      return `In plain terms: ${s.toLowerCase()}`;
    case "translate":
      return `[${(lang ?? "es").toUpperCase()}] ${s}`;
    case "cite":
      return s.replace(/\.\s+/g, ". [1] ");
    default:
      return s;
  }
}
