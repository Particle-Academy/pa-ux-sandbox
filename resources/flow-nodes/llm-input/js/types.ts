/**
 * A field in a generated form.
 *
 * Deliberately the SAME shape core's builtin `user_input` node takes in its
 * `fields` config — the whole point of this node is that a model authors that
 * list instead of a person, so the host's existing User Input modal renders the
 * result with nothing new wired. Inventing a parallel field type here would
 * mean every host that already renders a pause has to learn a second one.
 */
export type GeneratedField = {
  /** Key the submitted value lands under. */
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "switch";
  required?: boolean;
  placeholder?: string;
  description?: string;
  /** For `select` only. */
  options?: { value: string; label: string }[];
};

/** What the node asks a model for. */
export type LlmFormRequest = {
  /** What the form is FOR, in the author's words. */
  purpose: string;
  /**
   * The run's data at this point, for the model to ground the form in.
   *
   * Passed as-is. A form generated blind asks for things the run already knows,
   * which is the failure mode that makes a dynamic form worse than a static one.
   */
  context?: unknown;
  /**
   * Keys the form MUST end up containing.
   *
   * The node validates these after generation rather than trusting the prompt:
   * a downstream node reading `values.email` breaks silently if the model
   * decided to call it `emailAddress`, and the run still reports success.
   */
  requiredKeys?: string[];
  /** Upper bound on fields, so a vague purpose cannot produce a 40-field wall. */
  maxFields?: number;
  provider?: string;
  model?: string;
  /** Host-resolved credential reference, never a raw key. */
  credential?: string;
};

export type LlmFormResult = {
  fields: GeneratedField[];
  /** Optional heading for the form, if the model wrote one. */
  title?: string;
};

/**
 * The seam between this node and whatever asks the model.
 *
 * Core's `LlmClient` is deliberately narrow — `chooseRoute` and nothing else —
 * and a package cannot extend core's capability union, so this node owns its
 * own contract in the same shape: one method, registered by the host, with no
 * provider SDK anywhere in the node's source.
 *
 * ```ts
 * registerLlmFormHost({
 *   generate: async (req) => ({ fields: await myModel.json(FORM_SCHEMA, req) }),
 * });
 * ```
 */
export type LlmFormHost = {
  generate: (request: LlmFormRequest) => Promise<LlmFormResult> | LlmFormResult;
};
