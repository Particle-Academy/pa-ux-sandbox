import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";

export const GIT_LOG_KIND = "@particle-academy/git_log";

/** `git_log` — commits, routed on whether any matched. */
export const gitLogKind: NodeKindDefinition = {
  name: GIT_LOG_KIND,
  aliases: ["git_log"],
  category: "io",
  label: "Commit Log",
  description: "Read commits from a working copy, branching on whether any matched.",
  icon: "≡",
  accent: "#f97316",
  inputs: [{ id: "in" }],
  outputs: [
    { id: "found", label: "found" },
    { id: "none", label: "none" },
  ],
  configSchema: [
    { key: "repo", label: "Repository", type: "text", placeholder: "(host default)" },
    { key: "ref", label: "Ref", type: "text", placeholder: "(current branch)" },
    { key: "limit", label: "Limit", type: "number", min: 1, max: 500, default: 20 },
    { key: "skip", label: "Skip", type: "number", min: 0, default: 0 },
  ],
  defaultConfig: { limit: 20, skip: 0 },};
