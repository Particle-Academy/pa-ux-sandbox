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

export const GIT_PR_COMPARE_KIND = "@particle-academy/git_pr_compare";

/**
 * `git_pr_compare` — how far ahead or behind two refs are.
 *
 * Routes on whether there is anything to merge. "0 commits ahead" is the answer
 * that most often should stop a workflow before it opens an empty PR.
 */
export const gitPrCompareKind: NodeKindDefinition = {
  name: GIT_PR_COMPARE_KIND,
  aliases: ["git_pr_compare"],
  category: "logic",
  label: "Compare Refs",
  description: "Compare two branches or SHAs — commits between them, and which way they diverge.",
  icon: "⇄",
  accent: "#a855f7",
  inputs: [{ id: "in" }],
  outputs: [
    { id: "ahead", label: "ahead" },
    { id: "same", label: "nothing to merge" },
  ],
  configSchema: [
    ...REPO_FIELDS,
    { key: "base", label: "Base", type: "text", default: "main", description: "The branch being merged INTO." },
    { key: "head", label: "Head", type: "text", required: true, placeholder: "feature/x" },
  ],
  defaultConfig: { provider: "github", base: "main" },
};
