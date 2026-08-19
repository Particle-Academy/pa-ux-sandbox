<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\ResendEmailSend;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Nodes\Connector\ConnectorClient;
use FancyFlow\Nodes\Connector\Idempotency;
use FancyFlow\Nodes\Resend\Resend;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;
use InvalidArgumentException;
use RuntimeException;

/** Send an email through Resend. The PHP twin of `../js/executor.ts`. */
#[FlowNode(
    name: '@particle-academy/resend_email_send',
    category: 'io',
    label: 'Send email',
    description: 'Send an email through Resend.',
    icon: '✉',
    inputs: [['id' => 'in']],
    outputs: [['id' => 'out']],
    aliases: ['resend_email_send'],
    sideEffects: 'idempotent',
)]
final class ResendEmailSendExecutor implements NodeExecutor
{
    public function __construct(private readonly ?ConnectorClient $client = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();
        $client = $this->client ?? throw new RuntimeException(
            'resend: no '.ConnectorClient::class.' bound. Bind one with a ConnectionHost carrying your '
            .'Resend connection — the node has no credentials of its own and must not invent any.'
        );

        $from = trim((string) ($config['from'] ?? ''));
        $to = self::recipients($config['to'] ?? null);

        if ($from === '') {
            throw new InvalidArgumentException(
                'resend_email_send: needs a "from" address on a domain verified with Resend.'
            );
        }
        if ($to === []) {
            throw new InvalidArgumentException('resend_email_send: needs at least one "to" address.');
        }
        if (($config['html'] ?? '') === '' && ($config['text'] ?? '') === '') {
            // Resend rejects this too, but three frames later and in its own
            // words. A node that knows its own requirement should say so before
            // the round trip.
            throw new InvalidArgumentException(
                'resend_email_send: needs an "html" or "text" body — an empty email is never intended.'
            );
        }

        $json = array_filter([
            'from' => $from,
            'to' => $to,
            'subject' => (string) ($config['subject'] ?? ''),
            'html' => (string) ($config['html'] ?? ''),
            'text' => (string) ($config['text'] ?? ''),
            'reply_to' => (string) ($config['replyTo'] ?? ''),
        ], static fn (mixed $v): bool => $v !== '' && $v !== []);

        $result = $client->call(
            Resend::descriptor(),
            'email_send',
            $config,
            ['method' => 'POST', 'path' => '/emails', 'json' => $json],
            $ctx->input('in'),
            Idempotency::keyFor($ctx, $ctx->node->id),
        );

        $ctx->emit(RunEvent::log(
            'info',
            'resend email '.($result->data['id'] ?? '?').' to '.implode(', ', $to).' ('.$result->mode->value.')',
            $ctx->node->id,
        ));

        return Port::only('out', $result->toArray());
    }

    /**
     * One address, a comma-separated list, or an array — all end up a list.
     *
     * @return list<string>
     */
    private static function recipients(mixed $value): array
    {
        if (is_array($value)) {
            return array_values(array_filter(array_map(trim(...), array_map(strval(...), $value))));
        }

        if (! is_string($value)) {
            return [];
        }

        return array_values(array_filter(array_map(trim(...), explode(',', $value))));
    }
}
