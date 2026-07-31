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

export const GIT_ISSUE_OPEN_KIND = "@particle-academy/git_issue_open";

/**
 * git_issue_open — File an issue on GitHub, GitLab or Bitbucket.
 *
 * Issue tracking is an OPTIONAL provider capability, so this node fails loudly
 * on a host whose provider has none rather than silently doing nothing.
 */
export const gitIssueOpenKind: NodeKindDefinition = {
  name: GIT_ISSUE_OPEN_KIND,
  aliases: ["git_issue_open"],
  category: "io",
  label: "Open Issue",
  description: "File an issue on GitHub, GitLab or Bitbucket.",
  icon: "◎",
  accent: "#8b5cf6",
  inputs: [{ id: "in" }],
  outputs: [{"id":"out"}],
  configSchema: [
    ...REPO_FIELDS,
    {"key":"title","label":"Title","type":"text","placeholder":"Something is broken"},
    {"key":"body","label":"Body","type":"textarea","placeholder":"What happened, and how to reproduce it."},
    {"key":"labels","label":"Labels","type":"text","placeholder":"bug, p1 — comma separated"},
    {"key":"assignees","label":"Assignees","type":"text","placeholder":"ada, grace — comma separated"},
  ],
  defaultConfig: { provider: "github" },
};
