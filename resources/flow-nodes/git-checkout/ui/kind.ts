import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";

export const GIT_CHECKOUT_KIND = "@particle-academy/git_checkout";

/**
 * `git_checkout` — switch branch or revision.
 *
 * `proposed` is a first-class port, not an error path: with `propose` on, the
 * node reports what it WOULD do and a human decides.
 */
export const gitCheckoutKind: NodeKindDefinition = {
  name: GIT_CHECKOUT_KIND,
  aliases: ["git_checkout"],
  category: "io",
  label: "Checkout",
  description: "Switch a working copy to a branch or revision — or propose it for approval.",
  icon: "⤳",
  accent: "#f97316",
  inputs: [{ id: "in" }],
  outputs: [
    { id: "done", label: "done" },
    { id: "proposed", label: "proposed" },
  ],
  configSchema: [
    { key: "repo", label: "Repository", type: "text", placeholder: "(host default)" },
    { key: "target", label: "Target", type: "text", placeholder: "main", required: true },
    { key: "propose", label: "Propose only (do not perform)", type: "switch", default: false },
  ],
  defaultConfig: { propose: false },};
