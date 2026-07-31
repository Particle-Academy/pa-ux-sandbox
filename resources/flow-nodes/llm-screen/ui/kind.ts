import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";

export const LLM_SCREEN_KIND = "@particle-academy/llm_screen";

/**
 * `llm_screen` — a whole interface, generated.
 *
 * `llm_input` covers the case where a step needs answers. This covers the case
 * where it needs to SHOW something whose shape depends on what the run found: a
 * summary, a comparison, a dashboard over whatever came back. fancy-screens
 * renders it; the node decides what to render and refuses a schema that would
 * come out as a placeholder.
 */
export const llmScreenKind: NodeKindDefinition = {
  name: LLM_SCREEN_KIND,
  aliases: ["llm_screen"],
  category: "io",
  label: "AI Screen",
  description: "Let a model build the interface this step shows, from the components the host registered.",
  icon: "▦",
  accent: "#8b5cf6",
  inputs: [{ id: "in" }],
  outputs: [{ id: "out", label: "schema" }],
  configSchema: [
    {
      key: "purpose",
      label: "What the interface is for",
      type: "textarea",
      rows: 3,
      required: true,
      placeholder: "Show the deploy result: which services moved, which failed, and what to do next.",
      description: "Written for the model. It decides the layout from this and the run's own data.",
    },
    {
      key: "screenId",
      label: "Screen id",
      type: "text",
      required: true,
      placeholder: "deploy-summary",
      description:
        "The fancy-screens id this renders into. Required rather than guessed — the registry and its store prefixes key on exactly this string.",
    },
    { key: "title", label: "Screen title", type: "text", placeholder: "Deploy summary" },
    {
      key: "includeContext",
      label: "Send the run's data to the model",
      type: "switch",
      default: true,
      description:
        "On, the interface is built around what the run actually found. Off for runs carrying data that must not reach a provider.",
    },
    {
      key: "present",
      label: "Show it",
      type: "switch",
      default: true,
      description:
        "Off returns the schema as data without putting it in front of anyone — for storing it, diffing it, or handing it to a later step.",
    },
    { key: "provider", label: "Provider", type: "text", placeholder: "anthropic" },
    { key: "model", label: "Model", type: "text", placeholder: "claude-sonnet-5" },
    {
      key: "credential",
      label: "Credential",
      type: "text",
      description: "A reference the host resolves. Never a raw key — this config is persisted with the document.",
    },
  ],
  defaultConfig: { includeContext: true, present: true },
};
