import type { NodeKindDefinition, OutputField } from "@particle-academy/fancy-flow/engine";

import { defineConnectorKind, summarize } from "../../_connector/ui/connector";
import { resendMeta } from "../../_resend/ui/service";

export const RESEND_EMAIL_SEND_KIND = "@particle-academy/resend_email_send";

export const RESEND_EMAIL_SEND_META = resendMeta(
  "action",
  "send an email",
  "https://resend.com/docs/api-reference/emails/send-email",
);

export const RESEND_EMAIL_SEND_OUTPUT: OutputField[] = [
  { path: "mode", type: "string", description: "Which estate this ran against: fake or live." },
  { path: "connection", type: "string", description: "The connection id that was used." },
  { path: "data.id", type: "string", description: "Resend's id for the email. Use it to look the send up." },
  { path: "data.to", type: "array", description: "The recipients it was sent to." },
  { path: "data.subject", type: "string", description: "The subject line as sent." },
];

/**
 * resend_email_send — send an email.
 *
 * ## The exemplar for "no sandbox"
 *
 * Resend has no test estate, so this node's `mode` field offers only `fake` and
 * `live`. On a local project with no connection configured it resolves to
 * `fake`, which means a consumer can drop it on a canvas and run it before
 * signing up for anything — the difference between a marketplace you can try
 * and one you can only read about.
 *
 * `idempotent` rather than `unsafe-to-replay`: Resend accepts an idempotency
 * key, but this node does not send one unless the host supplies a run identity
 * (see `_connector/js/idempotency.ts`). Without a key a retry sends a second
 * email — annoying, not dangerous, and recoverable — which is what separates
 * this from a payment.
 */
export const resendEmailSendKind: NodeKindDefinition = defineConnectorKind(RESEND_EMAIL_SEND_META, {
  name: RESEND_EMAIL_SEND_KIND,
  aliases: ["resend_email_send"],
  label: "Send email",
  description: "Send an email through Resend.",
  icon: "✉",
  inputs: [{ id: "in" }],
  outputs: [{ id: "out" }],
  sideEffects: "idempotent",
  outputShape: RESEND_EMAIL_SEND_OUTPUT,
  configSchema: [
    {
      type: "text",
      key: "from",
      label: "From",
      placeholder: "Team <team@yourdomain.com>",
      description: "Must be an address on a domain you have verified with Resend.",
      required: true,
    },
    {
      type: "expression",
      key: "to",
      label: "To",
      example: "{{ $json.email }}",
      description:
        "One address, a comma-separated list, or an expression. Resend's simulator addresses " +
        "(delivered@resend.dev, bounced@resend.dev) are LIVE sends that are billed and counted — " +
        "they are not a sandbox.",
      required: true,
    },
    { type: "expression", key: "subject", label: "Subject", example: "Your order {{ $json.order_id }}" },
    { type: "textarea", key: "html", label: "HTML body", rows: 6 },
    { type: "textarea", key: "text", label: "Plain-text body", rows: 4 },
    { type: "text", key: "replyTo", label: "Reply-To", placeholder: "support@yourdomain.com" },
  ],
  defaultConfig: { mode: "auto" },
  renderBody: ({ config }) =>
    summarize(
      RESEND_EMAIL_SEND_META,
      config as Record<string, unknown>,
      `email ${String((config as any)?.to ?? "").trim() || "someone"}`,
    ),
});
