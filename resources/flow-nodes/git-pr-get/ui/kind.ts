import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";

const REPO_FIELDS = [
  {
    key: "provider",
    label: "Provider",
    type: "select" as const,
    options: [
      { value: "github", label: "GitHub" },
      { value: "gitlab", label: "GitLab" },
      { value: "bitbucket", label: "Bitbucket" },
    ],
    default: "github",
  },
  { key: "owner", label: "Owner", type: "text" as const, placeholder: "Particle-Academy" },
  { key: "repo", label: "Repository", type: "text" as const, placeholder: "fancy-flow" },
];

export const GIT_PR_GET_KIND = "@particle-academy/git_pr_get";

/**
 * `git_pr_get` — one pull request in full.
 *
 * Takes its number from the node's input as well as its config, so it drops
 * straight after `git_pr_list` or `git_pr_open` without a transform in between.
 */
export const gitPrGetKind: NodeKindDefinition = {
  name: GIT_PR_GET_KIND,
  aliases: ["git_pr_get"],
  category: "io",
  label: "Get Pull Request",
  description: "Read one pull request — body, state, mergeability, timestamps.",
  icon: "◎",
  accent: "#0ea5e9",
  inputs: [{ id: "in" }],
  outputs: [{ id: "out" }],
  configSchema: [
    ...REPO_FIELDS,
    {
      key: "number",
      label: "Pull request number",
      type: "number",
      min: 1,
      description: "Leave empty to take it from the input — the shape git_pr_list and git_pr_open emit.",
    },
  ],
  defaultConfig: { provider: "github" },
};
