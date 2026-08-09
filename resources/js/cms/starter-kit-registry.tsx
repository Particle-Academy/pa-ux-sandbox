import { useState } from "react";
import { FauxClient } from "@particle-academy/react-fancy";
import { defaultRegistry, type ElementRegistry } from "@particle-academy/fancy-cms-ui/react";

/**
 * The element registry for `/starter-kits/{slug}/cms`.
 *
 * Deliberately tiny. `home-seed.ts` needed a whole island per section because
 * each one was a data-driven React component; this page needs exactly **two**,
 * and both are things that genuinely cannot be a document node: a clipboard
 * button and an interactive kit demo. Everything else on the page is a CMS
 * primitive from `defaultRegistry`.
 *
 * That ratio is the claim being tested. If the Stages model can express a real
 * page down to two behavioural leaves, the model carries the page — rather than
 * the page being smuggled through as one big island, which is what a registry
 * full of bespoke renderers would actually mean.
 */

export interface StarterKitIslandData {
  /** The shell command the copy button writes to the clipboard. */
  installCommand: string;
  /** The kit's live demo, already resolved by the host. */
  demo: React.ReactNode;
  /** Browser-frame caption for the demo. */
  demoTitle: string;
}

export function makeStarterKitRegistry(data: StarterKitIslandData): ElementRegistry {
  return {
    ...defaultRegistry,

    // The CMS's default `code` element renders the command; the JSX page frames
    // it with a shell prompt, so the document does too rather than dropping a
    // visual the page already had.
    code: ({ node, text }) => (
      <pre className="m-0 flex items-center gap-3 overflow-x-auto rounded-lg bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100">
        <span className="shrink-0 text-zinc-500">$</span>
        <code>{text(node.props.content)}</code>
      </pre>
    ),

    "kit-copy-button": () => <CopyButton command={data.installCommand} />,

    "kit-demo": () =>
      data.demo ? (
        <FauxClient variant="browser" url={data.demoTitle} meta="dev" width={1240} scale="fit">
          {data.demo}
        </FauxClient>
      ) : (
        <div className="grid place-items-center rounded-md p-16 text-sm text-zinc-500">
          Starter kit not wired up yet.
        </div>
      ),
  };
}

function CopyButton({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      data-cms-field="copy-install"
      onClick={() => {
        navigator.clipboard.writeText(command).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        });
      }}
      className="mt-2 shrink-0 rounded border border-zinc-300 px-2 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}
