/**
 * Telegram's POLL trigger.
 *
 * The obligation this puts on a host is different in kind from a webhook's, and
 * that is exactly why `DeliveryMechanism` exists as a declaration rather than an
 * assumption:
 *
 * - **Someone must ask, on a schedule.** No provider push means no provider
 *   retry — if the poller stops, events are not queued anywhere, they are simply
 *   never seen.
 * - **A cursor must be persisted.** Telegram's `offset` acknowledges everything
 *   below it; send the wrong one and you either replay updates or lose them.
 * - **`getUpdates` and `setWebhook` are mutually exclusive per bot.** A host
 *   running both gets neither.
 *
 * None of that is visible from "this node has a trigger", so the descriptor
 * says it out loud and the editor and MCP surface it.
 */

import type { TriggerDescriptor } from "../../_connector/js/trigger";
import { telegramFaker } from "./service";

export const TELEGRAM_UPDATES_TRIGGER: TriggerDescriptor = {
  service: "telegram",
  operation: "get_updates",
  delivery: "poll",
  setup:
    "The host polls getUpdates on a schedule and persists the `offset` cursor between calls — Telegram " +
    "queues nothing once you have acknowledged it. getUpdates and setWebhook are mutually exclusive for a " +
    "bot, so do not also register a webhook for the same token.",
  // Telegram's own guidance is a long-poll with a timeout rather than a tight
  // loop; a second is the floor a host should respect between calls.
  minPollSeconds: 1,
  faker: telegramFaker,
};

/**
 * The next cursor, given the updates just received.
 *
 * `offset` is "the first update I have NOT handled", so it is the highest
 * `update_id` seen plus one. Off by one in either direction is a real bug with
 * no error attached: too low replays updates forever, too high drops one
 * silently.
 */
export function nextOffset(updates: Array<{ update_id?: number }>, current?: number): number | undefined {
  const ids = updates.map((update) => update.update_id).filter((id): id is number => typeof id === "number");

  return ids.length === 0 ? current : Math.max(...ids) + 1;
}
