import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";

export const GIT_BRANCHES_KIND = "@particle-academy/git_branches";

/** `git_branches` — the branch list, with the current one lifted out. */
export const gitBranchesKind: NodeKindDefinition = {
  name: GIT_BRANCHES_KIND,
  aliases: ["git_branches"],
  category: "io",
  label: "Branches",
  description: "List a working copy's branches and report which one is checked out.",
  icon: "⑂",
  accent: "#f97316",
  inputs: [{ id: "in" }],
  outputs: [{ id: "out" }],
  configSchema: [
    { key: "repo", label: "Repository", type: "text", placeholder: "(host default)" },
    { key: "includeRemote", label: "Include remote branches", type: "switch", default: false },
  ],
  defaultConfig: { includeRemote: false },};
