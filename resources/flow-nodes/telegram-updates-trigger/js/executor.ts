import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";

import { callConnector } from "../../_connector/js/client";
import { TELEGRAM } from "../../_telegram/js/service";
import { nextOffset } from "../../_telegram/js/trigger";

type TelegramUpdate = { update_id?: number };

/**
 * Poll Telegram for updates.
 *
 * ## A poll trigger DOES call the provider
 *
 * That is what makes it different from a webhook trigger, whose executor only
 * republishes what the host already verified. Here the executor is the fetch, so
 * the host's job is a schedule and a persisted cursor rather than a route.
 *
 * In `fake` mode the call resolves to the faker, so the node is runnable on a
 * canvas before a bot exists — with the same envelope a real poll returns.
 */
export const telegramUpdatesTriggerExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;

  const result = await callConnector<{ ok?: boolean; result?: TelegramUpdate[]; description?: string }>(
    TELEGRAM,
    {
      operation: "get_updates",
      config,
      request: {
        method: "GET",
        path: "getUpdates",
        query: {
          ...(config.offset === undefined || config.offset === null || config.offset === ""
            ? {}
            : { offset: Number(config.offset) }),
          limit: Math.min(100, Math.max(1, Number(config.limit ?? 100))),
          ...(typeof config.allowedUpdates === "string" && config.allowedUpdates.trim() !== ""
            ? { allowed_updates: JSON.stringify(list(config.allowedUpdates)) }
            : {}),
        },
      },
    },
  );

  // Telegram answers 200 with `{ok: false, description}` for application-level
  // failures, so an HTTP status check alone would treat a rejection as success
  // and publish an empty batch. The connector core cannot know that; this is
  // exactly the per-provider knowledge a node exists to hold.
  if (result.data?.ok === false) {
    throw new Error(
      `telegram_updates_trigger: getUpdates was rejected — ${result.data.description ?? "no reason given"}`,
    );
  }

  const updates = Array.isArray(result.data?.result) ? result.data.result : [];
  const cursor = nextOffset(updates, config.offset === undefined ? undefined : Number(config.offset));

  const value = {
    mode: result.mode,
    connection: result.connection,
    cursor,
    count: updates.length,
    updates,
    update: updates[0] ?? null,
  };

  if (updates.length === 0) {
    // A poll that found nothing is the NORMAL case, not a failure. Routing it
    // to its own port keeps the main path meaning "something happened" — and
    // still gives the host somewhere to hang cursor bookkeeping.
    return { __port: "empty", value };
  }

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: `telegram: ${updates.length} update(s), next offset ${cursor} (${result.mode})`,
  });

  return { __port: "out", value };
};

function list(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
