import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";
import { getLlmScreenHost } from "./host";
import { checkSchema } from "./schema";
import type { ScreenSchema } from "./types";

/**
 * `llm_screen` — let a model build whatever interface the step needs.
 *
 * fancy-screens already renders a JSON page description: `<Screen schema={…}>`
 * maps each `type` through a component registry the host fills. That surface
 * was built for exactly this and had no workflow node reaching it — so a
 * workflow could pause on a form, and could not put up a dashboard, a summary,
 * a comparison, or anything else whose shape depends on what the run found.
 *
 * The node contributes the parts that are not fancy-screens' job: telling the
 * model which components actually exist, and refusing a schema that names one
 * that does not. Without the second, an unknown name renders as fancy-screens'
 * orange placeholder and the run still reports success — an error message
 * delivered to a person, with a green row in the run list.
 */
export const llmScreenExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const host = getLlmScreenHost();

  if (!host) {
    throw new Error(
      "llm_screen: no screen host registered. Call registerLlmScreenHost() with your provider adapter and " +
        "your fancy-screens registry — this node ships the contract and the checks, not the model call.",
    );
  }

  const purpose = String(config.purpose ?? "").trim();
  if (!purpose) throw new Error("llm_screen: needs a `purpose` — what the interface is for.");

  const screenId = String(config.screenId ?? "").trim();
  if (!screenId) {
    // Required rather than defaulted. A generated screen with a guessed id
    // collides with whatever else claimed that id, and fancy-screens keys its
    // registry — and its store prefixes — on exactly this string.
    throw new Error("llm_screen: needs a `screenId` — the fancy-screens id this renders into.");
  }

  const components = host.components();

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: `Generating a screen for "${screenId}" from ${components.length} registered component${components.length === 1 ? "" : "s"}`,
  });

  const result = await host.generate({
    purpose,
    components,
    context: config.includeContext === false ? undefined : ctx.inputs,
    provider: config.provider === undefined ? undefined : String(config.provider),
    model: config.model === undefined ? undefined : String(config.model),
    credential: config.credential === undefined ? undefined : String(config.credential),
  });

  const problems = checkSchema(result?.schema, components);
  if (problems.length > 0) {
    throw new Error(`llm_screen: the generated screen will not render — ${problems.join("; ")}.`);
  }

  const schema = result.schema as ScreenSchema;
  const title = config.title === undefined ? result.title : String(config.title);

  // Presenting is optional: a workflow may want the schema as data — to store,
  // diff, or hand to a later step — and forcing a presentation step would make
  // that impossible.
  if (config.present !== false && host.present) {
    await host.present({ screenId, title, schema });
  }

  return { screenId, title, schema };
};
