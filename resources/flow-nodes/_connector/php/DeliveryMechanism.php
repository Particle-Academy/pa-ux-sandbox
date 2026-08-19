<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * How a connector trigger learns that something happened.
 *
 * **Not every provider pushes, and assuming webhooks is the single most common
 * way a connector catalogue ends up lying.** Google Drive and Microsoft Graph
 * want a subscription you must renew before it expires. Salesforce wants a
 * Pub/Sub or CometD stream. S3 wants an event notification routed to
 * infrastructure the consumer provisions. Telegram and Reddit want you to poll.
 * Each is a different obligation on the host, and a node declaring "webhook" for
 * all of them would install cleanly and then never fire.
 *
 * So a trigger declares its mechanism, and a host can refuse to mount one it has
 * no machinery for — at author time, not at 3am.
 */
enum DeliveryMechanism: string
{
    /** The provider POSTs to a URL you own. Verify the signature. */
    case Webhook = 'webhook';

    /**
     * A webhook that EXPIRES.
     *
     * Distinct from `Webhook` precisely because the ongoing duty is invisible:
     * somebody has to renew it, forever, and if nobody does the workflow stops
     * firing with no error anywhere.
     */
    case Subscription = 'subscription';

    /** You ask, on a schedule, and track a cursor. */
    case Poll = 'poll';

    /** The provider publishes to a broker the consumer must provision. */
    case PubSub = 'pubsub';

    /** A long-lived connection the host maintains (websocket, gRPC, SSE, CometD). */
    case Stream = 'stream';
}
