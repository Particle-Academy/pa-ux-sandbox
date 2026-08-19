<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\StripeWebhookTrigger;

use FancyFlow\Attributes\FlowNode;
use FancyFlow\Contracts\NodeExecutor;
use FancyFlow\Nodes\Connector\ConnectionHost;
use FancyFlow\Nodes\Connector\SandboxKind;
use FancyFlow\Nodes\Connector\TriggerEvent;
use FancyFlow\Nodes\Stripe\StripeEventFaker;
use FancyFlow\Nodes\Stripe\StripeTrigger;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\Port;
use FancyFlow\Runtime\RunEvent;

/**
 * Publish the Stripe event that started this run.
 *
 * ## A trigger executor does not receive the webhook
 *
 * The HOST does. It owns the route, verifies the signature
 * ({@see StripeTrigger::verifyDelivery}), and injects the verified event on this
 * node's `in` port before starting the run. By the time this executes the
 * delivery is already trusted — which is why there is no verification here and
 * must not be: a check that runs after the graph has started is a check that has
 * already failed.
 *
 * In `fake` mode there is no host and no delivery, so the trigger emits its own
 * sample event. That is what makes the node runnable on a canvas the moment it
 * is vendored, carrying the same field names a real delivery does.
 */
#[FlowNode(
    name: '@particle-academy/stripe_webhook_trigger',
    category: 'trigger',
    label: 'Stripe event',
    description: 'Start a run when Stripe reports an event (verified webhook delivery).',
    icon: '⚡',
    inputs: [],
    outputs: [['id' => 'out', 'label' => 'event'], ['id' => 'ignored', 'label' => 'filtered out']],
    aliases: ['stripe_webhook_trigger'],
    sideEffects: 'none',
)]
final class StripeWebhookTriggerExecutor implements NodeExecutor
{
    public function __construct(private readonly ?ConnectionHost $connections = null) {}

    public function execute(ExecutionContext $ctx): mixed
    {
        $config = $ctx->config();

        // An unconfigured host still resolves — to `fake`. That is deliberate:
        // a freshly vendored trigger has to be runnable before anything is
        // wired, or the marketplace is something you can only read about.
        $host = $this->connections ?? new ConnectionHost;
        $connection = $host->resolve(
            'stripe',
            'webhook',
            $config,
            SandboxKind::Credential,
            // A trigger authenticates DELIVERIES, not outbound calls, so the
            // secret it needs is the endpoint's signing secret, not the API key.
            ['webhookSecret'],
        );

        $event = TriggerEvent::resolve(
            'stripe',
            'webhook',
            StripeTrigger::DELIVERY,
            StripeTrigger::SETUP,
            StripeEventFaker::respond(...),
            $connection,
            $ctx->input('in'),
            $config,
        );

        $wanted = array_values(array_filter(array_map(
            trim(...),
            explode(',', (string) ($config['eventTypes'] ?? '')),
        )));
        $type = is_array($event) ? (string) ($event['type'] ?? '') : '';

        if ($wanted !== [] && $type !== '' && ! in_array($type, $wanted, true)) {
            // Settle WITHOUT activating the main port: the delivery was
            // legitimate, it just is not one this workflow acts on. Throwing
            // would turn Stripe's normal fan-out of event types into a wall of
            // failed runs, and every one of them would look like an incident.
            $ctx->emit(RunEvent::log(
                'info',
                "stripe_webhook_trigger: ignoring {$type} — not in the configured event types",
                $ctx->node->id,
            ));

            return Port::only('ignored', $event);
        }

        return Port::only('out', $event);
    }
}
