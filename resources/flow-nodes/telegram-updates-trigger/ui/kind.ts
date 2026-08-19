import type { NodeKindDefinition, OutputField } from "@particle-academy/fancy-flow/engine";

import { defineConnectorKind, summarize } from "../../_connector/ui/connector";
import { telegramMeta } from "../../_telegram/ui/service";

export const TELEGRAM_UPDATES_TRIGGER_KIND = "@particle-academy/telegram_updates_trigger";

export const TELEGRAM_UPDATES_TRIGGER_META = telegramMeta(
  "trigger",
  "a new message",
  "https://core.telegram.org/bots/api#getupdates",
);

/**
 * The ingredients a downstream node picks from.
 *
 * These are Telegram's own paths, envelope and all. It is tempting to flatten
 * `result[0].message.text` into `text` for tidiness — and then nobody can look
 * the field up in Telegram's documentation, and the flattening has to be
 * repeated identically in every other Telegram node or the graph is
 * inconsistent with itself.
 */
export const TELEGRAM_UPDATES_OUTPUT: OutputField[] = [
  { path: "mode", type: "string", description: "Which estate this ran against: fake, sandbox or live." },
  { path: "cursor", type: "number", description: "The next `offset` to poll with. The host must persist it." },
  { path: "count", type: "number", description: "How many updates this poll returned." },
  { path: "updates", type: "array", description: "The raw update envelopes, newest last." },
  { path: "update.update_id", type: "number", description: "Id of the first update in this batch." },
  { path: "update.message.text", type: "string", description: "Message text, when the update is a message." },
  { path: "update.message.chat.id", type: "number", description: "Chat to reply into." },
  { path: "update.message.from.username", type: "string", description: "Who sent it." },
];

/**
 * telegram_updates_trigger — start a run when a Telegram bot receives something.
 *
 * ## The exemplar for a trigger that is NOT a webhook
 *
 * Telegram offers `getUpdates` long polling OR `setWebhook`, never both for one
 * bot. This node models the polling side, so the host's obligation is a
 * schedule and a persisted cursor rather than a route and a signature.
 *
 * The node publishes the whole batch AND the first update, because both are
 * genuinely wanted: `updates` for a `for_each`, `update` for the common case of
 * one message at a time. Publishing only the batch would make the simple graph
 * carry a loop it does not need.
 */
export const telegramUpdatesTriggerKind: NodeKindDefinition = defineConnectorKind(
  TELEGRAM_UPDATES_TRIGGER_META,
  {
    name: TELEGRAM_UPDATES_TRIGGER_KIND,
    aliases: ["telegram_updates_trigger"],
    category: "trigger",
    label: "Telegram message",
    description: "Start a run when a Telegram bot receives an update (long polling, not a webhook).",
    icon: "✈",
    inputs: [],
    outputs: [
      { id: "out", label: "updates" },
      { id: "empty", label: "nothing new" },
    ],
    sideEffects: "none",
    outputShape: TELEGRAM_UPDATES_OUTPUT,
    configSchema: [
      {
        type: "number",
        key: "offset",
        label: "Offset",
        min: 0,
        description:
          "The first update id NOT yet handled. The HOST persists this between polls and passes the " +
          "last `cursor` back in — Telegram queues nothing once an offset has acknowledged it.",
      },
      {
        type: "number",
        key: "limit",
        label: "Limit",
        min: 1,
        max: 100,
        default: 100,
        description: "Updates per poll. Telegram's maximum is 100.",
      },
      {
        type: "text",
        key: "allowedUpdates",
        label: "Update types",
        placeholder: "message, callback_query",
        description:
          "Comma separated. Blank means every type except chat_member ones, which Telegram requires " +
          "you to ask for explicitly.",
      },
      {
        type: "text",
        key: "sampleText",
        label: "Sample message (fake mode)",
        default: "hello from the faker",
        description: "What the faked update says, so you can wire the downstream nodes before any bot exists.",
      },
    ],
    defaultConfig: { mode: "auto", limit: 100, sampleText: "hello from the faker" },
    renderBody: ({ config }) =>
      summarize(TELEGRAM_UPDATES_TRIGGER_META, config as Record<string, unknown>, "a new message"),
  },
);
