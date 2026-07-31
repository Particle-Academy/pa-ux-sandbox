import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";

export const GIT_DIFF_KIND = "@particle-academy/git_diff";

/** `git_diff` — a diff, routed on whether it is empty. */
export const gitDiffKind: NodeKindDefinition = {
  name: GIT_DIFF_KIND,
  aliases: ["git_diff"],
  category: "io",
  label: "Diff",
  description: "Diff a working copy — working tree, staged, or between two revisions.",
  icon: "±",
  accent: "#f97316",
  inputs: [{ id: "in" }],
  outputs: [
    { id: "changed", label: "changed" },
    { id: "empty", label: "empty" },
  ],
  configSchema: [
    { key: "repo", label: "Repository", type: "text", placeholder: "(host default)" },
    { key: "from", label: "From", type: "text", placeholder: "(working tree)" },
    { key: "to", label: "To", type: "text", placeholder: "(working tree)" },
    { key: "staged", label: "Staged only", type: "switch", default: false },
  ],
  defaultConfig: { staged: false },};
