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

export const GIT_ISSUE_GET_KIND = "@particle-academy/git_issue_get";

/**
 * git_issue_get — Read one issue — body, state, labels, assignees.
 *
 * Issue tracking is an OPTIONAL provider capability, so this node fails loudly
 * on a host whose provider has none rather than silently doing nothing.
 */
export const gitIssueGetKind: NodeKindDefinition = {
  name: GIT_ISSUE_GET_KIND,
  aliases: ["git_issue_get"],
  category: "io",
  label: "Get Issue",
  description: "Read one issue — body, state, labels, assignees.",
  icon: "◉",
  accent: "#8b5cf6",
  inputs: [{ id: "in" }],
  outputs: [{"id":"open","label":"open"},{"id":"closed","label":"closed"}],
  configSchema: [
    ...REPO_FIELDS,
    {"key":"number","label":"Issue number","type":"number","min":1},
  ],
  defaultConfig: { provider: "github" },
};
