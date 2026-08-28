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

export const GIT_ISSUE_UPDATE_KIND = "@particle-academy/git_issue_update";

/**
 * git_issue_update — Change an issue's title, body, state or labels.
 *
 * Issue tracking is an OPTIONAL provider capability, so this node fails loudly
 * on a host whose provider has none rather than silently doing nothing.
 */
export const gitIssueUpdateKind: NodeKindDefinition = {
  name: GIT_ISSUE_UPDATE_KIND,
  aliases: ["git_issue_update"],
  sideEffects: "idempotent",
  category: "io",
  label: "Update Issue",
  description: "Change an issue's title, body, state or labels.",
  icon: "✎",
  accent: "#8b5cf6",
  inputs: [{ id: "in" }],
  outputs: [{"id":"out"}],
  outputShape: [
    { path: "id", type: "string", description: "id returned by this node." },
    { path: "number", type: "number", description: "number returned by this node." },
    { path: "title", type: "string", description: "title returned by this node." },
    { path: "state", type: "string", description: "state returned by this node." },
    { path: "webUrl", type: "string", description: "webUrl returned by this node." },
    { path: "author", type: "string", description: "author returned by this node." },
    { path: "labels", type: "array", description: "labels returned by this node." },
    { path: "assignees", type: "array", description: "assignees returned by this node." },
  ],
  configSchema: [
    ...REPO_FIELDS,
    {"key":"number","label":"Issue number","type":"number","min":1},
    {"key":"title","label":"Title","type":"text","placeholder":"(leave empty to keep)"},
    {"key":"body","label":"Body","type":"textarea","placeholder":"(leave empty to keep)"},
    {"key":"state","label":"State","type":"select","options":[{"value":"","label":"(keep)"},{"value":"open","label":"Open"},{"value":"closed","label":"Closed"}],"default":""},
    {"key":"labels","label":"Labels","type":"text","placeholder":"(leave empty to keep)"},
  ],
  defaultConfig: { provider: "github" },
};
