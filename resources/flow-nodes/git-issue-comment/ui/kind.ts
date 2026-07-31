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

export const GIT_ISSUE_COMMENT_KIND = "@particle-academy/git_issue_comment";

/**
 * git_issue_comment — Post a comment on an issue.
 *
 * Issue tracking is an OPTIONAL provider capability, so this node fails loudly
 * on a host whose provider has none rather than silently doing nothing.
 */
export const gitIssueCommentKind: NodeKindDefinition = {
  name: GIT_ISSUE_COMMENT_KIND,
  aliases: ["git_issue_comment"],
  category: "io",
  label: "Comment on Issue",
  description: "Post a comment on an issue.",
  icon: "✉",
  accent: "#8b5cf6",
  inputs: [{ id: "in" }],
  outputs: [{"id":"out"}],
  configSchema: [
    ...REPO_FIELDS,
    {"key":"number","label":"Issue number","type":"number","min":1},
    {"key":"body","label":"Comment","type":"textarea","placeholder":"What to say."},
  ],
  defaultConfig: { provider: "github" },
};
