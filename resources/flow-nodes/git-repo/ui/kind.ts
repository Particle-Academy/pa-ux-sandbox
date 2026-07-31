import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";

export const GIT_REPO_KIND = "@particle-academy/git_repo";

/**
 * `git_repo` — hosted repository metadata.
 *
 * Exists mainly so a graph can read the DEFAULT BRANCH instead of hardcoding
 * "main". Every git_pr_* node takes a target branch, and a hardcoded one is how
 * a workflow silently targets the wrong branch on a repo using master or trunk.
 */
export const gitRepoKind: NodeKindDefinition = {
  name: GIT_REPO_KIND,
  aliases: ["git_repo"],
  category: "io",
  label: "Repository",
  description: "Hosted repository metadata — default branch, visibility, URLs.",
  icon: "◈",
  accent: "#6e5494",
  inputs: [{ id: "in" }],
  outputs: [{ id: "out" }],
  configSchema: [
    {
      key: "provider",
      label: "Provider",
      type: "select",
      options: [
        { value: "github", label: "GitHub" },
        { value: "gitlab", label: "GitLab" },
        { value: "bitbucket", label: "Bitbucket" },
      ],
      default: "github",
    },
    { key: "owner", label: "Owner", type: "text", placeholder: "Particle-Academy" },
    { key: "repo", label: "Repository", type: "text", placeholder: "fancy-flow" },
  ],
  defaultConfig: { provider: "github" },};
