import { useState } from "react";
import { TreeNav } from "@particle-academy/react-fancy";
import type { TreeNodeData } from "@particle-academy/react-fancy";
import { FileViewer, resolveFileKind } from "@particle-academy/fancy-code";
import { DemoSection } from "../components/DemoSection";

// ---------------------------------------------------------------------------
// A small mixed-content "workspace": text files render in the CodeEditor,
// media files (image / svg / pdf) render via react-fancy's <MediaViewer>.
// ---------------------------------------------------------------------------

type DemoFile = {
  id: string;
  label: string;
  ext: string;
  /** Text content — present for text files. */
  content?: string;
  /** Source URL — present for media files. */
  src?: string;
  /** MIME hint — preferred by detection when set. */
  mime?: string;
};

const FILES: DemoFile[] = [
  {
    id: "README.md",
    label: "README.md",
    ext: "md",
    content: `# Unified file viewer

\`FileViewer\` detects whether a file is **text** or **media** and renders the
right surface:

- text -> a read-only \`CodeEditor\` (language picked from the filename)
- media (image / video / audio / PDF) -> react-fancy's \`<MediaViewer>\`

Pick a file in the tree on the left. Notice the image, SVG, and PDF render as
media instead of binary-as-text.
`,
  },
  {
    id: "viewer.tsx",
    label: "viewer.tsx",
    ext: "tsx",
    content: `import { FileViewer, resolveFileKind } from "@particle-academy/fancy-code";

// text -> CodeEditor, media -> <MediaViewer>
export function Pane({ file }: { file: WorkspaceFile }) {
  return (
    <FileViewer
      filename={file.name}
      mime={file.mime}
      src={file.url}        // media files
      value={file.text}     // text files
      style={{ height: 460 }}
    />
  );
}

// Branch your own chrome off the same decision:
resolveFileKind({ filename: "logo.png" }); // { kind: "media", mediaKind: "image" }
resolveFileKind({ filename: "app.tsx" });   // { kind: "text", language: "typescript" }
`,
  },
  {
    id: "theme.css",
    label: "theme.css",
    ext: "css",
    // .css has no dedicated tokenizer -> renders as plaintext (no highlighting).
    content: `:root {
  --brand: #6366f1;
  --accent: #06b6d4;
}

.button {
  background: var(--brand);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
}
`,
  },
  {
    id: "diagram.svg",
    label: "diagram.svg",
    ext: "svg",
    src: "/showcase-assets/file-viewer/diagram.svg",
    mime: "image/svg+xml",
  },
  {
    id: "screenshot.png",
    label: "screenshot.png",
    ext: "png",
    src: "/showcase-shots/fancy-code.png",
    mime: "image/png",
  },
  {
    id: "sample.pdf",
    label: "sample.pdf",
    ext: "pdf",
    src: "/showcase-assets/file-viewer/sample.pdf",
    mime: "application/pdf",
  },
];

const TREE: TreeNodeData[] = [
  {
    id: "workspace",
    label: "workspace",
    type: "folder",
    children: FILES.map((f) => ({ id: f.id, label: f.label, ext: f.ext })),
  },
];

const USAGE = `import { FileViewer, resolveFileKind } from "@particle-academy/fancy-code";

// One viewer for any file from a tree. Text -> CodeEditor (language from the
// filename); image/video/audio/PDF -> react-fancy's <MediaViewer>.
<FileViewer
  filename={file.label}     // detects type + editor language
  mime={file.mime}          // preferred over filename when known
  src={file.src}            // media files (http/data/blob URL)
  value={file.content}      // text files
  readOnly
  style={{ height: 460 }}
/>

// Same decision, exposed so you can branch your own chrome (tabs, save buttons):
resolveFileKind({ filename: file.label, mime: file.mime });
// -> { kind: "text", language } | { kind: "media", mediaKind }`;

export function FileViewerDemo() {
  const [selectedId, setSelectedId] = useState<string>("README.md");
  const active = FILES.find((f) => f.id === selectedId) ?? FILES[0];
  const kind = resolveFileKind({ filename: active.label, mime: active.mime });
  const kindLabel =
    kind.kind === "text" ? `text · ${kind.language}` : `media · ${kind.mediaKind}`;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">FileViewer</h1>
      <p className="mb-6 max-w-2xl text-sm text-zinc-500">
        A unified file viewer from <code>@particle-academy/fancy-code</code>. It detects
        whether a file is text or media and renders the right surface — a read-only{" "}
        <code>CodeEditor</code> for text, react-fancy&apos;s <code>MediaViewer</code> for
        image / video / audio / PDF — so opening an image no longer shows binary as text.
      </p>

      <DemoSection
        title="Open any file from a tree"
        description="Pick a file on the left. Text files open in the code editor; the image, SVG, and PDF open in the media viewer."
        flush
        code={USAGE}
      >
        <div
          className="flex overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700"
          style={{ height: 520 }}
        >
          {/* File tree */}
          <div className="w-56 shrink-0 overflow-y-auto border-r border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-900/50">
            <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Explorer
            </p>
            <TreeNav
              nodes={TREE}
              selectedId={selectedId}
              onSelect={(id, node) => {
                if (node.type === "folder") return;
                setSelectedId(id);
              }}
              defaultExpandedIds={["workspace"]}
              indentSize={12}
            />
          </div>

          {/* Viewer pane */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[12px] dark:border-zinc-700 dark:bg-zinc-900/50">
              <span className="truncate font-medium text-zinc-700 dark:text-zinc-200">
                {active.label}
              </span>
              <span className="shrink-0 rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {kindLabel}
              </span>
            </div>
            <div className="min-h-0 flex-1 bg-white p-3 dark:bg-zinc-900">
              <FileViewer
                key={active.id}
                filename={active.label}
                mime={active.mime}
                src={active.src}
                value={active.content}
                readOnly
                theme="auto"
                minHeight={460}
                maxHeight={460}
                className="h-full"
                style={{ height: 460 }}
              />
            </div>
          </div>
        </div>
      </DemoSection>
    </div>
  );
}
