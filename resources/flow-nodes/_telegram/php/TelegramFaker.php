<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Telegram;

use FancyFlow\Nodes\Connector\FakeValues;
use RuntimeException;

/**
 * Telegram's faker. Byte-identical to `../js/service.ts`'s `telegramFaker`.
 *
 * `getUpdates` returns `{ok, result: [update, …]}`, and an update is a
 * discriminated envelope — `update_id` plus exactly one of `message`,
 * `edited_message`, `callback_query`, … The faker reproduces that envelope
 * rather than a flattened convenience shape, because the envelope is what an
 * author has to branch on when the real one arrives.
 */
final class TelegramFaker
{
    /**
     * @param  array<string,mixed>  $config
     * @return array<string,mixed>
     */
    public static function respond(string $operation, array $config, FakeValues $fake, mixed $input = null): array
    {
        if ($operation !== 'get_updates') {
            throw new RuntimeException(
                "telegram: no fake response is defined for \"{$operation}\". Add one to TelegramFaker before "
                .'shipping a node that calls it.'
            );
        }

        // Order matters: the generator advances per call, so these must happen
        // in the same sequence as the JavaScript faker or the two runtimes stop
        // agreeing after the first value.
        $chatId = $fake->int(100000000, 999999999);
        $text = (string) ($config['sampleText'] ?? 'hello from the faker');
        $updateId = $fake->int(100000, 999999);
        $messageId = $fake->int(1, 9999);

        return [
            'ok' => true,
            'result' => [
                [
                    'update_id' => $updateId,
                    'message' => [
                        'message_id' => $messageId,
                        'date' => 1767225600,
                        'text' => $text,
                        'chat' => [
                            'id' => $chatId,
                            'type' => 'private',
                            'first_name' => 'Ada',
                            'username' => 'ada_example',
                        ],
                        'from' => [
                            'id' => $chatId,
                            'is_bot' => false,
                            'first_name' => 'Ada',
                            'username' => 'ada_example',
                            'language_code' => 'en',
                        ],
                    ],
                ],
            ],
        ];
    }
}
