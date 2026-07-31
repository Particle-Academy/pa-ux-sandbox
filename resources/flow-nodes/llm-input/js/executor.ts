import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";
import { pauseForHuman } from "@particle-academy/fancy-flow/engine";
import { checkFields, normalizeFields } from "./fields";
import { getLlmFormHost } from "./host";
import type { GeneratedField } from "./types";

/**
 * `llm_input` — ask a model to author the form, then pause on it.
 *
 * The builtin `user_input` node pauses on a form somebody wrote at design time.
 * That is the right node whenever the questions are known in advance, and most
 * of the time they are. This one is for when they are not: a triage step whose
 * questions depend on the ticket, an onboarding form shaped by what the run
 * already discovered, a follow-up that only asks for what is actually missing.
 *
 * The pause detail is deliberately the SAME shape `user_input` emits, so a host
 * that already renders one renders this with nothing new wired — the generated
 * form is a form, not a new kind of wait.
 */
export const llmInputExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const host = getLlmFormHost();

  if (!host) {
    // Refuse rather than fall back to an empty form. A run that pauses on
    // nothing looks identical to one waiting for a person who never comes.
    throw new Error(
      "llm_input: no form host registered. Call registerLlmFormHost() with your provider adapter — " +
        "this node ships the form contract and the pause, not the model call.",
    );
  }

  const purpose = String(config.purpose ?? "").trim();
  if (!purpose) throw new Error("llm_input: needs a `purpose` — what the form is for.");

  const requiredKeys = toKeys(config.requiredKeys);
  const maxFields = config.maxFields === undefined ? undefined : Number(config.maxFields);

  ctx.emit({ type: "log", level: "info", nodeId: ctx.node.id, message: `Generating a form: ${purpose}` });

  const result = await host.generate({
    purpose,
    // The run's own data. A form generated blind asks for what the run already
    // knows, which is what makes a dynamic form worse than a static one.
    context: config.includeContext === false ? undefined : ctx.inputs,
    requiredKeys,
    maxFields,
    provider: config.provider === undefined ? undefined : String(config.provider),
    model: config.model === undefined ? undefined : String(config.model),
    credential: config.credential === undefined ? undefined : String(config.credential),
  });

  const problems = checkFields(result?.fields, requiredKeys, maxFields);
  if (problems.length > 0) {
    throw new Error(`llm_input: the generated form is not usable — ${problems.join("; ")}.`);
  }

  const fields = normalizeFields(result.fields as GeneratedField[]);

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: `Pausing on ${fields.length} generated field${fields.length === 1 ? "" : "s"}`,
  });

  // Never returns. The engine records the pause, the durable runner parks the
  // run, and the submitted values arrive as this node's output on resume.
  return pauseForHuman(ctx, "input", {
    title: String(config.title ?? result.title ?? "Need your input"),
    fields,
    /** Marks the form as generated, so a UI can say so rather than implying a person wrote it. */
    generated: true,
  });
};

function toKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((v) => v.trim()).filter(Boolean);

  return [];
}
