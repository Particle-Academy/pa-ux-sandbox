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

export const GIT_ISSUE_LIST_KIND = "@particle-academy/git_issue_list";

/**
 * git_issue_list — List a repository's issues, branching on whether any matched.
 *
 * Issue tracking is an OPTIONAL provider capability, so this node fails loudly
 * on a host whose provider has none rather than silently doing nothing.
 */
export const gitIssueListKind: NodeKindDefinition = {
  name: GIT_ISSUE_LIST_KIND,
  aliases: ["git_issue_list"],
  category: "io",
  label: "List Issues",
  description: "List a repository's issues, branching on whether any matched.",
  icon: "☰",
  accent: "#8b5cf6",
  inputs: [{ id: "in" }],
  outputs: [{"id":"found","label":"found"},{"id":"none","label":"none"}],
  configSchema: [
    ...REPO_FIELDS,
    {"key":"state","label":"State","type":"select","options":[{"value":"open","label":"Open"},{"value":"closed","label":"Closed"}],"default":"open"},
    {"key":"labels","label":"Labels","type":"text","placeholder":"bug, p1 — comma separated"},
    {"key":"assignee","label":"Assignee","type":"text"},
    {"key":"limit","label":"Limit","type":"number","min":1,"max":100,"default":20},
  ],
  defaultConfig: { provider: "github" },
};
