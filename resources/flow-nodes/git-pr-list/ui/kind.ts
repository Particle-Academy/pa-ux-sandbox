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

export const GIT_PR_LIST_KIND = "@particle-academy/git_pr_list";

/**
 * `git_pr_list` — pull requests, routed on whether there are any.
 *
 * Two ports rather than one: "no open PRs" is a decision in nearly every
 * workflow that asks, and a downstream `length === 0` test is one somebody
 * forgets to write.
 */
export const gitPrListKind: NodeKindDefinition = {
  name: GIT_PR_LIST_KIND,
  aliases: ["git_pr_list"],
  category: "io",
  label: "List Pull Requests",
  description: "List a repository's pull requests, branching on whether any matched.",
  icon: "☰",
  accent: "#0ea5e9",
  inputs: [{ id: "in" }],
  outputs: [
    { id: "found", label: "found" },
    { id: "none", label: "none" },
  ],
  configSchema: [
    ...REPO_FIELDS,
    {
      key: "state",
      label: "State",
      type: "select",
      options: [
        { value: "open", label: "Open" },
        { value: "merged", label: "Merged" },
        { value: "closed", label: "Closed" },
        { value: "draft", label: "Draft" },
        { value: "any", label: "Any" },
      ],
      default: "open",
    },
    { key: "limit", label: "Limit", type: "number", min: 1, max: 100, default: 20 },
  ],
  defaultConfig: { provider: "github", state: "open", limit: 20 },
};
