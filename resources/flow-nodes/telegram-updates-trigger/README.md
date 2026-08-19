# @particle-academy/telegram_updates_trigger

Start a run when a Telegram bot receives an update. **Long polling, not a
webhook.**

```bash
npx fancy-cli@latest add node @particle-academy/telegram_updates_trigger
```

## What the host owes this trigger

Different in kind from what a webhook trigger owes, which is why the manifest
declares `delivery: "poll"` rather than leaving it implied:

- **Someone must ask, on a schedule.** No provider push means no provider retry —
  if the poller stops, events are not queued anywhere, they are never seen.
- **A cursor must be persisted.** `offset` acknowledges everything below it. Pass
  the node's `cursor` output back in as its `offset` next time; get it wrong and
  you either replay updates forever or lose one silently.
- **`getUpdates` and `setWebhook` are mutually exclusive for a bot.** Register
  both and you get neither.

## Two output ports

`out` when there are updates, **`empty`** when there are none. A poll that found
nothing is the normal case, not a failure, and keeping it off the main path means
`out` genuinely means "something happened".

## The test environment is a separate account

Telegram has a real, documented test environment reached with a `/test` segment
after the bot token — but you must create a **new account inside it** and register
a **new bot** there. Its flood limits are not relaxed. Hence
`sandbox: "separate-account"`.

## The token is in the URL

`https://api.telegram.org/bot<token>/getUpdates`. That is Telegram's design, not
ours, and it means the token lands in request URLs where access logs and error
reporters will record it. Keep it out of your own logging.

There is **no official Telegram SDK in any language**, so this node calls the REST
API directly rather than taking on a community wrapper.
