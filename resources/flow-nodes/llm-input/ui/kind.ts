import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";

export const LLM_INPUT_KIND = "@particle-academy/llm_input";

/**
 * `llm_input` — a form a model writes, and a person fills in.
 *
 * Core already ships `user_input`, which pauses on a form authored at design
 * time. That is the right node whenever the questions are known in advance, and
 * usually they are. This is for when they are not: a triage step whose questions
 * depend on the ticket, a follow-up that asks only for what is still missing.
 *
 * `pausesForHuman` is declared here as well as in the manifest, because they
 * answer different questions: the manifest tells a HOST what it is installing,
 * this tells the EDITOR to draw the node as a stopping point.
 */
export const llmInputKind: NodeKindDefinition = {
  name: LLM_INPUT_KIND,
  aliases: ["llm_input"],
  pausesForHuman: "input",
  category: "human",
  label: "AI Form",
  description: "Ask a model to write the form this step pauses on, from the run's own data.",
  icon: "✦",
  accent: "#8b5cf6",
  inputs: [{ id: "in" }],
  outputs: [{ id: "out", label: "values" }],
  configSchema: [
    {
      key: "purpose",
      label: "What the form is for",
      type: "textarea",
      rows: 3,
      required: true,
      placeholder: "Collect whatever is still missing before this refund can be approved.",
      description: "Written for the model, not the person filling it in — it decides which questions to ask.",
    },
    { key: "title", label: "Form title", type: "text", placeholder: "Need your input" },
    {
      key: "requiredKeys",
      label: "Keys the form must contain",
      type: "text",
      placeholder: "email, amount",
      description:
        "Checked after generation. Without this a downstream node reading `values.email` breaks silently because the model chose `emailAddress`.",
    },
    {
      key: "maxFields",
      label: "Maximum fields",
      type: "number",
      default: 8,
      description: "A vague purpose otherwise produces a wall of questions nobody finishes.",
    },
    {
      key: "includeContext",
      label: "Send the run's data to the model",
      type: "switch",
      default: true,
      description:
        "On, the form is grounded in what the run already knows. Off for runs carrying data that must not reach a provider.",
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
  defaultConfig: { maxFields: 8, includeContext: true },
};
