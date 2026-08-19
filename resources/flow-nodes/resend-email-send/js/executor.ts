import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";

import { callConnector } from "../../_connector/js/client";
import { idempotencyKeyFor } from "../../_connector/js/idempotency";
import { RESEND } from "../../_resend/js/service";

/** Send an email through Resend. */
export const resendEmailSendExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;

  const from = String(config.from ?? "").trim();
  const to = recipients(config.to);

  if (from === "") {
    throw new Error('resend_email_send: needs a "from" address on a domain verified with Resend.');
  }
  if (to.length === 0) {
    throw new Error('resend_email_send: needs at least one "to" address.');
  }
  if (!config.html && !config.text) {
    // Resend rejects this too, but three frames later and in its own words. A
    // node that knows its own requirement should say so before the round trip.
    throw new Error('resend_email_send: needs an "html" or "text" body — an empty email is never intended.');
  }

  const key = idempotencyKeyFor(ctx, ctx.node.id);

  const result = await callConnector(RESEND, {
    operation: "email_send",
    config,
    input: ctx.inputs?.in,
    request: {
      method: "POST",
      path: "/emails",
      json: {
        from,
        to,
        subject: String(config.subject ?? ""),
        ...(config.html ? { html: String(config.html) } : {}),
        ...(config.text ? { text: String(config.text) } : {}),
        ...(config.replyTo ? { reply_to: String(config.replyTo) } : {}),
      },
    },
    ...(key === null ? {} : { idempotencyKey: key }),
  });

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: `resend email ${(result.data as any)?.id} to ${to.join(", ")} (${result.mode})`,
  });

  return { __port: "out", value: result };
};

/** One address, a comma-separated list, or an array — all end up a list. */
function recipients(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value !== "string") return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
