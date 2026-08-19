/**
 * Telegram — the exemplar for a trigger that is NOT a webhook, and for auth that
 * lives in the URL.
 *
 * Two things make this worth a place in the exemplar set:
 *
 * 1. **`getUpdates` long polling and `setWebhook` are mutually exclusive.** You
 *    choose one per bot, and the polling side needs a cursor the host has to
 *    persist. Nothing about that fits the "provider POSTs to you" template, and
 *    a catalogue that assumed webhooks everywhere would model this wrongly and
 *    then never fire.
 * 2. **The bot token is a PATH SEGMENT, not a header**, and the test environment
 *    is a further `/test` segment after it. So `authorize` rewrites the URL
 *    rather than adding a header, which is why the shared client hands it the
 *    resolved mode.
 *
 * There is no official Telegram SDK in any language, so calling the REST API
 * directly is the correct choice here rather than a shortcut — the alternative
 * would be a community wrapper, which is exactly the dependency the suite's
 * rules tell us not to take on a consumer's behalf.
 */

import type { ServiceDescriptor } from "../../_connector/js/client";
import type { ConnectorFaker } from "../../_connector/js/faker";

const API = "https://api.telegram.org";

/**
 * Telegram's faker.
 *
 * `getUpdates` returns `{ ok, result: [update, …] }`, and an update is a
 * discriminated envelope — `update_id` plus exactly one of `message`,
 * `edited_message`, `callback_query`, … The faker reproduces that envelope
 * rather than a flattened convenience shape, because the envelope is what an
 * author has to branch on when the real one arrives.
 */
export const telegramFaker: ConnectorFaker = (operation, request) => {
  const { fake, config } = request;

  if (operation !== "get_updates") {
    throw new Error(
      `telegram: no fake response is defined for "${operation}". Add one to telegramFaker before ` +
        "shipping a node that calls it.",
    );
  }

  const chatId = fake.int(100000000, 999999999);
  const text = String(config.sampleText ?? "hello from the faker");

  return {
    ok: true,
    result: [
      {
        update_id: fake.int(100000, 999999),
        message: {
          message_id: fake.int(1, 9999),
          date: 1767225600,
          text,
          chat: { id: chatId, type: "private", first_name: "Ada", username: "ada_example" },
          from: {
            id: chatId,
            is_bot: false,
            first_name: "Ada",
            username: "ada_example",
            language_code: "en",
          },
        },
      },
    ],
  };
};

export const TELEGRAM: ServiceDescriptor = {
  service: "telegram",
  title: "Telegram",
  // A genuinely separate account: you create one inside the test environment
  // and register a new bot there. The `/test` segment is how you reach it, but
  // the account is what makes it separate — and its flood limits are NOT
  // relaxed, so it is not a free-for-all.
  sandbox: "separate-account",
  baseUrls: { live: API, sandbox: API },
  requires: ["botToken"],
  /**
   * The token is a path segment, so this rewrites the URL instead of setting a
   * header — and the `/test` segment for the test environment goes AFTER the
   * token, which is why the mode is needed here.
   *
   * The token therefore ends up in the request URL, where access logs and error
   * reporters will happily record it. That is Telegram's design, not ours; a
   * host should keep it out of its own logging.
   */
  authorize: (credentials, request, mode) => {
    const url = new URL(request.url);
    const segment = mode === "sandbox" ? `/bot${credentials.botToken}/test` : `/bot${credentials.botToken}`;
    url.pathname = `${segment}${url.pathname}`;
    request.url = url.toString();
  },
  faker: telegramFaker,
};
