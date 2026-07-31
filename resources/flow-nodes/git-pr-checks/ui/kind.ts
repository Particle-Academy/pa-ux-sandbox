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

export const GIT_PR_CHECKS_KIND = "@particle-academy/git_pr_checks";

/**
 * `git_pr_checks` — the CI gate a "merge when green" workflow routes on.
 *
 * Four ports, because `pending` is not `failing` and `none` is not `passing`.
 * Collapse them and a workflow either abandons work that was still building, or
 * merges a repository whose CI was never configured.
 */
export const gitPrChecksKind: NodeKindDefinition = {
  name: GIT_PR_CHECKS_KIND,
  aliases: ["git_pr_checks"],
  category: "logic",
  label: "Check Status",
  description: "CI state for a revision — routes on passing, failing, pending, or no checks at all.",
  icon: "✓",
  accent: "#f59e0b",
  inputs: [{ id: "in" }],
  outputs: [
    { id: "passing", label: "passing" },
    { id: "failing", label: "failing" },
    { id: "pending", label: "pending" },
    { id: "none", label: "no checks" },
  ],
  configSchema: [
    ...REPO_FIELDS,
    {
      key: "revision",
      label: "Revision",
      type: "text",
      placeholder: "a SHA or branch",
      description: "Leave empty to take it from the input — a PR's source branch will do.",
    },
  ],
  defaultConfig: { provider: "github" },
};
