import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";

/** Repository fields every git-pr-* node shares. Duplicated per node so a
 *  vendored node stays self-contained and editable in place. */
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
    description: "Which host. The node is provider-neutral; the contract is the same on all three.",
  },
  { key: "owner", label: "Owner", type: "text" as const, placeholder: "Particle-Academy" },
  { key: "repo", label: "Repository", type: "text" as const, placeholder: "fancy-flow" },
];

export const GIT_PR_OPEN_KIND = "@particle-academy/git_pr_open";

/**
 * `git_pr_open` — open a pull request.
 *
 * The only node in the set that changes anything, and the reason the family
 * declares `unsafe-to-replay`: a durable run retrying after a network blip
 * would open a second PR for the same branch.
 */
export const gitPrOpenKind: NodeKindDefinition = {
  name: GIT_PR_OPEN_KIND,
  aliases: ["git_pr_open"],
  category: "io",
  label: "Open Pull Request",
  description: "Open a pull request from one branch into another, on GitHub, GitLab or Bitbucket.",
  icon: "⇡",
  accent: "#22c55e",
  inputs: [{ id: "in" }],
  outputs: [{ id: "out" }],
  configSchema: [
    ...REPO_FIELDS,
    { key: "title", label: "Title", type: "text", required: true, placeholder: "Fix the merge point" },
    { key: "body", label: "Description", type: "textarea", rows: 4 },
    { key: "sourceBranch", label: "From branch", type: "text", required: true, placeholder: "feature/x" },
    { key: "targetBranch", label: "Into branch", type: "text", default: "main" },
    {
      key: "draft",
      label: "Open as draft",
      type: "switch",
      description: "Draft PRs do not notify reviewers — the right default for a bot that opens work in progress.",
    },
  ],
  defaultConfig: { provider: "github", targetBranch: "main", draft: false },
};
