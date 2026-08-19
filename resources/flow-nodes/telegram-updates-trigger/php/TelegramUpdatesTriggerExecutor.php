<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\TelegramUpdatesTrigger;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Nodes\Connector\ConnectorClient;
use FancyFlow\Nodes\Telegram\Telegram;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;
use RuntimeException;

/**
 * Poll Telegram for updates. The PHP twin of `../js/executor.ts`.
 *
 * ## A poll trigger DOES call the provider
 *
 * That is what makes it different from a webhook trigger, whose executor only
 * republishes what the host already verified. Here the executor IS the fetch, so
 * the host's job is a schedule and a persisted cursor rather than a route and a
 * signature.
 */
#[FlowNode(
    name: '@particle-academy/telegram_updates_trigger',
    category: 'trigger',
    label: 'Telegram message',
    description: 'Start a run when a Telegram bot receives an update (long polling, not a webhook).',
    icon: '✈',
    inputs: [],
    outputs: [['id' => 'out', 'label' => 'updates'], ['id' => 'empty', 'label' => 'nothing new']],
    aliases: ['telegram_updates_trigger'],
    sideEffects: 'none',
)]
final class TelegramUpdatesTriggerExecutor implements NodeExecutor
{
    public function __construct(private readonly ?ConnectorClient $client = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();
        $client = $this->client ?? throw new RuntimeException(
            'telegram: no '.ConnectorClient::class.' bound. Bind one with a ConnectionHost carrying your '
            .'Telegram connection — the node has no credentials of its own and must not invent any.'
        );

        $query = ['limit' => max(1, min(100, (int) ($config['limit'] ?? 100)))];

        if (($config['offset'] ?? '') !== '' && $config['offset'] !== null) {
            $query['offset'] = (int) $config['offset'];
        }

        $allowed = array_values(array_filter(array_map(
            trim(...),
            explode(',', (string) ($config['allowedUpdates'] ?? '')),
        )));
        if ($allowed !== []) {
            $query['allowed_updates'] = json_encode($allowed);
        }

        $result = $client->call(
            Telegram::descriptor(),
            'get_updates',
            $config,
            ['method' => 'GET', 'path' => 'getUpdates', 'query' => $query],
        );

        $data = is_array($result->data) ? $result->data : [];

        // Telegram answers 200 with `{ok: false, description}` for
        // application-level failures, so an HTTP status check alone would treat
        // a rejection as success and publish an empty batch. The connector core
        // cannot know that; this is exactly the per-provider knowledge a node
        // exists to hold.
        if (($data['ok'] ?? null) === false) {
            throw new RuntimeException(
                'telegram_updates_trigger: getUpdates was rejected — '
                .(string) ($data['description'] ?? 'no reason given')
            );
        }

        $updates = is_array($data['result'] ?? null) ? array_values($data['result']) : [];
        $cursor = Telegram::nextOffset(
            $updates,
            isset($query['offset']) ? (int) $query['offset'] : null,
        );

        $value = [
            'mode' => $result->mode->value,
            'connection' => $result->connection,
            'cursor' => $cursor,
            'count' => count($updates),
            'updates' => $updates,
            'update' => $updates[0] ?? null,
        ];

        if ($updates === []) {
            // A poll that found nothing is the NORMAL case, not a failure.
            // Routing it to its own port keeps the main path meaning "something
            // happened", and still gives the host somewhere to hang cursor
            // bookkeeping.
            return Port::only('empty', $value);
        }

        $ctx->emit(RunEvent::log(
            'info',
            'telegram: '.count($updates).' update(s), next offset '.$cursor.' ('.$result->mode->value.')',
            $ctx->node->id,
        ));

        return Port::only('out', $value);
    }
}
