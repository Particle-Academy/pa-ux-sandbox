<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Telegram;

use FancyFlow\Nodes\Connector\DeliveryMechanism;
use FancyFlow\Nodes\Connector\Mode;
use FancyFlow\Nodes\Connector\PreparedRequest;
use FancyFlow\Nodes\Connector\SandboxKind;
use FancyFlow\Nodes\Connector\ServiceDescriptor;

/**
 * Telegram — the exemplar for a trigger that is NOT a webhook, and for auth that
 * lives in the URL.
 *
 * Two things earn it a place in the exemplar set:
 *
 * 1. **`getUpdates` long polling and `setWebhook` are mutually exclusive.** You
 *    pick one per bot, and the polling side needs a cursor the host persists.
 *    Nothing about that fits the "provider POSTs to you" template, and a
 *    catalogue that assumed webhooks everywhere would model it wrongly and then
 *    never fire.
 * 2. **The bot token is a PATH SEGMENT, not a header**, and the test environment
 *    is a further `/test` segment after it. So `authorize` rewrites the URL
 *    rather than adding a header, which is why the shared client hands it the
 *    resolved mode.
 *
 * There is no official Telegram SDK in any language, so calling REST directly is
 * the correct choice here rather than a shortcut — the alternative is a
 * community wrapper, which is the dependency the suite's rules tell us not to
 * take on a consumer's behalf.
 */
final class Telegram
{
    public const API = 'https://api.telegram.org';

    public const DELIVERY = DeliveryMechanism::Poll;

    public const SETUP = 'The host polls getUpdates on a schedule and persists the `offset` cursor between '
        .'calls — Telegram queues nothing once you have acknowledged it. getUpdates and setWebhook are '
        .'mutually exclusive for a bot, so do not also register a webhook for the same token.';

    public static function descriptor(): ServiceDescriptor
    {
        return new ServiceDescriptor(
            service: 'telegram',
            title: 'Telegram',
            // A genuinely separate account: you create one inside the test
            // environment and register a new bot there. The `/test` segment is
            // how you reach it, but the account is what makes it separate — and
            // its flood limits are NOT relaxed.
            sandbox: SandboxKind::SeparateAccount,
            baseUrls: [Mode::Live->value => self::API, Mode::Sandbox->value => self::API],
            requires: ['botToken'],
            authorize: static function (array $credentials, PreparedRequest $request, Mode $mode): void {
                // The token is a path segment, so this rewrites the URL instead
                // of setting a header — and `/test` goes AFTER the token, which
                // is why the mode is needed here.
                //
                // The token therefore lands in the request URL, where access
                // logs and error reporters will happily record it. That is
                // Telegram's design, not ours; a host should keep it out of its
                // own logging.
                $token = (string) ($credentials['botToken'] ?? '');
                $segment = '/bot'.$token.($mode === Mode::Sandbox ? '/test' : '');
                $parts = parse_url($request->url);
                $path = $parts['path'] ?? '/';

                $request->url = ($parts['scheme'] ?? 'https').'://'.($parts['host'] ?? '')
                    .$segment.$path
                    .(isset($parts['query']) ? '?'.$parts['query'] : '');
            },
            faker: TelegramFaker::respond(...),
        );
    }

    /**
     * The next cursor, given the updates just received.
     *
     * `offset` is "the first update I have NOT handled", so it is the highest
     * `update_id` seen plus one. Off by one in either direction is a real bug
     * with no error attached: too low replays updates forever, too high drops
     * one silently.
     *
     * @param  list<array<string,mixed>>  $updates
     */
    public static function nextOffset(array $updates, ?int $current = null): ?int
    {
        $ids = [];
        foreach ($updates as $update) {
            if (isset($update['update_id']) && is_int($update['update_id'])) {
                $ids[] = $update['update_id'];
            }
        }

        return $ids === [] ? $current : max($ids) + 1;
    }
}
