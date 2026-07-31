import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";
import { createDomUiEffectHost } from "./dom";
import { getUiEffectHost } from "./host";
import type { UiEffect, UiEffectOp } from "./types";

const OPS: readonly UiEffectOp[] = [
  "add-class",
  "remove-class",
  "toggle-class",
  "replace-class",
  "set-var",
  "set-style",
];

/**
 * Resolve the node's config into a {@link UiEffect} and hand it to the host.
 *
 * ## Why this fails instead of no-opping
 *
 * The tempting implementation checks for a DOM, shrugs when there isn't one,
 * and returns. Then a workflow that "pulses the card" runs on a queue worker,
 * styles nothing, and reports `ok: true`. Nothing throws, nothing is logged,
 * and the run list says success — the same silent-success failure trigger
 * cohorts exist to prevent. So: no host and no document is an ERROR.
 *
 * A browser gets the DOM host for free, because making the common case need
 * zero setup is worth more than the symmetry of always requiring registration.
 */
export const uiEffectExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;

  const op = String(config.op ?? "add-class") as UiEffectOp;
  if (!OPS.includes(op)) {
    throw new Error(`ui_effect: unknown op "${op}". Expected one of ${OPS.join(", ")}.`);
  }

  const effect: UiEffect = {
    target: String(config.target ?? "page").trim() || "page",
    op,
    value: String(config.value ?? ""),
    // Always a string, never absent. An omitted `name` and an empty one mean
    // the same thing to every op, and a payload whose shape depends on which
    // fields the author happened to fill in is one a consumer has to guard.
    name: String(config.name ?? ""),
    durationMs: Number(config.durationMs ?? 0) || 0,
  };

  if (!effect.value && op !== "remove-class") {
    throw new Error(`ui_effect: "${op}" needs a value.`);
  }

  // Config validation belongs to the node, not the host: caught here it is the
  // same error on every runtime and every host, rather than whatever the DOM
  // happens to say. (The DOM host re-checks anyway — cheap, and it is reachable
  // directly.)
  if ((op === "set-var" || op === "set-style" || op === "replace-class") && !effect.name?.trim()) {
    throw new Error(
      op === "replace-class"
        ? 'ui_effect: "replace-class" needs `name` — the class being replaced.'
        : `ui_effect: "${op}" needs \`name\` — the ${op === "set-var" ? "custom property, e.g. --fa-accent" : "CSS property, e.g. box-shadow"}.`,
    );
  }

  const host = getUiEffectHost() ?? (typeof document !== "undefined" ? createDomUiEffectHost() : null);
  if (!host) {
    throw new Error(
      "ui_effect: no UI host. In a browser this works out of the box; elsewhere call " +
        "registerUiEffectHost() with something that can reach the surface — typically a relay to the attached browser.",
    );
  }

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: `${op} on "${effect.target}"${effect.durationMs ? ` for ${effect.durationMs}ms` : ""}`,
    detail: effect,
  });

  await host.apply(effect);

  // Pass the upstream payload through alongside the effect, so this node drops
  // into the middle of a chain without severing it.
  const incoming = (ctx.inputs as any)?.in;

  return { ...(isRecord(incoming) ? incoming : {}), uiEffect: effect, applied: true };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
