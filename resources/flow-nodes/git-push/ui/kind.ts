import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";

export const GIT_PUSH_KIND = "@particle-academy/git_push";

/** `git_push` — push to a remote, or propose it. */
export const gitPushKind: NodeKindDefinition = {
  name: GIT_PUSH_KIND,
  aliases: ["git_push"],
  category: "io",
  label: "Push",
  description: "Push a working copy to a remote — or propose it for approval.",
  icon: "↥",
  accent: "#f97316",
  inputs: [{ id: "in" }],
  outputs: [
    { id: "done", label: "done" },
    { id: "proposed", label: "proposed" },
  ],
  configSchema: [
    { key: "repo", label: "Repository", type: "text", placeholder: "(host default)" },
    { key: "remote", label: "Remote", type: "text", default: "origin" },
    { key: "branch", label: "Branch", type: "text", placeholder: "(current)" },
    { key: "propose", label: "Propose only (do not perform)", type: "switch", default: false },
  ],
  defaultConfig: { remote: "origin", propose: false },};
