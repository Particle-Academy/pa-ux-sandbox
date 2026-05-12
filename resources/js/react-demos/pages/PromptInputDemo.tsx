import { useState } from "react";
import { PromptInput, Card, Badge } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

const COMMANDS = [
  { name: "/explain", hint: "explain the selected text" },
  { name: "/rewrite", hint: "rewrite in a different tone" },
  { name: "/summarize", hint: "tl;dr the selection" },
  { name: "/translate", hint: "translate to another language" },
  { name: "/test", hint: "write tests for the function above" },
  { name: "/diff", hint: "produce a unified diff" },
  { name: "/cite", hint: "add citations for any claim" },
];

const MENTIONS = [
  { id: "planner", name: "Planner", kind: "agent" },
  { id: "scribe", name: "Scribe", kind: "agent" },
  { id: "auditor", name: "Auditor", kind: "agent" },
  { id: "readme", name: "README.md", kind: "file" },
  { id: "claude.md", name: "CLAUDE.md", kind: "file" },
  { id: "ada", name: "Ada", kind: "person" },
  { id: "linus", name: "Linus", kind: "person" },
];

export function PromptInputDemo() {
  const [sent, setSent] = useState<Array<{ text: string; at: number; attachments: number }>>([]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">PromptInput</h1>
        <p className="mt-2 text-zinc-500">
          The chat composer every AI app rebuilds. Slash commands, @-mentions,
          drop-to-attach, ⌘/Ctrl+Enter to send, token budget meter.
        </p>
      </header>

      <DemoSection title="Try it" description="Type / for commands, @ for mentions, drag files to attach.">
        <Card>
          <div className="p-4">
            <PromptInput
              budgetTokens={32000}
              commands={COMMANDS}
              mentions={MENTIONS}
              onSubmit={(text, attachments) =>
                setSent((cur) =>
                  [{ text, at: Date.now(), attachments: attachments.length }, ...cur].slice(0, 8),
                )
              }
            />
          </div>
        </Card>
      </DemoSection>

      <DemoSection title="Sent log" description="Latest 8 submissions.">
        <Card>
          <div className="p-4">
            {sent.length === 0 ? (
              <div className="text-[11px] italic text-zinc-400">
                Nothing sent yet — type and hit ⌘/Ctrl+Enter.
              </div>
            ) : (
              <ol className="space-y-2 text-[12px]">
                {sent.map((s, i) => (
                  <li key={i} className="rounded border border-zinc-200 px-2 py-1.5 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <span>
                        {new Date(s.at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                      {s.attachments > 0 && <Badge color="emerald">+{s.attachments} attached</Badge>}
                    </div>
                    <div className="mt-0.5 whitespace-pre-wrap font-mono text-[12px] text-zinc-700 dark:text-zinc-200">
                      {s.text}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>
      </DemoSection>
    </div>
  );
}
