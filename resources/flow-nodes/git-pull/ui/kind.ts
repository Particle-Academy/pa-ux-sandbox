import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";

export const GIT_PULL_KIND = "@particle-academy/git_pull";

/** `git_pull` — pull from a remote, or propose it. */
export const gitPullKind: NodeKindDefinition = {
  name: GIT_PULL_KIND,
  aliases: ["git_pull"],
  category: "io",
  label: "Pull",
  description: "Pull a working copy from a remote — or propose it for approval.",
  icon: "↧",
  accent: "#f97316",
  inputs: [{ id: "in" }],
  outputs: [
    { id: "done", label: "done" },
    { id: "proposed", label: "proposed" },
  ],
  configSchema: [
    { key: "repo", label: "Repository", type: "text", placeholder: "(host default)" },
    { key: "remote", label: "Remote", type: "text", placeholder: "origin" },
    { key: "branch", label: "Branch", type: "text", placeholder: "(current)" },
    { key: "propose", label: "Propose only (do not perform)", type: "switch", default: false },
  ],
  defaultConfig: { propose: false },};
