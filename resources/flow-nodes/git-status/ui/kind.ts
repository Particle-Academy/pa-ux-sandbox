import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";

export const GIT_STATUS_KIND = "@particle-academy/git_status";

/**
 * `git_status` — working-tree state, routed clean/dirty.
 *
 * `repo` is a NAME the host resolves, never a path. A graph that carried a
 * filesystem path would let an author point a node anywhere the worker can
 * reach; the host decides what a name maps to.
 */
export const gitStatusKind: NodeKindDefinition = {
  name: GIT_STATUS_KIND,
  aliases: ["git_status"],
  category: "io",
  label: "Working Tree Status",
  description: "Branch, ahead/behind and changed files — routes on whether the tree is clean.",
  icon: "◔",
  accent: "#f97316",
  inputs: [{ id: "in" }],
  outputs: [
    { id: "clean", label: "clean" },
    { id: "dirty", label: "dirty" },
  ],
  configSchema: [
    {
      key: "repo",
      label: "Repository",
      type: "text",
      placeholder: "(host default)",
    },
  ],
  defaultConfig: {},};
