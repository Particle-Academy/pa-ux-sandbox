/**
 * code kind — fancy-code <CodeEditor> driven by registerCodeBridge.
 */
import { CodeEditor } from "@particle-academy/fancy-code";
import "@particle-academy/fancy-code/styles.css";
import { registerCodeBridge } from "@particle-academy/agent-integrations/bridges/code";
import type { KindModule, SurfaceProps, KindBridgeContext } from "./types";

export type CodeState = { value: string; language: string };

const seed = (): CodeState => ({
  value: "// Ask the agent to write code here via code_* tools.\n",
  language: "javascript",
});

function CodeSurface({ state, onChange }: SurfaceProps) {
  const s = state as CodeState;
  return (
    <div style={{ height: 480 }} className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
      <CodeEditor
        value={s.value}
        language={s.language}
        onChange={(value) => onChange({ ...s, value })}
        onLanguageChange={(language) => onChange({ ...s, language })}
        minHeight={460}
        maxHeight={460}
      >
        <CodeEditor.Toolbar />
        <CodeEditor.Panel />
        <CodeEditor.StatusBar />
      </CodeEditor>
    </div>
  );
}

export const codeKind: KindModule = {
  kind: "code",
  label: "Code",
  description: "An embedded code editor. Drive it with code_* tools (set_value / replace_selection / set_language).",
  status: "wired",
  createState: seed,
  register: (server, ctx: KindBridgeContext) => {
    const read = () => (ctx.getActiveState() as CodeState) ?? seed();
    return registerCodeBridge(server, {
      adapter: {
        id: "playground-code",
        title: "Code",
        getValue: () => read().value,
        setValue: (value) => ctx.setActiveState({ ...read(), value }),
        getLanguage: () => read().language,
        setLanguage: (language) => ctx.setActiveState({ ...read(), language }),
      },
      agent: ctx.agent,
    });
  },
  Surface: CodeSurface,
};
